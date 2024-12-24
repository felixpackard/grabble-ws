import type { SystemMessage } from "./message";

export type User = {
	id: string;
	username: string | null;
	words: string[];
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
