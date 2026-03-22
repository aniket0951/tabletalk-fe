// Socket events (mirrors backend SOCKET_EVENT)
export const SOCKET_EVENT = {
  ORDER_CREATED: "order:created",
  ORDER_UPDATED: "order:updated",
  TABLE_UPDATED: "table:updated",
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",
} as const;

// Browser events
export const BROWSER_EVENT = {
  ONLINE: "online",
  OFFLINE: "offline",
} as const;
