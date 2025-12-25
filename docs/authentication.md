# Guía de Autenticación

Esta guía explica cómo funciona el sistema de autenticación en `@arex95/vue-core` y cómo implementarlo en tu aplicación.

## Visión General

El sistema de autenticación está basado en JWT (JSON Web Tokens) y proporciona:

- **Login y Logout**: Gestión de sesiones de usuario
- **Almacenamiento de Tokens**: Soporte para localStorage, sessionStorage y cookies
- **Encriptación**: Almacenamiento seguro de tokens usando encriptación AES-GCM
- **Cookies Seguras**: Soporte para cookies con opciones de seguridad (Secure, SameSite)
- **Flexible**: Funciona con cualquier fetcher (no acoplado a Axios)
- **Refresh Automático**: Renovación automática de tokens expirados
- **SSR/SSG Compatible**: Funciona perfectamente en entornos server-side con configuración framework-agnóstica
- **Framework-Agnóstico**: Funciona en Vue puro, Nuxt, Next.js, SvelteKit, o cualquier framework

## Configuración Inicial

Antes de usar la autenticación, debes configurar los endpoints y las rutas de tokens:

```typescript
import { createApp } from 'vue';
import { ArexVueCore } from '@arex95/vue-core';

const app = createApp(App);

app.use(ArexVueCore, {
  appKey: 'your-secret-key', // Clave para encriptar tokens
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
    accessToken: 'data.access_token',    // Ruta al access token en respuesta de login
    refreshToken: 'data.refresh_token',  // Ruta al refresh token en respuesta de login
  },
  refreshTokenPaths: {
    accessToken: 'data.access_token',    // Ruta al access token en respuesta de refresh
    refreshToken: 'data.refresh_token',  // Ruta al refresh token en respuesta de refresh
  },
  // ... otras configuraciones
});
```

## Uso Básico

### useAuth

El composable `useAuth` acepta un fetcher opcional. Si no se proporciona, usa el fetcher configurado globalmente o cae a Axios por defecto.

```typescript
// Opción 1: Usar fetcher por defecto (Axios si está configurado)
const { login, logout } = useAuth();

// Opción 2: Usar fetcher personalizado
import { createOfetchFetcher } from '@arex95/vue-core';
const ofetchFetcher = createOfetchFetcher('https://api.example.com');
const { login, logout } = useAuth(ofetchFetcher);

// Opción 3: Configurar fetcher global para auth
import { configAuthFetcher, createOfetchFetcher } from '@arex95/vue-core';
configAuthFetcher(createOfetchFetcher('https://api.example.com'));
// Ahora todos los useAuth() usarán ofetch
const { login, logout } = useAuth();
```

### Login

```vue
<template>
  <form @submit.prevent="handleLogin">
    <input v-model="username" type="text" placeholder="Usuario" />
    <input v-model="password" type="password" placeholder="Contraseña" />
    <label>
      <input v-model="rememberMe" type="checkbox" />
      Recordarme
    </label>
    <label>
      <input v-model="useCookies" type="checkbox" />
      Usar cookies (más seguro)
    </label>
    <button type="submit" :disabled="isLoading">
      {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth, handleError, NetworkError, AuthError } from '@arex95/vue-core';
import { useRouter } from 'vue-router';

const { login } = useAuth();
const router = useRouter();
const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const useCookies = ref(false);
const isLoading = ref(false);

const handleLogin = async () => {
  isLoading.value = true;
  try {
    const persistence = useCookies.value ? 'cookie' : (rememberMe.value ? 'local' : 'session');
    
    const response = await login(
      {
        username: username.value,
        password: password.value,
      },
      persistence
    );
    
    console.log('Login exitoso', response);
    router.push('/dashboard');
  } catch (error) {
    const errorInfo = handleError(error);
    
    if (error instanceof AuthError) {
      alert('Credenciales inválidas');
    } else if (error instanceof NetworkError) {
      alert('Error de conexión. Por favor intenta de nuevo.');
    } else if (errorInfo) {
      alert(errorInfo.message);
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
```

