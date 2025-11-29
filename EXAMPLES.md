# Usage Examples

This document provides practical examples of how to use the `@arex95/vue-core` library in a Vue.js project.

## 1. Initial Configuration

First, you need to configure the library in your main `main.ts` file.

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

## 2. Authentication

You can use the `useAuth` composable to handle login and logout.

```vue
<template>
  <div>
    <button @click="loginUser">Login</button>
    <button @click="logoutUser">Logout</button>
  </div>
</template>

<script setup>
import { useAuth } from '@arex95/vue-core';

const { login, logout } = useAuth();

const loginUser = async () => {
  try {
    await login({
      username: 'user@example.com',
      password: 'password',
    }, 'local');
    console.log('Login successful');
  } catch (error) {
    console.error('Login failed:', error);
  }
};

const logoutUser = () => {
  logout();
};
</script>
```

## 3. Fetching Data

You can use the `useFetch` and `useVueQuery` composables to fetch data from your API.

```vue
<template>
  <div>
    <div v-if="isLoading">Loading...</div>
    <div v-if="error">An error occurred: {{ error.message }}</div>
    <ul v-if="data">
      <li v-for="item in data" :key="item.id">{{ item.name }}</li>
    </ul>
  </div>
</template>

<script setup>
import { useFetch, useVueQuery } from '@arex95/vue-core';
import { axiosFetch } from '@arex95/vue-core/composables/axios/axiosFetch';

const fetchItems = useFetch(axiosFetch);

const { data, error, isLoading } = useVueQuery(
  ...fetchItems({ url: '/items' }),
);
</script>
```

## 4. Using Utility Functions

The library provides a variety of utility functions. Here's how you might use some of them:

```typescript
import { formatDate, toCamelCase, isValidEmail } from '@arex95/vue-core';

// Date formatting
const today = new Date();
const formattedDate = formatDate(today, 'YYYY-MM-DD');
console.log(formattedDate); // e.g., '2023-10-27'

// String manipulation
const camelCaseString = toCamelCase('hello-world');
console.log(camelCaseString); // 'helloWorld'

// Validation
const isValid = isValidEmail('test@example.com');
console.log(isValid); // true
```

These examples cover some of the most common use cases of the library. For more details on the available functions and composables, please refer to the source code documentation.
