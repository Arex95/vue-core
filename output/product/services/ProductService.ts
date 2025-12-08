import { RestStd } from '@arex95/vue-core';

/**
 * @generated from OpenAPI
 * Auto-generated service
 * 
 * Métodos estándar RESTful disponibles automáticamente desde RestStd:
 * - ProductService.getAll<T[]>({ params }) → GET /products
 * - ProductService.getOne<T>({ id }) → GET /products/{id}
 * - ProductService.create<T>({ data }) → POST /products
 * - ProductService.update<T>({ id, data }) → PUT /products/{id}
 * - ProductService.delete({ id }) → DELETE /products/{id}
 */
export class ProductService extends RestStd {
  static override resource = 'products';
}