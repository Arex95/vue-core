# Análisis: Cómo Hacer RestStd Más Útil

## ⚠️ IMPORTANTE: RestStd NO compite con TanStack Query

**TanStack Query ya tiene:**
- ✅ Cache automático
- ✅ Invalidación de cache
- ✅ Paginación (infinite queries)
- ✅ Optimistic updates
- ✅ Retry logic (a nivel de query)
- ✅ Transformación de datos (en `select`)
- ✅ Estado de loading/error
- ✅ Y mucho más...

**RestStd debe complementar TanStack Query, NO competir con él.**

**RestStd:** Construye peticiones HTTP RESTful de manera consistente
**TanStack Query:** Maneja cache, estado, y lógica de queries

---

## Estado Actual de RestStd

### Lo que ya tiene (Fortalezas)
- ✅ Métodos CRUD estándar (`getAll`, `getOne`, `create`, `update`, `delete`, `patch`)
- ✅ Operaciones en lote (`bulkCreate`, `bulkUpdate`, `bulkDelete`)
- ✅ Retry logic con exponential backoff (a nivel de petición HTTP)
- ✅ Manejo de errores mejorado (conversión a clases personalizadas)
- ✅ Headers globales por servicio
- ✅ Soporte para FormData automático
- ✅ Tipos genéricos mejorados
- ✅ URLs personalizadas (sobrescribir `resource`)
- ✅ Agnóstico de fetching (Axios, ofetch, fetch, custom)
- ✅ Construcción automática de URLs RESTful

### Lo que NO debe tener (TanStack Query ya lo hace)
- ❌ Cache automático → TanStack Query lo hace mejor
- ❌ Invalidación de cache → TanStack Query lo hace mejor
- ❌ Paginación compleja → TanStack Query tiene `useInfiniteQuery`
- ❌ Optimistic updates → TanStack Query lo tiene
- ❌ Estado de loading/error → TanStack Query lo proporciona

---

## Propuestas de Mejora (Que Complementen TanStack Query)

### 1. Mejor Construcción de URLs (Alta Prioridad)

**Problema actual:** Solo construye URLs simples (`/users`, `/users/1`)

**Mejora:** Soporte para URLs más complejas y relaciones anidadas

```typescript
export class RestStd {
  // Método helper para relaciones anidadas
  static getRelated<TResponse>(
    resourceId: string | number,
    relatedResource: string,
    options: { params?: Record<string, unknown> } = {}
  ): Promise<TResponse> {
    const url = `${this.resource}/${resourceId}/${relatedResource}`;
    return this.customRequest({
      method: 'GET',
      url,
      params: options.params
    });
  }
}
```

**Uso:**
```typescript
export class User extends RestStd {
  static override resource = 'users';
}

// Obtener posts de un usuario
const posts = await User.getRelated<Post[]>(1, 'posts');
// → GET /users/1/posts

// Obtener comentarios de un post de un usuario
const comments = await User.getRelated<Comment[]>(1, 'posts/123/comments');
// → GET /users/1/posts/123/comments
```

**Beneficios:**
- Construcción de URLs más flexible
- API más clara para relaciones comunes
- Mantiene convención RESTful

---

### 2. Query Builders para Parámetros Complejos (Alta Prioridad)

**Problema:** Construir query strings complejos es verboso y propenso a errores.

**Mejora:** Helper para construir query strings de manera más clara

```typescript
export class RestStd {
  static buildQueryParams(params: {
    filter?: Record<string, any>;
    sort?: { field: string; order: 'asc' | 'desc' } | Array<{ field: string; order: 'asc' | 'desc' }>;
    include?: string[];
    page?: number;
    perPage?: number;
    search?: string;
  }): Record<string, unknown> {
    const query: Record<string, unknown> = {};
    
    // Filters: filter[status]=active&filter[role]=admin
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }
    
    // Sort: sort[field]=name&sort[order]=asc
    if (params.sort) {
      const sortArray = Array.isArray(params.sort) ? params.sort : [params.sort];
      sortArray.forEach((sort, index) => {
        query[`sort[${index}][field]`] = sort.field;
        query[`sort[${index}][order]`] = sort.order;
      });
    }
    
    // Include: include=permissions,roles
    if (params.include) {
      query.include = params.include.join(',');
    }
    
    // Pagination
    if (params.page) query.page = params.page;
    if (params.perPage) query.per_page = params.perPage;
    
    // Search
    if (params.search) query.search = params.search;
    
    return query;
  }
}
```

