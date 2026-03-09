# CONTEXT.md — @arex95/vue-core — Documentación interna completa

> Archivo de referencia para trabajar en este repositorio. Cubre arquitectura, contratos de tipos, comportamiento de cada módulo y patrones de uso.

---

## Identidad del paquete

- **Nombre publicado:** `@arex95/vue-core`
- **Versión actual:** 3.1.0
- **Descripción:** Opinionated Vue Core — librería de utilidades, composables y clase base REST para aplicaciones Vue 3
- **Build:** Rollup → `dist/index.mjs` (ESM only)
- **Entry point fuente:** `src/index.ts`
- **Package manager:** pnpm

---

## Instalación como plugin

```typescript
import { ArexVueCore } from '@arex95/vue-core'

app.use(ArexVueCore, {
  appKey: 'mi-clave-de-encriptacion',
  endpoints: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
  },
  tokenKeys: {
    accessToken: 'access_token',      // clave en localStorage/sessionStorage
    refreshToken: 'refresh_token',
  },
  tokenPaths: {
    accessToken: 'data.access_token', // dot-notation en la respuesta del login
    refreshToken: 'data.refresh_token',
  },
  refreshTokenPaths: {
    accessToken: 'data.access_token', // dot-notation en la respuesta del refresh
    refreshToken: 'data.refresh_token',
  },
  axios: {
    baseURL: 'https://api.example.com',
    headers: { 'X-App-Version': '1.0' },
    timeout: 30000,
    withCredentials: false,
  },
})
```

El `install()` llama en orden: `configAppKey → configTokenKeys → configEndpoints → configTokenPaths → configRefreshTokenPaths → configAxios`.

---

## Arquitectura general

```
src/
├── index.ts                  ← Plugin Vue + re-exporta todo
├── config/                   ← Singletons de configuración global (frozen)
│   ├── global/               ← tokensConfig, endpointsConfig, sessionConfig, keyConfig, tokenPathsConfig
│   ├── axios/                ← AxiosService class + instancia singleton
│   └── auth/                 ← authFetcher singleton
├── rest/
│   └── RestStd.ts            ← Clase base CRUD para recursos REST
├── composables/
│   ├── auth/useAuth.ts       ← login / logout
│   ├── axios/                ← axiosFetch helper + useFetch wrapper
│   ├── paginators/           ← usePagination
│   ├── sorters/              ← useSorter
│   ├── filters/              ← useFilter
│   ├── breakpoints/          ← useBreakpoint (Tailwind-based)
│   └── monitoring/           ← useApiActivity, useUserInactivity
├── fetchers/                 ← createAxiosFetcher, createOfetchFetcher
├── services/                 ← extractTokens, refreshTokens, storeTokens, credentials
├── errors/                   ← BaseError, NetworkError, AuthError, ValidationError, ServerError
├── enums/                    ← ContentTypeEnum, ExceptionEnum, ScreenSize, KeyCodeEnum, etc.
├── types/                    ← Todas las interfaces y tipos TypeScript
└── utils/                    ← Funciones puras: strings, objects, dates, storage, crypto, validations...
```

---

## config/ — Singletons globales

Cada módulo expone un par `configX()` / `getX()`. Son módulos con estado de nivel de módulo (variables de módulo), no clases. El plugin los inicializa en `install()`.

### `config/global/keyConfig.ts`
```typescript
configAppKey({ appKey: string })  // Lanza si appKey es vacío
getAppKey(): string               // Lanza si no fue configurado
```
`appKey` es la clave de encriptación AES-CBC usada en todo el almacenamiento.

### `config/global/tokensConfig.ts`
```typescript
configTokenKeys({ accessTokenKey, refreshTokenKey })
getTokenConfig(): TokensConfig    // { ACCESS_TOKEN, REFRESH_TOKEN }
```
Defaults: `access_token` / `refresh_token`.

