import { BaseGenerator } from './BaseGenerator.js';
import { Model } from '../models/Model.js';
import { CustomEndpoint } from '../core/CustomEndpointDetector.js';

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
    const customMethods = this.generateCustomMethods(model, className);

    return `${imports}

${documentation}
export class ${className} extends RestStd {
${classBody}${customMethods}
}`;
  }

  private generateImports(model: Model): string {
    const restStdImport = `import { RestStd } from '@arex95/vue-core';`;
    
    // Detectar tipos usados en métodos custom
    const usedTypes = this.detectUsedTypes(model);
    
    if (usedTypes.length === 0) {
      return restStdImport;
    }
    
    // Generar imports de tipos
    const typeImports = usedTypes.map(typeName => {
      return `import { ${typeName} } from '../types/${typeName}';`;
    }).join('\n');
    
    return `${restStdImport}\n${typeImports}`;
  }

  /**
   * Detecta qué tipos se usan en los métodos custom
   */
  private detectUsedTypes(model: Model): string[] {
    const usedTypes = new Set<string>();
    
    for (const endpoint of model.customEndpoints) {
      // Tipo de respuesta
      const returnType = this.getReturnType(endpoint);
      if (returnType && returnType !== 'unknown') {
        usedTypes.add(returnType);
      }
      
      // Tipo de request body
      const requestType = this.getRequestType(endpoint);
      if (requestType && requestType !== 'unknown') {
        usedTypes.add(requestType);
      }
    }
    
    return Array.from(usedTypes).sort();
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

  private generateCustomMethods(model: Model, className: string): string {
    if (model.customEndpoints.length === 0) {
      return '';
    }

    const methods: string[] = [];

    for (const endpoint of model.customEndpoints) {
      const method = this.generateCustomMethod(endpoint, model);
      if (method) {
        methods.push(method);
      }
    }

    if (methods.length === 0) {
      return '';
    }

    return '\n\n' + methods.join('\n\n');
  }

  private generateCustomMethod(
    endpoint: CustomEndpoint,
    model: Model
  ): string {
    const methodName = this.getMethodName(endpoint);
    const params = this.getMethodParameters(endpoint);
    const returnType = this.getReturnType(endpoint);
    const requestType = this.getRequestType(endpoint);
    const url = endpoint.path;
    const method = endpoint.method;
    const summary = endpoint.summary || endpoint.operationId || `${method} ${url}`;

    // Intentar usar método estándar con url override si es posible
    if (this.canUseStandardMethod(endpoint)) {
      return this.generateStandardMethodOverride(endpoint, model, methodName, params, returnType, requestType, summary);
    }

    // Usar customRequest para casos extremos
    return this.generateCustomRequestMethod(endpoint, model, methodName, params, returnType, requestType, summary);
  }

  private canUseStandardMethod(endpoint: CustomEndpoint): boolean {
    const method = endpoint.method.toUpperCase();
    const path = endpoint.path.replace(/^\//, '');

    // Si el path es muy diferente al resource, usar customRequest
    if (!path.includes(endpoint.path.split('/')[0])) {
      return false;
    }

    // POST, PUT, PATCH pueden usar create/update con url override
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      return true;
    }

    // GET puede usar getAll/getOne con url override
    if (method === 'GET') {
      return true;
    }

    return false;
  }

  private generateStandardMethodOverride(
    endpoint: CustomEndpoint,
    model: Model,
    methodName: string,
    params: string,
    returnType: string,
    requestType: string,
    summary: string
  ): string {
    const method = endpoint.method.toUpperCase();
    const url = endpoint.path;

    let methodCall = '';
    if (method === 'GET') {
      // Determinar si es getAll o getOne basado en parámetros
      const hasIdParam = endpoint.parameters?.some(p => p.in === 'path');
      if (hasIdParam) {
        const idParam = endpoint.parameters?.find(p => p.in === 'path');
        methodCall = `this.getOne<${returnType}>({ id: ${idParam?.name}, url: '${url}' })`;
      } else {
        methodCall = `this.getAll<${returnType}>({ url: '${url}' })`;
      }
    } else if (method === 'POST') {
      if (endpoint.requestBody) {
        methodCall = `this.create<${returnType}, ${requestType}>({ data, url: '${url}' })`;
      } else {
        // POST sin body, usar customRequest
        methodCall = `this.customRequest<${returnType}>({ method: '${method}', url: '${url}' })`;
      }
    } else if (method === 'PUT' || method === 'PATCH') {
      const idParam = endpoint.parameters?.find(p => p.in === 'path');
      if (idParam) {
        methodCall = `this.update<${returnType}, ${requestType}>({ id: ${idParam.name}, data, url: '${url}' })`;
      } else {
        // PUT/PATCH sin id en path, usar customRequest
        methodCall = `this.customRequest<${returnType}>({ method: '${method}', url: '${url}', data })`;
      }
    } else if (method === 'DELETE') {
      const idParam = endpoint.parameters?.find(p => p.in === 'path');
      if (idParam) {
        methodCall = `this.delete({ id: ${idParam.name}, url: '${url}' })`;
      } else {
        methodCall = `this.customRequest<${returnType}>({ method: '${method}', url: '${url}' })`;
      }
    } else {
      methodCall = `this.customRequest<${returnType}>({ method: '${method}', url: '${url}'${params.includes('data') ? ', data' : ''} })`;
    }

    return `  /**
   * ${summary}
   * @generated from operationId: ${endpoint.operationId || 'custom'}
   */
  static ${methodName}(${params}): Promise<${returnType}> {
    return ${methodCall};
  }`;
  }

  private generateCustomRequestMethod(
    endpoint: CustomEndpoint,
    model: Model,
    methodName: string,
    params: string,
    returnType: string,
    requestType: string,
    summary: string
  ): string {
    const method = endpoint.method.toUpperCase();
    const url = endpoint.path;
    const hasData = ['POST', 'PUT', 'PATCH'].includes(method) && endpoint.requestBody;
    const hasQueryParams = endpoint.parameters?.some(p => p.in === 'query') || false;

    // Construir el objeto de opciones para customRequest
    const options: string[] = [];
    options.push(`method: '${method}'`);
    options.push(`url: '${url}'`);
    
    if (hasQueryParams) {
      options.push('params');
    }
    
    if (hasData) {
      options.push('data');
    }

    return `  /**
   * ${summary}
   * @generated from operationId: ${endpoint.operationId || 'custom'}
   * Custom endpoint (uses customRequest)
   */
  static ${methodName}(${params}): Promise<${returnType}> {
    return this.customRequest<${returnType}>({
      ${options.join(',\n      ')}
    });
  }`;
  }

  private getMethodName(endpoint: CustomEndpoint): string {
    if (endpoint.operationId) {
      // Convertir operationId a camelCase
      return this.toCamelCase(endpoint.operationId);
    }

    // Generar nombre desde path y method
    const pathParts = endpoint.path.split('/').filter(p => p && !p.match(/^{.*}$/));
    const lastPart = pathParts[pathParts.length - 1] || '';
    const method = endpoint.method.toLowerCase();

    // Ej: POST /api/v1/create-user -> createUser
    // Ej: POST /users/{id}/activate -> activateUser
    const name = lastPart || method;
    return this.toCamelCase(name);
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((word, index) => {
        if (index === 0) {
          return word.charAt(0).toLowerCase() + word.slice(1);
        }
        return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
      })
      .join('');
  }

  private getMethodParameters(endpoint: CustomEndpoint): string {
    const params: string[] = [];
    const seenParams = new Set<string>(); // Evitar parámetros duplicados

    // Path parameters
    const pathParams = endpoint.parameters?.filter(p => p.in === 'path') || [];
    for (const param of pathParams) {
      if (seenParams.has(param.name)) {
        continue; // Saltar si ya existe
      }
      seenParams.add(param.name);
      const type = this.mapParameterType(param.schema?.type || 'string');
      const optional = param.required === false ? '?' : '';
      params.push(`${param.name}${optional}: ${type}`);
    }

    // Query parameters (opcional, se pasan como objeto)
    const queryParams = endpoint.parameters?.filter(p => p.in === 'query') || [];
    if (queryParams.length > 0) {
      params.push('params?: Record<string, unknown>');
    }

    // Request body
    if (endpoint.requestBody) {
      const requestType = this.getRequestType(endpoint);
      params.push(`data: ${requestType}`);
    }

    return params.join(', ');
  }

  private mapParameterType(type?: string): string {
    if (!type) return 'string';
    if (type === 'integer' || type === 'number') return 'number';
    if (type === 'boolean') return 'boolean';
    return 'string';
  }

  private getReturnType(endpoint: CustomEndpoint): string {
    // Buscar respuesta 200 o 201
    const successResponse = endpoint.responses?.['200'] || endpoint.responses?.['201'];
    if (successResponse?.content?.['application/json']?.schema?.$ref) {
      const ref = successResponse.content['application/json'].schema.$ref;
      return this.extractTypeFromRef(ref);
    }
    return 'unknown';
  }

  private getRequestType(endpoint: CustomEndpoint): string {
    if (endpoint.requestBody?.content?.['application/json']?.schema?.$ref) {
      const ref = endpoint.requestBody.content['application/json'].schema.$ref;
      return this.extractTypeFromRef(ref);
    }
    return 'unknown';
  }

  private extractTypeFromRef(ref: string): string {
    return ref.split('/').pop() || 'unknown';
  }
}

