import type { SystemMessage } from "./message";

export type User = {
	id: string;
	username: string | null;
	words: string[];
	readyToEnd: boolean;
};

export enum MessageType {
	User,
	System,
}

export type UserMessage = {
	username: string;
	message: string;
};

export type ChatMessage =
	| {
			type: MessageType.User;
			data: UserMessage;
	  }
	| {
			type: MessageType.System;
			data: SystemMessage;
	  };

export type UserScore = {
	username: string;
	score: number;
};
