# Database Setup and Seeding

This directory contains the database schema and scripts for setting up and seeding a test database with offices and employees data.

## Prerequisites

- MySQL server running on localhost:3306 with root access
- Bun.js installed

## Directory Structure

```
db-seed/
├── schema/
│   └── schema.ts         # Database schema definitions
├── migrate.ts            # Database migration script
├── seed.ts              # Data seeding script
├── clean.ts             # Database cleanup script
├── drizzle.config.ts    # Drizzle ORM configuration
└── README.md            # This file
```

## Tables

### Offices
- `id`: Auto-incrementing primary key
- `name`: Office name (VARCHAR(255))
- `identification_code`: Unique 8-character code (VARCHAR(8))
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

### Employees
- `id`: Auto-incrementing primary key
- `office_id`: Foreign key referencing offices.id
- `name`: Employee name (VARCHAR(255))
- `department_name`: Department name (VARCHAR(100))
- `position`: Job position (VARCHAR(255))
- `birthday`: Employee's birthday (DATE)
- `joined_at`: Employment start date (TIMESTAMP)
- `retired_at`: Employment end date (TIMESTAMP, nullable)
- `is_part_timer`: Part-time status (BOOLEAN)
- `estimated_total_income`: Estimated total income in JPY (DECIMAL(12,0))
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Available Commands

```bash
# Install dependencies
bun install

# Create database and tables
bun run migrate

# Seed the database with test data
bun run seed

# Clean (drop) all tables
bun run clean

# Reset everything (clean + migrate + seed)
bun run reset
```

## Seed Data Details

The seed script creates:
1. Small office: 20 employees
2. Medium office: 2,000 employees
3. Large office: 20,000 employees

Employee data includes:
- Random names and departments
- Realistic salary ranges in JPY (¥2.8M - ¥30M based on position)
- 20% chance of being part-time
- 5% chance of being retired
- Birthdates between 18-65 years old
- Up to 10 years of employment history

## Troubleshooting

If you encounter any errors, make sure:
- MySQL server is running and accessible
- Root user has the necessary permissions
- Port 3306 is available and not blocked
- No existing tables with conflicting schemas

To completely reset the database, use:
```bash
bun run reset
```