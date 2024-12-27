<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";

	let { client }: { client: WebSocketClient | null } = $props();

	let users = $derived(client?.getTurnOrderIds().map((id) => client?.getUser(id) ?? {}) ?? []);
</script>

<div class="flex flex-1 items-center justify-center">
	<div
		class="flex w-full max-w-md flex-col gap-2 rounded-lg border-2 border-gray-300 p-4 shadow-md">
		<h1 class="font-bold">{users.length > 1 ? "Ready to Start" : "Waiting for players..."}</h1>
		<ul class="list-inside list-disc">
			{#each users as user}
				<li>{user.username}{user.id === client?.getHostId() ? " (host)" : ""}</li>
			{/each}
		</ul>
		<button disabled={users.length <= 1 || !client?.isHost()} onclick={() => client?.startGame()}
			>Start Game [{users.length} player{users.length > 1 ? "s" : ""}]</button>
	</div>
</div>
