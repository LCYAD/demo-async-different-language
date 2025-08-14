class Office < ApplicationRecord
  # Validations
  validates :name, presence: true
  validates :identification_code, presence: true, uniqueness: true, length: { is: 8 }

  # Associations
  has_many :employees, dependent: :restrict_with_error

  # Scopes
  scope :ordered, -> { order(created_at: :desc) }
  scope :with_employees, -> { includes(:employees) }

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
    employees.size
  end

  def active_employee_count
    employees.active.size
  end
end
