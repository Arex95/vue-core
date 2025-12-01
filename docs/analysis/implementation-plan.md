# Plan de Implementación de Mejoras

Este documento rastrea las mejoras planificadas y su estado de implementación.

## Principio Fundamental

**Este proyecto solo provee un estándar RESTful. El usuario final decide qué sistema de fetching usar (axios, fetch, ofetch, etc.).**

El proyecto debe ser **agnóstico** del sistema de fetching y solo proveer:
- ✅ Estándar RESTful (`RestStd`)
- ✅ Helpers opcionales para diferentes sistemas de fetching
- ❌ NO composables específicos de Vue Query, Axios, etc.

---

## Objetivo

Permitir que los usuarios finales puedan usar patrones simplificados con cualquier sistema de fetching:

### Patrón 1: Usuario con Axios
```typescript
// En el servicio
import axios from 'axios';
import { RestStd, createAxiosFetcher } from '@arex95/vue-core';

const axiosInstance = axios.create({ baseURL: 'https://api.example.com' });

export default class RoleService extends RestStd {
    static resource = 'roles';
    static fetchFn = createAxiosFetcher(axiosInstance);
}

// En las vistas - el usuario usa su propio composable
import { useQuery } from '@tanstack/vue-query';
import RoleService from '@/services/RoleService';

const { data: roles, isLoading } = useQuery({
    queryKey: ['role', 'all'],
    queryFn: () => RoleService.getAll({ params: { status: 'active' } })
});
```

### Patrón 2: Usuario con Fetch API
```typescript
import { RestStd, createFetchFetcher } from '@arex95/vue-core';

export class RoleService extends RestStd {
    static resource = 'roles';
    static fetchFn = createFetchFetcher('https://api.example.com');
}
```

### Patrón 3: Usuario con ofetch
```typescript
import { ofetch } from 'ofetch';
import { RestStd, createOfetchFetcher } from '@arex95/vue-core';

const ofetchInstance = ofetch.create({ baseURL: 'https://api.example.com' });

export class RoleService extends RestStd {
    static resource = 'roles';
    static fetchFn = createOfetchFetcher(ofetchInstance);
}
```

### Patrón 4: Fetcher Personalizado
```typescript
import { RestStd, Fetcher } from '@arex95/vue-core';

const myCustomFetcher: Fetcher = async (config) => {
    // Tu lógica personalizada
    const response = await myHttpClient.request(config);
    return response.data;
};

export class RoleService extends RestStd {
    static resource = 'roles';
    static fetchFn = myCustomFetcher;
}
```

## Estado General

- **Última actualización:** 2024-01-XX
- **Estado:** 🟡 En Planificación

## Consideraciones y Decisiones de Diseño

### 0. Diseño de RestStd: Extend vs Instancia

**Estado:** ✅ Analizado (ver RESTSTD_DESIGN_ANALYSIS.md)

**Decisión:** ✅ **Extend con Static + Validación**

**Razones:**
- ✅ Más declarativo y simple
- ✅ Patrón estándar en frameworks REST
- ✅ Permite métodos estáticos (`RoleService.getAll()`)
- ✅ Type-safe con TypeScript
- ✅ Menos verboso que instancias

**Implementación:**
```typescript
export class RestStd {
    /** 
     * The resource endpoint. MUST be overridden in subclasses.
     * @example static override resource = 'users';
     */
    static resource: string;
    
    protected static validateResource(): void {
        if (!this.resource || this.resource.trim() === '') {
            throw new Error(
                `[${this.constructor.name}] Static property 'resource' is required. ` +
                `Please define: static override resource = 'your-resource';`
            );
        }
    }
    
    static getAll<T>({ params, options, url }: GetAllOptions = {}): Promise<T> {
        this.validateResource();
        // ...
    }
}
```

**Uso:**
```typescript
class RoleService extends RestStd {
    static override resource = 'roles'; // Obligatorio, TypeScript requiere 'override'
    static fetchFn = createAxiosFetcher(axiosInstance);
}

const roles = await RoleService.getAll();
```

---

### 1. fetchFn Opcional con Valor por Defecto

**Problema:** Actualmente `fetchFn` es obligatorio, pero en la mayoría de casos el usuario solo necesita usar la instancia por defecto.

**Solución:**
- Hacer `fetchFn` opcional en `RestStd`
- Si no se define, usar automáticamente `useFetch(axiosFetch)` con la instancia por defecto
- Solo requerir `fetchFn` cuando se necesite una instancia personalizada

**Implementación:**
```typescript
import { createFetcher } from '@composables/axios/createFetcher';

export class RestStd {
    static fetchFn?: Function;
    
    private static getFetchFn() {
        if (this.fetchFn) {
            return this.fetchFn;
        }
        // Valor por defecto: fetcher con instancia global
        return createFetcher();
    }
}
```

