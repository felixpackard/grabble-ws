<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import Leave from "./Leave.svelte";

	let { client }: { client: WebSocketClient | null } = $props();

	let users = $derived(client?.getTurnOrderIds().map((id) => client?.getUser(id) ?? {}) ?? []);
</script>

<div class="relative flex flex-1 items-center justify-center">
	<div class="absolute left-0 top-0">
		<Leave {client} />
	</div>
	<div
		class="flex w-full max-w-md flex-col gap-2 rounded-lg border-2 border-gray-300 p-4 shadow-md">
		<h1 class="font-bold">{users.length > 1 ? "Ready to Start" : "Waiting for players..."}</h1>
		<ul class="list-inside list-disc">
			{#each users as user}
				<li>{user.username}{user.id === client?.getHostId() ? " (host)" : ""}</li>
			{/each}
		</ul>
		<button
			disabled={(users.length <= 1 && !import.meta.env.DEV) || !client?.isHost()}
			onclick={() => client?.startGame()}>Start Game [{users.length}/4 players]</button>
	</div>
</div>
