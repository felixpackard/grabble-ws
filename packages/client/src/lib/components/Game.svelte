<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import Chat from "./Chat.svelte";
	import Tiles from "./Tiles.svelte";

  let { client } : { client: WebSocketClient | null } = $props();

  let users = $derived(client?.getTurnOrderIds().map((id) => client?.getUser(id) ?? {}) ?? []);
</script>

<div class="flex p-4 gap-4 h-svh">
  {#if client?.isGameRunning()}
    <div class="flex-1 flex flex-col justify-center">
      <Tiles {client} />
    </div>
  {:else}
    <div class="flex-1 flex items-center justify-center">
      <div class="flex p-4 flex-col gap-2 max-w-md w-full border-2 border-gray-300 rounded-lg shadow-md">
        <h1 class="font-bold">{users.length > 1 ? "Ready to Start" : "Waiting for players..."}</h1>
        <ul class="list-disc list-inside">
          {#each users as user}
            <li>{user.username}{user.id === client?.getHostId() ? " (host)" : ""}</li>
          {/each}
        </ul>
        <button disabled={users.length <= 1 || !client?.isHost()} onclick={() => client?.startGame()}>Start Game [{users.length} player{users.length > 1 ? "s" : ""}]</button>
      </div>
    </div>
  {/if}
  <div class="w-[300px]">
    <Chat {client} />
  </div>
</div>