### 2. Configuración Simple de baseURL Diferente

**Problema:** Crear una nueva instancia completa de `AxiosService` es verboso cuando solo se necesita cambiar la baseURL.

**Opciones Consideradas:**

**Opción A: Helper `createAxiosInstance`**
```typescript
const customInstance = createAxiosInstance({ 
    baseURL: 'https://api.example.com' 
});
```
✅ Pros: Simple, claro, reutilizable
❌ Cons: Necesita nueva función helper

**Opción B: Propiedad `baseURL` en RestStd**
```typescript
class Service extends RestStd {
    static baseURL = 'https://api.example.com';
}
```
✅ Pros: Muy simple
❌ Cons: Mezcla responsabilidades, menos flexible

**Opción C: Opción en `useFetch`**
```typescript
static fetchFn = useFetch(axiosFetch, { baseURL: '...' });
```
✅ Pros: Encapsulado
❌ Cons: Confuso con la instancia de Axios

**Decisión:** ✅ **Opción A** - Crear helper `createAxiosInstance` que sea un wrapper simple sobre `AxiosService`

### 3. Parámetros como Objetos para Autocompletado

**Problema:** Las firmas actuales no proporcionan buen autocompletado y no son evidentes.

**Ejemplo Actual:**
```typescript
RoleService.getOne(123, { include: 'relations' }, { retry: false });
// ¿Qué es cada parámetro?
```

**Ejemplo Propuesto:**
```typescript
RoleService.getOne({ 
    id: 123, 
    params: { include: 'relations' }, 
    options: { retry: false } 
});
// Mucho más claro y con autocompletado
```

**Métodos a Cambiar:**
- `getAll({ params?, options?, url? })`
- `getOne({ id, params?, options?, url? })`
- `create({ data, options?, url? })`
- `update({ id, data, options?, url? })`
- `patch({ id, data, options?, url? })`
- `delete({ id, options?, url? })`
- `bulkCreate({ data, options?, url? })`
- `bulkUpdate({ data, options?, url? })`
- `bulkDelete({ ids, options?, url? })`
- `upsert({ data, options?, url? })`
- `customRequest({ method, url, params?, data?, options? })`

**Compatibilidad:** Mantener métodos antiguos como deprecated para no romper código existente.

---

### 4. Flexibilidad para Sobrescribir URLs en Métodos Individuales

**Problema:** A veces se necesita llamar a endpoints no estándar sin crear un servicio completo nuevo.

**Ejemplo del Problema:**
```typescript
class UserService extends RestStd {
    static resource = 'users';
}

// Quiero hacer GET a 'users/custom-endpoint/123' en lugar de 'users/123'
// Actualmente no hay forma fácil de hacer esto
```

**Opciones Consideradas:**

**Opción A: Parámetro `url` en opciones**
```typescript
UserService.getOne({ 
    id: 123, 
    url: 'users/custom-endpoint' // Sobrescribe el resource
});
```
✅ Pros: Simple, claro, opcional
❌ Cons: Puede confundir si es relativo o absoluto

**Opción B: Parámetro `overridePath` o `customPath`**
```typescript
UserService.getOne({ 
    id: 123, 
    customPath: 'custom-endpoint' // Se concatena: resource + '/' + customPath + '/' + id
});
```
✅ Pros: Más seguro, siempre relativo al resource
❌ Cons: Menos flexible para casos extremos

**Opción C: Parámetro `urlOverride` que puede ser relativo o absoluto**
```typescript
UserService.getOne({ 
    id: 123, 
    urlOverride: 'users/custom-endpoint' // Si empieza con '/', es absoluto desde baseURL
});
```
✅ Pros: Máxima flexibilidad
❌ Cons: Más complejo de implementar

**Opción D: Dos parámetros separados**
```typescript
UserService.getOne({ 
    id: 123, 
    customPath: 'custom-endpoint', // Para paths relativos al resource
    absoluteUrl: 'https://api.com/other-endpoint' // Para URLs absolutas
});
```
✅ Pros: Muy claro, separa casos de uso
❌ Cons: Más verboso

**Decisión:** ✅ **Opción A mejorada** - Parámetro `url` que:
- Si se proporciona, sobrescribe completamente el resource
- Si es relativo (no empieza con `/` o `http`), se concatena con baseURL
- Si es absoluto (empieza con `http://` o `https://`), se usa tal cual
- Si no se proporciona, usa el `resource` estático por defecto

**Implementación:**
```typescript
interface GetOneOptions {
    id: string | number;
    params?: Record<string, any>;
    options?: object;
    url?: string; // Opcional: sobrescribe el resource. Puede ser relativo o absoluto
}

static getOne<T>({ id, params, options = {}, url }: GetOneOptions): Promise<T> {
    // Si se proporciona url, usarla; si no, construir desde resource
    const finalUrl = url 
        ? url.replace(/\/$/, '') + `/${id}` // Remover trailing slash y agregar id
        : `${this.resource}/${id}`;
    
    return this.getFetchFn()(
        {
            method: "GET",
            url: finalUrl,
            params,
            headers: this.headers,
        },
        options
    );
}
```

