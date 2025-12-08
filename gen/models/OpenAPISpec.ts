/**
 * Represents an OpenAPI specification
 */
export class OpenAPISpec {
  public readonly openapi: string;
  public readonly info: Record<string, unknown>;
  public readonly paths: Record<string, unknown>;
  public readonly components: {
    schemas?: Record<string, unknown>;
  };
  public readonly schemas: Record<string, unknown>;

  constructor(rawSpec: {
    openapi: string;
    info?: Record<string, unknown>;
    paths?: Record<string, unknown>;
    components?: {
      schemas?: Record<string, unknown>;
    };
  }) {
    this.openapi = rawSpec.openapi;
    this.info = rawSpec.info || {};
    this.paths = rawSpec.paths || {};
    this.components = rawSpec.components || {};
    this.schemas = this.components.schemas || {};
  }

  getSchemas(): Record<string, unknown> {
    return this.schemas;
  }

  getPaths(): Record<string, unknown> {
    return this.paths;
  }

  hasSchema(name: string): boolean {
    return name in this.schemas;
  }

  getSchema(name: string): unknown {
    return this.schemas[name];
  }
}

