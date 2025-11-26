import React from "react";
import { useCryptoData } from "../hooks/useCryptoData";
import { CryptoCard } from "./CryptoCard";
import { PriceChart } from "./PriceChart";

/**
 * Main dashboard component that displays real-time cryptocurrency data.
 * Shows connection status, current prices in cards, and historical price charts.
 * Handles loading states, connection errors, and gracefully displays data as it arrives.
 * @returns {JSX.Element} The rendered dashboard
 */
export const Dashboard: React.FC = () => {
  const { data, history, isConnected, error } = useCryptoData();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">
            Connection Error
          </h2>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!isConnected && data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-blue-400 font-medium">
            Connecting to live feed...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Crypto Live Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time prices and hourly averages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              isConnected
                ? "bg-green-500 shadow-[0_0_10px_#22c55e]"
                : "bg-red-500"
            }`}
          ></div>
          <span className="text-sm text-gray-400">
            {isConnected ? "Live Connected" : "Disconnected"}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {data.map((item) => (
          <CryptoCard
            key={item.symbol}
            symbol={item.symbol}
            price={item.price}
            average={item.average}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.map((item) => (
          <PriceChart
            key={item.symbol}
            symbol={item.symbol}
            data={history[item.symbol] || []}
          />
        ))}
      </div>
    </div>
  );
};
