import { Schema } from './Schema.js';

/**
 * Represents a model with its schema and resource
 */
export class Model {
  public readonly name: string;
  public readonly schema: Schema;
  public readonly resource: string;
  public readonly folderName: string;
  public readonly relatedTypes: Map<string, Schema> = new Map();

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

  addRelatedType(name: string, schema: Schema): void {
    this.relatedTypes.set(name, schema);
  }

  getAllTypes(): string[] {
    const types = [this.name];
    for (const typeName of this.relatedTypes.keys()) {
      types.push(typeName);
    }
    return types;
  }

  getDTOs(): string[] {
    return this.getAllTypes();
  }
}

