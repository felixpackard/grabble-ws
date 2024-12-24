import { shuffle } from "lodash";
import { ClientMessageType, ServerMessageType, type ClientMessageDataType, type RoomInfoMessage, type ServerMessage, type SetCurrentTurnMessage, type SetIdMessage, type TileAddedMessage, type TilesRemovedMessage, type UserJoinedMessage, type UserLeftMessage, type UserMessageMessage, type UserWordAddedMessage, type UserWordRemovedMessage, type UserWordUpdatedMessage } from "shared/types/message";
import type { User, UserMessage } from "shared/types/user";
import { toast } from "svelte-sonner";

export enum SocketState {
  Connected,
  Disconnected,
  Connecting,
};

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
  private userMessages: UserMessage[] = $state([]);
  private availableTiles: string[] = $state([]);
  private currentTurnId: string | null = $state(null);

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

  private createSocket() {
    this.state = SocketState.Connecting;
    this.retryDelay = BASE_RETRY_DELAY;
    
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
    this.userMessages = [];

    return ws;
  }

  private send<T extends ClientMessageType>(
		type: T,
		data: ClientMessageDataType<T>,
	): void {
		this.ws.send(JSON.stringify({ type, data }));
	}

  private onOpen() {
    this.state = SocketState.Connected;
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
    this.userMessages.push(message.data);
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
  };

  private handleTileAdded(message: TileAddedMessage) {
    this.availableTiles.push(message.data.letter);
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

  public getUserMessages() {
    return this.userMessages;
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

  /*
   * Helpers
   */

  public isHost() {
    return this.hostId === this.userId;
  }

  public isCurrentTurn() {
    return this.currentTurnId === this.userId;
  }

  public isGameRunning() {
    return this.gameStarted;
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
}
