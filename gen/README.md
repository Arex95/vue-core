# Generador de Código desde OpenAPI

Generador que toma un spec OpenAPI y genera tipos TypeScript y servicios que extienden RestStd.

## Documentación Completa

📖 **Ver la documentación completa en:** [`docs/openapi-generator.md`](../docs/openapi-generator.md)

## Uso Rápido

### 1. Compilar
```bash
cd gen
npx tsc
```

### 2. Ejecutar
```bash
# Desde la raíz del proyecto
node gen/dist/index.js openapi.json output
```

## Estructura Generada

```
output/
├── user/
│   ├── types/
│   │   ├── User.ts
│   │   ├── UserCreate.ts
│   │   └── UserUpdate.ts
│   └── services/
│       └── UserService.ts
```

## Estructura del Generador

```
gen/
├── core/              # Parsing y detección
│   ├── OpenAPIParser.ts
│   ├── ModelDetector.ts
│   ├── ResourceDetector.ts
│   └── SpecValidator.ts
├── generators/        # Generadores de código
│   ├── BaseGenerator.ts
│   ├── DTOGenerator.ts
│   ├── ServiceGenerator.ts
│   └── TypeMapper.ts
├── writers/          # Escritura de archivos
│   ├── FileWriter.ts
│   └── DirectoryStructure.ts
├── models/           # Modelos de datos
│   ├── Model.ts
│   ├── Schema.ts
│   └── OpenAPISpec.ts
├── CodeGenerator.ts  # Orquestador principal
├── index.ts          # CLI entry point
└── tsconfig.json     # Configuración TypeScript
```

Para más detalles, consulta la [documentación completa](../docs/openapi-generator.md).