**Ejemplos de Uso:**
```typescript
// Caso 1: Uso normal (resource por defecto)
UserService.getOne({ id: 123 });
// → GET /users/123

// Caso 2: Path personalizado relativo
UserService.getOne({ id: 123, url: 'users/custom-endpoint' });
// → GET /users/custom-endpoint/123

// Caso 3: Path personalizado sin baseURL (si baseURL está vacío)
UserService.getOne({ id: 123, url: 'https://api.external.com/users/custom' });
// → GET https://api.external.com/users/custom/123

// Caso 4: getAll con path personalizado
UserService.getAll({ url: 'users/active' });
// → GET /users/active
```

**Consideraciones:**
- ⚠️ **Advertencia en documentación:** Aunque permitimos esta flexibilidad, se recomienda seguir el patrón RESTful
- ✅ **Mantener simplicidad:** El caso común (sin `url`) debe seguir siendo simple
- ✅ **Type safety:** El parámetro `url` debe ser opcional y tipado como `string | undefined`

---

## Tareas

### 1. Análisis del Flujo Actual

**Estado:** ✅ Completado

**Descripción:**
- Analizar cómo funciona actualmente `RestStd.fetchFn`
- Entender la firma de `useFetch` y `axiosFetch`
- Identificar incompatibilidades

**Hallazgos:**
- `RestStd.getAll()` llama a `this.fetchFn(config, options)` donde `config` es `AxiosRequestConfig` y `options` es un objeto
- `useFetch(fetchFn)` retorna una función que acepta `(axiosRequestConfig, options?)` y llama a `fetchFn(instance, axiosRequestConfig, options)`
- `axiosFetch` acepta `(axiosInstance, axiosRequestConfig)` y retorna `Promise<T>` (solo 2 parámetros)
- **Problema identificado:** `useFetch` pasa 3 argumentos a `fetchFn` pero `axiosFetch` solo acepta 2 (aunque JS permite argumentos extra, esto puede causar confusión)
- **Problema principal:** `useFetch` actualmente está diseñado para trabajar con `useVueQuery`, no para retornar una función query pura para `useQuery` de TanStack

---

### 2. Hacer `fetchFn` Opcional en `RestStd`

**Estado:** ⏳ Pendiente

**Descripción:**
Modificar `RestStd` para que `fetchFn` sea opcional y tenga un valor por defecto.

**Cambios Necesarios:**
- [ ] Cambiar `static fetchFn: Function` a `static fetchFn?: Function`
- [ ] Crear método privado `getFetchFn()` que retorne el fetchFn o el por defecto
- [ ] Actualizar todos los métodos para usar `this.getFetchFn()` en lugar de `this.fetchFn`
- [ ] Asegurar que el valor por defecto use `useFetch(axiosFetch)` con la instancia configurada

**Archivos a Modificar:**
- `src/rest/RestStd.ts`

**Código Esperado:**
```typescript
export class RestStd {
    static resource: string;
    static isFormData: boolean = false;
    static headers: Record<string, string> = {};
    static fetchFn?: Function; // Ahora opcional
    
    private static getFetchFn() {
        if (this.fetchFn) {
            return this.fetchFn;
        }
        // Valor por defecto: usar instancia configurada
        return useFetch(axiosFetch, getConfiguredAxiosInstance());
    }
    
    static getAll<T>(params?: Record<string, any>, options: object = {}) {
        return this.getFetchFn()(
            {
                method: "GET",
                url: this.resource,
                params,
                headers: this.headers,
            },
            options
        );
    }
    // ... resto de métodos
}
```

---

### 3. Crear Helper `createAxiosInstance`

**Estado:** ⏳ Pendiente

**Descripción:**
Crear una función helper simple para crear instancias de Axios con configuración personalizada.

**Cambios Necesarios:**
- [ ] Crear función `createAxiosInstance(options)` que retorne `AxiosInstance`
- [ ] La función debe ser un wrapper sobre `new AxiosService(options)`
- [ ] Exportar la función desde el index principal

**Archivos a Crear/Modificar:**
- `src/config/axios/axiosInstance.ts` (agregar función)
- `src/index.ts` (exportar)

**Código Esperado:**
```typescript
/**
 * Creates a new Axios instance with custom configuration.
 * Useful when you need a different baseURL or configuration for a specific service.
 * 
 * @param {AxiosServiceOptions} options - Configuration options for the Axios instance
 * @returns {AxiosInstance} A configured Axios instance
 * 
 * @example
 * const externalApi = createAxiosInstance({ baseURL: 'https://api.example.com' });
 * 
 * @example
 * // Sin baseURL para usar URLs absolutas
 * const noBaseUrl = createAxiosInstance({ baseURL: '' });
 */
export const createAxiosInstance = (options: AxiosServiceOptions): AxiosInstance => {
    const service = new AxiosService(options);
    return service.getAxiosInstance();
};
```

