import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PriceChart } from "../PriceChart";
import type { CryptoData } from "../../hooks/useCryptoData";

// Mock recharts to avoid rendering issues in tests
vi.mock("recharts", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

describe("PriceChart", () => {
  const mockData: CryptoData[] = [
    { symbol: "ETH/USDC", price: 2500, average: 2480, timestamp: 1000 },
    { symbol: "ETH/USDC", price: 2510, average: 2485, timestamp: 2000 },
    { symbol: "ETH/USDC", price: 2520, average: 2490, timestamp: 3000 },
  ];

  it("should render the chart title with symbol", () => {
    render(<PriceChart data={mockData} symbol="ETH/USDC" />);
    expect(screen.getByText("ETH/USDC Price History")).toBeInTheDocument();
  });

  it("should render ResponsiveContainer", () => {
    render(<PriceChart data={mockData} symbol="ETH/USDC" />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("should render LineChart", () => {
    render(<PriceChart data={mockData} symbol="ETH/USDC" />);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should render CartesianGrid", () => {
    render(<PriceChart data={mockData} symbol="ETH/USDC" />);
    expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
  });

  it("should render XAxis", () => {
    render(<PriceChart data={mockData} symbol="ETH/USDC" />);
    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
  });

  it("should render YAxis", () => {
    render(<PriceChart data={mockData} symbol="ETH/USDC" />);
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
  });

  it("should render Tooltip", () => {
    render(<PriceChart data={mockData} symbol="ETH/USDC" />);
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
  });

  it("should render two Line components (price and average)", () => {
    render(<PriceChart data={mockData} symbol="ETH/USDC" />);
    const lines = screen.getAllByTestId("line");
    expect(lines).toHaveLength(2);
  });

  it("should handle empty data array", () => {
    render(<PriceChart data={[]} symbol="ETH/USDC" />);
    expect(screen.getByText("ETH/USDC Price History")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should handle single data point", () => {
    const singleData: CryptoData[] = [
      { symbol: "ETH/USDC", price: 2500, average: 2480, timestamp: 1000 },
    ];

    render(<PriceChart data={singleData} symbol="ETH/USDC" />);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should render with different symbols", () => {
    render(<PriceChart data={mockData} symbol="ETH/USDT" />);
    expect(screen.getByText("ETH/USDT Price History")).toBeInTheDocument();
  });

  it("should handle special characters in symbol", () => {
    render(<PriceChart data={mockData} symbol="ETH/BTC" />);
    expect(screen.getByText("ETH/BTC Price History")).toBeInTheDocument();
  });
});
