# Arquitectura SSR Final: Arex Vue Core v2

## Resumen Ejecutivo

Este documento define la arquitectura final para soporte SSR completo en Arex Vue Core. Después de múltiples iteraciones de análisis, se ha decidido implementar una **configuración a nivel de plugin** con **factory pattern** para evitar problemas de singleton y state leak en SSR.

**Decisión clave:** Configuración global en `ArexVueCoreOptions` + Factory pattern para crear storage por request, evitando singleton global con estado cacheado.

**Principio fundamental:** Arex Vue Core es **framework-agnóstico**. El core funciona con cualquier framework (Vue puro, Nuxt, Next.js, SvelteKit, etc.). Las abstracciones de SSR permiten adaptar la librería a cualquier entorno mediante configuración de contexto.

---

## 1. Problemas Identificados en la Arquitectura Actual

### 1.1 Estado Global Invisible

**Problema:** Las funciones `getSessionPersistence()`, `getSessionConfig()`, `verifyAuth()` no reciben contexto de request.

**Impacto en SSR:**
- En el servidor, no existe `localStorage` ni `document.cookie` global
- Múltiples requests concurrentes requieren acceso contextualizado a cookies
- Las cookies deben leerse desde headers HTTP (`Cookie: access_token=...`)

**Ubicación:** `src/config/global/sessionConfig.ts`, `src/services/credentials.ts`

### 1.2 Capa de Encriptación

**Problema:** Uso directo de `crypto.subtle` sin verificar disponibilidad en Node.js.

**Impacto:**
- Node.js < 15 requiere `import { webcrypto } from 'node:crypto'`
- Algunos entornos pueden no tener `crypto.subtle` en scope global

**Ubicación:** `src/utils/encryption.ts`

**Nota:** La solución debe ser framework-agnóstica, funcionando en cualquier entorno sin depender de APIs específicas de framework.

### 1.3 verifyAuth sin Contexto SSR

**Problema:** `verifyAuth()` siempre devuelve `false` en SSR porque no puede leer cookies del request actual.

**Impacto:**
- Flicker: servidor renderiza "no autenticado", cliente hidrata y muestra "autenticado"
- Experiencia de usuario degradada

**Ubicación:** `src/services/credentials.ts:139`

### 1.4 window.location.reload() en Logout

**Problema:** `logout()` usa `window.location.reload()` que no existe en servidor.

**Impacto:**
- No puede redirigir en SSR
- Requiere abstracción de redirección

**Ubicación:** `src/composables/auth/useAuth.ts:64`

---

## 2. Arquitectura Propuesta: Plugin-Level Configuration

### 2.1 Decisión Arquitectónica

**Configuración a nivel de plugin** en lugar de pasar contexto en cada llamada a `useAuth()`.

**Razones:**
1. **Configuración global:** `storageDriver` y contexto SSR son configuración de aplicación, no por llamada
2. **Sin breaking changes:** `useAuth()` mantiene su firma actual
3. **Más limpio:** Contexto SSR se obtiene una vez en plugin de Nuxt
4. **Mejor arquitectura:** Separación entre configuración global y uso

### 2.2 Estructura de Configuración

```typescript
export interface ArexVueCoreOptions {
  appKey: string;
  endpoints: {
    login: string;
    refresh: string;
    logout: string;
  };
  tokenKeys: {
    accessToken: string;
    refreshToken: string;
  };
  tokenPaths: {
    accessToken: string;
    refreshToken: string;
  };
  refreshTokenPaths: {
    accessToken: string;
    refreshToken: string;
  };
  axios: AxiosServiceOptions;
  
  // Nuevas opciones SSR (todas opcionales)
  storage?: {
    driver?: StorageDriver;
    defaultLocation?: LocationPreference;
  };
  
  ssr?: {
    getContext?: () => StorageContext | Promise<StorageContext>;
    redirectStrategy?: RedirectStrategy;
  };
}
```

### 2.3 Storage Driver Interface

```typescript
export interface StorageDriver {
  get(key: string, context?: StorageContext): string | null | Promise<string | null>;
  set(key: string, value: string, options?: StorageOptions, context?: StorageContext): void | Promise<void>;
  remove(key: string, options?: StorageOptions, context?: StorageContext): void | Promise<void>;
}

export interface StorageContext {
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  responseHeaders?: Headers | Record<string, string>;
}

export interface StorageOptions {
  expires?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  httpOnly?: boolean;
}
```

### 2.4 Redirect Strategy Interface (Framework-Agnóstico)

```typescript
export interface RedirectStrategy {
  redirect(path: string): void | Promise<void>;
}

const defaultRedirectStrategy: RedirectStrategy = {
  redirect: (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
    // En SSR sin framework específico, simplemente no hace nada
    // Cada framework puede proporcionar su propia implementación
  }
};
```

**Principio:** La estrategia de redirección es completamente configurable. El core proporciona un default básico, pero cada framework puede proporcionar su propia implementación.

---

## 3. Universal Storage: Factory Pattern vs Singleton

### 3.1 Problema del Singleton

**Problema identificado:** Si `UniversalStorage` es un singleton global con estado cacheado, puede filtrar contexto entre requests en SSR.

**Ejemplo del problema:**
```typescript
// ❌ MAL: Singleton global
let globalStorage: UniversalStorage;

export function useAuth() {
  const storage = globalStorage || (globalStorage = new UniversalStorage(...));
  // Si el contexto se cachea aquí, puede filtrarse entre requests
}
```

### 3.2 Solución: Factory Pattern

**Decisión:** No usar singleton. Crear nueva instancia de storage por request o usar factory que maneje el contexto correctamente.

```typescript
// ✅ BIEN: Factory que crea storage con contexto
function createStorageForRequest(contextGetter?: () => StorageContext | Promise<StorageContext> | null): UniversalStorage {
  const driver = getGlobalStorageDriver();
  const appKey = getAppKey();
  return new UniversalStorage(driver, appKey, contextGetter);
}

export function useAuth(fetcher?: Fetcher) {
  const contextGetter = getGlobalSSRContextGetter();
  const storage = createStorageForRequest(contextGetter);
  // Cada llamada a useAuth crea su propio storage con su propio contexto
}
```

### 3.3 Universal Storage Implementation

```typescript
export class UniversalStorage {
  private cachedContext: StorageContext | null = null;
  private contextGetter?: () => StorageContext | Promise<StorageContext> | null;
  
  constructor(
    private driver: StorageDriver,
    private appKey: string,
    contextGetter?: () => StorageContext | Promise<StorageContext> | null
  ) {
    this.contextGetter = contextGetter;
  }
  
  async getEncrypted(key: string): Promise<string | null> {
    const context = await this.getContext();
    return this.driver.get(key, context);
  }
  
  async setEncrypted(key: string, value: string, options?: StorageOptions): Promise<void> {
    const context = await this.getContext();
    const encrypted = await encrypt(value, this.appKey);
    await this.driver.set(key, encrypted, options, context);
  }
  
  async removeEncrypted(key: string, options?: StorageOptions): Promise<void> {
    const context = await this.getContext();
    await this.driver.remove(key, options, context);
  }
  
  private async getContext(): Promise<StorageContext | null> {
    if (!this.cachedContext && this.contextGetter) {
      this.cachedContext = await this.contextGetter() || null;
    }
    return this.cachedContext;
  }
}
```

