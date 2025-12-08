# Ideas de Implementación para el Generador

## Enfoques Posibles

### Enfoque 1: Funciones Simples (MVP Recomendado)

**Concepto:** Funciones puras que procesan datos paso a paso.

**Estructura:**
```
generator/
├── parser.js          # Parsear OpenAPI JSON
├── model-detector.js  # Detectar modelos del schema
├── dto-generator.js   # Generar código de DTOs
├── service-generator.js # Generar código de servicios
├── file-writer.js     # Escribir archivos al sistema
└── index.js           # Orquestador principal
```

**Flujo:**
```javascript
// index.js
const spec = parseOpenAPI('openapi.json');
const models = detectModels(spec);
const files = [];

for (const model of models) {
  files.push(...generateDTOs(model));
  files.push(generateService(model));
}

writeFiles(files, 'src/generated');
```

**Pros:**
- ✅ Simple y directo
- ✅ Fácil de entender
- ✅ Fácil de testear (funciones puras)
- ✅ Cero abstracciones innecesarias

**Contras:**
- ⚠️ Puede volverse verboso con muchas funciones
- ⚠️ Menos reutilizable

**Ejemplo:**
```javascript
// parser.js
function parseOpenAPI(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const spec = JSON.parse(content);
  
  // Validación básica
  if (!spec.openapi) throw new Error('Invalid OpenAPI spec');
  if (!spec.components?.schemas) throw new Error('No schemas found');
  
  return spec;
}

// dto-generator.js
function generateDTO(schema, name) {
  const properties = schema.properties || {};
  const required = schema.required || [];
  
  const fields = Object.entries(properties).map(([key, prop]) => {
    const type = mapOpenAPITypeToTS(prop.type);
    const optional = !required.includes(key) ? '?' : '';
    return `  ${key}${optional}: ${type};`;
  }).join('\n');
  
  return `export interface ${name} {\n${fields}\n}`;
}
```

---

### Enfoque 2: Clases Orientadas a Objetos

**Concepto:** Cada responsabilidad es una clase.

**Estructura:**
```
generator/
├── OpenAPIParser.js
├── ModelDetector.js
├── DTOGenerator.js
├── ServiceGenerator.js
├── FileWriter.js
└── CodeGenerator.js (orquestador)
```

**Flujo:**
```javascript
// CodeGenerator.js
class CodeGenerator {
  constructor(inputPath, outputPath) {
    this.parser = new OpenAPIParser();
    this.detector = new ModelDetector();
    this.dtoGen = new DTOGenerator();
    this.serviceGen = new ServiceGenerator();
    this.writer = new FileWriter(outputPath);
  }
  
  generate() {
    const spec = this.parser.parse(inputPath);
    const models = this.detector.detect(spec);
    
    for (const model of models) {
      this.writer.write(this.dtoGen.generate(model));
      this.writer.write(this.serviceGen.generate(model));
    }
  }
}
```

**Pros:**
- ✅ Organizado y estructurado
- ✅ Fácil de extender (herencia, polimorfismo)
- ✅ Encapsulación clara

**Contras:**
- ⚠️ Más verboso para un MVP
- ⚠️ Puede ser overkill para funcionalidad simple

---

### Enfoque 3: Pipeline/Funcional

**Concepto:** Pipeline de transformaciones de datos.

**Estructura:**
```
generator/
├── pipeline.js
├── transformers/
│   ├── parse-spec.js
│   ├── detect-models.js
│   ├── generate-dtos.js
│   └── generate-services.js
└── index.js
```

**Flujo:**
```javascript
// pipeline.js
function pipeline(input) {
  return pipe(
    parseSpec,
    detectModels,
    generateDTOs,
    generateServices,
    writeFiles
  )(input);
}
```

**Pros:**
- ✅ Muy funcional y declarativo
- ✅ Fácil de componer
- ✅ Cada paso es independiente

**Contras:**
- ⚠️ Puede ser menos intuitivo para algunos
- ⚠️ Requiere funciones helper para `pipe`

---

### Enfoque 4: Template-Based (Más Complejo)

**Concepto:** Usar templates para generar código.

**Estructura:**
```
generator/
├── templates/
│   ├── dto.hbs
│   └── service.hbs
├── template-engine.js
└── generator.js
```

**Flujo:**
```javascript
// generator.js
const dtoTemplate = fs.readFileSync('templates/dto.hbs', 'utf-8');
const compiled = Handlebars.compile(dtoTemplate);

const code = compiled({
  name: 'User',
  fields: [...]
});
```

**Pros:**
- ✅ Separación de lógica y presentación
- ✅ Fácil modificar formato sin tocar código
- ✅ Reutilizable

**Contras:**
- ⚠️ Requiere librería de templates (handlebars)
- ⚠️ Más complejo para MVP

---

## Recomendación: Enfoque Híbrido Simple

**Combinar lo mejor de Enfoque 1 y 2:**

### Estructura Propuesta

```
generator/
├── parser.js              # Funciones puras para parsear
├── detectors.js           # Funciones para detectar modelos/resources
├── generators/
│   ├── dto.js            # Generar código DTO
│   └── service.js        # Generar código Service
├── writer.js              # Escribir archivos
└── index.js               # Orquestador principal
```

