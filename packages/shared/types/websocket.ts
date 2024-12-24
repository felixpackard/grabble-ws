import type { User } from "shared/types/user";

export type WebSocketData = {
	roomCode: string | null;
	user: User;
};
