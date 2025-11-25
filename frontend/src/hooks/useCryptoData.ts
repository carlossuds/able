import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface CryptoData {
  symbol: string;
  price: number;
  average: number;
  timestamp: number;
}

export const useCryptoData = () => {
  const [data, setData] = useState<CryptoData[]>([]);
  const [history, setHistory] = useState<Record<string, CryptoData[]>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket: Socket = io("http://localhost:3000");

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
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
