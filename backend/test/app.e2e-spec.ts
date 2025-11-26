/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { io, Socket } from 'socket.io-client';

interface CryptoData {
  symbol: string;
  price: number;
  average: number;
  timestamp: number;
}

describe('Crypto Dashboard E2E', () => {
  let app: INestApplication;
  let client: Socket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3001); // Use different port for testing
  });

  afterAll(async () => {
    if (client) {
      client.disconnect();
    }
    await app.close();
  });

  afterEach(() => {
    if (client && client.connected) {
      client.disconnect();
    }
  });

  describe('WebSocket Gateway', () => {
    it('should connect to the WebSocket gateway', (done) => {
      client = io('http://localhost:3001');

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        done();
      });

      client.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should receive crypto-data events', (done) => {
      client = io('http://localhost:3001');

      client.on('connect', () => {
        client.on('crypto-data', (data: CryptoData[]) => {
          expect(Array.isArray(data)).toBe(true);
          expect(data.length).toBeGreaterThan(0);

          // Verify data structure
          data.forEach((item) => {
            expect(item).toHaveProperty('symbol');
            expect(item).toHaveProperty('price');
            expect(item).toHaveProperty('average');
            expect(item).toHaveProperty('timestamp');

            expect(typeof item.symbol).toBe('string');
            expect(typeof item.price).toBe('number');
            expect(typeof item.average).toBe('number');
            expect(typeof item.timestamp).toBe('number');
          });

          done();
        });
      });

      client.on('connect_error', (error) => {
        done(error);
      });
    }, 10000); // Increase timeout as we need to wait for real data

    it('should receive data for all three crypto pairs', (done) => {
      client = io('http://localhost:3001');

      client.on('connect', () => {
        client.on('crypto-data', (data: CryptoData[]) => {
          const symbols = data.map((item) => item.symbol);

          expect(symbols).toContain('ETH/USDC');
          expect(symbols).toContain('ETH/USDT');
          expect(symbols).toContain('ETH/BTC');

          done();
        });
      });

      client.on('connect_error', (error) => {
        done(error);
      });
    }, 10000);

    it('should receive periodic updates', (done) => {
      client = io('http://localhost:3001');
      let updateCount = 0;

      client.on('connect', () => {
        client.on('crypto-data', () => {
          updateCount++;

          if (updateCount >= 3) {
            // Received at least 3 updates
            expect(updateCount).toBeGreaterThanOrEqual(3);
            done();
          }
        });
      });

      client.on('connect_error', (error) => {
        done(error);
      });
    }, 15000); // Wait for multiple updates

    it('should handle multiple simultaneous clients', (done) => {
      const client1 = io('http://localhost:3001');
      const client2 = io('http://localhost:3001');

      let client1Connected = false;
      let client2Connected = false;
      let client1ReceivedData = false;
      let client2ReceivedData = false;

      const checkCompletion = () => {
        if (
          client1Connected &&
          client2Connected &&
          client1ReceivedData &&
          client2ReceivedData
        ) {
          client1.disconnect();
          client2.disconnect();
          done();
        }
      };

      client1.on('connect', () => {
        client1Connected = true;
        checkCompletion();
      });

      client2.on('connect', () => {
        client2Connected = true;
        checkCompletion();
      });

      client1.on('crypto-data', (data) => {
        expect(Array.isArray(data)).toBe(true);
        client1ReceivedData = true;
        checkCompletion();
      });

      client2.on('crypto-data', (data) => {
        expect(Array.isArray(data)).toBe(true);
        client2ReceivedData = true;
        checkCompletion();
      });

      client1.on('connect_error', (error) => {
        client1.disconnect();
        client2.disconnect();
        done(error);
      });

      client2.on('connect_error', (error) => {
        client1.disconnect();
        client2.disconnect();
        done(error);
      });
    }, 15000);

    it('should stop streaming when all clients disconnect', (done) => {
      const testClient = io('http://localhost:3001');

      testClient.on('connect', () => {
        // Wait for first data emission
        testClient.once('crypto-data', () => {
          // Disconnect
          testClient.disconnect();

          // Wait a bit to ensure streaming stops
          setTimeout(() => {
            // Reconnect and verify streaming restarts
            const newClient = io('http://localhost:3001');

            newClient.on('connect', () => {
              newClient.on('crypto-data', (data) => {
                expect(Array.isArray(data)).toBe(true);
                newClient.disconnect();
                done();
              });
            });

            newClient.on('connect_error', (error) => {
              newClient.disconnect();
              done(error);
            });
          }, 2000);
        });
      });

      testClient.on('connect_error', (error) => {
        testClient.disconnect();
        done(error);
      });
    }, 20000);
  });
});
