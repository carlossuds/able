import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { CryptoData } from "../hooks/useCryptoData";

/**
 * Props for the PriceChart component.
 */
interface PriceChartProps {
  /** Historical cryptocurrency data points */
  data: CryptoData[];
  /** Cryptocurrency symbol for the chart title */
  symbol: string;
}

/**
 * Chart component that displays price history for a cryptocurrency.
 * Shows both current price (solid purple line) and hourly average (dashed green line).
 * Uses Recharts library for responsive, interactive line charts.
 * @param {PriceChartProps} props - Component props
 * @returns {JSX.Element} The rendered price chart
 */
export const PriceChart: React.FC<PriceChartProps> = ({ data, symbol }) => {
  return (
    <div className="h-64 w-full bg-white/5 rounded-xl p-4 border border-white/10">
      <h4 className="text-white text-sm mb-4 font-semibold">
        {symbol} Price History
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="timestamp" tick={false} stroke="#ffffff50" />
          <YAxis
            domain={["auto", "auto"]}
            stroke="#ffffff50"
            tickFormatter={(val) => `$${val.toFixed(2)}`}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "none",
              borderRadius: "8px",
            }}
            itemStyle={{ color: "#fff" }}
            labelStyle={{ display: "none" }}
            formatter={(value: number) => [`$${value.toFixed(4)}`, "Price"]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: "#8b5cf6" }}
            animationDuration={300}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke="#10b981"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
