# Guía de Configuración

Esta guía detalla todas las opciones de configuración disponibles en `@arex95/vue-core`.

**Nota:** Para SSR/SSG (Nuxt, etc.), considera usar cookies para almacenamiento de tokens. Consulta la [guía de autenticación](./authentication.md) para más detalles.

## Opciones de Configuración

El plugin `ArexVueCore` acepta un objeto de configuración con las siguientes propiedades:

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

## appKey

**Tipo:** `string`  
**Requerido:** Sí  
**Descripción:** Clave secreta utilizada para encriptar datos sensibles en el almacenamiento local.

```typescript
appKey: 'your-secret-key-here'
```

**Recomendaciones:**
- Usa una clave fuerte y única
- Almacénala en variables de entorno
- No la expongas en el código fuente

```typescript
appKey: process.env.VUE_APP_SECRET_KEY || 'fallback-key'
```

## endpoints

**Tipo:** `EndpointsConfig`  
**Requerido:** Sí  
**Descripción:** Configuración de los endpoints de autenticación.

```typescript
endpoints: {
  login: string;    // Endpoint para login
  refresh: string;  // Endpoint para refresh token
  logout: string;   // Endpoint para logout
}
```

### Ejemplo

```typescript
endpoints: {
  login: '/api/auth/login',
  refresh: '/api/auth/refresh',
  logout: '/api/auth/logout',
}
```

### Notas

- Los endpoints son relativos a la `baseURL` de Axios si está configurada
- Puedes usar URLs absolutas si es necesario
- Asegúrate de que estos endpoints existan en tu API

## tokenKeys

**Tipo:** `TokenConfig`  
**Requerido:** Sí  
**Descripción:** Claves utilizadas para almacenar los tokens en el storage del navegador.

```typescript
tokenKeys: {
  accessToken: string;  // Clave para el access token
  refreshToken: string; // Clave para el refresh token
}
```

### Ejemplo

```typescript
tokenKeys: {
  accessToken: 'ACCESS_TOKEN',
  refreshToken: 'REFRESH_TOKEN',
}
```

### Notas

- Estas claves se usan para almacenar tokens encriptados
- Elige nombres descriptivos y únicos
- Evita conflictos con otras claves de tu aplicación

## tokenPaths

**Tipo:** `TokenPathsConfig`  
**Requerido:** Sí  
**Descripción:** Rutas (en notación de puntos) para extraer los tokens de la respuesta del login.

```typescript
tokenPaths: {
  accessToken: string;  // Ruta al access token en la respuesta
  refreshToken: string; // Ruta al refresh token en la respuesta
}
```

### Ejemplos

#### Tokens en el nivel raíz
```json
{
  "access_token": "...",
  "refresh_token": "..."
}
```
```typescript
tokenPaths: {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
}
```

#### Tokens anidados
```json
{
  "data": {
    "tokens": {
      "access": "...",
      "refresh": "..."
    }
  }
}
```
```typescript
tokenPaths: {
  accessToken: 'data.tokens.access',
  refreshToken: 'data.tokens.refresh',
}
```

### Notación de Puntos

La notación de puntos permite acceder a propiedades anidadas:
- `'field'` → `response.field`
- `'data.field'` → `response.data.field`
- `'data.tokens.access'` → `response.data.tokens.access`

## refreshTokenPaths

**Tipo:** `TokenPathsConfig`  
**Requerido:** Sí  
**Descripción:** Rutas para extraer los tokens de la respuesta del refresh. Similar a `tokenPaths` pero para el endpoint de refresh.

```typescript
refreshTokenPaths: {
  accessToken: string;
  refreshToken: string;
}
```

### Ejemplo

```typescript
refreshTokenPaths: {
  accessToken: 'data.access_token',
  refreshToken: 'data.refresh_token',
}
```

**Nota:** A menudo `refreshTokenPaths` es igual a `tokenPaths`, pero pueden diferir si tu API devuelve estructuras diferentes.

## axios

**Tipo:** `AxiosServiceOptions`  
**Requerido:** Sí  
**Descripción:** Configuración de la instancia de Axios.

```typescript
axios: {
  baseURL?: string;                  // URL base de la API
  headers?: Record<string, string>;  // Headers por defecto
  timeout?: number;                  // Timeout en milisegundos
  withCredentials?: boolean;         // Incluir credentials en requests cross-origin
  setupAuthInterceptors?: boolean;   // Montar interceptores de auth (default: true)
}
```

### Propiedades

#### baseURL

**Tipo:** `string`  
**Requerido:** Sí  
**Descripción:** URL base para todas las peticiones HTTP.

```typescript
baseURL: 'https://api.example.com'
```

O usando variables de entorno:

```typescript
baseURL: process.env.VUE_APP_API_URL || 'https://api.example.com'
```

#### headers

