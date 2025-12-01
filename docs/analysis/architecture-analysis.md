# Análisis de Arquitectura: useFetch y Instancias de Axios

## Problema Actual

El diseño actual tiene una confusión conceptual:

```typescript
// Actual - confuso
const fetcher = useFetch(axiosFetch, axiosInstance);
// ¿Por qué useFetch necesita la instancia? ¿No debería el fetcher ya tenerla?
```

**Problemas:**
1. `useFetch` recibe una instancia de Axios como segundo parámetro, mezclando responsabilidades
2. La instancia se pasa en tiempo de ejecución, no en tiempo de creación del fetcher
3. Es confuso: ¿el fetcher es genérico o está ligado a una instancia?

## Análisis del Flujo

### Flujo Actual
```
1. Usuario configura Axios global → configAxios()
2. Usuario crea instancia personalizada → new AxiosService() o createAxiosInstance()
3. Usuario crea fetcher → useFetch(axiosFetch, instance?)
4. RestStd usa el fetcher → fetchFn(config, options)
```

**Problema:** El paso 3 mezcla la creación del fetcher con la configuración de la instancia.

## Opciones de Diseño

### Opción 1: Fetcher con Instancia (Recomendada)

**Concepto:** El fetcher se crea CON una instancia específica, no se le pasa después.

```typescript
// Helper para crear fetcher con instancia
function createFetcher(axiosInstance?: AxiosInstance) {
    const instance = axiosInstance || getConfiguredAxiosInstance();
    return (config: AxiosRequestConfig, options?: any) => {
        return axiosFetch(instance, config);
    };
}

// Uso
const defaultFetcher = createFetcher(); // Usa instancia global
const customFetcher = createFetcher(customInstance); // Usa instancia personalizada

// En RestStd
class RoleService extends RestStd {
    static resource = 'roles';
    static fetchFn = createFetcher(); // Simple, usa global
}

class CartService extends RestStd {
    static resource = 'carts';
    static fetchFn = createFetcher(customInstance); // Usa instancia personalizada
}
```

**Pros:**
- ✅ Separación clara de responsabilidades
- ✅ El fetcher ya tiene la instancia "bakeada"
- ✅ Más simple de entender
- ✅ `useFetch` puede desaparecer o simplificarse

**Contras:**
- ❌ Cambio breaking (pero puede mantener compatibilidad)

---

### Opción 2: useFetch Simplificado

**Concepto:** `useFetch` solo recibe el tipo de fetcher, la instancia se configura por separado.

```typescript
// useFetch solo crea el wrapper, no recibe instancia
function useFetch(fetchFn: Function) {
    return (config: AxiosRequestConfig, options?: any, instance?: AxiosInstance) => {
        const axiosInstance = instance || getConfiguredAxiosInstance();
        return fetchFn(axiosInstance, config, options);
    };
}

// Helper para crear fetcher con instancia
function createFetcher(instance?: AxiosInstance) {
    return useFetch(axiosFetch).bind(null, null, null, instance);
}
```

**Pros:**
- ✅ Mantiene `useFetch` pero simplificado
- ✅ Permite pasar instancia en tiempo de ejecución (flexible)

**Contras:**
- ❌ Sigue siendo confuso pasar instancia en tiempo de ejecución
- ❌ No es tan claro como Opción 1

---

### Opción 3: Fetcher Factory con Instancia

**Concepto:** Una función factory que crea fetchers específicos para una instancia.

```typescript
// Factory que crea fetchers para una instancia específica
function createFetcherForInstance(instance: AxiosInstance) {
    return (config: AxiosRequestConfig, options?: any) => {
        return axiosFetch(instance, config);
    };
}

// Helper para fetcher global
function createDefaultFetcher() {
    return createFetcherForInstance(getConfiguredAxiosInstance());
}

// Uso
class RoleService extends RestStd {
    static resource = 'roles';
    static fetchFn = createDefaultFetcher();
}

class CartService extends RestStd {
    static resource = 'carts';
    static fetchFn = createFetcherForInstance(customInstance);
}
```

**Pros:**
- ✅ Muy claro: "crear fetcher para esta instancia"
- ✅ Separación perfecta de responsabilidades
- ✅ Fácil de entender

**Contras:**
- ❌ Dos funciones en lugar de una (pero más claro)

---

## Recomendación: Opción 1 Mejorada

### Diseño Propuesto

```typescript
/**
 * Creates a fetcher function bound to a specific Axios instance.
 * If no instance is provided, uses the globally configured instance.
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
 */
export function createFetcher(instance?: AxiosInstance) {
    const axiosInstance = instance || getConfiguredAxiosInstance();
    
    return (config: AxiosRequestConfig, options?: any): Promise<any> => {
        return axiosFetch(axiosInstance, config);
    };
}

// Alias para claridad (opcional)
export const createQueryFetcher = createFetcher;
```

### Uso en RestStd

```typescript
export class RestStd {
    static resource: string;
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

### Ejemplos de Uso

```typescript
// Caso 1: Uso por defecto (instancia global)
class RoleService extends RestStd {
    static resource = 'roles';
    // fetchFn se asigna automáticamente con createFetcher()
}

// Caso 2: Instancia personalizada
const externalApi = createAxiosInstance({ baseURL: 'https://fakestoreapi.com/' });

class CartService extends RestStd {
    static resource = 'carts';
    static fetchFn = createFetcher(externalApi);
}

// Caso 3: Sin baseURL (URLs absolutas)
const noBaseUrl = createAxiosInstance({ baseURL: '' });

class ExternalService extends RestStd {
    static resource = 'https://api.external.com/endpoint';
    static fetchFn = createFetcher(noBaseUrl);
}
```

## Migración desde useFetch

### Código Antiguo
```typescript
// Antes
static fetchFn = useFetch(axiosFetch, customInstance);
```

### Código Nuevo
```typescript
// Después
static fetchFn = createFetcher(customInstance);
```

**Ventaja:** Más claro, más directo, menos confuso.

## Comparación de APIs

| Aspecto | Actual (useFetch) | Propuesto (createFetcher) |
|---------|-------------------|---------------------------|
| Claridad | ⚠️ Confuso (¿por qué useFetch recibe instancia?) | ✅ Claro (crear fetcher con instancia) |
| Separación | ❌ Mezcla responsabilidades | ✅ Separación clara |
| Simplicidad | ⚠️ Dos parámetros | ✅ Un parámetro opcional |
| Intención | ⚠️ No es evidente | ✅ Muy evidente |
| Flexibilidad | ✅ Permite instancia opcional | ✅ Permite instancia opcional |

## Decisión Final

✅ **Usar `createFetcher(instance?)` en lugar de `useFetch(fetchFn, instance?)`**

**Razones:**
1. Más claro conceptualmente: "crear un fetcher" vs "usar fetch con instancia"
2. Mejor separación: el fetcher ya tiene la instancia, no se pasa después
3. Más simple: un solo parámetro opcional
4. Más intuitivo: el nombre describe exactamente lo que hace

**Compatibilidad:**
- Mantener `useFetch` como deprecated durante una versión
- Documentar la migración
- Remover en versión mayor siguiente

