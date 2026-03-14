# Architecture and Constraints

Back to: [Wiki Home](../Home.md)

## Repo Context

- This repository is the Open Collective frontend
- Many significant product changes are constrained by GraphQL contracts and backend capabilities
- Payment and payout work often spans UI, API, host operations, reconciliation, compliance, and support processes

## Current Swish-Relevant Findings

### Incoming Payments

- Contributor checkout is shaped by `host.supportedPaymentMethods` and `host.manualPaymentProviders`
- The frontend schema already includes `PaymentMethodType.SWISH`
- That does not by itself mean Swish is a complete supported host capability

### Reimbursements and Payouts

- Expense payout options are shaped by `host.supportedPayoutMethods` and `PayoutMethodType`
- Current payout types do not include a native Swish payout method
- That means Swish reimbursements are not currently modeled as a first-class payout rail in the frontend contract

### Plugin Architecture Direction

- The most practical first extension seam is UI-level registries around clearly bounded surfaces
- Useful candidate surfaces include:
  - receiving money integrations
  - checkout payment options
  - payout method options
  - fundraising page enhancements
  - ticketing or event extensions

### Core Platform Boundary

Open Collective core should remain the source of truth for:

- orders
- transactions
- expenses
- payout methods
- settlement state
- permissions and audit trail

Extensions should mainly own:

- provider configuration
- capability state
- provider-specific metadata
- external references and event logs

## Related Notes

- [Current Focus](./Current-Focus.md)
- [Ideas and Questions](./Ideas-and-Questions.md)
- Branch-specific Swish exploration note: `docs/plugin-architecture.md` on `swish-implementation`
