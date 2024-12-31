<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import Tile from "./Tile.svelte";

	let { client, userId }: { client: WebSocketClient | null; userId: string | null } = $props();

	let user = $derived(client?.getUser(userId ?? "") ?? null);
	let words = $derived(user?.words ?? []);
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-2 text-sm">
		<span>
			{user?.id === client?.getUserId() ? "You" : user?.username}
		</span>
		{#if user?.id === client?.getCurrentTurnId()}
			<span
				class="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
				Playing
			</span>
		{/if}
	</div>
	<div class="flex flex-wrap items-center gap-6 gap-y-4">
		{#if words.length === 0}
			<div
				class="flex h-10 items-center justify-center rounded-md border-2 border-dashed border-gray-300 px-10 text-sm text-gray-500">
				No words yet
			</div>
		{:else}
			{#each words as word}
				<div class="flex items-center gap-0.5">
					{#each word.split("") as tile}
						<Tile {tile} />
					{/each}
				</div>
			{/each}
		{/if}
	</div>
</div>