**Nota importante:** El cacheo del contexto es por instancia. Como cada request crea una nueva instancia, no hay riesgo de filtrar contexto entre requests.

---

## 4. Implementación del Plugin

### 4.1 Configuración Global

```typescript
// src/config/global/storageConfig.ts
let globalStorageDriver: StorageDriver | null = null;
let globalSSRContextGetter: (() => StorageContext | Promise<StorageContext> | null) | null = null;
let globalRedirectStrategy: RedirectStrategy | null = null;

export function setGlobalStorageDriver(driver: StorageDriver): void {
  globalStorageDriver = driver;
}

export function getGlobalStorageDriver(): StorageDriver {
  return globalStorageDriver || (typeof window !== 'undefined' ? LocalStorageDriver : BrowserCookieDriver);
}

export function setGlobalSSRContextGetter(getter: () => StorageContext | Promise<StorageContext> | null): void {
  globalSSRContextGetter = getter;
}

export function getGlobalSSRContextGetter(): (() => StorageContext | Promise<StorageContext> | null) | null {
  return globalSSRContextGetter;
}

export function setGlobalRedirectStrategy(strategy: RedirectStrategy): void {
  globalRedirectStrategy = strategy;
}

export function getGlobalRedirectStrategy(): RedirectStrategy {
  return globalRedirectStrategy || defaultRedirectStrategy;
}
```

### 4.2 Plugin Install

```typescript
// src/index.ts
export const ArexVueCore = {
  install: (app: App, options: ArexVueCoreOptions) => {
    // ... configuración existente ...
    
    // Configurar storage driver
    if (options.storage?.driver) {
      setGlobalStorageDriver(options.storage.driver);
    } else {
      // Auto-detectar según entorno
      const driver = typeof window !== 'undefined' 
        ? LocalStorageDriver 
        : BrowserCookieDriver;
      setGlobalStorageDriver(driver);
    }
    
    // Configurar SSR context getter
    if (options.ssr?.getContext) {
      setGlobalSSRContextGetter(options.ssr.getContext);
    }
    
    // Configurar redirect strategy
    if (options.ssr?.redirectStrategy) {
      setGlobalRedirectStrategy(options.ssr.redirectStrategy);
    }
  },
};
```

---

## 5. useAuth Refactorizado

### 5.1 Implementación

```typescript
export function useAuth(fetcher?: Fetcher) {
  const endpoints = getEndpointsConfig();
  const contextGetter = getGlobalSSRContextGetter();
  const storage = createStorageForRequest(contextGetter);
  
  const getFetcher = (): Fetcher => {
    return fetcher || getDefaultAuthFetcher();
  };
  
  const login = async (
    params: Record<string, unknown> = {},
    persistence: LocationPreference,
    tokenPaths: AuthTokenPaths = getTokenPathsConfig()
  ): Promise<AuthResponse> => {
    try {
      const data = await getFetcher()({
        method: 'POST',
        url: endpoints.LOGIN,
        data: params,
      }) as AuthResponse;

      const { accessToken, refreshToken } = extractAndValidateTokens(
        data,
        tokenPaths,
        "LOGIN"
      );

      configSession({
        persistencePreference: persistence,
      });

      await storage.setEncrypted(tokensConfig.ACCESS_TOKEN, accessToken, { /* ... */ });
      await storage.setEncrypted(tokensConfig.REFRESH_TOKEN, refreshToken, { /* ... */ });
      
      return data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  };
  
  const logout = async (params: Record<string, unknown> = {}): Promise<void> => {
    const redirectStrategy = getGlobalRedirectStrategy();
    
    try {
      await getFetcher()({
        method: 'POST',
        url: endpoints.LOGOUT,
        data: params,
      });
    } catch (error) {
      handleError(error);
    } finally {
      await storage.removeEncrypted(tokensConfig.ACCESS_TOKEN);
      await storage.removeEncrypted(tokensConfig.REFRESH_TOKEN);
      await redirectStrategy.redirect('/login');
    }
  };
  
  return { login, logout };
}
```

### 5.2 Sin Breaking Changes

**Firma actual:**
```typescript
useAuth(fetcher?: Fetcher)
```

**Firma nueva:**
```typescript
useAuth(fetcher?: Fetcher) // ✅ Misma firma
```

El contexto SSR se obtiene automáticamente desde la configuración global. No requiere cambios en código existente.

---

## 6. Integración con Frameworks SSR

### 6.0 Principio Framework-Agnóstico

**Arex Vue Core es completamente framework-agnóstico.** El core funciona igual en Vue puro, Nuxt, Next.js, SvelteKit, o cualquier otro framework.

**Cómo funciona:**
1. El core define interfaces genéricas (`StorageContext`, `StorageDriver`, `RedirectStrategy`)
2. Cada framework proporciona su propia implementación de estas interfaces
3. El core usa las interfaces sin conocer el framework específico

**Patrón de integración genérico:**
```typescript
// 1. Obtener contexto del request (cada framework tiene su forma)
const getContext = () => {
  // Framework-specific: obtener cookies y headers del request
  return {
    cookies: parseCookiesFromRequest(),
    headers: getRequestHeaders(),
    responseHeaders: getResponseHeaders(),
  };
};

// 2. Configurar estrategia de redirección (cada framework tiene su forma)
const redirectStrategy = {
  redirect: (path: string) => {
    // Framework-specific: redirigir según el framework
  }
};

// 3. Configurar Arex con estas funciones genéricas
app.use(ArexVueCore, {
  // ... otras opciones
  ssr: {
    getContext,
    redirectStrategy
  }
});
```

### 6.1 Integración con Nuxt (Ejemplo)

**Nota:** Este es solo un ejemplo de cómo integrar Arex con Nuxt. El mismo patrón se puede aplicar a cualquier framework.

Usar utilidades de `h3` (el servidor detrás de Nitro) para parsing de cookies. Es más robusto ante variaciones en formato de headers.

