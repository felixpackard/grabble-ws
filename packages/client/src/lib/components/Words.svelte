<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import Tile from "./Tile.svelte";

  let { client, userId } : { client: WebSocketClient | null, userId: string | null } = $props();

  let user = $derived(client?.getUser(userId ?? "") ?? null);
  let words = $derived(user?.words ?? []);
</script>

<div class="flex items-center gap-6 flex-wrap min-h-10">
  {#each words as word}
    <div class="flex items-center gap-0.5">
      {#each word.split("") as tile}
        <Tile {tile} />
      {/each}
    </div>
  {/each}
</div>
