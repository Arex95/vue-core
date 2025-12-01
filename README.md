# @arex95/vue-core

A comprehensive Vue.js core library designed to streamline the development of Vue applications. It provides a set of composables, utilities, and services for handling common tasks such as API communication, authentication, and data management.

## Features

- **RESTful Standard**: A standardized RESTful class (`RestStd`) that you can extend directly from your models for clean, semantic API calls (e.g., `User.getOne()`).
- **Fetching Agnostic**: Works with any fetching system (Axios, ofetch, fetch API, or custom fetchers).
- **Flexible Authentication**: JWT-based authentication system that works with any fetcher (not tied to Axios).
- **Enhanced Error Handling**: Custom error classes (`NetworkError`, `AuthError`, `ValidationError`, etc.) with structured error information.
- **Retry Logic**: Built-in retry mechanism with exponential backoff for failed requests.
- **Secure Storage**: Support for localStorage, sessionStorage, and cookies with encryption and security options (Secure, SameSite).
- **SSR/SSG Support**: Full support for server-side rendering with automatic cookie fallback.
- **Type Safety**: Improved generic types for better TypeScript inference and autocompletion.
- **Utility Functions**: A rich collection of utilities for dates, strings, validations, encryption, and more.

## Installation

```sh
npm install @arex95/vue-core
```

## Quick Start

To get started, you need to configure the library in your main `main.ts` file.

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

**Create a model:**

```typescript
import { RestStd } from '@arex95/vue-core';

export interface UserData {
  id: number;
  name: string;
  email: string;
}

export class User extends RestStd {
  static override resource = 'users';
  // fetchFn is optional if you configured Axios with configAxios()
}

// Use directly in components
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: () => User.getAll<UserData[]>(),
});
```

For more detailed usage examples, please refer to the [documentation](./docs/getting-started.md) and [EXAMPLES.md](./EXAMPLES.md) file.

## Project Structure

- **`src/composables`**: Reusable Vue composables for various functionalities.
- **`src/config`**: Global configuration for Axios, API endpoints, and tokens.
- **`src/enums`**: Enums for constants used throughout the library.
- **`src/fetchers`**: Optional helpers for creating fetchers (Axios, ofetch).
- **`src/rest`**: A standardized RESTful class (`RestStd`) for CRUD operations.
- **`src/services`**: Services for authentication and token management.
- **`src/types`**: TypeScript type definitions.
- **`src/utils`**: A collection of utility functions.

For a more in-depth explanation of the project's architecture, please see the [ARCHITECTURE.md](./ARCHITECTURE.md) file.
