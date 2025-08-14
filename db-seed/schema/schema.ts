import { mysqlTable, varchar, timestamp, boolean, int, decimal, date } from 'drizzle-orm/mysql-core';

export const offices = mysqlTable('offices', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  identificationCode: varchar('identification_code', { length: 8 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const employees = mysqlTable('employees', {
  id: int('id').primaryKey().autoincrement(),
  officeId: int('office_id').notNull().references(() => offices.id),
  name: varchar('name', { length: 255 }).notNull(),
  departmentName: varchar('department_name', { length: 100 }).notNull(),
  position: varchar('position', { length: 255 }).notNull(),
  birthday: date('birthday').notNull(),
  joinedAt: timestamp('joined_at').notNull(),
  retiredAt: timestamp('retired_at'),
  isPartTimer: boolean('is_part_timer').notNull().default(false),
  estimatedTotalIncome: decimal('estimated_total_income', { precision: 12, scale: 0 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
