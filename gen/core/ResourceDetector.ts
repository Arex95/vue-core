import { OpenAPISpec } from '../models/OpenAPISpec.js';

/**
 * Detects resource name from OpenAPI paths
 */
export class ResourceDetector {
  private spec: OpenAPISpec;

  constructor(spec: OpenAPISpec) {
    this.spec = spec;
  }

  detect(modelName: string): string {
    const paths = this.spec.getPaths();
    const possiblePaths = this.generatePossiblePaths(modelName);

    for (const path of possiblePaths) {
      if (paths[path]) {
        return this.extractResourceFromPath(path);
      }
    }

    // Si no se encuentra, usar el nombre del modelo en kebab-case
    return this.toKebabCase(modelName);
  }

  private generatePossiblePaths(modelName: string): string[] {
    const kebab = this.toKebabCase(modelName);
    return [
      `/${kebab}`,
      `/${kebab}s`,
      `/${modelName.toLowerCase()}`,
      `/${modelName.toLowerCase()}s`
    ];
  }

  private extractResourceFromPath(path: string): string {
    return path.replace(/^\//, '').split('/')[0];
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }
}