---

### 8. Refactorizar `RestStd` para Usar `Fetcher` Genérico

**Estado:** ⏳ Pendiente

**Descripción:**
Refactorizar `RestStd` para usar la interfaz `Fetcher` genérica en lugar de tipos específicos de Axios.

**Archivos a Modificar:**
- `src/rest/RestStd.ts`

**Código Esperado:**
```typescript
import { Fetcher, FetcherConfig } from '../types/Fetcher';

export class RestStd {
    static resource: string;
    static fetchFn?: Fetcher; // Genérico, no específico de Axios
    static isFormData: boolean = false;
    static headers: Record<string, string> = {};
    
    private static getFetchFn(): Fetcher {
        if (this.fetchFn) {
            return this.fetchFn;
        }
        throw new Error(
            'fetchFn must be provided. Use a fetcher helper like createAxiosFetcher, createFetchFetcher, etc.'
        );
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
    
    // ... resto de métodos usando FetcherConfig
}
```

---

### 9. Documentar Fetchers Personalizados

**Estado:** ⏳ Pendiente

**Descripción:**
Documentar cómo los usuarios pueden crear sus propios fetchers personalizados siguiendo la interfaz `Fetcher`.

**Cambios Necesarios:**
- [ ] Agregar sección en documentación sobre fetchers personalizados
- [ ] Crear ejemplos de fetchers personalizados
- [ ] Documentar la interfaz `Fetcher` y `FetcherConfig`

**Archivos a Actualizar:**
- `docs/api-reference.md`
- `docs/installation.md` (agregar sección de fetchers)
- `README.md`

**Estado:** ⏳ Pendiente

**Descripción:**
Crear una nueva función `createFetcher` que reemplace el patrón confuso de `useFetch(axiosFetch, instance)`. Esta función crea un fetcher ligado a una instancia específica de Axios.

**Problema con el diseño actual:**
- `useFetch(axiosFetch, instance)` es confuso: ¿por qué `useFetch` necesita la instancia?
- Mezcla responsabilidades: el fetcher debería tener la instancia "bakeada", no recibirla después
- No es claro conceptualmente

**Solución:**
- Crear `createFetcher(instance?)` que retorna un fetcher ya configurado con la instancia
- Si no se pasa instancia, usa la instancia global por defecto
- Más claro: "crear un fetcher" vs "usar fetch con instancia"

**Cambios Necesarios:**
- [ ] Crear función `createFetcher(instance?: AxiosInstance)`
- [ ] La función debe retornar una función compatible con `RestStd.fetchFn`
- [ ] Actualizar `RestStd.getFetchFn()` para usar `createFetcher()` por defecto
- [ ] Mantener `useFetch` como deprecated para compatibilidad
- [ ] Actualizar documentación y ejemplos

**Archivos a Crear/Modificar:**
- `src/composables/axios/createFetcher.ts` (nuevo)
- `src/composables/axios/index.ts` (exportar)
- `src/rest/RestStd.ts` (usar createFetcher)
- `src/index.ts` (exportar)

**Código Esperado:**
```typescript
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getConfiguredAxiosInstance } from '@config/axios';
import { axiosFetch } from './axiosFetch';

/**
 * Creates a fetcher function bound to a specific Axios instance.
 * If no instance is provided, uses the globally configured instance.
 * 
 * The returned function can be used directly as `fetchFn` in RestStd services
 * or as `queryFn` in TanStack Vue Query's `useQuery`.
 * 
 * @param {AxiosInstance} [instance] - Optional Axios instance. If not provided, uses the default configured instance.
 * @returns A function that accepts AxiosRequestConfig and returns a Promise
 * 
 * @example
 * // Use default instance
 * const defaultFetcher = createFetcher();
 * 
 * @example
 * // Use custom instance
 * const customInstance = createAxiosInstance({ baseURL: 'https://api.example.com' });
 * const customFetcher = createFetcher(customInstance);
 * 
 * @example
 * // In a service
 * class RoleService extends RestStd {
 *     static resource = 'roles';
 *     static fetchFn = createFetcher(); // Uses default instance
 * }
 */
export function createFetcher(instance?: AxiosInstance) {
    const axiosInstance = instance || getConfiguredAxiosInstance();
    
    return (config: AxiosRequestConfig, options?: any): Promise<any> => {
        // Ignorar options si se pasa (para compatibilidad con RestStd)
        // axiosFetch solo necesita instance y config
        return axiosFetch(axiosInstance, config);
    };
}

// Alias para claridad (opcional)
export const createQueryFetcher = createFetcher;
```

