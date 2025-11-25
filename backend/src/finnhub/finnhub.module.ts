import { Module } from '@nestjs/common';
import { FinnhubService } from './finnhub.service';

@Module({
  providers: [FinnhubService],
  exports: [FinnhubService],
})
export class FinnhubModule {}
