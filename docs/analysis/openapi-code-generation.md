# El Santo Grial: Autogeneración de Modelos y Servicios desde OpenAPI

## La Idea

**Tomar un spec de OpenAPI/Swagger y autogenerar:**
- ✅ DTOs (Data Transfer Objects) - Tipos TypeScript perfectos
- ✅ Servicios que extienden `RestStd` - Métodos HTTP RESTful estandarizados
- ✅ Métodos custom solo para endpoints NO estándar

**RestStd es agnóstico - El usuario usa `useQuery` directamente con los métodos generados**

---

## ¿Qué es Orval?

**Orval** es una herramienta que genera código TypeScript a partir de specs OpenAPI. Es muy popular en el ecosistema React porque genera hooks de React Query automáticamente.

**Ejemplo de lo que genera Orval:**
```typescript
// Generado automáticamente desde OpenAPI
export const useGetUsers = (
  options?: UseQueryOptions<UsersResponse>
) => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => axios.get('/users'),
    ...options
  });
};
```

**Problema:** Orval está diseñado para React Query y genera código específico de Axios.

**Oportunidad:** Crear un generador específicamente para:
- **RestStd** - Métodos HTTP RESTful estandarizados
- **Agnóstico** - No genera hooks, el usuario usa `useQuery` directamente
- **TypeScript** - Tipos perfectos desde el schema OpenAPI

---

## El Valor Real

### Situación Actual (Manual)

**Tienes que escribir manualmente:**

```typescript
// 1. Definir el modelo (DTO)
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// 2. Crear el servicio
export class UserService extends RestStd {
  static override resource = 'users';
}

// 3. Usar en componentes (con useQuery directamente)
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: () => UserService.getAll<User[]>()
});
```

**Problemas:**
- ❌ Tienes que escribir todo manualmente
- ❌ Fácil que los tipos no coincidan con la API
- ❌ Cuando la API cambia, tienes que actualizar manualmente
- ❌ Propenso a errores
- ❌ Repetitivo para muchos recursos

### Con Autogeneración (El Santo Grial)

**Solo ejecutas un comando:**

```bash
npm run generate:api
```

**Y obtienes automáticamente:**

```typescript
// Generado automáticamente desde OpenAPI
// src/generated/users/dto/User.ts
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// src/generated/users/UserService.ts
export class UserService extends RestStd {
  static override resource = 'users';
  
  // Métodos estándar disponibles automáticamente:
  // - getAll(), getOne(), create(), update(), delete()
  
  // Solo métodos custom para endpoints NO estándar (si los hay)
  static activateUser(id: number) {
    return this.customRequest<User>({
      method: 'POST',
      url: `${this.resource}/${id}/activate`
    });
  }
}
```

**Ventajas:**
- ✅ Cero código manual
- ✅ Tipos perfectos (100% sincronizados con API)
- ✅ Actualización automática cuando cambia la API
- ✅ Sin errores de tipado
- ✅ Escalable (100 recursos = 0 trabajo manual)

---

## Qué se Generaría Automáticamente

### 1. Modelos TypeScript (Interfaces/Types)

**Desde OpenAPI Schema:**
```yaml
# openapi.yaml
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
        updatedAt:
          type: string
          format: date-time
```

**Generaría:**
```typescript
// src/generated/models/User.ts
/**
 * @generated from OpenAPI schema
 * User model
 */
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export type UserCreate = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UserUpdate = Partial<UserCreate>;
```

### 2. Servicios que Extienden RestStd

**⚠️ REGLA FUNDAMENTAL: NO sobrescribir métodos estándar de RestStd**

**RestStd ya proporciona métodos estándar RESTful:**
- ✅ `getAll()` → `GET /users` (o cualquier recurso)
- ✅ `getOne({ id })` → `GET /users/{id}`
- ✅ `create({ data })` → `POST /users`
- ✅ `update({ id, data })` → `PUT /users/{id}`
- ✅ `patch({ id, data })` → `PATCH /users/{id}`
- ✅ `delete({ id })` → `DELETE /users/{id}`

**El generador debe:**
- ✅ **Detectar endpoints estándar RESTful** y NO crear métodos custom para ellos
- ✅ **Solo generar métodos custom** para endpoints NO estándar (ej: `/users/{id}/activate`)
- ✅ **Estructurar por modelo**: Una carpeta por cada modelo detectado en el schema
- ✅ **Separar DTOs**: Carpeta `dto/` dentro de cada modelo para los tipos

