<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import Chat from "./Chat.svelte";
	import GameOver from "./GameOver.svelte";
	import Lobby from "./Lobby.svelte";
	import Opponents from "./Opponents.svelte";
	import Tiles from "./Tiles.svelte";
	import Words from "./Words.svelte";

	let { client }: { client: WebSocketClient | null } = $props();

	let playingUser = $derived(client?.getUser(client?.getCurrentTurnId() ?? "") ?? null);

	let lastOpponentPlayingId: string | null = $state(null);

	$effect(() => {
		let currentTurnId = client?.getCurrentTurnId();
		if (currentTurnId && currentTurnId !== client?.getUserId()) {
			lastOpponentPlayingId = currentTurnId;
		}
	});

	const stateColor = $derived(client?.isCurrentTurn() ? "bg-green-500" : "bg-orange-500");
</script>

<div class="flex h-svh gap-4 p-4">
	{#if client?.isGameRunning()}
		<div class="flex flex-1 flex-col justify-between">
			<Opponents {client} />
			{#if client?.hasGameEnded()}
				<GameOver {client} />
			{:else}
				<Tiles {client} />
			{/if}
      <Words {client} userId={client?.getUserId()} />
		</div>
	{:else}
		<Lobby {client} />
	{/if}
	<div class="w-[300px]">
		<Chat {client} />
	</div>
</div>
