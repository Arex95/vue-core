# Análisis de Diseño: RestStd - Extend vs Instancia

## Opciones de Diseño

### Opción A: Extend con Static (Actual)

```typescript
class RoleService extends RestStd {
    static resource = 'roles';
}

// Uso
const roles = await RoleService.getAll();
```

### Opción B: Instancia con Constructor

```typescript
const roleService = new RestStd({ resource: 'roles' });

// Uso
const roles = await roleService.getAll();
```

## Análisis Comparativo

### Opción A: Extend con Static

**Ventajas:**
- ✅ **Declarativo:** Muy claro qué recurso representa cada servicio
- ✅ **Métodos estáticos:** Permite `RoleService.getAll()` directamente
- ✅ **Patrón común:** Similar a Laravel, Rails, Django REST Framework
- ✅ **Type-safe:** TypeScript puede validar que `resource` esté definido
- ✅ **Menos verboso:** No necesita instanciar
- ✅ **Inmutable:** El recurso no puede cambiar accidentalmente
- ✅ **Fácil de usar:** `RoleService.getAll()` es intuitivo
- ✅ **Permite herencia:** Puede extender servicios base
- ✅ **IDE friendly:** Autocompletado funciona bien con clases

**Desventajas:**
- ⚠️ **Validación tardía:** No se valida hasta que se usa
- ⚠️ **No puede ser dinámico:** El recurso debe ser conocido en tiempo de compilación
- ⚠️ **Requiere override:** Debe hacer `static override resource`

**Validación Propuesta:**
```typescript
export class RestStd {
    static resource: string; // Obligatorio
    
    private static validateResource() {
        if (!this.resource) {
            throw new Error(
                `${this.constructor.name} must define a static 'resource' property. ` +
                `Example: static resource = 'users';`
            );
        }
    }
    
    static getAll<T>({ params, options, url }: GetAllOptions = {}): Promise<T> {
        this.validateResource();
        // ...
    }
}
```

**Ejemplo de Uso:**
```typescript
class RoleService extends RestStd {
    static override resource = 'roles'; // TypeScript requiere 'override'
    static fetchFn = createAxiosFetcher(axiosInstance);
}

// Uso
const roles = await RoleService.getAll();
```

---

### Opción B: Instancia con Constructor

**Ventajas:**
- ✅ **Validación inmediata:** Se valida en el constructor
- ✅ **Flexible:** Puede cambiar el recurso dinámicamente
- ✅ **Estado:** Puede tener estado por instancia
- ✅ **Funcional:** Más alineado con programación funcional

**Desventajas:**
- ❌ **Más verboso:** Debe instanciar cada servicio
- ❌ **No métodos estáticos:** Requiere instancia para todo
- ❌ **Menos declarativo:** No es tan claro qué representa
- ❌ **Puede cambiar:** El recurso puede modificarse accidentalmente
- ❌ **Menos común:** No es el patrón estándar en frameworks REST
- ❌ **Requiere gestión:** Debe crear y mantener instancias

**Validación Propuesta:**
```typescript
export class RestStd {
    private resource: string;
    private fetchFn?: Fetcher;
    
    constructor(config: { resource: string; fetchFn?: Fetcher }) {
        if (!config.resource) {
            throw new Error('resource is required');
        }
        this.resource = config.resource;
        this.fetchFn = config.fetchFn;
    }
    
    getAll<T>({ params, options, url }: GetAllOptions = {}): Promise<T> {
        // ...
    }
}
```

**Ejemplo de Uso:**
```typescript
// Opción 1: Instancia única
const roleService = new RestStd({ 
    resource: 'roles',
    fetchFn: createAxiosFetcher(axiosInstance)
});

const roles = await roleService.getAll();

// Opción 2: Factory
const createService = (resource: string) => new RestStd({ resource });

const roleService = createService('roles');
```

---

## Comparación de Uso

### Escenario 1: Uso Básico

**Extend (Opción A):**
```typescript
class RoleService extends RestStd {
    static override resource = 'roles';
}

const roles = await RoleService.getAll();
```

**Instancia (Opción B):**
```typescript
const roleService = new RestStd({ resource: 'roles' });
const roles = await roleService.getAll();
```

**Ganador:** ✅ Opción A (más simple y declarativo)

---

### Escenario 2: Múltiples Servicios

**Extend (Opción A):**
```typescript
class RoleService extends RestStd {
    static override resource = 'roles';
}

class UserService extends RestStd {
    static override resource = 'users';
}

// Uso directo
const roles = await RoleService.getAll();
const users = await UserService.getAll();
```

**Instancia (Opción B):**
```typescript
const roleService = new RestStd({ resource: 'roles' });
const userService = new RestStd({ resource: 'users' });

const roles = await roleService.getAll();
const users = await userService.getAll();
```

