<script lang="ts">
	import type { WebSocketClient } from "$lib/websocket.svelte";
	import { CirclePlus, ClockAlert, Replace, Send, Swords } from "lucide-svelte";
	import { SystemMessageType } from "shared/types/message";
	import { MessageType } from "shared/types/user";
	import { onMount } from "svelte";
	import RoomCode from "./RoomCode.svelte";
	import Leave from "./Leave.svelte";

	let message = $state("");

	let { client }: { client: WebSocketClient | null } = $props();

	let container: HTMLDivElement;
	let input: HTMLInputElement;

	onMount(() => {
		const handler = (e: KeyboardEvent) => {
			if (/^[a-zA-Z0-9]$/.test(e.key) || e.key === "Backspace") {
				input.focus();
			}
		};

		window.addEventListener("keydown", handler);

		return () => {
			window.removeEventListener("keydown", handler);
		};
	});

	$effect(() => {
		if (client?.getChatMessages().length && container) {
			container.scroll({ top: container.scrollHeight, behavior: "smooth" });
		}
	});

	function sendMessage() {
		if (!message) return;
		client?.sendMessage(message);
		message = "";
	}
</script>

<div class="flex h-full flex-col gap-2">
	<div class="flex items-center justify-between text-sm">
		<h1 class="font-bold">Chat</h1>
		{#if client?.isGameRunning()}
			<Leave {client} />
		{:else}
			<RoomCode {client} />
		{/if}
	</div>
	<div
		bind:this={container}
		class="flex flex-1 flex-col gap-2 overflow-auto rounded-lg border-2 border-gray-300 p-4 shadow-md">
		<div class="flex flex-col gap-2">
			{#each client?.getChatMessages() ?? [] as message}
				<div>
					{#if message.type === MessageType.User}<span class="font-bold"
							>{message.data.username}:</span>
						{message.data.message}{/if}
					{#if message.type === MessageType.System}
						{#if message.data.type === SystemMessageType.WordAdded}<CirclePlus
								class="inline-block size-5 text-green-600" />
							<span class="font-bold">{message.data.data.username}</span>
							made <span class="font-bold uppercase">{message.data.data.word}</span>{/if}
						{#if message.data.type === SystemMessageType.WordUpdated}<Replace
								class="inline-block size-5 text-yellow-600" />
							<span class="font-bold">{message.data.data.username}</span>
							made <span class="font-bold uppercase">{message.data.data.newWord}</span> from
							<span class="font-bold uppercase">{message.data.data.oldWord}</span>{/if}
						{#if message.data.type === SystemMessageType.WordStolen}<Swords
								class="inline-block size-5 text-red-600" />
							<span class="font-bold">{message.data.data.newUsername}</span>
							made <span class="font-bold uppercase">{message.data.data.newWord}</span> from
							<span class="font-bold uppercase">{message.data.data.oldUsername}</span>'s
							<span class="font-bold uppercase">{message.data.data.oldWord}</span>{/if}
						{#if message.data.type === SystemMessageType.NoTilesRemaining}<ClockAlert
								class="inline-block size-5 text-red-600" /> No tiles remaining!{/if}
					{/if}
				</div>
			{/each}
		</div>
	</div>
	<div class="flex gap-2">
		<input
			bind:this={input}
			class="flex-1"
			type="text"
			placeholder="Enter a message"
			bind:value={message}
			onkeydown={(e) => e.key === "Enter" && sendMessage()} />
		<button onclick={sendMessage}><Send class="size-4" /></button>
	</div>
</div>
