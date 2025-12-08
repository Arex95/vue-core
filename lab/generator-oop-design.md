# Diseño OOP para el Generador

## Arquitectura Orientada a Objetos

### Estructura de Clases

```
generator/
├── core/
│   ├── OpenAPIParser.js
│   ├── ModelDetector.js
│   ├── ResourceDetector.js
│   └── SpecValidator.js
├── generators/
│   ├── BaseGenerator.js
│   ├── DTOGenerator.js
│   └── ServiceGenerator.js
├── writers/
│   ├── FileWriter.js
│   └── DirectoryStructure.js
├── models/
│   ├── Model.js
│   ├── Schema.js
│   └── OpenAPISpec.js
└── CodeGenerator.js (orquestador principal)
```

---

## Clases Principales

### 1. Modelos de Datos

#### `models/OpenAPISpec.js`
```javascript
class OpenAPISpec {
  constructor(rawSpec) {
    this.openapi = rawSpec.openapi;
    this.info = rawSpec.info || {};
    this.paths = rawSpec.paths || {};
    this.components = rawSpec.components || {};
    this.schemas = this.components.schemas || {};
  }
  
  getSchemas() {
    return this.schemas;
  }
  
  getPaths() {
    return this.paths;
  }
  
  hasSchema(name) {
    return name in this.schemas;
  }
  
  getSchema(name) {
    return this.schemas[name];
  }
}
```

#### `models/Schema.js`
```javascript
class Schema {
  constructor(name, rawSchema) {
    this.name = name;
    this.type = rawSchema.type;
    this.properties = rawSchema.properties || {};
    this.required = rawSchema.required || [];
    this.description = rawSchema.description;
  }
  
  getProperties() {
    return this.properties;
  }
  
  isRequired(fieldName) {
    return this.required.includes(fieldName);
  }
  
  getPropertyType(fieldName) {
    return this.properties[fieldName];
  }
}
```

#### `models/Model.js`
```javascript
class Model {
  constructor(name, schema, resource) {
    this.name = name;
    this.schema = schema;
    this.resource = resource;
    this.folderName = this.toKebabCase(name);
  }
  
  toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }
  
  getDTOs() {
    // Detectar DTOs relacionados (UserCreate, UserUpdate, etc.)
    return [this.name]; // Por ahora solo el principal
  }
}
```

---

### 2. Core - Parsing y Detección

#### `core/SpecValidator.js`
```javascript
class SpecValidator {
  static validate(spec) {
    const errors = [];
    
    if (!spec.openapi) {
      errors.push('Missing "openapi" field');
    }
    
    if (!spec.components?.schemas) {
      errors.push('Missing "components.schemas"');
    }
    
    if (!spec.paths) {
      errors.push('Missing "paths"');
    }
    
    if (errors.length > 0) {
      throw new Error(`Invalid OpenAPI spec:\n${errors.join('\n')}`);
    }
    
    return true;
  }
}
```

#### `core/OpenAPIParser.js`
```javascript
const fs = require('fs');
const { OpenAPISpec } = require('../models/OpenAPISpec');
const { SpecValidator } = require('./SpecValidator');

class OpenAPIParser {
  constructor(filePath) {
    this.filePath = filePath;
  }
  
  parse() {
    try {
      const content = this.readFile();
      const rawSpec = this.parseJSON(content);
      SpecValidator.validate(rawSpec);
      return new OpenAPISpec(rawSpec);
    } catch (error) {
      throw new Error(`Failed to parse OpenAPI spec: ${error.message}`);
    }
  }
  
  readFile() {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`File not found: ${this.filePath}`);
    }
    return fs.readFileSync(this.filePath, 'utf-8');
  }
  
  parseJSON(content) {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }
}
```

#### `core/ModelDetector.js`
```javascript
const { Model } = require('../models/Model');
const { Schema } = require('../models/Schema');

class ModelDetector {
  constructor(spec) {
    this.spec = spec;
  }
  
  detect() {
    const schemas = this.spec.getSchemas();
    const models = [];
    
    for (const [name, rawSchema] of Object.entries(schemas)) {
      // Solo procesar schemas de tipo object (modelos)
      if (rawSchema.type === 'object' || !rawSchema.type) {
        const schema = new Schema(name, rawSchema);
        const resource = this.detectResource(name);
        const model = new Model(name, schema, resource);
        models.push(model);
      }
    }
    
    return models;
  }
  
  detectResource(modelName) {
    const resourceDetector = new ResourceDetector(this.spec);
    return resourceDetector.detect(modelName);
  }
}
```

