import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { FinnhubService } from '../finnhub/finnhub.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CryptoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CryptoGateway.name);
  private interval: NodeJS.Timeout;

  constructor(private readonly finnhubService: FinnhubService) {}

  handleConnection(client: any) {
    this.logger.log(`Client connected: ${client.id}`);
    if (!this.interval) {
      this.startStreaming();
    }
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private startStreaming() {
    this.interval = setInterval(() => {
      const data = this.finnhubService.getAllData();
      this.server.emit('crypto-data', data);
    }, 1000);
  }
}