### `config/global/endpointsConfig.ts`
```typescript
configEndpoints({ loginEndpoint, refreshEndpoint, logoutEndpoint })
getEndpointsConfig(): EndpointsConfig  // { LOGIN, REFRESH, LOGOUT }
```
Defaults: `/login`, `/refresh`, `/logout`.

### `config/global/tokenPathsConfig.ts`
```typescript
configTokenPaths({ accessTokenPath, refreshTokenPath })
configRefreshTokenPaths({ accessTokenPath, refreshTokenPath })
getTokenPathsConfig(): AuthTokenPaths
getRefreshTokenPathsConfig(): AuthTokenPaths
```
Paths en dot-notation para extraer tokens de la respuesta de la API. Default: `"data.access_token"` / `"data.refresh_token"`.

### `config/global/sessionConfig.ts`
Gestiona sesión con UUID persistido en storage encriptado.
```typescript
configSession({ sessionId?, persistencePreference? })
getSessionId(): Promise<string>
getSessionPersistence(): Promise<LocationPreference>  // "local"|"session"|"cookie"|"any"
getSessionConfig(): Promise<SessionConfig>
```
Clave en storage: `"session_config_"`. Se encripta con `appKey`.

### `config/axios/axiosInstance.ts`
```typescript
configAxios(options: AxiosServiceOptions): void
getConfiguredAxiosInstance(): AxiosInstance
```
Crea un `AxiosService` singleton. Si se llama `getConfiguredAxiosInstance()` sin configurar, crea uno con defaults vacíos.

### `config/auth/authFetcher.ts`
```typescript
configAuthFetcher(fetcher: Fetcher): void
setDefaultAuthFetcherFactory(factory: () => Fetcher): void
getDefaultAuthFetcher(): Fetcher   // Lanza si nada fue configurado
```
`configAxios()` llama automáticamente `setDefaultAuthFetcherFactory()` para que el fetcher por defecto sea Axios.

---

## AxiosService — `config/axios/axiosConfig.ts`

Clase que envuelve Axios con interceptores automáticos:

**Request interceptor:**
- Obtiene el access token con `getAuthToken(getAppKey(), "any")`
- Adjunta `Authorization: Bearer <token>` si existe
- Adjunta `cancelToken`
- Incrementa `activeRequests`

**Response interceptor (401 handling):**
- Si recibe 401 (y no es la propia llamada de refresh ni un retry):
  - Si ya hay refresh en progreso: encola la promesa
  - Si no: setea `_retry=true`, llama `refreshTokens()`, reanuda la cola con el nuevo token
  - Si el refresh falla: limpia la cola, propaga el error original
- Métodos públicos: `getActiveRequests()`, `getAxiosInstance()`, `cancelAllRequests()`, `setHeader()`, `removeHeader()`

---

## RestStd — `src/rest/RestStd.ts`

Clase base estática para recursos REST. **Se extiende, no se instancia.**

```typescript
export class Role extends RestStd {
    static override resource = 'roles';
    // opcional: static fetchFn = createAxiosFetcher(axiosInstance);
    // opcional: static isFormData = true;
    // opcional: static retryConfig = { retries: 3 };
}

// Uso:
const roles = await Role.getAll<RoleResponse[]>();
const role = await Role.getOne<RoleResponse>({ id: 1 });
const created = await Role.create<RoleResponse, RolePayload>({ data: payload });
await Role.update<RoleResponse, RolePayload>({ id: 1, data: payload });
await Role.patch<RoleResponse, Partial<RolePayload>>({ id: 1, data: partial });
await Role.delete({ id: 1 });
await Role.bulkCreate({ data: [payload1, payload2] });
await Role.bulkUpdate({ data: [payload1, payload2] });
await Role.bulkDelete({ ids: [1, 2, 3] });
await Role.upsert({ data: { id: 1, ...payload } }); // update si tiene id, create si no
await Role.customRequest({ method: 'POST', url: 'roles/special', data: payload });
```

