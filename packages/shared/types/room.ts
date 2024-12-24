import { type ServerWebSocket } from "bun";
import type { WebSocketData } from "./websocket";

export type Room = {
	id: string;
	hostId: string;
	gameStarted: boolean;
	currentTurnId: string | null;
	connectedUsers: Record<string, ServerWebSocket<WebSocketData>>;
	turnOrderIds: string[];
	availableTiles: string[];
	hiddenTiles: string[];
};
