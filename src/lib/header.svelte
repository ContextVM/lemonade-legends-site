<script lang="ts">
	import ThemeToggle from './theme-toggle.svelte';
	import ProfileCard from './ProfileCard.svelte';
	import AccountLoginDialog from './components/ui/AccountLoginDialog.svelte';
	import { activeAccount } from './accountManager.svelte.js';
</script>

<header
	class="fixed top-0 right-0 left-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
>
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
		<!-- Logo (left) -->
		<div class="flex items-center gap-2">
			<img
				src="/ll-badge.png"
				alt="Lemonade Legends"
				class="h-8 w-8 rounded-lg border border-white/50 bg-card object-cover shadow-sm"
			/>
			<span class="text-lg font-semibold">Lemonade Legends</span>
		</div>

		<!-- Right side: Login/Profile + Theme Toggle -->
		<div class="flex items-center gap-3">
			{#if $activeAccount}
				<ProfileCard pubkey={$activeAccount.pubkey} showLogout={true} size="sm" />
			{:else}
				<AccountLoginDialog />
			{/if}
			<ThemeToggle />
		</div>
	</div>
</header>
