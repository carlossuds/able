import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Dashboard } from "../Dashboard";
import * as useCryptoDataModule from "../../hooks/useCryptoData";
import type { CryptoData } from "../../hooks/useCryptoData";

// Mock the useCryptoData hook
vi.mock("../../hooks/useCryptoData");

// Mock child components
vi.mock("../CryptoCard", () => ({
  CryptoCard: ({
    symbol,
    price,
    average,
  }: {
    symbol: string;
    price: number;
    average: number;
  }) => (
    <div data-testid={`crypto-card-${symbol}`}>
      {symbol}: ${price} (avg: ${average})
    </div>
  ),
}));

vi.mock("../PriceChart", () => ({
  PriceChart: ({ symbol }: { symbol: string }) => (
    <div data-testid={`price-chart-${symbol}`}>{symbol} Chart</div>
  ),
}));

describe("Dashboard", () => {
  const mockData: CryptoData[] = [
    { symbol: "ETH/USDC", price: 2500, average: 2480, timestamp: Date.now() },
    { symbol: "ETH/USDT", price: 2501, average: 2481, timestamp: Date.now() },
    { symbol: "ETH/BTC", price: 0.055, average: 0.054, timestamp: Date.now() },
  ];

  const mockHistory = {
    "ETH/USDC": [mockData[0]],
    "ETH/USDT": [mockData[1]],
    "ETH/BTC": [mockData[2]],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading state when not connected and no data", () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: [],
        history: {},
        isConnected: false,
        error: null,
      });

      render(<Dashboard />);

      expect(
        screen.getByText("Connecting to live feed...")
      ).toBeInTheDocument();
    });

    it("should show loading spinner when connecting", () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: [],
        history: {},
        isConnected: false,
        error: null,
      });

      render(<Dashboard />);

      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should show error message when connection fails", () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: [],
        history: {},
        isConnected: false,
        error: "Connection to backend failed",
      });

      render(<Dashboard />);

      expect(screen.getByText("Connection Error")).toBeInTheDocument();
      expect(
        screen.getByText("Connection to backend failed")
      ).toBeInTheDocument();
    });

    it("should not show loading state when there is an error", () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: [],
        history: {},
        isConnected: false,
        error: "Connection failed",
      });

      render(<Dashboard />);

      expect(
        screen.queryByText("Connecting to live feed...")
      ).not.toBeInTheDocument();
    });
  });

  describe("Connected State", () => {
    it("should show dashboard title", () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: mockData,
        history: mockHistory,
        isConnected: true,
        error: null,
      });

      render(<Dashboard />);

      expect(screen.getByText("Crypto Live Dashboard")).toBeInTheDocument();
    });

    it("should show subtitle", () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: mockData,
        history: mockHistory,
        isConnected: true,
        error: null,
      });

      render(<Dashboard />);

      expect(
        screen.getByText("Real-time prices and hourly averages")
      ).toBeInTheDocument();
    });

    it('should show "Live Connected" status when connected', () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: mockData,
        history: mockHistory,
        isConnected: true,
        error: null,
      });

      render(<Dashboard />);

      expect(screen.getByText("Live Connected")).toBeInTheDocument();
    });

    it('should show "Disconnected" status when not connected', () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: mockData,
        history: mockHistory,
        isConnected: false,
        error: null,
      });

      render(<Dashboard />);

      expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });

    it("should render CryptoCard for each data item", () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: mockData,
        history: mockHistory,
        isConnected: true,
        error: null,
      });

      render(<Dashboard />);

      expect(screen.getByTestId("crypto-card-ETH/USDC")).toBeInTheDocument();
      expect(screen.getByTestId("crypto-card-ETH/USDT")).toBeInTheDocument();
      expect(screen.getByTestId("crypto-card-ETH/BTC")).toBeInTheDocument();
    });

    it("should render PriceChart for each data item", () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: mockData,
        history: mockHistory,
        isConnected: true,
        error: null,
      });

      render(<Dashboard />);

      expect(screen.getByTestId("price-chart-ETH/USDC")).toBeInTheDocument();
      expect(screen.getByTestId("price-chart-ETH/USDT")).toBeInTheDocument();
      expect(screen.getByTestId("price-chart-ETH/BTC")).toBeInTheDocument();
    });

    it("should pass correct props to CryptoCard", () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: mockData,
        history: mockHistory,
        isConnected: true,
        error: null,
      });

      render(<Dashboard />);

      const card = screen.getByTestId("crypto-card-ETH/USDC");
      expect(card).toHaveTextContent("ETH/USDC: $2500 (avg: $2480)");
    });
  });

  describe("Connection Indicator", () => {
    it("should show green indicator when connected", () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: mockData,
        history: mockHistory,
        isConnected: true,
        error: null,
      });

      render(<Dashboard />);

      const indicator = document.querySelector(".bg-green-500");
      expect(indicator).toBeInTheDocument();
    });

    it("should show red indicator when disconnected", () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: mockData,
        history: mockHistory,
        isConnected: false,
        error: null,
      });

      render(<Dashboard />);

      const indicator = document.querySelector(".bg-red-500");
      expect(indicator).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty data array", () => {
      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: [],
        history: {},
        isConnected: true,
        error: null,
      });

      render(<Dashboard />);

      expect(screen.getByText("Crypto Live Dashboard")).toBeInTheDocument();
      expect(screen.queryByTestId(/crypto-card/)).not.toBeInTheDocument();
    });

    it("should handle partial data", () => {
      const partialData = [mockData[0]];
      const partialHistory = { "ETH/USDC": [mockData[0]] };

      vi.spyOn(useCryptoDataModule, "useCryptoData").mockReturnValue({
        data: partialData,
        history: partialHistory,
        isConnected: true,
        error: null,
      });

      render(<Dashboard />);

      expect(screen.getByTestId("crypto-card-ETH/USDC")).toBeInTheDocument();
      expect(
        screen.queryByTestId("crypto-card-ETH/USDT")
      ).not.toBeInTheDocument();
    });
  });
});