### Logout

```vue
<template>
  <button @click="handleLogout">Cerrar Sesión</button>
</template>

<script setup>
import { useAuth } from '@arex95/vue-core';

const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  // La página se recargará automáticamente
};
</script>
```

## Persistencia de Sesión

Puedes elegir entre tres tipos de almacenamiento:

### localStorage
Los tokens persisten incluso después de cerrar el navegador:

```typescript
await login(credentials, 'local');
```

**Características:**
- Persiste entre sesiones
- Accesible desde JavaScript
- Limitado al mismo origen
- No se envía automáticamente al servidor

### sessionStorage
Los tokens se eliminan al cerrar la pestaña del navegador:

```typescript
await login(credentials, 'session');
```

**Características:**
- Solo persiste durante la sesión
- Accesible desde JavaScript
- Limitado al mismo origen
- No se envía automáticamente al servidor

### Cookies
Los tokens se almacenan en cookies con encriptación y opciones de seguridad:

```typescript
await login(credentials, 'cookie');
```

**Características:**
- Se envían automáticamente al servidor
- Soporte para opciones de seguridad (Secure, SameSite)
- Compatible con SSR/SSG
- Encriptación automática
- Configuración de expiración

**Opciones de cookies (configurables):**

```typescript
import { storeEncryptedItem, CookieOptions } from '@arex95/vue-core';

const cookieOptions: CookieOptions = {
  expires: 30,              // Días hasta expiración
  path: '/',                // Ruta de la cookie
  domain: '.example.com',   // Dominio (opcional)
  secure: true,             // Solo HTTPS (automático en producción)
  sameSite: 'Strict',       // 'Strict', 'Lax', o 'None'
};

// Las funciones de auth usan estas opciones automáticamente
// pero puedes configurarlas si necesitas personalización
```

**Ventajas de cookies:**
- ✅ Automáticamente enviadas en requests HTTP
- ✅ Compatible con SSR/SSG
- ✅ Opciones de seguridad estándar
- ✅ Encriptación automática
- ✅ Mejor para aplicaciones que requieren tokens en el servidor

**Cuándo usar cada opción:**
- **localStorage**: Para "Recordarme" en aplicaciones cliente
- **sessionStorage**: Para sesiones temporales sin persistencia
- **Cookies**: Para SSR/SSG, o cuando necesitas tokens accesibles desde el servidor

## Estructura de Respuesta del API

El sistema espera que tu API devuelva los tokens en una estructura específica. Puedes configurar las rutas usando notación de puntos:

### Ejemplo 1: Tokens en el nivel raíz

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Configuración:
```typescript
tokenPaths: {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
}
```

### Ejemplo 2: Tokens anidados en data

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Configuración:
```typescript
tokenPaths: {
  accessToken: 'data.access_token',
  refreshToken: 'data.refresh_token',
}
```

### Ejemplo 3: Tokens en estructura compleja

```json
{
  "success": true,
  "result": {
    "tokens": {
      "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

Configuración:
```typescript
tokenPaths: {
  accessToken: 'result.tokens.access',
  refreshToken: 'result.tokens.refresh',
}
```

## Refresh Automático de Tokens

El sistema maneja automáticamente la renovación de tokens cuando expiran. Esto se hace a través de interceptores de Axios que detectan errores 401 y intentan refrescar el token.

### Configuración del Endpoint de Refresh

Asegúrate de que tu endpoint de refresh acepte el refresh token y devuelva nuevos tokens:

```typescript
// Tu API debe aceptar:
POST /api/auth/refresh
// Y devolver la misma estructura que el login
```

## Protección de Rutas

Puedes proteger rutas verificando si el usuario está autenticado:

```typescript
import { getAuthAccessToken } from '@arex95/vue-core';
import { getAppKey } from '@arex95/vue-core';

