# Análisis: Compatibilidad SSR en Arex Core

## Resumen Ejecutivo

Aunque los tipos de Arex (`SessionConfig`, `LocationPreference`) ya contemplan la opción `'cookie'` para almacenamiento, la arquitectura actual mantiene un ADN puramente **Client-Side**. Esto impide que el paquete funcione correctamente en entornos SSR (Server-Side Rendering) como Nuxt 3 o Next.js.

El problema fundamental es que el código asume un contexto global único (`window`, `document`, `localStorage`) que no existe en el servidor, donde múltiples requests concurrentes requieren acceso contextualizado a cookies y storage.

## Diagnóstico Técnico

### 1. El Problema del Estado Global Invisible

#### Ubicación del Problema

**Archivos afectados:**
- `src/config/global/sessionConfig.ts`
- `src/services/credentials.ts`
- `src/utils/storage.ts`

#### Análisis

Las funciones `getSessionPersistence()` y `getSessionConfig()` devuelven promesas pero **no reciben ningún contexto de request**:

```typescript
export async function getSessionPersistence(): Promise<LocationPreference> {
  await loadSessionConfig();
  return _sessionConfig.PERSISTENCE;
}
```

**Problema en SSR:**

1. **En el cliente**: Existe un único `localStorage` y `document.cookie` globales. Todas las funciones acceden al mismo estado.

2. **En el servidor (Node.js/Nitro)**:
   - No existe `localStorage` global
   - No existe un único `document.cookie` global
   - Si 10 usuarios hacen requests simultáneos, el servidor necesita saber **de cuál request** proviene cada cookie
   - Las cookies deben leerse desde los **headers de la request HTTP** (`Cookie: access_token=...`)

**Consecuencia:**

Cuando `getSessionPersistence()` se ejecuta en el servidor:
- Intenta leer de `localStorage` → `null` (no existe)
- Intenta leer de `document.cookie` → `null` (no existe en Node.js)
- Devuelve valores por defecto que no corresponden al usuario real

#### Evolución Requerida

Las funciones de lectura deben permitir un **inyector de contexto** que proporcione los headers de la request actual:

```typescript
export async function getSessionPersistence(
  context?: { cookies?: Record<string, string> }
): Promise<LocationPreference> {
  // Si hay contexto SSR, leer de cookies del request
  // Si no, usar el método actual (cliente)
}
```

---

### 2. La Capa de Encriptación (`encryption.ts`)

#### Ubicación del Problema

**Archivo afectado:**
- `src/utils/encryption.ts`

#### Análisis

El código utiliza la **Web Crypto API** (`crypto.subtle`, `CryptoKey`):

```typescript
export async function importKey(secretKey: string): Promise<CryptoKey> {
  const keyMaterial = new TextEncoder().encode(secretKey);
  const digest = await crypto.subtle.digest("SHA-256", keyMaterial);
  // ...
}
```

**Estado actual:**

- ✅ **Cliente (Browser)**: `crypto.subtle` está disponible globalmente
- ⚠️ **Servidor (Node.js)**:
  - Node.js 15+ tiene `globalThis.crypto` con `subtle`
  - Node.js < 15 requiere `import { webcrypto } from 'node:crypto'`
  - Algunos entornos (Nitro antiguo) pueden no tener `crypto.subtle` en el scope global

**Problema potencial:**

Si el código ejecuta `crypto.subtle` directamente en Node.js sin verificar disponibilidad, puede fallar en algunos entornos.

#### Solución Requerida

Detectar el entorno y usar el polyfill apropiado:

```typescript
function getCryptoSubtle() {
  if (typeof window !== 'undefined') {
    return crypto.subtle;
  }
  // Node.js
  if (globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  // Fallback para Node.js antiguo
  const { webcrypto } = require('node:crypto');
  return webcrypto.subtle;
}
```

---

### 3. La Trampa de `verifyAuth` en `credentials.ts`

#### Ubicación del Problema

**Archivo afectado:**
- `src/services/credentials.ts` (líneas 139-171)

#### Análisis

La función `verifyAuth()` busca tokens en "todos los lugares de almacenamiento":

```typescript
export const verifyAuth = async (): Promise<boolean> => {
  const sessionPersistence = 'any';
  const token = await getAuthToken(getAppKey(), sessionPersistence);
  // ...
}
```

**Problema en SSR:**

1. **En el servidor**: `getAuthToken()` con `location: 'any'` busca en:
   - `sessionStorage` → `null` (no existe en Node.js)
   - `localStorage` → `null` (no existe en Node.js)
   - `document.cookie` → `null` (no existe en Node.js)

2. **Resultado**: Siempre devuelve `false` porque no puede leer las cookies del request actual.

3. **Efecto visual**: El servidor renderiza "no autenticado", pero cuando el cliente hidrata, encuentra el token y muestra "autenticado". Esto causa un **flicker** o **flash de contenido no autenticado**.

**Flujo del problema:**

