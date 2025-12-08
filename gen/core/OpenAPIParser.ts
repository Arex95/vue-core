import * as fs from 'fs';
import { OpenAPISpec } from '../models/OpenAPISpec.js';
import { SpecValidator } from './SpecValidator.js';

/**
 * Parses OpenAPI JSON file
 */
export class OpenAPIParser {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  parse(): OpenAPISpec {
    try {
      const content = this.readFile();
      const rawSpec = this.parseJSON(content);
      SpecValidator.validate(rawSpec);
      return new OpenAPISpec(rawSpec);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse OpenAPI spec: ${message}`);
    }
  }

  private readFile(): string {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`File not found: ${this.filePath}`);
    }
    return fs.readFileSync(this.filePath, 'utf-8');
  }

  private parseJSON(content: string): {
    openapi: string;
    info?: Record<string, unknown>;
    paths?: Record<string, unknown>;
    components?: {
      schemas?: Record<string, unknown>;
    };
  } {
    try {
      return JSON.parse(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid JSON: ${message}`);
    }
  }
}

