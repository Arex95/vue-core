# MVP: Generador de Código desde OpenAPI

## Objetivo

Crear un generador básico que tome un spec OpenAPI y genere:
1. **DTOs** (Data Transfer Objects) - Tipos TypeScript
2. **Servicios** - Clases que extienden `RestStd`

**Solo MVP - Funcionalidad básica**

---

## Requerimientos Funcionales

### 1. Parsear OpenAPI Spec

**Input:** Archivo `openapi.yaml` o `openapi.json`

**Proceso:**
- Leer archivo del sistema de archivos
- Parsear según formato:
  - **JSON**: `JSON.parse()` nativo (cero dependencias)
  - **YAML**: `js-yaml` (solo si es necesario)
- Validación básica manual:
  - Verificar que existe `openapi` (versión)
  - Verificar que existe `paths` (objeto)
  - Verificar que existe `components.schemas` (objeto)
- Extraer información necesaria

**Opciones de parseo:**

**MVP (Solo JSON):**
- Input **JSON**: Usar `JSON.parse()` nativo de JavaScript ✅
- Validación manual básica (verificar que tenga `openapi`, `paths`, `components.schemas`)
- **Cero dependencias externas**

**Después del MVP:**
- Soporte para YAML: `js-yaml` (ligera, ~200KB)
- Validación avanzada: `@apidevtools/swagger-parser` (si se necesita validación estricta y resolución de $ref complejos)

---

### 2. Detectar Modelos

**Del schema OpenAPI (`components.schemas`):**

```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id: { type: integer }
        name: { type: string }
        email: { type: string }
```

**Resultado:** Detecta modelo `User` y crea carpeta `users/`

**Reglas:**
- Cada schema en `components.schemas` es un modelo potencial
- Nombre del modelo = nombre del schema (ej: `User` → carpeta `users`)
- Convertir PascalCase a kebab-case para nombres de carpetas (ej: `UserProfile` → `user-profiles`)

---

### 3. Generar DTOs (Data Transfer Objects)

**Para cada modelo detectado, generar interfaces TypeScript:**

**Input (OpenAPI):**
```yaml
components:
  schemas:
    User:
      type: object
      required:
        - id
        - name
        - email
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        email:
          type: string
          format: email
        createdAt:
          type: string
          format: date-time
```

**Output (`src/generated/users/dto/User.ts`):**
```typescript
/**
 * @generated from OpenAPI schema: User
 */
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}
```

**Reglas de generación:**
- `type: integer` → `number`
- `type: string` → `string`
- `type: boolean` → `boolean`
- `type: array` → `T[]` (donde T es el tipo del item)
- `format: date-time` → `string` (mantener como string)
- `format: email` → `string` (mantener como string)
- Campos opcionales (no en `required`) → `campo?: tipo`
- Campos requeridos → `campo: tipo`

**DTOs adicionales a generar:**
- Si existe `UserCreate` o `CreateUserRequest` → `UserCreate.ts`
- Si existe `UserUpdate` o `UpdateUserRequest` → `UserUpdate.ts`
- Si existe `UserResponse` → `UserResponse.ts`

**Estructura:**
```
src/generated/users/dto/
├── User.ts
├── UserCreate.ts (si existe)
├── UserUpdate.ts (si existe)
└── index.ts (exporta todo)
```

---

### 4. Detectar Resource del Path

**Del path OpenAPI:**

```yaml
paths:
  /users:
    get:
      ...
  /users/{id}:
    get:
      ...
```

**Resultado:** Detecta `resource = 'users'` del path `/users`

**Reglas:**
- Tomar el primer segmento del path (ej: `/users` → `users`)
- Si hay múltiples paths para el mismo modelo, usar el más común
- Paths como `/users/{id}` → resource sigue siendo `users`

---

### 5. Generar Servicio que Extiende RestStd

**Para cada modelo detectado, generar servicio:**

