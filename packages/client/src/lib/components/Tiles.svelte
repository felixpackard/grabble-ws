<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import { Eye, Shuffle } from "lucide-svelte";
	import Tile from "./Tile.svelte";
	import { onMount } from "svelte";

	let { client }: { client: WebSocketClient | null } = $props();

	onMount(() => {
		const handler = (event: KeyboardEvent) => {
			if (event.key === "Tab") {
				event.preventDefault();
				if (client?.isCurrentTurn() && client?.getRemainingTileCount() > 0) {
					client?.turnTile();
				}
			}
		};

		window.addEventListener("keydown", handler);

		return () => {
			window.removeEventListener("keydown", handler);
		};
	});
</script>

<div class="flex items-center justify-between gap-2">
	<div class="flex flex-wrap items-center gap-2">
		{#each client?.getTiles() ?? [] as tile}
			<Tile {tile} animate />
		{/each}
	</div>
	<div class="flex shrink-0 flex-col gap-2">
		<div class="text-center text-xs text-gray-500">[TAB] to turn</div>
		<button
			disabled={!client?.isCurrentTurn() || client?.getRemainingTileCount() === 0}
			onclick={() => client?.turnTile()}
			class="flex items-center justify-center gap-1.5">
			<Eye class="size-4" /> Turn
		</button>
		<button onclick={() => client?.shuffleTiles()} class="flex items-center justify-center gap-1.5">
			<Shuffle class="size-4" /> Shuffle
		</button>
		{#if client?.getRemainingTileCount() === 0}
			<button
				onclick={() => client?.toggleReadyToEnd()}
				class="flex items-center justify-center gap-1.5 {client?.isReadyToEnd() &&
					'border-green-800 bg-green-200 text-green-800 hover:bg-green-300 focus:bg-green-300'}">
				End [{client?.getReadyToEndCount()}/{client?.getTurnOrderIds().length}]
			</button>
		{/if}
	</div>
</div>
