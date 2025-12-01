# Guía de Inicio: @arex95/vue-core

Esta guía te llevará paso a paso para configurar y usar `@arex95/vue-core` en tu proyecto Vue.js.

## ¿Qué es @arex95/vue-core?

`@arex95/vue-core` es una biblioteca que proporciona un **estándar RESTful** para tus servicios API. Es completamente **agnóstica** del sistema de fetching que uses (Axios, ofetch, fetch, etc.), permitiéndote elegir la mejor opción para tu proyecto.

**Nota:** Si usas Nuxt, consulta la [guía de integración con Nuxt](./nuxt-integration.md) para evitar problemas de dependencias circulares.

## Paso 1: Instalación

### Instalar el paquete

```bash
npm install @arex95/vue-core
```

### Instalar dependencias peer (solo las que necesites)

**Si usas Axios:**
```bash
npm install axios
```

**Si usas ofetch:**
```bash
npm install ofetch
```

**Dependencias opcionales:**
```bash
npm install @vueuse/core jwt-decode uuid
```

## Paso 2: Configuración Inicial

Para detalles completos sobre todas las opciones de configuración, consulta [Guía de Configuración](./configuration.md) y [Instalación](./installation.md).

### 2.1 Configurar el Plugin en `main.ts`

En tu archivo principal (`main.ts` o `main.js`), importa y configura el plugin:

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import { ArexVueCore } from '@arex95/vue-core';

const app = createApp(App);

app.use(ArexVueCore, {
  appKey: 'your-secret-key-here',
  endpoints: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
  },
  tokenKeys: {
    accessToken: 'ACCESS_TOKEN',
    refreshToken: 'REFRESH_TOKEN',
  },
  tokenPaths: {
    accessToken: 'data.access_token',
    refreshToken: 'data.refresh_token',
  },
  refreshTokenPaths: {
    accessToken: 'data.access_token',
    refreshToken: 'data.refresh_token',
  },
  axios: {
    baseURL: 'https://api.example.com',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  },
});

app.mount('#app');
```

**Nota:** La configuración de `axios` es opcional si no usas Axios. Solo configúrala si planeas usar el fetcher por defecto basado en Axios.

## Paso 3: Elegir tu Sistema de Fetching

Tienes tres opciones principales:

### Opción A: Usar Axios (Recomendado si ya lo usas)

### Opción B: Usar ofetch (Más ligero y moderno)

### Opción C: Crear tu propio Fetcher

---

## Paso 4: Crear tu Primer Modelo/Servicio

Puedes extender `RestStd` directamente desde tu modelo o crear un servicio separado. **Recomendamos extender desde el modelo** para casos simples (es más semántico: `User.getOne()` vs `UserService.getOne()`).

### 4.1 Si usas Axios

**Opción A: Extender desde el Modelo (Recomendado)**

Si ya configuraste Axios con `configAxios()` en `main.ts`, **no necesitas definir `fetchFn`**:

```typescript
// src/models/Role.ts
import { RestStd } from '@arex95/vue-core';

export interface RoleData {
  id: number;
  name: string;
  description?: string;
}

export class Role extends RestStd {
  static override resource = 'roles';
  // fetchFn es opcional - usa la instancia de Axios configurada por defecto
}
```

**Si necesitas una instancia personalizada de Axios:**

```typescript
// src/models/Role.ts
import axios from 'axios';
import { RestStd, createAxiosFetcher } from '@arex95/vue-core';

export interface RoleData {
  id: number;
  name: string;
  description?: string;
}

const axiosInstance = axios.create({
  baseURL: 'https://api.example.com',
});

export class Role extends RestStd {
  static override resource = 'roles';
  static fetchFn = createAxiosFetcher(axiosInstance);
}
```

**Opción B: Servicio Separado (Si necesitas lógica adicional)**

```typescript
// src/services/RoleService.ts
import { RestStd } from '@arex95/vue-core';

export class RoleService extends RestStd {
  static override resource = 'roles';
  // fetchFn es opcional - usa la instancia de Axios configurada por defecto
  
