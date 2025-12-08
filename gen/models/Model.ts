import { Schema } from './Schema.js';

/**
 * Represents a model with its schema and resource
 */
export class Model {
  public readonly name: string;
  public readonly schema: Schema;
  public readonly resource: string;
  public readonly folderName: string;

  constructor(name: string, schema: Schema | {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
    description?: string;
  }, resource: string) {
    this.name = name;
    this.schema = schema instanceof Schema ? schema : new Schema(name, schema);
    this.resource = resource;
    this.folderName = this.toKebabCase(name);
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  getDTOs(): string[] {
    // Por ahora solo retornamos el DTO principal
    // En el futuro se pueden detectar UserCreate, UserUpdate, etc.
    return [this.name];
  }
}

