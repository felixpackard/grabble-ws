<script lang="ts">
	import { Spring } from "svelte/motion";
	import Tile from "./Tile.svelte";
	import { onMount } from "svelte";

	const { word }: { word: string } = $props();

	let offset = new Spring(10, {
		stiffness: 0.05,
		damping: 0.1,
	});

	onMount(() => {
		offset.set(0);
	});
</script>

<div style:transform={`translateY(${offset.current}px)`} class="flex items-center gap-0.5">
	{#each word.split("") as tile}
		<Tile {tile} />
	{/each}
</div>
