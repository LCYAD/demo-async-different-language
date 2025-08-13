# Gracefully handle missing gems
require 'faraday'
require 'async'
require 'faraday/typhoeus'  # Faraday Typhoeus adapter

class DelayController < ApplicationController
  before_action :validate_params

  def sequential
    start_time = Time.current
    results = []

    # Sequential execution - one request at a time
    @num_of_calls.times do |i|
      result = fetch_from_httpbin(@delay_secs)
      results << {
        result: result,
        request_number: i + 1
      }
    end

    total_time = ((Time.current - start_time) * 1000).to_i

    render json: {
      total_requests: @num_of_calls,
      delay_per_request: @delay_secs,
      total_time_ms: total_time,
      results: results
    }
  rescue => e
    render json: { error: "Failed to fetch from httpbin: #{e.message}" }, status: 500
  end

  # need to fix the concurrency issue here
  def parallel
    start_time = Time.current
    
    Rails.logger.info "Starting parallel execution with #{@num_of_calls} calls, callLimit: #{@call_limit}"
    
    # Use Async for concurrent execution
    Async do |task|
      # Create semaphore for call limiting if specified
      semaphore = @call_limit ? Async::Semaphore.new(@call_limit) : nil
      
      Rails.logger.info "Created semaphore with limit: #{@call_limit}" if semaphore
      Rails.logger.info "About to create #{@num_of_calls} parallel tasks..."
      
      # Create all async tasks simultaneously
      tasks = Array.new(@num_of_calls) do |index|
        request_number = index + 1
        
        task.async do
          request_start = Time.current
          Rails.logger.info "Starting request #{request_number} at #{request_start}"
          
          result = if semaphore
            # Use semaphore to limit concurrency, but tasks are still created in parallel
            semaphore.acquire do
              fetch_from_httpbin(@delay_secs)
            end
          else
            # No concurrency limit - fully parallel
            fetch_from_httpbin(@delay_secs)
          end
          
          request_end = Time.current
          Rails.logger.info "Completed request #{request_number} at #{request_end}, took #{((request_end - request_start) * 1000).to_i}ms"
          
          {
            result: result,
            request_number: request_number
          }
        end
      end
      
      Rails.logger.info "Created #{tasks.length} async tasks at #{Time.current}, waiting for completion..."
      
      # Wait for all tasks to complete
      results = tasks.map(&:wait)
      total_time = ((Time.current - start_time) * 1000).to_i
      
      Rails.logger.info "All requests completed in #{total_time}ms"

      render json: {
        total_requests: @num_of_calls,
        delay_per_request: @delay_secs,
        total_time_ms: total_time,
        results: results
      }
    end
  rescue => e
    render json: { error: 'Failed to fetch from httpbin' }, status: 500
  end

  private

  def validate_params
    # Support both camelCase (to match Node.js API) and snake_case
    @delay_secs = (params[:delaySecs] || params[:delay_secs])&.to_i || 2
    @num_of_calls = (params[:numOfCalls] || params[:num_of_calls])&.to_i || 10
    @call_limit = (params[:callLimit] || params[:call_limit])&.to_i

    # Validation
    if @delay_secs < 1 || @delay_secs > 10
      render json: { error: 'delaySecs must be between 1 and 10' }, status: 400
      return
    end

    if @num_of_calls < 2 || @num_of_calls > 50
      render json: { error: 'numOfCalls must be between 2 and 50' }, status: 400
      return
    end

    if @call_limit && (@call_limit < 1 || @call_limit > 20)
      render json: { error: 'callLimit must be between 1 and 20' }, status: 400
      return
    end
  end

  # High-performance HTTP client using Typhoeus adapter
  def self.http_client
    @http_client ||= Faraday.new(
      url: 'https://httpbin.org',
      headers: { 
        'Connection' => 'keep-alive',
        'User-Agent' => 'Rails-API/1.0'
      }
    ) do |f|
      f.request :url_encoded
      f.response :json, content_type: /\bjson$/
      f.adapter :typhoeus, {
        # Typhoeus configuration for better performance
        followlocation: true,          # Correct: follow redirects
        maxredirs: 3,                  # Correct: max redirects to follow
        timeout: 30,                   # Correct: total timeout in seconds
        connecttimeout: 10,            # Correct: connection timeout in seconds
        # Connection pooling settings
        maxconnects: 50,               # Correct: max connections in pool
        # Additional performance settings
        nosignal: true,                # Disable signal handling for threads
        accept_encoding: 'gzip',       # Enable gzip compression
        verbose: false                 # Disable verbose logging
      }
    end
  end

  def fetch_from_httpbin(delay_secs)
    Rails.logger.info "Making request to httpbin with delay: #{delay_secs}"
    
    response = self.class.http_client.get("/delay/#{delay_secs}")
    
    unless response.success?
      raise "HTTP error! status: #{response.status}"
    end

    response.body
  rescue Faraday::Error => e
    raise "Network error: #{e.message}"
  rescue => e
    raise "Request failed: #{e.message}"
  end
end