Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Health check endpoint
  get "healthz" => "health#show"

  # Delay endpoints
  get "delay/sequential" => "delay#sequential"
  get "delay/parallel" => "delay#parallel"

  # Office endpoints
  resources :offices, only: [:index, :show]
  
  # Async Office endpoints
  resources :async_offices, only: [:index, :show]

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
