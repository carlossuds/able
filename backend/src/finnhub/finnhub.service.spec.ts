import { Test, TestingModule } from '@nestjs/testing';
import { FinnhubService } from './finnhub.service';

describe('FinnhubService', () => {
  let service: FinnhubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinnhubService],
    }).compile();

    service = module.get<FinnhubService>(FinnhubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
