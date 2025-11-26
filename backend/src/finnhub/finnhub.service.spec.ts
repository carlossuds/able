/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { FinnhubService } from './finnhub.service';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

// Mock WebSocket
jest.mock('ws');

describe('FinnhubService', () => {
  let service: FinnhubService;
  let configService: ConfigService;
  let mockWebSocket: jest.Mocked<WebSocket>;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock WebSocket instance
    mockWebSocket = {
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<WebSocket>;

    // Mock WebSocket constructor
    (WebSocket as unknown as jest.Mock).mockImplementation(() => mockWebSocket);

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
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should connect to Finnhub WebSocket on module init', () => {
      service.onModuleInit();

      expect(WebSocket).toHaveBeenCalledWith(
        'wss://ws.finnhub.io?token=test_api_key',
      );
      expect(mockWebSocket.on).toHaveBeenCalledWith('open', expect.anything());
      expect(mockWebSocket.on).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      expect(mockWebSocket.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
      expect(mockWebSocket.on).toHaveBeenCalledWith(
        'close',
        expect.any(Function),
      );
    });

    it('should not connect if API key is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      service.onModuleInit();

      expect(WebSocket).not.toHaveBeenCalled();
    });

    it('should subscribe to all symbols on connection open', () => {
      service.onModuleInit();

      // Get the 'open' event handler
      const [, openHandler] = mockWebSocket.on.mock.calls.find(
        ([emitter]) => emitter === 'open',
      ) as (() => void)[];

      expect(openHandler).toBeDefined();

      // Trigger the open event
      openHandler();

      // Should subscribe to all 3 symbols
      expect(mockWebSocket.send).toHaveBeenCalledTimes(3);
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe', symbol: 'BINANCE:ETHUSDC' }),
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe', symbol: 'BINANCE:ETHUSDT' }),
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe', symbol: 'BINANCE:ETHBTC' }),
      );
    });
  });

  describe('Trade Processing', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should process trade messages and update current price', () => {
      const [, messageHandler] = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message',
      ) as ((data: string | Buffer) => void)[];

      const tradeMessage = {
        type: 'trade',
        data: [
          {
            s: 'BINANCE:ETHUSDC',
            p: 2500.5,
            t: Date.now(),
            v: 1.5,
          },
        ],
      };

      messageHandler?.(JSON.stringify(tradeMessage));

      expect(service.getCurrentPrice('ETH/USDC')).toBe(2500.5);
    });

    it('should handle multiple trades for different symbols', () => {
      const [, messageHandler] = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message',
      ) as ((data: string | Buffer) => void)[];

      const tradeMessage = {
        type: 'trade',
        data: [
          { s: 'BINANCE:ETHUSDC', p: 2500.5, t: Date.now(), v: 1.5 },
          { s: 'BINANCE:ETHUSDT', p: 2501.0, t: Date.now(), v: 2.0 },
          { s: 'BINANCE:ETHBTC', p: 0.055, t: Date.now(), v: 0.5 },
        ],
      };

      messageHandler?.(JSON.stringify(tradeMessage));

      expect(service.getCurrentPrice('ETH/USDC')).toBe(2500.5);
      expect(service.getCurrentPrice('ETH/USDT')).toBe(2501.0);
      expect(service.getCurrentPrice('ETH/BTC')).toBe(0.055);
    });

    it('should handle Buffer message data', () => {
      const [, messageHandler] = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message',
      ) as ((data: string | Buffer) => void)[];

      const tradeMessage = {
        type: 'trade',
        data: [{ s: 'BINANCE:ETHUSDC', p: 2500.5, t: Date.now(), v: 1.5 }],
      };

      const buffer = Buffer.from(JSON.stringify(tradeMessage));
      messageHandler?.(buffer);

      expect(service.getCurrentPrice('ETH/USDC')).toBe(2500.5);
    });

    it('should ignore trades for unknown symbols', () => {
      const [, messageHandler] = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message',
      ) as ((data: string | Buffer) => void)[];

      const tradeMessage = {
        type: 'trade',
        data: [{ s: 'BINANCE:BTCUSDT', p: 50000, t: Date.now(), v: 1.0 }],
      };

      messageHandler?.(JSON.stringify(tradeMessage));

      // Should not throw and should not affect our symbols
      expect(service.getCurrentPrice('ETH/USDC')).toBe(0);
    });

    it('should handle malformed messages gracefully', () => {
      const [, messageHandler] = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message',
      ) as ((data: string | Buffer) => void)[];

      // Should not throw
      expect(() => messageHandler?.('invalid json')).not.toThrow();
      expect(() => messageHandler?.('{}')).not.toThrow();
    });
  });

  describe('Hourly Average Calculation', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should calculate hourly average correctly', () => {
      const [, messageHandler] = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message',
      ) as ((data: string | Buffer) => void)[];

      // Add multiple trades
      const now = Date.now();
      messageHandler?.(
        JSON.stringify({
          type: 'trade',
          data: [{ s: 'BINANCE:ETHUSDC', p: 2500, t: now, v: 1 }],
        }),
      );
      messageHandler?.(
        JSON.stringify({
          type: 'trade',
          data: [{ s: 'BINANCE:ETHUSDC', p: 2600, t: now + 1000, v: 1 }],
        }),
      );
      messageHandler?.(
        JSON.stringify({
          type: 'trade',
          data: [{ s: 'BINANCE:ETHUSDC', p: 2700, t: now + 2000, v: 1 }],
        }),
      );

      const average = service.getHourlyAverage('ETH/USDC');
      expect(average).toBe((2500 + 2600 + 2700) / 3);
    });

    it('should return 0 for symbols with no data', () => {
      expect(service.getHourlyAverage('ETH/USDC')).toBe(0);
    });

    it('should clean up old price history (older than 1 hour)', () => {
      const [, messageHandler] = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message',
      ) as ((data: string | Buffer) => void)[];

      const now = Date.now();
      const twoHoursAgo = now - 2 * 3600000;

      // Add old trade (should be cleaned up)
      messageHandler?.(
        JSON.stringify({
          type: 'trade',
          data: [{ s: 'BINANCE:ETHUSDC', p: 2000, t: twoHoursAgo, v: 1 }],
        }),
      );

      // Add recent trade
      messageHandler?.(
        JSON.stringify({
          type: 'trade',
          data: [{ s: 'BINANCE:ETHUSDC', p: 2500, t: now, v: 1 }],
        }),
      );

      const average = service.getHourlyAverage('ETH/USDC');
      // Should only include the recent trade
      expect(average).toBe(2500);
    });
  });

  describe('Data Aggregation', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should return data for all symbols', () => {
      const [, messageHandler] = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'message',
      ) as ((data: string | Buffer) => void)[];

      const now = Date.now();
      messageHandler?.(
        JSON.stringify({
          type: 'trade',
          data: [
            { s: 'BINANCE:ETHUSDC', p: 2500, t: now, v: 1 },
            { s: 'BINANCE:ETHUSDT', p: 2501, t: now, v: 1 },
            { s: 'BINANCE:ETHBTC', p: 0.055, t: now, v: 1 },
          ],
        }),
      );

      const allData = service.getAllData();

      expect(allData).toHaveLength(3);
      expect(allData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            symbol: 'ETH/USDC',
            price: 2500,
            average: 2500,
          }),
          expect.objectContaining({
            symbol: 'ETH/USDT',
            price: 2501,
            average: 2501,
          }),
          expect.objectContaining({
            symbol: 'ETH/BTC',
            price: 0.055,
            average: 0.055,
          }),
        ]),
      );
    });

    it('should include timestamp in aggregated data', () => {
      const allData = service.getAllData();

      allData.forEach((data) => {
        expect(data.timestamp).toBeDefined();
        expect(typeof data.timestamp).toBe('number');
      });
    });
  });

  describe('Error Handling and Reconnection', () => {
    it('should handle WebSocket errors', () => {
      service.onModuleInit();

      const [, errorHandler] = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'error',
      ) as (() => void)[];

      // Should not throw
      expect(() => errorHandler()).not.toThrow();
    });

    it('should reconnect after 5 seconds on close', () => {
      jest.useFakeTimers();

      service.onModuleInit();

      const [, closeHandler] = mockWebSocket.on.mock.calls.find(
        (call) => call[0] === 'close',
      ) as (() => void)[];

      // Clear the initial WebSocket call
      (WebSocket as unknown as jest.Mock).mockClear();

      // Trigger close event
      closeHandler();

      // Should not reconnect immediately
      expect(WebSocket).not.toHaveBeenCalled();

      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      // Should reconnect
      expect(WebSocket).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('getCurrentPrice', () => {
    it('should return 0 for symbols with no price data', () => {
      expect(service.getCurrentPrice('ETH/USDC')).toBe(0);
      expect(service.getCurrentPrice('ETH/USDT')).toBe(0);
      expect(service.getCurrentPrice('ETH/BTC')).toBe(0);
    });
  });
});
