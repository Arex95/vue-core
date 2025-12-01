# Análisis: Soporte para Axios y ofetch

## Objetivo

Proporcionar helpers para los dos sistemas de fetching más usados (Axios y ofetch) y permitir que el usuario use su propio fetcher personalizado.

## Comparación: Axios vs ofetch

### Axios

**Características:**
- ✅ Interceptores (request/response)
- ✅ Cancelación de requests
- ✅ Transformación automática de datos
- ✅ Timeout configurable
- ✅ Soporte para upload/download progress
- ✅ Manejo automático de JSON
- ✅ Compatible con Node.js y navegadores

**API:**
```typescript
axios({
  method: 'GET',
  url: '/api/users',
  params: { page: 1 },
  data: { name: 'John' },
  headers: { 'Authorization': 'Bearer token' }
})
```

**Respuesta:**
```typescript
{
  data: any,        // Datos de la respuesta
  status: number,   // Status code
  statusText: string,
  headers: {},       // Headers de respuesta
  config: {}        // Configuración de la request
}
```

### ofetch

**Características:**
- ✅ Basado en Fetch API (más ligero)
- ✅ Interceptores (hooks)
- ✅ Auto-retry
- ✅ Auto-parsing (JSON, text, blob, etc.)
- ✅ TypeScript first
- ✅ Universal (Node.js, navegadores, workers)
- ✅ Mejor tree-shaking

**API:**
```typescript
ofetch('/api/users', {
  method: 'GET',
  query: { page: 1 },
  body: { name: 'John' },
  headers: { 'Authorization': 'Bearer token' }
})
```

**Respuesta:**
```typescript
// Retorna directamente los datos (auto-parsed)
any
```

**Diferencias clave:**
- `params` (Axios) vs `query` (ofetch)
- `data` (Axios) vs `body` (ofetch)
- Axios retorna objeto con `data`, ofetch retorna datos directamente
- ofetch es más ligero y moderno

## Interfaz Genérica Propuesta

Para unificar ambos sistemas, necesitamos una interfaz común:

```typescript
export interface FetcherConfig {
    method: string;
    url: string;
    params?: Record<string, any>;  // Query parameters
    data?: any;                     // Request body
    headers?: Record<string, string>;
}

export type Fetcher = (config: FetcherConfig) => Promise<any>;
```

## Helpers Propuestos

### 1. `createAxiosFetcher`

```typescript
import { AxiosInstance } from 'axios';
import { Fetcher, FetcherConfig } from '../types/Fetcher';

/**
 * Creates a fetcher function using Axios.
 * 
 * @param {AxiosInstance} axiosInstance - The Axios instance to use
 * @returns {Fetcher} A fetcher function compatible with RestStd
 * 
 * @example
 * import axios from 'axios';
 * import { createAxiosFetcher } from '@arex95/vue-core';
 * 
 * const axiosInstance = axios.create({ baseURL: 'https://api.example.com' });
 * const fetcher = createAxiosFetcher(axiosInstance);
 */
export function createAxiosFetcher(axiosInstance: AxiosInstance): Fetcher {
    return async (config: FetcherConfig): Promise<any> => {
        const response = await axiosInstance({
            method: config.method,
            url: config.url,
            params: config.params,
            data: config.data,
            headers: config.headers,
        });
        return response.data;
    };
}
```

### 2. `createOfetchFetcher`

```typescript
import { $fetch, FetchOptions } from 'ofetch';
import { Fetcher, FetcherConfig } from '../types/Fetcher';

/**
 * Creates a fetcher function using ofetch.
 * 
 * @param {string} [baseURL] - Optional base URL for requests
 * @param {FetchOptions} [defaultOptions] - Optional default options for ofetch
 * @returns {Fetcher} A fetcher function compatible with RestStd
 * 
 * @example
 * import { createOfetchFetcher } from '@arex95/vue-core';
 * 
 * const fetcher = createOfetchFetcher('https://api.example.com');
 * 
 * @example
 * // With custom ofetch instance
 * import { createFetch } from 'ofetch';
 * import { createOfetchFetcher } from '@arex95/vue-core';
 * 
 * const ofetchInstance = createFetch({ baseURL: 'https://api.example.com' });
 * const fetcher = createOfetchFetcher(undefined, { fetch: ofetchInstance });
 */
export function createOfetchFetcher(
    baseURL?: string,
    defaultOptions?: FetchOptions
): Fetcher {
    return async (config: FetcherConfig): Promise<any> => {
        const url = baseURL 
            ? `${baseURL.replace(/\/$/, '')}/${config.url.replace(/^\//, '')}`
            : config.url;
        
        return $fetch(url, {
            method: config.method as any,
            query: config.params,
            body: config.data,
            headers: config.headers,
            ...defaultOptions,
        });
    };
}
```

### 3. Fetcher Personalizado

El usuario puede crear su propio fetcher siguiendo la interfaz:

```typescript
import { Fetcher, FetcherConfig } from '@arex95/vue-core';

