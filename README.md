# @arex95/vue-core

Opinionated Vue Core

## Descripción

Este proyecto es un conjunto de composables y utilidades para Vue.js, diseñado para facilitar el desarrollo de aplicaciones Vue. Proporciona herramientas para manejar peticiones HTTP con Axios, aplicar filtros personalizados, y crear paginadores flexibles. Además, incluye wrappers para TanStack Vue Query, que simplifican la gestión de estados de datos asíncronos, y una implementación estándar para interactuar con APIs RESTful, facilitando la creación, lectura, actualización y eliminación de recursos.

## Estructura del Proyecto

- **src/composables**: Contiene composables reutilizables para Axios, filtros, paginadores y ordenadores.
- **src/config**: Configuraciones para Axios.
- **src/constants**: Constantes utilizadas en el proyecto, como enumeraciones de breakpoints, excepciones, tipos de archivos, etc.
- **src/rest**: Implementación estándar de una interfaz REST para operaciones CRUD. Proporciona una forma sencilla y estandarizada de interactuar con APIs RESTful, facilitando la creación de servicios que pueden realizar operaciones como crear, leer, actualizar y eliminar recursos.
- **src/types**: Tipos TypeScript utilizados en el proyecto.
- **src/utils**: Utilidades varias, como funciones para manejar fechas, validaciones, manipulación de strings, etc.

## Instalación

```sh
npm install @arex95/vue-core