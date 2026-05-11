# Wiki Home

This is the shared working wiki for product thinking, technical notes, and implementation history in this repo.

Use it as the starting point. Each dock below focuses on one kind of information and links back to the others where useful.

## Docks

### [Current Focus](./docks/Current-Focus.md)

What we are actively exploring right now, why it matters, and what should be discussed next.

### [Architecture and Constraints](./docks/Architecture-and-Constraints.md)

Notes on how the Open Collective frontend works, where the boundaries are, and what depends on backend or operational support.

### [Ideas and Questions](./docks/Ideas-and-Questions.md)

Open product ideas, design directions, unresolved questions, and possible paths worth revisiting.

### [Implementation Log](./docks/Implementation-Log.md)

Short dated notes about changes made in the repo, branches used, and where deeper implementation details live.

### [Transformation](./transformation/README.md)

Longer-term redesign and re-architecture work. Tracks pain points observed in the wild and the structural patterns they point to — the material that will eventually shape a fork of Open Collective.

## Current Snapshot

- Primary active topic: Swish payments, Swish reimbursements, and plugin architecture for Open Collective
- Current exploration branch: `swish-implementation`
- Deeper branch-specific note currently lives on `swish-implementation` in `docs/plugin-architecture.md`
- Collaboration preference: explain, discuss, and compare options before writing code

## Update Rhythm

Update this wiki when:

- a new topic becomes important
- a decision is made
- a branch introduces a meaningful implementation
- a technical constraint materially changes the available product options
