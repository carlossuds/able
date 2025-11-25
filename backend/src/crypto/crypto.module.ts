import { Module } from '@nestjs/common';
import { CryptoGateway } from './crypto.gateway';
import { FinnhubModule } from '../finnhub/finnhub.module';

@Module({
  imports: [FinnhubModule],
  providers: [CryptoGateway],
})
export class CryptoModule {}