**Ganador:** ✅ Opción A (menos verboso, más organizado)

---

### Escenario 3: Validación

**Extend (Opción A):**
```typescript
class RoleService extends RestStd {
    // Si olvida definir resource, error en tiempo de ejecución
}

// Validación en cada método
static getAll() {
    if (!this.resource) throw new Error('resource required');
}
```

**Instancia (Opción B):**
```typescript
// Validación en constructor
constructor(config: { resource: string }) {
    if (!config.resource) throw new Error('resource required');
}
```

**Ganador:** ✅ Opción B (validación más temprana), pero Opción A puede validar también

---

### Escenario 4: Flexibilidad

**Extend (Opción A):**
```typescript
// Recurso fijo, no puede cambiar
class RoleService extends RestStd {
    static override resource = 'roles';
}
```

**Instancia (Opción B):**
```typescript
// Puede crear servicios dinámicamente
const createService = (resource: string) => new RestStd({ resource });
const service = createService(dynamicResource);
```

**Ganador:** ✅ Opción B (más flexible), pero Opción A cubre 95% de casos

---

## Recomendación: Opción A Mejorada (Extend con Validación)

### Razones:

1. **Patrón estándar:** Es el patrón usado en la mayoría de frameworks REST
2. **Más simple:** `RoleService.getAll()` es más intuitivo que instanciar
3. **Type-safe:** TypeScript puede ayudar con validación
4. **Declarativo:** Es claro qué recurso representa cada servicio
5. **Métodos estáticos:** Permite API más limpia

### Mejoras Propuestas:

1. **Validación en tiempo de ejecución:**
```typescript
export class RestStd {
    static resource: string;
    
    protected static validateResource(): void {
        if (!this.resource || this.resource.trim() === '') {
            throw new Error(
                `[${this.constructor.name}] Static property 'resource' is required. ` +
                `Please define it: static override resource = 'your-resource';`
            );
        }
    }
    
    static getAll<T>({ params, options, url }: GetAllOptions = {}): Promise<T> {
        this.validateResource();
        // ...
    }
}
```

2. **TypeScript helper (opcional):**
```typescript
// Helper type para forzar que resource esté definido
type RestStdService = {
    new (): RestStd;
    resource: string;
    getAll: typeof RestStd.getAll;
    // ... otros métodos
};
```

3. **Documentación clara:**
```typescript
/**
 * Base class for RESTful services.
 * 
 * @example
 * class RoleService extends RestStd {
 *     static override resource = 'roles'; // Required!
 *     static fetchFn = createAxiosFetcher(axiosInstance);
 * }
 * 
 * // Usage
 * const roles = await RoleService.getAll();
 */
export class RestStd {
    /** 
     * The resource endpoint (e.g., 'users', 'roles', 'products').
     * MUST be overridden in subclasses.
     * 
     * @example
     * static override resource = 'users';
     */
    static resource: string;
}
```

---

## Comparación Final

| Aspecto | Extend (A) | Instancia (B) | Ganador |
|---------|-----------|---------------|---------|
| Simplicidad | ✅ Muy simple | ⚠️ Más verboso | A |
| Declarativo | ✅ Muy claro | ⚠️ Menos claro | A |
| Validación | ⚠️ Tardía | ✅ Inmediata | B |
| Flexibilidad | ⚠️ Fija | ✅ Dinámica | B |
| Patrón común | ✅ Estándar | ⚠️ Menos común | A |
| Type-safe | ✅ Sí | ✅ Sí | Empate |
| Métodos estáticos | ✅ Sí | ❌ No | A |
| IDE support | ✅ Excelente | ⚠️ Bueno | A |
| Verbosidad | ✅ Baja | ❌ Alta | A |

**Resultado:** ✅ **Opción A (Extend)** gana 6-2

---

## Decisión Final

✅ **Usar Extend con Static + Validación**

**Implementación:**
```typescript
export class RestStd {
    /** 
     * The resource endpoint. MUST be overridden in subclasses.
     * @example static override resource = 'users';
     */
    static resource: string;
    
    protected static validateResource(): void {
        if (!this.resource || this.resource.trim() === '') {
            throw new Error(
                `[${this.constructor.name}] Static property 'resource' is required. ` +
                `Please define: static override resource = 'your-resource';`
            );
        }
    }
    
    static getAll<T>({ params, options, url }: GetAllOptions = {}): Promise<T> {
        this.validateResource();
        const finalUrl = url || this.resource;
        // ...
    }
}
```

**Uso:**
```typescript
class RoleService extends RestStd {
    static override resource = 'roles'; // TypeScript requiere 'override'
    static fetchFn = createAxiosFetcher(axiosInstance);
}

// Si olvida definir resource, error claro en tiempo de ejecución
const roles = await RoleService.getAll(); // Error: resource is required
```

