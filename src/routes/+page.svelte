<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import AccountLoginDialog from '$lib/components/ui/AccountLoginDialog.svelte';
	import QrCode from '$lib/components/ui/QrCode.svelte';
	import { activeAccount } from '$lib/accountManager.svelte';
	import { paymentUi } from '$lib/payments/payments-ui.svelte';
	import ProfileCard from '$lib/ProfileCard.svelte';
	import { cvmRelayHandler } from '$lib/cvm-relay-handler';
	import { LemonadeLegendsClient } from '../ctxcn/LemonadeLegendsClient';
	import { onMount } from 'svelte';
	import { untrack } from 'svelte';
	import { RefreshCw } from 'lucide-svelte';

	let client = $state<LemonadeLegendsClient | null>(null);
	let statsLoading = $state(false);
	let statsError = $state('');
	let stats = $state<{ pubkeys: string[] } | null>(null);

	let mintLoading = $state(false);
	let mintError = $state('');
	let mintResult = $state<unknown>(null);
	let mintSuccess = $state('');
	let mintStage = $state<'idle' | 'minting' | 'payment_required' | 'success' | 'error'>('idle');

	// Shared client for read-only calls (e.g. stats) when not logged in.
	// Avoid constructing a new client per refresh.
	const publicClient = new LemonadeLegendsClient({
		enablePaymentsUi: true,
		relayHandler: cvmRelayHandler
	});
	publicClient.connect().catch((e) => console.error('Failed to connect public client', e));

	// Minimal single-server payment UI state (latest invoice).
	const paymentEntry = $derived(paymentUi.state);
	const paymentInvoice = $derived(
		paymentEntry?.status === 'payment_required' ? paymentEntry.pay_req : null
	);

	$effect(() => {
		// (Re)create client when account changes.
		// Use effect cleanup + a generation guard so disconnect/connect races don't
		// leak a stale client or update state out of order.
		let disposed = false;
		const previousClient = untrack(() => client);
		mintStage = 'idle';

		if (!$activeAccount) {
			client = null;
			if (previousClient) previousClient.disconnect();
			return () => {
				disposed = true;
			};
		}

		const nextClient = new LemonadeLegendsClient({
			signer: $activeAccount.signer,
			enablePaymentsUi: true,
			relayHandler: cvmRelayHandler
		});

		// Disconnect the previous client after creating the new one so we reduce
		// downtime during account switching.
		if (previousClient) previousClient.disconnect();

		nextClient.connect().catch((e) => {
			if (disposed) return;
			console.error('Failed to connect LemonadeLegendsClient', e);
		});

		client = nextClient;

		return () => {
			disposed = true;
			nextClient.disconnect();
		};
	});

	async function loadStats() {
		try {
			statsLoading = true;
			statsError = '';
			const c = client ?? publicClient;
			stats = await c.Stats({});
		} catch (e) {
			statsError = e instanceof Error ? e.message : 'Failed to load stats';
		} finally {
			statsLoading = false;
		}
	}

	async function mintBadge() {
		mintError = '';
		mintResult = null;
		mintSuccess = '';
		try {
			mintLoading = true;
			mintStage = 'minting';
			if (!client) throw new Error('Please login first');
			paymentUi.reset();
			// This call will trigger CEP-8 `payment_required` notification if priced.
			// UI-only handler will capture invoice; user pays externally; server should later accept and complete.
			mintResult = await client.MintBadge({});
			mintStage = 'success';
			mintSuccess = 'Badge minted and awarded successfully.';
			paymentUi.reset();
			// Optimistically update stats to avoid an extra signed round trip.
			// We’ll still get fresh data the next time the user manually refreshes stats.
			if (stats && $activeAccount) {
				const pk = $activeAccount.pubkey;
				if (!stats.pubkeys.includes(pk)) stats = { ...stats, pubkeys: [pk, ...stats.pubkeys] };
			}
		} catch (e) {
			mintError = e instanceof Error ? e.message : 'Failed to mint badge';
			mintStage = 'error';
		} finally {
			mintLoading = false;
		}
	}

	$effect(() => {
		if (mintLoading && paymentEntry?.status === 'payment_required') mintStage = 'payment_required';
	});

	onMount(() => {
		// Auto-load stats on first render
		loadStats();
	});
</script>

