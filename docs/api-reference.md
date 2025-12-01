# Referencia de API

Documentación completa de la API de `@arex95/vue-core`.

## RestStd

Clase estándar para operaciones RESTful que proporciona métodos CRUD genéricos con tipos mejorados, retry logic opcional, y manejo de errores mejorado.

**Importante:** Usa los métodos de `RestStd` **directamente** en tus componentes/vistas. No necesitas crear funciones wrapper. Los métodos están diseñados para usarse directamente con `useQuery` y `useMutation` de TanStack Vue Query.

### Características

- ✅ **Tipos genéricos mejorados**: Mejor inferencia de TypeScript con `TResponse`, `TData`, `TParams`
- ✅ **Retry logic opcional**: Reintentos automáticos con exponential backoff
- ✅ **Manejo de errores mejorado**: Errores se convierten automáticamente a clases personalizadas
- ✅ **URLs personalizadas**: Sobrescribe el `resource` con el parámetro `url` en cualquier método
- ✅ **Agnóstico de fetching**: Funciona con cualquier fetcher (Axios, ofetch, fetch, custom)

### Configuración

**Recomendación:** Extiende `RestStd` directamente desde tu modelo (ej: `User.getOne()`). No necesitas crear un servicio separado a menos que necesites lógica adicional.

**Si ya configuraste Axios con `configAxios()` en `main.ts`:**

```typescript
import { RestStd } from '@arex95/vue-core';

export interface UserData {
  id: number;
  name: string;
  email: string;
}

export class User extends RestStd {
  static override resource = 'users';
  // fetchFn es opcional - usa la instancia de Axios configurada por defecto
}
```

**Si necesitas una instancia personalizada de Axios:**

```typescript
import axios from 'axios';
import { RestStd, createAxiosFetcher } from '@arex95/vue-core';

export interface UserData {
  id: number;
  name: string;
  email: string;
}

const axiosInstance = axios.create({ baseURL: 'https://api.example.com' });

export class User extends RestStd {
  static override resource = 'users';
  static fetchFn = createAxiosFetcher(axiosInstance);
}
```

### Propiedades Estáticas

#### `resource`
Ruta base del recurso (ej: `/users`)

#### `isFormData`
Si es `true`, los datos se envían como FormData. Por defecto: `false`

#### `headers`
Headers globales para todas las peticiones

#### `fetchFn`
Función para realizar las peticiones HTTP (opcional, usa Axios por defecto si está configurado)

#### `retryConfig`
Configuración de retry para reintentos automáticos con exponential backoff (opcional)

```typescript
import { RetryConfig } from '@arex95/vue-core';

export class Role extends RestStd {
  static override resource = 'roles';
  static retryConfig: RetryConfig = {
    retries: 3,              // Número de reintentos
    retryDelay: 1000,        // Delay inicial en ms
    maxRetryDelay: 10000,    // Delay máximo en ms
    backoffMultiplier: 2,    // Multiplicador para exponential backoff
    retryCondition: (error) => {
      // Solo reintentar en errores 5xx, timeouts, o errores de red
      return error.statusCode >= 500 || error.statusCode === 408;
    }
  };
}
```

### Métodos Estáticos

#### `setHeaders(headers)`

Establece headers globales.

```typescript
User.setHeaders({
  'Authorization': 'Bearer token',
  'X-Custom-Header': 'value'
});
```

#### `setHeaders(headers)`

Establece headers globales.

```typescript
User.setHeaders({
  'Authorization': 'Bearer token',
  'X-Custom-Header': 'value'
});
```

#### `getAll<TResponse, TParams>(options?)`

Obtiene todos los items del recurso con tipos genéricos mejorados para mejor inferencia de TypeScript.

**Tipos genéricos:**
- `TResponse`: Tipo de la respuesta (por defecto: `unknown`)
- `TParams`: Tipo de los parámetros de query (por defecto: `Record<string, unknown>`)