**Actualización en RestStd:**
```typescript
import { createFetcher } from '@composables/axios/createFetcher';

export class RestStd {
    // ...
    private static getFetchFn() {
        if (this.fetchFn) {
            return this.fetchFn;
        }
        // Valor por defecto: fetcher con instancia global
        return createFetcher();
    }
}
```

**Migración desde useFetch:**
```typescript
// Antes (confuso)
static fetchFn = useFetch(axiosFetch, customInstance);

// Después (claro)
static fetchFn = createFetcher(customInstance);
```

**Nota:** `useFetch` se mantendrá como deprecated durante una versión mayor para compatibilidad, pero se recomienda usar `createFetcher`.

---

### 5. Eliminar `useVueQuery` y Dependencias Específicas

**Estado:** ⏳ Pendiente

**Descripción:**
Eliminar `useVueQuery` y otras dependencias específicas de librerías. El usuario final debe usar su propio composable para manejar queries.

**Razón:**
- El proyecto solo debe proveer estándar RESTful
- No debe estar acoplado a Vue Query, Axios, etc.
- El usuario decide qué sistema usar

**Cambios Necesarios:**
- [ ] Eliminar archivo `src/composables/axios/useVueQuery.ts`
- [ ] Eliminar export de `src/composables/axios/index.ts`
- [ ] Eliminar export de `src/index.ts`
- [ ] Eliminar dependencia de `@tanstack/vue-query` del core (mover a peerDependencies opcional si es necesario)
- [ ] Actualizar documentación eliminando referencias a `useVueQuery`
- [ ] Actualizar ejemplos para mostrar que el usuario usa su propio `useQuery`

**Archivos a Eliminar/Modificar:**
- `src/composables/axios/useVueQuery.ts` (eliminar)
- `src/composables/axios/index.ts` (remover export)
- `src/index.ts` (remover export)
- `docs/composables.md` (actualizar)
- `EXAMPLES.md` (actualizar)

**Nota:** El usuario puede seguir usando `useQuery` de `@tanstack/vue-query` directamente, pero no será parte del core del proyecto.

---

### 6. Refactorizar Métodos para Usar Objetos de Parámetros

**Estado:** ⏳ Pendiente

**Descripción:**
Cambiar las firmas de los métodos principales para usar objetos de parámetros con nombres descriptivos, mejorando el autocompletado y la claridad.

**Cambios Necesarios:**
- [ ] Crear interfaces TypeScript para los parámetros de cada método
- [ ] Refactorizar métodos para aceptar objetos en lugar de parámetros posicionales
- [ ] Mantener métodos antiguos como deprecated para compatibilidad
- [ ] Actualizar documentación

**Archivos a Modificar:**
- `src/rest/RestStd.ts`
- `src/types/index.ts` (agregar interfaces)

**Interfaces Propuestas:**
```typescript
interface GetAllOptions {
    params?: Record<string, any>;
    options?: object;
    url?: string; // Opcional: sobrescribe el resource para este método
}

interface GetOneOptions {
    id: string | number;
    params?: Record<string, any>;
    options?: object;
    url?: string; // Opcional: sobrescribe el resource. Se le agregará /id al final
}

interface CreateOptions {
    data: any;
    options?: object;
    url?: string; // Opcional: sobrescribe el resource
}

interface UpdateOptions {
    id: string | number;
    data: any;
    options?: object;
    url?: string; // Opcional: sobrescribe el resource. Se le agregará /id al final
}

interface PatchOptions {
    id: string | number;
    data: any;
    options?: object;
    url?: string; // Opcional: sobrescribe el resource. Se le agregará /id al final
}

interface DeleteOptions {
    id: string | number;
    options?: object;
    url?: string; // Opcional: sobrescribe el resource. Se le agregará /id al final
}

interface BulkCreateOptions {
    data: any[];
    options?: object;
    url?: string; // Opcional: sobrescribe el resource. Se le agregará /bulk al final
}

interface BulkUpdateOptions {
    data: any[];
    options?: object;
    url?: string; // Opcional: sobrescribe el resource. Se le agregará /bulk al final
}

interface BulkDeleteOptions {
    ids: (string | number)[];
    options?: object;
    url?: string; // Opcional: sobrescribe el resource. Se le agregará /bulk al final
}

interface UpsertOptions {
    data: any;
    options?: object;
    url?: string; // Opcional: sobrescribe el resource
}
```

**Código Esperado:**
```typescript
// Helper para construir URL final
private static buildUrl(baseUrl: string, suffix?: string): string {
    const cleanBase = baseUrl.replace(/\/$/, ''); // Remover trailing slash
    if (suffix) {
        const cleanSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`;
        return cleanBase + cleanSuffix;
    }
    return cleanBase;
}

