import { Test, TestingModule } from '@nestjs/testing';
import { CryptoGateway } from './crypto.gateway';
import { FinnhubService } from '../finnhub/finnhub.service';
import { Server, Socket } from 'socket.io';

describe('CryptoGateway', () => {
  let gateway: CryptoGateway;
  let finnhubService: jest.Mocked<FinnhubService>;
  let mockServer: jest.Mocked<Server>;

  beforeEach(async () => {
    // Create mock FinnhubService
    const mockFinnhubService = {
      getAllData: jest.fn().mockReturnValue([
        {
          symbol: 'ETH/USDC',
          price: 2500,
          average: 2480,
          timestamp: Date.now(),
        },
        {
          symbol: 'ETH/USDT',
          price: 2501,
          average: 2481,
          timestamp: Date.now(),
        },
        {
          symbol: 'ETH/BTC',
          price: 0.055,
          average: 0.054,
          timestamp: Date.now(),
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoGateway,
        {
          provide: FinnhubService,
          useValue: mockFinnhubService,
        },
      ],
    }).compile();

    gateway = module.get<CryptoGateway>(CryptoGateway);
    finnhubService = module.get(FinnhubService);

    // Create mock Socket.IO server
    mockServer = {
      emit: jest.fn(),
    } as any;

    gateway.server = mockServer;
  });

  afterEach(() => {
    // Clean up any intervals
    gateway['stopStreaming']();
  });

  describe('Client Connection Handling', () => {
    it('should increment client count on connection', () => {
      const mockClient = { id: 'client-1' } as Socket;

      gateway.handleConnection(mockClient);

      expect(gateway['connectedClients']).toBe(1);
    });

    it('should start streaming when first client connects', () => {
      jest.useFakeTimers();
      const mockClient = { id: 'client-1' } as Socket;

      gateway.handleConnection(mockClient);

      expect(gateway['interval']).not.toBeNull();

      jest.useRealTimers();
    });

    it('should not start multiple streaming intervals for multiple clients', () => {
      jest.useFakeTimers();
      const mockClient1 = { id: 'client-1' } as Socket;
      const mockClient2 = { id: 'client-2' } as Socket;

      gateway.handleConnection(mockClient1);
      const firstInterval = gateway['interval'];

      gateway.handleConnection(mockClient2);
      const secondInterval = gateway['interval'];

      expect(firstInterval).toBe(secondInterval);
      expect(gateway['connectedClients']).toBe(2);

      jest.useRealTimers();
    });

    it('should emit data to all clients at 1 second intervals', () => {
      jest.useFakeTimers();
      const mockClient = { id: 'client-1' } as Socket;

      gateway.handleConnection(mockClient);

      // Clear initial calls
      mockServer.emit.mockClear();
      finnhubService.getAllData.mockClear();

      // Fast-forward 1 second
      jest.advanceTimersByTime(1000);

      expect(finnhubService.getAllData).toHaveBeenCalledTimes(1);
      expect(mockServer.emit).toHaveBeenCalledTimes(1);
      expect(mockServer.emit).toHaveBeenCalledWith('crypto-data', [
        expect.objectContaining({ symbol: 'ETH/USDC' }),
        expect.objectContaining({ symbol: 'ETH/USDT' }),
        expect.objectContaining({ symbol: 'ETH/BTC' }),
      ]);

      // Fast-forward another second
      jest.advanceTimersByTime(1000);

      expect(finnhubService.getAllData).toHaveBeenCalledTimes(2);
      expect(mockServer.emit).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('Client Disconnection Handling', () => {
    it('should decrement client count on disconnection', () => {
      const mockClient1 = { id: 'client-1' } as Socket;
      const mockClient2 = { id: 'client-2' } as Socket;

      gateway.handleConnection(mockClient1);
      gateway.handleConnection(mockClient2);

      expect(gateway['connectedClients']).toBe(2);

      gateway.handleDisconnect(mockClient1);

      expect(gateway['connectedClients']).toBe(1);
    });

    it('should stop streaming when last client disconnects', () => {
      jest.useFakeTimers();
      const mockClient = { id: 'client-1' } as Socket;

      gateway.handleConnection(mockClient);
      expect(gateway['interval']).not.toBeNull();

      gateway.handleDisconnect(mockClient);
      expect(gateway['interval']).toBeNull();

      jest.useRealTimers();
    });

    it('should not stop streaming if other clients are still connected', () => {
      jest.useFakeTimers();
      const mockClient1 = { id: 'client-1' } as Socket;
      const mockClient2 = { id: 'client-2' } as Socket;

      gateway.handleConnection(mockClient1);
      gateway.handleConnection(mockClient2);

      gateway.handleDisconnect(mockClient1);

      expect(gateway['interval']).not.toBeNull();
      expect(gateway['connectedClients']).toBe(1);

      jest.useRealTimers();
    });

    it('should handle client count going to zero correctly', () => {
      jest.useFakeTimers();
      const mockClient = { id: 'client-1' } as Socket;

      gateway.handleConnection(mockClient);
      gateway.handleDisconnect(mockClient);

      expect(gateway['connectedClients']).toBe(0);
      expect(gateway['interval']).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Streaming Management', () => {
    it('should emit crypto data from FinnhubService', () => {
      jest.useFakeTimers();
      const mockClient = { id: 'client-1' } as Socket;

      const mockData = [
        {
          symbol: 'ETH/USDC',
          price: 3000,
          average: 2950,
          timestamp: Date.now(),
        },
      ];
      finnhubService.getAllData.mockReturnValue(mockData);

      gateway.handleConnection(mockClient);

      mockServer.emit.mockClear();
      jest.advanceTimersByTime(1000);

      expect(mockServer.emit).toHaveBeenCalledWith('crypto-data', mockData);

      jest.useRealTimers();
    });

    it('should continue streaming even if FinnhubService returns empty data', () => {
      jest.useFakeTimers();
      const mockClient = { id: 'client-1' } as Socket;

      finnhubService.getAllData.mockReturnValue([]);

      gateway.handleConnection(mockClient);

      mockServer.emit.mockClear();
      jest.advanceTimersByTime(1000);

      expect(mockServer.emit).toHaveBeenCalledWith('crypto-data', []);
      expect(gateway['interval']).not.toBeNull();

      jest.useRealTimers();
    });

    it('should clear interval when stopping streaming', () => {
      jest.useFakeTimers();
      const mockClient = { id: 'client-1' } as Socket;

      gateway.handleConnection(mockClient);
      const intervalId = gateway['interval'];

      gateway['stopStreaming']();

      expect(gateway['interval']).toBeNull();

      // Verify no more emissions after stopping
      mockServer.emit.mockClear();
      jest.advanceTimersByTime(5000);

      expect(mockServer.emit).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Multiple Client Scenarios', () => {
    it('should handle rapid connect/disconnect cycles', () => {
      jest.useFakeTimers();

      for (let i = 0; i < 10; i++) {
        const client = { id: `client-${i}` } as Socket;
        gateway.handleConnection(client);
        gateway.handleDisconnect(client);
      }

      expect(gateway['connectedClients']).toBe(0);
      expect(gateway['interval']).toBeNull();

      jest.useRealTimers();
    });

    it('should maintain correct client count with overlapping connections', () => {
      const clients = Array.from({ length: 5 }, (_, i) => ({
        id: `client-${i}`,
      })) as Socket[];

      // Connect all clients
      clients.forEach((client) => gateway.handleConnection(client));
      expect(gateway['connectedClients']).toBe(5);

      // Disconnect some clients
      gateway.handleDisconnect(clients[0]);
      gateway.handleDisconnect(clients[1]);
      expect(gateway['connectedClients']).toBe(3);

      // Connect more clients
      const newClient = { id: 'client-new' } as Socket;
      gateway.handleConnection(newClient);
      expect(gateway['connectedClients']).toBe(4);
    });
  });
});
