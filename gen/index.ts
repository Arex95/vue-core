#!/usr/bin/env node

import { CodeGenerator } from './CodeGenerator.js';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: ts-node index.ts <input.json> <output-dir>');
  process.exit(1);
}

const [inputPath, outputPath] = args;

try {
  const generator = new CodeGenerator(inputPath, outputPath);
  generator.generate();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`❌ Error: ${message}`);
  process.exit(1);
}

