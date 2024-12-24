import {
	type ClientMessage,
	ClientMessageType,
	type CreateRoomMessage,
	type JoinRoomMessage,
	type SendMessageMessage,
	type ServerMessageDataType,
	ServerMessageType,
	SystemMessageType,
} from "shared/types/message";
import type { Room } from "shared/types/room";
import { randomUUIDv7, type Server, type ServerWebSocket } from "bun";
import { customAlphabet } from "nanoid";
import type { WebSocketData } from "shared/types/websocket";
import { mapValues, sample, shuffle, values } from "lodash";
import { getPossibleWords, letterCountToLetters, type Word } from "./anagrams";
import { Trie } from "./trie";
import { resolve } from "path";
import { scoreDiff, scoreWord } from "./score";

const repeat = (letter: string, count: number) => new Array(count).fill(letter);

const SCRABBLE_TILES = [
	...repeat("a", 9),
	...repeat("b", 2),
	...repeat("c", 2),
	...repeat("d", 4),
	...repeat("e", 12),
	...repeat("f", 2),
	...repeat("g", 3),
	...repeat("h", 2),
	...repeat("i", 9),
	...repeat("j", 1),
	...repeat("k", 1),
	...repeat("l", 4),
	...repeat("m", 2),
	...repeat("n", 6),
	...repeat("o", 8),
	...repeat("p", 2),
	...repeat("q", 1),
	...repeat("r", 6),
	...repeat("s", 4),
	...repeat("t", 6),
	...repeat("u", 4),
	...repeat("v", 2),
	...repeat("w", 2),
	...repeat("x", 1),
	...repeat("y", 2),
	...repeat("z", 1),
];

export class MessageHandler {
	private readonly trie: Trie;
	private rooms: Record<string, Room> = {};

	constructor() {
		this.trie = new Trie();
		this.trie.loadFromFile(resolve(__dirname, "..", "..", "wordlists", "sowpods.txt"));
	}

	private createResponse<T extends ServerMessageType>(
		type: T,
		data: ServerMessageDataType<T>,
	): string {
		return JSON.stringify({ type, data });
	}

	private createRoomInfoResponse(roomCode: string): string {
		return this.createResponse(ServerMessageType.RoomInfo, {
			roomCode: roomCode,
			hostId: this.rooms[roomCode].hostId,
			gameStarted: this.rooms[roomCode].gameStarted,
			currentTurnId: this.rooms[roomCode].currentTurnId,
			connectedUsers: mapValues(this.rooms[roomCode].connectedUsers, (socket) => socket.data.user),
			turnOrderIds: this.rooms[roomCode].turnOrderIds,
			availableTiles: this.rooms[roomCode].availableTiles,
			remainingTileCount: this.rooms[roomCode].hiddenTiles.length,
		});
	}

	private assertInRoom(
		ws: ServerWebSocket<WebSocketData>,
	): asserts ws is ServerWebSocket<WebSocketData & { roomCode: string }> {
		if (!ws.data.roomCode) {
			throw new Error("Not in a room");
		}
	}

	private generateRoomCode(): string {
		let attempts = 0;
		let length = 4;
		let roomCode = "";

		const existingRoomCodes = Object.values(this.rooms).map((room) => room.id);

		do {
			roomCode = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", length)();
			if (++attempts > 10) {
				length++;
				attempts = 0;
			}
		} while (existingRoomCodes.some((code) => code === roomCode));

		return roomCode;
	}

	private nextTurn(server: Server, roomCode: string) {
		const currentTurnIndex = this.rooms[roomCode].turnOrderIds.indexOf(
			this.rooms[roomCode].currentTurnId!,
		);

		const nextTurnIndex =
			currentTurnIndex === this.rooms[roomCode].turnOrderIds.length - 1 ? 0 : currentTurnIndex + 1;

		this.rooms[roomCode].currentTurnId = this.rooms[roomCode].turnOrderIds[nextTurnIndex];

		server.publish(
			roomCode,
			this.createResponse(ServerMessageType.SetCurrentTurn, {
				userId: this.rooms[roomCode].currentTurnId!,
			}),
		);
	}

	private setTurn(server: Server, roomCode: string, userId: string) {
		this.rooms[roomCode].currentTurnId = userId;

		server.publish(
			roomCode,
			this.createResponse(ServerMessageType.SetCurrentTurn, {
				userId,
			}),
		);
	}

