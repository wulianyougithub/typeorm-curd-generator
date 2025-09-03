
English | [中文](README.zh-CN.md)
# NestJS TypeORM CRUD Generator
---

A powerful NestJS package that automatically generates CRUD operations, entities, DTOs, services, controllers, and modules based on your database table structure using TypeORM.

## Features

- 🚀 **Automatic CRUD Generation**: Generate complete CRUD operations from database tables
- 🗄️ **Multi-Database Support**: MySQL, PostgreSQL, SQL Server, Oracle, MariaDB, SQLite
- 📝 **Smart Templates**: Uses Handlebars templates for customizable code generation
- 🎯 **NestJS Integration**: Seamlessly integrates with NestJS applications
- 🔧 **Flexible Configuration**: Customizable naming conventions and code styles
- 📦 **CLI Support**: Command-line interface for easy integration
- 🎨 **Code Formatting**: Automatic Prettier formatting for generated code

## Installation

```bash
npm install typeorm-crud-generator
```

## Quick Start

### 1. As a NestJS Module

```typescript
import { Module } from '@nestjs/common';
import { TypeormCrudGeneratorModule } from 'typeorm-crud-generator';

@Module({
  imports: [TypeormCrudGeneratorModule],
  // ... other imports
})
export class AppModule {}
```

### 2. Using the Service

```typescript
import { Injectable } from '@nestjs/common';
import { GenerateService, IConnectionOptions, IGenerationOptions } from 'typeorm-crud-generator';

@Injectable()
export class MyService {
  constructor(private readonly generateService: GenerateService) {}

  async generateCrud() {
    const connectionOptions: IConnectionOptions = {
      databaseType: 'mysql',
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'password',
      databaseNames: ['mydb'],
      schemaNames: [''],
      ssl: false,
      skipTables: [],
      onlyTables: [],
    };

    const generationOptions: Partial<IGenerationOptions> = {
      resultsPath: './generated',
      convertCaseEntity: 'pascal',
      convertCaseProperty: 'camel',
      convertCaseFile: 'param',
    };

    await this.generateService.generateCrud(connectionOptions, generationOptions);
  }
}
```

### 3. Using the CLI

#### After Installation
```bash
# Global installation
npm install -g typeorm-crud-generator

# Use short command
tg --help

# Fully interactive mode
tg

# Command line mode
tg --type mysql --host localhost --port 3306 --username root --password password --database mydb --output ./generated
```

#### Using npx (No Installation Required)
```bash
# Fully interactive mode
npx typeorm-crud-generator

# Command line mode
npx typeorm-crud-generator \
  --type mysql \
  --host localhost \
  --port 3306 \
  --username root \
  --password password \
  --database mydb \
  --output ./generated

# Multiple databases support
npx typeorm-crud-generator \
  --type mysql \
  --database "db1,db2,db3" \
  --skip-tables "migrations,logs" \
  --only-tables "users,products"
```

#### Using npm Scripts (In Project)
```bash
# Add script to package.json
{
  "scripts": {
    "generate": "node dist/cli.js"
  }
}

# Use script
npm run generate

# With parameters
npm run generate -- --type mysql --database mydb
```

## Configuration Options

### Connection Options

```typescript
interface IConnectionOptions {
  databaseType: 'mysql' | 'postgres' | 'mssql' | 'oracle' | 'mariadb' | 'sqlite';
  host: string;
  port: number;
  user: string;
  password: string;
  databaseNames: string[];        // Support multiple databases
  schemaNames: string[];
  ssl: boolean;
  skipTables: string[];          // Tables to skip
  onlyTables: string[];          // Only process these tables
  instanceName?: string;
  //If OnlyTables is set and there are associated tables that are not in OnlyTables, then this field needs to be set to false, and the generated entity will not contain any associated relationships. If they all exist, set to true, and an entity with associated relationships will be generated. default is false
  includeRelatedTables?: boolean  
}
```

### Generation Options

```typescript
interface IGenerationOptions {
  // Basic configuration
  resultsPath: string;           // Output directory
  pluralizeNames: boolean;       // Whether to pluralize entity names
  noConfigs: boolean;            // Whether to skip config file generation
  
  // Naming conversion strategy
  convertCaseFile: 'pascal' | 'param' | 'camel' | 'none';      // File naming
  convertCaseEntity: 'pascal' | 'camel' | 'none';              // Entity naming
  convertCaseProperty: 'pascal' | 'camel' | 'snake' | 'none';  // Property naming
  convertEol: 'LF' | 'CRLF';                                    // Line ending style
  
  // Code generation options
  propertyVisibility: 'public' | 'protected' | 'private' | 'none';  // Member visibility
  lazy: boolean;                 // Whether to use lazy loading for relations
  activeRecord: boolean;         // Whether to inherit BaseEntity
  generateConstructor: boolean;  // Whether to generate constructor based on Partial<T>
  customNamingStrategyPath: string;  // Custom naming strategy path
  relationIds: boolean;          // Whether to generate RelationId fields
  strictMode: 'none' | '?' | '!';  // Strict mode flag (affects nullable/required type annotations)
  skipSchema: boolean;           // Whether to skip schema
  indexFile: boolean;            // Whether to generate index file
  exportType: 'named' | 'default';  // Export type
  
  // Permission related (controller route permission decorators)
  addPermissionIdentifier?: boolean;  // Enable permission decorators on each controller route
  permissionIdentifier?: string;      // Permission decorator identifier (default @permission)
  perMissionIdentifierPrefix?: string;  // Permission prefix, usually for system domain
  
  // Swagger switch
  addSwaggerIdentifier?: boolean;  // Only output Swagger imports and decorators when true
}
```

