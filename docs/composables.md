# Composables

Esta sección documenta todos los composables disponibles en `@arex95/vue-core`. Los composables son funciones reactivas que proporcionan funcionalidad reutilizable para tus componentes Vue.

## useAuth

Composable flexible para manejar la autenticación del usuario, incluyendo login, logout y gestión de tokens. **Funciona con cualquier fetcher** (no acoplado a Axios).

### Uso

```typescript
import { useAuth } from '@arex95/vue-core';

// Opción 1: Usar fetcher por defecto (Axios si está configurado)
const { login, logout } = useAuth();

// Opción 2: Usar fetcher personalizado
import { createOfetchFetcher } from '@arex95/vue-core';
const ofetchFetcher = createOfetchFetcher('https://api.example.com');
const { login, logout } = useAuth(ofetchFetcher);

// Opción 3: Configurar fetcher global para auth
import { configAuthFetcher, createOfetchFetcher } from '@arex95/vue-core';
configAuthFetcher(createOfetchFetcher('https://api.example.com'));
// Ahora todos los useAuth() usarán ofetch
const { login, logout } = useAuth();
```

### Parámetros

- `fetcher` (opcional): Función fetcher personalizada. Si no se proporciona, usa el fetcher configurado globalmente o cae a Axios por defecto.

### Métodos

#### `login(params, persistence, tokenPaths?)`

Autentica al usuario y almacena los tokens.

**Parámetros:**
- `params` (`Record<string, unknown>`): Parámetros de autenticación (ej: `{ username, password }`)
- `persistence` (`'local' | 'session' | 'cookie'`): Preferencia de almacenamiento
  - `'local'`: Almacena en localStorage (persiste entre sesiones)
  - `'session'`: Almacena en sessionStorage (solo durante la sesión)
  - `'cookie'`: Almacena en cookies con encriptación y opciones de seguridad (recomendado para SSR/SSG)
- `tokenPaths` (opcional): Rutas personalizadas para extraer tokens de la respuesta

**Retorna:** `Promise<AuthResponse>`

**Ejemplos:**

```typescript
// Login básico con localStorage
const loginUser = async () => {
  try {
    const response = await login(
      { username: 'user@example.com', password: 'password' },
      'local'
    );
    console.log('Login exitoso', response);
  } catch (error) {
    console.error('Error en login', error);
  }
};

// Login con cookies (SSR/SSG)
const loginWithCookies = async () => {
  try {
    const response = await login(
      { username: 'user@example.com', password: 'password' },
      'cookie'
    );
    console.log('Login exitoso', response);
  } catch (error) {
    console.error('Error en login', error);
  }
};

// Login con fetcher personalizado
import { createOfetchFetcher } from '@arex95/vue-core';
const customFetcher = createOfetchFetcher('https://api.example.com');
const { login } = useAuth(customFetcher);

await login({ username, password }, 'local');
```

#### `logout(params?)`

Cierra la sesión del usuario y limpia las credenciales almacenadas.

**Parámetros:**
- `params` (`Record<string, unknown>`, opcional): Parámetros adicionales para enviar al endpoint de logout

**Ejemplo:**

```typescript
const logoutUser = async () => {
  await logout();
  // La página se recargará automáticamente
};

// Con parámetros adicionales
await logout({ reason: 'user_request' });
```

### Casos de Uso

#### Caso 1: Login con Recordarme

```vue
<template>
  <form @submit.prevent="handleLogin">
    <input v-model="form.username" type="text" />
    <input v-model="form.password" type="password" />
    <label>
      <input v-model="rememberMe" type="checkbox" />
      Recordarme
    </label>
    <button type="submit">Login</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth, handleError } from '@arex95/vue-core';

const { login } = useAuth();
const form = ref({ username: '', password: '' });
const rememberMe = ref(false);

const handleLogin = async () => {
  try {
    await login(
      form.value,
      rememberMe.value ? 'local' : 'session'
    );
  } catch (error) {
    handleError(error);
  }
};
</script>
```

#### Caso 2: Login con Cookies para SSR