**Tipo:** `Record<string, string>`  
**Requerido:** No  
**Descripción:** Headers por defecto para todas las peticiones.

```typescript
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Custom-Header': 'value',
}
```

**Nota:** Los headers se pueden sobrescribir en peticiones individuales.

#### timeout

**Tipo:** `number`  
**Requerido:** No  
**Descripción:** Tiempo máximo de espera para peticiones en milisegundos.

```typescript
timeout: 10000 // 10 segundos
```

**Valor por defecto:** Sin timeout (si no se especifica)

#### withCredentials

**Tipo:** `boolean`  
**Requerido:** No  
**Descripción:** Si es `true`, incluye cookies y credenciales en las peticiones cross-origin.

```typescript
withCredentials: true
```

**Valor por defecto:** `false`

#### setupAuthInterceptors

**Tipo:** `boolean`
**Requerido:** No
**Descripción:** Cuando `true`, monta interceptores en la instancia Axios que añaden `Authorization: Bearer {token}` a cada request y manejan el refresh automático en 401.

```typescript
setupAuthInterceptors: true   // default — interceptores activos
setupAuthInterceptors: false  // control manual — útil en SSR o cuando gestionas headers propios
```

**Cuándo usar `false`**:
- En entornos SSR donde `localStorage` no existe en el servidor
- Cuando registras tus propios interceptores de auth
- Para evitar el comportamiento automático de refresh/retry

Ver [guía de autenticación](./authentication.md#interceptores-de-axios-setupauthinterceptors) para más detalles.

## onRefreshFailed

**Tipo:** `() => void`
**Requerido:** No
**Descripción:** Callback invocado cuando el refresh automático de tokens falla. Si no se proporciona, la librería recarga la página con `window.location.reload()`.

```typescript
onRefreshFailed: () => {
  router.push('/login');
  // o: store.dispatch('auth/logout')
}
```

## onLogout

**Tipo:** `() => void`
**Requerido:** No
**Descripción:** Callback invocado después de un logout exitoso.

```typescript
onLogout: () => {
  router.push('/login');
}
```

## Ejemplo Completo de Configuración

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import { ArexVueCore } from '@arex95/vue-core';

const app = createApp(App);

app.use(ArexVueCore, {
  // Clave secreta para encriptación
  appKey: process.env.VUE_APP_SECRET_KEY || 'development-key',
  
  // Endpoints de autenticación
  endpoints: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
  },
  
  // Claves de almacenamiento
  tokenKeys: {
    accessToken: 'ACCESS_TOKEN',
    refreshToken: 'REFRESH_TOKEN',
  },
  
  // Rutas para tokens en respuesta de login
  tokenPaths: {
    accessToken: 'data.access_token',
    refreshToken: 'data.refresh_token',
  },
  
  // Rutas para tokens en respuesta de refresh
  refreshTokenPaths: {
    accessToken: 'data.access_token',
    refreshToken: 'data.refresh_token',
  },
  
  // Configuración de Axios
  axios: {
    baseURL: process.env.VUE_APP_API_URL || 'https://api.example.com',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 10000,
    withCredentials: false,
  },
});

app.mount('#app');
```

## Configuración por Entorno

Es recomendable usar diferentes configuraciones según el entorno:

### development.js

```typescript
export const config = {
  appKey: 'dev-secret-key',
  axios: {
    baseURL: 'http://localhost:3000/api',
  },
  // ...
};
```

### production.js

```typescript
export const config = {
  appKey: process.env.VUE_APP_SECRET_KEY,
  axios: {
    baseURL: 'https://api.production.com',
  },
  // ...
};
```

### main.ts

```typescript
import { config } from './config/environment';

app.use(ArexVueCore, config);
```

## Validación de Configuración

El plugin valida automáticamente la configuración y muestra advertencias en la consola si falta alguna propiedad requerida:

```typescript
// Si falta la configuración
app.use(ArexVueCore);
// Console: "ArexVueCore: No configuration options were provided..."
```

## Configuración Dinámica

Puedes actualizar ciertas configuraciones después de la inicialización usando las funciones de configuración:

```typescript
import { configAxios, configEndpoints } from '@arex95/vue-core';

// Actualizar baseURL
configAxios({
  baseURL: 'https://new-api.example.com',
});

// Actualizar endpoints
configEndpoints({
  loginEndpoint: '/api/v2/login',
  refreshEndpoint: '/api/v2/refresh',
  logoutEndpoint: '/api/v2/logout',
});
```

## Mejores Prácticas

1. **Usa variables de entorno** para valores sensibles
2. **Valida la configuración** antes de desplegar
3. **Documenta tus endpoints** y estructuras de respuesta
4. **Usa TypeScript** para type-safety
5. **Mantén configuraciones separadas** por entorno
6. **Revisa los logs** de advertencia en desarrollo

