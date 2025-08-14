class Office < ApplicationRecord
  # Validations
  validates :name, presence: true
  validates :identification_code, presence: true, uniqueness: true, length: { is: 8 }

  # Associations
  has_many :employees, dependent: :restrict_with_error

  # Scopes
  scope :ordered, -> { order(created_at: :desc) }
  scope :with_employees, -> { includes(:employees) }
  # Scopes optimized to resolve N+1 problem
  scope :with_employees_solved, -> { 
    left_joins(:employees)
      .select('offices.*')
      .select('COUNT(DISTINCT employees.id) as total_employees_count')
      .select('COUNT(DISTINCT CASE WHEN employees.retired_at IS NULL THEN employees.id END) as active_employees_count')
      .includes(:employees)
      .group('offices.id')
  }

  def as_json(options = {})
    super(options.merge(
      except: [:created_at, :updated_at],
      include: {
        employees: {
          except: [:created_at, :updated_at, :office_id]
        }
      },
      methods: [:employee_count, :active_employee_count]
    ))
  end

  def employee_count
    total_employees_count || employees.size
  end

  def active_employee_count
    active_employees_count || employees.active.size
  end

  private

  def total_employees_count
    attributes['total_employees_count']&.to_i
  end

  def active_employees_count
    attributes['active_employees_count']&.to_i
  end
end