	private handleCreateRoom(ws: ServerWebSocket<WebSocketData>, message: CreateRoomMessage): void {
		if (ws.data.roomCode) {
			ws.send(this.createResponse(ServerMessageType.Error, { message: "Already in a room" }));
			return;
		}

		ws.data.user.username = message.data.username;

		// Create the room
		const roomCode = this.generateRoomCode();
		ws.data.roomCode = roomCode;
		this.rooms[roomCode] = {
			id: roomCode,
			hostId: ws.data.user.id,
			gameStarted: false,
			gameEnded: false,
			currentTurnId: null,
			connectedUsers: {
				[ws.data.user.id]: ws,
			},
			turnOrderIds: [ws.data.user.id],
			availableTiles: [],
			hiddenTiles: shuffle(SCRABBLE_TILES),
		};

		// Subscribe to the room
		ws.subscribe(ws.data.roomCode);

		// Notify the user
		ws.send(this.createRoomInfoResponse(roomCode));
	}

	private handleJoinRoom(
		server: Server,
		ws: ServerWebSocket<WebSocketData>,
		message: JoinRoomMessage,
	): void {
		if (!message.data.username) {
			ws.send(this.createResponse(ServerMessageType.Error, { message: "Username not set" }));
			return;
		}

		if (ws.data.roomCode) {
			ws.send(this.createResponse(ServerMessageType.Error, { message: "Already in a room" }));
			return;
		}

		if (!this.rooms[message.data.roomCode]) {
			ws.send(this.createResponse(ServerMessageType.Error, { message: "Room not found" }));
			return;
		}

		if (
			Object.values(this.rooms[message.data.roomCode].connectedUsers).some(
				(socket) => socket.data.user.username === message.data.username,
			)
		) {
			ws.send(this.createResponse(ServerMessageType.Error, { message: "Username already taken" }));
			return;
		}

		ws.data.roomCode = message.data.roomCode;
		ws.data.user.username = message.data.username;

		// Add user to room
		this.rooms[ws.data.roomCode].connectedUsers[ws.data.user.id] = ws;
		this.rooms[ws.data.roomCode].turnOrderIds.push(ws.data.user.id);

		// Subscribe to the room
		ws.subscribe(ws.data.roomCode);

		// Send room info to the new user
		ws.send(this.createRoomInfoResponse(ws.data.roomCode));

		// Notify all other users in the room
		ws.publish(
			ws.data.roomCode,
			this.createResponse(ServerMessageType.UserJoined, {
				userId: ws.data.user.id,
				user: ws.data.user,
			}),
		);
	}

	private handleLeaveRoom(server: Server, ws: ServerWebSocket<WebSocketData>): void {
		if (!ws.data.roomCode) {
			ws.send(this.createResponse(ServerMessageType.Error, { message: "Not in a room" }));
			return;
		}

		// Remove user from room
		delete this.rooms[ws.data.roomCode].connectedUsers[ws.data.user.id];
		this.rooms[ws.data.roomCode].turnOrderIds = this.rooms[ws.data.roomCode].turnOrderIds.filter(
			(id) => id !== ws.data.user.id,
		);

		// Unsubscribe from the room
		ws.unsubscribe(ws.data.roomCode);

		if (Object.keys(this.rooms[ws.data.roomCode].connectedUsers).length === 0) {
			delete this.rooms[ws.data.roomCode];
		} else {
			// Notify all users in the room
			server.publish(
				ws.data.roomCode,
				this.createResponse(ServerMessageType.UserLeft, { userId: ws.data.user.id }),
			);
		}

		ws.data.roomCode = null;
		ws.data.user.username = null;
		ws.data.user.words = [];
	}

	private handleStartGame(server: Server, ws: ServerWebSocket<WebSocketData>): void {
		this.assertInRoom(ws);

		let room = this.rooms[ws.data.roomCode];

		if (room.gameStarted && !room.gameEnded) {
			ws.send(this.createResponse(ServerMessageType.Error, { message: "Game already started" }));
			return;
		}

		this.rooms[ws.data.roomCode] = {
			...room,
			gameStarted: true,
			gameEnded: false,
			availableTiles: [],
			hiddenTiles: shuffle(SCRABBLE_TILES),
			currentTurnId: sample(Object.keys(room.connectedUsers))!,
		};

		values(room.connectedUsers).forEach((socket) => {
			socket.data.user.words = [];
			socket.data.user.readyToEnd = false;
		});

		server.publish(ws.data.roomCode, this.createRoomInfoResponse(ws.data.roomCode));
	}