**Estructura Correcta:**
```
src/generated/
├── users/
│   ├── dto/
│   │   ├── User.ts           # Interface User
│   │   ├── UserCreate.ts     # Interface UserCreate
│   │   ├── UserUpdate.ts     # Interface UserUpdate
│   │   └── index.ts          # Exporta todos los DTOs
│   ├── UserService.ts        # Servicio que extiende RestStd
│   └── index.ts              # Exporta DTOs y Service
├── products/
│   ├── dto/
│   │   ├── Product.ts
│   │   └── index.ts
│   ├── ProductService.ts
│   └── index.ts
└── index.ts                  # Exporta todo
```

**Ejemplo: OpenAPI Spec**
```yaml
# openapi.yaml
paths:
  /users:
    get:
      summary: List all users
      operationId: getUsers
      parameters:
        - name: status
          in: query
          schema:
            type: string
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    
    post:
      summary: Create user
      operationId: createUser
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreate'
  
  /users/{id}:
    get:
      summary: Get user by ID
      operationId: getUserById
      parameters:
        - name: id
          in: path
          required: true
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
    
    put:
      summary: Update user
      operationId: updateUser
  
    delete:
      summary: Delete user
      operationId: deleteUser
  
  /users/{id}/activate:
    post:
      summary: Activate user (CUSTOM - no estándar)
      operationId: activateUser
      parameters:
        - name: id
          in: path
          required: true
```

**Generaría:**

**1. DTOs (`src/generated/users/dto/User.ts`):**
```typescript
/**
 * @generated from OpenAPI schema: User
 */
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * @generated from OpenAPI schema: UserCreate
 */
export interface UserCreate {
  name: string;
  email: string;
  password: string;
}

/**
 * @generated from OpenAPI schema: UserUpdate
 */
export interface UserUpdate {
  name?: string;
  email?: string;
}
```

**2. Servicio (`src/generated/users/UserService.ts`):**
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
 * - UserService.create<User>({ data }) → POST /users
 * - UserService.update<User>({ id, data }) → PUT /users/{id}
 * - UserService.delete({ id }) → DELETE /users/{id}
 * 
 * Solo se generan métodos custom para endpoints NO estándar.
 */
export class UserService extends RestStd {
  static override resource = 'users';
  
  /**
   * Activate user
   * @generated from operationId: activateUser
   * Custom endpoint (not standard RESTful)
   */
  static activateUser(id: number): Promise<User> {
    return this.customRequest<User>({
      method: 'POST',
      url: `${this.resource}/${id}/activate`
    });
  }
}
```

**3. Index (`src/generated/users/index.ts`):**
```typescript
export * from './dto';
export * from './UserService';
```

**Uso en componentes con Vue Query:**
```typescript
import { useQuery, useMutation } from '@tanstack/vue-query';
import { UserService, User, UserCreate } from '@/generated/users';

// Usar métodos estándar de RestStd con useQuery directamente
const { data: users } = useQuery({
  queryKey: ['users', { status: 'active' }],
  queryFn: () => UserService.getAll<User[]>({
    params: { status: 'active' }
  })
});

const { data: user } = useQuery({
  queryKey: ['user', 1],
  queryFn: () => UserService.getOne<User>({ id: 1 })
});

const createMutation = useMutation({
  mutationFn: (data: UserCreate) => UserService.create<User, UserCreate>({ data }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }
});

// Usar método custom (solo para endpoints NO estándar)
const activateMutation = useMutation({
  mutationFn: (id: number) => UserService.activateUser(id)
});
```

### 3. Hooks de Vue Query (Opcional)

**Generaría hooks listos para usar:**
```typescript
// src/generated/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { UserService, User, UserCreate } from '../services';

/**
 * @generated
 * Hook to fetch all users
 */
export function useUsers(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => UserService.getUsers(params),
  });
}

/**
 * @generated
 * Hook to fetch a single user
 */
export function useUser(id: number) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => UserService.getUserById(id),
    enabled: !!id,
  });
}