**Propiedades estáticas:**
| Propiedad | Default | Descripción |
|---|---|---|
| `resource` | — | REQUERIDO. String del endpoint (`'users'`, `'roles'`) |
| `isFormData` | `false` | Si `true`, convierte data a FormData automáticamente |
| `headers` | `{}` | Headers globales para todas las peticiones de la clase |
| `fetchFn` | `undefined` | Fetcher custom; si no se define, usa Axios configurado |
| `retryConfig` | `undefined` | Config de reintentos con backoff |

**URL building:**
- `getAll`: usa `resource` directamente (o `url` override)
- `getOne`, `update`, `patch`, `delete`: `resource/id`
- `bulkCreate`, `bulkUpdate`, `bulkDelete`: `resource/bulk`

**FormData:** Cuando `getAll()` recibe `data` (body en GET), agrega `Content-Type: application/json` y omite `params`.

---

## Fetchers — `src/fetchers/`

Abstracción para hacer HTTP requests. El tipo `Fetcher`:
```typescript
type Fetcher = (config: FetcherConfig) => Promise<any>
interface FetcherConfig {
  method: string; url: string;
  params?: Record<string, any>; data?: any; headers?: Record<string, string>;
}
```

### `createAxiosFetcher(axiosInstance)`
Envuelve una instancia Axios. Convierte `AxiosError` → `NetworkError` automáticamente. Retorna `response.data`.

### `createOfetchFetcher(baseURL?, defaultOptions?)`
Usa `ofetch` (peer dependency opcional). Combina `baseURL + config.url`. Mapea `params → query`, `data → body`.

---

## Composables

### `useAuth(fetcher?: Fetcher)`
```typescript
const { login, logout } = useAuth()

// Login
const response = await login(
  { email, password },       // params
  'local',                   // persistence: "local"|"session"|"cookie"
  { accessTokenPath, refreshTokenPath }  // opcional, usa config global si no se pasa
)

// Logout — llama endpoint, limpia credentials, recarga página
await logout({ reason: 'manual' })
```

### `usePagination(page, total, pageSize)` — todo es `Ref<number>`
```typescript
const { totalPages, canFetchNextPage, canFetchPreviousPage } = usePagination(page, total, pageSize)
```

### `useSorter(items, criteriaList, selectedCriteria)`
Devuelve `ComputedRef<T[]>`. `criteriaList` tiene `{ value, label, field, order, type }` donde `type` es `'string'|'number'|'date'|'boolean'`.

### `useFilter(items, filterConfig)`
`filterConfig = { field, type: 'date'|'string'|'number'|'boolean', criteria }`. Para `date`: `{ startDate, endDate }`. Para `number`: `{ min, max }`. Para `string`: busca normalizando acentos, case-insensitive, por palabras.

### `useBreakpoint()`
Basado en breakpoints de Tailwind vía `@vueuse/core`. Expone combinaciones predefinidas: `sm_S`, `md_GE`, `lg_xl`, `mobile`, `tablet`, `laptop`, `desktop`, `windowWidth`, `windowHeight`, y más. Loggea chip de color en consola al cambiar de breakpoint (solo una vez por módulo).

### `useApiActivity(sessionTimeoutMin?, checkIntervalSec?)`
Defaults: 30 min timeout, 60 seg de chequeo. Agrega interceptor Axios para registrar `lastActivity` en storage. Verifica cada intervalo; si el usuario está autenticado y pasó el timeout → `logout()`.

### `useUserInactivity(timeout?, useDefaultEvents?, customEvents?)`
Default: 5 min. Escucha `mousemove`, `keydown`, `scroll`, `touchstart`. Expone `isInactive` (ref), `onTimeout(callback)`, `startInactivityTimer`, `stopInactivityTimer`, `resetInactivityTimer`.

### `useFetch(fetchFn, axiosCustomInstance?)`
Wrapper que inyecta la instancia Axios configurada en `fetchFn`. Para usarse con `@tanstack/vue-query`.

