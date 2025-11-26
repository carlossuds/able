import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Root application controller that handles basic HTTP endpoints.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * GET endpoint that returns a hello message.
   * @returns {string} A greeting message
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
