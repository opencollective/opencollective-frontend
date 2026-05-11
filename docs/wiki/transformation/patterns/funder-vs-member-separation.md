# Funder vs. Member separation

Back to: [Patterns](./README.md) | [Transformation](../README.md)

## The pattern

Open Collective is used by two distinct groups whose information needs and mental models barely overlap:

- **Funders and contributors.** Want to see what was raised, what it accomplished, where money went, and whether to trust and support the collective. Their orientation is retrospective and transparency-driven.
- **Organizers and members.** Want to see what is currently available, what is in flight, how to file a reimbursement, how to coordinate the next thing. Their orientation is operational and forward-looking.

Today, both audiences land on the same surface, with the same language, hierarchy, and panels. The visual weight is mostly funder-facing (cumulative totals, public transparency, donate buttons). Organizers end up doing operational work inside a fundraising-shaped page.

## Why this matters

When the framing doesn't match the user's role, even correct information becomes confusing. The Budget panel pain point ([001](../pain-points/001-budget-total-raised-mislabeled.md)) is a small example: "Total Raised" is the right label for a funder and the wrong anchor for an organizer, and the platform offers both of them the same view.

This shows up repeatedly as people are onboarded. The platform's vocabulary, surfaces, and navigation all assume a unified audience, so the cost of misalignment is paid by the user, every time, in small moments of "wait, which number is mine?"

## Proposed shape of the solution

Introduce a clear separation — in space, in design language, or both — between the two modes of using the platform.

A useful analogy is WordPress:

- The **public site** (the storefront, the campaign page, the transparency page) is what a funder sees. It is outward-facing, polished, designed for trust and contribution.
- The **dashboard / backend** is what an organizer uses. It is inward-facing, operational, designed for coordination, expenses, reimbursements, and decisions.

The two should not look or feel the same. The shift between them should be unambiguous. An organizer who is filing a reimbursement should know they are "in the back of house," not standing on the public page.

Concretely, this points to two parallel sets of surfaces:

### Fundraising / outward-facing

- Campaign pages
- Crowdfunding goals and progress
- Transparency views (cumulative totals, top contributors, impact)
- Communication and updates to supporters

### Project coordination / inward-facing

- Operational balance and runway
- Transactions and ledger detail
- Reimbursement and expense submission
- Member coordination, decisions, tasks

These can be physically separate (different routes, different shells, different navigation) or strongly differentiated through design language (typography, density, color, chrome) — likely both. The important thing is that the *role you are playing right now* is reflected in the surface you are looking at.

## What this is not

- Not a call to hide funder-facing information from organizers, or vice versa. Both should be reachable.
- Not a generic "add a dashboard" idea — Open Collective already has dashboards. The point is the conceptual split between public/outward and operational/inward, applied consistently across the product.
- Not a near-term refactor of upstream Open Collective. This is a direction for the eventual fork.

## Open questions

- Where exactly does the line fall? Some surfaces (the Budget panel, expense lists) sit on both sides.
- Should the split be primarily spatial (different URLs/shells) or primarily visual (same shell, different design language)?
- How do hybrid roles (a small collective where the funder and the organizer are partly the same person) experience the split?
- What is the smallest change that would already make the funder/member distinction legible?

## Linked pain points

- [001 — Budget section "Total Raised" misread as available balance](../pain-points/001-budget-total-raised-mislabeled.md)
