<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import Words from "./Words.svelte";

	let { client }: { client: WebSocketClient | null } = $props();

	let orderedUsers = $derived(
		client
			?.getTurnOrderIds()
			.filter((id) => id !== client?.getUserId())
			.map((id) => client?.getUser(id) ?? {}) ?? [],
	);
</script>

<div class="flex flex-col gap-4">
	{#each orderedUsers as user}
		<Words {client} userId={user.id} />
	{/each}
</div>
