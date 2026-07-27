import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

// jsdom has no WebSocket transport, and no test here exercises the live feed —
// components that open a socket get an inert stub instead of a connection error.
vi.mock('../lib/socket', () => ({
  createOrdersSocket: () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    removeAllListeners: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  }),
}));