/**
 * @generated
 * Hook to create a user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UserCreate) => UserService.create<User>({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

### 4. Tipos para Request/Response

**Generaría tipos específicos para cada endpoint:**
```typescript
// src/generated/types/UserTypes.ts
export interface GetUsersParams {
  status?: string;
  page?: number;
}

export interface GetUsersResponse {
  data: User[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface CreateUserResponse {
  data: User;
  message: string;
}
```

### 5. Validaciones (Opcional)

**Basadas en el schema de OpenAPI:**
```typescript
// src/generated/validations/UserValidations.ts
import { ValidationError } from '@arex95/vue-core';

export function validateUserCreate(data: any): void {
  if (!data.name || typeof data.name !== 'string') {
    throw new ValidationError('name is required and must be a string');
  }
  if (!data.email || !data.email.includes('@')) {
    throw new ValidationError('email is required and must be a valid email');
  }
  if (!data.password || data.password.length < 8) {
    throw new ValidationError('password is required and must be at least 8 characters');
  }
}
```

---

## Arquitectura Propuesta

### Flujo de Generación

```
OpenAPI Spec (openapi.yaml)
    ↓
[Generador] → Parsea el spec
    ↓
Genera código TypeScript:
  - DTOs (interfaces/tipos)
  - Servicios (extienden RestStd)
    ↓
src/generated/
  ├── users/
  │   ├── dto/
  │   └── UserService.ts
  ├── products/
  ├── hooks/ [opcional]
  ├── types/
  └── validations/ [opcional]
```

### Estructura de Archivos Generados (Por Modelo)

**El generador detecta modelos del schema OpenAPI y crea una carpeta por cada uno:**

```
src/generated/
├── index.ts                    # Exporta todo
│
├── users/                      # Modelo detectado: User
│   ├── dto/
│   │   ├── User.ts             # Interface User
│   │   ├── UserCreate.ts       # Interface UserCreate
│   │   ├── UserUpdate.ts       # Interface UserUpdate
│   │   ├── Pagination.ts       # Interface Pagination (si se usa)
│   │   └── index.ts            # Exporta todos los DTOs
│   ├── UserService.ts          # Servicio que extiende RestStd
│   └── index.ts                # Exporta DTOs y Service
│
├── products/                    # Modelo detectado: Product
│   ├── dto/
│   │   ├── Product.ts
│   │   ├── ProductCreate.ts
│   │   └── index.ts
│   ├── ProductService.ts
│   └── index.ts
│
└── roles/                       # Modelo detectado: Role
    ├── dto/
    │   ├── Role.ts
    │   └── index.ts
    ├── RoleService.ts
    └── index.ts
```

**❌ NO se generan:**
- Hooks de Vue Query (el usuario usa `useQuery` directamente)
- Validaciones (opcional, fuera del scope principal)

**Reglas de Detección de Modelos:**
1. **Del schema OpenAPI:** Cada schema en `components.schemas` es un modelo potencial
2. **De los paths:** Si hay paths como `/users`, `/products`, se detecta el modelo
3. **Naming:** El nombre del modelo se deriva del path o del schema name
4. **Carpeta por modelo:** Cada modelo tiene su propia carpeta con `dto/` y `Service.ts`

---

## Ejemplo Completo: De OpenAPI a Código

### Input: OpenAPI Spec

```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0

paths:
  /users:
    get:
      summary: List all users
      operationId: getUsers
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [active, inactive]
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: perPage
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
    
    post:
      summary: Create a new user
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreate'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  /users/{id}:
    get:
      summary: Get user by ID
      operationId: getUserById
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: User details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
    
    put:
      summary: Update user
      operationId: updateUser
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserUpdate'
      responses:
        '200':
          description: User updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
    
    delete:
      summary: Delete user
      operationId: deleteUser
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: User deleted

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
        status:
          type: string
          enum: [active, inactive]
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
    
    UserCreate:
      type: object
      required:
        - name
        - email
        - password
      properties:
        name:
          type: string
          minLength: 3
          maxLength: 100
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
    
    UserUpdate:
      type: object
      properties:
        name:
          type: string
          minLength: 3
          maxLength: 100
        email:
          type: string
          format: email
        status:
          type: string
          enum: [active, inactive]
    
    Pagination:
      type: object
      properties:
        page:
          type: integer
        perPage:
          type: integer
        total:
          type: integer
        totalPages:
          type: integer
```

### Output: Código Generado

#### 1. Modelos

```typescript
// src/generated/models/User.ts
/**
 * @generated from OpenAPI schema: User
 */
export interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

/**
 * @generated from OpenAPI schema: UserCreate
 */
export interface UserCreate {
  name: string;
  email: string;
  password: string;
}