#### `core/ResourceDetector.js`
```javascript
class ResourceDetector {
  constructor(spec) {
    this.spec = spec;
  }
  
  detect(modelName) {
    const paths = this.spec.getPaths();
    const possiblePaths = this.generatePossiblePaths(modelName);
    
    for (const path of possiblePaths) {
      if (paths[path]) {
        return this.extractResourceFromPath(path);
      }
    }
    
    // Si no se encuentra, usar el nombre del modelo en kebab-case
    return this.toKebabCase(modelName);
  }
  
  generatePossiblePaths(modelName) {
    const kebab = this.toKebabCase(modelName);
    return [
      `/${kebab}`,
      `/${kebab}s`,
      `/${modelName.toLowerCase()}`,
      `/${modelName.toLowerCase()}s`
    ];
  }
  
  extractResourceFromPath(path) {
    return path.replace(/^\//, '').split('/')[0];
  }
  
  toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }
}
```

---

### 3. Generadores

#### `generators/BaseGenerator.js`
```javascript
class BaseGenerator {
  constructor() {
    this.typeMapper = new TypeMapper();
  }
  
  generate(model) {
    throw new Error('generate() must be implemented by subclass');
  }
  
  mapOpenAPITypeToTS(property) {
    return this.typeMapper.map(property);
  }
}
```

#### `generators/DTOGenerator.js`
```javascript
const { BaseGenerator } = require('./BaseGenerator');

class DTOGenerator extends BaseGenerator {
  generate(model) {
    const schema = model.schema;
    const name = model.name;
    
    const fields = this.generateFields(schema);
    const comment = this.generateComment(name);
    
    return `${comment}
export interface ${name} {
${fields}
}`;
  }
  
  generateFields(schema) {
    const properties = schema.getProperties();
    const fields = [];
    
    for (const [name, prop] of Object.entries(properties)) {
      const field = this.generateField(name, prop, schema);
      fields.push(field);
    }
    
    return fields.join('\n');
  }
  
  generateField(name, prop, schema) {
    const type = this.mapOpenAPITypeToTS(prop);
    const optional = schema.isRequired(name) ? '' : '?';
    return `  ${name}${optional}: ${type};`;
  }
  
  generateComment(name) {
    return `/**
 * @generated from OpenAPI schema: ${name}
 */`;
  }
}
```

#### `generators/ServiceGenerator.js`
```javascript
const { BaseGenerator } = require('./BaseGenerator');

class ServiceGenerator extends BaseGenerator {
  generate(model) {
    const imports = this.generateImports(model);
    const className = this.getClassName(model);
    const resource = model.resource;
    const documentation = this.generateDocumentation(className, resource);
    const classBody = this.generateClassBody(resource);
    
    return `${imports}

${documentation}
export class ${className} extends RestStd {
${classBody}
}`;
  }
  
  generateImports(model) {
    const dtoImports = model.getDTOs().join(', ');
    return `import { RestStd } from '@arex95/vue-core';
import { ${dtoImports} } from './dto';`;
  }
  
  generateDocumentation(className, resource) {
    return `/**
 * @generated from OpenAPI
 * Auto-generated service
 * 
 * Métodos estándar RESTful disponibles automáticamente desde RestStd:
 * - ${className}.getAll<T[]>({ params }) → GET /${resource}
 * - ${className}.getOne<T>({ id }) → GET /${resource}/{id}
 * - ${className}.create<T>({ data }) → POST /${resource}
 * - ${className}.update<T>({ id, data }) → PUT /${resource}/{id}
 * - ${className}.delete({ id }) → DELETE /${resource}/{id}
 */`;
  }
  
  generateClassBody(resource) {
    return `  static override resource = '${resource}';`;
  }
  
  getClassName(model) {
    return `${model.name}Service`;
  }
}
```

#### `generators/TypeMapper.js`
```javascript
class TypeMapper {
  map(property) {
    if (property.type === 'integer' || property.type === 'number') {
      return 'number';
    }
    
    if (property.type === 'string') {
      return 'string';
    }
    
    if (property.type === 'boolean') {
      return 'boolean';
    }
    
    if (property.type === 'array') {
      return this.mapArray(property);
    }
    
    if (property.$ref) {
      return this.extractTypeFromRef(property.$ref);
    }
    
    return 'unknown';
  }
  
  mapArray(property) {
    const items = property.items;
    if (!items) {
      return 'unknown[]';
    }
    
    if (items.$ref) {
      const itemType = this.extractTypeFromRef(items.$ref);
      return `${itemType}[]`;
    }
    
    const itemType = this.map(items);
    return `${itemType}[]`;
  }
  
  extractTypeFromRef(ref) {
    // #/components/schemas/User -> User
    return ref.split('/').pop();
  }
}
```

---

### 4. Writers