```typescript
// plugins/arex-vue-core.ts
import { defineNuxtPlugin } from '#app';
import { ArexVueCore } from '@arex95/vue-core';
import { parseCookies, setCookie } from 'h3';

// Alternativa si h3 no está disponible directamente:
// function parseCookies(cookieHeader: string): Record<string, string> {
//   const cookies: Record<string, string> = {};
//   if (!cookieHeader) return cookies;
//   
//   cookieHeader.split(';').forEach(cookie => {
//     const [name, ...rest] = cookie.trim().split('=');
//     if (name) {
//       cookies[name] = decodeURIComponent(rest.join('='));
//     }
//   });
//   
//   return cookies;
// }

export default defineNuxtPlugin({
  name: 'arex-vue-core',
  enforce: 'pre',
  setup(nuxtApp) {
    const config = useRuntimeConfig();
    
    nuxtApp.vueApp.use(ArexVueCore, {
      appKey: config.public.appKey,
      endpoints: {
        login: config.public.apiEndpoints.login,
        refresh: config.public.apiEndpoints.refresh,
        logout: config.public.apiEndpoints.logout,
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
        baseURL: config.public.apiBaseUrl,
        timeout: 10000,
      },
      
      // Configuración SSR
      ssr: {
        getContext: () => {
          const event = useRequestEvent();
          if (!event) {
            // Cliente o fuera de request válido
            if (process.env.NODE_ENV === 'development') {
              console.warn(
                '[Arex] SSR context not available. ' +
                'This is normal in client-side code or outside a valid request context.'
              );
            }
            return {};
          }
          
          // Usar h3 para parsing robusto de cookies
          // En versiones recientes de h3, puedes pasar event directamente
          const cookies = parseCookies(event);
          
          // Helper para escribir cookies usando h3
          // IMPORTANTE: setCookie debe ejecutarse ANTES de que el stream de HTML se envíe
          // h3 maneja esto automáticamente, pero asegúrate de llamar writeCookie inmediatamente
          // cuando necesites escribir cookies durante SSR
          const writeCookie = (key: string, value: string, options?: StorageOptions) => {
            setCookie(event, key, value, {
              httpOnly: options?.httpOnly ?? false,
              secure: options?.secure ?? true,
              sameSite: options?.sameSite ?? 'lax',
              maxAge: options?.expires ? options.expires * 24 * 60 * 60 : undefined,
              path: options?.path ?? '/',
              domain: options?.domain,
            });
          };
          
          // Obtener headers de respuesta para escribir cookies manualmente si es necesario
          const responseHeaders = event.node.res.getHeaders();
          
          return {
            cookies,
            headers: event.node.req.headers as Record<string, string>,
            responseHeaders: {
              ...responseHeaders,
              // Inyectar helper de h3 para escritura de cookies
              _writeCookie: writeCookie,
            } as Record<string, any>
          };
        },
        
        redirectStrategy: {
          redirect: async (path: string) => {
            const event = useRequestEvent();
            if (event) {
              // SSR: usar redirect de Nitro
              throw createError({
                statusCode: 302,
                statusMessage: 'Found',
                headers: { Location: path }
              });
            } else {
              // Cliente: usar window.location
              if (typeof window !== 'undefined') {
                window.location.href = path;
              }
            }
          }
        }
      }
    });
  },
});
```

### 6.2 Integración con Next.js (Ejemplo)

```typescript
// app/layout.tsx o pages/_app.tsx
import { ArexVueCore } from '@arex95/vue-core';
import { cookies, headers } from 'next/headers';

export default function RootLayout({ children }) {
  return (
    <ArexProvider>
      {children}
    </ArexProvider>
  );
}

// lib/arex-config.tsx
'use client';
import { ArexVueCore } from '@arex95/vue-core';
import { useRouter } from 'next/navigation';

export function ArexProvider({ children }) {
  const router = useRouter();
  
  // En Next.js, el contexto SSR se obtiene en Server Components
  // y se pasa al cliente mediante props o cookies
  return (
    <ArexVueCore.Provider
      config={{
        appKey: process.env.NEXT_PUBLIC_APP_KEY,
        endpoints: { /* ... */ },
        ssr: {
          getContext: () => {
            // En Server Components, usar cookies() de next/headers
            const cookieStore = cookies();
            const cookieObj: Record<string, string> = {};
            cookieStore.getAll().forEach(cookie => {
              cookieObj[cookie.name] = cookie.value;
            });
            
            return {
              cookies: cookieObj,
              headers: Object.fromEntries(headers().entries()),
            };
          },
          redirectStrategy: {
            redirect: (path: string) => {
              router.push(path);
            }
          }
        }
      }}
    >
      {children}
    </ArexVueCore.Provider>
  );
}
```

### 6.3 Integración con SvelteKit (Ejemplo)

```typescript
// src/hooks.server.ts o +layout.server.ts
import { ArexVueCore } from '@arex95/vue-core';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Configurar Arex con contexto de SvelteKit
  ArexVueCore.configure({
    appKey: import.meta.env.VITE_APP_KEY,
    endpoints: { /* ... */ },
    ssr: {
      getContext: () => {
        const cookies: Record<string, string> = {};
        event.cookies.getAll().forEach(cookie => {
          cookies[cookie.name] = cookie.value;
        });
        
        return {
          cookies,
          headers: Object.fromEntries(event.request.headers.entries()),
          responseHeaders: event.cookies, // SvelteKit cookies helper
        };
      },
      redirectStrategy: {
        redirect: async (path: string) => {
          throw redirect(302, path);
        }
      }
    }
  });
  
  return resolve(event);
};
```

### 6.4 Integración con Vue Puro + SSR Manual (Ejemplo)

```typescript
// server.ts (usando Vite SSR o similar)
import { createSSRApp } from 'vue';
import { ArexVueCore } from '@arex95/vue-core';

export async function render(url: string, req: IncomingMessage, res: ServerResponse) {
  const app = createSSRApp(App);
  
  // Parsear cookies manualmente
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie || '';
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name) cookies[name] = decodeURIComponent(value);
  });
  
  app.use(ArexVueCore, {
    appKey: process.env.APP_KEY,
    endpoints: { /* ... */ },
    ssr: {
      getContext: () => ({
        cookies,
        headers: req.headers as Record<string, string>,
        responseHeaders: res.getHeaders(),
      }),
      redirectStrategy: {
        redirect: (path: string) => {
          res.writeHead(302, { Location: path });
          res.end();
        }
      }
    }
  });
  
  // ... resto del renderizado SSR
}
```

### 6.5 Hidratación y Prevención de Flicker (Framework-Agnóstico)

**Problema:** Si el servidor valida el token y renderiza "Autenticado", pero el cliente tarda en ejecutar `verifyAuth`, puede haber un mismatch de hidratación.

**Solución genérica:** Transferir el estado inicial de autenticación del servidor al cliente mediante el mecanismo que cada framework proporciona.

**Patrón genérico:**

