# Utilidades

Esta sección documenta todas las funciones utilitarias disponibles en `@arex95/vue-core`. Estas funciones están diseñadas para ser puras y reutilizables.

## Índice

- [Manipulación de Fechas](#manipulación-de-fechas)
- [Manipulación de Strings](#manipulación-de-strings)
- [Validaciones](#validaciones)
- [Manipulación de Objetos](#manipulación-de-objetos)
- [Archivos](#archivos)
- [Exportación](#exportación)
- [Encriptación](#encriptación)
- [Storage](#storage)
- [Manejo de Errores](#manejo-de-errores)
- [Retry Logic](#retry-logic)
- [SSR/SSG Utilities](#ssrssg-utilities)
- [Navegador](#navegador)
- [Debounce y Throttle](#debounce-y-throttle)
- [I/O y Eventos](#io-y-eventos)

## Manipulación de Fechas

### `formatDate(date, format)`

Formatea una fecha según el formato especificado.

```typescript
import { formatDate } from '@arex95/vue-core';

const date = new Date();
formatDate(date, 'YYYY-MM-DD'); // '2024-01-15'
formatDate(date, 'DD/MM/YYYY'); // '15/01/2024'
```

### `parseDate(dateString)`

Parsea una cadena de fecha y retorna un objeto Date.

```typescript
import { parseDate } from '@arex95/vue-core';

parseDate('2024-01-15'); // Date object
```

### `daysBetween(startDate, endDate)`

Calcula el número de días entre dos fechas.

```typescript
import { daysBetween } from '@arex95/vue-core';

const start = new Date('2024-01-01');
const end = new Date('2024-01-15');
daysBetween(start, end); // 14
```

### `addDays(date, days)` / `subtractDays(date, days)`

Agrega o resta días a una fecha.

```typescript
import { addDays, subtractDays } from '@arex95/vue-core';

const date = new Date('2024-01-15');
addDays(date, 7); // 2024-01-22
subtractDays(date, 5); // 2024-01-10
```

### `calculateAge(birthDate)`

Calcula la edad a partir de una fecha de nacimiento.

```typescript
import { calculateAge } from '@arex95/vue-core';

const birthDate = new Date('1990-05-15');
calculateAge(birthDate); // edad actual
```

## Manipulación de Strings

### `toCamelCase(str)`

Convierte un string a camelCase.

```typescript
import { toCamelCase } from '@arex95/vue-core';

toCamelCase('hello-world'); // 'helloWorld'
toCamelCase('hello world'); // 'helloWorld'
```

### `toKebabCase(str)`

Convierte un string a kebab-case.

```typescript
import { toKebabCase } from '@arex95/vue-core';

toKebabCase('helloWorld'); // 'hello-world'
```

### `upperFirst(str)` / `lowerFirst(str)`

Convierte el primer carácter a mayúscula o minúscula.

```typescript
import { upperFirst, lowerFirst } from '@arex95/vue-core';

upperFirst('hello'); // 'Hello'
lowerFirst('Hello'); // 'hello'
```

### `removeAccent(input)`

Elimina acentos de un string.

```typescript
import { removeAccent } from '@arex95/vue-core';

removeAccent('café'); // 'cafe'
```

### `truncateString(str, maxLength)`

Trunca un string a una longitud máxima.

```typescript
import { truncateString } from '@arex95/vue-core';

truncateString('Hello World', 5); // 'Hello...'
```

### `replaceAll(str, find, replace)`

Reemplaza todas las ocurrencias de un string.

```typescript
import { replaceAll } from '@arex95/vue-core';

replaceAll('hello world hello', 'hello', 'hi'); // 'hi world hi'
```

### `generateRandomString(length)`

Genera un string aleatorio de la longitud especificada.

```typescript
import { generateRandomString } from '@arex95/vue-core';

generateRandomString(10); // 'aB3dEf9Gh1'
```

## Validaciones

### `isValidEmail(email)`

Valida si un string es un email válido.

```typescript
import { isValidEmail } from '@arex95/vue-core';

isValidEmail('user@example.com'); // true
isValidEmail('invalid-email'); // false
```

### `isValidPhoneNumber(phoneNumber)`

Valida si un string es un número de teléfono válido.

```typescript
import { isValidPhoneNumber } from '@arex95/vue-core';

isValidPhoneNumber('+1234567890'); // true
```

### `isValidURL(url)`

Valida si un string es una URL válida.

```typescript
import { isValidURL } from '@arex95/vue-core';

isValidURL('https://example.com'); // true
```

### `isStrongPassword(password)`

Valida si una contraseña es fuerte.

```typescript
import { isStrongPassword } from '@arex95/vue-core';

isStrongPassword('MyP@ssw0rd'); // true
```

### `isValidCreditCard(cardNumber)`

Valida si un número de tarjeta de crédito es válido (algoritmo de Luhn).

```typescript
import { isValidCreditCard } from '@arex95/vue-core';

isValidCreditCard('4532015112830366'); // true
```

### `validateNumbers(e)`

Valida que solo se ingresen números en un evento de teclado.

```typescript
import { validateNumbers } from '@arex95/vue-core';

<input @keypress="validateNumbers" />
```

### `validateLetters(e)`

Valida que solo se ingresen letras en un evento de teclado.

```typescript
import { validateLetters } from '@arex95/vue-core';

<input @keypress="validateLetters" />
```

## Manipulación de Objetos

### `deepClone(obj)`

Crea una copia profunda de un objeto.

```typescript
import { deepClone } from '@arex95/vue-core';

const original = { a: { b: 1 } };
const cloned = deepClone(original);
```

### `deepEqual(obj1, obj2)`

Compara dos objetos en profundidad.

```typescript
import { deepEqual } from '@arex95/vue-core';

deepEqual({ a: 1 }, { a: 1 }); // true
```

### `deepMerge(target, source)`

Fusiona dos objetos en profundidad.

```typescript
import { deepMerge } from '@arex95/vue-core';

const target = { a: 1, b: { c: 2 } };
const source = { b: { d: 3 } };
deepMerge(target, source); // { a: 1, b: { c: 2, d: 3 } }
```

### `objectToQueryString(obj)`

Convierte un objeto a query string.

```typescript
import { objectToQueryString } from '@arex95/vue-core';

objectToQueryString({ name: 'John', age: 30 }); // 'name=John&age=30'
```

### `objectToFormData(obj)`

Convierte un objeto a FormData.

```typescript
import { objectToFormData } from '@arex95/vue-core';

const formData = objectToFormData({ name: 'John', file: fileObject });
```

### `flattenObject(obj)`

Aplana un objeto anidado.

```typescript
import { flattenObject } from '@arex95/vue-core';

flattenObject({ a: { b: { c: 1 } } }); // { 'a.b.c': 1 }
```

### `isEmptyObject(obj)`

Verifica si un objeto está vacío.

```typescript
import { isEmptyObject } from '@arex95/vue-core';

isEmptyObject({}); // true
isEmptyObject({ a: 1 }); // false
```

## Archivos

### `readFileAsText(file)`

Lee un archivo como texto.

```typescript
import { readFileAsText } from '@arex95/vue-core';

const file = event.target.files[0];
const text = await readFileAsText(file);
```

### `readFileAsDataURL(file)`

Lee un archivo como Data URL.

```typescript
import { readFileAsDataURL } from '@arex95/vue-core';

const file = event.target.files[0];
const dataURL = await readFileAsDataURL(file);
```

### `downloadBlob(blob, fileName)`

Descarga un blob como archivo.

```typescript
import { downloadBlob } from '@arex95/vue-core';

const blob = new Blob(['content'], { type: 'text/plain' });
downloadBlob(blob, 'file.txt');
```

### `formDataToObject(formData)`

Convierte FormData a objeto.

```typescript
import { formDataToObject } from '@arex95/vue-core';

const formData = new FormData();
formData.append('name', 'John');
const obj = formDataToObject(formData); // { name: 'John' }
```

## Exportación

### `exportToCSV(headers, data, fileName)`

Exporta datos a CSV.

```typescript
import { exportToCSV } from '@arex95/vue-core';

exportToCSV(
  ['Name', 'Age'],
  [['John', 30], ['Jane', 25]],
  'users.csv'
);
```

### `exportToExcel(headers, data, fileName)`

Exporta datos a Excel.

```typescript
import { exportToExcel } from '@arex95/vue-core';

exportToExcel(
  ['Name', 'Age'],
  [['John', 30], ['Jane', 25]],
  'users.xlsx'
);
```

### `exportToJSON(data, fileName)`

Exporta datos a JSON.

```typescript
import { exportToJSON } from '@arex95/vue-core';

exportToJSON([{ name: 'John' }, { name: 'Jane' }], 'users.json');
```

## Encriptación

### `encrypt(data, secretKey)`

Encripta datos usando AES-GCM.

```typescript
import { encrypt } from '@arex95/vue-core';

const encrypted = await encrypt('sensitive data', 'secret-key');
```

### `decrypt(encryptedData, secretKey)`

Desencripta datos.

```typescript
import { decrypt } from '@arex95/vue-core';

const decrypted = await decrypt(encrypted, 'secret-key');
```

## Storage

### `storeEncryptedItem(key, value, secretKey, location, cookieOptions?)`

Almacena un item encriptado en localStorage, sessionStorage o cookies.

**Parámetros:**
- `key`: Clave del item
- `value`: Valor a encriptar y almacenar
- `secretKey`: Clave secreta para encriptación
- `location`: `'local' | 'session' | 'cookie'`
- `cookieOptions` (opcional): Opciones para cookies (solo si location es 'cookie')

```typescript
import { storeEncryptedItem, CookieOptions } from '@arex95/vue-core';

// localStorage
await storeEncryptedItem('user', userData, 'secret-key', 'local');

// sessionStorage
await storeEncryptedItem('user', userData, 'secret-key', 'session');

// Cookies con opciones personalizadas
const cookieOptions: CookieOptions = {
  expires: 30,
  secure: true,
  sameSite: 'Strict',
  path: '/',
};
await storeEncryptedItem('user', userData, 'secret-key', 'cookie', cookieOptions);
```

### `getDecryptedItem(key, secretKey, location)`

Obtiene y desencripta un item de localStorage, sessionStorage o cookies.

**Parámetros:**
- `key`: Clave del item
- `secretKey`: Clave secreta para desencriptación
- `location`: `'local' | 'session' | 'cookie' | 'any'` (busca en todos si es 'any')

```typescript
import { getDecryptedItem } from '@arex95/vue-core';

// Buscar en localStorage
const userData = await getDecryptedItem('user', 'secret-key', 'local');

// Buscar en sessionStorage
const userData = await getDecryptedItem('user', 'secret-key', 'session');

// Buscar en cookies
const userData = await getDecryptedItem('user', 'secret-key', 'cookie');

// Buscar en todos (sessionStorage, localStorage, cookies)
const userData = await getDecryptedItem('user', 'secret-key', 'any');
```

## Navegador

### `copyToClipboard(text)`

Copia texto al portapapeles.

```typescript
import { copyToClipboard } from '@arex95/vue-core';

await copyToClipboard('Text to copy');
```

### `scrollToTop(duration)`

Hace scroll suave hacia arriba.

```typescript
import { scrollToTop } from '@arex95/vue-core';

scrollToTop(500); // 500ms de duración
```

### `getQueryParam(paramName)`

Obtiene un parámetro de la URL.

```typescript
import { getQueryParam } from '@arex95/vue-core';

// URL: ?id=123
getQueryParam('id'); // '123'
```

## Manejo de Errores

### `handleError(error)`

Maneja y loggea errores con información estructurada.

```typescript
import { handleError, ErrorInfo, NetworkError, AuthError } from '@arex95/vue-core';

try {
  await someOperation();
} catch (error) {
  const errorInfo = handleError(error);
  
  if (errorInfo) {
    console.log('Error message:', errorInfo.message);
    console.log('Error type:', errorInfo.type);
    console.log('Error data:', errorInfo.errorData);
    
    // Manejar según el tipo
    if (error instanceof NetworkError) {
      console.log('Status code:', error.statusCode);
      console.log('Context:', error.context);
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

### Clases de Error

#### `NetworkError`

Errores de red o comunicación HTTP.

```typescript
import { NetworkError } from '@arex95/vue-core';

// Crear manualmente
const error = new NetworkError('Request failed', 500, originalError, { url: '/api/users' });

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

#### `AuthError`

Errores de autenticación.

```typescript
import { AuthError } from '@arex95/vue-core';

const unauthorized = AuthError.unauthorized('Access denied');
const expired = AuthError.tokenExpired();
const invalid = AuthError.tokenInvalid();
const missing = AuthError.tokenMissing();
```

#### `ValidationError`

Errores de validación con múltiples issues.

```typescript
import { ValidationError } from '@arex95/vue-core';

// Múltiples issues
const error = ValidationError.fromIssues([
  { field: 'email', message: 'Invalid email', value: 'invalid' },
  { field: 'password', message: 'Too short', value: '123' }
]);

// Un solo campo
const error = ValidationError.fromField('email', 'Invalid email', 'invalid@');
```

#### `ServerError`

Errores del servidor (5xx).

```typescript
import { ServerError } from '@arex95/vue-core';

const internal = ServerError.internal('Server error');
const badGateway = ServerError.badGateway();
const unavailable = ServerError.serviceUnavailable();
const timeout = ServerError.gatewayTimeout();
```

## Retry Logic

### `retryWithBackoff(fn, config?)`

Ejecuta una función con retry automático y exponential backoff.

```typescript
import { retryWithBackoff, RetryConfig } from '@arex95/vue-core';

const config: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  maxRetryDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error) => {
    // Solo reintentar en errores recuperables
    return error.statusCode >= 500;
  }
};

const result = await retryWithBackoff(
  () => fetchData(),
  config
);
```

**Configuración:**
- `retries`: Número de reintentos (por defecto: 3)
- `retryDelay`: Delay inicial en ms (por defecto: 1000)
- `maxRetryDelay`: Delay máximo en ms (por defecto: 10000)
- `backoffMultiplier`: Multiplicador para exponential backoff (por defecto: 2)
- `retryCondition`: Función que determina si se debe reintentar (por defecto: errores 5xx, timeouts, errores de red)

## SSR/SSG Utilities

### `isServer` / `isClient`

Detecta si el código se está ejecutando en servidor o cliente.

```typescript
import { isServer, isClient } from '@arex95/vue-core';

if (isServer) {
  // Código solo en servidor
}

if (isClient) {
  // Código solo en cliente
}
```

### `getStorage()` / `getSessionStorage()`

Obtiene acceso seguro a localStorage o sessionStorage (retorna `null` en servidor).

```typescript
import { getStorage, getSessionStorage } from '@arex95/vue-core';

const storage = getStorage();
storage?.setItem('key', 'value');

const sessionStorage = getSessionStorage();
sessionStorage?.setItem('key', 'value');
```

### `getCookieStorage()`

Obtiene una API compatible con Storage para cookies.

```typescript
import { getCookieStorage, CookieOptions } from '@arex95/vue-core';

const cookieStorage = getCookieStorage();

const options: CookieOptions = {
  expires: 30,
  path: '/',
  secure: true,
  sameSite: 'Strict',
};

cookieStorage.setItem('key', 'value', options);
const value = cookieStorage.getItem('key');
cookieStorage.removeItem('key', { path: '/' });
```

### `getPreferredStorage()`

Obtiene el storage preferido (cookies en servidor, localStorage en cliente).

```typescript
import { getPreferredStorage } from '@arex95/vue-core';

const storage = getPreferredStorage();
storage.setItem('key', 'value');
const value = storage.getItem('key');
```

## Debounce y Throttle

### `debounce(func, wait)`

Aplica debounce a una función.

```typescript
import { debounce } from '@arex95/vue-core';

const debouncedSearch = debounce((query) => {
  console.log('Searching:', query);
}, 300);
```

### `throttle(func, limit)`

Aplica throttle a una función.

```typescript
import { throttle } from '@arex95/vue-core';

const throttledScroll = throttle(() => {
  console.log('Scrolling');
}, 100);
```

### `debounceAsync(func, wait)`

Debounce para funciones asíncronas.

```typescript
import { debounceAsync } from '@arex95/vue-core';

const debouncedFetch = debounceAsync(async (query) => {
  return await fetchData(query);
}, 300);
```

## I/O y Eventos

### `disableRightClick()`

Deshabilita el clic derecho.

```typescript
import { disableRightClick } from '@arex95/vue-core';

disableRightClick();
```

### `clickOutside(element, callback)`

Ejecuta un callback cuando se hace clic fuera de un elemento.

```typescript
import { clickOutside } from '@arex95/vue-core';

const element = document.getElementById('menu');
clickOutside(element, () => {
  console.log('Clicked outside');
});
```

### `addCustomKeyboardShortcut(key, callback, options)`

Agrega un atajo de teclado personalizado.

```typescript
import { addCustomKeyboardShortcut } from '@arex95/vue-core';

addCustomKeyboardShortcut('s', () => {
  console.log('Save');
}, { ctrlKey: true });
```