  static async getActiveRoles() {
    return this.getAll({ params: { status: 'active' } });
  }
}
```

**Usar en tu componente (Modelo directo):**

```vue
<template>
  <div>
    <div v-if="isLoading">Cargando...</div>
    <div v-else>
      <div v-for="role in roles" :key="role.id">
        {{ role.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { Role, RoleData } from '@/models/Role';

const { data: roles, isLoading } = useQuery({
  queryKey: ['roles'],
  queryFn: () => Role.getAll<RoleData[]>(),
});
</script>
```

### 4.2 Si usas ofetch

**Crear el modelo:**

```typescript
// src/models/Role.ts
import { RestStd, createOfetchFetcher } from '@arex95/vue-core';

export interface RoleData {
  id: number;
  name: string;
}

export class Role extends RestStd {
  static override resource = 'roles';
  // Si usas ofetch, DEBES definir fetchFn
  static fetchFn = createOfetchFetcher('https://api.example.com');
}
```

**Usar en tu componente:**

```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { Role, RoleData } from '@/models/Role';

const { data: roles, isLoading } = useQuery({
  queryKey: ['roles'],
  queryFn: () => Role.getAll<RoleData[]>(),
});
</script>
```

### 4.3 Si creas tu propio Fetcher

**Crear el modelo:**

```typescript
// src/models/Role.ts
import { RestStd, Fetcher } from '@arex95/vue-core';

export interface RoleData {
  id: number;
  name: string;
}

const myCustomFetcher: Fetcher = async (config) => {
  const response = await fetch(config.url, {
    method: config.method,
    headers: config.headers,
    body: config.data ? JSON.stringify(config.data) : undefined,
  });
  return response.json();
};

export class Role extends RestStd {
  static override resource = 'roles';
  static fetchFn = myCustomFetcher;
}
```

## Paso 5: Operaciones CRUD Básicas

### 5.1 Obtener Todos los Items

```typescript
import { Role, RoleData } from '@/models/Role';

const roles = await Role.getAll<RoleData[]>();
```

**Con parámetros de query:**

```typescript
const activeRoles = await Role.getAll<RoleData[]>({
  params: { status: 'active' }
});
```

**Con URL personalizada:**

```typescript
const customRoles = await Role.getAll<RoleData[]>({
  url: 'roles/custom-endpoint',
  params: { filter: 'special' }
});
```

### 5.2 Obtener un Item por ID

```typescript
const role = await Role.getOne<RoleData>({ id: 1 });
```

**Con parámetros adicionales:**

```typescript
const roleWithPermissions = await Role.getOne<RoleData>({
  id: 1,
  params: { include: 'permissions' }
});
```

### 5.3 Crear un Nuevo Item

```typescript
const newRole = await Role.create<RoleData>({
  data: {
    name: 'Administrator',
    description: 'Full access'
  }
});
```

### 5.4 Actualizar un Item

```typescript
const updatedRole = await Role.update<RoleData>({
  id: 1,
  data: {
    name: 'Super Administrator'
  }
});
```

### 5.5 Actualización Parcial (PATCH)

```typescript
const patchedRole = await Role.patch<RoleData>({
  id: 1,
  data: {
    description: 'Updated description'
  }
});
```

### 5.6 Eliminar un Item

```typescript
await Role.delete({ id: 1 });
```

## Paso 6: Operaciones en Lote (Bulk)

### 6.1 Crear Múltiples Items

```typescript
const createdRoles = await Role.bulkCreate<RoleData[]>({
  data: [
    { name: 'Role 1' },
    { name: 'Role 2' },
    { name: 'Role 3' }
  ]
});
```

### 6.2 Actualizar Múltiples Items

```typescript
const updatedRoles = await Role.bulkUpdate<RoleData[]>({
  data: [
    { id: 1, name: 'Updated Role 1' },
    { id: 2, name: 'Updated Role 2' }
  ]
});
```

### 6.3 Eliminar Múltiples Items

```typescript
await Role.bulkDelete({
  ids: [1, 2, 3]
});
```

## Paso 7: Operaciones Avanzadas

### 7.1 Upsert (Crear o Actualizar)

```typescript
const role = await Role.upsert<RoleData>({
  data: {
    id: 1,
    name: 'Updated Role'
  }
});
```

Si el objeto tiene `id`, actualiza; si no, crea uno nuevo.

### 7.2 Request Personalizado

```typescript
const result = await Role.customRequest({
  method: 'POST',
  url: 'roles/custom-action',
  data: { action: 'activate' },
  params: { userId: 123 }
});
```

### 7.3 Usar URL Personalizada en Cualquier Método

```typescript
const role = await Role.getOne<RoleData>({
  id: 123,
  url: 'roles/custom-endpoint'
});
```

## Paso 8: Configuración de Modelos

### 8.1 Headers Globales

```typescript
Role.setHeaders({
  'X-Custom-Header': 'value',
  'Authorization': 'Bearer token'
});
```

### 8.2 FormData

```typescript
export class File extends RestStd {
  static override resource = 'files';
  static isFormData = true;
  static fetchFn = createAxiosFetcher(axiosInstance);
}

await File.create({
  data: {
    file: fileObject,
    name: 'document.pdf'
  }
});
```

### 8.3 Instancia Personalizada de Axios

```typescript
import axios from 'axios';
import { RestStd, createAxiosFetcher } from '@arex95/vue-core';

const externalApi = axios.create({
  baseURL: 'https://external-api.com',
  headers: {
    'X-API-Key': 'your-api-key'
  }
});

export class ExternalData extends RestStd {
  static override resource = 'data';
  static fetchFn = createAxiosFetcher(externalApi);
}
```

### 8.4 Instancia Personalizada de ofetch

```typescript
import { createFetch } from 'ofetch';
import { RestStd, createOfetchFetcher } from '@arex95/vue-core';

const ofetchInstance = createFetch({
  baseURL: 'https://api.example.com',
  headers: {
    'X-API-Key': 'your-api-key'
  }
});

export class Item extends RestStd {
  static override resource = 'items';
  static fetchFn = createOfetchFetcher(undefined, { fetch: ofetchInstance });
}
```

## Paso 9: Uso con Vue Query

### 9.1 Query Básica

```typescript
import { useQuery } from '@tanstack/vue-query';
import { Role, RoleData } from '@/models/Role';

const { data: roles, isLoading, error } = useQuery({
  queryKey: ['roles'],
  queryFn: () => Role.getAll<RoleData[]>(),
});
```

### 9.2 Query con Parámetros

```typescript
const { data: role } = useQuery({
  queryKey: ['role', roleId],
  queryFn: () => Role.getOne<RoleData>({ id: roleId }),
  enabled: !!roleId,
});
```

### 9.3 Mutations (Crear, Actualizar, Eliminar)

```typescript
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { Role, RoleData } from '@/models/Role';

const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: (data: Partial<RoleData>) => Role.create<RoleData>({ data }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  },
});

