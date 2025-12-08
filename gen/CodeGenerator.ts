import { OpenAPIParser } from './core/OpenAPIParser.js';
import { ModelDetector } from './core/ModelDetector.js';
import { DTOGenerator } from './generators/DTOGenerator.js';
import { ServiceGenerator } from './generators/ServiceGenerator.js';
import { FileWriter } from './writers/FileWriter.js';
import { Model } from './models/Model.js';

/**
 * Main code generator orchestrator
 */
export class CodeGenerator {
  private inputPath: string;
  private outputPath: string;
  private parser: OpenAPIParser;
  private dtoGenerator: DTOGenerator;
  private serviceGenerator: ServiceGenerator;
  private fileWriter: FileWriter;

  constructor(inputPath: string, outputPath: string) {
    this.inputPath = inputPath;
    this.outputPath = outputPath;

    // Inicializar componentes
    this.parser = new OpenAPIParser(inputPath);
    this.dtoGenerator = new DTOGenerator();
    this.serviceGenerator = new ServiceGenerator();
    this.fileWriter = new FileWriter(outputPath);
  }

  generate(): void {
    this.log('📖 Parsing OpenAPI spec...');
    const spec = this.parser.parse();

    this.log('🔍 Detecting models...');
    const detector = new ModelDetector(spec);
    const models = detector.detect();
    this.log(`   Found ${models.length} models`);

    for (const model of models) {
      this.generateModel(model);
    }

    this.log('✅ Done!');
  }

  private generateModel(model: Model): void {
    this.log(`📝 Generating code for ${model.name}...`);

    // Generar Type
    const typeCode = this.dtoGenerator.generate(model);

    // Generar Service
    const serviceCode = this.serviceGenerator.generate(model);

    // Escribir archivos
    this.fileWriter.writeModel(model, typeCode, serviceCode);
  }

  private log(message: string): void {
    console.log(message);
  }
}