// Nuevo método con objeto de parámetros
static getAll<T>({ params, options = {}, url }: GetAllOptions = {}): Promise<T> {
    const finalUrl = url || this.resource;
    return this.getFetchFn()(
        {
            method: "GET",
            url: finalUrl,
            params,
            headers: this.headers,
        },
        options
    );
}

// getOne con URL personalizada
static getOne<T>({ id, params, options = {}, url }: GetOneOptions): Promise<T> {
    const baseUrl = url || this.resource;
    const finalUrl = this.buildUrl(baseUrl, String(id));
    return this.getFetchFn()(
        {
            method: "GET",
            url: finalUrl,
            params,
            headers: this.headers,
        },
        options
    );
}

// create con URL personalizada
static create<T>({ data, options = {}, url }: CreateOptions): Promise<T> {
    const finalUrl = url || this.resource;
    const transformedData = this.transformData(data);
    return this.getFetchFn()(
        {
            method: "POST",
            url: finalUrl,
            data: transformedData,
            headers: {
                ...this.headers,
                "Content-Type": this.isFormData
                    ? ContentTypeEnum.FORM_DATA
                    : ContentTypeEnum.JSON,
            },
        },
        options
    );
}

// update con URL personalizada
static update<T>({ id, data, options = {}, url }: UpdateOptions): Promise<T> {
    const baseUrl = url || this.resource;
    const finalUrl = this.buildUrl(baseUrl, String(id));
    const transformedData = this.transformData(data);
    return this.getFetchFn()(
        {
            method: "PUT",
            url: finalUrl,
            data: transformedData,
            headers: {
                ...this.headers,
                "Content-Type": this.isFormData
                    ? ContentTypeEnum.FORM_DATA
                    : ContentTypeEnum.JSON,
            },
        },
        options
    );
}

