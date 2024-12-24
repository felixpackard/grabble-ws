<script lang="ts">
  import { WebSocketClient } from "$lib/websocket.svelte";
	import { Eye, Shuffle } from "lucide-svelte";
	import Tile from "./Tile.svelte";
	import { onMount } from "svelte";

  let { client } : { client: WebSocketClient | null } = $props();

  onMount(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        if (client?.isCurrentTurn()) {
          client?.turnTile();
        }
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  });
</script>

<div class="flex justify-between items-center gap-2">
  <div class="flex items-center gap-2 flex-wrap">
    {#each client?.getTiles() ?? [] as tile}
      <Tile {tile} />
    {/each}
  </div>
  <div class="flex flex-col gap-2 shrink-0">
    <button disabled={!client?.isCurrentTurn()} onclick={() => client?.turnTile()} class="flex items-center justify-center gap-1.5">
      <Eye class="size-4" /> Turn
    </button>
    <button onclick={() => client?.shuffleTiles()} class="flex items-center justify-center gap-1.5">
      <Shuffle class="size-4" /> Shuffle
    </button>
  </div>
</div>
