import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FinnhubService } from '../finnhub/finnhub.service';
import { Logger } from '@nestjs/common';

/**
 * WebSocket gateway that streams real-time cryptocurrency data to connected clients.
 * Automatically starts streaming when clients connect and stops when all clients disconnect.
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CryptoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  /** Socket.IO server instance for broadcasting messages */
  @WebSocketServer()
  server: Server;

  /** Logger instance for this gateway */
  private readonly logger = new Logger(CryptoGateway.name);

  /** Interval timer for periodic data streaming */
  private interval: NodeJS.Timeout | null = null;

  /** Count of currently connected clients */
  private connectedClients = 0;

  constructor(private readonly finnhubService: FinnhubService) {}

  /**
   * Handles new client connections.
   * Increments client count and starts streaming if this is the first client.
   * @param {Socket} client - The connected Socket.IO client
   */
  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(
      `Client connected: ${client.id}. Total clients: ${this.connectedClients}`,
    );
    if (!this.interval) {
      this.startStreaming();
    }
  }

  /**
   * Handles client disconnections.
   * Decrements client count and stops streaming if no clients remain.
   * @param {Socket} client - The disconnected Socket.IO client
   */
  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(
      `Client disconnected: ${client.id}. Total clients: ${this.connectedClients}`,
    );
    if (this.connectedClients <= 0) {
      this.stopStreaming();
    }
  }

  /**
   * Starts streaming cryptocurrency data to all connected clients.
   * Emits data every 1 second via the 'crypto-data' event.
   */
  private startStreaming() {
    this.logger.log('Starting crypto data streaming');
    this.interval = setInterval(() => {
      const data = this.finnhubService.getAllData();
      this.server.emit('crypto-data', data);
    }, 1000);
  }

  /**
   * Stops the data streaming interval.
   * Called when the last client disconnects.
   */
  private stopStreaming() {
    if (this.interval) {
      this.logger.log('Stopping crypto data streaming');
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
