<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import Chat from "./Chat.svelte";
	import Lobby from "./Lobby.svelte";
	import Tiles from "./Tiles.svelte";
	import Words from "./Words.svelte";

  let { client } : { client: WebSocketClient | null } = $props();

  let playingUser = $derived(client?.getUser(client?.getCurrentTurnId() ?? "") ?? null);

  let lastOpponentPlayingId: string | null = $state(null);

  $effect(() => {
    let currentTurnId = client?.getCurrentTurnId();
    if (currentTurnId && currentTurnId !== client?.getUserId()) {
      lastOpponentPlayingId = currentTurnId;
    }
  });
</script>

<div class="flex p-4 gap-4 h-svh">
  {#if client?.isGameRunning()}
    <div class="flex-1 flex flex-col justify-between">
      <div class="flex flex-col gap-2">
        <div>It's <span class="font-bold">{playingUser?.username}</span>'s turn</div>
        <Words {client} userId={lastOpponentPlayingId} />
      </div>
      <Tiles {client} />
      <Words {client} userId={client?.getUserId()} />
    </div>
  {:else}
    <Lobby {client} />
  {/if}
  <div class="w-[300px]">
    <Chat {client} />
  </div>
</div>
