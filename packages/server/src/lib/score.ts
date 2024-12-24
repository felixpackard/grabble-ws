export function scoreWord(word: string) {
	return word.length - 2;
}

export function scoreDiff(oldWord: string, newWord: string) {
	return scoreWord(newWord) - scoreWord(oldWord);
}
