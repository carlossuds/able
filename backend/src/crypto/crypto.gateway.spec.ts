import { Test, TestingModule } from '@nestjs/testing';
import { CryptoGateway } from './crypto.gateway';
import { FinnhubService } from '../finnhub/finnhub.service';

describe('CryptoGateway', () => {
  let gateway: CryptoGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoGateway,
        {
          provide: FinnhubService,
          useValue: {
            getAllData: jest.fn().mockReturnValue([]),
          },
        },
      ],
    }).compile();

    gateway = module.get<CryptoGateway>(CryptoGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
