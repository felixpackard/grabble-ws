<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import { LogOut } from "lucide-svelte";

	let { client }: { client: WebSocketClient | null } = $props();

	function leave() {
		client?.leaveRoom();
	}
</script>

<button
	class="flex items-center justify-center gap-1.5 !border-none !bg-transparent p-0 text-sm hover:underline"
	onclick={leave}>
	<LogOut class="size-3.5" />
	Leave
</button>
