# @arex95/vue-core

**Stop rewriting the same API boilerplate in every Vue project.**

`@arex95/vue-core` gives you a battle-tested foundation for REST communication, encrypted token auth, and session management — so you ship features instead of infrastructure.

```sh
npm install @arex95/vue-core
# or
pnpm add @arex95/vue-core
```

---

## Why this library?

Every Vue project ends up with the same problem: you need authentication, you need a clean way to talk to your REST API, and you need it to work the same way across every service file. The usual answer is copying patterns between projects and hoping nothing drifts.

`@arex95/vue-core` is the answer:

- **`RestStd`** — one class to extend, and your entire API layer is consistent. No more hand-writing `axios.get('/users/'+id)` everywhere.
- **Fetcher-agnostic** — bring Axios, `ofetch`, the native Fetch API, or your own fetcher. The library doesn't care.
- **Encrypted token storage** — JWTs stored with AES-CBC-256 via the Web Crypto API. Not plain text in localStorage.
- **Automatic token refresh** — 401? The library refreshes silently and retries. Your components never see it.
- **Works in Nuxt SSR** — `setupAuthInterceptors: false` gives you full control for server-side environments.

---

## Setup

```typescript
// main.ts
import { ArexVueCore } from '@arex95/vue-core';

app.use(ArexVueCore, {
  appKey:  import.meta.env.VITE_APP_KEY, // used to encrypt tokens at rest

  endpoints: {
    login:   'auth/login',
    refresh: 'auth/refresh',
    logout:  'auth/logout',
  },

  tokenKeys: {
    accessToken:  'myapp_access',   // storage key name
    refreshToken: 'myapp_refresh',
  },

  // dot-notation paths to find tokens in your API response
  tokenPaths: {
    accessToken:  'token',          // response.token
    refreshToken: 'refresh_token',  // response.refresh_token
  },
  refreshTokenPaths: {
    accessToken:  'token',
    refreshToken: 'refresh_token',
  },

  axios: {
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'X-API-Key': import.meta.env.VITE_API_KEY },
    setupAuthInterceptors: true,    // false for Nuxt SSR
  },

  onRefreshFailed: () => router.push('/login'),
});
```

---

## RestStd — the core pattern

Extend `RestStd` and get a full CRUD interface for free:

```typescript
import { RestStd } from '@arex95/vue-core';

export class ProductService extends RestStd {
  static override resource = 'catalog/products';
}

// Now use it anywhere — with TanStack Query, in composables, wherever.
const products = await ProductService.getAll({ params: { page: 1 } });
const product  = await ProductService.getOne({ id: 42 });
const created  = await ProductService.create({ data: { name: 'Widget' } });
await ProductService.patch({ id: 42, data: { price: 9.99 } });
await ProductService.delete({ id: 42 });
```

Need a custom endpoint? `customRequest` has you covered:

```typescript
export class CheckoutService extends RestStd {
  static override resource = 'sales/checkouts';

  static complete(data: PaymentData) {
    return this.customRequest({
      method: 'POST',
      url: 'sales/checkout/complete',
      data,
    });
  }
}
```

All requests go through the same globally configured Axios instance — same base URL, same headers, same auth interceptors. Consistent by default.

---

## Authentication

```typescript
import { useAuth, verifyAuth, cleanCredentials } from '@arex95/vue-core';

const { login, logout } = useAuth();

// 'local'   → localStorage  (persists across browser sessions)
// 'session' → sessionStorage (cleared on tab close)
// 'cookie'  → document.cookie
await login({ email, password }, 'local');

// Check if the user has a valid, non-expired token
const isAuthed = await verifyAuth(); // → boolean

// Logout — clears ALL storage locations so no token survives
await cleanCredentials('any');
await logout();
```

Tokens are encrypted with **AES-CBC-256** before hitting any storage. Even if someone reads your localStorage, they get ciphertext.

### Automatic token refresh

When `setupAuthInterceptors: true`, every 401 response triggers a silent refresh:

```
Request → 401
  → POST /auth/refresh (with refresh_token in body)
  → New tokens stored
  → Original request retried
  → Response returned to your code as if nothing happened
```

If the refresh also fails, `onRefreshFailed` is called — typically a redirect to `/login`.

---

## Fetcher-agnostic

Don't want Axios? Swap it out:

```typescript
import { createOfetchFetcher, configAuthFetcher } from '@arex95/vue-core';

// Use ofetch globally for auth requests
configAuthFetcher(createOfetchFetcher('https://api.example.com'));

// Or pass a custom fetcher to a specific RestStd subclass
export class UserService extends RestStd {
  static fetchFn = createOfetchFetcher('https://users.example.com');
  static override resource = 'users';
}
```

---

## Token Storage

| location | Stores in | Persistence | `"any"` reads it? |
|----------|-----------|-------------|-------------------|
| `'local'` | localStorage | Until explicitly cleared | ✅ |
| `'session'` | sessionStorage | Until tab closes | ✅ |
| `'cookie'` | document.cookie | Configurable expiry | ✅ (last) |
| `'any'` | localStorage | Until explicitly cleared | — |

`'local'` is the recommended default for SPAs — persistent, simple, and always found by the automatic interceptors.

---

## Nuxt / SSR Integration

```typescript
// plugins/arex-core.ts
export default defineNuxtPlugin({
  enforce: 'pre',
  setup() {
    const config = useRuntimeConfig();
    app.use(ArexVueCore, {
      appKey: config.public.appKey,
      // ...
      axios: {
        baseURL: config.public.apiUrl,
        setupAuthInterceptors: false, // handle headers in your own plugin
      },
      onRefreshFailed: () => navigateTo('/auth/login'),
    });
  }
});
```

With `setupAuthInterceptors: false` you control exactly how `Authorization` and other headers are attached — essential for SSR where `localStorage` doesn't exist.

---

## Error Handling

```typescript
import { handleError, NetworkError, AuthError, ValidationError } from '@arex95/vue-core';

try {
  await login(credentials, 'local');
} catch (error) {
  if (error instanceof AuthError)       showError('Invalid credentials');
  if (error instanceof NetworkError)    showError(`Connection error ${error.statusCode}`);
  if (error instanceof ValidationError) error.issues.forEach(i => setFieldError(i.field, i.message));
}
```

---

## Full API Reference

→ [docs/authentication.md](./docs/authentication.md)
→ [docs/configuration.md](./docs/configuration.md)
→ [docs/api-reference.md](./docs/api-reference.md)
→ [EXAMPLES.md](./EXAMPLES.md)

---

## Requirements

- Vue 3
- Node.js 15+ (Web Crypto API required for token encryption)
- TypeScript recommended

## License

MIT
