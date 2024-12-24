<script lang="ts">
	import type { WebSocketClient } from "$lib/websocket.svelte";
  import { Send } from "lucide-svelte";
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
        <span>
          <span class="font-bold">{message.username}:</span> {message.message}
        </span>
      {/each}
    </div>
  </div>
  <div class="flex gap-2">
    <input bind:this={input} class="flex-1" type="text" placeholder="Enter a message" bind:value={message} onkeydown={(e) => e.key === "Enter" && sendMessage()} />
    <button onclick={sendMessage}><Send class="size-4" /></button>
  </div>
</div>
