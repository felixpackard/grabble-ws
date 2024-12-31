<script lang="ts">
	import { uppercase } from "$lib/actions/uppercase";
	import { SocketState, SocketStateLabel, WebSocketClient } from "$lib/websocket.svelte";
	import { SiGithub } from "@icons-pack/svelte-simple-icons";

	let username = $state(localStorage.getItem("defaultUsername") ?? "");
	let roomCode = $state("");

	let { client }: { client: WebSocketClient | null } = $props();

	function createGame() {
		client?.createRoom(username);
	}

	function joinGame() {
		// TODO: Add validation and error messages
		client?.joinRoom(roomCode, username);
	}

	function updateLocalStorage() {
		if (username.length) {
			localStorage.setItem("defaultUsername", username);
		}
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

<div class="flex h-svh w-screen items-center justify-center">
	<div class="fixed left-4 right-4 top-4 flex items-center justify-between text-sm">
		<div class="flex items-center gap-2">
			<div class="size-3 rounded-full {stateColor()}"></div>
			<span>{SocketStateLabel.get(client?.getState() ?? SocketState.Disconnected)}</span>
		</div>
		<a
			href="https://github.com/felixpackard/grabble-ws"
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center gap-2 hover:underline">
			<SiGithub size={16} />
			View on GitHub
		</a>
	</div>
	<div class="flex max-w-md flex-col gap-2 rounded-lg border-2 border-gray-300 p-4 shadow-md">
		<h1 class="font-bold">grabble-ws</h1>
		<p>real-time word theft over the internet.</p>
		<input
			type="text"
			placeholder="Enter your username"
			use:uppercase
			bind:value={username}
			onchange={updateLocalStorage} />
		<div class="mt-4 flex flex-col items-center gap-2">
			<button class="w-full" onclick={createGame}>Create a Game</button>
			<div class="flex items-center gap-2 text-gray-500">
				<span>&mdash;</span>
				<span>OR</span>
				<span>&mdash;</span>
			</div>
			<div class="flex w-full items-center gap-2">
				<input
					class="flex-1"
					type="text"
					placeholder="Enter the room code"
					use:uppercase
					bind:value={roomCode} />
				<button onclick={joinGame}>Join Game</button>
			</div>
		</div>
	</div>
</div>
