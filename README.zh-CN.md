
[English](README.md) | 中文

---

# NestJS TypeORM CRUD 生成器

一个有用的 NestJS 包，基于数据库表结构使用 TypeORM 自动生成 CRUD 操作、实体、DTO、服务、控制器和模块。

## 特性

- 🚀 **自动 CRUD 生成**: 从数据库表自动生成完整的 CRUD 操作
- 🗄️ **多数据库支持**: MySQL、PostgreSQL、SQL Server、Oracle、MariaDB、SQLite
- 📝 **智能模板**: 使用 Handlebars 模板进行可定制的代码生成
- 🎯 **NestJS 集成**: 与 NestJS 应用程序无缝集成
- 🔧 **灵活配置**: 可定制的命名约定和代码样式
- 📦 **CLI 支持**: 易于集成的命令行接口
- 🎨 **代码格式化**: 自动 Prettier 格式化生成的代码

## 安装

```bash
npm install typeorm-crud-generator
```

## 快速开始

### 1. 作为 NestJS 模块

```typescript
import { Module } from '@nestjs/common';
import { TypeormCrudGeneratorModule } from 'typeorm-crud-generator';

@Module({
  imports: [TypeormCrudGeneratorModule],
  // ... 其他导入
})
export class AppModule {}
```

### 2. 使用服务

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

### 3. 使用 CLI

#### 安装后使用
```bash
# 全局安装
npm install -g typeorm-crud-generator

# 使用短命令
tg --help

# 完全交互模式
tg

# 命令行模式
tg --type mysql --host localhost --port 3306 --username root --password password --database mydb --output ./generated
```

#### 使用 npx（无需安装）
```bash
# 完全交互模式
npx typeorm-crud-generator

# 命令行模式
npx typeorm-crud-generator \
  --type mysql \
  --host localhost \
  --port 3306 \
  --username root \
  --password password \
  --database mydb \
  --output ./generated

# 多数据库支持
npx typeorm-crud-generator \
  --type mysql \
  --database "db1,db2,db3" \
  --skip-tables "migrations,logs" \
  --only-tables "users,products"
```

#### 使用 npm 脚本（在项目中）
```bash
# 在 package.json 中添加脚本
{
  "scripts": {
    "generate": "node dist/cli.js"
  }
}

# 使用脚本
npm run generate

# 带参数
npm run generate -- --type mysql --database mydb
```

## 配置选项

### 连接选项

```typescript
interface IConnectionOptions {
  databaseType: 'mysql' | 'postgres' | 'mssql' | 'oracle' | 'mariadb' | 'sqlite';
  host: string;
  port: number;
  user: string;
  password: string;
  databaseNames: string[];        // 支持多个数据库
  schemaNames: string[];
  ssl: boolean;
  skipTables: string[];          // 要跳过的表
  onlyTables: string[];          // 只处理的表
  instanceName?: string;
}
```

### 生成选项

```typescript
interface IGenerationOptions {
  // 基础配置
  resultsPath: string;           // 输出目录
  pluralizeNames: boolean;       // 是否对实体名做复数化处理
  noConfigs: boolean;            // 是否不生成配置文件
  
  // 命名转换策略
  convertCaseFile: 'pascal' | 'param' | 'camel' | 'none';      // 文件命名
  convertCaseEntity: 'pascal' | 'camel' | 'none';              // 实体命名
  convertCaseProperty: 'pascal' | 'camel' | 'snake' | 'none';  // 属性命名
  convertEol: 'LF' | 'CRLF';                                    // 行尾风格
  
  // 代码生成选项
  propertyVisibility: 'public' | 'protected' | 'private' | 'none';  // 成员可见性
  lazy: boolean;                 // 关系是否使用懒加载
  activeRecord: boolean;         // 是否继承 BaseEntity
  generateConstructor: boolean;  // 是否生成基于 Partial<T> 的构造函数
  customNamingStrategyPath: string;  // 自定义命名策略路径
  relationIds: boolean;          // 是否生成 RelationId 字段
  strictMode: 'none' | '?' | '!';  // 严格模式标记（影响可空/必填的类型标注）
  skipSchema: boolean;           // 是否忽略 schema
  indexFile: boolean;            // 是否生成索引文件
  exportType: 'named' | 'default';  // 导出类型
  
  // 权限相关（controller 路由权限装饰器）
  addPermissionIdentifier?: boolean;  // 开启后在控制器每个路由上输出权限装饰器
  permissionIdentifier?: string;      // 权限装饰器标识（默认 @permission）
  perMissionIdentifierPrefix?: string;  // 权限前缀，一般用于系统域
  
  // Swagger 开关
  addSwaggerIdentifier?: boolean;  // 为 true 才输出 Swagger 相关导入与装饰器
}
```

