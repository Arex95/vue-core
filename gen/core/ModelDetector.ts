import { Model } from '../models/Model.js';
import { Schema } from '../models/Schema.js';
import { ResourceDetector } from './ResourceDetector.js';
import { OpenAPISpec } from '../models/OpenAPISpec.js';

/**
 * Detects models from OpenAPI schemas
 * Groups related types (UserCreate, UserUpdate) under the main model (User)
 */
export class ModelDetector {
  private spec: OpenAPISpec;

  constructor(spec: OpenAPISpec) {
    this.spec = spec;
  }

  detect(): Model[] {
    const schemas = this.spec.getSchemas();
    const modelsMap = new Map<string, Model>();
    const processedSchemas = new Set<string>();

    // Primero detectar modelos principales (los que tienen paths asociados)
    const paths = this.spec.getPaths();
    const mainModelNames = this.detectMainModels(paths, schemas);

    // Crear modelos principales
    for (const modelName of mainModelNames) {
      if (schemas[modelName]) {
        const schemaObj = schemas[modelName] as {
          type?: string;
          properties?: Record<string, unknown>;
          required?: string[];
          description?: string;
        };

        if (schemaObj.type === 'object' || !schemaObj.type) {
          const schema = new Schema(modelName, schemaObj);
          const resource = this.detectResource(modelName);
          const model = new Model(modelName, schema, resource);
          modelsMap.set(modelName, model);
          processedSchemas.add(modelName);
        }
      }
    }

    // Agrupar DTOs relacionados bajo el modelo principal
    for (const [schemaName, rawSchema] of Object.entries(schemas)) {
      if (processedSchemas.has(schemaName)) {
        continue;
      }

      const schemaObj = rawSchema as {
        type?: string;
        properties?: Record<string, unknown>;
        required?: string[];
        description?: string;
      };

      if (schemaObj.type === 'object' || !schemaObj.type) {
        // Detectar si es un DTO relacionado (ej: UserCreate, UserUpdate)
        const mainModelName = this.findMainModelForDTO(schemaName, mainModelNames);
        
        if (mainModelName) {
          // Es un DTO relacionado, agregarlo al modelo principal
          const model = modelsMap.get(mainModelName);
          if (model) {
            const schema = new Schema(schemaName, schemaObj);
            model.addRelatedType(schemaName, schema);
            processedSchemas.add(schemaName);
          }
        } else {
          // Es un modelo independiente (no tiene path pero tampoco es DTO relacionado)
          // Solo crear modelo si no tiene un modelo principal asociado
          const schema = new Schema(schemaName, schemaObj);
          const resource = this.detectResource(schemaName);
          const model = new Model(schemaName, schema, resource);
          modelsMap.set(schemaName, model);
          processedSchemas.add(schemaName);
        }
      }
    }

    return Array.from(modelsMap.values());
  }

  /**
   * Detecta modelos principales desde los paths
   * Ej: /users -> User, /products -> Product
   */
  private detectMainModels(
    paths: Record<string, unknown>,
    schemas: Record<string, unknown>
  ): string[] {
    const mainModels = new Set<string>();

    for (const path of Object.keys(paths)) {
      // Extraer el primer segmento del path (ej: /users -> users)
      const resource = path.replace(/^\//, '').split('/')[0];
      
      // Convertir resource a modelo (users -> User)
      const modelName = this.resourceToModelName(resource);
      
      // Verificar que el schema existe
      if (schemas[modelName]) {
        mainModels.add(modelName);
      }
    }

    return Array.from(mainModels);
  }

  /**
   * Convierte resource name a model name
   * Ej: users -> User, user-profiles -> UserProfile
   */
  private resourceToModelName(resource: string): string {
    // Remover pluralización común
    let modelName = resource;
    if (modelName.endsWith('s')) {
      modelName = modelName.slice(0, -1);
    }
    
    // Convertir kebab-case a PascalCase
    return modelName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Encuentra el modelo principal para un DTO
   * Ej: UserCreate -> User, UserUpdate -> User
   */
  private findMainModelForDTO(
    dtoName: string,
    mainModelNames: string[]
  ): string | null {
    // Buscar si el DTO empieza con el nombre de algún modelo principal
    for (const modelName of mainModelNames) {
      if (dtoName.startsWith(modelName)) {
        // Verificar que no sea el mismo (ej: User no es DTO de User)
        if (dtoName !== modelName) {
          return modelName;
        }
      }
    }
    return null;
  }

  private detectResource(modelName: string): string {
    const resourceDetector = new ResourceDetector(this.spec);
    return resourceDetector.detect(modelName);
  }
}

