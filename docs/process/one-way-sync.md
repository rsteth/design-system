# One-way synchronization and optional static publishing

## Decision now

Application source → app fixtures/tokens/metadata → explicit central snapshot/workbench/capture. The workbench does not write back to applications. Shared engine upgrades are independent, explicit vendor updates. This is not two-way synchronization. stethem remains static HTML/CSS/JavaScript, built and served as static files.

Today, use on-demand local commands. `tooling/sync-registry.mjs` refreshes named app snapshots without removing other apps. `tooling/blueprint.mjs` installs a reviewed empty blueprint in a new project. Existing app vendors and published site images are unchanged unless separately requested. There is no enabled GitHub Action, schedule, webhook, deployment or new access grant in this plan.

## Possible next step: manual GitHub Action

A future `workflow_dispatch` job could accept an allowlisted app id and full input commit SHA, check out the explicitly pinned design-system and source app repositories, run each required validation, generate the relevant snapshot/capture and upload an artifact for review. If cross-repository access is needed, use the narrowest approved read-only access. Do not create credentials or expand persistent access as a side effect.

Start with artifact-only output and `contents: read`. Treat app ids as fixed map entries, not shell text or arbitrary repository/URL inputs. Pin action versions and dependencies, use fresh contexts/sample data for captures, avoid signed-in profiles and personal data, and retain source hashes and check results. Fail if dependencies, server readiness or expected fixtures are missing.

If later authorized, a separate write-enabled job can create a reviewable branch/PR containing only expected generated files. Scope write access to the destination repository and guard concurrent runs per app. Never push directly to the default branch or silently modify the source apps. Deploying the reviewed static site is a separate explicitly approved workflow/merge step. A cadence can be added only after the intended frequency, data publication and authorization are agreed.

## Why not install that workflow now?

The user suggested Actions or on-demand rebuilds as an option, not an instruction to publish or create ongoing cross-repository access. The source projects contain local unpublished changes, so a hosted job cannot reproduce them from a remote commit yet. Local on-demand generation is usable now and preserves the static architecture. No server-side editor, runtime synchronization or default-branch change is needed.

## Later expansion

A future design editor would need a separate proposal covering ownership, conflict resolution, versioned change proposals, permissions and rollback. Do not infer authorization for that expansion from the portable blueprint or current one-way viewer.
