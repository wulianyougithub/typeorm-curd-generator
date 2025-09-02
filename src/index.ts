// Main service with core methods
export { GenerateService } from "./GenerateService";

// Module for NestJS integration
export { TypeormCrudGeneratorModule } from "./typeorm-crud-generator.module";

// Types and interfaces
export { default as IConnectionOptions } from "./IConnectionOptions";
export { default as IGenerationOptions } from "./IGenerationOptions";

// CLI entry point (only for internal use)
// export { cli } from "./cli";
