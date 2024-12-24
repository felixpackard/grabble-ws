import { file } from "bun";

export type TrieNode = {
	children: Array<TrieNode | null>;
	isEnd: boolean;
};

export class Trie {
	public root: TrieNode;

	constructor() {
		this.root = this.createNode();
	}

	private createNode(): TrieNode {
		return {
			children: Array(26).fill(null),
			isEnd: false,
		};
	}

	public insert(word: string): void {
		let node = this.root;

		for (const char of word) {
			const index = char.charCodeAt(0) - "a".charCodeAt(0);
			if (node.children[index] === null) {
				node.children[index] = this.createNode();
			}
			node = node.children[index];
		}

		node.isEnd = true;
	}

	public contains(word: string): boolean {
		if (word === "") {
			return true;
		}

		let node = this.root;

		for (const char of word) {
			const index = char.charCodeAt(0) - "a".charCodeAt(0);
			if (node.children[index] === null) {
				return false;
			}
			node = node.children[index];
		}

		return node.isEnd;
	}

	public async loadFromFile(path: string) {
		const stream = file(path).stream();
		const decoder = new TextDecoder();

		let remainingData = "";

		// TODO: Remove as any?
		for await (const chunk of stream as any) {
			const str = decoder.decode(chunk);

			remainingData += str;

			let lines = remainingData.split(/\r?\n/);
			while (lines.length > 1) {
				this.insert(lines.shift()!);
			}

			remainingData = lines[0];
		}
	}
}