// En tu router guard
router.beforeEach(async (to, from, next) => {
  const appKey = getAppKey();
  const token = await getAuthAccessToken(appKey, 'any');
  
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else {
    next();
  }
});
```

## Verificación de Tokens

Puedes verificar si un token es válido decodificándolo:

```typescript
import { jwtDecode } from 'jwt-decode';
import { getAuthAccessToken } from '@arex95/vue-core';
import { getAppKey } from '@arex95/vue-core';

const checkTokenValidity = async () => {
  const appKey = getAppKey();
  const token = await getAuthAccessToken(appKey, 'any');
  
  if (!token) {
    return false;
  }
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Verificar si el token ha expirado
    if (decoded.exp && decoded.exp < currentTime) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};
```

## Limpieza de Credenciales

Si necesitas limpiar manualmente las credenciales:

```typescript
import { cleanCredentials } from '@arex95/vue-core';
import { getSessionPersistence } from '@arex95/vue-core';

const clearAuth = async () => {
  const persistence = await getSessionPersistence();
  await cleanCredentials(persistence);
};
```

## Manejo de Errores

El sistema maneja automáticamente errores comunes:

- **Token no encontrado**: Limpia credenciales y recarga la página
- **Token expirado**: Intenta refrescar automáticamente
- **Refresh fallido**: Limpia credenciales y recarga la página

Puedes personalizar el manejo de errores usando la función `handleError` y las clases de error personalizadas:

```typescript
import { handleError, NetworkError, AuthError, ValidationError } from '@arex95/vue-core';

try {
  await login(credentials, 'local');
} catch (error) {
  const errorInfo = handleError(error); // Logging automático
  
  if (error instanceof AuthError) {
    // Error de autenticación
    showError('Credenciales inválidas');
  } else if (error instanceof NetworkError) {
    // Error de red
    if (error.statusCode === 401) {
      showError('Sesión expirada. Por favor inicia sesión nuevamente.');
    } else {
      showError('Error de conexión. Por favor intenta de nuevo.');
    }
  } else if (error instanceof ValidationError) {
    // Error de validación
    error.issues.forEach(issue => {
      showFieldError(issue.field, issue.message);
    });
  }
}
```

Para más detalles sobre manejo de errores, consulta la [guía completa de manejo de errores](./error-handling.md).

## Mejores Prácticas

1. **Usa variables de entorno** para la clave de encriptación:
   ```typescript
   appKey: process.env.VUE_APP_SECRET_KEY
   ```

2. **Elige la persistencia adecuada**:
   - `localStorage` para "Recordarme" en aplicaciones cliente
   - `sessionStorage` para sesiones temporales
   - `cookie` para SSR/SSG o cuando necesitas tokens accesibles desde el servidor

3. **Maneja errores de forma apropiada**:
   - Muestra mensajes amigables al usuario
   - Registra errores para debugging

4. **Verifica tokens antes de hacer peticiones**:
   - Evita peticiones innecesarias con tokens inválidos

5. **Implementa timeout de sesión**:
   - Cierra sesión después de un período de inactividad

## Casos de Uso

### Caso 1: Login con localStorage (Recordarme)

```vue
<template>
  <form @submit.prevent="handleLogin">
    <input v-model="form.username" type="text" />
    <input v-model="form.password" type="password" />
    <label>
      <input v-model="rememberMe" type="checkbox" />
      Recordarme
    </label>
    <button type="submit">Login</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth, handleError } from '@arex95/vue-core';

const { login } = useAuth();
const form = ref({ username: '', password: '' });
const rememberMe = ref(false);

