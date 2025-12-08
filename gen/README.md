# Generador de Código desde OpenAPI

Generador que toma un spec OpenAPI y genera DTOs y Servicios TypeScript que extienden RestStd.

## Requisitos

- Node.js
- TypeScript (`npm install -g typescript`)
- ts-node (`npm install -g ts-node`) para ejecutar directamente

## Uso

### Opción 1: Con ts-node (desarrollo)
```bash
ts-node gen/index.ts openapi.json src/generated
```

### Opción 2: Compilar y ejecutar
```bash
# Compilar
cd gen
tsc

# Ejecutar
node dist/index.js ../openapi.json ../src/generated
```

## Estructura

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
├── tsconfig.json     # Configuración TypeScript
└── README.md
```

## Ejemplo

```bash
# Generar código desde openapi.json
ts-node gen/index.ts openapi.json src/generated
```

Esto generará:
- DTOs en `src/generated/{model}/dto/`
- Servicios en `src/generated/{model}/{Model}Service.ts`
- Index files para exports
