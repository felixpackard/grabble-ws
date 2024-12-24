<script lang="ts">
	import { uppercase } from "$lib/actions/uppercase";
  import { SocketState, SocketStateLabel, WebSocketClient } from "$lib/websocket.svelte";

  let username = $state("");
  let roomCode = $state("");

  let { client } : { client: WebSocketClient | null } = $props();

  function createGame() {
    client?.createRoom(username);
  }

  function joinGame() {
    // TODO: Add validation and error messages
    client?.joinRoom(roomCode, username);
  }

  const stateColor = $derived(() => {
    switch (client?.getState()) {
      case SocketState.Connected:
        return "bg-green-500";
      case SocketState.Connecting:
        return "bg-orange-500";
      case SocketState.Disconnected:
        return "bg-red-500";
    }
  });
</script>

<div class="flex items-center justify-center h-svh w-screen">
  <div class="fixed top-4 left-4 flex gap-2 items-center text-sm">
    <div class="rounded-full size-3 {stateColor()}"></div>
    <span>{SocketStateLabel.get(client?.getState() ?? SocketState.Disconnected)}</span>
  </div>
  <div class="flex p-4 flex-col gap-2 max-w-md border-2 border-gray-300 rounded-lg shadow-md">
    <h1 class="font-bold">grabble-ws</h1>
    <p>grabble-ws is a websockets server that allows you to play grabble with your friends.</p>
    <input type="text" placeholder="Enter your username" use:uppercase bind:value={username} />
    <div class="flex flex-col gap-2 items-center mt-4">
      <button class="w-full" onclick={createGame}>Create a Game</button>
      <div class="flex gap-2 items-center text-gray-500">
        <span>&mdash;</span>
        <span>OR</span>
        <span>&mdash;</span>
      </div>
      <div class="flex items-center gap-2 w-full">
        <input class="flex-1" type="text" placeholder="Enter the room code" use:uppercase bind:value={roomCode} />
        <button onclick={joinGame}>Join Game</button>
      </div>
    </div>
  </div>
</div>
