# Guía de Autenticación

Esta guía explica cómo funciona el sistema de autenticación en `@arex95/vue-core` y cómo implementarlo en tu aplicación.

## Visión General

El sistema de autenticación está basado en JWT (JSON Web Tokens) y proporciona:

- **Login y Logout**: Gestión de sesiones de usuario
- **Almacenamiento de Tokens**: Soporte para localStorage, sessionStorage y cookies
- **Encriptación**: Almacenamiento seguro de tokens usando AES-CBC-256 (Web Crypto API)
- **Cookies Seguras**: Soporte para cookies con opciones de seguridad (Secure, SameSite)
- **Flexible**: Funciona con cualquier fetcher (no acoplado a Axios)
- **Refresh Automático**: Renovación automática de tokens expirados (cuando `setupAuthInterceptors: true`)

## Configuración Inicial

```typescript
import { createApp } from 'vue';
import { ArexVueCore } from '@arex95/vue-core';

const app = createApp(App);

app.use(ArexVueCore, {
  appKey: 'your-secret-key',
  endpoints: {
    login:   '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout:  '/api/auth/logout',
  },
  tokenKeys: {
    accessToken:  'MY_APP_access',
    refreshToken: 'MY_APP_refresh',
  },
  tokenPaths: {
    accessToken:  'token',          // lee response.token
    refreshToken: 'refresh_token',  // lee response.refresh_token
  },
  refreshTokenPaths: {
    accessToken:  'token',
    refreshToken: 'refresh_token',
  },
  axios: {
    baseURL: 'https://api.example.com',
    setupAuthInterceptors: true,    // ver sección "Interceptores"
  },
});
```

## Uso Básico

### Login

```typescript
const { login } = useAuth();

// 'local' → localStorage (recomendado para SPAs)
// 'session' → sessionStorage (se pierde al cerrar la pestaña)
// 'cookie' → document.cookie (ver advertencias más abajo)
await login({ email, password }, 'local');
```

### Logout

```typescript
const { logout } = useAuth();
await logout();
```

---

## Persistencia de Sesión

### Tabla de comportamiento real (verificado en código fuente)

| location | `storeEncryptedItem` guarda en | `getDecryptedItem` busca en | Persistencia |
|----------|-------------------------------|------------------------------|--------------|
| `'local'` | localStorage | localStorage | Hasta limpieza explícita |
| `'session'` | sessionStorage | sessionStorage | Hasta cerrar la pestaña |
| `'cookie'` | document.cookie | cookies únicamente | Según `expires` option |
| `'any'` | localStorage | sessionStorage → localStorage → cookies | Hasta limpieza explícita |

> **`'any'`** es el modo de recuperación universal: busca en todos los storages.
> Al guardar, usa localStorage (persistente). Cambio respecto a v3.3 que usaba sessionStorage.

### `'local'` — Recomendado para SPAs

```typescript
await login(credentials, 'local');
```

- Tokens en localStorage, persisten entre sesiones del navegador
- Los interceptores integrados de Axios encuentran el token automáticamente con `getAuthToken("any")`
- Funciona en SSR solo en el lado cliente (localStorage no existe en Node.js)

### `'session'` — Sesiones temporales

```typescript
await login(credentials, 'session');
```

- Tokens en sessionStorage, se eliminan al cerrar la pestaña
- Útil cuando el usuario no quiere que la sesión persista

### `'cookie'` — Cookies de navegador

```typescript
await login(credentials, 'cookie');
```

- Tokens encriptados en `document.cookie`
- **Advertencia para SPAs**: los interceptores de `AxiosService` buscan con `getAuthToken("any")`, que a partir de v3.4 incluye cookies como último recurso. Sin embargo, `'local'` sigue siendo más eficiente para SPAs.
- **Advertencia SSR**: `getCookieStorage` usa `document.cookie` — no funciona en el servidor. Para SSR real usa las utilidades de cookies de tu framework (h3, Nuxt `useCookie`, etc.)

#### Opciones de cookie

```typescript
import { storeEncryptedItem } from '@arex95/vue-core';

await storeEncryptedItem(key, value, appKey, 'cookie', {
  expires:  30,           // días hasta expiración (undefined = session cookie)
  path:     '/',
  domain:   '.example.com',
  secure:   true,         // solo HTTPS (auto-detectado en https: protocol)
  sameSite: 'Strict',     // 'Strict' | 'Lax' | 'None'
  // httpOnly: true       // ← LANZA ERROR — no se puede setear desde JS
});
```

> **`httpOnly` lanza un error.** Las cookies HttpOnly solo se pueden establecer desde código de servidor. No las uses con esta función.

---

## Encriptación

Los tokens se encriptan con **AES-CBC-256** antes de guardarse:
- Clave derivada con SHA-256 a partir de `appKey`
- IV aleatorio de 16 bytes por operación
- Formato almacenado: `IV_hex(32 chars) + ciphertext_hex`

Requiere Web Crypto API (`crypto.subtle`):
- ✅ Node.js 15+ (Nitro, Deno, Cloudflare Workers)
- ✅ Todos los navegadores modernos
- ❌ Node.js < 15 — lanza error descriptivo

---

## Interceptores de Axios (`setupAuthInterceptors`)

```typescript
axios: {
  setupAuthInterceptors: true,  // default: true
}
```

Cuando `true`, `AxiosService` registra interceptores que:

