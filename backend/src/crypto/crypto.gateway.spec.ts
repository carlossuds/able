import { Test, TestingModule } from '@nestjs/testing';
import { CryptoGateway } from './crypto.gateway';

describe('CryptoGateway', () => {
  let gateway: CryptoGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoGateway],
    }).compile();

    gateway = module.get<CryptoGateway>(CryptoGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
