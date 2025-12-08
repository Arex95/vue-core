import { Model } from '../models/Model.js';
import { Schema } from '../models/Schema.js';
import { ResourceDetector } from './ResourceDetector.js';
import { OpenAPISpec } from '../models/OpenAPISpec.js';

/**
 * Detects models from OpenAPI schemas
 */
export class ModelDetector {
  private spec: OpenAPISpec;

  constructor(spec: OpenAPISpec) {
    this.spec = spec;
  }

  detect(): Model[] {
    const schemas = this.spec.getSchemas();
    const models: Model[] = [];

    for (const [name, rawSchema] of Object.entries(schemas)) {
      const schemaObj = rawSchema as {
        type?: string;
        properties?: Record<string, unknown>;
        required?: string[];
        description?: string;
      };

      // Solo procesar schemas de tipo object (modelos)
      if (schemaObj.type === 'object' || !schemaObj.type) {
        const schema = new Schema(name, schemaObj);
        const resource = this.detectResource(name);
        const model = new Model(name, schema, resource);
        models.push(model);
      }
    }

    return models;
  }

  private detectResource(modelName: string): string {
    const resourceDetector = new ResourceDetector(this.spec);
    return resourceDetector.detect(modelName);
  }
}

