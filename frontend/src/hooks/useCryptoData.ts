import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

/**
 * Represents real-time cryptocurrency data received from the backend.
 */
export interface CryptoData {
  /** Cryptocurrency symbol (e.g., 'ETH/USDC') */
  symbol: string;
  /** Current price in USD */
  price: number;
  /** Hourly average price in USD */
  average: number;
  /** Timestamp of the data point in milliseconds */
  timestamp: number;
}

/**
 * Custom React hook for managing real-time cryptocurrency data via WebSocket.
 * Connects to the backend Socket.IO server and maintains current data and historical price data.
 * Automatically handles connection state, errors, and reconnection.
 *
 * @returns {Object} Hook state object
 * @returns {CryptoData[]} data - Array of current cryptocurrency data
 * @returns {Record<string, CryptoData[]>} history - Historical price data by symbol (last 50 points)
 * @returns {boolean} isConnected - WebSocket connection status
 * @returns {string | null} error - Error message if connection fails, null otherwise
 */
export const useCryptoData = () => {
  const [data, setData] = useState<CryptoData[]>([]);
  const [history, setHistory] = useState<Record<string, CryptoData[]>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    const socket: Socket = io(backendUrl);

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err: Error) => {
      setIsConnected(false);
      setError("Connection to backend failed");
      console.error("Socket connection error:", err);
    });

    socket.on("crypto-data", (newData: CryptoData[]) => {
      setData(newData);
      setHistory((prev) => {
        const newHistory = { ...prev };
        newData.forEach((item) => {
          if (!newHistory[item.symbol]) {
            newHistory[item.symbol] = [];
          }
          newHistory[item.symbol] = [...newHistory[item.symbol], item].slice(
            -50
          ); // Keep last 50 points
        });
        return newHistory;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { data, history, isConnected, error };
};