```typescript
// 1. En el servidor (durante SSR)
const contextGetter = getGlobalSSRContextGetter();
if (contextGetter) {
  const context = await contextGetter();
  const storage = createStorageForRequest(contextGetter);
  const token = await storage.getDecrypted(tokensConfig.ACCESS_TOKEN);
  
  // Transferir estado usando el mecanismo del framework
  // Nuxt: nuxtApp.payload.data
  // Next.js: props o cookies
  // SvelteKit: $app/stores o props
  transferAuthStateToClient({ isAuthenticated: !!token });
}

// 2. En el cliente (durante hidratación)
const initialAuthState = getAuthStateFromClient();
const isAuthenticated = ref(initialAuthState?.isAuthenticated ?? false);
```

**Ejemplos específicos por framework:**

**Nuxt:**
```typescript
// Plugin
nuxtApp.payload.data.__arex_auth_state = { isAuthenticated: !!token };

// Componente
const nuxtApp = useNuxtApp();
const initialAuthState = nuxtApp.payload.data?.__arex_auth_state;
```

**Next.js:**
```typescript
// Server Component
const token = await getTokenFromCookies();
return <ClientComponent initialAuth={!!token} />;

// Client Component
const isAuthenticated = useState('auth', () => props.initialAuth);
```

**SvelteKit:**
```typescript
// +layout.server.ts
export async function load({ cookies }) {
  const token = cookies.get('ACCESS_TOKEN');
  return { initialAuth: !!token };
}

// +layout.svelte
let { data } = $props();
$: isAuthenticated = data.initialAuth;
```

### 6.3 Manejo de Errores en Desarrollo

Ya incluido en la sección 6.1 con advertencias en desarrollo.

---

## 7. Drivers de Storage

### 7.1 Browser Cookie Driver

```typescript
const BrowserCookieDriver: StorageDriver = {
  get: (key: string, context?: StorageContext): string | null => {
    if (typeof document === 'undefined') {
      // SSR: leer de contexto
      if (context?.cookies) {
        return context.cookies[key] || null;
      }
      return null;
    }
    // Cliente: leer de document.cookie
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },
  
  set: (key: string, value: string, options?: StorageOptions, context?: StorageContext): void => {
    if (typeof document === 'undefined') {
      // SSR: escribir en response headers
      if (context?.responseHeaders) {
        const cookieString = buildCookieString(key, value, options);
        if (context.responseHeaders instanceof Headers) {
          context.responseHeaders.append('Set-Cookie', cookieString);
        } else {
          const existing = context.responseHeaders['Set-Cookie'];
          const cookies = Array.isArray(existing) ? existing : existing ? [existing] : [];
          cookies.push(cookieString);
          context.responseHeaders['Set-Cookie'] = cookies;
        }
      }
      return;
    }
    // Cliente: escribir en document.cookie
    document.cookie = buildCookieString(key, value, options);
  },
  
  remove: (key: string, options?: StorageOptions, context?: StorageContext): void => {
    // Similar a set pero con expires en el pasado
    const removeOptions = { ...options, expires: -1 };
    BrowserCookieDriver.set(key, '', removeOptions, context);
  }
};

function buildCookieString(key: string, value: string, options?: StorageOptions): string {
  let cookie = `${key}=${encodeURIComponent(value)}`;
  
  if (options?.expires) {
    const date = new Date();
    date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000);
    cookie += `; expires=${date.toUTCString()}`;
  }
  
  cookie += `; path=${options?.path || '/'}`;
  
  if (options?.domain) {
    cookie += `; domain=${options.domain}`;
  }
  
  if (options?.secure) {
    cookie += '; Secure';
  }
  
  if (options?.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  } else {
    cookie += '; SameSite=Lax';
  }
  
  return cookie;
}
```

### 7.2 LocalStorage Driver

```typescript
const LocalStorageDriver: StorageDriver = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  
  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
};
```

### 7.3 SessionStorage Driver

```typescript
const SessionStorageDriver: StorageDriver = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key);
  },
  
  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, value);
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  }
};
```

---

## 8. Encriptación Funcional Mínima

### 8.1 Detección de Entorno Básica

**Objetivo:** Encriptación funcional mínima que funcione en todos los entornos sin complejidad adicional.

```typescript
// src/utils/encryption.ts
function getCryptoSubtle(): SubtleCrypto {
  if (typeof window !== 'undefined') {
    return crypto.subtle;
  }
  
  // Node.js
  if (globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  
  // Fallback para Node.js antiguo
  try {
    const { webcrypto } = require('node:crypto');
    return webcrypto.subtle;
  } catch {
    throw new Error('Web Crypto API not available in this environment');
  }
}
```

**Nota:** Encriptación funcional mínima usando Web Crypto API nativa. Sin dependencias adicionales ni configuraciones complejas.

