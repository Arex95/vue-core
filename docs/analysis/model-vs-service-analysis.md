# Análisis: Modelo vs Servicio - ¿Dónde extender RestStd?

## Pregunta

¿Tiene sentido mantener un archivo de servicio separado o el usuario puede extender `RestStd` directamente desde el modelo?

**Ejemplo:**
```typescript
// Opción A: Servicio separado
class UserService extends RestStd {
  static override resource = 'users';
}
UserService.getOne({ id: 1 });

// Opción B: Modelo directo
class User extends RestStd {
  static override resource = 'users';
}
User.getOne({ id: 1 });
```

## Análisis de Opciones

### Opción A: Servicio Separado (Patrón Actual)

**Estructura:**
```
src/
├── models/
│   └── User.ts          // Solo tipos/interfaces
├── services/
│   └── UserService.ts   // Extiende RestStd
└── components/
    └── UserList.vue     // Usa UserService
```

**Ejemplo:**
```typescript
// models/User.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

// services/UserService.ts
import { RestStd, createAxiosFetcher } from '@arex95/vue-core';
import { User } from '@/models/User';

export class UserService extends RestStd {
  static override resource = 'users';
  static fetchFn = createAxiosFetcher(axiosInstance);
}

// Uso
const user = await UserService.getOne<User>({ id: 1 });
```

**Ventajas:**
- ✅ Separación clara de responsabilidades
- ✅ Modelo solo contiene tipos/interfaces
- ✅ Servicio maneja la comunicación API
- ✅ Fácil agregar lógica de servicio sin tocar el modelo

**Desventajas:**
- ❌ Más archivos
- ❌ Más verboso
- ❌ `UserService.getOne()` es menos semántico que `User.getOne()`

---

### Opción B: Modelo Directo (Patrón ActiveRecord-like)

**Estructura:**
```
src/
├── models/
│   └── User.ts          // Extiende RestStd + tipos
└── components/
    └── UserList.vue     // Usa User directamente
```

**Ejemplo:**
```typescript
// models/User.ts
import { RestStd, createAxiosFetcher } from '@arex95/vue-core';

export interface UserData {
  id: number;
  name: string;
  email: string;
}

export class User extends RestStd {
  static override resource = 'users';
  static fetchFn = createAxiosFetcher(axiosInstance);
}

// Uso
const user = await User.getOne<UserData>({ id: 1 });
```

**Ventajas:**
- ✅ Más semántico: `User.getOne()` tiene más sentido
- ✅ Menos archivos
- ✅ Patrón común en frameworks (Laravel Eloquent, Rails ActiveRecord)
- ✅ El modelo puede tener métodos de instancia además de estáticos
- ✅ Más intuitivo: el modelo "sabe" cómo obtener sus datos

**Desventajas:**
- ⚠️ Mezcla responsabilidades (modelo + servicio)
- ⚠️ Pero esto es común y aceptado en muchos frameworks

---

### Opción C: Híbrida (Flexible)

**Permitir ambas opciones según el caso de uso:**

```typescript
// Caso 1: Modelo simple - extender directamente
class User extends RestStd {
  static override resource = 'users';
}

// Caso 2: Lógica compleja - servicio separado
class UserService extends RestStd {
  static override resource = 'users';
  
  static async getActiveUsers() {
    return this.getAll({ params: { status: 'active' } });
  }
  
  static async getUserWithPermissions(id: number) {
    return this.getOne({ id, params: { include: 'permissions' } });
  }
}
```

**Ventajas:**
- ✅ Máxima flexibilidad
- ✅ Usuario decide según su necesidad
- ✅ Simple para casos simples, completo para casos complejos

---

## Comparación con Frameworks Populares

### Laravel (Eloquent)
```php
// El modelo extiende Model y tiene métodos de query
$user = User::find(1);
$users = User::where('active', true)->get();
```
✅ **Modelo directo**

### Rails (ActiveRecord)
```ruby
# El modelo extiende ActiveRecord
user = User.find(1)
users = User.where(active: true)
```
✅ **Modelo directo**

### Django (ORM)
```python
# El modelo tiene un manager
user = User.objects.get(id=1)
users = User.objects.filter(active=True)
```
✅ **Modelo directo (con manager)**

### NestJS (TypeORM)
```typescript
// Puede ser modelo o repositorio
const user = await userRepository.findOne({ where: { id: 1 } });
```
⚠️ **Repositorio separado (pero puede ser modelo)**

---

## Recomendación: Opción B (Modelo Directo) con Flexibilidad

### Razones:

1. **Más Semántico:** `User.getOne()` es más claro que `UserService.getOne()`
2. **Menos Archivos:** No necesitas crear servicios para cada modelo
3. **Patrón Establecido:** Similar a Laravel, Rails, etc.
4. **Flexible:** Si necesitas lógica compleja, puedes crear un servicio

### Implementación Recomendada:

**Para casos simples (90% de casos):**
```typescript
// models/User.ts
import { RestStd, createAxiosFetcher } from '@arex95/vue-core';

export interface UserData {
  id: number;
  name: string;
  email: string;
}

export class User extends RestStd {
  static override resource = 'users';
  static fetchFn = createAxiosFetcher(axiosInstance);
}

// Uso directo
const user = await User.getOne<UserData>({ id: 1 });
const users = await User.getAll<UserData[]>();
```

**Para casos complejos (10% de casos):**
```typescript
// services/UserService.ts
import { User } from '@/models/User';

export class UserService extends User {
  static async getActiveUsers() {
    return this.getAll<UserData[]>({ 
      params: { status: 'active' } 
    });
  }
  
  static async getUserWithRelations(id: number) {
    return this.getOne<UserData>({ 
      id, 
      params: { include: 'permissions,roles' } 
    });
  }
}
```

### Estructura de Archivos Recomendada:

```
src/
├── models/
│   ├── User.ts          // Extiende RestStd + interface UserData
│   ├── Role.ts          // Extiende RestStd + interface RoleData
│   └── Product.ts       // Extiende RestStd + interface ProductData
└── services/            // Solo si necesitas lógica adicional
    └── UserService.ts   // Extiende User, agrega métodos complejos
```

---

## Ejemplo Completo: Modelo Directo

**Modelo (`src/models/User.ts`):**
```typescript
import axios from 'axios';
import { RestStd, createAxiosFetcher } from '@arex95/vue-core';

export interface UserData {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

const axiosInstance = axios.create({
  baseURL: 'https://api.example.com',
});

export class User extends RestStd {
  static override resource = 'users';
  static fetchFn = createAxiosFetcher(axiosInstance);
}
```

**Componente (`src/components/UserList.vue`):**
```vue
<template>
  <div>
    <div v-for="user in users" :key="user.id">
      {{ user.name }} - {{ user.email }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { User, UserData } from '@/models/User';

const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: () => User.getAll<UserData[]>(),
});
</script>
```

---

## Decisión Final

✅ **Recomendación: Modelo Directo (Opción B)**

**Razones:**
1. Más semántico y natural
2. Menos archivos y más simple
3. Patrón establecido en frameworks populares
4. Flexible: puedes crear servicios si necesitas lógica adicional

**Guía para el usuario:**
- **Usa modelo directo** para casos simples (la mayoría)
- **Crea servicio** solo si necesitas métodos complejos o lógica adicional