const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: number; data: Partial<RoleData> }) =>
    Role.update<RoleData>({ id, data }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  },
});

const deleteMutation = useMutation({
  mutationFn: (id: number) => Role.delete({ id }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  },
});
```

## Paso 10: Manejo de Errores

### 10.1 Con Try/Catch y handleError

```typescript
import { handleError, NetworkError, AuthError } from '@arex95/vue-core';

try {
  const roles = await Role.getAll<RoleData[]>();
} catch (error) {
  const errorInfo = handleError(error); // Logging automático estructurado
  
  if (error instanceof NetworkError) {
    if (error.statusCode === 401) {
      // Token expirado
      router.push('/login');
    } else if (error.statusCode === 500) {
      // Error del servidor
      showError('Server error. Please try again later.');
    }
  }
}
```

### 10.2 Con Vue Query

```typescript
import { handleError, NetworkError } from '@arex95/vue-core';

const { data, error, isError } = useQuery({
  queryKey: ['roles'],
  queryFn: async () => {
    try {
      return await Role.getAll<RoleData[]>();
    } catch (err) {
      handleError(err);
      throw err;
    }
  },
  onError: (err) => {
    if (err instanceof NetworkError && err.statusCode === 401) {
      router.push('/login');
    }
  }
});
```

### 10.3 Retry Automático

```typescript
import { RestStd, RetryConfig } from '@arex95/vue-core';

export class Role extends RestStd {
  static override resource = 'roles';
  
  // Configurar retry para operaciones de lectura
  static retryConfig: RetryConfig = {
    retries: 3,
    retryDelay: 1000,
    maxRetryDelay: 10000,
    backoffMultiplier: 2,
  };
}

// Ahora getAll() reintentará automáticamente en caso de error
const roles = await Role.getAll<RoleData[]>();
```

## Paso 11: Ejemplo Completo

Aquí tienes un ejemplo completo de un modelo y su uso:

**Modelo (`src/models/User.ts`):**

```typescript
import axios from 'axios';
import { RestStd, createAxiosFetcher } from '@arex95/vue-core';

export interface UserData {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

const axiosInstance = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'https://api.example.com',
});

export class User extends RestStd {
  static override resource = 'users';
  static fetchFn = createAxiosFetcher(axiosInstance);
}
```

**Componente (`src/components/UserList.vue`):**

```vue
<template>
  <div>
    <div v-if="isLoading">Cargando usuarios...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <div v-for="user in users" :key="user.id" class="user-card">
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
import { User, UserData } from '@/models/User';

const queryClient = useQueryClient();

const { data: users, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => User.getAll<UserData[]>(),
});

