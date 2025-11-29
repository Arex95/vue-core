# Architecture Overview

This document provides a high-level overview of the architecture of the `@arex95/vue-core` library. It is intended to help developers understand the structure of the codebase, the roles of the different modules, and how they interact with each other.

## Core Concepts

The library is designed to provide a set of core functionalities for building Vue.js applications, with a focus on authentication, API communication, and utility functions. The architecture is modular, with each module responsible for a specific set of tasks.

## Module Breakdown

The library is divided into the following main modules:

### `src/config`

This module is responsible for the global configuration of the library. It provides functions to set up the application key, API endpoints, token storage keys, and Axios instance. The configuration is done once at the application's entry point and the settings are then used by the other modules.

### `src/composables`

This module contains Vue composables that provide reactive functionalities for common tasks such as authentication, data fetching, and breakpoint management. These composables are designed to be used within Vue components to manage state and logic in a clean and reusable way.

### `src/enums`

This module defines a set of enums for various constants used throughout the library, such as screen sizes, content types, error types, and storage keys. Using enums helps to avoid magic strings and ensures consistency.

### `src/rest`

This module provides a standardized way to interact with a RESTful API. The `RestStd` class offers a generic interface for performing CRUD operations on a specific API resource, and it can be extended to create resource-specific services.

### `src/services`

This module contains services related to authentication and token management. It includes functions for storing and retrieving tokens, refreshing tokens, and verifying the user's authentication status.

### `src/types`

This module defines the TypeScript types and interfaces used throughout the library. This ensures type safety and provides clear contracts for the data structures used in the different modules.

### `src/utils`

This module provides a collection of utility functions for common tasks such as date manipulation, string operations, encryption, and validation. These functions are designed to be pure and reusable.

## Inter-Module Communication

The modules are designed to be loosely coupled, with clear dependencies between them.

- The `config` module is a central piece that provides configuration to many other modules.
- The `composables` make use of the `services` to interact with the API and manage authentication.
- The `rest` module uses the configured `axios` instance from the `config` module to make HTTP requests.
- The `services` use the `utils` for tasks like encryption and storage.
- The `types` are used across all modules to ensure type safety.

This modular architecture makes the library easy to maintain and extend. New functionalities can be added as new modules or by extending existing ones, without affecting the rest of the codebase.