```typescript
import { useQuery } from '@tanstack/vue-query';
import { User, UserData } from '@/models/User';

// Inferencia automática de tipos
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: () => User.getAll<UserData[]>(),
});

// Con parámetros tipados
interface UserFilters {
  status: 'active' | 'inactive';
  role?: string;
}

const { data: filteredUsers } = useQuery({
  queryKey: ['users', 'active'],
  queryFn: () => User.getAll<UserData[], UserFilters>({
    params: { status: 'active', role: 'admin' }
  }),
});

// Con URL personalizada
const { data: customUsers } = useQuery({
  queryKey: ['users', 'custom'],
  queryFn: () => User.getAll<UserData[]>({
    url: 'users/custom-endpoint',
    params: { filter: 'special' }
  }),
});
```

#### `getOne<TResponse, TParams>(options)`

Obtiene un item por su ID con tipos genéricos mejorados.

**Tipos genéricos:**
- `TResponse`: Tipo de la respuesta (por defecto: `unknown`)
- `TParams`: Tipo de los parámetros de query (por defecto: `Record<string, unknown>`)

```typescript
import { useQuery } from '@tanstack/vue-query';
import { User, UserData } from '@/models/User';

// Inferencia automática de tipos
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => User.getOne<UserData>({ id: userId }),
  enabled: !!userId,
});

// Con parámetros tipados
interface UserQueryParams {
  include: 'permissions' | 'roles' | 'all';
  fields?: string[];
}

const { data: userWithRelations } = useQuery({
  queryKey: ['user', userId, 'with-relations'],
  queryFn: () => User.getOne<UserData, UserQueryParams>({
    id: userId,
    params: { include: 'permissions', fields: ['id', 'name'] }
  }),
});
```

#### `create<TResponse, TData>(options)`

Crea un nuevo item con tipos genéricos mejorados.

**Tipos genéricos:**
- `TResponse`: Tipo de la respuesta (por defecto: `unknown`)
- `TData`: Tipo de los datos a enviar (por defecto: `unknown`)

```typescript
import { useMutation } from '@tanstack/vue-query';
import { User, UserData } from '@/models/User';

// Inferencia automática de tipos
const createMutation = useMutation({
  mutationFn: (userData: Partial<UserData>) => User.create<UserData, Partial<UserData>>({
    data: userData
  }),
});

createMutation.mutate({
  name: 'John Doe',
  email: 'john@example.com'
});

// Con tipos explícitos para mejor autocompletado
interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

const createMutationTyped = useMutation({
  mutationFn: (userData: CreateUserInput) => 
    User.create<UserData, CreateUserInput>({
      data: userData
    }),
});
```

#### `bulkCreate(options)`

Crea múltiples items en una sola petición.

```typescript
import { useMutation } from '@tanstack/vue-query';
import { User, UserData } from '@/models/User';

const bulkCreateMutation = useMutation({
  mutationFn: (users: Partial<UserData>[]) => User.bulkCreate<UserData[]>({
    data: users
  }),
});

bulkCreateMutation.mutate([
  { name: 'User 1' },
  { name: 'User 2' }
]);
```

#### `update<TResponse, TData>(options)`

Actualiza un item existente con tipos genéricos mejorados.

**Tipos genéricos:**
- `TResponse`: Tipo de la respuesta (por defecto: `unknown`)
- `TData`: Tipo de los datos a enviar (por defecto: `unknown`)

```typescript
import { useMutation } from '@tanstack/vue-query';
import { User, UserData } from '@/models/User';

// Inferencia automática de tipos
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: number; data: Partial<UserData> }) => 
    User.update<UserData, Partial<UserData>>({ id, data }),
});

updateMutation.mutate({
  id: 123,
  data: { name: 'Jane Doe' }
});

// Con tipos explícitos
interface UpdateUserInput {
  name?: string;
  email?: string;
}

const updateMutationTyped = useMutation({
  mutationFn: ({ id, data }: { id: number; data: UpdateUserInput }) => 
    User.update<UserData, UpdateUserInput>({ id, data }),
});
```

#### `bulkUpdate<TResponse, TData>(options)`

Actualiza múltiples items con tipos genéricos mejorados.

**Tipos genéricos:**
- `TResponse`: Tipo de la respuesta (por defecto: `unknown`)
- `TData`: Tipo de los items en el array (por defecto: `unknown`)