---

## Services — `src/services/`

### `extractAndValidateTokens(data, tokenPaths, errorSource)`
Usa `safeGet()` con dot-notation para extraer tokens del objeto de respuesta. Lanza si no encuentra los tokens o no son strings.

### `refreshTokens(fetcher?)`
1. Obtiene refresh token del storage con `getAuthToken(key, "any")`
2. POST a `getEndpointsConfig().REFRESH` con `{ refresh_token: token }`
3. Extrae nuevos tokens con `getRefreshTokenPathsConfig()`
4. Llama `storeTokens()` con la persistencia actual
5. Si falla: `cleanCredentials()` + `window.location.reload()`

### `storeTokens(accessToken, refreshToken, persistence)`
Llama `storeAuthToken` y `storeAuthRefreshToken` usando `getAppKey()`.

### `credentials.ts`
```typescript
getAuthToken(appKey, location): Promise<string | null>
getAuthRefreshToken(appKey, location): Promise<string | null>
storeAuthToken(token, appKey, location): Promise<void>
storeAuthRefreshToken(token, appKey, location): Promise<void>
cleanCredentials(location): Promise<void>
verifyAuth(): Promise<boolean>   // Decodifica JWT, verifica exp > now
```
`location: LocationPreference = "local"|"session"|"cookie"|"any"`. En `"any"`, busca en session → local → cookie.

---

## Utils — `src/utils/`

### `storage.ts`
```typescript
storeEncryptedItem(key, value, secretKey, location, cookieOptions?): Promise<void>
getDecryptedItem(key, secretKey, location): Promise<string | null>
```
En SSR (sin `window`): usa cookies automáticamente. `location = "any"` busca en session → local → cookie.

### `encryption.ts`
Encriptación AES-CBC con Web Crypto API.
```typescript
encrypt(plaintext: string, key: string): Promise<string>  // retorna hex
decrypt(ciphertext: string, key: string): Promise<string>
```
Internamente: `SHA-256(key)` como clave, IV aleatorio de 16 bytes prefijado al output.

### `retry.ts`
```typescript
interface RetryConfig {
  retries?: number;           // default: 3
  retryDelay?: number;        // default: 1000ms
  maxRetryDelay?: number;     // default: 10000ms
  backoffMultiplier?: number; // default: 2
  retryCondition?: (error: unknown) => boolean;
}
retryWithBackoff<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T>
```
Reintenta en: status 5xx, 408, 429, errores de red/timeout.

### `objects.ts`
Funciones clave:
- `safeGet(obj, path)` — acceso por dot-notation (`"data.user.name"`)
- `objectToFormData(data)` — para `RestStd.isFormData`
- `deepMerge`, `deepClone`, `deepEqual`, `compareObject`
- `flattenObject`, `filterObjectByKeys`, `getObjectDifferences`
- `removeEmptyProperties`, `isEmptyObject`

### `ssr.ts`
```typescript
isServer: boolean          // typeof window === 'undefined'
isClient: boolean
getStorage(): Storage | null           // localStorage o null en SSR
getSessionStorage(): Storage | null    // sessionStorage o null en SSR
getCookieStorage(): CookieStorage      // get/set/remove cookies
getPreferredStorage(): PreferredStorage // sessionStorage en cliente, cookies en SSR
```

### `debounces.ts`
- `debounce(fn, delay)` — trailing
- `throttle(fn, limit)`
- `debounceLeading`, `debounceTrailing`, `debounceLeadingTrailing`
- `debounceAsync(fn, delay)` — cancela llamadas anteriores
- `debounceAsyncWithImmediate(fn, delay)` — ejecuta inmediato + debounce
- `debounceAsyncValidator(fn, delay)` — retorna `null` si cancelado (útil para validators de formularios)