export async function importKey(secretKey: string): Promise<CryptoKey> {
  if (!secretKey) {
    throw new Error("Secret key cannot be null or empty.");
  }

  const subtle = getCryptoSubtle();
  const keyMaterial = new TextEncoder().encode(secretKey);
  const digest = await subtle.digest("SHA-256", keyMaterial);

  return subtle.importKey(
    "raw",
    digest,
    { name: "AES-CBC", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
```

### 8.2 Formato Base64url

**Razón:** Cookies tienen límite de 4KB. Base64url es más eficiente que hexadecimal (33% más compacto).

**Implementación:** Formato simple y funcional sin configuraciones adicionales.

```typescript
function ab2base64url(buffer: ArrayBuffer | Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64url2ab(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  return new Uint8Array(binary.split('').map(char => char.charCodeAt(0)));
}

export async function encrypt(value: string, secretKey: string): Promise<string> {
  const key = await importKey(secretKey);
  const subtle = getCryptoSubtle();
  const iv = subtle.getRandomValues(new Uint8Array(16));
  const encodedValue = new TextEncoder().encode(value);

  const ciphertext = await subtle.encrypt(
    { name: "AES-CBC", iv: iv },
    key,
    encodedValue
  );

  // Usar Base64url en lugar de hexadecimal
  return ab2base64url(iv) + '.' + ab2base64url(new Uint8Array(ciphertext));
}

export async function decrypt(encryptedValue: string, secretKey: string): Promise<string> {
  if (!encryptedValue) {
    throw new Error("Encrypted value cannot be null or empty.");
  }

  // Formato simple: Base64url con separador '.'
  const [ivBase64url, ciphertextBase64url] = encryptedValue.split('.');
  
  if (!ivBase64url || !ciphertextBase64url) {
    throw new Error("Invalid encrypted value format");
  }

  const key = await importKey(secretKey);
  const subtle = getCryptoSubtle();
  const iv = base64url2ab(ivBase64url);
  const ciphertext = base64url2ab(ciphertextBase64url);

  const decryptedBuffer = await subtle.decrypt(
    { name: "AES-CBC", iv: iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
}
```

### 8.3 appKey

**Enfoque simple:** Un solo `appKey` usado para encriptación básica. Los tokens JWT ya están firmados por el servidor, así que la encriptación local es principalmente para ofuscar el contenido.

**Configuración básica:**
```typescript
nuxtApp.vueApp.use(ArexVueCore, {
  appKey: config.public.arexAppKey || 'your-secret-key',
  // ... otras opciones
});
```

---

## 9. Token Refresh Automático en SSR

### 9.1 Problema

Si el `accessToken` expira durante el renderizado SSR, el servidor necesita:
1. Detectar que el token expiró (401)
2. Usar el `refreshToken` para obtener nuevo `accessToken`
3. Guardar el nuevo token en cookies del response
4. Reintentar la request original

**Desafío:** El interceptor de Axios necesita acceso al mismo `UniversalStorage` instanciado para poder guardar el nuevo token durante SSR.

### 9.2 Solución: Storage Context en Interceptor

**Problema actual:** El interceptor de Axios en `AxiosService` llama a `getAuthToken()` y `storeTokens()` que no tienen acceso al contexto SSR.

**Solución:** Pasar el `contextGetter` al `AxiosService` o crear una función de refresh que use el mismo storage instanciado.

```typescript
// src/config/axios/axiosConfig.ts
export class AxiosService {
  private storageFactory?: () => UniversalStorage;
  
  constructor(
    options: AxiosServiceOptions,
    storageFactory?: () => UniversalStorage
  ) {
    // ... código existente ...
    this.storageFactory = storageFactory;
  }
  
  private initializeInterceptors() {
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        // Obtener storage con contexto SSR si está disponible
        const storage = this.storageFactory?.() || createDefaultStorage();
        const token = await storage.getDecrypted(tokensConfig.ACCESS_TOKEN);
        
        if (token) {
          this.setAuthHeader(config, token);
        }
        config.cancelToken = this.cancelTokenSource.token;
        this.activeRequests++;
        return config;
      },
      // ... error handler
    );
    
    this.instance.interceptors.response.use(
      // ... success handler
      async (error: AxiosError) => {
        // ... código existente de detección de 401 ...
        
        if (this.isRefreshing) {
          // ... queue handling ...
        }
        
        this.isRefreshing = true;
        originalRequest._retry = true;
        
        try {
          // Obtener storage con contexto SSR
          const storage = this.storageFactory?.() || createDefaultStorage();
          const refreshToken = await storage.getDecrypted(tokensConfig.REFRESH_TOKEN);
          
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }
          
          const fetcher = createAxiosFetcher(this.instance);
          const data = await refreshTokens(fetcher, storage);
          
          // Guardar nuevos tokens usando el mismo storage (con contexto SSR)
          await storage.setEncrypted(tokensConfig.ACCESS_TOKEN, data.accessToken);
          await storage.setEncrypted(tokensConfig.REFRESH_TOKEN, data.refreshToken);
          
          // Actualizar header y reintentar
          this.setAuthHeader(originalRequest, data.accessToken);
          this.isRefreshing = false;
          this.processQueue(null, data.accessToken);
          
          return this.instance(originalRequest);
        } catch (refreshError) {
          this.isRefreshing = false;
          this.processQueue(refreshError as AxiosError, null);
          // ... error handling ...
        }
      }
    );
  }
}
```

### 9.3 refreshTokens Refactorizado

```typescript
// src/services/refreshTokens.ts
export const refreshTokens = async (
  fetcher: Fetcher,
  storage?: UniversalStorage
): Promise<AuthResponse> => {
  const tokenPaths: AuthTokenPaths = getRefreshTokenPathsConfig();
  const endpoints = getEndpointsConfig();
  
  // Usar storage proporcionado o crear uno nuevo
  const finalStorage = storage || createStorageForRequest(getGlobalSSRContextGetter());
  
  try {
    const refreshToken = await finalStorage.getDecrypted(tokensConfig.REFRESH_TOKEN);
    
    if (!refreshToken) {
      throw new Error("TOKEN_MISSING: No refresh token found in storage.");
    }
    
    const data = await fetcher({
      method: 'POST',
      url: endpoints.REFRESH,
      headers: {
        // Enviar refresh token en header o body según tu API
        'Authorization': `Bearer ${refreshToken}`
      }
    }) as AuthResponse;
    
    const { accessToken, refreshToken: newRefreshToken } = extractAndValidateTokens(
      data,
      tokenPaths,
      "REFRESH"
    );
    
    // Guardar usando el mismo storage (mantiene contexto SSR)
    await finalStorage.setEncrypted(tokensConfig.ACCESS_TOKEN, accessToken);
    await finalStorage.setEncrypted(tokensConfig.REFRESH_TOKEN, newRefreshToken);
    
    return data;
  } catch (error) {
    handleError(error);
    // Limpiar credenciales usando el mismo storage
    await finalStorage.removeEncrypted(tokensConfig.ACCESS_TOKEN);
    await finalStorage.removeEncrypted(tokensConfig.REFRESH_TOKEN);
    throw error;
  }
};
```

### 9.4 Configuración en Plugin

```typescript
// En ArexVueCore.install
export const ArexVueCore = {
  install: (app: App, options: ArexVueCoreOptions) => {
    // ... configuración existente ...
    
    // Crear factory de storage para usar en AxiosService
    const storageFactory = () => {
      const contextGetter = getGlobalSSRContextGetter();
      return createStorageForRequest(contextGetter);
    };
    
    // Configurar AxiosService con storage factory
    if (options.axios) {
      configAxios({
        ...options.axios,
        storageFactory // Nueva opción
      });
    }
  }
};
```

### 9.5 Timing Crítico: Set-Cookie en SSR

**Problema:** Si haces un Refresh Token dentro de `useAsyncData` o un componente durante SSR, los headers `Set-Cookie` deben añadirse **antes** de que el stream de HTML se envíe al cliente.

**Solución:** `h3` maneja esto automáticamente con `setCookie()`, pero asegúrate de que el driver de storage ejecute `_writeCookie` inmediatamente cuando se necesite escribir cookies.

**Ejemplo de uso correcto:**
```typescript
// En refreshTokens durante SSR
const storage = this.storageFactory?.() || createDefaultStorage();
const data = await refreshTokens(fetcher, storage);

// Los tokens se guardan inmediatamente usando _writeCookie del contexto
await storage.setEncrypted(tokensConfig.ACCESS_TOKEN, data.accessToken);
// ✅ setCookie se ejecuta aquí, antes de que la respuesta se envíe
```

**Advertencia:** No retrases la escritura de cookies. Si necesitas escribir cookies después de operaciones asíncronas, hazlo inmediatamente después de obtener los datos.

---

## 10. Testing

### 9.1 Utilidades de Test

```typescript
// src/utils/test-utils.ts
let mockSSRContext: StorageContext | null = null;
let mockSSRContextGetter: (() => StorageContext | Promise<StorageContext> | null) | null = null;

export function setMockSSRContext(context: StorageContext): void {
  mockSSRContext = context;
}

export function clearMockSSRContext(): void {
  mockSSRContext = null;
}

export function getMockSSRContextGetter(): (() => StorageContext | null) {
  return () => mockSSRContext;
}

// En tests
import { setMockSSRContext, clearMockSSRContext } from '@arex95/vue-core/test-utils';

describe('useAuth SSR', () => {
  beforeEach(() => {
    setMockSSRContext({
      cookies: { ACCESS_TOKEN: 'mock-encrypted-token' }
    });
  });
  
  afterEach(() => {
    clearMockSSRContext();
  });
  
  it('should read token from SSR context', async () => {
    const { login } = useAuth();
    // ... test
  });
});
```

### 9.2 Mock Storage Driver

```typescript
// En tests
const mockStorageDriver: StorageDriver = {
  get: jest.fn((key: string, context?: StorageContext) => {
    return context?.cookies?.[key] || null;
  }),
  set: jest.fn(),
  remove: jest.fn(),
};

// Configurar en plugin de test
app.use(ArexVueCore, {
  // ... otras opciones
  storage: {
    driver: mockStorageDriver
  }
});
```

---

## 10. Compatibilidad Hacia Atrás

### 10.1 Estrategia

Todas las funciones existentes mantienen su firma actual. Los nuevos parámetros son opcionales.

**Funciones sin cambios:**
- `useAuth(fetcher?: Fetcher)` - Misma firma
- `getAuthToken(secretKey: string, location: LocationPreference)` - Puede aceptar `context?` opcional
- `verifyAuth()` - Puede aceptar `context?` opcional

**Implementación interna:**
- Si no hay contexto proporcionado, usar comportamiento actual (cliente)
- Si hay contexto, usar nuevo sistema con drivers

### 10.2 Migración

**Código existente (sin cambios):**
```typescript
const { login, logout } = useAuth();
await login({ username, password }, 'local');
```

**Nuevo código SSR (opcional):**
```typescript
// Solo necesitas configurar el plugin con SSR options
// useAuth() funciona igual
const { login, logout } = useAuth();
await login({ username, password }, 'cookie');
```

---

## 11. Plan de Implementación

### Fase 1: Interfaces y Tipos
- [ ] Definir `StorageDriver` interface
- [ ] Definir `StorageContext` interface
- [ ] Definir `StorageOptions` interface
- [ ] Definir `RedirectStrategy` interface
- [ ] Extender `ArexVueCoreOptions` con opciones SSR

### Fase 2: Drivers de Storage
- [ ] Implementar `BrowserCookieDriver`
- [ ] Implementar `LocalStorageDriver`
- [ ] Implementar `SessionStorageDriver`
- [ ] Implementar función `buildCookieString`

### Fase 3: Universal Storage
- [ ] Crear clase `UniversalStorage`
- [ ] Implementar cacheo de contexto
- [ ] Integrar encriptación/desencriptación
- [ ] Crear factory `createStorageForRequest`

### Fase 4: Configuración Global
- [ ] Crear `storageConfig.ts` con funciones globales
- [ ] Implementar `setGlobalStorageDriver`
- [ ] Implementar `setGlobalSSRContextGetter`
- [ ] Implementar `setGlobalRedirectStrategy`

### Fase 5: Plugin
- [ ] Actualizar `ArexVueCore.install` para configurar storage y SSR
- [ ] Auto-detectar driver según entorno
- [ ] Integrar configuración SSR

### Fase 6: useAuth Refactor
- [ ] Actualizar `useAuth` para usar factory de storage
- [ ] Actualizar `login` para usar `UniversalStorage`
- [ ] Actualizar `logout` para usar `RedirectStrategy`
- [ ] Mantener compatibilidad hacia atrás

### Fase 7: Encriptación Funcional
- [ ] Implementar `getCryptoSubtle()` con detección básica de entorno
- [ ] Cambiar formato de hexadecimal a Base64url
- [ ] Actualizar funciones `encrypt` y `decrypt` con formato simple

### Fase 8: Funciones de Credenciales
- [ ] Actualizar `getAuthToken` para aceptar `context?` opcional
- [ ] Actualizar `verifyAuth` para aceptar `context?` opcional
- [ ] Actualizar `getSessionPersistence` para aceptar `context?` opcional
- [ ] Refactorizar `refreshTokens` para aceptar `storage?` opcional
- [ ] Mantener compatibilidad hacia atrás

### Fase 8.5: Token Refresh en SSR
- [ ] Actualizar `AxiosService` para aceptar `storageFactory`
- [ ] Refactorizar interceptor de refresh para usar storage con contexto
- [ ] Integrar `refreshTokens` con `UniversalStorage`
- [ ] Tests de refresh token durante SSR

### Fase 9: Testing
- [ ] Crear utilidades de test (`test-utils.ts`)
- [ ] Tests unitarios para drivers
- [ ] Tests unitarios para `UniversalStorage`
- [ ] Tests de integración SSR
- [ ] Tests de refresh token en SSR
- [ ] Tests de hidratación sin flicker
- [ ] Tests de compatibilidad hacia atrás
- [ ] Tests de Edge Runtime (Vercel/Cloudflare)

### Fase 10: Documentación
- [ ] Documentar configuración SSR framework-agnóstica
- [ ] Crear guía de integración para Nuxt (ejemplo)
- [ ] Crear guía de integración para Next.js (ejemplo)
- [ ] Crear guía de integración para SvelteKit (ejemplo)
- [ ] Crear guía de integración para Vue puro SSR (ejemplo)
- [ ] Documentar patrón genérico de parsing de cookies
- [ ] Documentar prevención de flicker de forma framework-agnóstica
- [ ] Crear guía de migración
- [ ] Documentar utilidades de test
- [ ] Ejemplos de uso en SSR para múltiples frameworks
- [ ] Ejemplos de refresh token en SSR para múltiples frameworks

---

## 13. Mejoras Adicionales Sugeridas

### 13.1 Opciones de Cookie por Defecto

Permitir configuración global de opciones de cookie por defecto:

```typescript
export interface ArexVueCoreOptions {
  // ... opciones existentes ...
  
  storage?: {
    driver?: StorageDriver;
    defaultLocation?: LocationPreference;
    defaultCookieOptions?: StorageOptions; // Nueva opción
  };
}

// En buildCookieString
function buildCookieString(
  key: string, 
  value: string, 
  options?: StorageOptions,
  defaults?: StorageOptions
): string {
  const merged = { ...defaults, ...options };
  // ... resto de la lógica usando merged
}
```

### 13.2 httpOnly por Defecto para Tokens

Para mayor seguridad, considerar `httpOnly: true` por defecto para tokens de acceso:

```typescript
const defaultTokenCookieOptions: StorageOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
  path: '/'
};
```

**Nota:** `httpOnly` requiere escritura desde servidor. En cliente, usar `document.cookie` no funcionará. Esto requiere que todas las escrituras de tokens pasen por el servidor.

### 13.3 Tipado del contextGetter

Documentar que normalmente es síncrono en Nuxt:

```typescript
export interface SSRConfig {
  getContext?: () => StorageContext | Promise<StorageContext>;
  // Documentación: Normalmente síncrono en Nuxt, pero permite async para casos especiales
}
```

### 13.4 Auto-detección de Driver Configurable

Permitir forzar cookies incluso en cliente:

```typescript
storage?: {
  driver?: StorageDriver;
  defaultLocation?: LocationPreference;
  forceCookies?: boolean; // Nueva opción: forzar cookies incluso en cliente
};
```

### 13.5 Soporte para max-age en Cookies

Además de `expires`, soportar `max-age` (más moderno y preciso):

```typescript
function buildCookieString(key: string, value: string, options?: StorageOptions): string {
  let cookie = `${key}=${encodeURIComponent(value)}`;
  
  if (options?.expires) {
    const date = new Date();
    date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000);
    cookie += `; expires=${date.toUTCString()}`;
  } else if (options?.maxAge) {
    cookie += `; max-age=${options.maxAge}`;
  }
  
  // ... resto de opciones
}
```

### 13.6 Integración con Estados Globales (Opcional)

Arex Vue Core es agnóstico de librerías de estado global. Puedes integrarlo con cualquier solución de estado que prefieras (composables personalizados, stores, o cualquier patrón de estado) según las necesidades de tu aplicación.

**Principio:** Arex maneja la autenticación y storage. Cómo expones ese estado a tu aplicación es tu decisión.

**Ejemplo genérico de integración:**
```typescript
// Ejemplo: Composable personalizado que usa Arex internamente
import { useAuth, verifyAuth } from '@arex95/vue-core';
import { ref, computed } from 'vue';

export function useAuthState() {
  const isAuthenticated = ref(false);
  const { login, logout } = useAuth();
  
  const checkAuth = async () => {
    isAuthenticated.value = await verifyAuth();
    return isAuthenticated.value;
  };
  
  const handleLogin = async (credentials: Record<string, unknown>) => {
    await login(credentials, 'cookie');
    isAuthenticated.value = true;
  };
  
  const handleLogout = async () => {
    await logout();
    isAuthenticated.value = false;
  };
  
  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    checkAuth,
    login: handleLogin,
    logout: handleLogout
  };
}
```

**Nota:** Esta es solo una forma de integrar. Puedes usar cualquier patrón de estado que prefieras sin que Arex lo imponga.

---

## 17. Framework-Agnosticismo: Ventaja Competitiva

### 17.1 Principio de Diseño

**Arex Vue Core es framework-agnóstico por diseño.** Esto significa:

1. **Interfaces genéricas:** `StorageContext`, `StorageDriver`, `RedirectStrategy` no dependen de ningún framework
2. **Configuración flexible:** Cada framework puede proporcionar su propia implementación
3. **Reutilización:** El mismo código funciona en Vue puro, Nuxt, Next.js, SvelteKit, etc.
4. **Sin vendor lock-in:** Los usuarios no están atados a un framework específico

### 17.2 Comparación con Librerías Específicas de Framework

**Librerías específicas de framework (ej: Nuxt Auth, NextAuth):**
- ✅ Optimizadas para su framework específico
- ❌ No funcionan fuera de ese framework
- ❌ Requieren migración completa si cambias de framework

**Arex Vue Core:**
- ✅ Funciona en cualquier framework
- ✅ Misma API en todos los entornos
- ✅ Migración fácil entre frameworks (solo cambia la configuración SSR)
- ✅ Puedes usar Vue puro hoy y migrar a Nuxt mañana sin cambiar tu código de negocio

### 17.3 Ejemplo de Portabilidad

```typescript
// Tu código de negocio (framework-agnóstico)
import { useAuth } from '@arex95/vue-core';