<main class="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-4xl flex-col gap-10 px-4 pt-24 pb-16">
	<section class="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 text-center">
		<img
			src="/ll-badge.png"
			alt="Lemonade Legends"
			class="ll-anim-float h-36 w-36 rounded-2xl border border-white/50 bg-card object-cover shadow-sm ring-1 ring-black/5"
		/>
		<div class="space-y-2">
			<h1
				class="ll-anim-sheen bg-linear-to-br from-[oklch(0.62_0.16_155)] via-[oklch(0.86_0.16_96)] to-[oklch(0.92_0.12_96)] bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-5xl"
			>
				Lemonade Legends
			</h1>
			<p class="text-balance text-muted-foreground">
				Mint the <span class="font-medium text-foreground">lemonade-legends</span> NIP-58 badge award
				to your Nostr pubkey via a paid ContextVM capability.
			</p>
		</div>
	</section>

	<!-- About Section -->
	<section class="mx-auto w-full max-w-2xl text-center">
		<div class="space-y-4 text-muted-foreground">
			<p>
				Lemonade Legends is a little experiment built for the <a
					href="https://contextvm.org"
					target="_blank"
					rel="noreferrer"
					class="underline hover:text-foreground">ContextVM</a
				>
				ecosystem. It's a playful way to explore how
				<a
					href="https://docs.contextvm.org/spec/ceps/cep-8/"
					target="_blank"
					rel="noreferrer"
					class="underline hover:text-foreground">CEP-8 payments</a
				> work in practice.
			</p>
			<p>
				The idea is simple: each badge costs a few sats, and the price ticks up by 21 sats every
				day. No surprises, no rush—just a steady, predictable curve. Pay with Lightning, get your
				badge, and join the legends.
			</p>
			<p class="text-sm">
				Read the full story on the <a
					href="https://contextvm.org/blog/lemonade-legends"
					target="_blank"
					rel="noreferrer"
					class="underline hover:text-foreground">blog</a
				>. Everything is open source—check out the
				<a
					href="https://github.com/ContextVM/lemonade-legends"
					target="_blank"
					rel="noreferrer"
					class="underline hover:text-foreground">server</a
				>
				and
				<a
					href="https://github.com/ContextVM/lemonade-legends-site"
					target="_blank"
					rel="noreferrer"
					class="underline hover:text-foreground">this site</a
				> on GitHub.
			</p>
		</div>
	</section>

	<section
		class="mx-auto w-full max-w-3xl rounded-2xl border border-white/50 bg-card/80 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur"
	>
		<div class="text-center">
			<h2 class="text-xl font-semibold">Mint your badge</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Login, click mint, then pay the Lightning invoice when prompted.
			</p>
			<p class="mt-1 text-sm text-muted-foreground">
				Status: <span class="font-medium text-foreground">{mintStage}</span>
			</p>
		</div>

		<div class="mt-5 flex justify-center">
			{#if mintStage !== 'success'}
				{#if $activeAccount}
					<Button onclick={mintBadge} disabled={mintLoading} class="sm:min-w-[240px]">
						{mintLoading ? 'Minting…' : 'Mint Lemonade Legends Badge'}
					</Button>
				{:else}
					<AccountLoginDialog />
				{/if}
			{/if}
		</div>

		{#if mintError}
			<p class="mt-3 text-center text-sm text-destructive">{mintError}</p>
		{/if}
		{#if mintSuccess}
			<div
				class="mx-auto mt-4 max-w-md rounded-lg border border-[oklch(0.62_0.16_155)/0.28] bg-[oklch(0.965_0.06_160)/0.35] px-4 py-3 text-center text-sm ring-1 ring-black/5"
			>
				<p class="font-medium text-[oklch(0.22_0.05_160)]">{mintSuccess}</p>
				<p class="mt-1 text-[oklch(0.22_0.05_160)/0.8]">
					View your badge on
					<a class="underline" href="https://badges.page" target="_blank" rel="noreferrer"
						>badges.page</a
					>
					or
					<a class="underline" href="https://nostrsigil.com" target="_blank" rel="noreferrer"
						>nostrsigil.com</a
					>
					<span>.</span>
				</p>
			</div>
		{/if}
		{#if mintResult}
			<pre
				class="mx-auto mt-3 max-w-md overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(
					mintResult,
					null,
					2
				)}</pre>
		{/if}

		<!-- Payment UI (invoice) -->
		{#if paymentInvoice}
			<div
				class="mt-6 overflow-hidden rounded-xl border border-white/50 bg-background/70 p-5 ring-1 ring-black/5"
			>
				<div class="text-center">
					<h3 class="text-base font-semibold">Payment required</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						Pay this Lightning invoice to continue minting.
					</p>
					{#if paymentEntry?.status === 'payment_required' && paymentEntry.description}
						<p class="mt-1 text-sm text-muted-foreground">{paymentEntry.description}</p>
					{/if}
				</div>

				<div class="mt-5 flex justify-center">
					<div
						class="rounded-xl border border-white/50 bg-card/80 p-3 shadow-sm ring-1 ring-black/5"
					>
						<QrCode data={paymentInvoice} size={260} />
					</div>
				</div>

				<div class="mt-5 space-y-2">
					<div class="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
						<Button
							variant="outline"
							onclick={async () => {
								await navigator.clipboard.writeText(paymentInvoice);
							}}
						>
							Copy invoice
						</Button>
						<a
							class="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm hover:bg-muted"
							href={`lightning:${paymentInvoice}`}
						>
							Open in wallet
						</a>
					</div>
					<pre class="max-h-44 overflow-auto rounded-md bg-muted p-3 text-xs">{paymentInvoice}</pre>
					<p class="text-center text-xs text-muted-foreground">
						After paying, keep this page open while the server confirms payment. You’ll see a
						success message above.
					</p>
				</div>
			</div>
		{/if}
	</section>

	<section
		class="mx-auto w-full max-w-4xl rounded-2xl border border-white/50 bg-card/80 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur"
	>
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<h2 class="text-xl font-semibold">Legends (already awarded)</h2>
				{#if stats}
					<p class="text-sm text-muted-foreground">{stats.pubkeys.length} total</p>
				{/if}
			</div>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={loadStats}
				disabled={statsLoading}
				title="Refresh stats"
			>
				<RefreshCw class={statsLoading ? 'animate-spin' : ''} size={16} />
			</Button>
		</div>
		{#if statsError}
			<p class="mt-2 text-center text-sm text-destructive">{statsError}</p>
		{:else if !stats}
			<p class="mt-2 text-center text-sm text-muted-foreground">Loading…</p>
		{:else if stats.pubkeys.length === 0}
			<p class="mt-2 text-center text-sm text-muted-foreground">No badges issued yet.</p>
		{:else}
			<ul class="mt-4 grid grid-cols-1 justify-items-center gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each stats.pubkeys as pk (pk)}
					<li
						class="w-full max-w-sm rounded-xl border border-white/50 bg-background/70 px-3 py-3 ring-1 ring-black/5"
					>
						<!-- Reuse ProfileCard, but disable logout in list context -->
						<ProfileCard pubkey={pk} showLogout={false} size="sm" />
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