### `validations.ts`
Funciones booleanas: `isValidEmail`, `isValidURL`, `isValidPhoneNumber`, `isValidDate`, `isStrongPassword`, `isValidCreditCard`, `isValidIP`, `isValidSSN`, `isValidZIP`, `isValidHexColor`, `validateLetters`, `validateAlphanumeric`, `validateNumbers`, `isValidUsername`, `isValidAge`, `isValidExpiryDate`.

### `exports.ts`
Descargas desde browser vía Blob:
- `exportToCSV(data, filename)`
- `exportToExcel(data, filename)`
- `exportToJSON(data, filename)`
- `exportToXML(data, filename, rootElement)`
- `exportToText(data, filename)`

### `dates.ts`
- `parseDate(str)`, `formatDate(date, format)`
- `daysBetween(a, b)`, `addDays(date, n)`, `subtractDays(date, n)`
- `isLeapYear(year)`, `getStartOfMonth(date)`, `getEndOfMonth(date)`
- `calculateAge(birthdate)`, `daysToNextBirthday(birthdate)`, `ageAtDate(birthdate, date)`

### `strings.ts`
- `toCamelCase`, `toKebabCase`, `upperFirst`, `lowerFirst`
- `removeAccent`, `reverseString`, `truncateString`, `countWords`
- `replaceAll`, `generateRandomString`

### `io.ts`
Manipulación del DOM/teclado: `disableRightClick`, `disableF12Key`, `clickOutside`, `addCustomKeyboardShortcut`, `registerKeyboardShortcuts`, `createKeyMap`, `detectKeyHold`, `simulateKeyPress`, `disableCopy`, etc.

### `files.ts`
- `readFileAsText(file)`, `readFileAsDataURL(file)` — retornan Promises
- `formDataToObject(formData)`, `stringToBlob`, `bufferToBlob`
- `downloadBlob(blob, filename)`, `blobToFormData(blob, filename, fieldName)`

### `browser.ts`
- `openWindow(url, target?)`, `copyToClipboard(text)`, `scrollToTop()`, `getQueryParam(name)`

### `errors.ts`
```typescript
handleError(error: unknown): ErrorInfo | undefined
```
Detecta tipo de error (`BaseError`, `AuthError`, `NetworkError`, `ValidationError`, `ServerError`, `AxiosError`, `Error`, string) y loggea con `console.group` + estilos CSS en consola. Retorna `{ message, type }`.

---

## Errors — `src/errors/`

Jerarquía:
```
BaseError (abstract)
├── NetworkError  (code: 'NETWORK_ERROR', statusCode variable)
│   ├── .fromAxiosError(error)
│   └── .fromFetchError(error)
├── AuthError     (code: 'AUTH_ERROR', statusCode: 401)
│   ├── .unauthorized(), .tokenExpired(), .tokenInvalid(), .tokenMissing()
├── ValidationError (code: 'VALIDATION_ERROR', statusCode: 422)
│   ├── issues: ValidationIssue[]
│   ├── .fromIssues(issues), .fromField(field, message, value?)
└── ServerError   (code: 'SERVER_ERROR', statusCode variable)
    ├── .internal(), .badGateway(), .serviceUnavailable(), .gatewayTimeout()
```

`BaseError.toJSON()` retorna objeto serializable con `name`, `message`, `code`, `statusCode`, `timestamp`, `context`, `stack`.

---

## Enums — `src/enums/`

| Enum | Valores principales |
|---|---|
| `ContentTypeEnum` | `JSON`, `FORM_DATA`, `FORM_URLENCODED`, `TEXT_PLAIN`, `XML`, `HTML`, `CSV`, `PDF`, `OCTET_STREAM` |
| `ExceptionEnum` | HTTP status codes completos 100-511 + `NET_WORK_ERROR=10000`, `PAGE_NOT_DATA=10100` |
| `ScreenSize` | `XS`, `SM`, `MD`, `LG`, `XL`, `XXL` |
| `ScreenBreakpoint` | `XS=480`, `SM=576`, `MD=768`, `LG=992`, `XL=1200`, `XXL=1600` |
| `KeyCodeEnum` | `UP=38`, `DOWN=40`, `ENTER=13`, `ESC=27`, etc. |
| `StorageKeyEnum` | `TOKEN_KEY`, `LOCALE_KEY`, `USER_INFO_KEY`, etc. |
| `ErrorEnum` | `WARNING`, `ERROR`, `CRITICAL`, `NETWORK`, `AUTHENTICATION`, etc. |
| Image/Audio/Video/File/Font types | Para validación de tipos de archivo |