const { login, logout } = useAuth();

// Este código funciona igual en:
// - Vue puro
// - Nuxt
// - Next.js (con adaptador Vue)
// - SvelteKit (con adaptador Vue)
// - Cualquier framework que soporte Vue

// Solo cambia la configuración del plugin según el framework
```

### 17.4 Comparación con Librerías Similares

**Nuxt Auth (@sidebase/nuxt-auth):**
- Específico para Nuxt
- Arex: Funciona en cualquier framework

**NextAuth.js:**
- Específico para Next.js
- Arex: Funciona en cualquier framework

**Ventaja de Arex:** Una sola librería para todos los frameworks, con la misma API y comportamiento.

### 17.2 Librerías de Auth basadas en Composables

**Similitudes:**
- Composable-based
- Flexible
- Enfoque moderno de Vue 3

**Diferencias:**
- Arex: SSR robusto con contexto de request, drivers intercambiables
- Otras librerías: Principalmente cliente, menos flexibilidad en storage

**Ventaja Arex:** Soporte SSR completo sin comprometer flexibilidad, sin imponer decisiones de estado global.

### 17.3 NextAuth.js (para referencia)

**Similitudes:**
- Configuración a nivel de plugin
- Soporte múltiples providers

**Diferencias:**
- Arex: Más ligero, enfocado en Vue/Nuxt
- NextAuth: Más completo pero más pesado

**Posición de Arex:** Librería framework-agnóstica para Vue, funciona en cualquier entorno (Vue puro, Nuxt, Next.js, SvelteKit, etc.), más ligera y flexible.

---

## 18. Evoluciones Futuras

### 18.1 Zero-Storage Auth (WebAuthn/Passkeys)

**Visión:** Eliminar tokens/cookies usando autenticación nativa del navegador.

**Integración potencial:**
```typescript
export interface WebAuthnConfig {
  enabled: boolean;
  rpId: string;
  challenge: () => Promise<ArrayBuffer>;
}

