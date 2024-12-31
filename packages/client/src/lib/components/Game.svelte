<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import Chat from "./Chat.svelte";
	import GameOver from "./GameOver.svelte";
	import Lobby from "./Lobby.svelte";
	import Opponents from "./Opponents.svelte";
	import Tiles from "./Tiles.svelte";
	import Words from "./Words.svelte";

	let { client }: { client: WebSocketClient | null } = $props();
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