// Método antiguo (deprecated pero funcional)
/** @deprecated Use getAll({ params, options, url? }) instead */
static getAllOld<T>(params?: Record<string, any>, options: object = {}): Promise<T> {
    return this.getAll({ params, options });
}
```

**Nota:** Considerar si mantener ambos o hacer breaking change. Recomendación: mantener ambos durante una versión mayor y deprecar los antiguos.

---

### 6. Verificar Compatibilidad de `RestStd` con `useQuery`

**Estado:** ⏳ Pendiente

**Descripción:**
Asegurar que todos los métodos de `RestStd` retornen Promises que puedan ser usadas directamente en `useQuery`.

**Verificaciones:**
- [ ] `RoleService.getAll()` retorna `Promise<T>`
- [ ] `RoleService.getOne()` retorna `Promise<T>`
- [ ] Todos los métodos CRUD retornan `Promise<T>`
- [ ] La Promise se resuelve con los datos correctos
- [ ] Los errores se propagan correctamente

**Archivos a Verificar:**
- `src/rest/RestStd.ts`

---

### 7. Actualizar Tipos TypeScript

**Estado:** ⏳ Pendiente

**Descripción:**
Actualizar los tipos para que TypeScript reconozca correctamente el patrón de uso.

**Cambios Necesarios:**
- [ ] Tipar `RestStd.fetchFn` correctamente
- [ ] Asegurar que el tipo de retorno de `useFetch(axiosFetch)` sea compatible
- [ ] Agregar tipos genéricos donde sea necesario

**Archivos a Modificar:**
- `src/rest/RestStd.ts`
- `src/composables/axios/useFetch.ts`
- `src/types/index.ts` (si es necesario)

---

### 8. Crear Ejemplo de Uso

**Estado:** ⏳ Pendiente

**Descripción:**
Crear un ejemplo completo que demuestre el patrón de uso esperado.

**Contenido:**
- [ ] Ejemplo de servicio (`RoleService`)
- [ ] Ejemplo de uso en componente Vue
- [ ] Ejemplo con diferentes métodos CRUD
- [ ] Ejemplo con manejo de errores

**Archivos a Crear/Actualizar:**
- `docs/examples/service-pattern.md` (nuevo)
- `EXAMPLES.md` (actualizar)

---

### 9. Tests

**Estado:** ⏳ Pendiente

**Descripción:**
Crear tests para verificar que el nuevo patrón funciona correctamente.

**Tests Necesarios:**
- [ ] Test: `useFetch(axiosFetch)` retorna función compatible
- [ ] Test: `RestStd.getAll()` puede ser usado en `useQuery`
- [ ] Test: Todos los métodos CRUD funcionan con el nuevo patrón
- [ ] Test: Manejo de errores funciona correctamente

**Archivos a Crear:**
- Tests unitarios (si existe estructura de tests)

---

### 10. Actualizar Documentación

**Estado:** ⏳ Pendiente

**Descripción:**
Actualizar la documentación para reflejar el nuevo patrón recomendado.

**Cambios Necesarios:**
- [ ] Actualizar `docs/composables.md` con el nuevo patrón
- [ ] Actualizar `docs/api-reference.md` con ejemplos
- [ ] Actualizar `README.md` si es necesario
- [ ] Agregar sección de "Mejores Prácticas"

**Archivos a Actualizar:**
- `docs/composables.md`
- `docs/api-reference.md`
- `README.md`

---

### 11. Validación Final

**Estado:** ⏳ Pendiente

**Descripción:**
Validar que todo funciona correctamente con el patrón esperado.

**Checklist:**
- [ ] El código compila sin errores
- [ ] Los tipos TypeScript son correctos
- [ ] El ejemplo funciona en un proyecto real
- [ ] La documentación está actualizada
- [ ] No hay breaking changes (o están documentados)

---

## Notas de Implementación

### Consideraciones

1. **Compatibilidad hacia atrás:** Asegurar que el cambio no rompa código existente
2. **Tipos:** Mantener type-safety en todo momento
3. **Simplicidad:** El patrón debe ser simple y fácil de entender

### Decisiones Técnicas

- ✅ **Decidido:** `useFetch` detectará automáticamente si se pasa `axiosFetch` y manejará el caso especial
- ✅ **Decidido:** La función retornada será una query function pura (`Promise<T>`) para compatibilidad directa con `useQuery`
- **Pendiente:** Evaluar si necesitamos mantener compatibilidad con el uso anterior de `useFetch` con `useVueQuery`

---

## Resumen de Decisiones Clave

### 1. fetchFn Opcional
- ✅ **Decidido:** `fetchFn` será opcional con valor por defecto
- ✅ **Razón:** Simplifica el 90% de los casos de uso donde solo se necesita la instancia por defecto
- ✅ **Implementación:** Método privado `getFetchFn()` que retorna el fetchFn o el por defecto

### 2. Helper para Instancias Personalizadas
- ✅ **Decidido:** Crear `createAxiosInstance()` helper
- ✅ **Razón:** Más simple que crear `new AxiosService()` manualmente
- ✅ **Alternativas consideradas:** Propiedad `baseURL` en RestStd (rechazada por mezclar responsabilidades)

### 3. Parámetros como Objetos
- ✅ **Decidido:** Refactorizar métodos principales para usar objetos
- ✅ **Razón:** Mejor autocompletado, más claro, menos errores
- ✅ **Compatibilidad:** Mantener métodos antiguos como deprecated durante una versión mayor

### 4. Arquitectura Agnóstica
- ✅ **Decidido:** Eliminar `useVueQuery` - el usuario usa su propio composable
- ✅ **Decidido:** Crear interfaz genérica `Fetcher` - agnóstica de cualquier librería
- ✅ **Decidido:** Crear helpers opcionales: `createAxiosFetcher`, `createFetchFetcher`, `createOfetchFetcher`
- ✅ **Razón:** El proyecto solo debe proveer estándar RESTful, no sistemas de fetching específicos
- ✅ **Implementación:** `RestStd` usa `Fetcher` genérico, usuario elige qué helper usar

### 5. Flexibilidad para URLs Personalizadas
- ✅ **Decidido:** Agregar parámetro opcional `url` en todos los métodos
- ✅ **Razón:** Permite flexibilidad sin romper el patrón RESTful por defecto
- ✅ **Implementación:** `url` opcional que sobrescribe el `resource` estático
- ✅ **Consideración:** Documentar que se recomienda seguir RESTful, pero permitir excepciones

### 4. Compatibilidad hacia Atrás
- ⚠️ **Consideración:** Los cambios en parámetros son breaking changes
- ✅ **Estrategia:** Mantener métodos antiguos deprecated, documentar migración
- ✅ **Timeline:** Deprecar en v2.x, remover en v3.0

### 6. Orden de Implementación
1. Crear interfaz genérica `Fetcher` y `FetcherConfig` (base para todo)
2. Refactorizar `RestStd` para usar `Fetcher` genérico
3. Crear helpers opcionales: `createAxiosFetcher`, `createFetchFetcher`, `createOfetchFetcher`
4. Eliminar `useVueQuery` (no es responsabilidad del proyecto)
5. Hacer `fetchFn` opcional con valor por defecto (usando helper de Axios para compatibilidad)
6. Refactorizar parámetros con objetos (mejora de DX)
7. Agregar flexibilidad de URLs personalizadas (dentro de la refactorización de parámetros)

---

## Historial de Cambios

| Fecha | Cambio | Estado |
|-------|--------|--------|
| 2024-01-XX | Creación del plan inicial | ✅ |
| 2024-01-XX | Agregadas consideraciones sobre fetchFn opcional, createAxiosInstance, y parámetros como objetos | ✅ |

---

## Próximos Pasos

1. ✅ Análisis del flujo actual
2. ✅ Análisis de arquitectura (ver ARCHITECTURE_ANALYSIS.md)
3. ✅ Arquitectura agnóstica definida (ver AGNOSTIC_ARCHITECTURE.md)
4. ✅ Análisis de fetchers: Axios y ofetch (ver FETCHERS_ANALYSIS.md)
5. ⏳ Crear interfaz genérica `Fetcher` y `FetcherConfig` (Tarea 6)
6. ⏳ Crear helpers: `createAxiosFetcher` y `createOfetchFetcher` (Tarea 7)
7. ⏳ Refactorizar `RestStd` para usar `Fetcher` genérico (Tarea 8)
8. ⏳ Eliminar `useVueQuery` (Tarea 5)
9. ⏳ Hacer `fetchFn` opcional con valor por defecto (Tarea 2)
10. ⏳ Crear helper `createAxiosInstance` (Tarea 3 - opcional, para compatibilidad)
11. ⏳ Refactorizar métodos para usar objetos de parámetros (Tarea 6)
12. ⏳ Verificar compatibilidad con `useQuery` (Tarea 6)
13. ⏳ Documentar fetchers personalizados (Tarea 9)
14. ⏳ Actualizar tipos TypeScript
15. ⏳ Crear ejemplo de uso y validar
16. ⏳ Actualizar documentación

## Casos de Prueba

### Caso 1: Uso Básico (Sin fetchFn)
```typescript
// Servicio - más simple, usa instancia por defecto
class RoleService extends RestStd {
    static resource = 'roles';
    // No necesita fetchFn!
}

