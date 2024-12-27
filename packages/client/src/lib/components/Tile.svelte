<script lang="ts">
	let { tile }: { tile: string } = $props();
</script>

<div
	class="flex size-10 items-center justify-center rounded-lg border-2 border-orange-800 bg-orange-200 text-lg font-bold uppercase text-orange-800">
	{tile}
</div>