```typescript
import { useAuth } from '@arex95/vue-core';

const { login } = useAuth();

// Usar cookies para SSR/SSG
await login({ username, password }, 'cookie');
```

#### Caso 3: Login con Fetcher Personalizado

```typescript
import { useAuth, createOfetchFetcher, configAuthFetcher } from '@arex95/vue-core';

// Opción A: Por instancia
const ofetchFetcher = createOfetchFetcher('https://api.example.com');
const { login } = useAuth(ofetchFetcher);

// Opción B: Global
configAuthFetcher(createOfetchFetcher('https://api.example.com'));
const { login } = useAuth(); // Usa el fetcher global
```

## useFetch

Factory function que crea funciones de query reutilizables para hacer peticiones API.

### Uso

```typescript
import { useFetch, axiosFetch } from '@arex95/vue-core';

const fetchItems = useFetch(axiosFetch);
```

### Parámetros

- `fetchFn`: Función base para realizar el fetch (ej: `axiosFetch`)
- `axiosCustomInstance` (opcional): Instancia personalizada de Axios

### Retorna

Una función que acepta configuración de Axios y opciones de query.

### Ejemplo

```typescript
import { useFetch, axiosFetch, getConfiguredAxiosInstance } from '@arex95/vue-core';

const fetchItems = useFetch(axiosFetch, getConfiguredAxiosInstance());

const result = await fetchItems({ url: '/api/items' });
```

**Nota:** `useFetch` es un helper opcional. Para operaciones RESTful, se recomienda usar `RestStd` directamente desde tus modelos. Para queries reactivas, usa tu propio composable (ej: `useQuery` de TanStack Vue Query).

## useBreakpoint

Composable reactivo para trabajar con breakpoints de Tailwind CSS.

### Uso

```typescript
import { useBreakpoint } from '@arex95/vue-core';

const {
  mobile,
  tablet,
  laptop,
  desktop,
  windowWidth,
  windowHeight,
  sm_GE,
  md_GE,
  lg_GE,
  // ... más propiedades
} = useBreakpoint();
```

### Propiedades Disponibles

#### Breakpoints Básicos
- `mobile`: `true` si el ancho es < 768px
- `tablet`: `true` si el ancho está entre 768px y 1024px
- `laptop`: `true` si el ancho está entre 1024px y 1280px
- `desktop`: `true` si el ancho es >= 1280px

#### Breakpoints por Tamaño
Para cada breakpoint (`sm`, `md`, `lg`, `xl`, `2xl`):
- `{size}_S`: Menor que el breakpoint
- `{size}_SE`: Menor o igual que el breakpoint
- `{size}_GE`: Mayor o igual que el breakpoint
- `{size}_{next}`: Entre dos breakpoints (ej: `sm_md`, `md_lg`)

#### Dimensiones
- `windowWidth`: Ancho actual de la ventana
- `windowHeight`: Alto actual de la ventana
- `current`: Breakpoint actual
- `active`: Breakpoint activo

### Ejemplo

```vue
<template>
  <div>
    <div v-if="mobile">Vista móvil</div>
    <div v-else-if="tablet">Vista tablet</div>
    <div v-else>Vista desktop</div>
    
    <p>Ancho: {{ windowWidth }}px</p>
  </div>
</template>

<script setup>
import { useBreakpoint } from '@arex95/vue-core';

const { mobile, tablet, windowWidth } = useBreakpoint();
</script>
```

## useFilter

Composable para filtrar arrays de objetos basado en diferentes criterios.

### Uso

```typescript
import { useFilter } from '@arex95/vue-core';

const filteredItems = useFilter(items, {
  field: 'name',
  type: 'string',
  criteria: 'search term'
});
```

### Parámetros

- `items`: Array de objetos a filtrar
- `filterConfig`:
  - `field`: Nombre del campo a filtrar
  - `type`: Tipo de filtro ('date' | 'string' | 'number' | 'boolean')
  - `criteria`: Criterio de filtrado (varía según el tipo)

### Tipos de Filtro