**Uso:**
```typescript
const users = await User.getAll({
  params: User.buildQueryParams({
    filter: { status: 'active', role: 'admin' },
    sort: [{ field: 'name', order: 'asc' }, { field: 'createdAt', order: 'desc' }],
    include: ['permissions', 'roles'],
    page: 1,
    perPage: 20,
    search: 'john'
  })
});
// → GET /users?filter[status]=active&filter[role]=admin&sort[0][field]=name&sort[0][order]=asc&include=permissions,roles&page=1&per_page=20&search=john
```

**Beneficios:**
- Query strings más fáciles de construir
- Menos errores de sintaxis
- Tipado mejorado

---

### 3. Transformación de Request/Response (Media Prioridad)

**Problema:** A veces necesitas transformar datos antes/después de la petición.

**Solución:** Hooks de transformación por servicio

```typescript
export class RestStd {
  // Transformar datos antes de enviar
  static transformRequest?: (data: any, method: string) => any;
  
  // Transformar datos después de recibir
  static transformResponse?: (data: any, method: string) => any;
  
  static create<TResponse, TData>(options: CreateOptions<TData>): Promise<TResponse> {
    let data = options.data;
    
    // Transformar antes de enviar
    if (this.transformRequest) {
      data = this.transformRequest(data, 'create');
    }
    
    const result = await this.executeFetch<TResponse>(config);
    
    // Transformar después de recibir
    if (this.transformResponse) {
      return this.transformResponse(result, 'create');
    }
    
    return result;
  }
}
```

**Uso:**
```typescript
export class User extends RestStd {
  static override resource = 'users';
  
  // Convertir nombres a mayúsculas antes de enviar
  static transformRequest = (data: any, method: string) => {
    if (method === 'create' || method === 'update') {
      return {
        ...data,
        name: data.name?.toUpperCase()
      };
    }
    return data;
  };
  
  // Agregar campo calculado después de recibir
  static transformResponse = (data: any) => ({
    ...data,
    fullName: `${data.firstName} ${data.lastName}`
  });
}
```

**Beneficios:**
- Lógica de transformación centralizada
- Reutilizable en todos los métodos
- No compite con TanStack Query (que transforma en `select`)

---

### 4. Validación de Datos (Media Prioridad)

**Problema:** No hay validación antes de enviar datos al servidor.

**Solución:** Validación opcional con funciones simples

```typescript
export class RestStd {
  static validation?: {
    create?: (data: any) => void | string; // void = válido, string = mensaje de error
    update?: (data: any) => void | string;
    patch?: (data: any) => void | string;
  };
  
  static create<TResponse, TData>(options: CreateOptions<TData>): Promise<TResponse> {
    // Validar antes de enviar
    if (this.validation?.create) {
      const validationResult = this.validation.create(options.data);
      if (typeof validationResult === 'string') {
        throw new ValidationError(validationResult);
      }
    }
    
    return this.executeFetch<TResponse>(config);
  }
}
```

**Uso:**
```typescript
export class User extends RestStd {
  static override resource = 'users';
  
  static validation = {
    create: (data: any) => {
      if (!data.email || !data.email.includes('@')) {
        return 'Email inválido';
      }
      if (!data.name || data.name.length < 3) {
        return 'El nombre debe tener al menos 3 caracteres';
      }
      // void = válido
    },
    update: (data: any) => {
      if (data.email && !data.email.includes('@')) {
        return 'Email inválido';
      }
    }
  };
}
```

**Beneficios:**
- Validación antes de hacer la petición
- Mejor UX (errores más rápidos)
- Menos peticiones fallidas
- No compite con TanStack Query (validación de datos, no de estado)

---

### 5. Interceptores por Servicio (Baja Prioridad)

**Problema:** A veces necesitas lógica específica antes/después de cada petición de un servicio.

**Solución:** Interceptores estáticos por servicio

```typescript
export class RestStd {
  static interceptors?: {
    request?: (config: FetcherConfig) => FetcherConfig | Promise<FetcherConfig>;
    response?: (response: any) => any | Promise<any>;
    error?: (error: any) => any | Promise<any>;
  };
  
  private static async executeFetch<T>(config: FetcherConfig): Promise<T> {
    // Interceptor de request
    if (this.interceptors?.request) {
      config = await this.interceptors.request(config);
    }
    
    try {
      const response = await fetcher(config);
      
      // Interceptor de response
      if (this.interceptors?.response) {
        return await this.interceptors.response(response);
      }
      
      return response;
    } catch (error) {
      // Interceptor de error
      if (this.interceptors?.error) {
        const handled = await this.interceptors.error(error);
        if (handled !== undefined) {
          return handled;
        }
      }
      throw error;
    }
  }
}
```