```typescript
import { useMutation } from '@tanstack/vue-query';
import { User, UserData } from '@/models/User';

// Inferencia automática de tipos
const bulkUpdateMutation = useMutation({
  mutationFn: (users: Partial<UserData>[]) => User.bulkUpdate<UserData[], Partial<UserData>>({
    data: users
  }),
});

bulkUpdateMutation.mutate([
  { id: 1, name: 'User 1 Updated' },
  { id: 2, name: 'User 2 Updated' }
]);
```

#### `patch<TResponse, TData>(options)`

Actualización parcial de un item. El tipo `TData` se trata como `Partial<TData>` automáticamente.

**Tipos genéricos:**
- `TResponse`: Tipo de la respuesta (por defecto: `unknown`)
- `TData`: Tipo base de los datos (se usa como `Partial<TData>`)

```typescript
import { useMutation } from '@tanstack/vue-query';
import { User, UserData } from '@/models/User';

// Inferencia automática de tipos (TData se trata como Partial)
const patchMutation = useMutation({
  mutationFn: ({ id, data }: { id: number; data: Partial<UserData> }) =>
    User.patch<UserData, UserData>({ id, data }),
});

patchMutation.mutate({
  id: 123,
  data: { email: 'newemail@example.com' } // Solo campos necesarios
});
```

#### `delete<TResponse>(options)`

Elimina un item con tipo genérico para la respuesta.

**Tipos genéricos:**
- `TResponse`: Tipo de la respuesta (por defecto: `unknown`)

```typescript
import { useMutation } from '@tanstack/vue-query';
import { User } from '@/models/User';

// Inferencia automática de tipos
const deleteMutation = useMutation({
  mutationFn: (id: number) => User.delete<{ success: boolean; message: string }>({ id }),
});

deleteMutation.mutate(123);
```

#### `bulkDelete<TResponse>(options)`

Elimina múltiples items con tipo genérico para la respuesta.

**Tipos genéricos:**
- `TResponse`: Tipo de la respuesta (por defecto: `unknown`)

```typescript
import { useMutation } from '@tanstack/vue-query';
import { User } from '@/models/User';

// Inferencia automática de tipos
const bulkDeleteMutation = useMutation({
  mutationFn: (ids: number[]) => User.bulkDelete<{ deleted: number }>({ ids }),
});

bulkDeleteMutation.mutate([1, 2, 3]);
```

#### `upsert<TResponse, TData>(options)`

Crea o actualiza un item según si tiene `id`. El tipo `TData` debe incluir `id?: string | number`.

**Tipos genéricos:**
- `TResponse`: Tipo de la respuesta (por defecto: `unknown`)
- `TData`: Tipo de los datos (debe tener `id?: string | number`)

```typescript
import { useMutation } from '@tanstack/vue-query';
import { User, UserData } from '@/models/User';

// Inferencia automática de tipos
const upsertMutation = useMutation({
  mutationFn: (userData: Partial<UserData> & { id?: number }) => 
    User.upsert<UserData, Partial<UserData> & { id?: number }>({
      data: userData
    }),
});

// Crear nuevo (sin id)
upsertMutation.mutate({ name: 'New User' });

// Actualizar existente (con id)
upsertMutation.mutate({ id: 123, name: 'Updated User' });
```

#### `customRequest<TResponse, TParams, TData>(options)`

Realiza una petición personalizada con tipos genéricos completos.

**Tipos genéricos:**
- `TResponse`: Tipo de la respuesta (por defecto: `unknown`)
- `TParams`: Tipo de los parámetros de query (por defecto: `Record<string, unknown>`)
- `TData`: Tipo de los datos del body (por defecto: `unknown`)

```typescript
import { useMutation } from '@tanstack/vue-query';
import { User } from '@/models/User';

// Inferencia automática de tipos
const customMutation = useMutation({
  mutationFn: () => User.customRequest<{ success: boolean }, { param: string }, { action: string }>({
    method: 'POST',
    url: 'users/custom-action',
    params: { param: 'value' },
    data: { action: 'activate' }
  }),
});

// Con tipos explícitos
interface CustomParams {
  param: string;
  filter?: string;
}

interface CustomData {
  action: 'activate' | 'deactivate';
  reason?: string;
}

interface CustomResponse {
  success: boolean;
  message: string;
}

const customTyped = useMutation({
  mutationFn: () => User.customRequest<CustomResponse, CustomParams, CustomData>({
    method: 'POST',
    url: 'users/custom-action',
    params: { param: 'value', filter: 'active' },
    data: { action: 'activate', reason: 'User request' }
  }),
});
```

