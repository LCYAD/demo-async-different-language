import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { faker } from '@faker-js/faker';
import { offices, employees } from './schema/schema';

const OFFICE_CONFIGS = [
  { name: 'small', employeeCount: 20 },
  { name: 'medium', employeeCount: 2000 },
  { name: 'large', employeeCount: 20000 }
] as const;

const DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Research & Development',
  'Customer Support',
  'Legal',
  'Product Management'
] as const;

const POSITIONS = [
  'Junior Associate',
  'Senior Associate',
  'Team Lead',
  'Manager',
  'Senior Manager',
  'Director',
  'Senior Director',
  'Vice President',
  'Executive'
] as const;

async function generateOffice(name: string) {
  return {
    name,
    identificationCode: faker.string.alphanumeric(8).toUpperCase(),
  };
}

async function generateEmployee(officeId: number) {
  const isPartTimer = faker.datatype.boolean({ probability: 0.2 });
  const joinedAt = faker.date.past({ years: 10 });
  const hasRetired = faker.datatype.boolean({ probability: 0.05 });
  const retiredAt = hasRetired ? faker.date.between({ 
    from: joinedAt, 
    to: new Date() 
  }) : null;
  
  const position = faker.helpers.arrayElement(POSITIONS);
  // Salary in Japanese Yen (¥)
  const baseSalary = (() => {
    switch(position) {
      case 'Junior Associate': return faker.number.int({ min: 2800000, max: 3500000 }); // 2.8M - 3.5M
      case 'Senior Associate': return faker.number.int({ min: 3500000, max: 4500000 }); // 3.5M - 4.5M
      case 'Team Lead': return faker.number.int({ min: 4500000, max: 6000000 }); // 4.5M - 6M
      case 'Manager': return faker.number.int({ min: 6000000, max: 8000000 }); // 6M - 8M
      case 'Senior Manager': return faker.number.int({ min: 8000000, max: 10000000 }); // 8M - 10M
      case 'Director': return faker.number.int({ min: 10000000, max: 13000000 }); // 10M - 13M
      case 'Senior Director': return faker.number.int({ min: 13000000, max: 16000000 }); // 13M - 16M
      case 'Vice President': return faker.number.int({ min: 16000000, max: 20000000 }); // 16M - 20M
      case 'Executive': return faker.number.int({ min: 20000000, max: 30000000 }); // 20M - 30M
      default: return 3000000; // 3M default
    }
  })();

  const yearsWorked = hasRetired 
    ? (retiredAt!.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24 * 365)
    : (new Date().getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24 * 365);

  // Calculate total income based on years worked and part-time status
  // For part-timers, they work 60% of full-time (slightly higher than half to account for benefits)
  const totalIncome = baseSalary * yearsWorked * (isPartTimer ? 0.6 : 1);
  
  // Get birthdate without time component
  const birthDate = faker.date.birthdate({ min: 18, max: 65, mode: 'age' });
  birthDate.setUTCHours(0, 0, 0, 0);
  
  return {
    officeId,
    name: faker.person.fullName(),
    departmentName: faker.helpers.arrayElement(DEPARTMENTS),
    position,
    birthday: birthDate,
    joinedAt,
    retiredAt,
    isPartTimer,
    estimatedTotalIncome: String(Math.round(totalIncome)) // Convert to string for MySQL DECIMAL
  };
}

async function main() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'test_db',
    port: 3306,
  });

  const db = drizzle(pool);

  try {
    console.log('Starting seed process...');

    // Create offices
    for (const config of OFFICE_CONFIGS) {
      console.log(`Creating ${config.name} office...`);
      const officeData = await generateOffice(config.name);
      const [office] = await db.insert(offices).values(officeData).execute();
      const officeId = office.insertId;

      // Create employees for this office
      console.log(`Creating ${config.employeeCount} employees for ${config.name} office...`);
      const batchSize = 200; // Insert in batches to avoid memory issues
      for (let i = 0; i < config.employeeCount; i += batchSize) {
        const currentBatchSize = Math.min(batchSize, config.employeeCount - i);
        const employeeBatch = await Promise.all(
          Array.from({ length: currentBatchSize }, () => generateEmployee(officeId))
        );
        await db.insert(employees).values(employeeBatch).execute();
        console.log(`Progress: ${Math.min(i + batchSize, config.employeeCount)}/${config.employeeCount} employees created`);
      }
      console.log(`Completed ${config.name} office with ${config.employeeCount} employees`);
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
