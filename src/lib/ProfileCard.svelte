<script lang="ts">
	import { ProfileModel } from 'applesauce-core/models';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { Metadata } from 'nostr-tools/kinds';
	import { eventStore } from './eventStore';
	import { addressLoader } from './loaders.svelte';
	import { metadataRelays } from './relay-pool';
	import Button from './components/ui/button/button.svelte';
	import { logout } from './accountManager.svelte';

	let {
		pubkey,
		showLogout = true,
		size = 'md'
	}: {
		pubkey: string;
		showLogout?: boolean;
		size?: 'sm' | 'md';
	} = $props();

	const profile = $derived(eventStore.model(ProfileModel, pubkey));
	$effect(() => {
		if ($profile) return;
		const sub = addressLoader({
			kind: Metadata,
			pubkey,
			relays: metadataRelays
		}).subscribe();
		return () => sub.unsubscribe();
	});

	export function pubkeyToHexColor(pubkey: string): string {
	if (!pubkey) {
		throw new Error('Pubkey is required');
	}

	const hexColor = pubkey.slice(0, 6);

	return `#${hexColor}`;
}

</script>

{#snippet pfp(pubkey: string, pfp?: string, size: 'sm' | 'md')}
	{#if pfp}
		<img
			src={pfp}
			alt="pfp"
			class="rounded-full object-cover {size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'}"
		/>
	{:else}
		<div
			class="rounded-full {size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'}"
			style="background-color: {pubkeyToHexColor(pubkey)}"
		></div>
	{/if}
{/snippet}

{#if $profile}
	<div class="flex items-center gap-2">
		{@render pfp(pubkey, $profile.picture, size)}
		<div>
			<span class="font-semibold {size === 'sm' ? 'text-sm' : 'text-lg'}"
				>{$profile.name || $profile.display_name || 'Unknown'}</span
			>
		</div>
		{#if showLogout}
			<Button variant="ghost" size="icon" onclick={logout} aria-label="Logout">
				<LogOut class="h-4 w-4" />
			</Button>
		{/if}
	</div>
{:else}
	<div class="flex items-center gap-2">
		{@render pfp(pubkey, undefined, size)}
		<div>
			<span class="font-semibold {size === 'sm' ? 'text-sm' : 'text-lg'}">
				{pubkey.slice(0, 8)}…
			</span>
		</div>
		{#if showLogout}
			<Button variant="ghost" size="icon" onclick={logout} aria-label="Logout">
				<LogOut class="h-4 w-4" />
			</Button>
		{/if}
	</div>
{/if}