	private tryMakeWord(ws: ServerWebSocket<WebSocketData>, word: string) {
		const room = this.rooms[ws.data.roomCode!];

		const poolLetters = room.availableTiles;
		const existingWordsByUserId = mapValues(
			room.connectedUsers,
			(socket) => socket.data.user.words,
		);

		const possibleWords = getPossibleWords(this.trie, poolLetters, existingWordsByUserId);

		const scoredWords = possibleWords
			.filter((w) => w.word === word)
			.map((w) => {
				return {
					word: w,
					score:
						w.userId === ws.data.user.id ? scoreDiff(w.existingWord, w.word) : scoreWord(w.word),
				};
			});

		if (scoredWords.length === 0) return null;

		return scoredWords.reduce((a, b) => (a.score > b.score ? a : b)).word;
	}

	private removePoolLetters(server: Server, ws: ServerWebSocket<WebSocketData>, word: Word) {
		const room = this.rooms[ws.data.roomCode!];

		for (const letter of letterCountToLetters(word.poolLetters)) {
			const index = room.availableTiles.indexOf(letter);
			room.availableTiles.splice(index, 1);
		}

		server.publish(
			ws.data.roomCode!,
			this.createResponse(ServerMessageType.TilesRemoved, {
				letters: letterCountToLetters(word.poolLetters),
			}),
		);
	}

	private updateExistingWord(server: Server, ws: ServerWebSocket<WebSocketData>, word: Word) {
		const room = this.rooms[ws.data.roomCode!];

		const index = ws.data.user.words.indexOf(word.existingWord);
		ws.data.user.words[index] = word.word;

		server.publish(
			ws.data.roomCode!,
			this.createResponse(ServerMessageType.UserWordUpdated, {
				userId: ws.data.user.id,
				oldWord: word.existingWord,
				newWord: word.word,
			}),
		);
	}

	private createNewWord(server: Server, ws: ServerWebSocket<WebSocketData>, word: Word) {
		ws.data.user.words.push(word.word);

		server.publish(
			ws.data.roomCode!,
			this.createResponse(ServerMessageType.UserWordAdded, {
				userId: ws.data.user.id,
				word: word.word,
			}),
		);
	}

	private stealWord(server: Server, ws: ServerWebSocket<WebSocketData>, word: Word) {
		const room = this.rooms[ws.data.roomCode!];

		const index = room.connectedUsers[word.userId!].data.user.words.indexOf(word.existingWord);
		room.connectedUsers[word.userId!].data.user.words.splice(index, 1);

		ws.data.user.words.push(word.word);

		server.publish(
			ws.data.roomCode!,
			this.createResponse(ServerMessageType.UserWordRemoved, {
				userId: word.userId!,
				word: word.existingWord,
			}),
		);

		server.publish(
			ws.data.roomCode!,
			this.createResponse(ServerMessageType.UserWordAdded, {
				userId: ws.data.user.id,
				word: word.word,
			}),
		);
	}

	private broadcastChatMessage(
		server: Server,
		ws: ServerWebSocket<WebSocketData>,
		message: SendMessageMessage,
	) {
		server.publish(
			ws.data.roomCode!,
			this.createResponse(ServerMessageType.UserMessage, {
				username: ws.data.user.username!,
				message: message.data.message,
			}),
		);
	}

	private handleMessage(
		server: Server,
		ws: ServerWebSocket<WebSocketData>,
		message: SendMessageMessage,
	): void {
		this.assertInRoom(ws);

		// Make a word if possible
		const words = message.data.message.split(" ");
		if (words.length > 1) {
			this.broadcastChatMessage(server, ws, message);
			return;
		}

		const attemptedWord = words[0].toLowerCase();

		if (!/^[a-zA-Z]+$/.test(attemptedWord)) {
			this.broadcastChatMessage(server, ws, message);
			return;
		}

		const word = this.tryMakeWord(ws, attemptedWord);
		if (!word) {
			this.broadcastChatMessage(server, ws, message);
			return;
		}

		this.removePoolLetters(server, ws, word);

		if (word.userId === ws.data.user.id) {
			this.updateExistingWord(server, ws, word);
			server.publish(
				ws.data.roomCode!,
				this.createResponse(ServerMessageType.SystemMessage, {
					type: SystemMessageType.WordUpdated,
					data: {
						username: ws.data.user.username!,
						oldWord: word.existingWord,
						newWord: word.word,
					},
				}),
			);
		} else if (word.userId === null) {
			this.createNewWord(server, ws, word);
			server.publish(
				ws.data.roomCode!,
				this.createResponse(ServerMessageType.SystemMessage, {
					type: SystemMessageType.WordAdded,
					data: {
						username: ws.data.user.username!,
						word: word.word,
					},
				}),
			);
		} else {
			this.stealWord(server, ws, word);
			server.publish(
				ws.data.roomCode!,
				this.createResponse(ServerMessageType.SystemMessage, {
					type: SystemMessageType.WordStolen,
					data: {
						oldUsername:
							this.rooms[ws.data.roomCode].connectedUsers[word.userId].data.user.username!,
						newUsername: ws.data.user.username!,
						oldWord: word.existingWord,
						newWord: word.word,
					},
				}),
			);
		}

		this.setTurn(server, ws.data.roomCode, ws.data.user.id);
	}

