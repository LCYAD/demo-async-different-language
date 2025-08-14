class Employee < ApplicationRecord
  # Associations
  belongs_to :office

  # Validations
  validates :name, presence: true
  validates :department_name, presence: true
  validates :position, presence: true
  validates :birthday, presence: true
  validates :joined_at, presence: true
  validates :estimated_total_income, presence: true, numericality: { greater_than_or_equal_to: 0 }

  # Scopes
  scope :active, -> { where(retired_at: nil) }
  scope :retired, -> { where.not(retired_at: nil) }
  scope :ordered, -> { order(created_at: :desc) }

  def as_json(options = {})
    super(options.merge(
      except: [:created_at, :updated_at],
      methods: [:active]
    ))
  end

  def active
    retired_at.nil?
  end
end
