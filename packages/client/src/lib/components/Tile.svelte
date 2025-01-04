<script lang="ts">
	import { onMount } from "svelte";
	import { Spring } from "svelte/motion";

	let { tile, animate = false }: { tile: string; animate?: boolean } = $props();

	let scale = new Spring(animate ? 0.8 : 1, {
		stiffness: 0.05,
		damping: 0.1,
	});

	onMount(() => {
		if (animate) {
			scale.set(1);
		}
	});
</script>

<div
	style:scale={scale.current}
	style:opacity={scale.current}
	class="flex size-10 items-center justify-center rounded-lg border-2 border-orange-800 bg-orange-200 text-lg font-bold uppercase text-orange-800">
	{tile}
</div>
