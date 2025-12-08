import { RestStd } from '@arex95/vue-core';
import { UserUpdate } from '../types/UserUpdate';

/**
 * @generated from OpenAPI
 * Auto-generated service
 * 
 * Métodos estándar RESTful disponibles automáticamente desde RestStd:
 * - UserUpdateService.getAll<T[]>({ params }) → GET /user-update
 * - UserUpdateService.getOne<T>({ id }) → GET /user-update/{id}
 * - UserUpdateService.create<T>({ data }) → POST /user-update
 * - UserUpdateService.update<T>({ id, data }) → PUT /user-update/{id}
 * - UserUpdateService.delete({ id }) → DELETE /user-update/{id}
 */
export class UserUpdateService extends RestStd {
  static override resource = 'user-update';
}