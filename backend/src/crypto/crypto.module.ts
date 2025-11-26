import { Module } from '@nestjs/common';
import { CryptoGateway } from './crypto.gateway';
import { FinnhubModule } from '../finnhub/finnhub.module';

/**
 * Module that provides WebSocket gateway for streaming cryptocurrency data to clients.
 * Imports FinnhubModule to access real-time market data.
 */
@Module({
  imports: [FinnhubModule],
  providers: [CryptoGateway],
})
export class CryptoModule {}
