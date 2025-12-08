# Análisis Detallado: Query Builder para RestStd

## El Problema Actual

### Situación Actual
```typescript
// Actualmente, pasas params directamente:
const users = await User.getAll({
  params: {
    status: 'active',
    role: 'admin',
    page: 1,
    per_page: 20
  }
});
// → GET /users?status=active&role=admin&page=1&per_page=20
```

**Esto funciona bien para casos simples**, pero cuando necesitas:

### Problemas Reales

#### 1. Filtros Anidados (Múltiples Convenciones)

**Laravel/PHP Style:**
```
?filter[status]=active&filter[role]=admin&filter[created_at][gte]=2024-01-01
```

**Rails Style:**
```
?status=active&role=admin&created_at_gte=2024-01-01
```

**JSON:API Style:**
```
?filter[status][eq]=active&filter[role][eq]=admin&filter[created_at][gte]=2024-01-01
```

**Sin Query Builder (actual):**
```typescript
// Tienes que construir manualmente - propenso a errores
const users = await User.getAll({
  params: {
    'filter[status]': 'active',
    'filter[role]': 'admin',
    'filter[created_at][gte]': '2024-01-01'
  }
});
// Fácil cometer errores: 'filter[status' en lugar de 'filter[status]'
```

#### 2. Ordenamiento Múltiple

**Necesitas:**
```
?sort[0][field]=name&sort[0][order]=asc&sort[1][field]=created_at&sort[1][order]=desc
```

**Sin Query Builder:**
```typescript
// Muy verboso y propenso a errores
const users = await User.getAll({
  params: {
    'sort[0][field]': 'name',
    'sort[0][order]': 'asc',
    'sort[1][field]': 'created_at',
    'sort[1][order]': 'desc'
  }
});
```

#### 3. Includes/Relations (Eager Loading)

**Necesitas:**
```
?include=permissions,roles,profile
```

**O más complejo:**
```
?include=permissions,roles,profile.posts,profile.posts.comments
```

**Sin Query Builder:**
```typescript
// Funciona, pero no es type-safe
const users = await User.getAll({
  params: {
    include: 'permissions,roles,profile.posts,profile.posts.comments'
  }
});
```

#### 4. Búsqueda con Múltiples Campos

**Necesitas:**
```
?search=john&search_fields=name,email
```

**O:**
```
?q=john&fields=name,email
```

**Sin Query Builder:**
```typescript
// Funciona, pero inconsistente entre servicios
const users = await User.getAll({
  params: {
    search: 'john',
    search_fields: 'name,email'
  }
});
```

---

## Solución: Query Builder

### Concepto

Un **Query Builder** es una API fluida (fluent API) que te permite construir query strings complejos de manera más clara, type-safe y menos propensa a errores.

### Enfoques Posibles

#### Enfoque 1: Método Estático Helper (Simple)

```typescript
export class RestStd {
  static buildQuery(params: {
    filter?: Record<string, any>;
    sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
    include?: string[];
    page?: number;
    perPage?: number;
    search?: string;
  }): Record<string, unknown> {
    const query: Record<string, unknown> = {};
    
    // Filters
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }
    
    // Sort
    if (params.sort) {
      params.sort.forEach((sort, index) => {
        query[`sort[${index}][field]`] = sort.field;
        query[`sort[${index}][order]`] = sort.order;
      });
    }
    
    // Include
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
  params: User.buildQuery({
    filter: { status: 'active', role: 'admin' },
    sort: [
      { field: 'name', order: 'asc' },
      { field: 'created_at', order: 'desc' }
    ],
    include: ['permissions', 'roles'],
    page: 1,
    perPage: 20,
    search: 'john'
  })
});
```

**Pros:**
- ✅ Simple de implementar
- ✅ Fácil de usar
- ✅ Type-safe

**Contras:**
- ❌ Solo soporta una convención (Laravel style)
- ❌ No es extensible
- ❌ No es fluido (fluent API)

---

#### Enfoque 2: Clase QueryBuilder (Fluent API)

