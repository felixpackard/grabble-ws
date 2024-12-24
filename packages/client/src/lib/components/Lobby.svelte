<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";

  let { client } : { client: WebSocketClient | null } = $props();

  let users = $derived(client?.getTurnOrderIds().map((id) => client?.getUser(id) ?? {}) ?? []);
</script>

<div class="flex-1 flex items-center justify-center">
  <div class="flex p-4 flex-col gap-2 max-w-md w-full border-2 border-gray-300 rounded-lg shadow-md">
    <h1 class="font-bold">{users.length > 1 ? "Ready to Start" : "Waiting for players..."}</h1>
    <ul class="list-disc list-inside">
      {#each users as user}
        <li>{user.username}{user.id === client?.getHostId() ? " (host)" : ""}</li>
      {/each}
    </ul>
    <!-- TODO: Change this back to <= 1 -->
    <button disabled={users.length <= 0 || !client?.isHost()} onclick={() => client?.startGame()}>Start Game [{users.length} player{users.length > 1 ? "s" : ""}]</button>
  </div>
</div>
