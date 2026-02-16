Minimal UI-only payment handler (single-server demo):

Source of truth is now a single in-memory store + a tiny handler factory:

- Store + handler: [`paymentUi`](../src/lib/payments/payments-ui.svelte.ts:44) + [`createUiOnlyPaymentHandler()`](../src/lib/payments/payments-ui.svelte.ts:55)
- Client wiring: [`withClientPayments()`](../src/ctxcn/LemonadeLegendsClient.ts:74)

```ts
import { withClientPayments } from '@contextvm/sdk/payments';
import { createUiOnlyPaymentHandler } from '$lib/payments/payments-ui.svelte';

const transport = withClientPayments(baseTransport, {
	handlers: [createUiOnlyPaymentHandler()]
});
```
