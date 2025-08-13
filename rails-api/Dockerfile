# Use the official Ruby image
FROM ruby:3.3.5-slim

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies
RUN apt-get update -qq && \
    apt-get install -y build-essential libcurl4-openssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy Gemfile and Gemfile.lock
COPY Gemfile Gemfile.lock ./

# Install Ruby dependencies
RUN bundle install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# The default command to run the app
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
