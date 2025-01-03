import { type User, type UserScore } from "./user";

export enum ClientMessageType {
	CreateRoom,
	JoinRoom,
	LeaveRoom,
	StartGame,
	SendMessage,
	TurnTile,
	ToggleReadyToEnd,
}

export enum ServerMessageType {
	Error,
	SetId,
	RoomInfo,
	UserJoined,
	UserLeft,
	UserMessage,
	UserWordAdded,
	UserWordRemoved,
	UserWordUpdated,
	TileAdded,
	TilesRemoved,
	SetCurrentTurn,
	SystemMessage,
	UserToggledReadyToEnd,
	GameEnded,
}

export enum SystemMessageType {
	WordAdded,
	WordUpdated,
	WordStolen,
	NoTilesRemaining,
	GoingFirst,
}

type Client<T extends ClientMessageType, J extends object = {}> = { type: T; data: J };
type Server<T extends ServerMessageType, J extends object = {}> = { type: T; data: J };
type System<T extends SystemMessageType, J extends object = {}> = { type: T; data: J };

/* prettier-ignore */ export type CreateRoomMessage = Client<ClientMessageType.CreateRoom, { username: string }>;
/* prettier-ignore */ export type JoinRoomMessage = Client<ClientMessageType.JoinRoom, { roomCode: string, username: string }>;
/* prettier-ignore */ export type LeaveRoomMessage = Client<ClientMessageType.LeaveRoom>;
/* prettier-ignore */ export type StartGameMessage = Client<ClientMessageType.StartGame>;
/* prettier-ignore */ export type SendMessageMessage = Client<ClientMessageType.SendMessage, { message: string }>;
/* prettier-ignore */ export type TurnTileMessage = Client<ClientMessageType.TurnTile>;
/* prettier-ignore */ export type ToggleReadyToEndMessage = Client<ClientMessageType.ToggleReadyToEnd>;

/* prettier-ignore */ export type ErrorMessage = Server<ServerMessageType.Error, { message: string }>;
/* prettier-ignore */ export type SetIdMessage = Server<ServerMessageType.SetId, { id: string }>;
/* prettier-ignore */ export type RoomInfoMessage = Server<ServerMessageType.RoomInfo, { roomCode: string, hostId: string, gameStarted: boolean, currentTurnId: string | null, connectedUsers: Record<string, User>, turnOrderIds: string[], availableTiles: string[], remainingTileCount: number }>;
/* prettier-ignore */ export type UserJoinedMessage = Server<ServerMessageType.UserJoined, { userId: string, user: User }>;
/* prettier-ignore */ export type UserLeftMessage = Server<ServerMessageType.UserLeft, { userId: string }>;
/* prettier-ignore */ export type UserMessageMessage = Server<ServerMessageType.UserMessage, { username: string; message: string }>;
/* prettier-ignore */ export type UserWordRemovedMessage = Server<ServerMessageType.UserWordRemoved, { userId: string; word: string }>;
/* prettier-ignore */ export type UserWordAddedMessage = Server<ServerMessageType.UserWordAdded, { userId: string; word: string }>;
/* prettier-ignore */ export type UserWordUpdatedMessage = Server<ServerMessageType.UserWordUpdated, { userId: string; oldWord: string, newWord: string }>;
/* prettier-ignore */ export type TileAddedMessage = Server<ServerMessageType.TileAdded, { letter: string }>;
/* prettier-ignore */ export type TilesRemovedMessage = Server<ServerMessageType.TilesRemoved, { letters: string[] }>;
/* prettier-ignore */ export type SetCurrentTurnMessage = Server<ServerMessageType.SetCurrentTurn, { userId: string }>;
/* prettier-ignore */ export type SystemMessageMessage = Server<ServerMessageType.SystemMessage, SystemMessage>;
/* prettier-ignore */ export type UserToggledReadyToEndMessage = Server<ServerMessageType.UserToggledReadyToEnd, { userId: string, readyToEnd: boolean }>;
/* prettier-ignore */ export type GameEndedMessage = Server<ServerMessageType.GameEnded, { finalScores: UserScore[] }>;

/* prettier-ignore */ export type SystemWordAddedData = System<SystemMessageType.WordAdded, { username: string, word: string }>;
/* prettier-ignore */ export type SystemWordUpdatedData = System<SystemMessageType.WordUpdated, { username: string, oldWord: string, newWord: string }>;
/* prettier-ignore */ export type SystemWordStolenData = System<SystemMessageType.WordStolen, { oldUsername: string, newUsername: string, oldWord: string, newWord: string }>;
/* prettier-ignore */ export type SystemNoTilesRemainingData = System<SystemMessageType.NoTilesRemaining>;
/* prettier-ignore */ export type SystemGoingFirstData = System<SystemMessageType.GoingFirst, { username: string }>;

export type ClientMessage =
	| CreateRoomMessage
	| JoinRoomMessage
	| LeaveRoomMessage
	| StartGameMessage
	| SendMessageMessage
	| TurnTileMessage
	| ToggleReadyToEndMessage;

export type ServerMessage =
	| ErrorMessage
	| SetIdMessage
	| RoomInfoMessage
	| UserJoinedMessage
	| UserLeftMessage
	| UserMessageMessage
	| UserWordRemovedMessage
	| UserWordAddedMessage
	| UserWordUpdatedMessage
	| TileAddedMessage
	| TilesRemovedMessage
	| SetCurrentTurnMessage
	| SystemMessageMessage
	| UserToggledReadyToEndMessage
	| GameEndedMessage;

export type SystemMessage =
	| SystemWordAddedData
	| SystemWordUpdatedData
	| SystemWordStolenData
	| SystemNoTilesRemainingData
	| SystemGoingFirstData;

export type ServerMessageDataType<T extends ServerMessageType> = Extract<
	ServerMessage,
	{ type: T }
>["data"];

export type ClientMessageDataType<T extends ClientMessageType> = Extract<
	ClientMessage,
	{ type: T }
>["data"];
