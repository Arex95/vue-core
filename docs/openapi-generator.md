# Generador de Código desde OpenAPI

El generador de código toma un spec OpenAPI y genera automáticamente tipos TypeScript y servicios que extienden `RestStd`.

## Características

- ✅ **Generación automática** de tipos TypeScript desde schemas OpenAPI
- ✅ **Servicios listos** que extienden `RestStd`
- ✅ **Agrupación inteligente** de DTOs relacionados (UserCreate, UserUpdate bajo User)
- ✅ **Estructura organizada** con carpetas `types/` y `services/`
- ✅ **TypeScript puro** - Sin dependencias externas en el código generado

## Instalación

El generador está incluido en el repositorio. No requiere instalación adicional.

## Uso Básico

### 1. Compilar el generador

```bash
cd gen
npx tsc
```

### 2. Ejecutar el generador

```bash
# Desde la raíz del proyecto
node gen/dist/index.js openapi.json output
```

**Parámetros:**
- `openapi.json` - Ruta al archivo OpenAPI spec (JSON)
- `output` - Directorio donde se generarán los archivos

### 3. Ejemplo completo

```bash
# Compilar
cd gen && npx tsc && cd ..

# Generar código
node gen/dist/index.js openapi.example.json src/generated
```

## Estructura de Archivos Generados

Para cada modelo detectado, el generador crea:

```
output/
├── user/
│   ├── types/
│   │   ├── User.ts          # Tipo principal
│   │   ├── UserCreate.ts    # DTO para crear
│   │   └── UserUpdate.ts   # DTO para actualizar
│   └── services/
│       └── UserService.ts   # Servicio RestStd
├── product/
│   ├── types/
│   │   └── Product.ts
│   └── services/
│       └── ProductService.ts
```

## Ejemplo de Código Generado

### Tipo (`user/types/User.ts`)

```typescript
/**
 * @generated from OpenAPI schema: User
 */
export interface User {
  id: number;
  name: string;
  email: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Servicio (`user/services/UserService.ts`)

```typescript
import { RestStd } from '@arex95/vue-core';

/**
 * @generated from OpenAPI
 * Auto-generated service
 * 
 * Métodos estándar RESTful disponibles automáticamente desde RestStd:
 * - UserService.getAll<T[]>({ params }) → GET /users
 * - UserService.getOne<T>({ id }) → GET /users/{id}
 * - UserService.create<T>({ data }) → POST /users
 * - UserService.update<T>({ id, data }) → PUT /users/{id}
 * - UserService.delete({ id }) → DELETE /users/{id}
 */
export class UserService extends RestStd {
  static override resource = 'users';
}
```

## Uso en tu Código

### Importar tipos y servicios

```typescript
import { UserService } from '@/generated/user/services/UserService';
import { User, UserCreate, UserUpdate } from '@/generated/user/types';
```

### Usar con Vue Query

```typescript
import { useQuery, useMutation } from '@tanstack/vue-query';
import { UserService } from '@/generated/user/services/UserService';
import { User, UserCreate } from '@/generated/user/types';

// Query - Obtener todos los usuarios
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: () => UserService.getAll<User[]>()
});

// Query - Obtener un usuario
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => UserService.getOne<User>({ id: userId })
});

// Mutation - Crear usuario
const createMutation = useMutation({
  mutationFn: (data: UserCreate) => 
    UserService.create<User, UserCreate>({ data })
});

// Mutation - Actualizar usuario
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
    UserService.update<User, UserUpdate>({ id, data })
});

