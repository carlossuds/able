import React from "react";

/**
 * Props for the CryptoCard component.
 */
interface CryptoCardProps {
  /** Cryptocurrency symbol (e.g., 'ETH/USDC') */
  symbol: string;
  /** Current price in USD */
  price: number;
  /** Hourly average price in USD */
  average: number;
}

/**
 * Card component that displays current price and hourly average for a cryptocurrency.
 * Uses color coding (green/red) to indicate if current price is above or below the hourly average.
 * @param {CryptoCardProps} props - Component props
 * @returns {JSX.Element} The rendered crypto card
 */
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
