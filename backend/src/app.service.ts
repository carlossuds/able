import { Injectable } from '@nestjs/common';

/**
 * Root application service that provides basic application functionality.
 */
@Injectable()
export class AppService {
  /**
   * Returns a simple greeting message.
   * @returns {string} A "Hello World!" message
   */
  getHello(): string {
    return 'Hello World!';
  }
}
