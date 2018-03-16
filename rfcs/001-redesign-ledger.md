# REQUEST FOR COMMENTS 001 - Redesign Ledger

## Overview

The current implementation of the ledger can be redesigned to provide
more accuracy and make it easier to understand the model used to
manage the transactions.

## Goals

1. Increase accuracy of the ledger
   1. [-] Store Fees on the User & Collective ledgers [rfc-002]
      1. [X] Orders
      2. [ ] Expenses
      3. [ ] Neither
   2. [ ] Double Entry Ledger [rfc-003]
      1. [ ] Create collective type "Payment Provider"
      2. [ ] Create separate transactions for fees