#### `writers/DirectoryStructure.js`
```javascript
class DirectoryStructure {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  
  createModelStructure(model) {
    return {
      dtoDir: `${model.folderName}/dto`,
      serviceFile: `${model.folderName}/${model.name}Service.ts`,
      indexFile: `${model.folderName}/index.ts`
    };
  }
  
  getDTOFilePath(model, dtoName) {
    return `${model.folderName}/dto/${dtoName}.ts`;
  }
  
  getDTOIndexPath(model) {
    return `${model.folderName}/dto/index.ts`;
  }
  
  getServiceFilePath(model) {
    return `${model.folderName}/${model.name}Service.ts`;
  }
  
  getModelIndexPath(model) {
    return `${model.folderName}/index.ts`;
  }
  
  getMainIndexPath() {
    return 'index.ts';
  }
}
```

#### `writers/FileWriter.js`
```javascript
const fs = require('fs');
const path = require('path');

class FileWriter {
  constructor(outputDir) {
    this.outputDir = outputDir;
    this.directoryStructure = new DirectoryStructure(outputDir);
  }
  
  write(filePath, content) {
    const fullPath = path.join(this.outputDir, filePath);
    const dir = path.dirname(fullPath);
    
    this.ensureDirectoryExists(dir);
    fs.writeFileSync(fullPath, content, 'utf-8');
  }
  
  writeModel(model, dtoCode, serviceCode) {
    const structure = this.directoryStructure;
    
    // Escribir DTO
    const dtoPath = structure.getDTOFilePath(model, model.name);
    this.write(dtoPath, dtoCode);
    
    // Escribir DTO index
    const dtoIndexPath = structure.getDTOIndexPath(model);
    const dtoIndexContent = this.generateDTOIndex(model);
    this.write(dtoIndexPath, dtoIndexContent);
    
    // Escribir Service
    const servicePath = structure.getServiceFilePath(model);
    this.write(servicePath, serviceCode);
    
    // Escribir Model index
    const modelIndexPath = structure.getModelIndexPath(model);
    const modelIndexContent = this.generateModelIndex(model);
    this.write(modelIndexPath, modelIndexContent);
  }
  
  writeMainIndex(models) {
    const mainIndexPath = this.directoryStructure.getMainIndexPath();
    const content = this.generateMainIndex(models);
    this.write(mainIndexPath, content);
  }
  
  generateDTOIndex(model) {
    return `export * from './${model.name}';`;
  }
  
  generateModelIndex(model) {
    return `export * from './dto';
export * from './${model.name}Service';`;
  }
  
  generateMainIndex(models) {
    return models
      .map(model => `export * from './${model.folderName}';`)
      .join('\n');
  }
  
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
```

---

### 5. Orquestador Principal

#### `CodeGenerator.js`
```javascript
const { OpenAPIParser } = require('./core/OpenAPIParser');
const { ModelDetector } = require('./core/ModelDetector');
const { DTOGenerator } = require('./generators/DTOGenerator');
const { ServiceGenerator } = require('./generators/ServiceGenerator');
const { FileWriter } = require('./writers/FileWriter');

class CodeGenerator {
  constructor(inputPath, outputPath) {
    this.inputPath = inputPath;
    this.outputPath = outputPath;
    
    // Inicializar componentes
    this.parser = new OpenAPIParser(inputPath);
    this.dtoGenerator = new DTOGenerator();
    this.serviceGenerator = new ServiceGenerator();
    this.fileWriter = new FileWriter(outputPath);
  }
  
  generate() {
    this.log('📖 Parsing OpenAPI spec...');
    const spec = this.parser.parse();
    
    this.log('🔍 Detecting models...');
    const detector = new ModelDetector(spec);
    const models = detector.detect();
    this.log(`   Found ${models.length} models`);
    
    for (const model of models) {
      this.generateModel(model);
    }
    
    this.log('📝 Generating main index...');
    this.fileWriter.writeMainIndex(models);
    
    this.log('✅ Done!');
  }
  
  generateModel(model) {
    this.log(`📝 Generating code for ${model.name}...`);
    
    // Generar DTO
    const dtoCode = this.dtoGenerator.generate(model);
    
    // Generar Service
    const serviceCode = this.serviceGenerator.generate(model);
    
    // Escribir archivos
    this.fileWriter.writeModel(model, dtoCode, serviceCode);
  }
  
  log(message) {
    console.log(message);
  }
}

module.exports = CodeGenerator;
```

---

## Uso

### CLI (`index.js`)
```javascript
#!/usr/bin/env node

const CodeGenerator = require('./CodeGenerator');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node index.js <input.json> <output-dir>');
  process.exit(1);
}

const [inputPath, outputPath] = args;

try {
  const generator = new CodeGenerator(inputPath, outputPath);
  generator.generate();
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
```

---

## Ventajas del Diseño OOP

### 1. **Encapsulación**
- Cada clase tiene responsabilidades claras
- Datos y comportamiento juntos

