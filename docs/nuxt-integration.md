# Integración con Nuxt

Esta guía explica cómo integrar `@arex95/vue-core` en proyectos Nuxt 3.

## Problema de Dependencias Circulares

En Nuxt, el orden de carga de plugins puede causar problemas si la autenticación intenta usar la instancia de Axios antes de que se configure. Para resolver esto, `@arex95/vue-core` implementa **lazy initialization**, permitiendo que la instancia de Axios se cree automáticamente cuando se necesite.

## Solución: Lazy Initialization

La biblioteca ahora crea automáticamente una instancia de Axios por defecto si no se ha configurado explícitamente. Esto elimina la necesidad de configurar el plugin con prioridad específica.

## Configuración en Nuxt

### Opción 1: Plugin con Prioridad (Recomendado)

Crea un plugin en `plugins/arex-vue-core.client.ts`:

```typescript
import { defineNuxtPlugin } from '#app';
import { ArexVueCore } from '@arex95/vue-core';

export default defineNuxtPlugin({
  name: 'arex-vue-core',
  enforce: 'pre', // Se ejecuta antes que otros plugins
  setup(nuxtApp) {
    nuxtApp.vueApp.use(ArexVueCore, {
      appKey: process.env.NUXT_APP_KEY || 'your-secret-key',
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
        baseURL: process.env.NUXT_PUBLIC_API_URL || 'https://api.example.com',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    });
  },
});
```

### Opción 2: Sin Prioridad Específica (También Funciona)

Gracias a la lazy initialization, también puedes usar prioridad normal:

```typescript
export default defineNuxtPlugin({
  name: 'arex-vue-core',
  // enforce: 'pre' no es estrictamente necesario
  setup(nuxtApp) {
    // ... misma configuración
  },
});
```

## Uso en Componentes

Una vez configurado, puedes usar los modelos directamente:

```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { User, UserData } from '@/models/User';

const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: () => User.getAll<UserData[]>(),
});
</script>
```

## Autenticación

El composable `useAuth` ahora funciona incluso si se llama antes de que el plugin se configure completamente:

```vue
<script setup lang="ts">
import { useAuth } from '@arex95/vue-core';

const { login, logout } = useAuth();

const handleLogin = async () => {
  await login(
    { email: 'user@example.com', password: 'password' },
    'local'
  );
};
</script>
```

## Notas Importantes

1. **Lazy Initialization**: La instancia de Axios se crea automáticamente cuando se necesita, incluso si `configAxios()` no se ha llamado aún.

2. **Valores por Defecto**: Si no se configura explícitamente, se usa una instancia con valores por defecto:
   - `baseURL: ''`
   - `timeout: 30000`
   - `withCredentials: false`

3. **Configuración Explícita**: Siempre es recomendable configurar explícitamente con `configAxios()` en el plugin para tener control total sobre la configuración.

4. **SSR**: Asegúrate de usar `.client.ts` para plugins que solo deben ejecutarse en el cliente, o maneja SSR apropiadamente.

## Ejemplo Completo

```typescript
// plugins/arex-vue-core.client.ts
import { defineNuxtPlugin } from '#app';
import { ArexVueCore } from '@arex95/vue-core';

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
    });
  },
});
```

## Troubleshooting

**Error: "Axios instance not configured"**
- Este error ya no debería aparecer gracias a la lazy initialization
- Si aún aparece, verifica que el plugin se esté ejecutando

**Problemas de orden de carga**
- Usa `enforce: 'pre'` en el plugin para asegurar que se cargue primero
- O confía en la lazy initialization que maneja esto automáticamente

