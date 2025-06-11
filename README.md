# @arex95/vue-core

Opinionated Vue Core

## Descripción

Conjunto de composables y utilidades para Vue.js, diseñado para facilitar el desarrollo de aplicaciones Vue. Proporciona herramientas para manejar peticiones HTTP con Axios. Además, incluye wrappers para TanStack Vue Query, que simplifican la gestión de estados de datos asíncronos, y una implementación estándar para interactuar con APIs RESTful, facilitando la creación, lectura, actualización y eliminación de recursos.

## Arquitectura Modular Basada en Servicios

Esta arquitectura está diseñada para seguir principios sólidos de `separación de responsabilidades` y `modularidad`, implementando una estructura en la que `los servicios gestionan la lógica de negocio` relacionada con la interacción con APIs, mientras que `las vistas se encargan exclusivamente de la presentación`.

## Concepto General de la Arquitectura

1. **Separación de Responsabilidades**:
   En este diseño, las vistas no tienen que ocuparse de la lógica de obtención o mutación de datos. Esta responsabilidad está delegada a los **servicios**, que gestionan todo el proceso de interactuar con las APIs, realizar solicitudes HTTP y manipular los modelos. Las vistas simplemente se encargan de la **presentación de los datos** y de gestionar las interacciones del usuario, como capturar eventos o mostrar resultados.

    - `Vistas`: Su tarea principal es mostrar los datos que obtienen de los servicios. Se centran en la parte visual y en las interacciones de usuario.
    - `Servicios`: Son responsables de gestionar cómo y desde dónde se obtienen los datos. Aquí es donde se realiza toda la lógica de acceso a las APIs, manejo de respuestas y errores, y mutación de modelos.

   Este enfoque reduce la complejidad de las vistas, las cuales permanecen limpias y fáciles de entender. Cualquier cambio en la forma de hacer las solicitudes (como cambiar la estructura de la API o el cliente HTTP) no requiere modificaciones en las vistas, lo que mejora la mantenibilidad.

2. **Desacoplamiento de la Lógica de la API**:

   Los servicios encapsulan completamente la lógica de interacción con las APIs. Las vistas no necesitan saber nada sobre cómo se hace la solicitud a la API o cómo se gestionan las respuestas. Este desacoplamiento permite que las vistas sean **más limpias** y **menos propensas a errores**, ya que no necesitan manejar la lógica de negocio ni los detalles de las peticiones HTTP. Si en el futuro la forma de interactuar con la API cambia (por ejemplo, si se cambia el cliente HTTP o se agrega un middleware), solo será necesario modificar los servicios, no las vistas.

   Este enfoque también permite que los servicios sean **reutilizables** en diferentes partes de la aplicación. Por ejemplo, si varias vistas necesitan autenticar al usuario, todas pueden utilizar el servicio `AuthService`, sin necesidad de duplicar la lógica de autenticación.

3. **Reusabilidad y Modularidad**:

   Al centralizar la lógica de negocio en servicios, estos pueden ser fácilmente **reutilizados** en diferentes vistas y componentes de la aplicación. Cada servicio está diseñado para encargarse de una única funcionalidad o módulo del sistema, como la autenticación, gestión de productos, gestión de categorías, etc. Este enfoque modular hace que la aplicación sea **más fácil de escalar**.

   Además, la modularidad permite que cada servicio evolucione y cambie de forma independiente sin afectar a otros módulos o partes de la aplicación. Si un nuevo servicio debe ser agregado, como uno para manejar un módulo adicional (por ejemplo, pagos o notificaciones), se puede hacer sin interrumpir el flujo de trabajo de los demás servicios.

4. **Mejora en la Escalabilidad**:

   Esta arquitectura facilita la escalabilidad, ya que cualquier servicio puede ser **ampliado o modificado de forma independiente** sin necesidad de reestructurar la aplicación completa. Por ejemplo, si el servicio de productos necesita cambios en la lógica de consulta, esto no afectará al servicio de autenticación o a las vistas que consumen esos servicios. Esta flexibilidad es crucial cuando el sistema crece y se añaden nuevas funcionalidades.

5. **Facilidad de Pruebas Unitarias**:

   Al estar los servicios desacoplados de las vistas, es mucho más fácil realizar **pruebas unitarias** de cada servicio de manera aislada. Las vistas no necesitan ser simuladas ni involucradas en las pruebas de negocio, lo que facilita la escritura de pruebas unitarias puras para la lógica de las APIs y el manejo de los datos.

   Por ejemplo, el servicio `AuthService` puede probarse por separado para verificar si maneja correctamente el proceso de inicio de sesión o si responde correctamente a los errores de autenticación, sin necesidad de preocuparse por el diseño de las vistas o la interacción con el usuario.

6. **Mantenimiento Sostenible**:

   En un proyecto grande o en evolución, esta arquitectura facilita el mantenimiento del código. Si hay un error relacionado con la autenticación, se puede solucionar directamente en el servicio `AuthService`, sin tener que revisar todas las vistas que consumen este servicio. Esto hace que el código sea más fácil de entender y más fácil de depurar.

   Además, si es necesario cambiar la lógica de la API (como cambiar el formato de las respuestas), solo es necesario modificar los servicios afectados. Las vistas seguirán funcionando de la misma manera, ya que están desacopladas de esta lógica.


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