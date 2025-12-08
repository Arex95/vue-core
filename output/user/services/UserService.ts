import { RestStd } from '@arex95/vue-core';
import { PasswordReset } from '../types/PasswordReset';
import { User } from '../types/User';

/**
 * @generated from OpenAPI
 * Auto-generated service
 * 
 * Métodos estándar RESTful disponibles automáticamente desde RestStd:
 * - UserService.getAll<T[]>({ params }) → GET /users
 * - UserService.getOne<T>({ id }) → GET /users/{id}
 * - UserService.create<T>({ data }) → POST /users
 * - UserService.update<T>({ id, data }) → PUT /users/{id}
 * - UserService.delete({ id }) → DELETE /users/{id}
 */
export class UserService extends RestStd {
  static override resource = 'users';

  /**
   * Activate user account
   * @generated from operationId: activateUser
   */
  static activateUser(id: number): Promise<User> {
    return this.customRequest<User>({ method: 'POST', url: '/api/v1/activate-user/{id}' });
  }

  /**
   * Reset user password
   * @generated from operationId: resetUserPassword
   */
  static resetUserPassword(id: number, data: PasswordReset): Promise<User> {
    return this.create<User, PasswordReset>({ data, url: '/api/v1/users/{id}/reset-password' });
  }
}