### Implementación

**`parser.js` - Funciones puras:**
```javascript
/**
 * Parsea un archivo OpenAPI JSON
 */
function parseOpenAPI(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const spec = JSON.parse(content);
  validateSpec(spec);
  return spec;
}

function validateSpec(spec) {
  if (!spec.openapi) {
    throw new Error('Invalid OpenAPI spec: missing "openapi" field');
  }
  if (!spec.components?.schemas) {
    throw new Error('Invalid OpenAPI spec: missing "components.schemas"');
  }
  if (!spec.paths) {
    throw new Error('Invalid OpenAPI spec: missing "paths"');
  }
}
```

**`detectors.js` - Detectar modelos y resources:**
```javascript
/**
 * Detecta todos los modelos del schema
 */
function detectModels(spec) {
  const schemas = spec.components.schemas || {};
  return Object.keys(schemas).map(name => ({
    name,
    schema: schemas[name],
    folderName: pascalToKebab(name)
  }));
}

/**
 * Detecta el resource de un modelo desde los paths
 */
function detectResource(modelName, paths) {
  const modelPath = findModelPath(modelName, paths);
  if (modelPath) {
    return extractResourceFromPath(modelPath);
  }
  return pascalToKebab(modelName);
}

function findModelPath(modelName, paths) {
  const searchPaths = [
    `/${pascalToKebab(modelName)}`,
    `/${pascalToKebab(modelName)}s`,
    `/${modelName.toLowerCase()}`
  ];
  
  for (const path of searchPaths) {
    if (paths[path]) return path;
  }
  
  return null;
}

function extractResourceFromPath(path) {
  return path.replace(/^\//, '').split('/')[0];
}

function pascalToKebab(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}
```

**`generators/dto.js` - Generar código DTO:**
```javascript
/**
 * Genera el código TypeScript de un DTO
 */
function generateDTO(schema, name) {
  const properties = schema.properties || {};
  const required = schema.required || [];
  
  const fields = Object.entries(properties)
    .map(([key, prop]) => generateField(key, prop, required))
    .join('\n');
  
  return `/**
 * @generated from OpenAPI schema: ${name}
 */
export interface ${name} {
${fields}
}`;
}

function generateField(name, prop, required) {
  const type = mapOpenAPITypeToTS(prop);
  const optional = required.includes(name) ? '' : '?';
  return `  ${name}${optional}: ${type};`;
}

function mapOpenAPITypeToTS(prop) {
  if (prop.type === 'integer' || prop.type === 'number') {
    return 'number';
  }
  if (prop.type === 'string') {
    return 'string';
  }
  if (prop.type === 'boolean') {
    return 'boolean';
  }
  if (prop.type === 'array') {
    const itemType = prop.items?.$ref 
      ? extractTypeFromRef(prop.items.$ref)
      : mapOpenAPITypeToTS(prop.items);
    return `${itemType}[]`;
  }
  if (prop.$ref) {
    return extractTypeFromRef(prop.$ref);
  }
  return 'unknown';
}

function extractTypeFromRef(ref) {
  // #/components/schemas/User -> User
  return ref.split('/').pop();
}
```

**`generators/service.js` - Generar código Service:**
```javascript
/**
 * Genera el código TypeScript de un Service
 */
function generateService(model, resource) {
  const imports = generateImports(model);
  const className = `${model.name}Service`;
  
  return `${imports}

/**
 * @generated from OpenAPI
 * ${model.name} service - Auto-generated from OpenAPI spec
 * 
 * Métodos estándar RESTful disponibles automáticamente desde RestStd:
 * - ${className}.getAll<${model.name}[]>({ params }) → GET /${resource}
 * - ${className}.getOne<${model.name}>({ id }) → GET /${resource}/{id}
 * - ${className}.create<${model.name}>({ data }) → POST /${resource}
 * - ${className}.update<${model.name}>({ id, data }) → PUT /${resource}/{id}
 * - ${className}.delete({ id }) → DELETE /${resource}/{id}
 */
export class ${className} extends RestStd {
  static override resource = '${resource}';
}`;
}

function generateImports(model) {
  const dtoImports = getDTOImports(model);
  return `import { RestStd } from '@arex95/vue-core';
import { ${dtoImports} } from './dto';`;
}

function getDTOImports(model) {
  // Detectar DTOs relacionados (UserCreate, UserUpdate, etc.)
  const dtos = [model.name];
  // TODO: Detectar UserCreate, UserUpdate del schema
  return dtos.join(', ');
}
```