### Ejemplo Completo

**Modelo (`src/models/Product.ts`):**

```typescript
import axios from 'axios';
import { RestStd, createAxiosFetcher } from '@arex95/vue-core';

export interface ProductData {
  id: number;
  name: string;
  price: number;
  category: string;
}

const axiosInstance = axios.create({
  baseURL: 'https://api.example.com',
});

export class Product extends RestStd {
  static override resource = 'products';
  static fetchFn = createAxiosFetcher(axiosInstance);
}
```

**Componente (`src/components/ProductList.vue`):**

```vue
<template>
  <div>
    <div v-if="isLoading">Cargando productos...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <div v-for="product in products" :key="product.id">
        <h3>{{ product.name }}</h3>
        <p>{{ product.price }}</p>
        <button @click="deleteProduct(product.id)">Eliminar</button>
      </div>
      <button @click="createNewProduct">Crear Producto</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { Product, ProductData } from '@/models/Product';

const queryClient = useQueryClient();

const { data: products, isLoading, error } = useQuery({
  queryKey: ['products'],
  queryFn: () => Product.getAll<ProductData[]>({
    params: { category: 'electronics' }
  }),
});

const deleteMutation = useMutation({
  mutationFn: (id: number) => Product.delete({ id }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  },
});

const createMutation = useMutation({
  mutationFn: (productData: Partial<ProductData>) => Product.create<ProductData>({
    data: productData
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  },
});

const deleteProduct = (id: number) => {
  deleteMutation.mutate(id);
};

const createNewProduct = () => {
  createMutation.mutate({
    name: 'Nuevo Producto',
    price: 99.99,
  });
};
</script>
```

## Funciones de Configuración

### `configAppKey(options)`

Configura la clave de la aplicación.

```typescript
import { configAppKey } from '@arex95/vue-core';

configAppKey({
  appKey: 'new-secret-key'
});
```

### `configEndpoints(options)`

Configura los endpoints de autenticación.

```typescript
import { configEndpoints } from '@arex95/vue-core';

configEndpoints({
  loginEndpoint: '/api/login',
  refreshEndpoint: '/api/refresh',
  logoutEndpoint: '/api/logout',
});
```

### `configTokenKeys(options)`

Configura las claves de almacenamiento de tokens.

```typescript
import { configTokenKeys } from '@arex95/vue-core';

configTokenKeys({
  accessTokenKey: 'ACCESS_TOKEN',
  refreshTokenKey: 'REFRESH_TOKEN',
});
```

### `configTokenPaths(options)`

Configura las rutas para extraer tokens del login.

```typescript
import { configTokenPaths } from '@arex95/vue-core';

configTokenPaths({
  accessTokenPath: 'data.access_token',
  refreshTokenPath: 'data.refresh_token',
});
```

### `configRefreshTokenPaths(options)`

Configura las rutas para extraer tokens del refresh.

```typescript
import { configRefreshTokenPaths } from '@arex95/vue-core';

configRefreshTokenPaths({
  accessTokenPath: 'data.access_token',
  refreshTokenPath: 'data.refresh_token',
});
```

### `configAxios(options)`

Configura la instancia de Axios.

```typescript
import { configAxios } from '@arex95/vue-core';

configAxios({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: false,
});
```

## Funciones de Obtención

### `getAppKey()`

Obtiene la clave de la aplicación configurada.

```typescript
import { getAppKey } from '@arex95/vue-core';

const appKey = getAppKey();
```

### `getEndpointsConfig()`

Obtiene la configuración de endpoints.

```typescript
import { getEndpointsConfig } from '@arex95/vue-core';

const endpoints = getEndpointsConfig();
// { LOGIN: '/api/login', REFRESH: '/api/refresh', LOGOUT: '/api/logout' }
```

