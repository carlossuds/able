import { Module } from '@nestjs/common';
import { FinnhubService } from './finnhub.service';

/**
 * Module that provides Finnhub WebSocket integration for real-time cryptocurrency data.
 * Exports FinnhubService for use in other modules.
 */
@Module({
  providers: [FinnhubService],
  exports: [FinnhubService],
})
export class FinnhubModule {}