```
1. Request SSR → verifyAuth() → false (no lee cookies del request)
2. Servidor renderiza: "Por favor inicia sesión"
3. Cliente hidrata → verifyAuth() → true (lee cookies del navegador)
4. Cliente re-renderiza: "Bienvenido"
5. Usuario ve flicker: login → dashboard
```

#### Solución Requerida

`verifyAuth` debe poder recibir un objeto de cookies o headers opcional:

```typescript
export const verifyAuth = async (
  context?: { cookies?: Record<string, string> }
): Promise<boolean> => {
  const sessionPersistence = 'any';
  
  // Si hay contexto SSR, leer de cookies del request
  // Si no, usar el método actual (cliente)
  const token = await getAuthToken(
    getAppKey(), 
    sessionPersistence,
    context
  );
  // ...
}
```

---

### 4. `window.location.reload()` en el Flujo de Auth

#### Ubicación del Problema

**Archivo afectado:**
- `src/composables/auth/useAuth.ts` (líneas 64-66)

#### Análisis

El método `logout()` dispara un `reload()`:

```typescript
const logout = async (params: Record<string, unknown> = {}): Promise<void> => {
  try {
    await getFetcher()({ /* ... */ });
  } catch (error) {
    handleError(error);
  } finally {
    await cleanCredentials(await getSessionPersistence());
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
};
```

**Problema en SSR:**

1. **En el cliente**: Funciona correctamente, recarga la página.

2. **En el servidor**: 
   - Si el logout ocurre durante el render SSR (por ejemplo, un token expirado detectado en el servidor)
   - `window` no existe → el código tiene guarda (`typeof window !== 'undefined'`)
   - Pero el servidor no puede redirigir al usuario sin un sistema de redirección abstracta

3. **Problema adicional**: En frameworks SSR como Nuxt, la redirección debe hacerse usando el router del framework (`navigateTo()` en Nuxt), no `window.location`.

#### Solución Requerida

Sistema de redirección abstracta que funcione en cliente y servidor:

```typescript
interface RedirectStrategy {
  redirect(path: string): void | Promise<void>;
}

const defaultRedirectStrategy: RedirectStrategy = {
  redirect: (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  }
};

let redirectStrategy: RedirectStrategy = defaultRedirectStrategy;

export function setRedirectStrategy(strategy: RedirectStrategy) {
  redirectStrategy = strategy;
}

// En logout:
await redirectStrategy.redirect('/login');
```

---

## Propuesta de Re-Arquitectura para SSR-Ready

### Cambio Fundamental: De Funciones Estáticas a Estrategias de Almacenamiento

El problema raíz es que el código actual usa **funciones estáticas** que asumen un contexto global. Para SSR, necesitamos **drivers de almacenamiento** que puedan recibir contexto.

### Arquitectura Propuesta: Storage Driver Pattern

#### 1. Interface de Storage Driver

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

#### 2. Implementación de Drivers

**Browser Cookie Driver:**

```typescript
const BrowserCookieDriver: StorageDriver = {
  get: (key: string, context?: StorageContext) => {
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
  
  set: (key: string, value: string, options?: StorageOptions, context?: StorageContext) => {
    if (typeof document === 'undefined') {
      // SSR: escribir en response headers
      if (context?.responseHeaders) {
        const cookieString = buildCookieString(key, value, options);
        if (context.responseHeaders instanceof Headers) {
          context.responseHeaders.append('Set-Cookie', cookieString);
        } else {
          context.responseHeaders['Set-Cookie'] = cookieString;
        }
      }
      return;
    }
    // Cliente: escribir en document.cookie
    document.cookie = buildCookieString(key, value, options);
  },
  
  remove: (key: string, options?: StorageOptions, context?: StorageContext) => {
    // Similar a set pero con expires en el pasado
  }
};
```

**LocalStorage Driver:**

```typescript
const LocalStorageDriver: StorageDriver = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  set: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
};
```

#### 3. Universal Storage Wrapper

Una clase interna que maneje la encriptación y elija el driver automáticamente:

```typescript
class UniversalStorage {
  private driver: StorageDriver;
  private encryptionKey: string;
  
  constructor(driver: StorageDriver, encryptionKey: string) {
    this.driver = driver;
    this.encryptionKey = encryptionKey;
  }
  
  async setEncrypted(key: string, value: string, options?: StorageOptions, context?: StorageContext): Promise<void> {
    const encrypted = await encrypt(value, this.encryptionKey);
    await this.driver.set(key, encrypted, options, context);
  }
  
  async getDecrypted(key: string, context?: StorageContext): Promise<string | null> {
    const encrypted = await this.driver.get(key, context);
    if (!encrypted) return null;
    try {
      return await decrypt(encrypted, this.encryptionKey);
    } catch {
      return null;
    }
  }
}
```

#### 4. Evolución de `useAuth` para SSR

