class OfficesController < ApplicationController
  def index
    offices = Office.with_employees.ordered
    render json: offices
  end

  def show
    office = Office.with_employees.find(params[:id])
    render json: office
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Office not found' }, status: :not_found
  end
end
