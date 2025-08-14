class AsyncOfficesController < ApplicationController
  def index
    offices = Office.with_employees.load_async.ordered
    render json: offices
  end

  def show
    office = Office.with_employees.load_async.find(params[:id])
    render json: office
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Office not found' }, status: :not_found
  end
end