**Request:** leen el token usando la ubicación de persistencia configurada para la sesión y añaden `Authorization: Bearer {token}`.

**Response 401:** si el token expiró, intentan el refresh automático:
1. Leen el refresh token desde la ubicación de persistencia
2. `POST {endpoints.refresh}` con el refresh token en el body (`{ refresh_token: "..." }`)
3. Guardan los nuevos tokens
4. Reintentan la request original

Si el refresh también falla: llama `onRefreshFailed()` (o recarga la página si no está configurado) y lanza el error.

```typescript
// En arex-core.ts
onRefreshFailed: () => {
  // Redirigir a login, limpiar estado, etc.
},
```

> **Cuándo usar `setupAuthInterceptors: false`**: En entornos SSR o cuando quieres controlar manualmente la adición de headers y el manejo de 401. Ver [guía de integración con Nuxt](./nuxt-integration.md).

---

## Estructura de Respuesta del API

Usa `tokenPaths` en notación de puntos para mapear cualquier estructura:

```typescript
// response.token
tokenPaths: { accessToken: 'token', refreshToken: 'refresh_token' }

// response.data.access_token
tokenPaths: { accessToken: 'data.access_token', refreshToken: 'data.refresh_token' }

// response.result.tokens.access
tokenPaths: { accessToken: 'result.tokens.access', refreshToken: 'result.tokens.refresh' }
```

---

## Refresh Automático

El endpoint de refresh recibe el refresh token en el **body de la request**:

```http
POST /api/auth/refresh
Content-Type: application/json

{ "refresh_token": "eyJ..." }
```

La clave del campo en el body se toma de `refreshTokenPaths.refreshTokenPath` (default: `'refresh_token'`).

Tu backend debe validar este token y devolver nuevos tokens con la misma estructura que el login.

---

## Limpieza de Credenciales

```typescript
import { cleanCredentials } from '@arex95/vue-core';

// Limpia solo localStorage
await cleanCredentials('local');

// Limpia solo sessionStorage
await cleanCredentials('session');

// Limpia solo cookies
await cleanCredentials('cookie');

// Limpia TODOS: localStorage + sessionStorage + cookies
await cleanCredentials('any');
```

> Desde v3.4, `cleanCredentials('any')` limpia **todos los storages incluyendo cookies**, garantizando que ningún token sobreviva un logout.

---

## Verificación de Tokens

```typescript
import { verifyAuth } from '@arex95/vue-core';

// Busca en todos los storages, verifica expiración del JWT
const isAuthenticated = await verifyAuth(); // → boolean
```

O manualmente:

```typescript
import { getAuthToken, getAppKey } from '@arex95/vue-core';

const token = await getAuthToken(getAppKey(), 'any');
if (token) {
  // Usuario autenticado — el token existe en algún storage
}
```

---

## Protección de Rutas

### Vue Router

```typescript
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const isAuthenticated = await verifyAuth();
    if (!isAuthenticated) {
      next('/login');
    } else {
      next();
    }
  } else {
    next();
  }
});
```

### Nuxt (middleware)

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const isAuthenticated = useState('__auth', () => false);
  if (!isAuthenticated.value) {
    return navigateTo('/login');
  }
});
```

---

## Manejo de Errores

```typescript
import { handleError, NetworkError, AuthError } from '@arex95/vue-core';

try {
  await login(credentials, 'local');
} catch (error) {
  if (error instanceof AuthError) {
    showError('Credenciales inválidas');
  } else if (error instanceof NetworkError) {
    showError(error.statusCode === 401
      ? 'Usuario o contraseña incorrectos'
      : 'Error de conexión'
    );
  }
}
```

---

## Mejores Prácticas

1. **Usa `'local'` para SPAs** — es la ubicación más confiable, compatible con los interceptores automáticos y con SSR (el servidor simplemente no tiene token, las queries se activan en el cliente)

2. **No cambies `appKey` en producción sin invalidar sesiones** — todos los tokens encriptados con la clave anterior se vuelven irrecuperables

3. **`setupAuthInterceptors: false` en SSR** — en el servidor, localStorage no existe; controla los headers manualmente con el plugin del lado servidor

4. **Implementa `onRefreshFailed`** — redirecciona al login en lugar de recargar la página (`window.location.reload()` por defecto)

5. **`cleanCredentials('any')` en logout** — limpia todos los storages para evitar tokens huérfanos

---

## Cambios desde v3.3 → v3.4

| Comportamiento | v3.3 | v3.4 |
|----------------|------|------|
| `storeEncryptedItem('any')` | sessionStorage | localStorage |
| `getDecryptedItem('any')` en cliente | sessionStorage → localStorage | sessionStorage → localStorage → cookies |
| `cleanCredentials('any')` | no limpiaba cookies | limpia todos incluyendo cookies |
| `refreshTokens` busca refresh token | `"any"` hardcoded | `persistence` (ubicación real) |
| refresh request body | sin refresh token | `{ refresh_token: "..." }` |
| Interceptores Axios buscan token | `"any"` hardcoded | `persistence` (ubicación real) |
| `httpOnly` en cookies | `console.warn` | `throw Error` |
| `crypto.subtle` no disponible | fallo silencioso | error descriptivo |
| Cookie parser con valores `=` | split incorrecto | split en primer `=` |
| `processQueue(null, null)` | promesas colgadas | rechaza con error claro |
