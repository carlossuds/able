import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCryptoData } from "../useCryptoData";
import { io } from "socket.io-client";

// Mock socket.io-client
vi.mock("socket.io-client");

describe("useCryptoData", () => {
  let mockSocket: any;

  beforeEach(() => {
    // Create a mock socket with event emitter functionality
    const eventHandlers: Record<string, Function> = {};

    mockSocket = {
      on: vi.fn((event: string, handler: Function) => {
        eventHandlers[event] = handler;
      }),
      emit: vi.fn((event: string, ...args: any[]) => {
        if (eventHandlers[event]) {
          eventHandlers[event](...args);
        }
      }),
      disconnect: vi.fn(),
      connected: true,
    };

    // Mock io to return our mock socket
    (io as any).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty data and disconnected state", () => {
    const { result } = renderHook(() => useCryptoData());

    expect(result.current.data).toEqual([]);
    expect(result.current.history).toEqual({});
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should connect to backend WebSocket on mount", () => {
    renderHook(() => useCryptoData());

    expect(io).toHaveBeenCalledWith(
      expect.stringContaining("http://localhost:3000")
    );
    expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(
      "disconnect",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "connect_error",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "crypto-data",
      expect.any(Function)
    );
  });

  it("should set isConnected to true on connect event", async () => {
    const { result } = renderHook(() => useCryptoData());

    // Trigger connect event
    const connectHandler = (mockSocket.on as any).mock.calls.find(
      (call: any) => call[0] === "connect"
    )?.[1];

    connectHandler();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  it("should set isConnected to false on disconnect event", async () => {
    const { result } = renderHook(() => useCryptoData());

    // First connect
    const connectHandler = (mockSocket.on as any).mock.calls.find(
      (call: any) => call[0] === "connect"
    )?.[1];
    connectHandler();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Then disconnect
    const disconnectHandler = (mockSocket.on as any).mock.calls.find(
      (call: any) => call[0] === "disconnect"
    )?.[1];
    disconnectHandler();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it("should handle connection errors", async () => {
    const { result } = renderHook(() => useCryptoData());

    const errorHandler = (mockSocket.on as any).mock.calls.find(
      (call: any) => call[0] === "connect_error"
    )?.[1];

    const mockError = new Error("Connection failed");
    errorHandler(mockError);

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe("Connection to backend failed");
    });
  });

  it("should update data state when receiving crypto-data", async () => {
    const { result } = renderHook(() => useCryptoData());

    const dataHandler = (mockSocket.on as any).mock.calls.find(
      (call: any) => call[0] === "crypto-data"
    )?.[1];

    const mockData = [
      { symbol: "ETH/USDC", price: 2500, average: 2480, timestamp: Date.now() },
      { symbol: "ETH/USDT", price: 2501, average: 2481, timestamp: Date.now() },
    ];

    dataHandler(mockData);

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });
  });

  it("should build history state from crypto-data events", async () => {
    const { result } = renderHook(() => useCryptoData());

    const dataHandler = (mockSocket.on as any).mock.calls.find(
      (call: any) => call[0] === "crypto-data"
    )?.[1];

    const mockData1 = [
      { symbol: "ETH/USDC", price: 2500, average: 2480, timestamp: 1000 },
    ];

    const mockData2 = [
      { symbol: "ETH/USDC", price: 2510, average: 2485, timestamp: 2000 },
    ];

    dataHandler(mockData1);
    await waitFor(() => {
      expect(result.current.history["ETH/USDC"]).toHaveLength(1);
    });

    dataHandler(mockData2);
    await waitFor(() => {
      expect(result.current.history["ETH/USDC"]).toHaveLength(2);
      expect(result.current.history["ETH/USDC"][0]).toEqual(mockData1[0]);
      expect(result.current.history["ETH/USDC"][1]).toEqual(mockData2[0]);
    });
  });

  it("should limit history to last 50 points per symbol", async () => {
    const { result } = renderHook(() => useCryptoData());

    const dataHandler = (mockSocket.on as any).mock.calls.find(
      (call: any) => call[0] === "crypto-data"
    )?.[1];

    // Send 60 data points
    for (let i = 0; i < 60; i++) {
      const mockData = [
        {
          symbol: "ETH/USDC",
          price: 2500 + i,
          average: 2480,
          timestamp: i * 1000,
        },
      ];
      dataHandler(mockData);
    }

    await waitFor(() => {
      expect(result.current.history["ETH/USDC"]).toHaveLength(50);
      // Should keep the most recent 50
      expect(result.current.history["ETH/USDC"][0].price).toBe(2510); // 2500 + 10
      expect(result.current.history["ETH/USDC"][49].price).toBe(2559); // 2500 + 59
    });
  });

  it("should handle multiple symbols in history", async () => {
    const { result } = renderHook(() => useCryptoData());

    const dataHandler = (mockSocket.on as any).mock.calls.find(
      (call: any) => call[0] === "crypto-data"
    )?.[1];

    const mockData = [
      { symbol: "ETH/USDC", price: 2500, average: 2480, timestamp: 1000 },
      { symbol: "ETH/USDT", price: 2501, average: 2481, timestamp: 1000 },
      { symbol: "ETH/BTC", price: 0.055, average: 0.054, timestamp: 1000 },
    ];

    dataHandler(mockData);

    await waitFor(() => {
      expect(result.current.history["ETH/USDC"]).toHaveLength(1);
      expect(result.current.history["ETH/USDT"]).toHaveLength(1);
      expect(result.current.history["ETH/BTC"]).toHaveLength(1);
    });
  });

  it("should disconnect socket on unmount", () => {
    const { unmount } = renderHook(() => useCryptoData());

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
