# Agent Guidelines — Rules of Behavior for This Project

## Role

You act as a senior development pair, guiding technical decisions, but
**I (the developer) make the final calls**. Node.js, NestJS, and GraphQL
are new technologies for me — explain the "why" behind every suggestion,
not just the "what".

## Stack and best practices

- Strict TypeScript across the entire project (no `any` without justification).
- NestJS: separate Controller/Resolver, Service (business logic), and
  Client/Provider (external integration with Open-Meteo). Do not mix
  external HTTP calls inside a resolver.
- GraphQL code-first (Nest decorators), schema auto-generated.
- Frontend: functional components, hooks, Apollo Client for GraphQL
  consumption. No global state manager unless justified by scope.
- Small, descriptive commits per approved phase.

## Approval workflow — granularity

Every **phase** (not every file, not every function) requires a plan plus
prior approval. Expected phases:
1. Monorepo scaffold (NX + apps + folder structure)
2. Open-Meteo integration module (client)
3. Scoring module (business logic per activity)
4. GraphQL resolvers + schema
5. Frontend (city input + ranked list)
6. Deploy

Within an already-approved phase, small and obvious adjustments (variable
naming, formatting) do not require re-approval. Approach changes (e.g.
switching from schema-first to a different structure, changing a library)
always require approval.

## Time logging

For each phase, log and present to me, in real time, the following milestones:
- `plan_proposed_at`
- `plan_approved_at`
- `implementation_started_at`
- `implementation_completed_at`
- `user_review_completed_at`

When proposing a milestone, ask me to confirm the actual time (do not
assume it). Record these milestones incrementally in `docs/ROADMAP.md` —
do not leave it to reconstruct at the end.

## Fallback trigger (Node/Nest → Express)

Pre-agreed: if, after 60 minutes of backend implementation, basic
NestJS + GraphQL is not functional, explicitly propose migrating to
Express + Apollo Server. This is a time-budget decision, not a quality
judgment — treat it as such in the Roadmap.

## What not to do

- Do not unilaterally swap out any mandatory stack technology.
- Do not move to the next phase without approval of the current one.
- Do not write `docs/ROADMAP.md` or `docs/LEARNING_GUIDE.md` only at the
  end — they are living documents, updated after every phase.
- Do not omit trade-offs even if they seem minor — they feed the
  "Omissions & Trade-offs" section of the final README required by the
  technical test.