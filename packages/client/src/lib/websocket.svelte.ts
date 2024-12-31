import { shuffle } from "lodash";
import {
	ClientMessageType,
	ServerMessageType,
	SystemMessageType,
	type ClientMessageDataType,
	type GameEndedMessage,
	type RoomInfoMessage,
	type ServerMessage,
	type SetCurrentTurnMessage,
	type SetIdMessage,
	type SystemMessage,
	type SystemMessageMessage,
	type TileAddedMessage,
	type TilesRemovedMessage,
	type UserJoinedMessage,
	type UserLeftMessage,
	type UserMessageMessage,
	type UserToggledReadyToEndMessage,
	type UserWordAddedMessage,
	type UserWordRemovedMessage,
	type UserWordUpdatedMessage,
} from "shared/types/message";
import {
	MessageType,
	type ChatMessage,
	type User,
	type UserMessage,
	type UserScore,
} from "shared/types/user";
import { toast } from "svelte-sonner";

export enum SocketState {
	Connected,
	Disconnected,
	Connecting,
}

export const SocketStateLabel = new Map<SocketState, string>([
	[SocketState.Connected, "Connected"],
	[SocketState.Disconnected, "Disconnected"],
	[SocketState.Connecting, "Trying to connect..."],
]);

const BASE_RETRY_DELAY = 1000;

export class WebSocketClient {
	private static instance: WebSocketClient;

	private ws: WebSocket;
	private state = $state(SocketState.Disconnected);
	private retryDelay = BASE_RETRY_DELAY;

	private userId: string | null = null;
	private roomCode: string | null = $state(null);
	private hostId: string | null = $state(null);
	private gameStarted = $state(false);
	private connectedUsers: Record<string, User> = $state({});
	private turnOrderIds: string[] = $state([]);
	private chatMessages: ChatMessage[] = $state([]);
	private availableTiles: string[] = $state([]);
	private remainingTileCount = $state(0);
	private currentTurnId: string | null = $state(null);
	private readyToEnd: boolean = $state(false);
	private gameEnded: boolean = $state(false);
	private finalScores: UserScore[] = $state([]);

	constructor() {
		this.ws = this.createSocket();
		return this.singleton();
	}

	private singleton(): WebSocketClient {
		if (WebSocketClient.instance) {
			return WebSocketClient.instance;
		}

		WebSocketClient.instance = this;
		return WebSocketClient.instance;
	}

	private reset() {
		this.roomCode = null;
		this.hostId = null;
		this.gameStarted = false;
		this.connectedUsers = {};
		this.turnOrderIds = [];
		this.chatMessages = [];
		this.availableTiles = [];
		this.remainingTileCount = 0;
		this.currentTurnId = null;
		this.readyToEnd = false;
		this.gameEnded = false;
		this.finalScores = [];
	}

	private createSocket() {
		this.state = SocketState.Connecting;

		const ws = new WebSocket(
			import.meta.env.DEV
				? `ws://${window.location.hostname}:3000/ws`
				: "wss://grabble.felixpackard.dev/ws",
		);

		ws.onopen = this.onOpen.bind(this);
		ws.onclose = this.onClose.bind(this);
		ws.onmessage = this.onMessage.bind(this);

		// Reset state
		this.userId = null;
		this.roomCode = null;
		this.connectedUsers = {};
		this.chatMessages = [];

		return ws;
	}

	private send<T extends ClientMessageType>(type: T, data: ClientMessageDataType<T>): void {
		this.ws.send(JSON.stringify({ type, data }));
	}

	private onOpen() {
		this.state = SocketState.Connected;
		this.retryDelay = BASE_RETRY_DELAY;
	}

	private onClose(event: CloseEvent) {
		if (!event.wasClean) {
			this.reconnect();
		} else {
			this.state = SocketState.Disconnected;
		}
	}

	private handleSetId(message: SetIdMessage) {
		this.userId = message.data.id;
	}

