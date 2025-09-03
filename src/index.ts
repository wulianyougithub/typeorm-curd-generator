// Main service with core methods
export { GenerateService } from "./GenerateService";

// Module for NestJS integration
export { TypeormCrudGeneratorModule } from "./typeorm-crud-generator.module";

// Types and interfaces
export { default as IConnectionOptions } from "./IConnectionOptions";
export { default as IGenerationOptions } from "./IGenerationOptions";

export { getDefaultGenerationOptions } from "./IGenerationOptions";
export { getDefaultConnectionOptions } from "./IConnectionOptions";

// CLI entry point (only for internal use)
// export { cli } from "./cli";
