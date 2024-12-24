<script lang="ts">
	import type { WebSocketClient } from "$lib/websocket.svelte";
  import { CirclePlus, Replace, Send, Swords } from "lucide-svelte";
	import { SystemMessageType } from "shared/types/message";
	import { MessageType } from "shared/types/user";
	import { onMount } from "svelte";

  let message = $state("");

  let { client } : { client: WebSocketClient | null } = $props();

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
    }
  });

  $effect(() => {
    if (client?.getUserMessages()) {
      container.scrollTop = container.scrollHeight;
    }
  });

  function sendMessage() {
    if (!message) return;
    client?.sendMessage(message);
    message = "";
  }
</script>

<div class="flex flex-col gap-2 h-full">
  <div class="flex items-center justify-between text-sm">
    <h1 class="font-bold">Chat</h1>
    <div>
      <span>Room Code:</span>
      <span class="font-bold">{client?.getRoomCode()}</span>
    </div>
  </div>
  <div bind:this={container} class="flex flex-col gap-2 p-4 flex-1 border-2 border-gray-300 rounded-lg shadow-md overflow-auto">
    <div class="flex flex-col gap-2">
      {#each client?.getUserMessages() ?? [] as message}
        <div>
          {#if message.type === MessageType.User}<span class="font-bold">{message.data.username}:</span> {message.data.message}{/if}
          {#if message.type === MessageType.System}
            {#if message.data.type === SystemMessageType.WordAdded}<CirclePlus class="size-5 inline-block text-green-600" /> <span class="font-bold">{message.data.data.username}</span> made <span class="font-bold uppercase">{message.data.data.word}</span>{/if}
            {#if message.data.type === SystemMessageType.WordUpdated}<Replace class="size-5 inline-block text-yellow-600" /> <span class="font-bold">{message.data.data.username}</span> made <span class="font-bold uppercase">{message.data.data.newWord}</span> from <span class="font-bold uppercase">{message.data.data.oldWord}</span>{/if}
            {#if message.data.type === SystemMessageType.WordStolen}<Swords class="size-5 inline-block text-red-600" /> <span class="font-bold">{message.data.data.newUsername}</span> made <span class="font-bold uppercase">{message.data.data.newWord}</span> from <span class="font-bold uppercase">{message.data.data.oldUsername}</span>'s <span class="font-bold uppercase">{message.data.data.oldWord}</span>{/if}
          {/if}
        </div>
      {/each}
    </div>
  </div>
  <div class="flex gap-2">
    <input bind:this={input} class="flex-1" type="text" placeholder="Enter a message" bind:value={message} onkeydown={(e) => e.key === "Enter" && sendMessage()} />
    <button onclick={sendMessage}><Send class="size-4" /></button>
  </div>
</div>
