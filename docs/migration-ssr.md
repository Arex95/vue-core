# Guía de Migración: Soporte SSR

Esta guía explica cómo migrar proyectos existentes de Arex Vue Core para usar las nuevas características SSR.

## Cambios para Usuarios Existentes

**¡Buenas noticias!** No hay cambios requeridos para proyectos existentes. Todas las funciones mantienen su firma actual y la configuración SSR es completamente opcional.

## Migración Gradual

### Paso 1: Sin Cambios (Compatibilidad Total)

Tu código existente sigue funcionando sin cambios:

```typescript
// ✅ Esto sigue funcionando igual
const { login, logout } = useAuth();
await login({ username, password }, 'local');
```

### Paso 2: Agregar Configuración SSR (Opcional)

Si quieres habilitar soporte SSR, simplemente agrega la configuración SSR al plugin:

```typescript
// Antes
app.use(ArexVueCore, {
  appKey: 'your-key',
  endpoints: { /* ... */ },
  // ... otras opciones
});

// Después (con SSR opcional)
app.use(ArexVueCore, {
  appKey: 'your-key',
  endpoints: { /* ... */ },
  // ... otras opciones existentes sin cambios
  
  // Nueva configuración SSR (opcional)
  ssr: {
    getContext: () => {
      // Tu implementación específica del framework
    },
    redirectStrategy: {
      redirect: (path) => {
        // Tu implementación específica del framework
      }
    }
  }
});
```

### Paso 3: Usar Cookies en Lugar de localStorage (Opcional)

Si estás en SSR, puedes cambiar a cookies:

```typescript
// Antes
await login({ username, password }, 'local');

// Después (con SSR)
await login({ username, password }, 'cookie');
```

## Nuevas Opciones Disponibles

### Storage Configuration

```typescript
storage?: {
  driver?: StorageDriver; // Driver personalizado
  defaultLocation?: LocationPreference; // 'local' | 'session' | 'cookie'
  defaultCookieOptions?: StorageOptions; // Opciones de cookie
}
```

### SSR Configuration

```typescript
ssr?: {
  getContext?: () => StorageContext | Promise<StorageContext>;
  redirectStrategy?: RedirectStrategy;
}
```

## Funciones Actualizadas (Compatibles)

Las siguientes funciones ahora aceptan parámetros opcionales adicionales, pero mantienen compatibilidad hacia atrás:

### `getAuthToken`

```typescript
// Antes
const token = await getAuthToken(secretKey, 'any');

// Después (con contexto SSR opcional)
const token = await getAuthToken(secretKey, 'any', context);
```

### `verifyAuth`

```typescript
// Antes
const isAuth = await verifyAuth();

// Después (con contexto SSR opcional)
const isAuth = await verifyAuth(context);
```

### `refreshTokens`

```typescript
// Antes
await refreshTokens(fetcher);

// Después (con storage opcional)
await refreshTokens(fetcher, storage);
```

## Ejemplo Completo de Migración

### Antes (Solo Cliente)

```typescript
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { ArexVueCore } from '@arex95/vue-core';

const app = createApp(App);

app.use(ArexVueCore, {
  appKey: 'your-secret-key',
  endpoints: {
    login: '/api/login',
    refresh: '/api/refresh',
    logout: '/api/logout',
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
    timeout: 10000,
  },
});

app.mount('#app');
```

### Después (Con SSR)

```typescript
// main.ts (cliente) o server.ts (SSR)
import { createApp } from 'vue';
import App from './App.vue';
import { ArexVueCore } from '@arex95/vue-core';

const app = createApp(App);

app.use(ArexVueCore, {
  // ✅ Todas las opciones anteriores siguen igual
  appKey: 'your-secret-key',
  endpoints: {
    login: '/api/login',
    refresh: '/api/refresh',
    logout: '/api/logout',
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
    timeout: 10000,
  },
  
  // ✅ Nueva configuración SSR (opcional)
  ssr: {
    getContext: () => {
      // Implementación específica del framework
      return {
        cookies: parseCookies(),
        headers: getHeaders(),
        responseHeaders: getResponseHeaders(),
      };
    },
    redirectStrategy: {
      redirect: (path) => {
        // Implementación específica del framework
      }
    }
  }
});

app.mount('#app');
```

## Preguntas Frecuentes

### ¿Necesito cambiar mi código existente?

No. Todas las funciones mantienen su firma actual. La configuración SSR es completamente opcional.

### ¿Qué pasa si no configuro SSR?

El código funciona igual que antes, solo en modo cliente. No hay breaking changes.

### ¿Puedo usar SSR parcialmente?

Sí. Puedes configurar solo `getContext` o solo `redirectStrategy`, según lo que necesites.

### ¿Cómo sé si estoy usando SSR?

Si estás usando un framework SSR (Nuxt, Next.js, SvelteKit) y configuraste `ssr.getContext`, entonces estás usando SSR.

## Recursos Adicionales

- [Guía de Integración SSR](./ssr-integration.md) - Ejemplos detallados por framework
- [Documentación de Autenticación](./authentication.md) - Uso de `useAuth`
- [Documentación de Configuración](./configuration.md) - Todas las opciones disponibles