```typescript
export function useAuth(options?: { 
  fetcher?: Fetcher;
  storageDriver?: StorageDriver;
  context?: StorageContext;
}) {
  const driver = options?.storageDriver || 
    (typeof window !== 'undefined' ? LocalStorageDriver : BrowserCookieDriver);
  
  const storage = new UniversalStorage(driver, getAppKey());
  
  const login = async (
    params: Record<string, unknown>,
    persistence: LocationPreference,
    context?: StorageContext
  ) => {
    // ... lógica de login usando storage.setEncrypted con context
  };
  
  const logout = async (context?: StorageContext) => {
    // ... lógica de logout usando storage con context
  };
  
  return { login, logout };
}
```

#### 5. Context-Aware Methods

Todas las funciones de lectura deben poder recibir contexto:

```typescript
export const getAuthToken = async (
  secretKey: string,
  location: LocationPreference,
  context?: StorageContext
): Promise<string | null> => {
  const driver = getDriverForLocation(location);
  const storage = new UniversalStorage(driver, secretKey);
  return await storage.getDecrypted(tokensConfig.ACCESS_TOKEN, context);
};

export const verifyAuth = async (
  context?: StorageContext
): Promise<boolean> => {
  const token = await getAuthToken(getAppKey(), 'any', context);
  // ... validación
};
```

---

## Consideraciones de Implementación

### 1. Encrypted Cookie Compression

**Problema:** Las cookies tienen un límite de **4KB**. La encriptación AES-CBC con formato hexadecimal duplica el tamaño de los datos.

**Solución:** Usar un formato más compacto que hexadecimal:

- **Base64url**: Más compacto que hex (33% más eficiente)
- **Compresión**: Usar `pako` o similar para comprimir antes de encriptar
- **Split cookies**: Si el token es muy grande, dividirlo en múltiples cookies

```typescript
function ab2base64url(buffer: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
```

### 2. Compatibilidad Hacia Atrás

**Estrategia:** Mantener las funciones actuales como wrappers que usan los nuevos drivers:

```typescript
export async function getAuthToken(
  secretKey: string,
  location: LocationPreference,
  context?: StorageContext
): Promise<string | null> {
  // Si no hay context, usar comportamiento actual (cliente)
  if (!context && typeof window !== 'undefined') {
    return getAuthTokenLegacy(secretKey, location);
  }
  // Si hay context o es SSR, usar nuevo sistema
  return getAuthTokenWithContext(secretKey, location, context);
}
```

### 3. Integración con Nuxt

**Plugin de Nuxt que inyecta contexto:**

```typescript
export default defineNuxtPlugin({
  name: 'arex-vue-core-ssr',
  setup(nuxtApp) {
    const event = useRequestEvent();
    
    if (event) {
      // SSR: inyectar cookies del request
      const cookies = parseCookies(event.node.req.headers.cookie || '');
      
      // Wrapper que inyecta contexto automáticamente
      const { login, logout } = useAuth({
        context: { cookies }
      });
      
      return { login, logout };
    }
    
    // Cliente: usar sin contexto
    return useAuth();
  }
});
```

---

## Plan de Implementación

### Fase 1: Storage Driver Interface
- [ ] Definir `StorageDriver` interface
- [ ] Implementar `BrowserCookieDriver`
- [ ] Implementar `LocalStorageDriver`
- [ ] Implementar `SessionStorageDriver`

### Fase 2: Universal Storage Wrapper
- [ ] Crear clase `UniversalStorage`
- [ ] Integrar encriptación/desencriptación
- [ ] Manejar compresión de cookies

### Fase 3: Context-Aware Methods
- [ ] Actualizar `getAuthToken` para aceptar contexto
- [ ] Actualizar `verifyAuth` para aceptar contexto
- [ ] Actualizar `getSessionPersistence` para aceptar contexto
- [ ] Mantener compatibilidad hacia atrás

### Fase 4: Evolución de useAuth
- [ ] Actualizar `useAuth` para aceptar `storageDriver` y `context`
- [ ] Implementar sistema de redirección abstracta
- [ ] Actualizar `logout` para usar redirección abstracta

### Fase 5: Mejoras de Encriptación
- [ ] Detectar entorno y usar polyfill de `crypto.subtle` si es necesario
- [ ] Implementar compresión de cookies
- [ ] Optimizar formato de datos encriptados (base64url vs hex)

### Fase 6: Documentación y Testing
- [ ] Documentar uso en SSR
- [ ] Crear ejemplos para Nuxt 3
- [ ] Crear ejemplos para Next.js
- [ ] Tests unitarios para drivers
- [ ] Tests de integración SSR

---

## Conclusión

La arquitectura actual de Arex es sólida para aplicaciones **Client-Side**, pero requiere una evolución hacia un modelo de **Storage Drivers** con soporte de contexto para ser compatible con SSR.

Los cambios propuestos son:
1. **No breaking**: Las funciones actuales seguirán funcionando en cliente
2. **Extensibles**: Permiten inyectar contexto para SSR
3. **Modulares**: Drivers intercambiables según el entorno
4. **Eficientes**: Optimización de tamaño de cookies encriptadas

Con esta arquitectura, Arex podrá convertirse en el estándar para autenticación en Vue/Nuxt, funcionando tanto en cliente como en servidor sin flicker ni problemas de hidratación.