const deleteMutation = useMutation({
  mutationFn: (id: number) => User.delete({ id }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});

const createMutation = useMutation({
  mutationFn: (userData: Partial<UserData>) => User.create<UserData>({ data: userData }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});

const deleteUser = (id: number) => {
  deleteMutation.mutate(id);
};

const createNewUser = () => {
  createMutation.mutate({
    name: 'Nuevo Usuario',
    email: 'nuevo@example.com',
  });
};
</script>
```

## Paso 11: Retry Logic y Manejo de Errores Avanzado

### 11.1 Configurar Retry en Modelos

```typescript
import { RestStd, RetryConfig, NetworkError, ServerError } from '@arex95/vue-core';

export class Product extends RestStd {
  static override resource = 'products';
  
  // Retry solo para operaciones de lectura
  static retryConfig: RetryConfig = {
    retries: 3,
    retryDelay: 1000,
    maxRetryDelay: 10000,
    backoffMultiplier: 2,
    retryCondition: (error) => {
      if (error instanceof NetworkError || error instanceof ServerError) {
        const statusCode = error.statusCode;
        if (!statusCode) return true; // Error de red
        if (statusCode >= 500) return true; // Error del servidor
        if (statusCode === 408 || statusCode === 429) return true; // Timeout o rate limit
      }
      return false;
    }
  };
}
```

### 11.2 Manejo de Errores con Clases Personalizadas

```typescript
import { handleError, NetworkError, AuthError, ValidationError } from '@arex95/vue-core';

try {
  await User.create({ data: userData });
} catch (error) {
  const errorInfo = handleError(error);
  
  if (error instanceof ValidationError) {
    // Mostrar errores de validación en el formulario
    error.issues.forEach(issue => {
      showFieldError(issue.field, issue.message);
    });
  } else if (error instanceof NetworkError) {
    if (error.statusCode === 401) {
      router.push('/login');
    } else {
      showError('Network error. Please try again.');
    }
  } else if (error instanceof AuthError) {
    router.push('/login');
  }
}
```

## Paso 12: Uso de Cookies para Storage

### 12.1 Login con Cookies

```typescript
import { useAuth } from '@arex95/vue-core';

const { login } = useAuth();

// Usar cookies (recomendado para SSR/SSG)
await login({ username, password }, 'cookie');
```

### 12.2 Configurar Opciones de Cookies

```typescript
import { storeEncryptedItem, CookieOptions } from '@arex95/vue-core';

const cookieOptions: CookieOptions = {
  expires: 30,              // Días hasta expiración
  path: '/',                // Ruta de la cookie
  domain: '.example.com',   // Dominio (opcional)
  secure: true,             // Solo HTTPS (automático en producción)
  sameSite: 'Strict',       // 'Strict', 'Lax', o 'None'
};

await storeEncryptedItem('key', 'value', secretKey, 'cookie', cookieOptions);
```

## Resumen de Conceptos Clave

1. **`RestStd`**: Clase base que extiendes para crear modelos/servicios
2. **`resource`**: El endpoint del recurso (obligatorio, debe usar `override`)
3. **`fetchFn`**: Función fetcher (opcional, usa Axios por defecto si está configurado)
4. **`retryConfig`**: Configuración de retry con exponential backoff (opcional)
5. **Helpers**: `createAxiosFetcher` o `createOfetchFetcher` para crear fetchers
6. **Métodos**: Todos usan objetos de parámetros para mejor autocompletado
7. **Tipos genéricos**: Mejor inferencia de TypeScript con `TResponse`, `TData`, `TParams`
8. **URLs personalizadas**: Puedes sobrescribir el `resource` con el parámetro `url`
9. **Modelo vs Servicio**: Extiende `RestStd` directamente desde tu modelo (ej: `User.getOne()`) para casos simples
10. **Storage**: Soporte para localStorage, sessionStorage y cookies con encriptación
11. **Errores**: Clases de error personalizadas con información estructurada
12. **useAuth flexible**: Funciona con cualquier fetcher, no acoplado a Axios

## Próximos Pasos

- Lee la [documentación completa de API](./api-reference.md)
- Revisa los [ejemplos avanzados](./EXAMPLES.md)
- Consulta la [guía de autenticación](./authentication.md)

## ¿Necesitas Ayuda?

Si tienes dudas o problemas:
- Revisa la [documentación completa](./README.md)
- Consulta los [ejemplos](./EXAMPLES.md)
- Revisa el [plan de implementación](./IMPLEMENTATION_PLAN.md) para entender la arquitectura

