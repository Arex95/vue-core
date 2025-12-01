# Instalación y Configuración

Esta guía te ayudará a instalar y configurar `@arex95/vue-core` en tu proyecto Vue.js.

## Requisitos Previos

- Vue 3.0.0 o superior
- Node.js 16.0.0 o superior
- npm, yarn, o pnpm

## Instalación

### Usando npm

```bash
npm install @arex95/vue-core
```

### Usando yarn

```bash
yarn add @arex95/vue-core
```

### Usando pnpm

```bash
pnpm add @arex95/vue-core
```

## Dependencias Peer

La biblioteca requiere las siguientes dependencias peer que debes instalar según tus necesidades:

**Dependencias requeridas:**
```bash
npm install vue@^3.0.0 vue-router@^4.5.0 @vueuse/core@^12.8.2 jwt-decode@^4.0.0 uuid@^11.1.0
```

**Dependencias opcionales (solo instala las que necesites):**

Si usas Axios:
```bash
npm install axios@^1.6.0
```

Si usas ofetch:
```bash
npm install ofetch@^1.0.0
```

Si usas TanStack Vue Query para queries reactivas:
```bash
npm install @tanstack/vue-query@^5.0.0
```

**Nota:** El proyecto es agnóstico del sistema de fetching. Puedes usar Axios, ofetch, fetch API, o cualquier otro sistema.

## Configuración Inicial

### 1. Configurar el Plugin

En tu archivo `main.ts` (o `main.js`), importa y configura el plugin:

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import { ArexVueCore } from '@arex95/vue-core';

const app = createApp(App);

app.use(ArexVueCore, {
  // Tu configuración aquí
});

app.mount('#app');
```

### 2. Opciones de Configuración

El plugin acepta un objeto de configuración con las siguientes propiedades:

#### `appKey` (requerido)
Clave secreta para encriptar datos sensibles en el almacenamiento local.

```typescript
appKey: 'your-secret-key-here'
```

#### `endpoints` (requerido)
Configuración de los endpoints de autenticación.

```typescript
endpoints: {
  login: '/api/auth/login',      // Endpoint para login
  refresh: '/api/auth/refresh',   // Endpoint para refresh token
  logout: '/api/auth/logout',     // Endpoint para logout
}
```

#### `tokenKeys` (requerido)
Claves para almacenar los tokens en el storage.

```typescript
tokenKeys: {
  accessToken: 'ACCESS_TOKEN',    // Clave para el access token
  refreshToken: 'REFRESH_TOKEN',  // Clave para el refresh token
}
```

#### `tokenPaths` (requerido)
Rutas para extraer los tokens de la respuesta del login.

```typescript
tokenPaths: {
  accessToken: 'data.access_token',   // Ruta al access token en la respuesta
  refreshToken: 'data.refresh_token', // Ruta al refresh token en la respuesta
}
```

#### `refreshTokenPaths` (requerido)
Rutas para extraer los tokens de la respuesta del refresh.

```typescript
refreshTokenPaths: {
  accessToken: 'data.access_token',   // Ruta al access token en la respuesta del refresh
  refreshToken: 'data.refresh_token', // Ruta al refresh token en la respuesta del refresh
}
```

#### `axios` (requerido)
Configuración de la instancia de Axios.

```typescript
axios: {
  baseURL: 'https://api.example.com',  // URL base de tu API
  headers: {                            // Headers por defecto (opcional)
    'Content-Type': 'application/json',
  },
  timeout: 10000,                       // Timeout en ms (opcional)
  withCredentials: false,               // Incluir credenciales (opcional)
}
```

### Ejemplo Completo

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import { ArexVueCore } from '@arex95/vue-core';

const app = createApp(App);

app.use(ArexVueCore, {
  appKey: process.env.VUE_APP_SECRET_KEY || 'default-secret-key',
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
    baseURL: process.env.VUE_APP_API_URL || 'https://api.example.com',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000,
    withCredentials: false,
  },
});

app.mount('#app');
```

## Verificación de la Instalación

Para verificar que la instalación fue exitosa, puedes intentar importar algún composable:

```typescript
import { useAuth } from '@arex95/vue-core';

// Si no hay errores, la instalación fue exitosa
```

## Próximos Pasos

- Lee la [Guía de Configuración](./configuration.md) para más detalles sobre las opciones
- Consulta la [Guía de Autenticación](./authentication.md) para empezar con el sistema de autenticación
- Revisa los [Composables](./composables.md) disponibles

