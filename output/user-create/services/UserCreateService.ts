import { RestStd } from '@arex95/vue-core';
import { UserCreate } from '../types/UserCreate';

/**
 * @generated from OpenAPI
 * Auto-generated service
 * 
 * Métodos estándar RESTful disponibles automáticamente desde RestStd:
 * - UserCreateService.getAll<T[]>({ params }) → GET /user-create
 * - UserCreateService.getOne<T>({ id }) → GET /user-create/{id}
 * - UserCreateService.create<T>({ data }) → POST /user-create
 * - UserCreateService.update<T>({ id, data }) → PUT /user-create/{id}
 * - UserCreateService.delete({ id }) → DELETE /user-create/{id}
 */
export class UserCreateService extends RestStd {
  static override resource = 'user-create';
}