**`writer.js` - Escribir archivos:**
```javascript
/**
 * Escribe archivos generados al sistema
 */
function writeFiles(files, outputDir) {
  // Crear directorio base
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (const file of files) {
    const filePath = path.join(outputDir, file.path);
    const dir = path.dirname(filePath);
    
    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Escribir archivo
    fs.writeFileSync(filePath, file.content, 'utf-8');
  }
}

/**
 * Genera estructura de archivos para un modelo
 */
function generateFileStructure(model, dtos, service) {
  const files = [];
  
  // DTOs
  for (const dto of dtos) {
    files.push({
      path: `${model.folderName}/dto/${dto.name}.ts`,
      content: dto.code
    });
  }
  
  // Index de DTOs
  files.push({
    path: `${model.folderName}/dto/index.ts`,
    content: generateDTOIndex(dtos)
  });
  
  // Service
  files.push({
    path: `${model.folderName}/${model.name}Service.ts`,
    content: service
  });
  
  // Index del modelo
  files.push({
    path: `${model.folderName}/index.ts`,
    content: generateModelIndex(model)
  });
  
  return files;
}

function generateDTOIndex(dtos) {
  return dtos.map(dto => `export * from './${dto.name}';`).join('\n');
}

function generateModelIndex(model) {
  return `export * from './dto';
export * from './${model.name}Service';`;
}
```

**`index.js` - Orquestador principal:**
```javascript
#!/usr/bin/env node

const { parseOpenAPI } = require('./parser');
const { detectModels, detectResource } = require('./detectors');
const { generateDTO } = require('./generators/dto');
const { generateService } = require('./generators/service');
const { writeFiles, generateFileStructure } = require('./writer');

function generate(inputPath, outputPath) {
  console.log(`📖 Parsing OpenAPI spec: ${inputPath}`);
  const spec = parseOpenAPI(inputPath);
  
  console.log(`🔍 Detecting models...`);
  const models = detectModels(spec);
  console.log(`   Found ${models.length} models`);
  
  const allFiles = [];
  
  for (const model of models) {
    console.log(`📝 Generating code for ${model.name}...`);
    
    // Detectar resource
    const resource = detectResource(model.name, spec.paths);
    
    // Generar DTOs
    const dtoCode = generateDTO(model.schema, model.name);
    const dtos = [{ name: model.name, code: dtoCode }];
    
    // Generar Service
    const serviceCode = generateService(model, resource);
    
    // Generar estructura de archivos
    const files = generateFileStructure(model, dtos, serviceCode);
    allFiles.push(...files);
  }
  
  // Generar index principal
  allFiles.push({
    path: 'index.ts',
    content: generateMainIndex(models)
  });
  
  console.log(`💾 Writing ${allFiles.length} files to ${outputPath}...`);
  writeFiles(allFiles, outputPath);
  
  console.log(`✅ Done!`);
}

function generateMainIndex(models) {
  return models
    .map(model => `export * from './${model.folderName}';`)
    .join('\n');
}

// CLI básico
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node generator.js <input.json> <output-dir>');
  process.exit(1);
}

generate(args[0], args[1]);
```

---

## Estructura de Archivos Final

```
generator/
├── parser.js
├── detectors.js
├── generators/
│   ├── dto.js
│   └── service.js
├── writer.js
├── index.js
└── utils.js (helpers como pascalToKebab, etc.)
```

---

## Ventajas de Este Enfoque

1. **Simple pero estructurado** - Funciones puras organizadas por responsabilidad
2. **Fácil de testear** - Cada función es testeable independientemente
3. **Fácil de extender** - Agregar nuevos generadores es simple
4. **Cero dependencias** - Solo usa Node.js nativo
5. **Legible** - Código claro y directo

---

## Próximos Pasos de Implementación

1. **Crear estructura básica** - Carpetas y archivos
2. **Implementar parser** - Parsear y validar JSON
3. **Implementar detectors** - Detectar modelos y resources
4. **Implementar DTO generator** - Generar interfaces TypeScript
5. **Implementar Service generator** - Generar clases RestStd
6. **Implementar writer** - Escribir archivos
7. **Implementar orquestador** - Conectar todo
8. **Testing** - Probar con spec real

---

## Consideraciones Adicionales

### Manejo de Errores
```javascript
function parseOpenAPI(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const spec = JSON.parse(content);
    validateSpec(spec);
    return spec;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
}
```

### Logging Simple
```javascript
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`)
};
```

### Configuración Opcional
```javascript
const defaultConfig = {
  output: './src/generated',
  baseUrl: undefined
};

function mergeConfig(userConfig) {
  return { ...defaultConfig, ...userConfig };
}
```

---

## Alternativa: TypeScript desde el Inicio

Si prefieres TypeScript:

```typescript
// parser.ts
export function parseOpenAPI(filePath: string): OpenAPISpec {
  const content = fs.readFileSync(filePath, 'utf-8');
  const spec: unknown = JSON.parse(content);
  validateSpec(spec);
  return spec as OpenAPISpec;
}

interface OpenAPISpec {
  openapi: string;
  components?: {
    schemas?: Record<string, Schema>;
  };
  paths?: Record<string, PathItem>;
}
```

**Pros:**
- ✅ Type safety
- ✅ Mejor autocompletado
- ✅ Detección de errores temprano

**Contras:**
- ⚠️ Requiere compilación
- ⚠️ Más setup inicial

---

## Recomendación Final

**Para MVP: JavaScript simple con funciones organizadas**

- Fácil de empezar
- Cero configuración
- Rápido de implementar
- Fácil de entender

**Migrar a TypeScript después si es necesario.**

