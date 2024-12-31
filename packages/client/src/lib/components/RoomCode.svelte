<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import { Clipboard, ClipboardCheck } from "lucide-svelte";
	import { toast } from "svelte-sonner";

	let { client }: { client: WebSocketClient | null } = $props();

	let justCopied = $state(false);

	let Icon = $derived(justCopied ? ClipboardCheck : Clipboard);

	function copy() {
		if (justCopied) return;

		navigator.clipboard.writeText(client?.getRoomCode() ?? "");
		justCopied = true;

		setTimeout(() => {
			justCopied = false;
		}, 1500);

		toast.success("Room code copied to clipboard");
	}
</script>

<div class="flex items-center gap-2">
	<div>
		<span>Room Code:</span>
		<span class="font-bold">{client?.getRoomCode()}</span>
	</div>
	<button
		onclick={copy}
		class="-m-0.5 !rounded-none border-none !bg-transparent p-0.5 hover:text-orange-700 focus:text-orange-800">
		<Icon class="size-4" strokeWidth={3} />
	</button>
</div>
