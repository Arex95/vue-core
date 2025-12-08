/**
 * Validates OpenAPI specification structure
 */
export class SpecValidator {
  static validate(spec: {
    openapi?: string;
    components?: {
      schemas?: Record<string, unknown>;
    };
    paths?: Record<string, unknown>;
  }): boolean {
    const errors: string[] = [];

    if (!spec.openapi) {
      errors.push('Missing "openapi" field');
    }

    if (!spec.components?.schemas) {
      errors.push('Missing "components.schemas"');
    }

    if (!spec.paths) {
      errors.push('Missing "paths"');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid OpenAPI spec:\n${errors.join('\n')}`);
    }

    return true;
  }
}

