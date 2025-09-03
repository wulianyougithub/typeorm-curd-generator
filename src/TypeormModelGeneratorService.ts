import * as Handlebars from "handlebars";
import * as Prettier from "prettier";
import * as path from "path";
import * as fs from "fs";
import * as changeCase from "change-case";
import { createDriver, dataCollectionPhase } from "./Engine";
import IConnectionOptions from "./IConnectionOptions";
import IGenerationOptions from "./IGenerationOptions";
import { Entity } from "./models/Entity";
import modelCustomizationPhase from "./ModelCustomization";
import { DataTypeDefaults } from "typeorm/driver/types/DataTypeDefaults";

function registerHandlebarsHelpers(generationOptions: IGenerationOptions): void {
    Handlebars.registerHelper("json", (context) => {
        const json = JSON.stringify(context);
        const withoutQuotes = json.replace(/"([^(")"]+)":/g, "$1:");
        return withoutQuotes.slice(1, withoutQuotes.length - 1);
    });
    Handlebars.registerHelper("toEntityName", (str) => {
        // 安全检查：确保 str 参数存在且是字符串
        if (!str || typeof str !== 'string') {
            console.warn('Warning: toEntityName received invalid input:', str);
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
        // 安全检查：确保 str 参数存在且是字符串
        if (!str || typeof str !== 'string') {
            console.warn('Warning: toFileName received invalid input:', str);
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
        // 安全检查：确保 str 参数存在且是字符串
        if (!str || typeof str !== 'string') {
            console.warn('Warning: toPropertyName received invalid input:', str);
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
            case "none":
                retStr = str;
                break;
            case "snake":
                retStr = changeCase.snakeCase(str);
                break;
            default:
                throw new Error("Unknown case style");
        }
        return retStr;
    });
    Handlebars.registerHelper(
        "toRelation",
        (entityType, relationType) => {
            // 安全检查：确保 entityType 参数存在且是字符串
            if (!entityType || typeof entityType !== 'string') {
                console.warn('Warning: toRelation received invalid entityType:', entityType);
                return '';
            }
            
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
    Handlebars.registerHelper("localImport", (entityName) => {
        // 安全检查：确保 entityName 参数存在且是字符串
        if (!entityName || typeof entityName !== 'string') {
            console.warn('Warning: localImport received invalid entityName:', entityName);
            return '';
        }
        
        return generationOptions.exportType === "default"
            ? entityName
            : `{${entityName}}`;
    });
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
    Handlebars.registerHelper('toSwaggerType', (column) => {
      switch (column.tscType) {
        case 'string':
          return 'String';
        case 'number':
          return 'Number';
        case 'boolean':
          return 'Boolean';
        default:
          return 'String';
      }
    });
    Handlebars.registerHelper('toSwaggerFormat', (column) => {
      if (column.tscType === 'Date') {
        return 'date-time';
      }
      if (column.tscType === 'number' && column.dbType && column.dbType.includes('int')) {
        return 'int32';
      }
      return '' ;
    });
    Handlebars.registerHelper('isGenerated', (column) => column.isGenerated);
    Handlebars.registerHelper('escapeNewlines', (text) => {
      if (typeof text === 'string') {
        return text.replace(/\r\n|\n/g, '\\n');
      }
      return text;
    });
}

export class TypeormModelGeneratorService {
    /**
     * 获取符合 TypeORM 规范的 entity 数据（不生成文件）,是模版数据,后期可用于渲染模板
     * @param connectionOptions 数据库连接配置
     * @param generationOptions 生成配置（可选，默认即可）
     * @returns Promise<Entity[]>
     */
    async getEntities(connectionOptions: IConnectionOptions, generationOptions?: Partial<IGenerationOptions>): Promise<Entity[]> {
        const defaultGenerationOptions = require("./IGenerationOptions").getDefaultGenerationOptions();
        const mergedGenerationOptions = { ...defaultGenerationOptions, ...generationOptions };
        const driver = createDriver(connectionOptions.databaseType);
        let dbModel = await dataCollectionPhase(driver, connectionOptions, mergedGenerationOptions);
        if(!connectionOptions.includeRelatedTables)dbModel=this.unIncludeRelations(dbModel)
        // 经过 modelCustomizationPhase 处理，返回符合 TypeORM 规范的数据
        return modelCustomizationPhase(dbModel, mergedGenerationOptions, driver.defaultValues as DataTypeDefaults);
    }

    /**
     * 获取指定表的 entity 源码内容,
     * @param connectionOptions 数据库连接配置
     * @param generationOptions 生成配置（可选，默认即可）
     * @returns Promise<{ [fileName: string]: string }>
     */
    async getEntitySource(connectionOptions: IConnectionOptions, generationOptions?: Partial<IGenerationOptions>): Promise<{ [fileName: string]: string }> {
        const defaultGenerationOptions = require("./IGenerationOptions").getDefaultGenerationOptions();
        const mergedGenerationOptions = { ...defaultGenerationOptions, ...generationOptions };
        const driver = createDriver(connectionOptions.databaseType);
        const dbModel = await dataCollectionPhase(driver, connectionOptions, mergedGenerationOptions);
        if(!connectionOptions.includeRelatedTables)this.unIncludeRelations(dbModel)
        const customizedModel = modelCustomizationPhase(dbModel, mergedGenerationOptions, driver.defaultValues as DataTypeDefaults);
        // 注册 handlebars helpers
        registerHandlebarsHelpers(mergedGenerationOptions);
        // 渲染模板
        const entityTemplatePath = path.resolve(__dirname, "templates", "entity.mst");
        const entityTemplate = fs.readFileSync(entityTemplatePath, "utf-8");
        const entityCompliedTemplate = Handlebars.compile(entityTemplate, { noEscape: true });
        const prettierOptions = { parser: "typescript", endOfLine: "auto" as const };
        const result: { [fileName: string]: string } = {};
        for (const entity of customizedModel) {
            // Ensure template receives generationOptions for flags like addSwaggerIdentifier
            const rendered = entityCompliedTemplate({
                ...entity,
                generationOptions: mergedGenerationOptions,
            });
            const fileName = changeCase.paramCase(entity.tscName);
            const modulePath = path.resolve(mergedGenerationOptions.resultsPath, fileName);
            const entityPath = path.join(modulePath, 'entity');
            if (!fs.existsSync(entityPath)) {
                fs.mkdirSync(entityPath, { recursive: true });
            }
            let formatted:any = "";
            try {
                formatted = await Prettier.format(rendered, prettierOptions);
            } catch (error) {
                formatted = rendered;
            }
            // Manually add ApiProperty import to the top of the file
            const finalContent = `${formatted}`;

            fs.writeFileSync(path.join(entityPath, `${fileName}.entity.ts`), finalContent,'utf-8');
            result[`${fileName}.entity.ts`] = finalContent;
        }
        return result;
    }
    /**
     * 获取指定表的 entity 源码内容,
     * @param connectionOptions 数据库连接配置
     * @param generationOptions 生成配置（可选，默认即可）
     * @returns Promise<{ [fileName: string]: string }>
     */
    async getEntitySourceCode(connectionOptions: IConnectionOptions, generationOptions?: Partial<IGenerationOptions>): Promise<{ [fileName: string]: string }> {
        const defaultGenerationOptions = require("./IGenerationOptions").getDefaultGenerationOptions();
        const mergedGenerationOptions = { ...defaultGenerationOptions, ...generationOptions };
        const driver = createDriver(connectionOptions.databaseType);
        const dbModel = await dataCollectionPhase(driver, connectionOptions, mergedGenerationOptions);
        if(!connectionOptions.includeRelatedTables)this.unIncludeRelations(dbModel)
        const customizedModel = modelCustomizationPhase(dbModel, mergedGenerationOptions, driver.defaultValues as DataTypeDefaults);
        // 注册 handlebars helpers
        registerHandlebarsHelpers(mergedGenerationOptions);
        // 渲染模板
        const entityTemplatePath = path.resolve(__dirname, "templates", "entity.mst");
        const entityTemplate = fs.readFileSync(entityTemplatePath, "utf-8");
        const entityCompliedTemplate = Handlebars.compile(entityTemplate, { noEscape: true });
        const prettierOptions = { parser: "typescript", endOfLine: "auto" as const };
        const result: { [fileName: string]: string } = {};
        for (const entity of customizedModel) {
            // Ensure template receives generationOptions for flags like addSwaggerIdentifier
            const rendered = entityCompliedTemplate({
                ...entity,
                generationOptions: mergedGenerationOptions,
            });
            const fileName = changeCase.paramCase(entity.tscName);
            const modulePath = path.resolve(mergedGenerationOptions.resultsPath, fileName);
            const entityPath = path.join(modulePath, 'entity');
           
            let formatted:any = "";
            try {
                formatted = await Prettier.format(rendered, prettierOptions);
            } catch (error) {
                formatted = rendered;
            }
            // Manually add ApiProperty import to the top of the file
            const finalContent = `${formatted}`;
            result[`${fileName}.entity.ts`] = finalContent;
        }
        return result;
    }

    /**
     * 生成指定表的 entity 文件
     * @param connectionOptions 数据库连接配置
     * @param generationOptions 生成配置（可选，默认即可）
     */
    async generateEntity(connectionOptions: IConnectionOptions, generationOptions?: Partial<IGenerationOptions>) {
        const defaultGenerationOptions = require("./IGenerationOptions").getDefaultGenerationOptions();
        const mergedGenerationOptions = { ...defaultGenerationOptions, ...generationOptions };
        const driver = createDriver(connectionOptions.databaseType);
        await require("./Engine").createModelFromDatabase(driver, connectionOptions, mergedGenerationOptions);
    }

    unIncludeRelations(entitys: Entity[]) {
        entitys.forEach(entity => {
            entity.columns.forEach(col=>{
                if(col.isUsedInRelationAsOwner)delete col.isUsedInRelationAsOwner
                if(col.isUsedInRelationAsReferenced) delete col.isUsedInRelationAsReferenced
            })
          entity.relationIds = []
          entity.relations = []
        })
        return entitys
      }
}
