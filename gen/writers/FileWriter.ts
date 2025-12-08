import * as fs from 'fs';
import * as path from 'path';
import { DirectoryStructure } from './DirectoryStructure.js';
import { Model } from '../models/Model.js';

/**
 * Writes generated code to files
 */
export class FileWriter {
  private outputDir: string;
  private directoryStructure: DirectoryStructure;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    this.directoryStructure = new DirectoryStructure(outputDir);
  }

  write(filePath: string, content: string): void {
    const fullPath = path.join(this.outputDir, filePath);
    const dir = path.dirname(fullPath);

    this.ensureDirectoryExists(dir);
    fs.writeFileSync(fullPath, content, 'utf-8');
  }

  writeModel(
    model: Model,
    typeFiles: Map<string, string>,
    serviceCode: string
  ): void {
    const structure = this.directoryStructure;

    // Escribir todos los tipos
    for (const [typeName, typeCode] of typeFiles.entries()) {
      const typePath = structure.getTypeFilePath(model, typeName);
      this.write(typePath, typeCode);
    }

    // Escribir Service (solo uno por modelo principal)
    const servicePath = structure.getServiceFilePath(model);
    this.write(servicePath, serviceCode);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

