import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

/**
 * Represents a single trade event from Finnhub WebSocket API.
 */
interface FinnhubTrade {
  /** Price of the trade */
  p: number;
  /** Symbol identifier (e.g., 'BINANCE:ETHUSDC') */
  s: string;
  /** Timestamp of the trade in milliseconds */
  t: number;
  /** Volume of the trade */
  v: number;
}

/**
 * Represents a message received from Finnhub WebSocket.
 */
interface FinnhubMessage {
  /** Message type (e.g., 'trade', 'ping') */
  type: string;
  /** Array of trade events */
  data: FinnhubTrade[];
}

/**
 * Service that manages WebSocket connection to Finnhub API for real-time cryptocurrency data.
 * Subscribes to ETH/USDC, ETH/USDT, and ETH/BTC trading pairs and maintains price history.
 */
@Injectable()
export class FinnhubService implements OnModuleInit {
  /** WebSocket connection to Finnhub API */
  private ws: WebSocket;

  /** Logger instance for this service */
  private readonly logger = new Logger(FinnhubService.name);

  /** Maps Finnhub symbol names to human-readable format */
  private readonly symbolMap: Record<string, string> = {
    'BINANCE:ETHUSDC': 'ETH/USDC',
    'BINANCE:ETHUSDT': 'ETH/USDT',
    'BINANCE:ETHBTC': 'ETH/BTC',
  };

  /** Array of Finnhub symbols to subscribe to */
  private readonly symbols = Object.keys(this.symbolMap);

  /** Stores price history for the last hour for each symbol */
  private priceHistory: Record<string, { price: number; timestamp: number }[]> =
    {
      'ETH/USDC': [],
      'ETH/USDT': [],
      'ETH/BTC': [],
    };

  /** Stores the most recent price for each symbol */
  private currentPrices: Record<string, number> = {};

  constructor(private configService: ConfigService) {}

  /**
   * Lifecycle hook called when the module is initialized.
   * Establishes WebSocket connection to Finnhub.
   */
  onModuleInit() {
    this.connect();
  }

  /**
   * Establishes WebSocket connection to Finnhub API and sets up event handlers.
   * Automatically reconnects on disconnection after 5 seconds.
   * Subscribes to configured cryptocurrency trading pairs.
   */
  private connect() {
    const apiKey = this.configService.get<string>('FINNHUB_API_KEY');
    if (!apiKey) {
      this.logger.error(
        'FINNHUB_API_KEY is not defined in environment variables',
      );
      return;
    }

    this.ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

    this.ws.on('open', () => {
      this.logger.log('Connected to Finnhub WebSocket');
      this.symbols.forEach((symbol) => {
        this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
        this.logger.debug(`Subscribed to ${symbol}`);
      });
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        let dataString: string;
        if (Buffer.isBuffer(data)) {
          dataString = data.toString('utf-8');
        } else if (Array.isArray(data)) {
          dataString = Buffer.concat(data).toString('utf-8');
        } else if (data instanceof ArrayBuffer) {
          dataString = Buffer.from(data).toString('utf-8');
        } else {
          dataString = String(data);
        }
        const message = JSON.parse(dataString) as FinnhubMessage;
        if (message.type === 'trade') {
          message.data.forEach((trade: FinnhubTrade) => {
            const symbol = this.symbolMap[trade.s];
            if (symbol) {
              this.handleTrade(symbol, trade.p, trade.t);
            }
          });
        }
      } catch (e) {
        this.logger.error(
          'Error parsing WebSocket message',
          e instanceof Error ? e.message : e,
        );
      }
    });

    this.ws.on('error', (error) => {
      this.logger.error('WebSocket error occurred', error);
    });

    this.ws.on('close', () => {
      this.logger.warn('WebSocket disconnected. Reconnecting in 5 seconds...');
      setTimeout(() => this.connect(), 5000);
    });
  }

  /**
   * Processes a trade event by updating current price and price history.
   * Automatically cleans up history older than 1 hour.
   * @param {string} symbol - The cryptocurrency symbol (e.g., 'ETH/USDC')
   * @param {number} price - The trade price
   * @param {number} timestamp - The trade timestamp in milliseconds
   */
  private handleTrade(symbol: string, price: number, timestamp: number) {
    this.currentPrices[symbol] = price;
    // timestamp from finnhub is in ms
    this.priceHistory[symbol].push({ price, timestamp });

    // Clean up old history (older than 1 hour)
    const oneHourAgo = Date.now() - 3600000;
    this.priceHistory[symbol] = this.priceHistory[symbol].filter(
      (entry) => entry.timestamp > oneHourAgo,
    );
  }

  /**
   * Calculates the average price for a symbol over the last hour.
   * @param {string} symbol - The cryptocurrency symbol (e.g., 'ETH/USDC')
   * @returns {number} The average price, or 0 if no data available
   */
  getHourlyAverage(symbol: string): number {
    const history = this.priceHistory[symbol];
    if (!history || history.length === 0) return 0;
    const sum = history.reduce((acc, curr) => acc + curr.price, 0);
    return sum / history.length;
  }

  /**
   * Gets the most recent price for a symbol.
   * @param {string} symbol - The cryptocurrency symbol (e.g., 'ETH/USDC')
   * @returns {number} The current price, or 0 if no data available
   */
  getCurrentPrice(symbol: string): number {
    return this.currentPrices[symbol] || 0;
  }

  /**
   * Retrieves current data for all tracked cryptocurrency symbols.
   * @returns {Array<{symbol: string, price: number, average: number, timestamp: number}>} Array of crypto data objects
   */
  getAllData() {
    return Object.keys(this.symbolMap).map((finnhubSymbol) => {
      const symbol = this.symbolMap[finnhubSymbol];
      return {
        symbol,
        price: this.getCurrentPrice(symbol),
        average: this.getHourlyAverage(symbol),
        timestamp: Date.now(),
      };
    });
  }
}
