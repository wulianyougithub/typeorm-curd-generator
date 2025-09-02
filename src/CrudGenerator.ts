import * as path from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as changeCase from 'change-case';
import * as Prettier from 'prettier';
import { Entity } from './models/Entity';
import IGenerationOptions from './IGenerationOptions';

export class CrudGeneratorService {
  async generateSourceCode(entities: Entity[], generationOptions: IGenerationOptions) {
    const templatesPath = path.resolve(__dirname, 'templates');
    let result:any = {};
    this.registerHandlebarsHelpers(generationOptions);
    for (const entity of entities) {
      const entityName = changeCase.pascalCase(entity.tscName);
      const fileName = changeCase.paramCase(entity.tscName);
      const rendered1 = await this.generateSource(
        path.join(templatesPath, 'dto/create.dto.mst'),
        { entity, entityName, generationOptions }
      );
      const rendered2 = await this.generateSource(
        path.join(templatesPath, 'dto/update.dto.mst'),
        { entity, entityName, generationOptions }
      );
      const rendered3 = await this.generateSource(
        path.join(templatesPath, 'dto/pagination.dto.mst'),
        { entity, entityName, generationOptions }
      );

      const rendered4 = await this.generateSource(
        path.join(templatesPath, 'service.mst'),
       
        { entity, entityName, generationOptions }
      );

      const rendered5 = await this.generateSource(
        path.join(templatesPath, 'controller.mst'),
        { entity, entityName, generationOptions }
      );

      const rendered6 = await this.generateSource(
        path.join(templatesPath, 'module.mst'),
       
        { entity, entityName, generationOptions }
      );
   
      result[`create-${fileName}.dto.ts`] = rendered1;
      result[`update-${fileName}.dto.ts`] = rendered2;
      result[`pagination-${fileName}.dto.ts`] = rendered3;
      result[`${fileName}.service.ts`] = rendered4;
      result[`${fileName}.controller.ts`] = rendered5;
      result[`${fileName}.module.ts`] = rendered6;
    }
    return result;
  }

  private async generateSource(templatePath: string, data: any) {
    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(template, { noEscape: true });
    const rendered = compiledTemplate(data);
    const prettierOptions ={ parser: "typescript", endOfLine: "auto" as const };
    let formatted:any = "";
    try {
        formatted = await Prettier.format(rendered, prettierOptions);
    } catch (error) {
        formatted = rendered;
    }
    return formatted;
  }
  async generateCrudFiles(entities: Entity[], generationOptions: IGenerationOptions) {
    const templatesPath = path.resolve(__dirname, 'templates');

    this.registerHandlebarsHelpers(generationOptions);

    for (const entity of entities) {
      const entityName = changeCase.pascalCase(entity.tscName);
      const fileName = changeCase.paramCase(entity.tscName);
      const modulePath = path.resolve(generationOptions.resultsPath, fileName);

      if (!fs.existsSync(modulePath)) {
        fs.mkdirSync(modulePath, { recursive: true });
      }

      const dtoPath = path.join(modulePath, 'dto');
      if (!fs.existsSync(dtoPath)) {
        fs.mkdirSync(dtoPath, { recursive: true });
      }
      await this.generateFile(
        path.join(templatesPath, 'dto/create.dto.mst'),
        path.join(dtoPath, `create-${fileName}.dto.ts`),
        { entity, entityName, generationOptions }
      );
      await this.generateFile(
        path.join(templatesPath, 'dto/update.dto.mst'),
        path.join(dtoPath, `update-${fileName}.dto.ts`),
        { entity, entityName, generationOptions }
      );
      await this.generateFile(
        path.join(templatesPath, 'dto/pagination.dto.mst'),
        path.join(dtoPath, `pagination-${fileName}.dto.ts`),
        { entity, entityName, generationOptions }
      );

      await this.generateFile(
        path.join(templatesPath, 'service.mst'),
        path.join(modulePath, `${fileName}.service.ts`),
        { entity, entityName, generationOptions }
      );

      await this.generateFile(
        path.join(templatesPath, 'controller.mst'),
        path.join(modulePath, `${fileName}.controller.ts`),
        { entity, entityName, generationOptions }
      );

      await this.generateFile(
        path.join(templatesPath, 'module.mst'),
        path.join(modulePath, `${fileName}.module.ts`),
        { entity, entityName, generationOptions }
      );
    }
  }

  private async generateFile(templatePath: string, outputPath: string, data: any) {
    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(template, { noEscape: true });
    const rendered = compiledTemplate(data);
    const prettierOptions ={ parser: "typescript", endOfLine: "auto" as const };
    let formatted:any = "";
    try {
        formatted = await Prettier.format(rendered, prettierOptions);
    } catch (error) {
        formatted = rendered;
    }
    fs.writeFileSync(outputPath, formatted, 'utf-8');
  }

