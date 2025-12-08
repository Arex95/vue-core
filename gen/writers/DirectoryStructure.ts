import { Model } from '../models/Model.js';

/**
 * Manages directory structure for generated files
 */
export class DirectoryStructure {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  createModelStructure(model: Model): {
    typesDir: string;
    servicesDir: string;
  } {
    return {
      typesDir: `${model.folderName}/types`,
      servicesDir: `${model.folderName}/services`
    };
  }

  getTypeFilePath(model: Model, typeName: string): string {
    return `${model.folderName}/types/${typeName}.ts`;
  }

  getServiceFilePath(model: Model): string {
    return `${model.folderName}/services/${model.name}Service.ts`;
  }
}