/**
 * @generated from OpenAPI schema: UserUpdate
 */
export interface UserUpdate {
  name?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

/**
 * @generated from OpenAPI schema: Pagination
 */
export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
```

#### 2. Servicio

**⚠️ IMPORTANTE: NO sobrescribir métodos estándar**

**El generador detecta:**
- `GET /users` → Ya cubierto por `getAll()`, NO generar método
- `GET /users/{id}` → Ya cubierto por `getOne()`, NO generar método
- `POST /users` → Ya cubierto por `create()`, NO generar método
- `PUT /users/{id}` → Ya cubierto por `update()`, NO generar método
- `DELETE /users/{id}` → Ya cubierto por `delete()`, NO generar método
- `POST /users/{id}/activate` → NO estándar, SÍ generar método custom

```typescript
// src/generated/users/UserService.ts
import { RestStd } from '@arex95/vue-core';
import { User, UserCreate, UserUpdate, Pagination } from './dto';

/**
 * @generated from OpenAPI
 * User service - Auto-generated from OpenAPI spec
 * 
 * Métodos estándar RESTful disponibles automáticamente desde RestStd:
 * - UserService.getAll<User[]>({ params }) → GET /users
 * - UserService.getOne<User>({ id }) → GET /users/{id}
 * - UserService.create<User>({ data }) → POST /users
 * - UserService.update<User>({ id, data }) → PUT /users/{id}
 * - UserService.delete({ id }) → DELETE /users/{id}
 * 
 * Solo se generan métodos custom para endpoints NO estándar.
 */
export class UserService extends RestStd {
  static override resource = 'users';
  
  /**
   * Activate user
   * @generated from operationId: activateUser
   * Custom endpoint (not standard RESTful)
   */
  static activateUser(id: number): Promise<User> {
    return this.customRequest<User>({
      method: 'POST',
      url: `${this.resource}/${id}/activate`
    });
  }
  