#### Filtro por String
```typescript
useFilter(items, {
  field: 'name',
  type: 'string',
  criteria: 'search term' // Búsqueda case-insensitive y sin acentos
});
```

#### Filtro por Fecha
```typescript
useFilter(items, {
  field: 'createdAt',
  type: 'date',
  criteria: {
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  }
});
```

#### Filtro por Número
```typescript
useFilter(items, {
  field: 'price',
  type: 'number',
  criteria: {
    min: 10,
    max: 100
  }
});
```

#### Filtro por Boolean
```typescript
useFilter(items, {
  field: 'isActive',
  type: 'boolean',
  criteria: true
});
```

## usePaginator

Composable para lógica de paginación.

### Uso

```typescript
import { ref } from 'vue';
import { usePaginator } from '@arex95/vue-core';

const page = ref(1);
const total = ref(100);
const pageSize = ref(10);

const { totalPages, canFetchNextPage, canFetchPreviousPage } = usePaginator(
  page,
  total,
  pageSize
);
```

### Retorna

- `totalPages`: Número total de páginas (computed)
- `canFetchNextPage()`: `true` si hay una página siguiente
- `canFetchPreviousPage()`: `true` si hay una página anterior

### Ejemplo

```vue
<template>
  <div>
    <button :disabled="!canFetchPreviousPage()" @click="page--">
      Anterior
    </button>
    <span>Página {{ page }} de {{ totalPages }}</span>
    <button :disabled="!canFetchNextPage()" @click="page++">
      Siguiente
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { usePaginator } from '@arex95/vue-core';

const page = ref(1);
const total = ref(100);
const pageSize = ref(10);

const { totalPages, canFetchNextPage, canFetchPreviousPage } = usePaginator(
  page,
  total,
  pageSize
);
</script>
```

## useSorter

Composable para ordenar arrays de objetos.

### Uso

```typescript
import { useSorter } from '@arex95/vue-core';

const sortedItems = useSorter(items, criteriaList, selectedCriteria);
```

### Parámetros

- `items`: Array a ordenar
- `criteriaList`: Lista de criterios de ordenamiento
- `selectedCriteria`: Valor del criterio seleccionado

### Estructura de Criterios

```typescript
const criteriaList = [
  {
    value: 1,
    label: 'Nombre A-Z',
    field: 'name',
    order: 'asc',
    type: 'string'
  },
  {
    value: 2,
    label: 'Fecha más reciente',
    field: 'createdAt',
    order: 'desc',
    type: 'date'
  },
  {
    value: 3,
    label: 'Precio menor a mayor',
    field: 'price',
    order: 'asc',
    type: 'number'
  }
];
```

### Tipos Soportados

- `'string'`: Ordenamiento alfabético
- `'number'`: Ordenamiento numérico
- `'date'`: Ordenamiento por fecha
- `'boolean'`: Ordenamiento booleano

### Ejemplo

```vue
<template>
  <select v-model="selectedSort">
    <option v-for="criteria in criteriaList" :key="criteria.value" :value="criteria.value">
      {{ criteria.label }}
    </option>
  </select>
  
  <div v-for="item in sortedItems" :key="item.id">
    {{ item.name }}
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useSorter } from '@arex95/vue-core';

const items = ref([...]); // tus items
const selectedSort = ref(1);

const criteriaList = [
  { value: 1, label: 'Nombre A-Z', field: 'name', order: 'asc', type: 'string' },
  { value: 2, label: 'Nombre Z-A', field: 'name', order: 'desc', type: 'string' }
];

const sortedItems = useSorter(items, criteriaList, selectedSort);
</script>
```

## useApiActivity

Composable para monitorear la actividad de la API.

### Uso

```typescript
import { useApiActivity } from '@arex95/vue-core';

const { isActive, isLoading } = useApiActivity();
```

## useUserActivity

Composable para monitorear la actividad del usuario.

### Uso

```typescript
import { useUserActivity } from '@arex95/vue-core';

const { isActive, lastActivity } = useUserActivity();
```

