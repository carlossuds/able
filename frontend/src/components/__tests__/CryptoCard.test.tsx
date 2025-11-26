import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CryptoCard } from "../CryptoCard";

describe("CryptoCard", () => {
  const defaultProps = {
    symbol: "ETH/USDC",
    price: 2500.5,
    average: 2480.25,
  };

  it("should render the symbol", () => {
    render(<CryptoCard {...defaultProps} />);
    expect(screen.getByText("ETH/USDC")).toBeInTheDocument();
  });

  it("should render the current price with correct formatting", () => {
    render(<CryptoCard {...defaultProps} />);
    expect(screen.getByText(/\$2,500\.50/)).toBeInTheDocument();
  });

  it("should render the hourly average with correct formatting", () => {
    render(<CryptoCard {...defaultProps} />);
    expect(screen.getByText(/\$2,480\.25/)).toBeInTheDocument();
  });

  it('should display "Current Price" label', () => {
    render(<CryptoCard {...defaultProps} />);
    expect(screen.getByText("Current Price")).toBeInTheDocument();
  });

  it('should display "Hourly Avg" label', () => {
    render(<CryptoCard {...defaultProps} />);
    expect(screen.getByText("Hourly Avg")).toBeInTheDocument();
  });

  describe("Color Coding", () => {
    it("should show green text when price is above average", () => {
      render(<CryptoCard symbol="ETH/USDC" price={2500} average={2400} />);

      const averageElement = screen.getByText(/\$2,400/);
      expect(averageElement).toHaveClass("text-green-400");
    });

    it("should show green text when price equals average", () => {
      render(<CryptoCard symbol="ETH/USDC" price={2500} average={2500} />);

      const elements = screen.getAllByText(/\$2,500/);
      const averageElement = elements.find((el) =>
        el.classList.contains("text-green-400")
      );
      expect(averageElement).toHaveClass("text-green-400");
    });

    it("should show red text when price is below average", () => {
      render(<CryptoCard symbol="ETH/USDC" price={2400} average={2500} />);

      const averageElement = screen.getByText(/\$2,500/);
      expect(averageElement).toHaveClass("text-red-400");
    });
  });

  describe("Price Formatting", () => {
    it("should format prices with minimum 2 decimal places", () => {
      render(<CryptoCard symbol="ETH/USDC" price={2500} average={2400} />);

      expect(screen.getByText(/\$2,500\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$2,400\.00/)).toBeInTheDocument();
    });

    it("should format prices with up to 4 decimal places for small values", () => {
      render(<CryptoCard symbol="ETH/BTC" price={0.0555} average={0.0544} />);

      expect(screen.getByText(/\$0\.0555/)).toBeInTheDocument();
      expect(screen.getByText(/\$0\.0544/)).toBeInTheDocument();
    });

    it("should handle large numbers with thousand separators", () => {
      render(
        <CryptoCard symbol="ETH/USDC" price={12345.67} average={12000.5} />
      );

      expect(screen.getByText(/\$12,345\.67/)).toBeInTheDocument();
      expect(screen.getByText(/\$12,000\.50/)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero prices", () => {
      render(<CryptoCard symbol="ETH/USDC" price={0} average={0} />);

      const elements = screen.getAllByText(/\$0\.00/);
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should handle very small prices", () => {
      render(<CryptoCard symbol="ETH/BTC" price={0.0001} average={0.0001} />);

      const elements = screen.getAllByText(/\$0\.0001/);
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should handle negative price differences correctly", () => {
      render(<CryptoCard symbol="ETH/USDC" price={2000} average={2500} />);

      const averageElement = screen.getByText(/\$2,500/);
      expect(averageElement).toHaveClass("text-red-400");
    });
  });
});
