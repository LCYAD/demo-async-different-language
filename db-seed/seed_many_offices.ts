/// <reference types="node" />
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { faker } from '@faker-js/faker';
import { offices, employees } from './schema/schema';

// Configuration for many small offices
const OFFICE_COUNT = 1000;
const MIN_EMPLOYEES = 20;
const MAX_EMPLOYEES = 50;

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

async function generateOffice() {
  // Generate a more realistic office name using city names
  const cityName = faker.location.city();
  const officeName = `${cityName} Branch`;
  
  return {
    name: officeName,
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
    console.log('Starting seed process for many small offices...');
    console.log(`Target: ${OFFICE_COUNT} offices with ${MIN_EMPLOYEES}-${MAX_EMPLOYEES} employees each`);

    // Create offices in batches
    const OFFICE_BATCH_SIZE = 50;
    for (let officeIndex = 0; officeIndex < OFFICE_COUNT; officeIndex += OFFICE_BATCH_SIZE) {
      const currentOfficeBatchSize = Math.min(OFFICE_BATCH_SIZE, OFFICE_COUNT - officeIndex);
      const officeBatch = await Promise.all(
        Array.from({ length: currentOfficeBatchSize }, () => generateOffice())
      );
      
      const officeResults = await db.insert(offices).values(officeBatch).execute();
      const startOfficeId = officeResults[0].insertId;

      // For each office in the batch, create its employees
      for (let i = 0; i < currentOfficeBatchSize; i++) {
        const officeId = startOfficeId + i;
        const employeeCount = faker.number.int({ min: MIN_EMPLOYEES, max: MAX_EMPLOYEES });
        
        // Create employees in smaller batches
        const EMPLOYEE_BATCH_SIZE = 50;
        for (let j = 0; j < employeeCount; j += EMPLOYEE_BATCH_SIZE) {
          const currentBatchSize = Math.min(EMPLOYEE_BATCH_SIZE, employeeCount - j);
          const employeeBatch = await Promise.all(
            Array.from({ length: currentBatchSize }, () => generateEmployee(officeId))
          );
          await db.insert(employees).values(employeeBatch).execute();
        }
      }

      console.log(`Progress: Created offices ${officeIndex + 1} to ${officeIndex + currentOfficeBatchSize} of ${OFFICE_COUNT}`);
    }

    console.log('Seed completed successfully!');
    
    // Print some statistics
    const [officeRows] = await pool.execute('SELECT COUNT(*) as officeCount FROM offices') as any;
    const [employeeRows] = await pool.execute('SELECT COUNT(*) as employeeCount FROM employees') as any;
    console.log('\nFinal Statistics:');
    console.log(`Total Offices: ${officeRows[0].officeCount}`);
    console.log(`Total Employees: ${employeeRows[0].employeeCount}`);
    console.log(`Average Employees per Office: ${Math.round(Number(employeeRows[0].employeeCount) / Number(officeRows[0].officeCount))}`);

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