// Componente
const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => RoleService.getAll()
});
```
**Resultado Esperado:** ✅ Debe funcionar sin errores

### Caso 2: Con Parámetros (Nuevo formato)
```typescript
const { data } = useQuery({
    queryKey: ['roles', filters],
    queryFn: () => RoleService.getAll({ 
        params: { status: 'active' } 
    })
});
```
**Resultado Esperado:** ✅ Debe pasar parámetros correctamente con autocompletado

### Caso 2b: Con Parámetros (Formato antiguo - deprecated)
```typescript
const { data } = useQuery({
    queryKey: ['roles', filters],
    queryFn: () => RoleService.getAll({ status: 'active' }, {})
});
```
**Resultado Esperado:** ✅ Debe seguir funcionando (compatibilidad hacia atrás)

### Caso 3: Instancia Personalizada
```typescript
// Servicio con baseURL diferente
const externalApi = createAxiosInstance({ 
    baseURL: 'https://fakestoreapi.com/' 
});

class CartService extends RestStd {
    static resource = 'carts';
    static fetchFn = createFetcher(externalApi);
}

const { data } = useQuery({
    queryKey: ['carts'],
    queryFn: () => CartService.getAll()
});
```
**Resultado Esperado:** ✅ Debe usar la instancia personalizada

### Caso 4: Métodos CRUD (Nuevo formato con objetos)
```typescript
// GET
const user = await RoleService.getOne({ id: 1 });

// GET con parámetros
const userWithRelations = await RoleService.getOne({ 
    id: 1, 
    params: { include: 'permissions' } 
});

// POST
const newRole = await RoleService.create({ 
    data: { name: 'Admin' } 
});

// PUT
const updated = await RoleService.update({ 
    id: 1, 
    data: { name: 'Super Admin' } 
});

// DELETE
await RoleService.delete({ id: 1 });
```
**Resultado Esperado:** ✅ Todos los métodos deben funcionar con autocompletado

### Caso 4b: Métodos con URL Personalizada
```typescript
// GET con endpoint personalizado
const user = await UserService.getOne({ 
    id: 123, 
    url: 'users/custom-endpoint' 
});
// → GET /users/custom-endpoint/123

// GET con URL absoluta
const externalData = await UserService.getOne({ 
    id: 456, 
    url: 'https://api.external.com/users/custom' 
});
// → GET https://api.external.com/users/custom/456

// GET all con path personalizado
const activeUsers = await UserService.getAll({ 
    url: 'users/active',
    params: { status: 'active' }
});
// → GET /users/active?status=active

// POST a endpoint personalizado
const result = await UserService.create({ 
    data: { name: 'Test' },
    url: 'users/special-action'
});
// → POST /users/special-action
```
**Resultado Esperado:** ✅ Debe permitir sobrescribir URLs manteniendo la estructura del método

### Caso 5: Manejo de Errores
```typescript
const { data, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => RoleService.getAll(),
    retry: false
});
```
**Resultado Esperado:** ✅ Los errores deben propagarse correctamente

### Caso 6: Sin baseURL (URL absoluta)
```typescript
const noBaseUrl = createAxiosInstance({ baseURL: '' });

class ExternalService extends RestStd {
    static resource = 'https://api.external.com/endpoint';
    static fetchFn = useFetch(axiosFetch, noBaseUrl);
}
```
**Resultado Esperado:** ✅ Debe funcionar con URLs absolutas

