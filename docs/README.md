# Documentación de @arex95/vue-core

Bienvenido a la documentación completa de `@arex95/vue-core`, una biblioteca core para Vue.js que proporciona composables, utilidades y servicios para agilizar el desarrollo de aplicaciones Vue.

## Índice

### 🚀 Para Empezar
- [**Guía de Inicio**](./GETTING_STARTED.md) - **Empieza aquí** - Guía paso a paso completa
- [Instalación](./installation.md) - Instalación y dependencias
- [Configuración](./configuration.md) - Opciones de configuración detalladas

### 📚 Documentación de Referencia
- [Referencia de API](./api-reference.md) - Documentación completa de la API
- [Composables](./composables.md) - Referencia de composables disponibles
- [Autenticación](./authentication.md) - Sistema de autenticación
- [Manejo de Errores](./error-handling.md) - Sistema mejorado de manejo de errores
- [Utilidades](./utils.md) - Funciones utilitarias

### 🔍 Análisis y Diseño
- [Análisis de Arquitectura](./analysis/readme.md) - Documentos de análisis y decisiones de diseño

### 🚀 Frameworks
- [Integración con Nuxt](./nuxt-integration.md) - Guía para integrar en proyectos Nuxt

### 📈 Mejoras Futuras
- [Roadmap de Mejoras](./improvements-roadmap.md) - Áreas identificadas para fortalecer el proyecto

## Características Principales

### 🔐 Autenticación
Sistema completo de autenticación basado en JWT con:
- **Flexible**: Funciona con cualquier fetcher (no acoplado a Axios)
- Almacenamiento seguro de tokens (localStorage, sessionStorage, cookies)
- Encriptación automática de datos sensibles
- Lógica de refresh automático
- Gestión de sesiones
- Soporte para cookies con opciones de seguridad (Secure, SameSite)

### 🌐 Comunicación API
- **Clase REST estándar** (`RestStd`) para operaciones CRUD
- Agnóstico del sistema de fetching (Axios, ofetch, fetch, etc.)
- Helpers opcionales para Axios y ofetch
- Soporte para fetchers personalizados
- **Retry logic** con exponential backoff
- **Tipos genéricos mejorados** para mejor inferencia de TypeScript
- Manejo de errores mejorado con clases de error personalizadas

### 🛡️ Manejo de Errores
- Clases de error personalizadas (`NetworkError`, `AuthError`, `ValidationError`, `ServerError`)
- Información estructurada de errores (código, statusCode, contexto, timestamp)
- Logging estructurado con grupos de consola
- Retry automático para errores recuperables

### 🍪 Storage Seguro
- Soporte para localStorage, sessionStorage y cookies
- Encriptación automática de datos sensibles
- Opciones de seguridad para cookies (Secure, SameSite, HttpOnly warning)
- Compatible con SSR/SSG (usa cookies automáticamente en servidor)

### 🎣 Composables
Composables reactivos para:
- Autenticación (`useAuth`)
- Breakpoints responsivos (`useBreakpoint`)
- Filtros (`useFilter`)
- Paginación (`usePaginator`)
- Ordenamiento (`useSorter`)
- Monitoreo de actividad (`useApiActivity`, `useUserActivity`)

**Nota:** Para fetching de datos, usa tu propio composable (ej: `useQuery` de TanStack Vue Query) con los servicios `RestStd`.

### 🛠️ Utilidades
Colección completa de utilidades para:
- Manipulación de fechas
- Operaciones con strings
- Validaciones
- Encriptación
- Manejo de archivos
- Storage
- Y más...

## Inicio Rápido

Para una guía completa paso a paso, consulta la [Guía de Inicio](./getting-started.md).

**Ejemplo rápido:**

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import { ArexVueCore } from '@arex95/vue-core';

const app = createApp(App);

app.use(ArexVueCore, {
  appKey: 'your-secret-key',
  endpoints: {
    login: '/api/login',
    refresh: '/api/refresh',
    logout: '/api/logout',
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
  },
});

app.mount('#app');
```

**Crear un modelo REST:**

```typescript
import { RestStd } from '@arex95/vue-core';

export interface RoleData {
  id: number;
  name: string;
}

export class Role extends RestStd {
  static override resource = 'roles';
  // fetchFn es opcional si configuraste Axios con configAxios()
}

// Uso directo en componentes
const { data: roles } = useQuery({
  queryKey: ['roles'],
  queryFn: () => Role.getAll<RoleData[]>(),
});
```


## Recursos Adicionales

- [Ejemplos de Uso](../EXAMPLES.md) - Ejemplos prácticos de implementación
- [Arquitectura](../ARCHITECTURE.md) - Visión general de la arquitectura del proyecto
- [Changelog](../CHANGELOG.md) - Historial de cambios

## Soporte

Para reportar problemas o solicitar características, visita el [repositorio en GitHub](https://github.com/Arex95/npm-arex-core).