### Configuration Options Description

#### Basic Configuration
- `resultsPath`: Output directory for generated results
- `pluralizeNames`: Whether to pluralize entity names
- `noConfigs`: Whether to skip config file generation

#### Naming Conversion Strategy
- `convertCaseFile`: File naming case conversion strategy
- `convertCaseEntity`: Entity class name case conversion strategy
- `convertCaseProperty`: Property name case conversion strategy
- `convertEol`: Line ending style (LF/CRLF)

#### Code Generation Options
- `propertyVisibility`: Member visibility (public/protected/private/none)
- `lazy`: Whether to use lazy loading for relations (Promise<T>)
- `activeRecord`: Whether to inherit BaseEntity
- `generateConstructor`: Whether to generate constructor based on Partial<T>
- `customNamingStrategyPath`: Custom naming strategy path
- `relationIds`: Whether to generate RelationId fields
- `strictMode`: Strict mode flag (none/?/!), affects nullable/required type annotations
- `skipSchema`: Whether to skip schema
- `indexFile`: Whether to generate index file
- `exportType`: Export type (named/default)

#### Permission Related
- `addPermissionIdentifier`: Enable permission decorators on each controller route
- `permissionIdentifier`: Permission decorator identifier (default @permission), outputs as: `@permission('prefix:entityCamel:operation')`
- `perMissionIdentifierPrefix`: Permission prefix, usually for system domain (e.g., 'system')

**Operation mapping:**
- `add` = Create endpoint (@Post)
- `remove` = Delete endpoint (@Delete)
- `list` = Query list (@Get /paginate & @Get /)
- `query` = Query details (@Get :id)
- `edit` = Edit/Update (@Patch :id or /upsert)

#### Swagger Switch
- `addSwaggerIdentifier`: Only output Swagger imports and decorators when true; when false, completely independent of @nestjs/swagger
  - When false:
    - Controller doesn't output ApiTags/ApiOperation/ApiResponse etc.
    - Create/Pagination DTO doesn't output ApiProperty/ApiPropertyOptional
    - Entity doesn't output ApiProperty
    - Update DTO will import PartialType from @nestjs/mapped-types instead of swagger version

## Generated Files

For each database table, the generator creates:

- **Entity**: TypeORM entity class with proper decorators
- **DTOs**: Create, Update, and Pagination DTOs
- **Service**: CRUD service with TypeORM operations
- **Controller**: REST API controller with CRUD endpoints
- **Module**: NestJS module configuration

## API Reference

### GenerateService

Main service for CRUD generation, providing two core methods:

- `generateCrud(connectionOptions, generationOptions)`: Generate CRUD files to specified directory
- `generateAndArchiveCrud(connectionOptions, generationOptions)`: Generate CRUD files and package into ZIP archive

### Usage Example

```typescript
import { GenerateService, IConnectionOptions, IGenerationOptions } from 'typeorm-crud-generator';

@Injectable()
export class MyService {
  constructor(private readonly generateService: GenerateService) {}

  async generateFiles() {
    const connectionOptions: IConnectionOptions = {
      databaseType: 'mysql',
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'password',
      databaseNames: ['mydb'],
      schemaNames: [''],
      ssl: false,
      skipTables: [],
      onlyTables: [],
      includeRelatedTables:true
    };

    const generationOptions: Partial<IGenerationOptions> = {
      resultsPath: './generated',
      convertCaseEntity: 'pascal',
      convertCaseProperty: 'camel',
    };

    // Generate files to directory
    await this.generateService.generateCrud(connectionOptions, generationOptions);
    
    // Or generate files and package into ZIP
    await this.generateService.generateAndArchiveCrud(connectionOptions, generationOptions);
  }
}
```

## Examples

### Basic Usage

```typescript
import { Module } from '@nestjs/common';
import { TypeormCrudGeneratorModule, GenerateService } from 'typeorm-crud-generator';

@Module({
  imports: [TypeormCrudGeneratorModule],
  providers: [MyService],
})
export class AppModule {}

@Injectable()
export class MyService {
  constructor(private readonly generateService: GenerateService) {}

  async generateFromDatabase() {
    await this.generateService.generateCrud({
      databaseType: 'postgres',
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'password',
      databaseNames: ['mydb'],
      schemaNames: [''],
      ssl: false,
      skipTables: [],
      onlyTables: [],
      includeRelatedTables:true
    }, {
      resultsPath: './src/generated',
      convertCaseEntity: 'pascal',
      convertCaseProperty: 'camel',
    });
  }
}
```

## Acknowledgements

This project is inspired by and builds upon ideas from `typeorm-model-generator`.

- Repository: [typeorm-model-generator](https://github.com/Kononnable/typeorm-model-generator)
- License: MIT (see their repository for details)


### Custom Templates

You can customize the generated code by modifying the Handlebars templates in the `templates/` directory.


### 1.x
- Initial release
- Support for multiple database types
- CRUD generation with customizable templates
- CLI support
- NestJS module integration