**Output (`src/generated/users/UserService.ts`):**
```typescript
import { RestStd } from '@arex95/vue-core';
import { User, UserCreate, UserUpdate } from './dto';

/**
 * @generated from OpenAPI
 * User service - Auto-generated from OpenAPI spec
 * 
 * Métodos estándar RESTful disponibles automáticamente desde RestStd:
 * - UserService.getAll<User[]>({ params }) → GET /users
 * - UserService.getOne<User>({ id }) → GET /users/{id}
 * - UserService.create<User, UserCreate>({ data }) → POST /users
 * - UserService.update<User, UserUpdate>({ id, data }) → PUT /users/{id}
 * - UserService.delete({ id }) → DELETE /users/{id}
 */
export class UserService extends RestStd {
  static override resource = 'users';
  
  // NO se generan métodos para endpoints estándar RESTful
  // Solo métodos custom para endpoints NO estándar (si los hay)
}
```

**Reglas:**
- **NO generar métodos** para endpoints estándar (`getAll`, `getOne`, `create`, `update`, `delete`)
- Solo definir `static override resource = 'users'`
- Si hay endpoints custom (ej: `POST /users/{id}/activate`), generar método custom

**Detección de endpoints estándar:**
- `GET /users` → Estándar (NO generar método)
- `GET /users/{id}` → Estándar (NO generar método)
- `POST /users` → Estándar (NO generar método)
- `PUT /users/{id}` → Estándar (NO generar método)
- `DELETE /users/{id}` → Estándar (NO generar método)
- `POST /users/{id}/activate` → Custom (SÍ generar método)

---

### 6. Generar Index Files

**Para cada modelo:**

**`src/generated/users/index.ts`:**
```typescript
export * from './dto';
export * from './UserService';
```

**`src/generated/users/dto/index.ts`:**
```typescript
export * from './User';
export * from './UserCreate';
export * from './UserUpdate';
```

**`src/generated/index.ts`:**
```typescript
export * from './users';
export * from './products';
// ... todos los modelos
```

---

## Estructura de Archivos Generados

```
src/generated/
├── index.ts                    # Exporta todos los modelos
│
├── users/                      # Modelo User
│   ├── dto/
│   │   ├── User.ts
│   │   ├── UserCreate.ts      # Si existe en schema
│   │   ├── UserUpdate.ts      # Si existe en schema
│   │   └── index.ts
│   ├── UserService.ts
│   └── index.ts
│
├── products/                   # Modelo Product
│   ├── dto/
│   │   ├── Product.ts
│   │   └── index.ts
│   ├── ProductService.ts
│   └── index.ts
│
└── ...
```

---

## Configuración Mínima

**Archivo de configuración (`vue-core-generator.config.js` o `package.json`):**

```javascript
module.exports = {
  // Input
  input: './openapi.yaml',  // o './openapi.json'
  
  // Output
  output: './src/generated',
  
  // Opcional: base URL para documentación
  baseUrl: 'https://api.example.com',
};
```

---

## CLI Básico

**Comando:**
```bash
npm run generate:api
```

**O directamente:**
```bash
npx vue-core-generator --input openapi.yaml --output src/generated
```

**Script en `package.json`:**
```json
{
  "scripts": {
    "generate:api": "vue-core-generator --input openapi.yaml --output src/generated"
  }
}
```

---

## Casos de Uso MVP

### Caso 1: Schema Simple

**Input (`openapi.yaml`):**
```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0

paths:
  /users:
    get:
      summary: List users
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
  
  /users/{id}:
    get:
      summary: Get user
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      required:
        - id
        - name
        - email
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
```

**Output esperado:**

**`src/generated/users/dto/User.ts`:**
```typescript
/**
 * @generated from OpenAPI schema: User
 */
export interface User {
  id: number;
  name: string;
  email: string;
}
```

**`src/generated/users/UserService.ts`:**
```typescript
import { RestStd } from '@arex95/vue-core';
import { User } from './dto';

/**
 * @generated from OpenAPI
 * User service - Auto-generated from OpenAPI spec
 */
export class UserService extends RestStd {
  static override resource = 'users';
}
```

---

## Limitaciones del MVP

**NO incluir en MVP:**
- ❌ Generación de hooks Vue Query
- ❌ Validaciones automáticas
- ❌ Query builders
- ❌ Soporte para schemas complejos (oneOf, allOf, etc.)
- ❌ Métodos custom para endpoints NO estándar (solo estructura básica)
- ❌ Transformaciones de datos
- ❌ Documentación avanzada