### 配置选项说明

#### 基础配置
- `resultsPath`: 生成结果输出目录
- `pluralizeNames`: 是否对实体名做复数化处理
- `noConfigs`: 是否不生成配置文件

#### 命名转换策略
- `convertCaseFile`: 文件命名大小写转换策略
- `convertCaseEntity`: 实体类名大小写转换策略  
- `convertCaseProperty`: 属性名大小写转换策略
- `convertEol`: 行尾风格（LF/CRLF）

#### 代码生成选项
- `propertyVisibility`: 成员可见性（public/protected/private/none）
- `lazy`: 关系是否使用懒加载（Promise<T>）
- `activeRecord`: 是否继承 BaseEntity
- `generateConstructor`: 是否生成基于 Partial<T> 的构造函数
- `customNamingStrategyPath`: 自定义命名策略路径
- `relationIds`: 是否生成 RelationId 字段
- `strictMode`: 严格模式标记（none/?/!），影响可空/必填的类型标注
- `skipSchema`: 是否忽略 schema
- `indexFile`: 是否生成索引文件
- `exportType`: 导出类型（named/default）

#### 权限相关
- `addPermissionIdentifier`: 开启后在控制器每个路由上输出权限装饰器
- `permissionIdentifier`: 权限装饰器标识（默认 @permission），会按如下形式输出：`@permission('prefix:entityCamel:operation')`
- `perMissionIdentifierPrefix`: 权限前缀，一般用于系统域（如 'system'）

**operation 对应关系：**
- `add` = 新增接口(@Post)
- `remove` = 删除接口(@Delete)  
- `list` = 查询列表(@Get /paginate & @Get /)
- `query` = 查询详情(@Get :id)
- `edit` = 编辑/更新(@Patch :id 或 /upsert)

#### Swagger 开关
- `addSwaggerIdentifier`: 为 true 才输出 Swagger 相关导入与装饰器；为 false 将完全不依赖 @nestjs/swagger
  - 当为 false 时：
    - controller 不输出 ApiTags/ApiOperation/ApiResponse 等
    - Create/Pagination DTO 不输出 ApiProperty/ApiPropertyOptional
    - Entity 不输出 ApiProperty
    - Update DTO 将从 @nestjs/mapped-types 导入 PartialType 替代 swagger 版本

## 生成的文件

对于每个数据库表，生成器会创建：

- **Entity**: 带有适当装饰器的 TypeORM 实体类
- **DTOs**: 创建、更新和分页 DTO
- **Service**: 带有 TypeORM 操作的 CRUD 服务
- **Controller**: 带有 CRUD 端点的 REST API 控制器
- **Module**: NestJS 模块配置

## API 参考

### GenerateService

CRUD 生成的主要服务，提供两个核心方法：

- `generateCrud(connectionOptions, generationOptions)`: 生成 CRUD 文件到指定目录
- `generateAndArchiveCrud(connectionOptions, generationOptions)`: 生成 CRUD 文件并打包成 ZIP 归档

### 使用示例

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
    };

    const generationOptions: Partial<IGenerationOptions> = {
      resultsPath: './generated',
      convertCaseEntity: 'pascal',
      convertCaseProperty: 'camel',
    };

    // 生成文件到目录
    await this.generateService.generateCrud(connectionOptions, generationOptions);
    
    // 或者生成文件并打包成 ZIP
    await this.generateService.generateAndArchiveCrud(connectionOptions, generationOptions);
  }
}
```

## 使用示例

### 基本用法

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
    }, {
      resultsPath: './src/generated',
      convertCaseEntity: 'pascal',
      convertCaseProperty: 'camel',
    });
  }
}
```

## 致谢

本项目的设计思路参考并借鉴了开源项目 `typeorm-model-generator`：

- 仓库地址：[typeorm-model-generator](https://github.com/Kononnable/typeorm-model-generator)
- 许可证：MIT（详情请参考其仓库）


### 自定义模板

您可以通过修改 `templates/` 目录中的 Handlebars 模板来自定义生成的代码。


### 1.0.0
- 初始版本
- 支持多种数据库类型
- 带有可定制模板的 CRUD 生成
- CLI 支持
- NestJS 模块集成


