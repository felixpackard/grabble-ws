export type User = {
	id: string;
	username: string | null;
	words: string[];
};

export type UserMessage = {
	username: string;
	message: string;
};
