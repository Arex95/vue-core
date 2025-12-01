# Arquitectura Agnóstica: Desacoplamiento del Sistema de Fetching

## Principio Fundamental

**Este proyecto solo provee un estándar RESTful. El usuario final decide qué sistema de fetching usar (axios, fetch, ofetch, etc.).**

## Problema Actual

El proyecto actualmente está acoplado a:
- ❌ Axios (a través de `axiosFetch`, `AxiosService`, etc.)
- ❌ Vue Query (a través de `useVueQuery`)
- ❌ Tipos específicos de Axios (`AxiosRequestConfig`, `AxiosInstance`)

Esto limita la flexibilidad del usuario y viola el principio de responsabilidad única.

## Solución: Arquitectura Agnóstica

### 1. Fetcher Genérico

El fetcher debe ser una función simple y genérica:

```typescript
type FetcherConfig = {
    method: string;
    url: string;
    params?: Record<string, any>;
    data?: any;
    headers?: Record<string, string>;
};

type Fetcher = (config: FetcherConfig) => Promise<any>;
```

**No debe depender de:**
- ❌ Axios
- ❌ Fetch API
- ❌ Vue Query
- ❌ Cualquier librería específica

### 2. RestStd Agnóstico

`RestStd` debe aceptar cualquier fetcher que siga la interfaz:

```typescript
export class RestStd {
    static resource: string;
    static fetchFn?: Fetcher; // Función genérica, no específica de Axios
    
    static getAll<T>({ params, options, url }: GetAllOptions = {}): Promise<T> {
        return this.getFetchFn()({
            method: "GET",
            url: url || this.resource,
            params,
            headers: this.headers,
        });
    }
}
```

### 3. Helpers Opcionales (No Core)

Los helpers para Axios, fetch, ofetch, etc. deben ser **opcionales** y estar en módulos separados:

```typescript
// Opcional: Helper para Axios
export function createAxiosFetcher(axiosInstance: AxiosInstance): Fetcher {
    return async (config: FetcherConfig) => {
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

// Opcional: Helper para Fetch API
export function createFetchFetcher(baseURL?: string): Fetcher {
    return async (config: FetcherConfig) => {
        const url = new URL(config.url, baseURL);
        Object.entries(config.params || {}).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });
        
        const response = await fetch(url.toString(), {
            method: config.method,
            headers: config.headers,
            body: config.data ? JSON.stringify(config.data) : undefined,
        });
        return response.json();
    };
}

// Opcional: Helper para ofetch
export function createOfetchFetcher(ofetchInstance: any): Fetcher {
    return async (config: FetcherConfig) => {
        return ofetchInstance(config.url, {
            method: config.method,
            params: config.params,
            body: config.data,
            headers: config.headers,
        });
    };
}
```

### 4. Eliminar Dependencias Específicas

**Eliminar del core:**
- ❌ `useVueQuery` - específico de Vue Query
- ❌ `useFetch` - confuso y acoplado
- ❌ `axiosFetch` - específico de Axios
- ❌ Tipos de Axios en la interfaz pública

**Mantener (pero hacer opcional):**
- ✅ `AxiosService` - como helper opcional para usuarios de Axios
- ✅ `createAxiosInstance` - como helper opcional
- ✅ Helpers de autenticación (pueden usar cualquier fetcher)

## Ejemplos de Uso

### Usuario con Axios

```typescript
import axios from 'axios';
import { RestStd, createAxiosFetcher } from '@arex95/vue-core';

const axiosInstance = axios.create({ baseURL: 'https://api.example.com' });

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

### Usuario con Fetch API

```typescript
import { RestStd, createFetchFetcher } from '@arex95/vue-core';

class RoleService extends RestStd {
    static resource = 'roles';
    static fetchFn = createFetchFetcher('https://api.example.com');
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
import { ofetch } from 'ofetch';
import { RestStd, createOfetchFetcher } from '@arex95/vue-core';

const ofetchInstance = ofetch.create({ baseURL: 'https://api.example.com' });

class RoleService extends RestStd {
    static resource = 'roles';
    static fetchFn = createOfetchFetcher(ofetchInstance);
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

const myCustomFetcher: Fetcher = async (config) => {
    // Tu lógica personalizada aquí
    const response = await myCustomHttpClient.request({
        method: config.method,
        url: config.url,
        query: config.params,
        body: config.data,
        headers: config.headers,
    });
    return response.body;
};

class RoleService extends RestStd {
    static resource = 'roles';
    static fetchFn = myCustomFetcher;
}
```

## Estructura de Archivos Propuesta

```
src/
├── rest/
│   └── RestStd.ts          # Core agnóstico
├── fetchers/                # Helpers opcionales (nuevo)
│   ├── index.ts
│   ├── axios.ts            # createAxiosFetcher
│   ├── fetch.ts            # createFetchFetcher
│   └── ofetch.ts           # createOfetchFetcher
├── config/
│   └── axios/              # Mantener para autenticación (usa fetcher genérico)
└── composables/
    └── axios/              # Eliminar o mover a fetchers/
```

## Migración

### Paso 1: Crear Interfaz Genérica

```typescript
// src/types/Fetcher.ts
export interface FetcherConfig {
    method: string;
    url: string;
    params?: Record<string, any>;
    data?: any;
    headers?: Record<string, string>;
}

export type Fetcher = (config: FetcherConfig) => Promise<any>;
```

### Paso 2: Refactorizar RestStd

```typescript
import { Fetcher, FetcherConfig } from '../types/Fetcher';

export class RestStd {
    static resource: string;
    static fetchFn?: Fetcher;
    
    private static getFetchFn(): Fetcher {
        if (this.fetchFn) {
            return this.fetchFn;
        }
        throw new Error('fetchFn must be provided or use a default fetcher helper');
    }
    
    static getAll<T>({ params, options, url }: GetAllOptions = {}): Promise<T> {
        const config: FetcherConfig = {
            method: "GET",
            url: url || this.resource,
            params,
            headers: this.headers,
        };
        return this.getFetchFn()(config);
    }
}
```

### Paso 3: Crear Helpers Opcionales

```typescript
// src/fetchers/axios.ts
import { AxiosInstance } from 'axios';
import { Fetcher, FetcherConfig } from '../types/Fetcher';

export function createAxiosFetcher(axiosInstance: AxiosInstance): Fetcher {
    return async (config: FetcherConfig) => {
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

### Paso 4: Eliminar useVueQuery

- Eliminar archivo `src/composables/axios/useVueQuery.ts`
- Eliminar export de `src/composables/axios/index.ts`
- Eliminar export de `src/index.ts`
- Actualizar documentación

## Beneficios

1. ✅ **Flexibilidad:** Usuario puede usar cualquier sistema de fetching
2. ✅ **Desacoplamiento:** No depende de librerías específicas
3. ✅ **Simplicidad:** Core más simple y enfocado
4. ✅ **Extensibilidad:** Fácil agregar nuevos helpers
5. ✅ **Principio de Responsabilidad Única:** Solo provee estándar RESTful

## Consideraciones

- ⚠️ **Autenticación:** Los helpers de autenticación deben usar el fetcher genérico, no Axios directamente
- ⚠️ **Configuración:** `configAxios` puede mantenerse como helper opcional para usuarios de Axios
- ⚠️ **Compatibilidad:** Mantener helpers de Axios para no romper código existente, pero marcarlos como opcionales