  // NO se generan métodos para endpoints estándar:
  // ❌ getUsers() - usar getAll() directamente
  // ❌ getUserById() - usar getOne() directamente
  // ❌ createUser() - usar create() directamente
  // ❌ updateUser() - usar update() directamente
  // ❌ deleteUser() - usar delete() directamente
}
```

#### 3. Uso en Componentes

**⚠️ RestStd es agnóstico - El usuario usa `useQuery` directamente**

```vue
<!-- src/components/UserList.vue -->
<template>
  <div>
    <div v-if="isLoading">Cargando...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <div v-for="user in users" :key="user.id">
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
        <button @click="deleteUser(user.id)">Eliminar</button>
      </div>
      <button @click="createNewUser">Crear Usuario</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { UserService, User, UserCreate, Pagination } from '@/generated/users';

const queryClient = useQueryClient();

// Usar métodos estándar de RestStd con useQuery directamente
const { data: response, isLoading, error } = useQuery({
  queryKey: ['users', { status: 'active' }],
  queryFn: () => UserService.getAll<{ data: User[]; pagination: Pagination }>({
    params: { status: 'active', page: 1, perPage: 20 }
  }),
});

const users = computed(() => response.value?.data || []);

// Mutation para crear
const createMutation = useMutation({
  mutationFn: (data: UserCreate) => UserService.create<User, UserCreate>({ data }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});

// Mutation para eliminar
const deleteMutation = useMutation({
  mutationFn: (id: number) => UserService.delete({ id }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});

// Mutation para método custom (si existe)
const activateMutation = useMutation({
  mutationFn: (id: number) => UserService.activateUser(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});

const createNewUser = () => {
  createMutation.mutate({
    name: 'Nuevo Usuario',
    email: 'nuevo@example.com',
    password: 'password123'
  });
};

const deleteUser = (id: number) => {
  deleteMutation.mutate(id);
};
</script>
```

---

## Ventajas del Autogenerador

### 1. Sincronización Automática

**Problema actual:**
- API cambia → Tienes que actualizar tipos manualmente
- Fácil que se desincronicen
- Errores en runtime

**Con autogenerador:**
- API cambia → Ejecutas `npm run generate:api`
- Todo se actualiza automáticamente
- Errores en tiempo de compilación (TypeScript)

### 2. Type Safety Perfecto

**Problema actual:**
```typescript
// Tipos manuales pueden estar desincronizados
interface User {
  id: number;
  name: string;
  // Falta campo nuevo de la API
}
```

**Con autogenerador:**
```typescript
// Tipos generados directamente del schema
// 100% sincronizados con la API
interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  // Todos los campos siempre actualizados
}
```

### 3. Cero Código Manual

**Antes:**
- Escribir interfaces manualmente
- Crear servicios manualmente
- Crear hooks manualmente
- Mantener todo sincronizado

**Después:**
- Ejecutar un comando
- Todo generado automáticamente
- Solo usar el código generado

### 4. Escalabilidad

**100 recursos en la API:**
- **Sin autogenerador:** 100 interfaces + 100 servicios = 200 archivos manuales
- **Con autogenerador:** 1 comando = 200 archivos generados

### 5. Documentación Automática

**El código generado incluye:**
- JSDoc comments del OpenAPI spec
- Descripciones de cada endpoint
- Tipos de parámetros
- Ejemplos de uso

---

## Comparación con Orval

| Característica | Orval | Propuesta (RestStd Generator) |
|---------------|-------|------------------------------|
| **Target** | React Query | Agnóstico (RestStd) |
| **Base** | Axios directo | RestStd |
| **Genera** | Hooks React + tipos | Solo DTOs + Servicios RestStd |
| **Tipos** | ✅ Sí | ✅ Sí |
| **Hooks** | ✅ Sí (React Query) | ❌ No (usuario usa useQuery directamente) |
| **Agnóstico** | ❌ No | ✅ Sí |
| **Customización** | ⚠️ Limitado | ✅ Alto (templates) |
| **RestStd** | ❌ No | ✅ Sí |

---

## Implementación Propuesta

### Opción 1: Plugin CLI (Recomendado)

**Crear un paquete separado:** `@arex95/vue-core-generator`

```bash
npm install -D @arex95/vue-core-generator

# Configuración en package.json
{
  "scripts": {
    "generate:api": "vue-core-generator --input openapi.yaml --output src/generated"
  },
  "vueCoreGenerator": {
    "input": "openapi.yaml",
    "output": "src/generated",
    "baseUrl": "https://api.example.com",
    "template": "reststd" // o "custom"
  }
}
```

**Uso:**
```bash
npm run generate:api
```

### Opción 2: Integración con Herramientas Existentes

**Extender herramientas existentes:**
- **openapi-typescript-codegen** - Genera tipos TypeScript
- **swagger-codegen** - Generador general
- **@openapitools/openapi-generator-cli** - Generador moderno

**Crear un template personalizado** para RestStd.

### Opción 3: Plugin para Vite/Nuxt

**Integración directa en el build:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vueCoreGenerator from '@arex95/vue-core-generator/vite';

export default defineConfig({
  plugins: [
    vue(),
    vueCoreGenerator({
      input: './openapi.yaml',
      output: './src/generated',
      watch: true // Regenera cuando cambia el spec
    })
  ]
});
```

---

## Características del Generador

### 1. Detección de Modelos

**El generador analiza el OpenAPI spec y detecta modelos de dos formas:**

#### A. Desde Schemas (`components.schemas`)
```yaml
components:
  schemas:
    User:          # ← Detecta modelo "User"
      type: object
    Product:       # ← Detecta modelo "Product"
      type: object
    Order:         # ← Detecta modelo "Order"
      type: object
```

#### B. Desde Paths (Inferencia)
```yaml
paths:
  /users:          # ← Infiere modelo "User" (plural → singular)
  /products:       # ← Infiere modelo "Product"
  /user-profiles:  # ← Infiere modelo "UserProfile" (kebab-case → PascalCase)
```

**Resultado:** Crea una carpeta por cada modelo detectado:
```
src/generated/
├── users/         # Modelo User
├── products/      # Modelo Product
└── user-profiles/ # Modelo UserProfile
```

### 2. Detección de Endpoints Estándar vs Custom

**El generador clasifica endpoints:**

#### Endpoints Estándar (NO generar métodos custom)
```yaml
GET /users              → Ya cubierto por getAll()
GET /users/{id}         → Ya cubierto por getOne({ id })
POST /users             → Ya cubierto por create({ data })
PUT /users/{id}         → Ya cubierto por update({ id, data })
PATCH /users/{id}       → Ya cubierto por patch({ id, data })
DELETE /users/{id}      → Ya cubierto por delete({ id })
```

**Reglas de detección:**
- `GET /{resource}` → Estándar (getAll)
- `GET /{resource}/{id}` → Estándar (getOne)
- `POST /{resource}` → Estándar (create)
- `PUT /{resource}/{id}` → Estándar (update)
- `PATCH /{resource}/{id}` → Estándar (patch)
- `DELETE /{resource}/{id}` → Estándar (delete)

#### Endpoints Custom (SÍ generar métodos)
```yaml
POST /users/{id}/activate     → Custom (generar método)
POST /users/{id}/deactivate   → Custom (generar método)
GET /users/{id}/permissions   → Custom (generar método)
POST /users/bulk              → Custom (puede usar bulkCreate o método custom)
```

**Reglas de detección:**
- Cualquier path que NO siga el patrón estándar → Custom
- Paths con más de 2 segmentos después del recurso → Custom
- Paths con acciones verbales (`activate`, `deactivate`, `approve`, etc.) → Custom

### 3. Generación de Servicios

**Para cada modelo detectado:**

```typescript
// src/generated/users/UserService.ts
export class UserService extends RestStd {
  static override resource = 'users'; // Detectado del path /users
  
  // NO se generan métodos para endpoints estándar
  // Solo métodos custom para endpoints NO estándar
  
  // Ejemplo: Si hay POST /users/{id}/activate
  static activateUser(id: number): Promise<User> {
    return this.customRequest<User>({
      method: 'POST',
      url: `${this.resource}/${id}/activate`
    });
  }
}
```

### 4. Generación de DTOs

**Para cada schema relacionado con el modelo:**

```typescript
// src/generated/users/dto/User.ts
export interface User { ... }

// src/generated/users/dto/UserCreate.ts
export interface UserCreate { ... }

// src/generated/users/dto/UserUpdate.ts
export interface UserUpdate { ... }
```

**Reglas:**
- Schema principal: `User` → `dto/User.ts`
- Schema de creación: `UserCreate` o `CreateUserRequest` → `dto/UserCreate.ts`
- Schema de actualización: `UserUpdate` o `UpdateUserRequest` → `dto/UserUpdate.ts`
- Schemas relacionados: `Pagination`, `UserResponse`, etc. → `dto/[Nombre].ts`

### 2. Detección Automática de Patrones REST

**El generador detecta:**
- ✅ List endpoints → `getAll()`
- ✅ Detail endpoints → `getOne()`
- ✅ Create endpoints → `create()`
- ✅ Update endpoints → `update()`
- ✅ Delete endpoints → `delete()`
- ✅ Custom endpoints → `customRequest()`

### 3. Generación de Query Builders

**Si detecta parámetros de query complejos:**
```typescript
// Genera automáticamente
UserService.query()
  .filter('status', 'active')
  .sort('name', 'asc')
  .page(1)
  .perPage(20)
  .build()
```

### 4. Soporte para Múltiples Convenciones

**Configurable:**
```json
{
  "queryBuilder": {
    "convention": "laravel", // o "rails", "jsonapi"
    "filterPrefix": "filter",
    "sortFormat": "array"
  }
}
```

### 5. Validaciones Automáticas

**Basadas en el schema:**
```typescript
// Genera validaciones automáticamente
export function validateUserCreate(data: any): void {
  if (!data.name || data.name.length < 3) {
    throw new ValidationError('name must be at least 3 characters');
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new ValidationError('email must be a valid email address');
  }
}
```

---

## Desafíos y Consideraciones

### 1. APIs No RESTful

**Problema:** Algunas APIs no siguen convenciones REST estándar.

**Solución:**
- Detectar patrones automáticamente
- Permitir configuración manual
- Generar `customRequest()` para casos especiales

### 2. Schemas Complejos

**Problema:** OpenAPI schemas pueden ser muy complejos (oneOf, allOf, etc.).

**Solución:**
- Soporte para tipos union
- Tipos genéricos cuando sea necesario
- Documentación clara de casos edge

### 3. Customización

**Problema:** Cada proyecto tiene necesidades diferentes.

**Solución:**
- Templates personalizables
- Hooks de generación (pre/post)
- Opciones de configuración extensas

### 4. Mantenimiento

**Problema:** El generador necesita mantenerse actualizado.

**Solución:**
- Versiones del generador
- Compatibilidad con diferentes versiones de OpenAPI
- Tests exhaustivos

### 5. Overhead de Código Generado

**Problema:** Puede generar mucho código.

**Solución:**
- Tree-shaking (solo importar lo que usas)
- Generación bajo demanda
- Opciones para deshabilitar generación de hooks/validaciones

---

## Roadmap de Implementación

### Fase 1: MVP (Minimum Viable Product)

**Objetivos:**
- ✅ Parsear OpenAPI spec
- ✅ Generar modelos TypeScript básicos
- ✅ Generar servicios básicos que extienden RestStd
- ✅ Soporte para operaciones CRUD estándar

**Entregable:**
```bash
npm run generate:api
# Genera modelos y servicios básicos
```

### Fase 2: Mejoras

**Objetivos:**
- ✅ Solo DTOs y Servicios (NO hooks)
- ✅ Query builders automáticos
- ✅ Validaciones básicas
- ✅ Documentación inline

### Fase 3: Avanzado

**Objetivos:**
- ✅ Templates personalizables
- ✅ Soporte para múltiples convenciones
- ✅ Hooks de generación (pre/post)
- ✅ Watch mode (regenera automáticamente)

### Fase 4: Ecosistema

**Objetivos:**
- ✅ Plugin para Vite
- ✅ Plugin para Nuxt
- ✅ Integración con CI/CD
- ✅ CLI mejorado

---

## Ejemplo de Configuración Completa

### `vue-core-generator.config.js`

```javascript
module.exports = {
  // Input
  input: './openapi.yaml',
  
  // Output
  output: './src/generated',
  
  // Configuración de generación
  generate: {
    dtos: true,        // DTOs (tipos/interfaces)
    services: true,    // Servicios que extienden RestStd
  },
  
  // Configuración de RestStd
  restStd: {
    baseClass: 'RestStd',
    importPath: '@arex95/vue-core',
    defaultFetcher: 'createAxiosFetcher',
  },
  
  // Configuración de Query Builder
  queryBuilder: {
    enabled: true,
    convention: 'laravel',
    filterPrefix: 'filter',
    sortFormat: 'array',
  },
  
  // NO se generan hooks - RestStd es agnóstico
  // El usuario usa useQuery directamente con los métodos de RestStd
  
  // Templates personalizados (opcional)
  templates: {
    service: './templates/service.hbs',
    model: './templates/model.hbs',
  },
  
  // Hooks de generación
  hooks: {
    beforeGenerate: (spec) => {
      // Modificar spec antes de generar
      return spec;
    },
    afterGenerate: (files) => {
      // Post-procesar archivos generados
      return files;
    },
  },
};
```

---

## Comparación: Antes vs Después

### Antes (Manual)

```typescript
// Tienes que escribir TODO manualmente

// 1. Modelo
export interface User {
  id: number;
  name: string;
  email: string;
  // ... más campos
}

// 2. Servicio
export class User extends RestStd {
  static override resource = 'users';
}

// 3. Hooks
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => User.getAll<User[]>()
  });
}

// 4. Repetir para cada recurso...
```

**Tiempo:** ~30 minutos por recurso
**Errores:** Frecuentes
**Mantenimiento:** Manual y tedioso

### Después (Autogenerado)

```bash
# Un solo comando
npm run generate:api
```

**Tiempo:** ~10 segundos para 100 recursos
**Errores:** Cero (tipos perfectos)
**Mantenimiento:** Automático

---

## Conclusión

### El Santo Grial Realmente Existe

**Autogenerar desde OpenAPI es:**
- ✅ **El futuro** - Cero código manual
- ✅ **Type-safe** - Tipos perfectos siempre sincronizados
- ✅ **Escalable** - 1 recurso o 1000, mismo esfuerzo
- ✅ **Mantenible** - Actualización automática
- ✅ **Productivo** - Ahorra horas de trabajo

### Por Qué es Perfecto para RestStd

1. **RestStd ya tiene la estructura** - Solo necesita generación de código
2. **Patrones claros** - OpenAPI → RestStd es mapeo directo
3. **TypeScript first** - Tipos perfectos desde el schema
4. **Agnóstico** - No genera hooks, el usuario usa `useQuery` directamente
5. **Enfoque correcto** - Solo genera métodos HTTP RESTful, no lógica de estado

### Próximos Pasos

1. **Crear el generador** - Plugin CLI o extensión de herramienta existente
2. **Templates** - Para RestStd y DTOs
3. **Documentación** - Guía completa de uso
4. **Ecosistema** - Plugins para Vite, Nuxt, etc.

**Esto sería realmente el "Santo Grial" y diferenciaría significativamente este paquete de otros.**