  private registerHandlebarsHelpers(generationOptions: IGenerationOptions): void {
    Handlebars.registerHelper("json", (context) => {
      const json = JSON.stringify(context);
      const withoutQuotes = json.replace(/"([^(")"]+)":/g, "$1:");
      return withoutQuotes.slice(1, withoutQuotes.length - 1);
    });
    Handlebars.registerHelper("toEntityName", (str) => {
      if (str === undefined || str === null) {
        return '';
      }
      let retStr = "";
      switch (generationOptions.convertCaseEntity) {
        case "camel":
          retStr = changeCase.camelCase(str);
          break;
        case "pascal":
          retStr = changeCase.pascalCase(str);
          break;
        case "none":
          retStr = str;
          break;
        default:
          throw new Error("Unknown case style");
      }
      return retStr;
    });
    Handlebars.registerHelper("toFileName", (str) => {
      if (str === undefined || str === null) {
        return '';
      }
      let retStr = "";
      switch (generationOptions.convertCaseFile) {
        case "camel":
          retStr = changeCase.camelCase(str);
          break;
        case "param":
          retStr = changeCase.paramCase(str);
          break;
        case "pascal":
          retStr = changeCase.pascalCase(str);
          break;
        case "none":
          retStr = str;
          break;
        default:
          throw new Error("Unknown case style");
      }
      return retStr;
    });
    Handlebars.registerHelper("printPropertyVisibility", () =>
      generationOptions.propertyVisibility !== "none"
        ? `${generationOptions.propertyVisibility} `
        : ""
    );
    Handlebars.registerHelper("toPropertyName", (str) => {
      if (str === undefined || str === null) {
        return '';
      }
      let retStr = "";
      switch (generationOptions.convertCaseProperty) {
        case "camel":
          retStr = changeCase.camelCase(str);
          break;
        case "pascal":
          retStr = changeCase.pascalCase(str);
          break;
        case "snake":
          retStr = changeCase.snakeCase(str);
          break;
        case "none":
          retStr = str;
          break;
        default:
          throw new Error("Unknown case style");
      }
      return retStr;
    });
    Handlebars.registerHelper("toRelation",
      (entityType, relationType) => {
        let retVal = entityType;
        if (relationType === "ManyToMany" || relationType === "OneToMany") {
          retVal = `${retVal}[]`;
        }
        if (generationOptions.lazy) {
          retVal = `Promise<${retVal}>`;
        }
        return retVal;
      }
    );
    Handlebars.registerHelper("defaultExport", () =>
      generationOptions.exportType === "default" ? "default" : ""
    );
    Handlebars.registerHelper("localImport", (entityName) =>
      generationOptions.exportType === "default"
        ? entityName
        : `{${entityName}}`
    );
    Handlebars.registerHelper("strictMode", () =>
      generationOptions.strictMode !== "none"
        ? generationOptions.strictMode
        : ""
    );
    Handlebars.registerHelper({
      and: (v1, v2) => v1 && v2,
      eq: (v1, v2) => v1 === v2,
      gt: (v1, v2) => v1 > v2,
      gte: (v1, v2) => v1 >= v2,
      lt: (v1, v2) => v1 < v2,
      lte: (v1, v2) => v1 <= v2,
      ne: (v1, v2) => v1 !== v2,
      or: (v1, v2) => v1 || v2,
    });
    Handlebars.registerHelper('toColumnProperty', (column) => {
      let propertyName = Handlebars.helpers.toPropertyName(column.tscName);
      if (column.isNullable) {
        propertyName += '?';
      }
      return propertyName;
    });
    Handlebars.registerHelper('toColumnType', (column) => {
      let columnType = column.tscType;
      if (column.isArray) {
        columnType += '[]';
      }
      return columnType;
    });
    Handlebars.registerHelper('toSwaggerType', (column) => {
      switch (column.tscType) {
        case 'string':
          return 'String';
        case 'number':
          return 'Number';
        case 'boolean':
          return 'Boolean';
        default:
          return 'String'; // Default to String for other types
      }
    });
    Handlebars.registerHelper('toSwaggerFormat', (column) => {
      if (column.tscType === 'Date') {
        return 'date-time';
      }
      if (column.tscType === 'number' && column.dbType && column.dbType.includes('int')) {
        return 'int32';
      }
      return undefined; // No format for other types
    });
    Handlebars.registerHelper('isPrimaryKey', (column) => column.isPrimary);
    Handlebars.registerHelper('isGenerated', (column) => column.isGenerated);
  }
}
