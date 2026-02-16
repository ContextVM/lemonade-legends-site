import { Client } from "@modelcontextprotocol/sdk/client";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  NostrClientTransport,
  type NostrTransportOptions,
  PrivateKeySigner,
  ApplesauceRelayPool,
} from "@contextvm/sdk";
import { withClientPayments } from "@contextvm/sdk/payments";
import { createUiOnlyPaymentHandler } from "$lib/payments/payments-ui.svelte";
import { defaultRelays } from "$lib/relay-pool";

export type MintBadgeInput = Record<string, unknown>;

export interface MintBadgeOutput {
  [k: string]: unknown;
}

export type StatsInput = Record<string, unknown>;

export interface StatsOutput {
  pubkeys: string[];
}

export type LemonadeLegends = {
  MintBadge: (args: MintBadgeInput) => Promise<MintBadgeOutput>;
  Stats: (args: StatsInput) => Promise<StatsOutput>;
};

export class LemonadeLegendsClient implements LemonadeLegends {
  static readonly SERVER_PUBKEY = "fde21351fbc8604c27dcff3d507f8e9b15438f3bd04093ca3fd57cd6b36c58d0";
  static readonly DEFAULT_RELAYS = defaultRelays;
  private client: Client;
  private transport: Transport;

  constructor(
    options: Partial<NostrTransportOptions> & {
			privateKey?: string;
			relays?: string[];
			/**
			 * Enable CEP-8 payments UI (captures `payment_required` and surfaces invoices).
			 * This does NOT auto-pay.
			 */
			enablePaymentsUi?: boolean;
		} = {}
  ) {
    this.client = new Client({
      name: "LemonadeLegendsClient",
      version: "1.0.0",
    });

    // Private key precedence: constructor options > config file
    const resolvedPrivateKey = options.privateKey ||
      "";

    // Use options.signer if provided, otherwise create from resolved private key
    const signer = options.signer || new PrivateKeySigner(resolvedPrivateKey);
    // Use options.relays if provided, otherwise use class DEFAULT_RELAYS
    const relays = options.relays || LemonadeLegendsClient.DEFAULT_RELAYS;
    // Use options.relayHandler if provided, otherwise create from relays
    const relayHandler = options.relayHandler || new ApplesauceRelayPool(relays);
    const serverPubkey = options.serverPubkey;
    const { privateKey: _, ...rest } = options;

    const resolvedServerPubkey = serverPubkey || LemonadeLegendsClient.SERVER_PUBKEY;

    const baseTransport = new NostrClientTransport({
      serverPubkey: resolvedServerPubkey,
      signer,
      relayHandler,
      isStateless: true,
      ...rest,
    });

    // CEP-8 client-side payments middleware.
    // First iteration: UI-only handler that captures `payment_required` so the UI can show invoices.
    this.transport = options.enablePaymentsUi
      ? withClientPayments(baseTransport, {
          handlers: [
            createUiOnlyPaymentHandler(),
          ],
        })
      : baseTransport;

    // Auto-connect in constructor
    this.client.connect(this.transport).catch((error) => {
      console.error(`Failed to connect to server: ${error}`);
    });
  }

  async disconnect(): Promise<void> {
    await this.transport.close();
  }

  private async call<T = unknown>(
    name: string,
    args: Record<string, unknown>
  ): Promise<T> {
    const result = await this.client.callTool({
      name,
      arguments: { ...args },
    });
    return result.structuredContent as T;
  }

    /**
   * Mint a "lemonade-legends" badge for your Nostr profile. This issues a NIP-58 badge award event to your pubkey. Current price: 21 sats (increases daily - buy early for the best deal!).
   * @returns {Promise<MintBadgeOutput>} The result of the mint_badge operation
   */
  async MintBadge(
    args: MintBadgeInput
  ): Promise<MintBadgeOutput> {
    return this.call("mint_badge", args);
  }

    /**
   * Get statistics about all issued Lemonade Legends badges and current pricing info
   * @returns {Promise<StatsOutput>} The result of the stats operation
   */
  async Stats(
    args: StatsInput
  ): Promise<StatsOutput> {
    return this.call("stats", args);
  }
}
