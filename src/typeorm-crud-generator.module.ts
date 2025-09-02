import { Module } from '@nestjs/common';
import { TypeormModelGeneratorService } from './TypeormModelGeneratorService';
import { CrudGeneratorService } from './CrudGenerator';
import { GenerateService } from './GenerateService';
import { FileArchiverService } from './file-archiver.service';

@Module({
  providers: [
    TypeormModelGeneratorService,
    CrudGeneratorService,
    GenerateService,
    FileArchiverService,
  ],
  exports: [
    TypeormModelGeneratorService,
    CrudGeneratorService,
    GenerateService,
    FileArchiverService,
  ],
})
export class TypeormCrudGeneratorModule {}
