import { BaseGenerator } from './BaseGenerator.js';
import { Model } from '../models/Model.js';

/**
 * Generates TypeScript Service classes that extend RestStd
 */
export class ServiceGenerator extends BaseGenerator {
  generate(model: Model): string {
    const imports = this.generateImports(model);
    const className = this.getClassName(model);
    const resource = model.resource;
    const documentation = this.generateDocumentation(className, resource);
    const classBody = this.generateClassBody(resource);

    return `${imports}

${documentation}
export class ${className} extends RestStd {
${classBody}
}`;
  }

  private generateImports(model: Model): string {
    const typeImports = model.getDTOs()
      .map(dtoName => `import { ${dtoName} } from '../types/${dtoName}';`)
      .join('\n');
    return `import { RestStd } from '@arex95/vue-core';
${typeImports}`;
  }

  private generateDocumentation(className: string, resource: string): string {
    return `/**
 * @generated from OpenAPI
 * Auto-generated service
 * 
 * Métodos estándar RESTful disponibles automáticamente desde RestStd:
 * - ${className}.getAll<T[]>({ params }) → GET /${resource}
 * - ${className}.getOne<T>({ id }) → GET /${resource}/{id}
 * - ${className}.create<T>({ data }) → POST /${resource}
 * - ${className}.update<T>({ id, data }) → PUT /${resource}/{id}
 * - ${className}.delete({ id }) → DELETE /${resource}/{id}
 */`;
  }

  private generateClassBody(resource: string): string {
    return `  static override resource = '${resource}';`;
  }

  private getClassName(model: Model): string {
    return `${model.name}Service`;
  }
}

