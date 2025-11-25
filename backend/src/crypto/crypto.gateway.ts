import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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
  private interval: NodeJS.Timeout | null = null;
  private connectedClients = 0;

  constructor(private readonly finnhubService: FinnhubService) {}

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(
      `Client connected: ${client.id}. Total clients: ${this.connectedClients}`,
    );
    if (!this.interval) {
      this.startStreaming();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(
      `Client disconnected: ${client.id}. Total clients: ${this.connectedClients}`,
    );
    if (this.connectedClients <= 0) {
      this.stopStreaming();
    }
  }

  private startStreaming() {
    this.logger.log('Starting crypto data streaming');
    this.interval = setInterval(() => {
      const data = this.finnhubService.getAllData();
      this.server.emit('crypto-data', data);
    }, 1000);
  }

  private stopStreaming() {
    if (this.interval) {
      this.logger.log('Stopping crypto data streaming');
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
