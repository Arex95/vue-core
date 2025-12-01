# Análisis: Flexibilidad de useAuth

## Problema Actual

`useAuth` está completamente acoplado a Axios:

1. **Importación directa**: `getConfiguredAxiosInstance()` 
2. **Uso específico de Axios**: `.post()` es un método de Axios
3. **refreshTokens acoplado**: También usa `AxiosInstance`
4. **Sin opciones**: No permite usar otro fetcher

## Solución Propuesta

### Opción 1: Fetcher opcional (Recomendada)

Similar a `RestStd`, permitir pasar un `Fetcher` opcional:

```typescript
export function useAuth(fetcher?: Fetcher) {
  const getFetcher = () => fetcher || createAxiosFetcher(getConfiguredAxiosInstance());
  
  const login = async (...) => {
    const response = await getFetcher()({
      method: 'POST',
      url: endpoints.LOGIN,
      data: params
    });
    // ...
  };
}
```

**Ventajas:**
- Consistente con `RestStd`
- Flexible y agnóstico
- Mantiene compatibilidad (lazy init con Axios por defecto)

**Desventajas:**
- Cambio en la firma de la función (pero opcional)

### Opción 2: Configuración global

Configurar un fetcher global para auth:

```typescript
let authFetcher: Fetcher | null = null;

export function configAuthFetcher(fetcher: Fetcher) {
  authFetcher = fetcher;
}

export function useAuth() {
  const getFetcher = () => authFetcher || createAxiosFetcher(getConfiguredAxiosInstance());
  // ...
}
```

**Ventajas:**
- No cambia la firma de `useAuth`
- Configuración centralizada

**Desventajas:**
- Menos flexible (un solo fetcher para todo auth)
- Menos explícito

### Opción 3: Híbrida (Recomendada)

Combinar ambas: fetcher opcional + configuración global:

```typescript
let defaultAuthFetcher: Fetcher | null = null;

export function configAuthFetcher(fetcher: Fetcher) {
  defaultAuthFetcher = fetcher;
}

export function useAuth(fetcher?: Fetcher) {
  const getFetcher = () => 
    fetcher || 
    defaultAuthFetcher || 
    createAxiosFetcher(getConfiguredAxiosInstance());
  // ...
}
```

**Ventajas:**
- Máxima flexibilidad
- Compatible hacia atrás
- Permite override por instancia o global

## Cambios Necesarios

1. **useAuth.ts**:
   - Aceptar `Fetcher` opcional
   - Usar `Fetcher` en lugar de Axios directamente
   - Lazy initialization del fetcher por defecto

2. **refreshTokens.ts**:
   - Cambiar de `AxiosInstance` a `Fetcher`
   - Actualizar llamadas

3. **AxiosService** (opcional):
   - Si queremos mantener compatibilidad con interceptors de Axios, podríamos crear un wrapper

## Recomendación Final

**Opción 3 (Híbrida)** porque:
- Mantiene compatibilidad total
- Permite flexibilidad máxima
- Consistente con el patrón de `RestStd`
- No rompe código existente

