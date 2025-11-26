import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FinnhubModule } from './finnhub/finnhub.module';
import { CryptoModule } from './crypto/crypto.module';

/**
 * Root application module that configures and imports all feature modules.
 * Sets up global configuration, Finnhub integration, and WebSocket gateway for crypto data streaming.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FinnhubModule,
    CryptoModule,
  ],
})
export class AppModule {}
