import { Test, TestingModule } from '@nestjs/testing';
import { FinnhubService } from './finnhub.service';
import { ConfigService } from '@nestjs/config';

describe('FinnhubService', () => {
  let service: FinnhubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinnhubService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test_api_key'),
          },
        },
      ],
    }).compile();

    service = module.get<FinnhubService>(FinnhubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
