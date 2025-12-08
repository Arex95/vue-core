import { TypeMapper } from './TypeMapper.js';
import { Model } from '../models/Model.js';

/**
 * Base class for code generators
 */
export abstract class BaseGenerator {
  protected typeMapper: TypeMapper;

  constructor() {
    this.typeMapper = new TypeMapper();
  }

  abstract generate(model: Model): string;

  protected mapOpenAPITypeToTS(property: {
    type?: string;
    items?: {
      $ref?: string;
      type?: string;
    };
    $ref?: string;
  }): string {
    return this.typeMapper.map(property);
  }
}

