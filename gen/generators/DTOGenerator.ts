import { BaseGenerator } from './BaseGenerator.js';
import { Model } from '../models/Model.js';

/**
 * Generates TypeScript DTO interfaces
 */
export class DTOGenerator extends BaseGenerator {
  generate(model: Model): string {
    const schema = model.schema;
    const name = model.name;

    const fields = this.generateFields(schema);
    const comment = this.generateComment(name);

    return `${comment}
export interface ${name} {
${fields}
}`;
  }

  private generateFields(schema: {
    getProperties(): Record<string, unknown>;
    isRequired(fieldName: string): boolean;
  }): string {
    const properties = schema.getProperties();
    const fields: string[] = [];

    for (const [name, prop] of Object.entries(properties)) {
      const field = this.generateField(name, prop as {
        type?: string;
        items?: {
          $ref?: string;
          type?: string;
        };
        $ref?: string;
      }, schema);
      fields.push(field);
    }

    return fields.join('\n');
  }

  private generateField(
    name: string,
    prop: {
      type?: string;
      items?: {
        $ref?: string;
        type?: string;
      };
      $ref?: string;
    },
    schema: {
      isRequired(fieldName: string): boolean;
    }
  ): string {
    const type = this.mapOpenAPITypeToTS(prop);
    const optional = schema.isRequired(name) ? '' : '?';
    return `  ${name}${optional}: ${type};`;
  }

  private generateComment(name: string): string {
    return `/**
 * @generated from OpenAPI schema: ${name}
 */`;
  }
}

