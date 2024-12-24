import { type User } from "./user";

export enum ClientMessageType {
	CreateRoom,
	JoinRoom,
	LeaveRoom,
	StartGame,
	SendMessage,
	TurnTile,
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
}

type Client<T extends ClientMessageType, J extends object = {}> = { type: T; data: J };
type Server<T extends ServerMessageType, J extends object = {}> = { type: T; data: J };

/* prettier-ignore */ export type CreateRoomMessage = Client<ClientMessageType.CreateRoom, { username: string }>;
/* prettier-ignore */ export type JoinRoomMessage = Client<ClientMessageType.JoinRoom, { roomCode: string, username: string }>;
/* prettier-ignore */ export type LeaveRoomMessage = Client<ClientMessageType.LeaveRoom>;
/* prettier-ignore */ export type StartGameMessage = Client<ClientMessageType.StartGame>;
/* prettier-ignore */ export type SendMessageMessage = Client<ClientMessageType.SendMessage, { message: string }>;
/* prettier-ignore */ export type TurnTileMessage = Client<ClientMessageType.TurnTile>;

/* prettier-ignore */ export type ErrorMessage = Server<ServerMessageType.Error, { message: string }>;
/* prettier-ignore */ export type SetIdMessage = Server<ServerMessageType.SetId, { id: string }>;
/* prettier-ignore */ export type RoomInfoMessage = Server<ServerMessageType.RoomInfo, { roomCode: string, hostId: string, gameStarted: boolean, currentTurnId: string | null, connectedUsers: Record<string, User>, turnOrderIds: string[], availableTiles: string[] }>;
/* prettier-ignore */ export type UserJoinedMessage = Server<ServerMessageType.UserJoined, { userId: string, user: User }>;
/* prettier-ignore */ export type UserLeftMessage = Server<ServerMessageType.UserLeft, { userId: string }>;
/* prettier-ignore */ export type UserMessageMessage = Server<ServerMessageType.UserMessage, { username: string; message: string }>;
/* prettier-ignore */ export type UserWordRemovedMessage = Server<ServerMessageType.UserWordRemoved, { userId: string; word: string }>;
/* prettier-ignore */ export type UserWordAddedMessage = Server<ServerMessageType.UserWordAdded, { userId: string; word: string }>;
/* prettier-ignore */ export type UserWordUpdatedMessage = Server<ServerMessageType.UserWordUpdated, { userId: string; oldWord: string, newWord: string }>;
/* prettier-ignore */ export type TileAddedMessage = Server<ServerMessageType.TileAdded, { letter: string }>;
/* prettier-ignore */ export type TilesRemovedMessage = Server<ServerMessageType.TilesRemoved, { letters: string[] }>;
/* prettier-ignore */ export type SetCurrentTurnMessage = Server<ServerMessageType.SetCurrentTurn, { userId: string }>;

export type ClientMessage =
	| CreateRoomMessage
	| JoinRoomMessage
	| LeaveRoomMessage
	| StartGameMessage
	| SendMessageMessage
	| TurnTileMessage;

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
	| SetCurrentTurnMessage;

export type ServerMessageDataType<T extends ServerMessageType> = Extract<
	ServerMessage,
	{ type: T }
>["data"];

export type ClientMessageDataType<T extends ClientMessageType> = Extract<
	ClientMessage,
	{ type: T }
>["data"];
