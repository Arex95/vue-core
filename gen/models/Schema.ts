/**
 * Represents an OpenAPI schema
 */
export class Schema {
  public readonly name: string;
  public readonly type?: string;
  public readonly properties: Record<string, unknown>;
  public readonly required: string[];
  public readonly description?: string;

  constructor(name: string, rawSchema: {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
    description?: string;
  }) {
    this.name = name;
    this.type = rawSchema.type;
    this.properties = rawSchema.properties || {};
    this.required = rawSchema.required || [];
    this.description = rawSchema.description;
  }

  getProperties(): Record<string, unknown> {
    return this.properties;
  }

  isRequired(fieldName: string): boolean {
    return this.required.includes(fieldName);
  }

  getPropertyType(fieldName: string): unknown {
    return this.properties[fieldName];
  }
}