**Solo incluir:**
- ✅ Parsear OpenAPI spec
- ✅ Generar DTOs básicos (tipos simples)
- ✅ Generar servicios básicos con `resource` definido
- ✅ Estructura de carpetas por modelo
- ✅ Index files para exports

---

## Tecnologías Sugeridas

### Mínimas (MVP básico)

**Para parsear OpenAPI:**
- **JSON input**: `JSON.parse()` nativo (cero dependencias) ✅ Recomendado para MVP
- **YAML input**: `js-yaml` (solo si es necesario parsear YAML)
- **Validación**: Manual (verificar estructura básica)

**Para generar código:**
- Template strings de JavaScript (sin librerías) ✅

**Para CLI básico:**
- `process.argv` nativo ✅ (cero dependencias)

**Para manejo de archivos:**
- `fs` nativo de Node.js ✅ (cero dependencias)

**Stack MVP:**
```
JSON.parse() + fs nativo + template strings + process.argv
= Cero dependencias externas
```

---

### Después del MVP (Mejoras futuras)

**Soporte YAML:**
- `js-yaml` - Parsear archivos YAML

**CLI mejorado:**
- `commander` o `yargs` - CLI parser más amigable
- `chalk` - Colores en terminal (mejora UX)

**Formateo de código:**
- `prettier` - Formatear código generado automáticamente

**Validación avanzada:**
- `@apidevtools/swagger-parser` - Validación estricta y resolución de $ref complejos

**Templates avanzados:**
- `handlebars` o `mustache` - Si necesitas templates más complejos

---

## Checklist de Implementación

### Fase 1: Setup
- [ ] Crear estructura básica del proyecto
- [ ] Configurar dependencias
- [ ] Crear CLI básico

### Fase 2: Parser
- [ ] Parsear archivo OpenAPI (YAML/JSON)
- [ ] Validar spec OpenAPI
- [ ] Extraer schemas de `components.schemas`
- [ ] Extraer paths para detectar resources

### Fase 3: Generador de DTOs
- [ ] Detectar modelos del schema
- [ ] Generar interfaces TypeScript básicas
- [ ] Manejar tipos simples (string, number, boolean, array)
- [ ] Manejar campos opcionales vs requeridos
- [ ] Generar archivos de DTOs
- [ ] Generar index files para DTOs

### Fase 4: Generador de Servicios
- [ ] Detectar resource del path
- [ ] Generar clase que extiende RestStd
- [ ] Definir `static override resource`
- [ ] Generar imports correctos
- [ ] Generar index files para servicios

### Fase 5: Integración
- [ ] Generar estructura de carpetas completa
- [ ] Generar index.ts principal
- [ ] Formatear código generado (prettier)
- [ ] Validar que el código generado compile

### Fase 6: Testing
- [ ] Probar con spec simple
- [ ] Probar con múltiples modelos
- [ ] Validar estructura generada
- [ ] Validar que los tipos TypeScript sean correctos

---

## Ejemplo de Uso Final

**1. Tener un `openapi.json`:**
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
        "properties": {
          "id": { "type": "integer" },
          "name": { "type": "string" }
        }
      }
    }
  }
}
```

**2. Ejecutar:**
```bash
npm run generate:api
```

**3. Usar en código:**
```typescript
import { UserService, User } from '@/generated/users';
import { useQuery } from '@tanstack/vue-query';

const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: () => UserService.getAll<User[]>()
});
```

---

## Notas Importantes

1. **RestStd es agnóstico** - No generar hooks, solo métodos HTTP
2. **NO sobrescribir métodos estándar** - Solo definir `resource`
3. **Tipos simples primero** - MVP solo maneja tipos básicos
4. **Estructura clara** - Una carpeta por modelo, DTOs separados
5. **Código limpio** - Código bien formateado (prettier después del MVP)

---

## Próximos Pasos (Fuera del MVP)

### Mejoras Técnicas
- Soporte para YAML (`js-yaml`)
- CLI mejorado (`commander`, `chalk`)
- Formateo automático (`prettier`)
- Validación avanzada (`@apidevtools/swagger-parser`)

### Funcionalidades
- Soporte para schemas complejos (oneOf, allOf, anyOf)
- Métodos custom para endpoints NO estándar
- Validaciones automáticas
- Query builders
- Documentación mejorada
- Watch mode (regenerar automáticamente)
- Templates personalizables

