import { io, type Socket } from 'socket.io-client';
import {
  ORDERS_NAMESPACE,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from '@foodjet/shared';
import { api } from './api-client';

export type OrdersSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * In development the Vite proxy forwards /socket.io to the API, so a relative
 * connection works. In production the API is a separate host, so the socket has
 * to be pointed at VITE_API_URL's origin explicitly.
 */
function resolveSocketOrigin(): string | undefined {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl || !/^https?:\/\//i.test(apiUrl)) return undefined;

  try {
    return new URL(apiUrl).origin;
  } catch {
    return undefined;
  }
}

export function createOrdersSocket(): OrdersSocket {
  const origin = resolveSocketOrigin();
  const url = `${origin ?? ''}${ORDERS_NAMESPACE}`;

  return io(url, {
    // The token is read lazily on every (re)connect attempt, so a socket that
    // reconnects after a silent token refresh authenticates with the new token
    // rather than the stale one captured at construction.
    auth: (cb) => cb({ token: api.getAccessToken() ?? undefined }),
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    autoConnect: true,
  });
}
