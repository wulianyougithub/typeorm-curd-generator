import { Injectable } from '@nestjs/common';
import { TypeormModelGeneratorService } from "./TypeormModelGeneratorService";
import { CrudGeneratorService } from "./CrudGenerator";
import { FileArchiverService } from "./file-archiver.service";
import IConnectionOptions from './IConnectionOptions';
import IGenerationOptions from './IGenerationOptions';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class GenerateService {
  constructor(
    private readonly typeormModelGeneratorService: TypeormModelGeneratorService,
    private readonly crudGeneratorService: CrudGeneratorService,
    private readonly fileArchiverService: FileArchiverService,
  ) {}

  async generateCrud(connectionOptions: IConnectionOptions, generationOptions?: Partial<IGenerationOptions>) {
    const entities = await this.typeormModelGeneratorService.getEntities(connectionOptions, generationOptions);
    const entitySource = await this.typeormModelGeneratorService.getEntitySource(connectionOptions, generationOptions)
    const defaultGenerationOptions = require("./IGenerationOptions").getDefaultGenerationOptions();
    const mergedGenerationOptions = { ...defaultGenerationOptions, ...generationOptions };
    await this.crudGeneratorService.generateCrudFiles(entities, mergedGenerationOptions);
  }

  async generateAndArchiveCrud(connectionOptions: IConnectionOptions, generationOptions?: Partial<IGenerationOptions>) {
    await this.generateCrud(connectionOptions, generationOptions);

    const defaultGenerationOptions = require("./IGenerationOptions").getDefaultGenerationOptions();
    const mergedGenerationOptions = { ...defaultGenerationOptions, ...generationOptions };
    const outputPath = mergedGenerationOptions.resultsPath; // The directory where files are generated

    const zipFileName = `generated-crud-${Date.now()}.zip`;
    const zipFilePath = await this.fileArchiverService.createZipArchive(outputPath, zipFileName);

    // 删除生成的文件目录
    try {
      if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath, { recursive: true, force: true });
        console.log(`✅ 已删除生成的文件目录: ${outputPath}`);
      }
    } catch (error) {
      console.warn(`⚠️  删除文件目录时出现警告: ${error.message}`);
    }

    return zipFilePath;
  }
  async generateSourceCode(connectionOptions: IConnectionOptions, generationOptions?: Partial<IGenerationOptions>) {
    const entitySource = await this.typeormModelGeneratorService.getEntitySource(connectionOptions, generationOptions)
    const entity=await this.typeormModelGeneratorService.getEntities(connectionOptions, generationOptions)
    console.log('entity',entity)
    const defaultGenerationOptions = require("./IGenerationOptions").getDefaultGenerationOptions();
    const mergedGenerationOptions = { ...defaultGenerationOptions, ...generationOptions };
    const crudSource = await this.crudGeneratorService.generateSourceCode(entity, mergedGenerationOptions)
    console.log('crudSource',crudSource)
    return {entitySource,crudSource};
  }
}
