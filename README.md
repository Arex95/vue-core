# @arex95/vue-core

A comprehensive Vue.js core library designed to streamline the development of Vue applications. It provides a set of composables, utilities, and services for handling common tasks such as API communication, authentication, and data management.

## Features

- **Modular Architecture**: A clean, service-based architecture that promotes separation of concerns and code reusability.
- **Authentication**: Built-in support for JWT-based authentication, including token storage, refresh logic, and route protection.
- **API Communication**: A standardized RESTful service class for easy CRUD operations, powered by a configurable Axios instance.
- **Vue Query Integration**: Wrappers for TanStack Vue Query to simplify asynchronous state management.
- **Utility Functions**: A rich collection of utilities for dates, strings, validations, and more.
- **TypeScript Support**: Fully typed to ensure code quality and provide a better developer experience.

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

For more detailed usage examples, please refer to the [EXAMPLES.md](./EXAMPLES.md) file.

## Project Structure

- **`src/composables`**: Reusable Vue composables for various functionalities.
- **`src/config`**: Global configuration for Axios, API endpoints, and tokens.
- **`src/enums`**: Enums for constants used throughout the library.
- **`src/rest`**: A standardized RESTful service class for CRUD operations.
- **`src/services`**: Services for authentication and token management.
- **`src/types`**: TypeScript type definitions.
- **`src/utils`**: A collection of utility functions.

For a more in-depth explanation of the project's architecture, please see the [ARCHITECTURE.md](./ARCHITECTURE.md) file.
