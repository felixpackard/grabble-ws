<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import Tile from "./Tile.svelte";

	let { client, userId }: { client: WebSocketClient | null; userId: string | null } = $props();

	let user = $derived(client?.getUser(userId ?? "") ?? null);
	let words = $derived(user?.words ?? []);
</script>

<div class="flex min-h-10 flex-wrap items-center gap-6 gap-y-4">
	{#each words as word}
		<div class="flex items-center gap-0.5">
			{#each word.split("") as tile}
				<Tile {tile} />
			{/each}
		</div>
	{/each}
</div>
