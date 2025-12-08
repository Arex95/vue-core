/**
 * Maps OpenAPI types to TypeScript types
 */
export class TypeMapper {
  map(property: {
    type?: string;
    items?: {
      $ref?: string;
      type?: string;
    };
    $ref?: string;
  }): string {
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

  private mapArray(property: {
    items?: {
      $ref?: string;
      type?: string;
    };
  }): string {
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

  private extractTypeFromRef(ref: string): string {
    // #/components/schemas/User -> User
    return ref.split('/').pop() || 'unknown';
  }
}

