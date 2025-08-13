# Rails API with Faraday + Typhoeus

A high-performance Rails 8 API that demonstrates async operations using Faraday with Typhoeus adapter, mirroring the functionality of the Node.js API.

## Prerequisites

- Ruby 3.3.5 (use `rbenv install $(cat .ruby-version)` if you have rbenv)
- Bundler
- libcurl (for Typhoeus)

## Installation

```bash
cd rails-api
bundle install
```

## Running

```bash
bundle exec rails server
```

The API will be available at `http://localhost:3000`

## Endpoints

- `GET /healthz` - Health check endpoint
- `GET /delay/sequential` - Sequential HTTP requests with delay
- `GET /delay/parallel` - Parallel HTTP requests with delay

### Query Parameters

- `delaySecs` (1-10, default: 2) - Delay in seconds for each request
- `numOfCalls` (2-50, default: 10) - Number of requests to make  
- `callLimit` (1-20, optional) - Concurrency limit for parallel requests

*Note: Both camelCase (`delaySecs`) and snake_case (`delay_secs`) parameter formats are supported for compatibility.*

## Performance Optimizations

### HTTP Client (Faraday + Typhoeus)
- **Typhoeus adapter**: Libcurl-based for maximum performance
- **Connection pooling**: Up to 50 concurrent connections
- **Keep-alive connections**: Persistent HTTP connections
- **Optimized timeouts**: 30s timeout, 10s connect timeout

### Puma Configuration
- **16 threads**: Better concurrency for async operations
- **2 worker processes**: Multi-core utilization
- **Preloaded app**: Faster memory usage

### Async Operations
- **Ruby Async gem**: True concurrency with fibers
- **Semaphore limiting**: Configurable concurrency control
- **Optimized task creation**: Efficient parallel execution

## Docker

The API can be run using Docker Compose:

```bash
# From the project root
docker-compose up rails-api
```

This will expose the Rails API on port 8081.

## Example Usage

```bash
# Health check
curl "http://localhost:3000/healthz"

# Sequential requests (slower)
curl "http://localhost:3000/delay/sequential?delaySecs=2&numOfCalls=5"

# Parallel requests (faster)
curl "http://localhost:3000/delay/parallel?delaySecs=2&numOfCalls=10&callLimit=5"
```

## Performance Comparison

With Typhoeus + optimized configuration:
- **HTTP overhead**: Minimized with connection pooling
- **Concurrent requests**: Up to 16 simultaneous threads
- **Async operations**: True parallelism with Ruby fibers
- **Connection reuse**: Persistent HTTP connections

## Dependencies

- **Rails 8**: Web framework
- **Faraday**: HTTP client library  
- **Typhoeus**: High-performance libcurl adapter
- **Async**: Concurrency framework for Ruby
- **Puma**: Multi-threaded web server