### `getConfiguredAxiosInstance()`

Obtiene la instancia de Axios configurada.

```typescript
import { getConfiguredAxiosInstance } from '@arex95/vue-core';

const axiosInstance = getConfiguredAxiosInstance();
```

## Servicios de Autenticación

### `getAuthAccessToken(secretKey, persistence)`

Obtiene el access token almacenado.

```typescript
import { getAuthAccessToken, getAppKey } from '@arex95/vue-core';

const appKey = getAppKey();
const token = await getAuthAccessToken(appKey, 'local');
```

### `getAuthRefreshToken(secretKey, persistence)`

Obtiene el refresh token almacenado.

```typescript
import { getAuthRefreshToken, getAppKey } from '@arex95/vue-core';

const appKey = getAppKey();
const token = await getAuthRefreshToken(appKey, 'local');
```

### `cleanCredentials(persistence)`

Limpia todas las credenciales almacenadas.

```typescript
import { cleanCredentials, getSessionPersistence } from '@arex95/vue-core';

const persistence = await getSessionPersistence();
await cleanCredentials(persistence);
```

### `refreshTokens(axiosInstance)`

Refresca los tokens de autenticación.

```typescript
import { refreshTokens, getConfiguredAxiosInstance } from '@arex95/vue-core';

const axiosInstance = getConfiguredAxiosInstance();
const response = await refreshTokens(axiosInstance);
```

## Enums

### BreakpointsEnums

```typescript
import { BreakpointsEnums } from '@arex95/vue-core';

// Valores disponibles
BreakpointsEnums.SM  // 'sm'
BreakpointsEnums.MD  // 'md'
BreakpointsEnums.LG  // 'lg'
BreakpointsEnums.XL  // 'xl'
BreakpointsEnums['2XL'] // '2xl'
```

### ContentTypeEnum

```typescript
import { ContentTypeEnum } from '@arex95/vue-core';

ContentTypeEnum.JSON        // 'application/json'
ContentTypeEnum.FORM_DATA   // 'multipart/form-data'
ContentTypeEnum.FORM_URL    // 'application/x-www-form-urlencoded'
```

### StorageEnums

```typescript
import { StorageEnums } from '@arex95/vue-core';

StorageEnums.LOCAL   // 'local'
StorageEnums.SESSION // 'session'
```

## Tipos TypeScript

### `ArexVueCoreOptions`

Opciones de configuración del plugin.

```typescript
interface ArexVueCoreOptions {
  appKey: string;
  endpoints: EndpointsConfig;
  tokenKeys: TokenConfig;
  tokenPaths: TokenPathsConfig;
  refreshTokenPaths: TokenPathsConfig;
  axios: AxiosServiceOptions;
}
```

### `AuthResponse`

Respuesta de autenticación.

```typescript
interface AuthResponse {
  [key: string]: any;
}
```

### `LocationPreference`

Preferencia de almacenamiento.

```typescript
type LocationPreference = 'local' | 'session';
```

### `AuthTokenPaths`

Rutas para extraer tokens.

```typescript
interface AuthTokenPaths {
  accessTokenPath?: string;
  refreshTokenPath?: string;
}
```

## Exportaciones Principales

Todas las exportaciones están disponibles desde el paquete principal:

```typescript
import {
  // Plugin
  ArexVueCore,
  
  // Composables
  useAuth,
  useBreakpoint,
  useFilter,
  usePaginator,
  useSorter,
  
  // REST
  RestStd,
  
  // Fetchers
  createAxiosFetcher,
  createOfetchFetcher,
  
  // Config
  configAppKey,
  configEndpoints,
  configAxios,
  getConfiguredAxiosInstance,
  
  // Services
  getAuthAccessToken,
  getAuthRefreshToken,
  cleanCredentials,
  
  // Utils
  formatDate,
  toCamelCase,
  isValidEmail,
  // ... más utilidades
  
  // Types
  ArexVueCoreOptions,
  AuthResponse,
  Fetcher,
  FetcherConfig,
  // ... más tipos
  
  // Enums
  BreakpointsEnums,
  ContentTypeEnum,
  // ... más enums
} from '@arex95/vue-core';
```

