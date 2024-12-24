<script lang="ts">
	import Game from "$lib/components/Game.svelte";
  import Home from "$lib/components/Home.svelte";
  import { WebSocketClient } from "$lib/websocket.svelte";
	import { onMount } from "svelte";

  let client: WebSocketClient | null = $state(null);
  onMount(() => {
    client = new WebSocketClient();
  });
</script>

{#if client?.getRoomCode()}
  <Game {client} />
{:else}
  <Home {client} />
{/if}