// Mutation - Eliminar usuario
const deleteMutation = useMutation({
  mutationFn: (id: number) => UserService.delete({ id })
});
```

## Detección de Modelos

El generador detecta modelos de dos formas:

### 1. Modelos Principales (desde paths)

Los modelos principales se detectan desde los paths del OpenAPI:

```json
{
  "paths": {
    "/users": { ... },      // → Detecta modelo "User"
    "/products": { ... }    // → Detecta modelo "Product"
  }
}
```

### 2. DTOs Relacionados (desde schemas)

Los DTOs relacionados se agrupan bajo el modelo principal:

```json
{
  "components": {
    "schemas": {
      "User": { ... },           // → Modelo principal
      "UserCreate": { ... },     // → Agrupado bajo User
      "UserUpdate": { ... }      // → Agrupado bajo User
    }
  }
}
```

**Reglas de agrupación:**
- Si un schema empieza con el nombre del modelo principal → Se agrupa bajo ese modelo
- Ejemplo: `UserCreate` y `UserUpdate` se agrupan bajo `User`
- Todos los tipos relacionados se generan en la misma carpeta `types/`

## Mapeo de Tipos OpenAPI → TypeScript

| OpenAPI | TypeScript |
|---------|-----------|
| `type: integer` | `number` |
| `type: number` | `number` |
| `type: string` | `string` |
| `type: boolean` | `boolean` |
| `type: array` | `T[]` |
| `$ref: '#/components/schemas/User'` | `User` |

### Campos Opcionales

Los campos que **no** están en `required` se marcan como opcionales:

```typescript
export interface User {
  id: number;        // requerido
  name: string;      // requerido
  email?: string;    // opcional (no está en required)
}
```

## Limitaciones del MVP

**Solo incluye:**
- ✅ Parsear OpenAPI JSON
- ✅ Generar tipos básicos (string, number, boolean, array)
- ✅ Generar servicios básicos con `resource` definido
- ✅ Agrupar DTOs relacionados bajo el modelo principal

**No incluye (futuro):**
- ❌ Soporte para YAML (solo JSON por ahora)
- ❌ Schemas complejos (oneOf, allOf, anyOf)
- ❌ Validaciones automáticas
- ❌ Métodos custom para endpoints NO estándar
- ❌ Query builders
- ❌ Documentación avanzada

## Requisitos del OpenAPI Spec

El spec debe cumplir:

1. **Versión OpenAPI 3.0+**
   ```json
   {
     "openapi": "3.0.0"
   }
   ```

2. **Paths definidos**
   ```json
   {
     "paths": {
       "/users": { ... }
     }
   }
   ```

3. **Schemas definidos**
   ```json
   {
     "components": {
       "schemas": {
         "User": { ... }
       }
     }
   }
   ```

## Ejemplo de OpenAPI Spec Mínimo

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "API",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "get": {
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/User"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "required": ["id", "name"],
        "properties": {
          "id": { "type": "integer" },
          "name": { "type": "string" },
          "email": { "type": "string" }
        }
      }
    }
  }
}
```

## Troubleshooting

### Error: "Invalid OpenAPI spec"

Verifica que tu spec tenga:
- Campo `openapi` con versión
- Campo `paths` con al menos un path
- Campo `components.schemas` con al menos un schema

### Los DTOs no se agrupan correctamente

Asegúrate de que los nombres de los DTOs sigan la convención:
- `UserCreate` → Se agrupa bajo `User`
- `UserUpdate` → Se agrupa bajo `User`
- El modelo principal debe tener un path asociado (`/users`)

### Los tipos no se generan correctamente

Verifica que los schemas sean de tipo `object`:
```json
{
  "User": {
    "type": "object",  // ← Requerido
    "properties": { ... }
  }
}
```

## Próximos Pasos

Después de generar el código:

1. **Configurar el fetcher** (si es necesario):
   ```typescript
   import { createAxiosFetcher } from '@arex95/vue-core';
   import axios from 'axios';
   
   const axiosInstance = axios.create({ baseURL: 'https://api.example.com' });
   
   UserService.fetchFn = createAxiosFetcher(axiosInstance);
   ```

2. **Usar en componentes** con Vue Query (ver ejemplos arriba)

3. **Personalizar** los servicios si necesitas métodos adicionales

## Referencias

- [RestStd API Reference](./api-reference.md) - Documentación completa de RestStd
- [Getting Started](./getting-started.md) - Guía de inicio con RestStd
- [MVP Requirements](../lab/mvp-requirements.md) - Requerimientos técnicos del generador

