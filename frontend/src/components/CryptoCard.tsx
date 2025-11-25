import React from "react";

interface CryptoCardProps {
  symbol: string;
  price: number;
  average: number;
}

export const CryptoCard: React.FC<CryptoCardProps> = ({
  symbol,
  price,
  average,
}) => {
  const isPositive = price >= average;

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <h3 className="text-xl font-bold text-white mb-2">{symbol}</h3>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm text-gray-400">Current Price</p>
          <p className="text-2xl font-mono font-bold text-white">
            $
            {price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Hourly Avg</p>
          <p
            className={`text-lg font-mono font-semibold ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            $
            {average.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
