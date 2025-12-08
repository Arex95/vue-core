import { OpenAPISpec } from '../models/OpenAPISpec.js';

export interface CustomEndpoint {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: { type?: string };
  }>;
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: { $ref?: string };
      };
    };
  };
  responses?: Record<string, {
    content?: {
      'application/json'?: {
        schema?: { $ref?: string };
      };
    };
  }>;
}

/**
 * Detects custom endpoints that don't follow standard RESTful patterns
 */
export class CustomEndpointDetector {
  private spec: OpenAPISpec;
  private resource: string;

  constructor(spec: OpenAPISpec, resource: string) {
    this.spec = spec;
    this.resource = resource;
  }

  detect(): CustomEndpoint[] {
    const paths = this.spec.getPaths();
    const customEndpoints: CustomEndpoint[] = [];

    for (const [path, pathItem] of Object.entries(paths)) {
      // Verificar si el path pertenece a este resource
      if (!this.belongsToResource(path)) {
        continue;
      }

      const pathObj = pathItem as Record<string, unknown>;

      // Verificar cada método HTTP
      for (const [method, operation] of Object.entries(pathObj)) {
        if (!this.isHttpMethod(method)) {
          continue;
        }

        // Verificar si es un endpoint estándar RESTful
        if (this.isStandardRestfulEndpoint(path, method)) {
          continue; // Es estándar, saltarlo
        }

        // Es custom, agregarlo
        const op = operation as {
          operationId?: string;
          summary?: string;
          parameters?: Array<{
            name: string;
            in: string;
            required?: boolean;
            schema?: { type?: string };
          }>;
          requestBody?: {
            content?: {
              'application/json'?: {
                schema?: { $ref?: string };
              };
            };
          };
          responses?: Record<string, {
            content?: {
              'application/json'?: {
                schema?: { $ref?: string };
              };
            };
          }>;
        };

        // Extraer parámetros del path si existen
        const pathParams = this.extractPathParameters(path);
        const allParameters = [
          ...(op.parameters || []),
          ...pathParams,
        ];

        customEndpoints.push({
          path,
          method: method.toUpperCase(),
          operationId: op.operationId,
          summary: op.summary,
          parameters: allParameters,
          requestBody: op.requestBody,
          responses: op.responses,
        });
      }
    }

    return customEndpoints;
  }

  /**
   * Verifica si el path pertenece al resource
   * Ej: /users/{id} -> verifica si el primer segmento es "users"
   * Ej: /api/v1/create-user -> verifica si algún segmento contiene "user"
   */
  private belongsToResource(path: string): boolean {
    const normalizedPath = path.replace(/^\//, '').toLowerCase();
    const segments = normalizedPath.split('/').filter(s => s); // Filtrar segmentos vacíos
    
    if (segments.length === 0) {
      return false;
    }
    
    // Verificar si el primer segmento es exactamente el resource (caso estándar)
    const firstSegment = segments[0].replace(/{.*}/g, '');
    if (firstSegment === this.resource) {
      return true;
    }
    
    // Para paths no estándar, verificar si algún segmento contiene el resource
    // Manejar singular/plural (ej: "user" vs "users", "activate-user" contiene "user")
    const resourceSingular = this.resource.endsWith('s') 
      ? this.resource.slice(0, -1) 
      : this.resource;
    const resourcePlural = this.resource.endsWith('s')
      ? this.resource
      : `${this.resource}s`;
    
    for (const segment of segments) {
      const cleanSegment = segment.replace(/{.*}/g, '');
      
      // Match exacto
      if (cleanSegment === this.resource || cleanSegment === resourceSingular || cleanSegment === resourcePlural) {
        return true;
      }
      
      // Verificar si el segmento contiene el resource (ej: "activate-user" contiene "user")
      // Pero evitar matches incorrectos (ej: "products" no debe hacer match con "users")
      if ((cleanSegment.includes(this.resource) || 
           cleanSegment.includes(resourceSingular) || 
           cleanSegment.includes(resourcePlural)) && 
          cleanSegment.length >= Math.min(this.resource.length, resourceSingular.length)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Verifica si es un método HTTP válido
   */
  private isHttpMethod(method: string): boolean {
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
    return httpMethods.includes(method.toLowerCase());
  }

  /**
   * Extrae parámetros del path (ej: /users/{id} -> [{ name: 'id', in: 'path', required: true }])
   */
  private extractPathParameters(path: string): Array<{
    name: string;
    in: string;
    required: boolean;
    schema?: { type?: string };
  }> {
    const params: Array<{
      name: string;
      in: string;
      required: boolean;
      schema?: { type?: string };
    }> = [];
    
    const matches = path.matchAll(/{([^}]+)}/g);
    for (const match of matches) {
      const paramName = match[1];
      params.push({
        name: paramName,
        in: 'path',
        required: true,
        schema: { type: 'string' }, // Por defecto string, se puede mejorar
      });
    }
    
    return params;
  }

  /**
   * Verifica si es un endpoint estándar RESTful
   */
  private isStandardRestfulEndpoint(path: string, method: string): boolean {
    const normalizedPath = path.replace(/^\//, '').replace(/\/$/, '');
    const pathSegments = normalizedPath.split('/').filter(s => s);
    
    if (pathSegments.length === 0) {
      return false;
    }
    
    const resourceSegment = pathSegments[0].replace(/{.*}/g, '');

    // Verificar que el path empiece con el resource (exacto, no parcial)
    if (resourceSegment !== this.resource) {
      return false; // No pertenece a este resource
    }

    const methodUpper = method.toUpperCase();

    // GET /users → getAll (estándar)
    if (methodUpper === 'GET' && pathSegments.length === 1) {
      return true;
    }

    // GET /users/{id} → getOne (estándar)
    if (methodUpper === 'GET' && pathSegments.length === 2 && pathSegments[1].match(/^{.*}$/)) {
      return true;
    }

    // POST /users → create (estándar)
    if (methodUpper === 'POST' && pathSegments.length === 1) {
      return true;
    }

    // PUT /users/{id} → update (estándar)
    if (methodUpper === 'PUT' && pathSegments.length === 2 && pathSegments[1].match(/^{.*}$/)) {
      return true;
    }

    // PATCH /users/{id} → update (estándar)
    if (methodUpper === 'PATCH' && pathSegments.length === 2 && pathSegments[1].match(/^{.*}$/)) {
      return true;
    }

    // DELETE /users/{id} → delete (estándar)
    if (methodUpper === 'DELETE' && pathSegments.length === 2 && pathSegments[1].match(/^{.*}$/)) {
      return true;
    }

    // Cualquier otro caso es custom
    return false;
  }
}

