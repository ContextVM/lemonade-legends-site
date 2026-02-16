<script lang="ts">
	import './layout.css';
   	import { ModeWatcher } from "mode-watcher";
	import Header from '$lib/header.svelte';
	let { children } = $props();
</script>

<svelte:head><link rel="icon" type="image/png" href="/icon.png" /></svelte:head>
<ModeWatcher />
<Header />

{@render children()}