	private handleRoomInfo(message: RoomInfoMessage) {
		this.roomCode = message.data.roomCode;
		this.hostId = message.data.hostId;
		this.gameStarted = message.data.gameStarted;
		this.currentTurnId = message.data.currentTurnId;
		this.connectedUsers = message.data.connectedUsers;
		this.turnOrderIds = message.data.turnOrderIds;
		this.availableTiles = message.data.availableTiles;
		this.remainingTileCount = message.data.remainingTileCount;

		this.readyToEnd = false;
		this.gameEnded = false;
	}

	private handleUserJoined(message: UserJoinedMessage) {
		this.connectedUsers[message.data.userId] = message.data.user;
		this.turnOrderIds.push(message.data.userId);
	}

	private handleUserLeft(message: UserLeftMessage) {
		delete this.connectedUsers[message.data.userId];
		this.turnOrderIds = this.turnOrderIds.filter((id) => id !== message.data.userId);
	}

	private handleUserMessage(message: UserMessageMessage) {
		this.chatMessages.push({
			type: MessageType.User,
			data: message.data,
		});
	}

	private handleUserWordAdded(message: UserWordAddedMessage) {
		this.connectedUsers[message.data.userId].words.push(message.data.word);
	}

	private handleUserWordRemoved(message: UserWordRemovedMessage) {
		const index = this.connectedUsers[message.data.userId].words.indexOf(message.data.word);
		this.connectedUsers[message.data.userId].words.splice(index, 1);
	}

	private handleUserWordUpdated(message: UserWordUpdatedMessage) {
		const index = this.connectedUsers[message.data.userId].words.indexOf(message.data.oldWord);
		this.connectedUsers[message.data.userId].words[index] = message.data.newWord;
	}

	private handleTileAdded(message: TileAddedMessage) {
		this.availableTiles.push(message.data.letter);
		this.remainingTileCount--;
	}

	private handleTilesRemoved(message: TilesRemovedMessage) {
		for (const letter of message.data.letters) {
			const index = this.availableTiles.indexOf(letter);
			this.availableTiles.splice(index, 1);
		}
	}

	private handleSetCurrentTurn(message: SetCurrentTurnMessage) {
		this.currentTurnId = message.data.userId;
	}

	private handleSystemMessage(message: SystemMessageMessage) {
		switch (message.data.type) {
			case SystemMessageType.WordAdded:
			case SystemMessageType.WordUpdated:
			case SystemMessageType.WordStolen:
			case SystemMessageType.NoTilesRemaining:
				this.chatMessages.push({
					type: MessageType.System,
					data: message.data,
				});
				break;
			default:
				console.warn(`Unhandled system message type: ${(message.data as any).type}`);
		}
	}

	private handleUserToggledReadyToEnd(message: UserToggledReadyToEndMessage) {
		this.connectedUsers[message.data.userId].readyToEnd = message.data.readyToEnd;
		if (message.data.userId === this.userId) {
			this.readyToEnd = message.data.readyToEnd;
		}
	}

	private handleGameEnded(message: GameEndedMessage) {
		this.gameEnded = true;
		this.finalScores = message.data.finalScores;
	}

