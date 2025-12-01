# Manejo de Errores

Esta guía explica cómo usar el sistema mejorado de manejo de errores en `@arex95/vue-core`.

## Visión General

El sistema de manejo de errores proporciona:

- **Clases de error personalizadas**: Tipos específicos de errores con información estructurada
- **Logging estructurado**: Información detallada en consola con grupos
- **Información de error rica**: Código, statusCode, contexto, timestamp
- **Retry automático**: Reintentos con exponential backoff para errores recuperables

## Clases de Error

### BaseError

Clase base abstracta para todos los errores personalizados.

```typescript
import { BaseError } from '@arex95/vue-core';

// No se instancia directamente, se usa como base
```

### NetworkError

Errores relacionados con la red o comunicación HTTP.

```typescript
import { NetworkError } from '@arex95/vue-core';

// Crear manualmente
const error = new NetworkError(
  'Request failed',
  500,
  originalError,
  { url: '/api/users', method: 'GET' }
);

// Desde error de Axios
try {
  await axios.get('/api/users');
} catch (error) {
  throw NetworkError.fromAxiosError(error);
}

// Desde error de Fetch
try {
  await fetch('/api/users');
} catch (error) {
  throw NetworkError.fromFetchError(error);
}
```

**Propiedades:**
- `code`: `'NETWORK_ERROR'`
- `statusCode`: Código HTTP (opcional)
- `originalError`: Error original
- `context`: Información adicional (url, method, responseData)

### AuthError

Errores de autenticación y autorización.

```typescript
import { AuthError } from '@arex95/vue-core';

// Métodos estáticos para casos comunes
const unauthorized = AuthError.unauthorized('Access denied');
const expired = AuthError.tokenExpired();
const invalid = AuthError.tokenInvalid();
const missing = AuthError.tokenMissing();
```

**Propiedades:**
- `code`: `'AUTH_ERROR'`
- `statusCode`: `401`

### ValidationError

Errores de validación con soporte para múltiples issues.

```typescript
import { ValidationError } from '@arex95/vue-core';

// Error con múltiples issues
const error = ValidationError.fromIssues([
  { field: 'email', message: 'Invalid email format', value: 'invalid' },
  { field: 'password', message: 'Password too short', value: '123' }
]);

// Error de un solo campo
const error = ValidationError.fromField(
  'email',
  'Invalid email format',
  'invalid@'
);
```

**Propiedades:**
- `code`: `'VALIDATION_ERROR'`
- `statusCode`: `422`
- `issues`: Array de problemas de validación

### ServerError

Errores del servidor (5xx).

```typescript
import { ServerError } from '@arex95/vue-core';

// Métodos estáticos para diferentes códigos
const internal = ServerError.internal('Server error');
const badGateway = ServerError.badGateway();
const unavailable = ServerError.serviceUnavailable();
const timeout = ServerError.gatewayTimeout();
```

**Propiedades:**
- `code`: `'SERVER_ERROR'`
- `statusCode`: Código HTTP del servidor

## handleError

Función principal para manejar y loggear errores.

```typescript
import { handleError, ErrorInfo } from '@arex95/vue-core';

try {
  await someOperation();
} catch (error) {
  const errorInfo = handleError(error);
  
  if (errorInfo) {
    console.log('Error message:', errorInfo.message);
    console.log('Error type:', errorInfo.type);
    console.log('Error data:', errorInfo.errorData);
    
    // Manejar según el tipo
    if (errorInfo.type === 'authentication') {
      // Redirigir a login
      router.push('/login');
    } else if (errorInfo.type === 'network') {
      // Mostrar mensaje de red
      showNotification('Connection problem. Please try again.');
    }
  }
}
```

**Retorna:** `ErrorInfo | undefined`

```typescript
interface ErrorInfo {
  message: string;
  type: ErrorType;
  errorData?: {
    code: string;
    statusCode?: number;
    context?: Record<string, unknown>;
    timestamp: Date;
    issues?: ValidationIssue[]; // Solo para ValidationError
  };
}
```

## Casos de Uso

### Caso 1: Manejo Básico de Errores

```typescript
import { handleError } from '@arex95/vue-core';
import { Role } from '@/models/Role';

const fetchRoles = async () => {
  try {
    return await Role.getAll();
  } catch (error) {
    const errorInfo = handleError(error);
    if (errorInfo) {
      // El error ya fue loggeado
      // Manejar según el tipo
      if (errorInfo.type === 'network') {
        showToast('Network error. Please check your connection.');
      }
    }
    throw error; // Re-lanzar si es necesario
  }
};
```

### Caso 2: Manejo Específico por Tipo de Error

