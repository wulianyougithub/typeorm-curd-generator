#!/usr/bin/env node

import { GenerateService } from './GenerateService';
import { TypeormModelGeneratorService } from './TypeormModelGeneratorService';
import { CrudGeneratorService } from './CrudGenerator';
import { FileArchiverService } from './file-archiver.service';
import IConnectionOptions from './IConnectionOptions';
import IGenerationOptions from './IGenerationOptions';
import * as readline from 'readline';

export async function cli() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
NestJS TypeORM CRUD Generator

Usage: npx @nestjs/typeorm-crud-generator [options]

Options:
  --host <host>           Database host (default: localhost)
  --port <port>           Database port
  --username <username>   Database username
  --password <password>   Database password
  --database <database>   Database names (comma-separated for multiple databases)
  --type <type>           Database type: mysql, postgres, mssql, oracle, mariadb, sqlite
  --output <path>         Output directory for generated files
  --skip-tables <tables>  Tables to skip (comma-separated)
  --only-tables <tables>  Only process these tables (comma-separated)
  --swagger               Add Swagger decorators (entities, controllers, DTOs)
  --help, -h              Show this help message

Examples:
  npx @nestjs/typeorm-crud-generator --type mysql --host localhost --port 3306 --username root --password password --database mydb,testdb --output ./generated
  npx @nestjs/typeorm-crud-generator --type mysql --database mydb --skip-tables "migrations,logs" --only-tables "users,products"
    `);
    return;
  }

  try {
    // Check if any arguments are provided
    const hasAnyArgs = process.argv.length > 2;
    
    let connectionOptions: IConnectionOptions;
    let generationOptions: Partial<IGenerationOptions>;

    if (hasAnyArgs) {
      // Command line mode - parse arguments
      connectionOptions = {
        host: getArgValue('--host') || 'localhost',
        port: parseInt(getArgValue('--port') || '3306'),
        user: getArgValue('--username') || '',
        password: getArgValue('--password') || '',
        databaseNames: getArgValue('--database') ? getArgValue('--database')!.split(',').map(db => db.trim()) : [''],
        databaseType: (getArgValue('--type') as any) || 'mysql',
        schemaNames: [''],
        ssl: false,
        skipTables: getArgValue('--skip-tables') ? getArgValue('--skip-tables')!.split(',').map(table => table.trim()) : [],
        onlyTables: getArgValue('--only-tables') ? getArgValue('--only-tables')!.split(',').map(table => table.trim()) : [],
      };

      generationOptions = {
        resultsPath: getArgValue('--output') || './generated',
        addSwaggerIdentifier: process.argv.includes('--swagger') || (getArgValue('--swagger')?.toLowerCase() === 'true'),
      };

      // Interactive prompts for missing required parameters
      if (!getArgValue('--type')) {
        connectionOptions.databaseType = await selectDatabaseType();
      }

      if (!getArgValue('--database') || connectionOptions.databaseNames[0] === '') {
        connectionOptions.databaseNames = await promptForDatabaseNames();
      }
    } else {
      // Fully interactive mode - prompt for all parameters
      console.log('🎯 Welcome to NestJS TypeORM CRUD Generator (Interactive Mode)');
      console.log('Please provide the following information:\n');
      
      connectionOptions = await promptForAllConnectionOptions();
      generationOptions = await promptForGenerationOptions();
    }

    // Initialize services
    const typeormModelGeneratorService = new TypeormModelGeneratorService();
    const crudGeneratorService = new CrudGeneratorService();
    const fileArchiverService = new FileArchiverService();
    const generateService = new GenerateService(
      typeormModelGeneratorService,
      crudGeneratorService,
      fileArchiverService
    );

    console.log('🚀 Starting CRUD generation...');
    console.log(`📊 Database Type: ${connectionOptions.databaseType}`);
    console.log(`🌐 Host: ${connectionOptions.host}:${connectionOptions.port}`);
    console.log(`🗄️  Databases: ${connectionOptions.databaseNames.join(', ')}`);
    console.log(`📁 Output: ${generationOptions.resultsPath}`);

    await generateService.generateCrud(connectionOptions, generationOptions);

    console.log('✅ CRUD generation completed successfully!');
    console.log(`📁 Files generated in: ${generationOptions.resultsPath}`);

  } catch (error) {
    console.error('❌ Error during CRUD generation:', error.message);
    process.exit(1);
  }
}

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return undefined;
  }
  return process.argv[index + 1];
}

async function selectDatabaseType(): Promise<"mssql" | "postgres" | "mysql" | "mariadb" | "oracle" | "sqlite"> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const databaseTypes = [
    { value: 'mysql', name: 'MySQL' },
    { value: 'postgres', name: 'PostgreSQL' },
    { value: 'mssql', name: 'Microsoft SQL Server' },
    { value: 'oracle', name: 'Oracle' },
    { value: 'mariadb', name: 'MariaDB' },
    { value: 'sqlite', name: 'SQLite' }
  ];

  console.log('\n📊 Please select your database type:');
  databaseTypes.forEach((type, index) => {
    console.log(`  ${index + 1}. ${type.name} (${type.value})`);
  });

  return new Promise((resolve) => {
    rl.question('\nEnter your choice (1-6): ', (answer) => {
      rl.close();
      const choice = parseInt(answer);
      if (choice >= 1 && choice <= databaseTypes.length) {
        resolve(databaseTypes[choice - 1].value as any);
      } else {
        console.log('Invalid choice, defaulting to MySQL');
        resolve('mysql');
      }
    });
  });
}

async function promptForDatabaseNames(): Promise<string[]> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\n🗄️  Enter database name(s) (comma-separated for multiple databases): ', (answer) => {
      rl.close();
      if (answer.trim()) {
        const databases = answer.split(',').map(db => db.trim()).filter(db => db.length > 0);
        resolve(databases);
      } else {
        console.log('No database names provided, please run the command again with --database option');
        process.exit(1);
      }
    });
  });
}

async function promptForAllConnectionOptions(): Promise<IConnectionOptions> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question: string, defaultValue?: string): Promise<string> => {
    return new Promise((resolve) => {
      const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
      rl.question(`${question}${defaultText}: `, (answer) => {
        resolve(answer.trim() || defaultValue || '');
      });
    });
  };

  const askNumberQuestion = async (question: string, defaultValue: number): Promise<number> => {
    const answer = await askQuestion(question, defaultValue.toString());
    const num = parseInt(answer);
    return isNaN(num) ? defaultValue : num;
  };

  const selectDatabaseTypeWithRL = (): Promise<"mssql" | "postgres" | "mysql" | "mariadb" | "oracle" | "sqlite"> => {
    const databaseTypes = [
      { value: 'mysql', name: 'MySQL' },
      { value: 'postgres', name: 'PostgreSQL' },
      { value: 'mssql', name: 'Microsoft SQL Server' },
      { value: 'oracle', name: 'Oracle' },
      { value: 'mariadb', name: 'MariaDB' },
      { value: 'sqlite', name: 'SQLite' }
    ];

    console.log('\n📊 Please select your database type:');
    databaseTypes.forEach((type, index) => {
      console.log(`  ${index + 1}. ${type.name} (${type.value})`);
    });

    return new Promise((resolve) => {
      rl.question('\nEnter your choice (1-6): ', (answer) => {
        const choice = parseInt(answer);
        if (choice >= 1 && choice <= databaseTypes.length) {
          resolve(databaseTypes[choice - 1].value as any);
        } else {
          console.log('Invalid choice, defaulting to MySQL');
          resolve('mysql');
        }
      });
    });
  };

  const promptForDatabaseNamesWithRL = (): Promise<string[]> => {
    return new Promise((resolve) => {
      rl.question('\n🗄️  Enter database name(s) (comma-separated for multiple databases): ', (answer) => {
        if (answer.trim()) {
          const databases = answer.split(',').map(db => db.trim()).filter(db => db.length > 0);
          resolve(databases);
        } else {
          console.log('No database names provided, please run the command again with --database option');
          process.exit(1);
        }
      });
    });
  };

  try {
    // Database type selection
    const databaseType = await selectDatabaseTypeWithRL();
    
    // Host
    const host = await askQuestion('🌐 Database host', 'localhost');
    
    // Port (with default based on database type)
    const defaultPorts = {
      mysql: 3306,
      postgres: 5432,
      mssql: 1433,
      oracle: 1521,
      mariadb: 3306,
      sqlite: 0
    };
    const port = await askNumberQuestion('🔌 Database port', defaultPorts[databaseType]);
    
    // Username
    const user = await askQuestion('👤 Database username', 'root');
    
    // Password
    const password = await askQuestion('🔒 Database password', '');
    
    // Database names
    const databaseNames = await promptForDatabaseNamesWithRL();
    
    // SSL
    const sslAnswer = await askQuestion('🔐 Use SSL connection? (y/n)', 'n');
    const ssl = sslAnswer.toLowerCase() === 'y' || sslAnswer.toLowerCase() === 'yes';

    // Skip tables
    const skipTablesAnswer = await askQuestion('⏭️  Tables to skip (comma-separated, leave empty for none)', '');
    const skipTables = skipTablesAnswer ? skipTablesAnswer.split(',').map(table => table.trim()).filter(table => table.length > 0) : [];

    // Only tables
    const onlyTablesAnswer = await askQuestion('🎯 Only process these tables (comma-separated, leave empty for all)', '');
    const onlyTables = onlyTablesAnswer ? onlyTablesAnswer.split(',').map(table => table.trim()).filter(table => table.length > 0) : [];

    return {
      host,
      port,
      user,
      password,
      databaseNames,
      databaseType,
      schemaNames: [''],
      ssl,
      skipTables,
      onlyTables,
    };
  } finally {
    rl.close();
  }
}

async function promptForGenerationOptions(): Promise<Partial<IGenerationOptions>> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question: string, defaultValue?: string): Promise<string> => {
    return new Promise((resolve) => {
      const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
      rl.question(`${question}${defaultText}: `, (answer) => {
        resolve(answer.trim() || defaultValue || '');
      });
    });
  };

  try {
    const resultsPath = await askQuestion('📁 Output directory for generated files', './generated');
    const swaggerAnswer = await askQuestion('🧾 Add Swagger decorators? (y/n)', 'y');
    const addSwaggerIdentifier = swaggerAnswer.toLowerCase() === 'y' || swaggerAnswer.toLowerCase() === 'yes';
    
    return {
      resultsPath,
      addSwaggerIdentifier,
    };
  } finally {
    rl.close();
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  cli().catch(console.error);
}
