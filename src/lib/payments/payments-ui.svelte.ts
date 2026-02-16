import type { PaymentHandler, PaymentHandlerRequest } from '@contextvm/sdk/payments';

/**
 * Minimal CEP-8 Payments UI state (single-server demo).
 *
 * This site only needs to surface the latest `payment_required` invoice so the
 * user can pay externally (wallet/QR).
 */
export type PaymentUiState = {
	status: 'payment_required';
	requestEventId: string;
	amount: number;
	pay_req: string;
	description?: string;
	timestamp: number;
} | null;

class PaymentUiStore {
	state = $state<PaymentUiState>(null);

	reset() {
		this.state = null;
	}

	setPaymentRequired(req: PaymentHandlerRequest) {
		this.state = {
			status: 'payment_required',
			requestEventId: req.requestEventId,
			amount: req.amount,
			pay_req: req.pay_req,
			description: req.description,
			timestamp: Date.now()
		};
	}
}

export const paymentUi = new PaymentUiStore();

/**
 * PMI used by the demo server + UI-only handler.
 *
 * This is the built-in Lightning BOLT11 PMI used by the SDK rails.
 */
export const UI_ONLY_PMI = 'bitcoin-lightning-bolt11' as const;

/**
 * UI-only payment handler.
 *
 * - Lets the SDK advertise a PMI via `pmi` tags (CEP-8 discovery)
 * - Captures `payment_required` so the UI can render `pay_req`
 * - Does NOT attempt to pay.
 */
export function createUiOnlyPaymentHandler(): PaymentHandler {
	return {
		pmi: UI_ONLY_PMI,
		canHandle: () => true,
		handle: async (req) => {
			paymentUi.setPaymentRequired(req);
		}
	};
}