```typescript
class QueryBuilder {
  private params: Record<string, unknown> = {};
  private convention: 'laravel' | 'rails' | 'jsonapi' = 'laravel';
  
  filter(field: string, value: any): this;
  filter(filters: Record<string, any>): this;
  filter(field: string, operator: string, value: any): this;
  
  sort(field: string, order?: 'asc' | 'desc'): this;
  sort(sorts: Array<{ field: string; order: 'asc' | 'desc' }>): this;
  
  include(...relations: string[]): this;
  
  page(num: number): this;
  perPage(num: number): this;
  
  search(term: string, fields?: string[]): this;
  
  build(): Record<string, unknown>;
}

export class RestStd {
  static query(): QueryBuilder {
    return new QueryBuilder();
  }
}
```

**Uso:**
```typescript
const users = await User.getAll({
  params: User.query()
    .filter({ status: 'active', role: 'admin' })
    .filter('created_at', 'gte', '2024-01-01')
    .sort('name', 'asc')
    .sort('created_at', 'desc')
    .include('permissions', 'roles', 'profile')
    .page(1)
    .perPage(20)
    .search('john', ['name', 'email'])
    .build()
});
```

**Pros:**
- ✅ API fluida y legible
- ✅ Encadenable (chainable)
- ✅ Más flexible
- ✅ Puede soportar múltiples convenciones

**Contras:**
- ❌ Más complejo de implementar
- ❌ Más código
- ❌ Puede ser overkill para casos simples

---

#### Enfoque 3: Híbrido (Recomendado)

Combinar ambos: método simple para casos comunes + QueryBuilder para casos complejos.

```typescript
export class RestStd {
  // Método simple para casos comunes
  static buildQuery(params: {
    filter?: Record<string, any>;
    sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
    include?: string[];
    page?: number;
    perPage?: number;
    search?: string;
  }): Record<string, unknown> {
    // Implementación simple
  }
  
  // QueryBuilder para casos complejos
  static query(): QueryBuilder {
    return new QueryBuilder();
  }
}
```

**Uso Simple:**
```typescript
// Casos simples
const users = await User.getAll({
  params: User.buildQuery({
    filter: { status: 'active' },
    page: 1,
    perPage: 20
  })
});
```

**Uso Complejo:**
```typescript
// Casos complejos
const users = await User.getAll({
  params: User.query()
    .filter('status', 'eq', 'active')
    .filter('created_at', 'gte', '2024-01-01')
    .filter('created_at', 'lte', '2024-12-31')
    .sort('name', 'asc')
    .include('permissions', 'roles')
    .build()
});
```

---

## Convenciones de API Comunes

### 1. Laravel/PHP Style (Más Común)

```
?filter[status]=active
?filter[created_at][gte]=2024-01-01
?sort[0][field]=name&sort[0][order]=asc
?include=permissions,roles
?page=1&per_page=20
```

### 2. Rails Style

```
?status=active
?created_at_gte=2024-01-01
?sort=name:asc,created_at:desc
?include=permissions,roles
?page=1&per_page=20
```

### 3. JSON:API Style

```
?filter[status][eq]=active
?filter[created_at][gte]=2024-01-01
?sort=name,-created_at
?include=permissions,roles
?page[number]=1&page[size]=20
```

### 4. Custom/Simple

```
?status=active
?created_at_min=2024-01-01
?order_by=name&order=asc
?with=permissions,roles
?page=1&limit=20
```

---

## Propuesta: QueryBuilder Flexible

### Diseño

