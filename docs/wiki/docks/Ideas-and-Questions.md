# Ideas and Questions

Back to: [Wiki Home](../Home.md)

## Open Questions

### Swish Scope

- Should Swish be treated as a strategic platform capability or a regional host-specific enhancement?
- Is a manual or semi-manual Swish bridge good enough for a first rollout?
- Would the operational support burden outweigh the user experience gain for Open Collective hosts?

### Plugin Model

- Which extension surfaces are valuable enough to support formally?
- Should plugins be defined through host settings first or through a dedicated installation model?
- How much of the plugin contract should live in GraphQL versus frontend configuration?

### Product Design

- What would be the cleanest contributor checkout UX for regional methods like Swish?
- How should host admins understand the difference between automatic integrations and manual extensions?
- How much configurability is useful before the host settings experience becomes too complex?

## Candidate Directions

### Conservative

- Use manual payment methods for incoming Swish-like instructions
- Use `OTHER` payout methods for reimbursement instructions
- Learn from real host behavior before creating native rails

### Platform-Oriented

- Define a proper plugin installation model
- Create capability-driven extension surfaces
- Start with payments and receiving money settings as the first plugin area

### Experience-Oriented

- Prioritize surfaces that directly improve contributor and host experience
- Treat architecture only as a means to unlock useful product flexibility

## Related Notes

- [Current Focus](./Current-Focus.md)
- [Architecture and Constraints](./Architecture-and-Constraints.md)