const myCustomFetcher: Fetcher = async (config: FetcherConfig) => {
    // Tu lógica personalizada aquí
    const response = await myHttpClient.request({
        method: config.method,
        url: config.url,
        query: config.params,
        body: config.data,
        headers: config.headers,
    });
    return response.data;
};
```

## Consideraciones de Autenticación

**Problema:** El sistema de autenticación actual (`useAuth`, `AxiosService`) está acoplado a Axios.

**Opciones:**

### Opción A: Mantener Axios para Autenticación (Recomendada)

- Mantener `AxiosService` y `useAuth` usando Axios
- Estos son helpers opcionales para usuarios de Axios
- Usuarios de ofetch pueden implementar su propia autenticación

**Pros:**
- ✅ No rompe código existente
- ✅ Autenticación es compleja, mejor mantenerla establecida
- ✅ Los usuarios pueden elegir no usar estos helpers

**Contras:**
- ⚠️ Usuarios de ofetch necesitan implementar su propia autenticación

### Opción B: Hacer Autenticación Agnóstica

- Refactorizar `useAuth` para usar `Fetcher` genérico
- Crear helpers de autenticación para Axios y ofetch

**Pros:**
- ✅ Completamente agnóstico
- ✅ Funciona con cualquier fetcher

**Contras:**
- ❌ Cambio breaking muy grande
- ❌ Más complejo de implementar
- ❌ Puede romper funcionalidad existente

**Decisión:** ✅ **Opción A** - Mantener autenticación con Axios como helper opcional

## Estructura de Archivos Propuesta

```
src/
├── types/
│   └── Fetcher.ts              # Interfaz genérica Fetcher
├── fetchers/                   # Helpers opcionales (nuevo)
│   ├── index.ts
│   ├── axios.ts                # createAxiosFetcher
│   └── ofetch.ts               # createOfetchFetcher
├── rest/
│   └── RestStd.ts              # Usa Fetcher genérico
└── config/
    └── axios/                 # Mantener para autenticación (opcional)
        ├── axiosConfig.ts
        └── axiosInstance.ts
```

## Ejemplos de Uso

### Usuario con Axios

```typescript
import axios from 'axios';
import { RestStd, createAxiosFetcher } from '@arex95/vue-core';

const axiosInstance = axios.create({ 
    baseURL: 'https://api.example.com' 
});

class RoleService extends RestStd {
    static resource = 'roles';
    static fetchFn = createAxiosFetcher(axiosInstance);
}

// En componente
import { useQuery } from '@tanstack/vue-query';

const { data } = useQuery({
    queryKey: ['roles'],
    queryFn: () => RoleService.getAll()
});
```

### Usuario con ofetch

```typescript
import { RestStd, createOfetchFetcher } from '@arex95/vue-core';

class RoleService extends RestStd {
    static resource = 'roles';
    static fetchFn = createOfetchFetcher('https://api.example.com');
}

// En componente
import { useQuery } from '@tanstack/vue-query';

const { data } = useQuery({
    queryKey: ['roles'],
    queryFn: () => RoleService.getAll()
});
```

### Usuario con Fetcher Personalizado

```typescript
import { RestStd, Fetcher } from '@arex95/vue-core';

const myFetcher: Fetcher = async (config) => {
    // Implementación personalizada
    const response = await myHttpClient.request(config);
    return response.data;
};

class RoleService extends RestStd {
    static resource = 'roles';
    static fetchFn = myFetcher;
}
```

## Dependencias

### Peer Dependencies

```json
{
  "peerDependencies": {
    "axios": "^1.6.0",        // Opcional: solo si usas createAxiosFetcher
    "ofetch": "^1.0.0"        // Opcional: solo si usas createOfetchFetcher
  }
}
```

**Nota:** El usuario solo instala lo que necesita.

## Plan de Implementación

1. ✅ Crear interfaz `Fetcher` y `FetcherConfig`
2. ⏳ Crear `createAxiosFetcher`
3. ⏳ Crear `createOfetchFetcher`
4. ⏳ Refactorizar `RestStd` para usar `Fetcher` genérico
5. ⏳ Documentar ejemplos de uso
6. ⏳ Actualizar tipos y exports

## Ventajas de esta Arquitectura

1. ✅ **Flexibilidad:** Usuario elige Axios, ofetch, o su propio fetcher
2. ✅ **Ligero:** Solo instala lo que necesita
3. ✅ **Extensible:** Fácil agregar nuevos helpers (fetch API, etc.)
4. ✅ **Type-safe:** TypeScript en todo momento
5. ✅ **Desacoplado:** Core no depende de librerías específicas

