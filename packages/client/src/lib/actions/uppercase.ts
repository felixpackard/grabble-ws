export function uppercase(node: HTMLInputElement) {
	const transform = () => (node.value = node.value.toUpperCase());
	node.addEventListener("input", transform, { capture: true });
	transform();
}
