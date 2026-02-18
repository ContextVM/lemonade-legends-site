import { ApplesauceRelayPool } from '@contextvm/sdk';

import { defaultRelays } from '$lib/relay-pool';

/**
 * Shared relay handler for all ContextVM (NostrClientTransport) connections.
 *
 * Sharing a single pool prevents duplicate relay connections when multiple
 * clients (e.g. public + logged-in) are active.
 */
export const cvmRelayHandler = new ApplesauceRelayPool(defaultRelays);