const handleLogin = async () => {
  try {
    await login(
      form.value,
      rememberMe.value ? 'local' : 'session'
    );
    // Redirigir después del login
  } catch (error) {
    handleError(error);
    // Manejar error según tu UI
  }
};
</script>
```

### Caso 2: Login con Cookies (SSR/SSG)

```vue
<template>
  <form @submit.prevent="handleLogin">
    <input v-model="form.username" type="text" />
    <input v-model="form.password" type="password" />
    <button type="submit">Login</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth, handleError } from '@arex95/vue-core';

const { login } = useAuth();
const form = ref({ username: '', password: '' });

const handleLogin = async () => {
  try {
    // Usar cookies para SSR/SSG
    await login(form.value, 'cookie');
    // Redirigir después del login
  } catch (error) {
    handleError(error);
  }
};
</script>
```

### Caso 3: Login con Fetcher Personalizado

```typescript
import { useAuth, createOfetchFetcher } from '@arex95/vue-core';

// Crear fetcher personalizado
const customFetcher = createOfetchFetcher('https://api.example.com');

// Usar en useAuth
const { login, logout } = useAuth(customFetcher);

// O configurar globalmente
import { configAuthFetcher } from '@arex95/vue-core';
configAuthFetcher(customFetcher);
const { login, logout } = useAuth(); // Usará el fetcher global
```

### Caso 4: Verificación de Autenticación

```typescript
import { verifyAuth, getAuthToken, getAppKey } from '@arex95/vue-core';

// Verificar si el usuario está autenticado
const isAuthenticated = await verifyAuth();

// O verificar manualmente
const appKey = getAppKey();
const token = await getAuthToken(appKey, 'any'); // Busca en todos los storages

if (token) {
  // Usuario autenticado
} else {
  // Redirigir a login
}
```

### Caso 5: Router Guard con Verificación

```typescript
import { verifyAuth } from '@arex95/vue-core';
import { useRouter } from 'vue-router';

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

## Ejemplo Completo

```vue
<template>
  <div>
    <div v-if="!isAuthenticated">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <input 
          v-model="form.username" 
          type="text" 
          placeholder="Usuario"
          :disabled="isLoading"
        />
        <input 
          v-model="form.password" 
          type="password" 
          placeholder="Contraseña"
          :disabled="isLoading"
        />
        <label>
          <input v-model="rememberMe" type="checkbox" />
          Recordarme
        </label>
        <label>
          <input v-model="useCookies" type="checkbox" />
          Usar cookies (recomendado para SSR)
        </label>
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Iniciando sesión...' : 'Login' }}
        </button>
        <div v-if="errorMessage" class="error">
          {{ errorMessage }}
        </div>
      </form>
    </div>
    
    <div v-else>
      <h2>Bienvenido</h2>
      <button @click="handleLogout">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  useAuth, 
  verifyAuth, 
  handleError, 
  NetworkError, 
  AuthError 
} from '@arex95/vue-core';
import { useRouter } from 'vue-router';

const { login, logout } = useAuth();
const router = useRouter();
const form = ref({ username: '', password: '' });
const rememberMe = ref(false);
const useCookies = ref(false);
const isAuthenticated = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

const checkAuth = async () => {
  isAuthenticated.value = await verifyAuth();
};

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const persistence = useCookies.value 
      ? 'cookie' 
      : (rememberMe.value ? 'local' : 'session');
    
    await login(form.value, persistence);
    await checkAuth();
    router.push('/dashboard');
  } catch (error) {
    const errorInfo = handleError(error);
    
    if (error instanceof AuthError) {
      errorMessage.value = 'Credenciales inválidas';
    } else if (error instanceof NetworkError) {
      if (error.statusCode === 401) {
        errorMessage.value = 'Usuario o contraseña incorrectos';
      } else {
        errorMessage.value = 'Error de conexión. Por favor intenta de nuevo.';
      }
    } else if (errorInfo) {
      errorMessage.value = errorInfo.message;
    }
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = async () => {
  await logout();
  // La página se recargará automáticamente
};

onMounted(() => {
  checkAuth();
});
</script>
```

