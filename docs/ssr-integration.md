# Integración SSR Framework-Agnóstica

Arex Vue Core es completamente **framework-agnóstico** y funciona en cualquier framework que soporte Vue (Vue puro, Nuxt, Next.js, SvelteKit, etc.).

## Patrón Genérico de Integración

El patrón de integración SSR sigue estos pasos:

1. **Obtener contexto del request** (cada framework tiene su forma)
2. **Configurar estrategia de redirección** (cada framework tiene su forma)
3. **Configurar Arex con estas funciones genéricas**

```typescript
app.use(ArexVueCore, {
  // ... otras opciones ...
  ssr: {
    getContext: () => {
      // Framework-specific: obtener cookies y headers del request
      return {
        cookies: parseCookiesFromRequest(),
        headers: getRequestHeaders(),
        responseHeaders: getResponseHeaders(),
      };
    },
    redirectStrategy: {
      redirect: (path: string) => {
        // Framework-specific: redirigir según el framework
      }
    }
  }
});
```

## Ejemplos por Framework

### Nuxt 3

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
      
      // Configuración SSR
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
              throw createError({
                statusCode: 302,
                statusMessage: 'Found',
                headers: { Location: path }
              });
            } else {
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

### Next.js (con Vue)

```typescript
// lib/arex-config.tsx
'use client';
import { ArexVueCore } from '@arex95/vue-core';
import { useRouter } from 'next/navigation';

export function ArexProvider({ children, initialContext }) {
  const router = useRouter();
  
  return (
    <ArexVueCore.Provider
      config={{
        appKey: process.env.NEXT_PUBLIC_APP_KEY,
        endpoints: { /* ... */ },
        ssr: {
          getContext: () => {
            // En Server Components, usar cookies() de next/headers
            return initialContext || {
              cookies: {},
              headers: {},
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

### SvelteKit

```typescript
// src/hooks.server.ts
import { ArexVueCore } from '@arex95/vue-core';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
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
          responseHeaders: event.cookies,
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

### Vue Puro + SSR Manual

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

## Configuración de Contexto SSR

El contexto SSR debe proporcionar:

- `cookies`: Objeto con cookies parseadas del request
- `headers`: Headers del request
- `responseHeaders`: Headers de respuesta (para escribir cookies en SSR)
  - Puede incluir un helper `_writeCookie` si el framework lo requiere

## Configuración de Redirect Strategy

La estrategia de redirección debe manejar:

- **SSR**: Redirigir usando el método del framework (throw error, redirect helper, etc.)
- **Cliente**: Redirigir usando `window.location` o el router del framework

## Hidratación sin Flicker

Para evitar flicker durante la hidratación, transfiere el estado inicial de autenticación del servidor al cliente usando el mecanismo que cada framework proporciona:

- **Nuxt**: `nuxtApp.payload.data.__arex_auth_state`
- **Next.js**: Props o cookies
- **SvelteKit**: Stores o props
- **Vue puro**: Props o estado global

## Notas Importantes

1. **Framework-agnóstico**: El core no depende de ningún framework específico
2. **Compatibilidad**: Todas las funciones mantienen su firma actual
3. **Opcional**: La configuración SSR es completamente opcional
4. **Validación práctica**: Se recomienda probar en proyectos reales