**Uso:**
```typescript
export class User extends RestStd {
  static override resource = 'users';
  
  static interceptors = {
    request: (config) => {
      // Agregar timestamp a todas las peticiones
      config.headers = {
        ...config.headers,
        'X-Request-Time': Date.now().toString()
      };
      return config;
    },
    response: (response) => {
      // Log todas las respuestas (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log('User API Response:', response);
      }
      return response;
    },
    error: (error) => {
      // Log errores específicos de este servicio
      console.error('User API Error:', error);
      // Retornar undefined para que se propague el error
    }
  };
}
```

**Beneficios:**
- Lógica personalizada por servicio
- No afecta otros servicios
- Útil para logging, métricas, etc.

---

### 6. Soporte para Diferentes Convenciones de API (Baja Prioridad)

**Problema:** Algunas APIs usan convenciones diferentes (ej: `snake_case` en URLs, `camelCase` en body)

**Solución:** Configuración de convenciones

```typescript
export class RestStd {
  static apiConvention?: {
    urlCase?: 'camelCase' | 'snake_case' | 'kebab-case';
    bodyCase?: 'camelCase' | 'snake_case';
    idParam?: 'id' | '_id' | 'uuid';
  };
  
  static getAll<TResponse>(options: GetAllOptions = {}): Promise<TResponse> {
    let url = this.resource;
    
    // Aplicar convención de URL
    if (this.apiConvention?.urlCase === 'snake_case') {
      url = this.toSnakeCase(url);
    } else if (this.apiConvention?.urlCase === 'kebab-case') {
      url = this.toKebabCase(url);
    }
    
    // ... resto de la lógica
  }
}
```

**Uso:**
```typescript
export class User extends RestStd {
  static override resource = 'users';
  static apiConvention = {
    urlCase: 'snake_case', // /user_profiles en lugar de /userProfiles
    bodyCase: 'snake_case', // { first_name: 'John' } en lugar de { firstName: 'John' }
    idParam: '_id' // MongoDB style
  };
}
```

**Beneficios:**
- Soporte para diferentes APIs sin cambiar código
- Transformación automática

---

## Priorización Recomendada

### Fase 1 (Alta Prioridad - Implementar Primero)
1. **Mejor Construcción de URLs** - Soporte para relaciones anidadas
2. **Query Builders** - Construir query strings complejos más fácilmente

### Fase 2 (Media Prioridad)
3. **Transformación de Request/Response** - Hooks para transformar datos
4. **Validación de Datos** - Validar antes de enviar

### Fase 3 (Baja Prioridad - Si hay tiempo)
5. **Interceptores por Servicio** - Lógica personalizada
6. **Soporte para Diferentes Convenciones** - Flexibilidad para diferentes APIs

## Consideraciones

### Mantener Compatibilidad
- Todas las mejoras deben ser **opcionales**
- No romper código existente
- Valores por defecto que no cambien comportamiento actual

### No Duplicar Funcionalidad de TanStack Query
- ❌ NO agregar cache (TanStack Query lo hace)
- ❌ NO agregar invalidación (TanStack Query lo hace)
- ❌ NO agregar paginación compleja (TanStack Query lo hace)
- ❌ NO agregar optimistic updates (TanStack Query lo hace)
- ✅ SÍ mejorar construcción de URLs
- ✅ SÍ mejorar query builders
- ✅ SÍ agregar transformación/validación (complementa TanStack Query)

### Performance
- Las transformaciones deben ser rápidas (sincrónicas cuando sea posible)
- Los query builders deben ser eficientes
- No agregar overhead innecesario

## Conclusión

RestStd debe enfocarse en:
1. **Construir peticiones HTTP RESTful** de manera consistente
2. **Proporcionar convenciones** y patrones estándar
3. **Simplificar operaciones comunes** (bulk, FormData, relaciones)
4. **Centralizar configuración** por servicio

**NO debe:**
- Duplicar funcionalidad de TanStack Query
- Intentar ser un reemplazo de TanStack Query
- Agregar complejidad innecesaria

Las mejoras más valiosas son las que **complementan** TanStack Query:
- Mejor construcción de URLs (relaciones anidadas)
- Query builders (parámetros complejos)
- Transformación/validación (a nivel de petición HTTP, no de estado)