```typescript
import { handleError, NetworkError, AuthError, ValidationError } from '@arex95/vue-core';

try {
  await User.create({ data: userData });
} catch (error) {
  const errorInfo = handleError(error);
  
  if (error instanceof NetworkError) {
    if (error.statusCode === 401) {
      // Token expirado, redirigir a login
      router.push('/login');
    } else if (error.statusCode === 500) {
      // Error del servidor, mostrar mensaje
      showError('Server error. Please try again later.');
    }
  } else if (error instanceof ValidationError) {
    // Mostrar issues de validación
    error.issues.forEach(issue => {
      showFieldError(issue.field, issue.message);
    });
  } else if (error instanceof AuthError) {
    // Error de autenticación
    router.push('/login');
  }
}
```

### Caso 3: Con Vue Query

```typescript
import { useQuery } from '@tanstack/vue-query';
import { handleError, NetworkError } from '@arex95/vue-core';
import { Role } from '@/models/Role';

const { data, error, isError } = useQuery({
  queryKey: ['roles'],
  queryFn: async () => {
    try {
      return await Role.getAll();
    } catch (err) {
      handleError(err);
      throw err;
    }
  },
  onError: (err) => {
    if (err instanceof NetworkError) {
      if (err.statusCode === 401) {
        router.push('/login');
      }
    }
  }
});
```

### Caso 4: Manejo Global de Errores

```typescript
// En un composable o plugin
import { handleError, NetworkError } from '@arex95/vue-core';

export function useErrorHandler() {
  const handleGlobalError = (error: unknown) => {
    const errorInfo = handleError(error);
    
    if (!errorInfo) return;
    
    // Enviar a servicio de logging
    logToService(errorInfo);
    
    // Mostrar notificación al usuario
    if (errorInfo.type === 'critical') {
      showCriticalError(errorInfo.message);
    } else {
      showError(errorInfo.message);
    }
    
    // Redirigir si es necesario
    if (errorInfo.type === 'authentication') {
      router.push('/login');
    }
  };
  
  return { handleGlobalError };
}
```

## Retry Logic

`RestStd` soporta retry automático con exponential backoff.

```typescript
import { RestStd, RetryConfig } from '@arex95/vue-core';

export class Role extends RestStd {
  static override resource = 'roles';
  
  // Configurar retry
  static retryConfig: RetryConfig = {
    retries: 3,              // Número de reintentos
    retryDelay: 1000,        // Delay inicial en ms
    maxRetryDelay: 10000,    // Delay máximo en ms
    backoffMultiplier: 2,    // Multiplicador para exponential backoff
    retryCondition: (error) => {
      // Solo reintentar en errores 5xx, timeouts, o errores de red
      if (error instanceof NetworkError || error instanceof ServerError) {
        const statusCode = error.statusCode;
        if (!statusCode) return true; // Error de red
        if (statusCode >= 500) return true; // Error del servidor
        if (statusCode === 408 || statusCode === 429) return true; // Timeout o rate limit
      }
      return false;
    }
  };
}
```

**Comportamiento:**
- Intento 1: Inmediato
- Intento 2: Espera 1000ms
- Intento 3: Espera 2000ms
- Intento 4: Espera 4000ms (capped en maxRetryDelay)

## Mejores Prácticas

1. **Siempre usa `handleError`**: Proporciona logging estructurado y información útil
2. **Maneja errores específicos**: Usa `instanceof` para diferentes tipos de errores
3. **Configura retry para operaciones críticas**: Especialmente para operaciones de lectura
4. **No retries en mutaciones**: Evita retries en POST/PUT/DELETE para evitar duplicados
5. **Proporciona feedback al usuario**: Muestra mensajes amigables basados en el tipo de error
6. **Logging centralizado**: Considera enviar errores críticos a un servicio de logging

## Ejemplo Completo

```vue
<template>
  <div>
    <form @submit.prevent="handleSubmit">
      <input v-model="form.email" type="email" />
      <span v-if="errors.email">{{ errors.email }}</span>
      
      <input v-model="form.password" type="password" />
      <span v-if="errors.password">{{ errors.password }}</span>
      
      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Submitting...' : 'Submit' }}
      </button>
    </form>
    
    <div v-if="errorMessage" class="error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth, handleError, ValidationError, NetworkError } from '@arex95/vue-core';

const { login } = useAuth();
const form = ref({ email: '', password: '' });
const errors = ref<Record<string, string>>({});
const errorMessage = ref('');
const isSubmitting = ref(false);

const handleSubmit = async () => {
  errors.value = {};
  errorMessage.value = '';
  isSubmitting.value = true;
  
  try {
    await login(form.value, 'local');
    // Success
  } catch (error) {
    const errorInfo = handleError(error);
    
    if (error instanceof ValidationError) {
      // Mapear issues a campos del formulario
      error.issues.forEach(issue => {
        errors.value[issue.field] = issue.message;
      });
    } else if (error instanceof NetworkError) {
      if (error.statusCode === 401) {
        errorMessage.value = 'Invalid credentials';
      } else if (error.statusCode === 500) {
        errorMessage.value = 'Server error. Please try again later.';
      } else {
        errorMessage.value = 'Network error. Please check your connection.';
      }
    } else if (errorInfo) {
      errorMessage.value = errorInfo.message;
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>
```

