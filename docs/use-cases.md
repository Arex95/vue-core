# Casos de Uso: Arex Vue Core SSR

Este documento ejemplifica los diferentes casos de uso posibles con Arex Vue Core, desde aplicaciones cliente simples hasta aplicaciones SSR complejas en múltiples frameworks.

## Tabla de Contenidos

1. [Caso de Uso 1: Aplicación Cliente Simple](#caso-1-aplicación-cliente-simple)
2. [Caso de Uso 2: Nuxt 3 con SSR Completo](#caso-2-nuxt-3-con-ssr-completo)
3. [Caso de Uso 3: Vue Puro con SSR Manual](#caso-3-vue-puro-con-ssr-manual)
4. [Caso de Uso 4: SvelteKit con Vue](#caso-4-sveltekit-con-vue)
5. [Caso de Uso 5: Aplicación Híbrida (SSR + Cliente)](#caso-5-aplicación-híbrida)
6. [Caso de Uso 6: Refresh Token Automático en SSR](#caso-6-refresh-token-automático-en-ssr)
7. [Caso de Uso 7: Middleware de Autenticación](#caso-7-middleware-de-autenticación)
8. [Caso de Uso 8: Multi-Tenancy con Cookies por Dominio](#caso-8-multi-tenancy)
9. [Caso de Uso 9: Custom Storage Driver](#caso-9-custom-storage-driver)
10. [Caso de Uso 10: Verificación de Auth en Server Components](#caso-10-verificación-en-server-components)

---

## Caso 1: Aplicación Cliente Simple

**Escenario:** Aplicación Vue 3 SPA sin SSR, usando localStorage para tokens.

### Configuración

```typescript
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { ArexVueCore } from '@arex95/vue-core';

const app = createApp(App);

app.use(ArexVueCore, {
  appKey: import.meta.env.VITE_APP_KEY || 'dev-secret-key',
  endpoints: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
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
  // No se configura SSR - funciona solo en cliente
});

app.mount('#app');
```

### Uso en Componente

```vue
<template>
  <div>
    <button v-if="!isAuthenticated" @click="handleLogin">Login</button>
    <button v-else @click="handleLogout">Logout</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth, verifyAuth } from '@arex95/vue-core';

const { login, logout } = useAuth();
const isAuthenticated = ref(false);

const handleLogin = async () => {
  try {
    await login(
      { username: 'user', password: 'pass' },
      'local' // Usa localStorage
    );
    isAuthenticated.value = true;
  } catch (error) {
    console.error('Login failed:', error);
  }
};

const handleLogout = async () => {
  await logout();
  isAuthenticated.value = false;
};

onMounted(async () => {
  isAuthenticated.value = await verifyAuth();
});
</script>
```

**Características:**
- ✅ Funciona sin configuración SSR
- ✅ Usa localStorage por defecto
- ✅ Refresh automático de tokens
- ✅ Compatible con código existente

---

## Caso 2: Nuxt 3 con SSR Completo

**Escenario:** Aplicación Nuxt 3 con SSR completo, usando cookies para tokens y redirección automática.

### Configuración del Plugin

```typescript
// plugins/arex-vue-core.ts
import { defineNuxtPlugin } from '#app';
import { ArexVueCore } from '@arex95/vue-core';
import { parseCookies, setCookie } from 'h3';

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
      
      // Configuración SSR específica de Nuxt
      ssr: {
        getContext: () => {
          const event = useRequestEvent();
          if (!event) {
            return {};
          }
          
          const cookies = parseCookies(event);
          
          const writeCookie = (key: string, value: string, options?: any) => {
            setCookie(event, key, value, {
              httpOnly: options?.httpOnly ?? false,
              secure: options?.secure ?? true,
              sameSite: options?.sameSite ?? 'lax',
              maxAge: options?.expires ? options.expires * 24 * 60 * 60 : undefined,
              path: options?.path ?? '/',
              domain: options?.domain,
            });
          };
          
          return {
            cookies,
            headers: event.node.req.headers as Record<string, string>,
            responseHeaders: {
              _writeCookie: writeCookie,
            }
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
              // Cliente: usar navegación de Nuxt
              await navigateTo(path);
            }
          }
        }
      }
    });
    
    // Transferir estado inicial de auth al cliente para evitar flicker
    const event = useRequestEvent();
    if (event) {
      const contextGetter = getGlobalSSRContextGetter();
      if (contextGetter) {
        const context = await contextGetter();
        const storage = createStorageForRequest(contextGetter);
        const token = await storage.getDecrypted('ACCESS_TOKEN');
        
        nuxtApp.payload.data = nuxtApp.payload.data || {};
        nuxtApp.payload.data.__arex_auth_state = {
          isAuthenticated: !!token,
          timestamp: Date.now()
        };
      }
    }
  },
});
```

### Uso en Página

```vue
<!-- pages/login.vue -->
<template>
  <div>
    <form @submit.prevent="handleLogin">
      <input v-model="username" placeholder="Username" />
      <input v-model="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@arex95/vue-core';

const { login } = useAuth();
const username = ref('');
const password = ref('');

const handleLogin = async () => {
  try {
    await login(
      { username: username.value, password: password.value },
      'cookie' // Usa cookies para SSR
    );
    await navigateTo('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
</script>
```

### Middleware de Protección

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const event = useRequestEvent();
  if (!event) return; // Cliente
  
  const contextGetter = getGlobalSSRContextGetter();
  if (!contextGetter) return;
  
  const storage = createStorageForRequest(contextGetter);
  const token = await storage.getDecrypted('ACCESS_TOKEN');
  
  if (!token && to.meta.requiresAuth) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }
});
```

**Características:**
- ✅ SSR completo con cookies
- ✅ Redirección automática en SSR y cliente
- ✅ Prevención de flicker con estado inicial
- ✅ Middleware de protección de rutas

---

## Caso 3: Vue Puro con SSR Manual

**Escenario:** Aplicación Vue 3 con SSR manual usando Vite SSR o similar, sin framework específico.

### Configuración del Servidor

```typescript
// server.ts (usando Vite SSR o similar)
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { ArexVueCore } from '@arex95/vue-core';
import type { IncomingMessage, ServerResponse } from 'http';

export async function render(url: string, req: IncomingMessage, res: ServerResponse) {
  const app = createSSRApp(App);
  
  // Parsear cookies manualmente del request
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie || '';
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  
  // Configurar Arex con contexto SSR manual
  app.use(ArexVueCore, {
    appKey: process.env.APP_KEY || 'dev-key',
    endpoints: {
      login: '/api/auth/login',
      refresh: '/api/auth/refresh',
      logout: '/api/auth/logout',
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
      baseURL: process.env.API_URL || 'https://api.example.com',
      timeout: 10000,
    },
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
  
  // Renderizar aplicación
  const html = await renderToString(app);
  return html;
}
```

### Helper para Escribir Cookies

```typescript
// utils/cookieHelper.ts
export function writeCookieToResponse(
  res: ServerResponse,
  key: string,
  value: string,
  options?: {
    expires?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    httpOnly?: boolean;
  }
) {
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
  }
  
  if (options?.httpOnly) {
    cookie += '; HttpOnly';
  }
  
  res.setHeader('Set-Cookie', cookie);
}
```

### Uso en Componente

```vue
<template>
  <div>
    <button v-if="!isAuthenticated" @click="handleLogin">Login</button>
    <div v-else>Welcome!</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth, verifyAuth } from '@arex95/vue-core';

const { login, logout } = useAuth();
const isAuthenticated = ref(false);

const handleLogin = async () => {
  try {
    await login(
      { username: 'user', password: 'pass' },
      'cookie' // Usa cookies para SSR
    );
    isAuthenticated.value = true;
  } catch (error) {
    console.error('Login failed:', error);
  }
};

onMounted(async () => {
  isAuthenticated.value = await verifyAuth();
});
</script>
```

**Características:**
- ✅ SSR manual sin framework específico
- ✅ Control total sobre el proceso SSR
- ✅ Parsing manual de cookies
- ✅ Escritura manual de cookies en response

---

## Caso 4: SvelteKit con Vue

**Escenario:** Aplicación SvelteKit usando Vue, con hooks de servidor.

### Configuración en Hooks

```typescript
// src/hooks.server.ts
import { ArexVueCore } from '@arex95/vue-core';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Configurar Arex con contexto de SvelteKit
  ArexVueCore.configure({
    appKey: import.meta.env.VITE_APP_KEY,
    endpoints: {
      login: '/api/auth/login',
      refresh: '/api/auth/refresh',
      logout: '/api/auth/logout',
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
      baseURL: import.meta.env.VITE_API_URL,
      timeout: 10000,
    },
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

### Uso en Layout

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { useAuth, verifyAuth } from '@arex95/vue-core';
  
  const { login, logout } = useAuth();
  let isAuthenticated = $state(false);
  
  onMount(async () => {
    isAuthenticated = await verifyAuth();
  });
  
  const handleLogin = async () => {
    await login(
      { username: 'user', password: 'pass' },
      'cookie'
    );
    isAuthenticated = true;
  };
</script>

<div>
  {#if isAuthenticated}
    <button on:click={logout}>Logout</button>
  {:else}
    <button on:click={handleLogin}>Login</button>
  {/if}
</div>
```

**Características:**
- ✅ Integración con hooks de SvelteKit
- ✅ Manejo de cookies nativo de SvelteKit
- ✅ Redirección con redirect de SvelteKit

---

## Caso 5: Aplicación Híbrida

**Escenario:** Aplicación que funciona tanto en cliente como en SSR, detectando automáticamente el entorno.

### Configuración Adaptativa

```typescript
// config/arex.ts
import { ArexVueCoreOptions } from '@arex95/vue-core';
import type { StorageContext } from '@arex95/vue-core';

export function createArexConfig(): ArexVueCoreOptions {
  const isSSR = typeof window === 'undefined';
  
  const baseConfig = {
    appKey: process.env.APP_KEY || 'dev-key',
    endpoints: {
      login: '/api/auth/login',
      refresh: '/api/auth/refresh',
      logout: '/api/auth/logout',
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
      baseURL: process.env.API_URL || 'https://api.example.com',
      timeout: 10000,
    },
  };
  
  // Solo agregar SSR si estamos en servidor o si el framework lo requiere
  if (isSSR || process.env.ENABLE_SSR === 'true') {
    return {
      ...baseConfig,
      ssr: {
        getContext: () => {
          // Implementación específica del framework
          // Este ejemplo es genérico
          if (typeof window === 'undefined') {
            // SSR: obtener contexto del request
            return {
              cookies: parseCookiesFromRequest(),
              headers: getRequestHeaders(),
              responseHeaders: getResponseHeaders(),
            };
          }
          return {};
        },
        redirectStrategy: {
          redirect: (path: string) => {
            if (typeof window !== 'undefined') {
              window.location.href = path;
            }
            // En SSR, cada framework maneja esto diferente
          }
        }
      }
    };
  }
  
  return baseConfig;
}
```

**Características:**
- ✅ Detecta automáticamente el entorno
- ✅ Configura SSR solo cuando es necesario
- ✅ Funciona en ambos modos sin cambios en código

---

## Caso 6: Refresh Token Automático en SSR

**Escenario:** Refresh automático de tokens durante SSR cuando expiran, sin perder el contexto del request.

### Configuración con Storage Factory

```typescript
// plugins/arex-vue-core.ts (Nuxt)
export default defineNuxtPlugin({
  setup(nuxtApp) {
    // ... configuración base ...
    
    // El storageFactory se crea automáticamente en el plugin
    // y se pasa a AxiosService para refresh automático
    nuxtApp.vueApp.use(ArexVueCore, {
      // ... otras opciones ...
      ssr: {
        getContext: () => {
          const event = useRequestEvent();
          if (!event) return {};
          
          return {
            cookies: parseCookies(event),
            headers: event.node.req.headers,
            responseHeaders: {
              _writeCookie: (key, value, options) => {
                setCookie(event, key, value, options);
              }
            }
          };
        }
      }
    });
  }
});
```

### Comportamiento Automático

```typescript
// Cuando AxiosService detecta un 401:
// 1. Usa storageFactory() para crear UniversalStorage con contexto SSR
// 2. Llama a refreshTokens con el storage
// 3. Los nuevos tokens se guardan en cookies del response
// 4. El request original se reintenta con el nuevo token

// Todo esto sucede automáticamente sin código adicional
```

**Características:**
- ✅ Refresh automático durante SSR
- ✅ Mantiene contexto del request
- ✅ Guarda tokens en cookies del response
- ✅ Sin código adicional requerido

---

## Caso 7: Middleware de Autenticación

**Escenario:** Proteger rutas en diferentes frameworks usando middleware.

### Nuxt Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const event = useRequestEvent();
  if (!event) {
    // Cliente: verificar con verifyAuth normal
    const isAuth = await verifyAuth();
    if (!isAuth && to.meta.requiresAuth) {
      return navigateTo('/login');
    }
    return;
  }
  
  // SSR: verificar con contexto
  const contextGetter = getGlobalSSRContextGetter();
  if (!contextGetter) return;
  
  const storage = createStorageForRequest(contextGetter);
  const token = await storage.getDecrypted('ACCESS_TOKEN');
  
  if (!token && to.meta.requiresAuth) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    });
  }
});
```

### Uso en Rutas

```typescript
// pages/dashboard.vue
definePageMeta({
  requiresAuth: true
});
```

### Next.js Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@arex95/vue-core';

export function middleware(request: NextRequest) {
  const cookies = request.cookies;
  const context = {
    cookies: Object.fromEntries(
      cookies.getAll().map(c => [c.name, c.value])
    ),
  };
  
  // Verificar auth de forma síncrona (simplificado)
  // En producción, usaría verifyAuth de forma asíncrona
  const token = cookies.get('ACCESS_TOKEN');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

**Características:**
- ✅ Protección de rutas en SSR
- ✅ Redirección automática
- ✅ Framework-agnóstico

---

## Caso 8: Multi-Tenancy

**Escenario:** Aplicación multi-tenant donde cada tenant tiene su propio dominio y cookies.

### Configuración con Dominio Dinámico

```typescript
// plugins/arex-vue-core.ts
export default defineNuxtPlugin({
  setup(nuxtApp) {
    nuxtApp.vueApp.use(ArexVueCore, {
      // ... otras opciones ...
      storage: {
        defaultCookieOptions: {
          domain: () => {
            // Determinar dominio según el tenant
            const hostname = useRequestHeaders()['host'] || '';
            return hostname.includes('tenant1') ? '.tenant1.example.com' : '.example.com';
          },
          path: '/',
          secure: true,
          sameSite: 'Lax',
        }
      },
      ssr: {
        getContext: () => {
          const event = useRequestEvent();
          if (!event) return {};
          
          const hostname = event.node.req.headers.host || '';
          const domain = hostname.includes('tenant1') 
            ? '.tenant1.example.com' 
            : '.example.com';
          
          return {
            cookies: parseCookies(event),
            headers: event.node.req.headers,
            responseHeaders: {
              _writeCookie: (key, value, options) => {
                setCookie(event, key, value, {
                  ...options,
                  domain: domain,
                });
              }
            }
          };
        }
      }
    });
  }
});
```

**Características:**
- ✅ Cookies por dominio/tenant
- ✅ Aislamiento de datos entre tenants
- ✅ Configuración dinámica según request

---

## Caso 9: Custom Storage Driver

**Escenario:** Usar un storage driver personalizado (ej: IndexedDB, Redis en servidor, etc.).

### Implementación de Custom Driver

```typescript
// utils/customIndexedDBDriver.ts
import { StorageDriver, StorageContext, StorageOptions } from '@arex95/vue-core';

export const IndexedDBDriver: StorageDriver = {
  get: async (key: string, context?: StorageContext): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('arex-storage', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['tokens'], 'readonly');
        const store = transaction.objectStore('tokens');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result?.value || null);
        };
        
        getRequest.onerror = () => reject(getRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  },
  
  set: async (key: string, value: string, options?: StorageOptions, context?: StorageContext): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('arex-storage', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['tokens'], 'readwrite');
        const store = transaction.objectStore('tokens');
        const putRequest = store.put({ key, value });
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  },
  
  remove: async (key: string, options?: StorageOptions, context?: StorageContext): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('arex-storage', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['tokens'], 'readwrite');
        const store = transaction.objectStore('tokens');
        const deleteRequest = store.delete(key);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  },
};
```

### Uso del Custom Driver

```typescript
// main.ts
import { IndexedDBDriver } from './utils/customIndexedDBDriver';

app.use(ArexVueCore, {
  // ... otras opciones ...
  storage: {
    driver: IndexedDBDriver, // Usar driver personalizado
  },
});
```

**Características:**
- ✅ Flexibilidad total en storage
- ✅ Puede usar cualquier backend
- ✅ Mantiene la misma interfaz

---

## Caso 10: Verificación en Server Components

**Escenario:** Verificar autenticación en Server Components antes de renderizar.

### Nuxt Server Component

```vue
<!-- components/ProtectedContent.vue -->
<template>
  <div v-if="isAuthenticated">
    <slot />
  </div>
  <div v-else>
    <p>Please log in to view this content.</p>
  </div>
</template>

<script setup lang="ts">
import { verifyAuth } from '@arex95/vue-core';
import { getGlobalSSRContextGetter } from '@arex95/vue-core';
import { createStorageForRequest } from '@arex95/vue-core';

const event = useRequestEvent();
let isAuthenticated = false;

if (event) {
  // SSR: verificar con contexto
  const contextGetter = getGlobalSSRContextGetter();
  if (contextGetter) {
    const storage = createStorageForRequest(contextGetter);
    const token = await storage.getDecrypted('ACCESS_TOKEN');
    isAuthenticated = !!token;
  }
} else {
  // Cliente: verificar normalmente
  isAuthenticated = await verifyAuth();
}
</script>
```

### Vue SSR Manual - Verificación en Servidor

```typescript
// server/routes/protected.ts
import { verifyAuth } from '@arex95/vue-core';
import { getGlobalSSRContextGetter } from '@arex95/vue-core';
import { createStorageForRequest } from '@arex95/vue-core';
import type { IncomingMessage, ServerResponse } from 'http';

export async function handleProtectedRoute(
  req: IncomingMessage,
  res: ServerResponse
) {
  // Parsear cookies
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie || '';
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name) cookies[name] = decodeURIComponent(value);
  });
  
  // Crear contexto y verificar
  const context = {
    cookies,
    headers: req.headers as Record<string, string>,
  };
  
  const contextGetter = () => Promise.resolve(context);
  const storage = createStorageForRequest(contextGetter);
  const token = await storage.getDecrypted('ACCESS_TOKEN');
  
  if (!token) {
    res.writeHead(401, { 'Content-Type': 'text/html' });
    res.end('<div>Unauthorized</div>');
    return;
  }
  
  // Renderizar contenido protegido
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<div>Protected Content</div>');
}
```

**Características:**
- ✅ Verificación en servidor antes de renderizar
- ✅ Evita renderizar contenido protegido
- ✅ Mejor SEO y seguridad

---

## Casos de Uso Adicionales

### Caso 11: Refresh Token con Mutex

**Escenario:** Prevenir múltiples refreshes concurrentes del mismo token.

```typescript
// Ya implementado automáticamente en AxiosService
// El flag isRefreshing previene múltiples refreshes simultáneos
// Los requests en cola esperan el resultado del refresh
```

### Caso 12: Logout con Limpieza Completa

**Escenario:** Limpiar todos los tokens y redirigir correctamente.

```typescript
const { logout } = useAuth();

// Logout limpia automáticamente:
// 1. Tokens de storage (usando UniversalStorage)
// 2. Redirige usando RedirectStrategy
// 3. Funciona en SSR y cliente
await logout();
```

### Caso 13: Verificación Periódica

**Escenario:** Verificar autenticación periódicamente en cliente.

```typescript
import { verifyAuth } from '@arex95/vue-core';
import { onMounted, onUnmounted } from 'vue';

let intervalId: number | null = null;

onMounted(() => {
  intervalId = setInterval(async () => {
    const isAuth = await verifyAuth();
    if (!isAuth) {
      // Redirigir a login
      window.location.href = '/login';
    }
  }, 60000); // Cada minuto
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
```

---

## Resumen de Características por Caso

| Caso | SSR | Cliente | Cookies | localStorage | Framework |
|------|-----|---------|---------|--------------|-----------|
| 1. Cliente Simple | ❌ | ✅ | ❌ | ✅ | Vue puro |
| 2. Nuxt 3 | ✅ | ✅ | ✅ | ✅ | Nuxt |
| 3. Vue SSR Manual | ✅ | ✅ | ✅ | ✅ | Vue puro |
| 4. SvelteKit | ✅ | ✅ | ✅ | ❌ | SvelteKit |
| 5. Híbrida | ✅ | ✅ | ✅ | ✅ | Cualquiera |
| 6. Refresh Auto | ✅ | ✅ | ✅ | ✅ | Cualquiera |
| 7. Middleware | ✅ | ✅ | ✅ | ✅ | Cualquiera |
| 8. Multi-Tenancy | ✅ | ✅ | ✅ | ❌ | Cualquiera |
| 9. Custom Driver | ✅ | ✅ | ✅ | ❌ | Cualquiera |
| 10. Server Components | ✅ | ✅ | ✅ | ❌ | Nuxt |

---

## Mejores Prácticas

1. **Usa cookies en SSR**: Para aplicaciones SSR, siempre usa `'cookie'` como location preference
2. **Configura contexto SSR**: Asegúrate de proporcionar `getContext` correctamente
3. **Maneja redirecciones**: Configura `redirectStrategy` según tu framework
4. **Evita flicker**: Transfiere estado inicial de auth del servidor al cliente
5. **Usa middleware**: Protege rutas en el servidor cuando sea posible
6. **Mantén compatibilidad**: El código cliente funciona sin cambios

---

## Conclusión

Arex Vue Core es completamente framework-agnóstico y puede adaptarse a cualquier escenario de uso, desde aplicaciones cliente simples hasta aplicaciones SSR complejas con múltiples frameworks. La configuración SSR es opcional y no rompe código existente.

