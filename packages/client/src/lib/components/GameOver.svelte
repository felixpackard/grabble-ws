<script lang="ts">
	import { WebSocketClient } from "$lib/websocket.svelte";
	import { values } from "lodash";
	import { ConfettiCannon } from "svelte-canvas-confetti";

  let { client } : { client: WebSocketClient | null } = $props();
  
  let scores = $derived(client?.getFinalScores() ?? []);
  let winner = $derived(scores[0].username);
</script>

<div class="flex justify-center">
  <div class="flex p-4 flex-col gap-2 max-w-md w-full border-2 border-gray-300 rounded-lg shadow-md">
    <h1 class="font-bold">{winner} wins!</h1>
    <ul class="list-disc list-inside">
      {#each scores as user}
        <li>{user.username}: <span class="font-bold">{user.score} point{user.score === 1 ? "" : "s"}</span></li>
      {/each}
    </ul>
    <!-- TODO: Change this back to <= 1 -->
    <button disabled={!client?.isHost()} onclick={() => client?.startGame()}>Restart Game</button>
  </div>
</div>

<ConfettiCannon origin={[window.innerWidth / 2, window.innerHeight]} />