	private handleTurnTile(server: Server, ws: ServerWebSocket<WebSocketData>): void {
		this.assertInRoom(ws);

		const room = this.rooms[ws.data.roomCode];

		if (room.hiddenTiles.length === 0) {
			ws.send(this.createResponse(ServerMessageType.Error, { message: "No more tiles" }));
			return;
		}

		const letter = room.hiddenTiles.pop()!;

		room.availableTiles.push(letter);

		server.publish(
			ws.data.roomCode,
			this.createResponse(ServerMessageType.TileAdded, {
				letter,
			}),
		);

		this.nextTurn(server, ws.data.roomCode);

		if (room.hiddenTiles.length === 0) {
			server.publish(
				ws.data.roomCode,
				this.createResponse(ServerMessageType.SystemMessage, {
					type: SystemMessageType.NoTilesRemaining,
					data: {},
				}),
			);
		}
	}

	private handleToggleReadyToEnd(server: Server, ws: ServerWebSocket<WebSocketData>): void {
		this.assertInRoom(ws);

		const room = this.rooms[ws.data.roomCode];

		if (values(room.connectedUsers).every((socket) => socket.data.user.readyToEnd)) {
			ws.send(this.createResponse(ServerMessageType.Error, { message: "Game already ended" }));
			return;
		}

		ws.data.user.readyToEnd = !ws.data.user.readyToEnd;

		server.publish(
			ws.data.roomCode!,
			this.createResponse(ServerMessageType.UserToggledReadyToEnd, {
				userId: ws.data.user.id,
				readyToEnd: ws.data.user.readyToEnd,
			}),
		);

		if (values(room.connectedUsers).every((socket) => socket.data.user.readyToEnd)) {
			room.gameEnded = true;

			const scores = values(room.connectedUsers)
				.map((socket) => {
					return {
						username: socket.data.user.username!,
						score: socket.data.user.words.reduce((acc, word) => acc + scoreWord(word), 0),
					};
				})
				.sort((a, b) => b.score - a.score);

			server.publish(
				ws.data.roomCode!,
				this.createResponse(ServerMessageType.GameEnded, {
					finalScores: scores,
				}),
			);
		}
	}

	public onOpen(ws: ServerWebSocket<WebSocketData>): void {
		ws.data = {
			roomCode: null,
			user: { id: randomUUIDv7(), username: null, words: [], readyToEnd: false },
		};
		ws.send(this.createResponse(ServerMessageType.SetId, { id: ws.data.user.id }));
	}

	public onClose(server: Server, ws: ServerWebSocket<WebSocketData>): void {
		if (ws.data.roomCode) {
			this.handleLeaveRoom(server, ws);
		}
	}

	public onMessage(server: Server, ws: ServerWebSocket<WebSocketData>, message: string): void {
		try {
			const messageData = JSON.parse(message) as ClientMessage;

			switch (messageData.type) {
				case ClientMessageType.CreateRoom:
					this.handleCreateRoom(ws, messageData);
					break;
				case ClientMessageType.JoinRoom:
					this.handleJoinRoom(server, ws, messageData);
					break;
				case ClientMessageType.LeaveRoom:
					this.handleLeaveRoom(server, ws);
					break;
				case ClientMessageType.StartGame:
					this.handleStartGame(server, ws);
					break;
				case ClientMessageType.SendMessage:
					this.handleMessage(server, ws, messageData);
					break;
				case ClientMessageType.TurnTile:
					this.handleTurnTile(server, ws);
					break;
				case ClientMessageType.ToggleReadyToEnd:
					this.handleToggleReadyToEnd(server, ws);
					break;
				default:
					console.warn(`Unhandled message type: ${(messageData as any).type}`);
			}
		} catch (error) {
			console.error("Error handling WebSocket message:", error);
			ws.send(
				this.createResponse(ServerMessageType.Error, { message: "Failed to process message" }),
			);
		}
	}
}