### 2. **Reutilización**
- `BaseGenerator` puede ser extendido para nuevos generadores
- `TypeMapper` puede ser usado por múltiples generadores

### 3. **Extensibilidad**
- Fácil agregar nuevos generadores (extendiendo `BaseGenerator`)
- Fácil agregar nuevos tipos de archivos

### 4. **Testabilidad**
- Cada clase puede ser testeada independientemente
- Mocking es más fácil con interfaces claras

### 5. **Mantenibilidad**
- Código organizado y estructurado
- Fácil encontrar dónde está cada funcionalidad

---

## Ejemplo de Extensión

### Agregar un nuevo generador (ej: HookGenerator)

```javascript
const { BaseGenerator } = require('./generators/BaseGenerator');

class HookGenerator extends BaseGenerator {
  generate(model) {
    // Generar hooks Vue Query
    // ...
  }
}

// En CodeGenerator.js
this.hookGenerator = new HookGenerator();
// ...
const hookCode = this.hookGenerator.generate(model);
```

---

## Diagrama de Clases

```
┌─────────────────┐
│  CodeGenerator  │ (Orquestador)
└────────┬────────┘
         │
         ├─── OpenAPIParser ───> OpenAPISpec
         │
         ├─── ModelDetector ───> Model[]
         │         │
         │         └─── ResourceDetector
         │
         ├─── DTOGenerator ───> DTO Code
         │         │
         │         └─── TypeMapper
         │
         ├─── ServiceGenerator ───> Service Code
         │
         └─── FileWriter ───> Files
                   │
                   └─── DirectoryStructure
```

---

## Consideraciones Adicionales

### Manejo de Errores con Clases

```javascript
class GeneratorError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GeneratorError';
    this.code = code;
  }
}

class ParseError extends GeneratorError {
  constructor(message) {
    super(message, 'PARSE_ERROR');
  }
}

// Uso
throw new ParseError('Invalid JSON format');
```

### Logging con Clase

```javascript
class Logger {
  static info(message) {
    console.log(`ℹ️  ${message}`);
  }
  
  static success(message) {
    console.log(`✅ ${message}`);
  }
  
  static error(message) {
    console.error(`❌ ${message}`);
  }
  
  static warn(message) {
    console.warn(`⚠️  ${message}`);
  }
}

// Uso en CodeGenerator
this.logger = Logger;
this.logger.info('Parsing spec...');
```

### Configuración con Clase

```javascript
class GeneratorConfig {
  constructor(options = {}) {
    this.input = options.input;
    this.output = options.output || './src/generated';
    this.baseUrl = options.baseUrl;
    this.verbose = options.verbose || false;
  }
  
  static fromFile(filePath) {
    const config = require(filePath);
    return new GeneratorConfig(config);
  }
  
  static fromArgs(args) {
    return new GeneratorConfig({
      input: args[0],
      output: args[1]
    });
  }
}

// Uso
const config = GeneratorConfig.fromArgs(process.argv.slice(2));
const generator = new CodeGenerator(config.input, config.output);
```

---

## Testing OOP

### Ejemplo de Test

```javascript
const { DTOGenerator } = require('./generators/DTOGenerator');
const { Model } = require('./models/Model');
const { Schema } = require('./models/Schema');

describe('DTOGenerator', () => {
  it('should generate DTO interface', () => {
    const schema = new Schema('User', {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' }
      },
      required: ['id']
    });
    
    const model = new Model('User', schema, 'users');
    const generator = new DTOGenerator();
    
    const code = generator.generate(model);
    
    expect(code).toContain('export interface User');
    expect(code).toContain('id: number');
    expect(code).toContain('name?: string');
  });
});
```

---

## Estructura Final de Archivos

```
generator/
├── core/
│   ├── OpenAPIParser.js
│   ├── ModelDetector.js
│   ├── ResourceDetector.js
│   └── SpecValidator.js
├── generators/
│   ├── BaseGenerator.js
│   ├── DTOGenerator.js
│   ├── ServiceGenerator.js
│   └── TypeMapper.js
├── writers/
│   ├── FileWriter.js
│   └── DirectoryStructure.js
├── models/
│   ├── Model.js
│   ├── Schema.js
│   └── OpenAPISpec.js
├── utils/
│   ├── Logger.js
│   └── GeneratorConfig.js
├── errors/
│   └── GeneratorError.js
├── CodeGenerator.js
└── index.js
```

---

## Próximos Pasos

1. **Implementar modelos** - `Model`, `Schema`, `OpenAPISpec`
2. **Implementar core** - Parsers y detectores
3. **Implementar generadores** - DTO y Service
4. **Implementar writers** - FileWriter
5. **Implementar orquestador** - CodeGenerator
6. **Testing** - Tests unitarios para cada clase
7. **CLI** - Interfaz de línea de comandos