`screenMap`: `Map<ScreenSize, number>` para lookups de breakpoints.

---

## Types — `src/types/`

| Tipo/Interface | Descripción |
|---|---|
| `ArexVueCoreOptions` | Opciones del plugin |
| `AxiosServiceOptions` | `{ baseURL, headers?, timeout?, withCredentials? }` |
| `Fetcher` | `(config: FetcherConfig) => Promise<any>` |
| `FetcherConfig` | `{ method, url, params?, data?, headers? }` |
| `LocationPreference` | `"local" \| "session" \| "cookie" \| "any"` |
| `AuthTokenPaths` | `{ accessTokenPath?, refreshTokenPath? }` |
| `AuthResponse` | `{ [key: string]: any }` |
| `EndpointsConfig` | `{ LOGIN, REFRESH, LOGOUT }` |
| `TokensConfig` | `{ ACCESS_TOKEN, REFRESH_TOKEN }` (readonly) |
| `SessionConfig` | `{ SESSION_ID, PERSISTENCE }` |
| `DecodedJwtPayload` | `{ exp?, iat?, sub?, iss?, aud?, ...rest }` |
| `TokenValidationResult` | `{ accessToken: string, refreshToken: string }` |
| `ValidationIssue` | `{ field, message, value? }` |
| `RetryConfig` | `{ retries?, retryDelay?, maxRetryDelay?, backoffMultiplier?, retryCondition? }` |
| `RestStdOptions.*` | `GetAllOptions`, `GetOneOptions`, `CreateOptions`, `UpdateOptions`, `PatchOptions`, `DeleteOptions`, `BulkCreateOptions`, `BulkUpdateOptions`, `BulkDeleteOptions`, `UpsertOptions`, `CustomRequestOptions` |

---

## Build y release

```bash
pnpm build             # rollup -c → dist/index.mjs
pnpm release           # bump patch + changelog + commit + push + npm publish
pnpm release:minor     # bump minor
pnpm release:major     # bump major
```

El build usa `@rollup/plugin-typescript`. Genera solo ESM. Los peerDeps son externos.

ESLint: `eslint.config.js` con flat config — `@eslint/js`, `typescript-eslint`, `eslint-plugin-vue`.

TypeScript paths en `tsconfig.json`:
```
@/* → src/*
@composables/* → src/composables/*
@config/* → src/config/*
@enums/* → src/enums/*
@rest/* → src/rest/*
@services/* → src/services/*
@types/* → src/types/*
@utils/* → src/utils/*
```

**No hay tests.** No hay dev server. La validación se hace build + eslint manual.

---

## Flujo de autenticación completo

1. `app.use(ArexVueCore, options)` → inicializa todos los configs
2. `useAuth().login(credentials, 'local')` →
   - POST a `LOGIN` endpoint
   - `extractAndValidateTokens(response, tokenPaths)` extrae con dot-notation
   - `configSession({ persistencePreference: 'local' })` guarda preferencia
   - `storeTokens(access, refresh, 'local')` → encripta con AES-CBC y guarda en localStorage
3. Cada request Axios →
   - Interceptor request: `getAuthToken(appKey, 'any')` → `Authorization: Bearer <token>`
   - Si responde 401 → `refreshTokens()` → nuevo token → reintenta original
4. `useAuth().logout()` →
   - POST a `LOGOUT`
   - `cleanCredentials(persistence)` borra tokens
   - `window.location.reload()`