```typescript
interface QueryBuilderConfig {
  convention?: 'laravel' | 'rails' | 'jsonapi' | 'simple';
  filterPrefix?: string; // 'filter' | '' | 'f'
  sortFormat?: 'array' | 'comma' | 'multiple';
  includeKey?: string; // 'include' | 'with' | 'expand'
  pageKey?: string; // 'page' | 'page[number]'
  perPageKey?: string; // 'per_page' | 'perPage' | 'limit' | 'page[size]'
}

class QueryBuilder {
  private params: Record<string, unknown> = {};
  private config: QueryBuilderConfig;
  
  constructor(config?: QueryBuilderConfig) {
    this.config = {
      convention: 'laravel',
      filterPrefix: 'filter',
      sortFormat: 'array',
      includeKey: 'include',
      pageKey: 'page',
      perPageKey: 'per_page',
      ...config
    };
  }
  
  // Filters
  filter(field: string, value: any): this;
  filter(filters: Record<string, any>): this;
  filter(field: string, operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in', value: any): this;
  
  // Sort
  sort(field: string, order?: 'asc' | 'desc'): this;
  sort(sorts: Array<{ field: string; order: 'asc' | 'desc' }>): this;
  
  // Include
  include(...relations: string[]): this;
  
  // Pagination
  page(num: number): this;
  perPage(num: number): this;
  limit(num: number): this; // Alias de perPage
  
  // Search
  search(term: string, fields?: string[]): this;
  
  // Custom params
  param(key: string, value: any): this;
  params(obj: Record<string, any>): this;
  
  // Build
  build(): Record<string, unknown>;
  toQueryString(): string; // Opcional: retornar string directamente
}

export class RestStd {
  static queryBuilderConfig?: QueryBuilderConfig;
  
  static query(): QueryBuilder {
    return new QueryBuilder(this.queryBuilderConfig);
  }
  
  // Método helper simple (opcional)
  static buildQuery(params: {
    filter?: Record<string, any>;
    sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
    include?: string[];
    page?: number;
    perPage?: number;
    search?: string;
  }): Record<string, unknown> {
    return this.query()
      .filter(params.filter || {})
      .sort(params.sort || [])
      .include(...(params.include || []))
      .page(params.page || 1)
      .perPage(params.perPage || 10)
      .search(params.search || '')
      .build();
  }
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Caso Simple

```typescript
// Sin Query Builder
const users = await User.getAll({
  params: {
    status: 'active',
    page: 1,
    per_page: 20
  }
});

// Con Query Builder (simple)
const users = await User.getAll({
  params: User.buildQuery({
    filter: { status: 'active' },
    page: 1,
    perPage: 20
  })
});

// Con Query Builder (fluent)
const users = await User.getAll({
  params: User.query()
    .filter('status', 'active')
    .page(1)
    .perPage(20)
    .build()
});
```

### Ejemplo 2: Filtros Complejos

```typescript
// Sin Query Builder (propenso a errores)
const users = await User.getAll({
  params: {
    'filter[status]': 'active',
    'filter[role]': 'admin',
    'filter[created_at][gte]': '2024-01-01',
    'filter[created_at][lte]': '2024-12-31',
    'filter[tags][in]': 'premium,vip'
  }
});

// Con Query Builder (claro y type-safe)
const users = await User.getAll({
  params: User.query()
    .filter('status', 'eq', 'active')
    .filter('role', 'eq', 'admin')
    .filter('created_at', 'gte', '2024-01-01')
    .filter('created_at', 'lte', '2024-12-31')
    .filter('tags', 'in', ['premium', 'vip'])
    .build()
});
```

### Ejemplo 3: Ordenamiento Múltiple

```typescript
// Sin Query Builder
const users = await User.getAll({
  params: {
    'sort[0][field]': 'name',
    'sort[0][order]': 'asc',
    'sort[1][field]': 'created_at',
    'sort[1][order]': 'desc'
  }
});

// Con Query Builder
const users = await User.getAll({
  params: User.query()
    .sort('name', 'asc')
    .sort('created_at', 'desc')
    .build()
});

// O con array
const users = await User.getAll({
  params: User.query()
    .sort([
      { field: 'name', order: 'asc' },
      { field: 'created_at', order: 'desc' }
    ])
    .build()
});
```

### Ejemplo 4: Diferentes Convenciones

```typescript
// Laravel style (por defecto)
export class User extends RestStd {
  static override resource = 'users';
  // Usa convención Laravel por defecto
}

// Rails style
export class Product extends RestStd {
  static override resource = 'products';
  static queryBuilderConfig = {
    convention: 'rails',
    filterPrefix: '', // Sin prefijo
    sortFormat: 'comma', // name:asc,created_at:desc
    includeKey: 'include'
  };
}

