<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import { values } from "lodash";
	import { ConfettiCannon } from "svelte-canvas-confetti";

	let { client }: { client: WebSocketClient | null } = $props();

	let scores = $derived(client?.getFinalScores() ?? []);
	let winner = $derived(scores[0].username);
	let draw = $derived(scores[0].score === scores[1].score);
</script>

<div class="flex justify-center">
	<div
		class="flex w-full max-w-md flex-col gap-2 rounded-lg border-2 border-gray-300 p-4 shadow-md">
		<h1 class="font-bold">{draw ? "It's a draw!" : `${winner} wins!`}</h1>
		<ul class="list-inside list-disc">
			{#each scores as user}
				<li>
					{user.username}:
					<span class="font-bold">{user.score} point{user.score === 1 ? "" : "s"}</span>
				</li>
			{/each}
		</ul>
		<button disabled={!client?.isHost()} onclick={() => client?.startGame()}>Restart Game</button>
	</div>
</div>

<ConfettiCannon origin={[window.innerWidth / 2, window.innerHeight]} />
