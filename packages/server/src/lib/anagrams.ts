import type { Trie, TrieNode } from "./trie";

type LetterCount = Array<number>;

export type Word = {
	word: string;
	letters: LetterCount;
	poolLetters: LetterCount;
	existingWord: string;
	userId: string | null;
};

export function letterCountToLetters(count: LetterCount): string[] {
	const result: string[] = [];
	for (let i = 0; i < count.length; i++) {
		for (let j = 0; j < count[i]; j++) {
			result.push(String.fromCharCode(i + "a".charCodeAt(0)));
		}
	}
	return result;
}

export function getPossibleWords(
	trie: Trie,
	poolLetters: string[],
	existingWordsByUserId: Record<string, string[]>,
): Word[] {
	const result: Word[] = [];

	// Check words that can be created using only pool letters
	const words = findPartialAnagrams(trie, poolLetters, "", "", false, null);
	result.push(...words);

	// Check words that can be created using existing words and pool letters
	for (const [userId, existingWords] of Object.entries(existingWordsByUserId)) {
		for (const existingWord of existingWords) {
			const words = findPartialAnagrams(
				trie,
				poolLetters,
				existingWord,
				existingWord,
				false,
				userId,
			);
			result.push(...words);
		}
	}

	return result;
}

export function findPartialAnagrams(
	trie: Trie,
	optionalLetters: string[],
	originalWord: string,
	requiredLetters: string,
	includesPotentialLetter: boolean,
	userId: string | null,
): Word[] {
	const result: Word[] = [];
	const requiredCount: LetterCount = new Array(26).fill(0);
	const optionalCount: LetterCount = new Array(26).fill(0);

	for (const char of optionalLetters) {
		optionalCount[char.charCodeAt(0) - "a".charCodeAt(0)]++;
	}

	for (const char of requiredLetters) {
		requiredCount[char.charCodeAt(0) - "a".charCodeAt(0)]++;
	}

	const hasOptional = optionalLetters.length > 0;
	const onlyOptional = requiredLetters.length === 0;

	if (!hasOptional && !includesPotentialLetter) {
		return result;
	}

	findAnagramsRecursive(
		trie.root,
		requiredCount,
		optionalCount,
		"",
		result,
		!hasOptional,
		onlyOptional,
		originalWord,
		originalWord.length,
		userId,
	);

	return result;
}

function findAnagramsRecursive(
	node: TrieNode,
	required: LetterCount,
	optional: LetterCount,
	current: string,
	result: Word[],
	usedOptional: boolean,
	onlyOptional: boolean,
	originalWord: string,
	originalWordLength: number,
	userId: string | null,
): void {
	if (
		node.isEnd &&
		(onlyOptional ||
			(usedOptional && isCountEmpty(required) && current.length > originalWordLength))
	) {
		const poolLetters = stringToLetterCount(current);
		const originalWordLetters = stringToLetterCount(originalWord);
		for (let i = 0; i < originalWordLetters.length; i++) {
			poolLetters[i] -= originalWordLetters[i];
		}
		result.push({
			word: current,
			letters: stringToLetterCount(current),
			poolLetters,
			existingWord: originalWord,
			userId,
		});
	}

	for (let i = 0; i < node.children.length; i++) {
		const child = node.children[i];
		if (child !== null) {
			if (required[i] > 0) {
				required[i]--;
				findAnagramsRecursive(
					child,
					required,
					optional,
					current + String.fromCharCode(i + "a".charCodeAt(0)),
					result,
					usedOptional,
					onlyOptional,
					originalWord,
					originalWordLength,
					userId,
				);
				required[i]++;
			} else if (optional[i] > 0) {
				optional[i]--;
				findAnagramsRecursive(
					child,
					required,
					optional,
					current + String.fromCharCode(i + "a".charCodeAt(0)),
					result,
					true,
					onlyOptional,
					originalWord,
					originalWordLength,
					userId,
				);
				optional[i]++;
			}
		}
	}
}

function stringToLetterCount(s: string): LetterCount {
	const lc = new Array(26).fill(0);
	for (const r of s) {
		lc[r.charCodeAt(0) - "a".charCodeAt(0)]++;
	}
	return lc;
}

function isCountEmpty(count: LetterCount): boolean {
	for (const c of count) {
		if (c > 0) {
			return false;
		}
	}
	return true;
}
