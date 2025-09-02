import { EOL } from "os";

import path = require("path");

// TODO: change name

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
/**
 * 生成 entity 与 CRUD 的配置项说明
 *
 * 基础约定
 * - resultsPath: 生成结果输出目录
 * - pluralizeNames: 是否对实体名做复数化处理
 * - convertCaseFile/Entity/Property: 大小写转换策略（文件/类名/属性名）
 * - convertEol: 行尾风格（LF/CRLF）
 * - propertyVisibility: 成员可见性（public/protected/private/none）
 * - lazy: 关系是否使用懒加载（Promise<T>）
 * - activeRecord: 是否继承 BaseEntity
 * - generateConstructor: 是否生成基于 Partial<T> 的构造函数
 * - customNamingStrategyPath: 自定义命名策略路径
 * - relationIds: 是否生成 RelationId 字段
 * - strictMode: 严格模式标记（none/?/!），影响可空/必填的类型标注
 * - skipSchema: 是否忽略 schema
 * - indexFile: 是否生成索引文件
 * - exportType: 导出类型（named/default）
 *
 * 权限相关（controller 路由权限装饰器）
 * - addPermissionIdentifier: 开启后在控制器每个路由上输出权限装饰器
 * - permissionIdentifier: 权限装饰器标识（默认 @permission），会按如下形式输出：
 *   @permission('prefix:entityCamel:operation')
 * - perMissionIdentifierPrefix: 权限前缀，一般用于系统域（如 'system'）
 * - operation 对应关系：
 *   add = 新增接口(@Post)
 *   remove = 删除接口(@Delete)
 *   list = 查询列表(@Get /paginate & @Get /)
 *   query = 查询详情(@Get :id)
 *   edit = 编辑/更新(@Patch :id 或 /upsert)
 *
 * 示例：
 * {
 *   addPermissionIdentifier: true,
 *   permissionIdentifier: '@permission',
 *   perMissionIdentifierPrefix: 'system'
 * }
 * 则列表接口会输出：
 *   @permission('system:exampleEntity:list')
 *
 * Swagger 开关（影响控制器、DTO、实体上的 Swagger 装饰器生成）
 * - addSwaggerIdentifier: 为 true 才输出 Swagger 相关导入与装饰器；为 false 将完全不依赖 @nestjs/swagger
 *   - 当为 false 时：
 *     * controller 不输出 ApiTags/ApiOperation/ApiResponse 等
 *     * Create/Pagination DTO 不输出 ApiProperty/ApiPropertyOptional
 *     * Entity 不输出 ApiProperty
 *     * Update DTO 将从 @nestjs/mapped-types 导入 PartialType 替代 swagger 版本
 */
export default interface IGenerationOptions {
    resultsPath: string;
    pluralizeNames: boolean;
    noConfigs: boolean;
    convertCaseFile: "pascal" | "param" | "camel" | "none";
    convertCaseEntity: "pascal" | "camel" | "none";
    convertCaseProperty: "pascal" | "camel" | "snake" | "none";
    convertEol: "LF" | "CRLF";
    propertyVisibility: "public" | "protected" | "private" | "none";
    lazy: boolean;
    activeRecord: boolean;
    generateConstructor: boolean;
    customNamingStrategyPath: string;
    relationIds: boolean;
    strictMode: "none" | "?" | "!";
    skipSchema: boolean;
    indexFile: boolean;
    exportType: "named" | "default";
    // permission options
    addPermissionIdentifier?: boolean;
    permissionIdentifier?: string;
    perMissionIdentifierPrefix?: string;
    // swagger options
    addSwaggerIdentifier?: boolean;
}

export const eolConverter = {
    LF: "\n",
    CRLF: "\r\n",
};

export function getDefaultGenerationOptions(): IGenerationOptions {
    const generationOptions: IGenerationOptions = {
        resultsPath: path.resolve(process.cwd(), "output"),
        pluralizeNames: true,
        noConfigs: false,
        convertCaseFile: "param",
        convertCaseEntity: "pascal",
        convertCaseProperty: "camel",
        convertEol: EOL === "\n" ? "LF" : "CRLF",
        propertyVisibility: "none",
        lazy: false,
        activeRecord: false,
        generateConstructor: false,
        customNamingStrategyPath: "",
        relationIds: false,
        strictMode: "none",
        skipSchema: false,
        indexFile: false,
        exportType: "named",
        // permission defaults
        addPermissionIdentifier: false,
        permissionIdentifier: "@permission",
        perMissionIdentifierPrefix: "",
        // swagger defaults
        addSwaggerIdentifier: false,
    };
    return generationOptions;
}
