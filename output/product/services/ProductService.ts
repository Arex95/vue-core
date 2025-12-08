import { RestStd } from '@arex95/vue-core';
import { Product } from '../types/Product';
import { ProductUpdate } from '../types/ProductUpdate';

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

  /**
   * Do something weird with product
   * @generated from operationId: doSomethingWithProduct
   */
  static doSomethingWithProduct(id: number, params?: Record<string, unknown>, data: ProductUpdate): Promise<Product> {
    return this.update<Product, ProductUpdate>({ id: id, data, url: '/api/v2/products/{id}/do-something' });
  }
}