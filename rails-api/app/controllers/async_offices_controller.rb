class AsyncOfficesController < ApplicationController
  def index
    offices = Office.with_employees.load_async.ordered
    offices2 = Office.with_employees.load_async.ordered
    offices3 = Office.with_employees.load_async.ordered
    
    # Create promises for each async query
    # promises = [
    #   Office.with_employees.ordered.load_async,
    #   Office.with_employees.ordered.load_async,
    #   Office.with_employees.ordered.load_async
    # ]
    
    # # Resolve promises to get the results
    # offices = promises[0].to_a
    # offices2 = promises[1].to_a
    # offices3 = promises[2].to_a
    render json: { offices: offices, offices2: offices2, offices3: offices3 }
  end

  def show
    office = Office.with_employees.load_async.find(params[:id])
    render json: office
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Office not found' }, status: :not_found
  end
end