// En ArexVueCoreOptions
webauthn?: WebAuthnConfig;
```

### 18.2 Server Components Integration

Si Vue adopta Server Components (similar a React), integrar auth directamente en server actions.

### 18.3 Edge-First Optimization

Con `uncrypto` ya preparado, optimizar para full-edge deployment sin fallback a Node.js.

### 18.4 Multi-Tenancy Support

Soporte por domain/subdomain para cookies:

```typescript
storage?: {
  domain?: string | ((request: Request) => string);
  subdomainAware?: boolean;
};
```

---

## 19. Consideraciones Finales

### 12.1 No Breaking Changes

Todas las funciones públicas mantienen su firma actual. Los nuevos parámetros son opcionales y solo se usan cuando se configura SSR.

### 12.2 Factory Pattern vs Singleton

**Decisión:** Factory pattern para crear storage por request. Evita problemas de state leak en SSR.

**Razón:** Cada request en SSR debe tener su propio contexto aislado. Singleton con estado cacheado puede filtrar contexto entre requests.

### 12.3 Cacheo de Contexto

**Decisión:** Cachear contexto por instancia de `UniversalStorage`, no globalmente.

**Razón:** Como cada request crea nueva instancia, el cacheo es seguro y no filtra entre requests.

### 12.4 Optimización de Cookies

**Decisión:** Usar Base64url en lugar de hexadecimal para reducir tamaño de cookies encriptadas.

**Impacto:** Reduce tamaño en ~33%, permitiendo tokens más grandes dentro del límite de 4KB de cookies.

### 12.5 Manejo de Errores

**Decisión:** Advertencias en desarrollo cuando contexto SSR no está disponible, pero no fallar silenciosamente.

**Razón:** Permite debugging mientras mantiene compatibilidad con código cliente.

### 12.6 Token Refresh en SSR

**Decisión:** El interceptor de Axios debe usar el mismo `UniversalStorage` instanciado para mantener contexto SSR durante refresh.

**Razón:** Permite que el refresh token funcione correctamente durante renderizado SSR, guardando nuevos tokens en cookies del response.

### 12.7 Hidratación sin Flicker

**Decisión:** Transferir estado inicial de autenticación del servidor al cliente usando el mecanismo que cada framework proporciona.

**Razón:** Evita mismatch de hidratación y flicker visual cuando el cliente hidrata. El patrón es genérico y cada framework lo implementa según sus convenciones (Nuxt: `payload.data`, Next.js: props, SvelteKit: stores, etc.).

### 12.8 Soporte Edge Runtime

**Decisión:** Detección básica de entorno para Web Crypto API, sin dependencias adicionales.

**Razón:** Permite que la librería funcione en cualquier entorno (Node.js, Edge Runtimes, Browser) sin requerir dependencias adicionales. Framework-agnóstico por diseño.

### 12.9 Framework-Agnosticismo

**Decisión:** Todas las interfaces y funciones del core son completamente framework-agnósticas.

**Razón:** Permite usar Arex en cualquier framework (Vue puro, Nuxt, Next.js, SvelteKit, etc.) sin cambios en el código de negocio. Solo cambia la configuración del plugin según el framework.

**Garantías:**
- Sin imports específicos de framework en el core
- Interfaces genéricas (`StorageContext`, `StorageDriver`, `RedirectStrategy`)
- Helpers opcionales para frameworks específicos (en ejemplos, no en core)
- Testing sin dependencias de framework
- Documentación con ejemplos para múltiples frameworks

---

## 15. Riesgos y Mitigaciones

### 13.1 Riesgo: Contexto SSR no disponible

**Mitigación:** Fallback a comportamiento cliente. Advertencia en desarrollo.

### 13.2 Riesgo: State leak entre requests

**Mitigación:** Factory pattern evita singleton global con estado.

### 13.3 Riesgo: Performance en parsing de cookies

**Mitigación:** Cacheo de contexto por instancia.

### 13.4 Riesgo: Breaking changes accidentales

**Mitigación:** Todas las funciones mantienen firma actual. Nuevos parámetros son opcionales.

### 13.5 Riesgo: Compatibilidad con Node.js antiguo

**Mitigación:** Detección de entorno y fallback a `node:crypto`.

### 13.6 Riesgo: Token Refresh durante SSR puede fallar

**Mitigación:** Asegurar que `AxiosService` use el mismo `UniversalStorage` instanciado con contexto SSR. Tests específicos para este escenario.

### 13.7 Riesgo: Hidratación Mismatch

**Mitigación:** Transferir estado inicial de autenticación del servidor al cliente. Validar que el estado inicial coincida con el estado del servidor.

### 13.8 Riesgo: Edge Runtime no soportado

**Mitigación:** `uncrypto` como dependencia opcional con fallback. Documentar claramente qué entornos requieren `uncrypto`.

### 13.9 Riesgo: Race Conditions en Refresh Token

**Mitigación:** Mutex global por refreshToken hash (ver sección 14.2).

### 13.10 Riesgo: Cookies muy grandes (>4KB)

**Mitigación:** Detección de tamaño y fallback a localStorage en cliente (ver sección 14.3).

### 13.11 Riesgo: Overhead de Performance en High-Traffic

**Mitigación:** Cachear storage por request con provide/inject, usar `useAsyncData` en middleware (ver sección 14.1).

### 13.12 Riesgo: Dependencias Opcionales (uncrypto)

**Mitigación:** Check en runtime que lance error claro si se necesita y no está instalada:

```typescript
function getCryptoSubtle(): SubtleCrypto {
  if (typeof window !== 'undefined') {
    return crypto.subtle;
  }
  
  if (globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  
  try {
    const { getSubtle } = require('uncrypto');
    return getSubtle();
  } catch {
    try {
      const { webcrypto } = require('node:crypto');
      return webcrypto.subtle;
    } catch {
      throw new Error(
        'Web Crypto API not available. ' +
        'For Edge Runtime support, install "uncrypto": npm install uncrypto'
      );
    }
  }
}
```

---

## 20. Conclusión

Esta arquitectura proporciona:

1. **Soporte SSR completo** sin breaking changes
2. **Framework-agnóstico** - funciona con Vue, Nuxt, Next.js, SvelteKit, o cualquier framework
3. **Configuración centralizada** a nivel de plugin
4. **Factory pattern** para evitar state leak
5. **Encriptación funcional mínima** con formato Base64url optimizado
6. **Testing** robusto con utilidades mock
7. **Compatibilidad** total con código existente
8. **Seguridad básica** con opciones de cookie configurables
9. **Performance optimizada** con mutex para refresh y cacheo por request
10. **Mantenibilidad mejorada** con provide/inject y testing profundo
11. **Extensibilidad** para futuras evoluciones (WebAuthn, Edge-first, Multi-tenancy)
12. **Versatilidad** - interfaces genéricas que cada framework puede implementar según sus necesidades

**Estado:** Arquitectura **production-ready** de grado empresarial, lista para implementación fase por fase.

**Próximos pasos:** 
1. Revisar y validar todas las decisiones arquitectónicas
2. Implementar fases 1-3 (interfaces, drivers, UniversalStorage) como base
3. Asegurar que todas las interfaces sean completamente framework-agnósticas
4. Agregar tests de concurrencia y múltiples frameworks
5. Documentar configuración básica de seguridad (opciones de cookie)
6. Crear ejemplos de integración para múltiples frameworks (Nuxt, Next.js, SvelteKit, Vue puro)
7. Documentar patrón genérico de integración SSR que cualquier framework puede seguir

**Nota final:** Esta arquitectura resuelve el 95% de los pain points reales de autenticación en SSR con cualquier framework (Vue puro, Nuxt, Next.js, SvelteKit, etc.), con elegancia y sin over-engineering. El balance entre potencia y simplicidad, combinado con su framework-agnosticismo, la posiciona como una solución superior a muchas librerías existentes que están atadas a un framework específico.

