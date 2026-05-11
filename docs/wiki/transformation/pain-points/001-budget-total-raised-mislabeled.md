# 001 — Budget section "Total Raised" misread as available balance

Back to: [Pain Points](./README.md) | [Transformation](../README.md)

- **Date observed:** 2026-05-11
- **Role affected:** Fund manager (organizer-side user) during onboarding
- **Where in the product:** Collective public page, Budget section near the bottom of the page
- **Related pattern:** [Funder vs. Member separation](../patterns/funder-vs-member-separation.md)

## What happened

While being onboarded to Open Collective, a new fund manager looked at the Budget section on the collective page and read the prominently displayed "Total Raised" figure as the amount they had available to spend.

In the observed page, the panel showed:

- **Today's Balance:** kr 46,000.00 SEK
- **Total Raised:** kr 82,800.00 SEK
- **Total Disbursed:** kr 36,800.00 SEK

The fund manager's first instinct was that the big "Total Raised" number was the operational figure that mattered to them. The actually useful number for their role — "Today's Balance" — is present, but does not read as the headline figure.

## Why this is confusing

The label "Total Raised" is factually correct from a funder/transparency perspective: it is the cumulative inflow over time. But for someone whose job is to coordinate the work the fund pays for, the cumulative inflow is the wrong number to anchor on. They want to know what is currently spendable.

Two different audiences are being served by the same panel, with the funder-facing framing winning the visual hierarchy.

## Underlying issue

This is a specific case of a broader structural issue: the Open Collective surface treats funders/contributors and organizers/members as a single undifferentiated audience. The framing, hierarchy, and language are mostly funder- and transparency-oriented, which then confuses organizers when they are trying to do operational work.

See: [Funder vs. Member separation](../patterns/funder-vs-member-separation.md).

## Possible directions (not decisions)

- Differentiate the Budget panel by viewer role, or split it into a transparency view and an operational view.
- Lower the visual weight of cumulative totals when an organizer is signed in and looking at their own collective.
- Reword "Total Raised" so the temporal scope (lifetime, year-to-date, this campaign) is unambiguous.
- Treat the operational/coordination experience as its own surface rather than a tab inside the public page.