	private onMessage(event: MessageEvent) {
		try {
			const messageData = JSON.parse(event.data) as ServerMessage;

			switch (messageData.type) {
				case ServerMessageType.Error:
					console.error(`Server error: ${messageData.data.message}`);
					toast.error(`Server error: ${messageData.data.message}`);
					break;
				case ServerMessageType.SetId:
					this.handleSetId(messageData);
					break;
				case ServerMessageType.RoomInfo:
					this.handleRoomInfo(messageData);
					break;
				case ServerMessageType.UserJoined:
					this.handleUserJoined(messageData);
					break;
				case ServerMessageType.UserLeft:
					this.handleUserLeft(messageData);
					break;
				case ServerMessageType.UserMessage:
					this.handleUserMessage(messageData);
					break;
				case ServerMessageType.UserWordAdded:
					this.handleUserWordAdded(messageData);
					break;
				case ServerMessageType.UserWordRemoved:
					this.handleUserWordRemoved(messageData);
					break;
				case ServerMessageType.UserWordUpdated:
					this.handleUserWordUpdated(messageData);
					break;
				case ServerMessageType.TileAdded:
					this.handleTileAdded(messageData);
					break;
				case ServerMessageType.TilesRemoved:
					this.handleTilesRemoved(messageData);
					break;
				case ServerMessageType.SetCurrentTurn:
					this.handleSetCurrentTurn(messageData);
					break;
				case ServerMessageType.SystemMessage:
					this.handleSystemMessage(messageData);
					break;
				case ServerMessageType.UserToggledReadyToEnd:
					this.handleUserToggledReadyToEnd(messageData);
					break;
				case ServerMessageType.GameEnded:
					this.handleGameEnded(messageData);
					break;
				default:
					console.warn(`Unhandled message type: ${(messageData as any).type}`);
			}
		} catch (error) {
			console.error("Error handling WebSocket message:", error);
			// TODO: Display an error to the user
		}
	}

	private reconnect() {
		this.state = SocketState.Disconnected;

		setTimeout(() => {
			this.state = SocketState.Connecting;
			this.ws = this.createSocket();
		}, this.retryDelay);

		this.retryDelay *= 2;
	}

	private assertReady() {
		if (this.state !== SocketState.Connected) {
			throw new Error("Socket not connected");
		}

		if (!this.userId) {
			throw new Error("User ID not set");
		}
	}

	/*
	 * Getters
	 */

	public getState(): SocketState {
		return this.state;
	}

	public getRoomCode() {
		return this.roomCode;
	}

	public getChatMessages() {
		return this.chatMessages;
	}

	public getTiles() {
		return this.availableTiles;
	}

	public getUserId() {
		return this.userId;
	}

	public getCurrentTurnId() {
		return this.currentTurnId;
	}

	public getConnectedUsers() {
		return this.connectedUsers;
	}

	public getTurnOrderIds() {
		return this.turnOrderIds;
	}

	public getUser(id: string) {
		return this.connectedUsers[id];
	}

	public getHostId() {
		return this.hostId;
	}

	public getRemainingTileCount() {
		return this.remainingTileCount;
	}

	public getReadyToEndCount() {
		return Object.values(this.connectedUsers).filter((user) => user.readyToEnd).length;
	}

	public isGameRunning() {
		return this.gameStarted;
	}

	public isReadyToEnd() {
		return this.readyToEnd;
	}

	public hasGameEnded() {
		return this.gameEnded;
	}

	public getFinalScores() {
		return this.finalScores;
	}

	/*
	 * Helpers
	 */

	public isHost() {
		return this.hostId === this.userId;
	}

	public isCurrentTurn() {
		return this.currentTurnId === this.userId;
	}

	/*
	 * Actions
	 */

	public createRoom(username: string) {
		this.assertReady();
		this.send(ClientMessageType.CreateRoom, { username });
	}

	public joinRoom(roomCode: string, username: string) {
		this.assertReady();
		this.send(ClientMessageType.JoinRoom, { roomCode, username });
	}

	public leaveRoom() {
		this.assertReady();
		this.send(ClientMessageType.LeaveRoom, {});
		this.reset();
	}

	public sendMessage(message: string) {
		this.assertReady();
		this.send(ClientMessageType.SendMessage, { message });
	}

	public turnTile() {
		this.assertReady();
		this.send(ClientMessageType.TurnTile, {});
	}

	public shuffleTiles() {
		this.assertReady();
		this.availableTiles = shuffle(this.availableTiles);
	}

	public startGame() {
		this.assertReady();
		this.send(ClientMessageType.StartGame, {});
	}

	public toggleReadyToEnd() {
		this.assertReady();
		this.send(ClientMessageType.ToggleReadyToEnd, {});
	}
}