// JSON:API style
export class Order extends RestStd {
  static override resource = 'orders';
  static queryBuilderConfig = {
    convention: 'jsonapi',
    pageKey: 'page[number]',
    perPageKey: 'page[size]'
  };
}
```

---

## Ventajas del Query Builder

### 1. Type Safety
```typescript
// TypeScript puede validar los operadores
.filter('status', 'eq', 'active') // ✅
.filter('status', 'invalid', 'active') // ❌ Error de TypeScript
```

### 2. Menos Errores
```typescript
// Sin Query Builder: fácil cometer errores
'filter[status' // ❌ Falta el ]
'filter[status]' // ✅ Correcto

// Con Query Builder: imposible cometer errores
.filter('status', 'active') // ✅ Siempre correcto
```

### 3. Legibilidad
```typescript
// Sin Query Builder: difícil de leer
params: {
  'filter[status]': 'active',
  'filter[role]': 'admin',
  'sort[0][field]': 'name',
  'sort[0][order]': 'asc'
}

// Con Query Builder: muy claro
params: User.query()
  .filter('status', 'active')
  .filter('role', 'admin')
  .sort('name', 'asc')
  .build()
```

### 4. Reutilización
```typescript
// Puedes crear queries base y reutilizarlas
const activeUsersQuery = User.query()
  .filter('status', 'active')
  .include('permissions');

// Usar en diferentes lugares
const users1 = await User.getAll({
  params: activeUsersQuery.sort('name', 'asc').build()
});

const users2 = await User.getAll({
  params: activeUsersQuery.sort('created_at', 'desc').build()
});
```

### 5. Extensibilidad
```typescript
// Fácil agregar nuevos métodos
class QueryBuilder {
  // ... métodos existentes
  
  // Nuevo método para rangos de fechas
  dateRange(field: string, from: string, to: string): this {
    return this
      .filter(field, 'gte', from)
      .filter(field, 'lte', to);
  }
}

// Uso
const users = await User.getAll({
  params: User.query()
    .dateRange('created_at', '2024-01-01', '2024-12-31')
    .build()
});
```

---

## Consideraciones de Implementación

### 1. Compatibilidad Hacia Atrás
- ✅ Debe ser **opcional**
- ✅ El método actual `params: Record<string, unknown>` debe seguir funcionando
- ✅ Query Builder es una **mejora**, no un reemplazo

### 2. Performance
- ✅ Query Builder debe ser ligero
- ✅ No agregar overhead significativo
- ✅ `build()` debe ser rápido

### 3. Flexibilidad
- ✅ Soporte para múltiples convenciones
- ✅ Permitir parámetros custom
- ✅ No forzar una convención específica

### 4. Simplicidad
- ✅ Método simple (`buildQuery`) para casos comunes
- ✅ Query Builder completo para casos complejos
- ✅ No sobrecargar la API

---

## Recomendación Final

### Implementar Enfoque Híbrido

1. **Método simple** (`buildQuery`) para casos comunes (80% de casos)
2. **QueryBuilder completo** para casos complejos (20% de casos)
3. **Configuración por servicio** para diferentes convenciones de API
4. **Opcional** - no rompe código existente

### Prioridad: Alta

**Razones:**
- Resuelve un problema real (query strings complejos)
- Mejora developer experience significativamente
- No compite con TanStack Query (solo construye params)
- Complementa perfectamente RestStd

### Fase de Implementación

1. **Fase 1:** Método simple `buildQuery()` con convención Laravel
2. **Fase 2:** QueryBuilder completo con fluent API
3. **Fase 3:** Soporte para múltiples convenciones
4. **Fase 4:** Extensibilidad y métodos helper

---

## Conclusión

El Query Builder es una mejora valiosa que:
- ✅ Resuelve problemas reales (query strings complejos)
- ✅ Mejora type safety y reduce errores
- ✅ Mejora legibilidad del código
- ✅ No compite con TanStack Query
- ✅ Complementa perfectamente RestStd
- ✅ Es opcional (no rompe código existente)

**Vale la pena implementarlo.**

