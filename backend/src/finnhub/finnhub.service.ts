import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

interface FinnhubTrade {
  p: number; // Price
  s: string; // Symbol
  t: number; // Timestamp
  v: number; // Volume
}

interface FinnhubMessage {
  type: string;
  data: FinnhubTrade[];
}

@Injectable()
export class FinnhubService implements OnModuleInit {
  private ws: WebSocket;
  private readonly logger = new Logger(FinnhubService.name);
  private readonly symbols = [
    'BINANCE:ETHUSDC',
    'BINANCE:ETHUSDT',
    'BINANCE:ETHBTC',
  ];
  // Mapping from Finnhub symbol to our display symbol
  private readonly symbolMap = {
    'BINANCE:ETHUSDC': 'ETH/USDC',
    'BINANCE:ETHUSDT': 'ETH/USDT',
    'BINANCE:ETHBTC': 'ETH/BTC',
  };

  private priceHistory: Record<string, { price: number; timestamp: number }[]> =
    {
      'ETH/USDC': [],
      'ETH/USDT': [],
      'ETH/BTC': [],
    };

  private currentPrices: Record<string, number> = {};

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.connect();
  }

  private connect() {
    const apiKey = this.configService.get<string>('FINNHUB_API_KEY');
    if (!apiKey) {
      this.logger.error('FINNHUB_API_KEY is not defined');
      return;
    }

    this.ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

    this.ws.on('open', () => {
      this.logger.log('Connected to Finnhub WebSocket');
      this.symbols.forEach((symbol) => {
        this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      });
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString()) as FinnhubMessage;
        if (message.type === 'trade') {
          message.data.forEach((trade: FinnhubTrade) => {
            const symbol = this.symbolMap[trade.s];
            if (symbol) {
              this.handleTrade(symbol, trade.p, trade.t);
            }
          });
        }
      } catch (e) {
        this.logger.error('Error parsing message', e);
      }
    });

    this.ws.on('error', (error) => {
      this.logger.error('WebSocket error', error);
    });

    this.ws.on('close', () => {
      this.logger.warn('WebSocket disconnected. Reconnecting in 5 seconds...');
      setTimeout(() => this.connect(), 5000);
    });
  }

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

  getHourlyAverage(symbol: string): number {
    const history = this.priceHistory[symbol];
    if (!history || history.length === 0) return 0;
    const sum = history.reduce((acc, curr) => acc + curr.price, 0);
    return sum / history.length;
  }

  getCurrentPrice(symbol: string): number {
    return this.currentPrices[symbol] || 0;
  }

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
