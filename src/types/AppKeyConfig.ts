/**
 * Defines the structure for the application key configuration object.
 * This interface is used to ensure that the application key is provided in the correct format.
 */
export interface AppKeyConfig {
  /**
   * The application key, used for encryption and other security-related operations.
   */
  appKey: string;
}
