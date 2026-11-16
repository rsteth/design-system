# Workbench agent entry point

This is a portable, one-way blueprint from `rsteth/design-system`. Read `README.md` and `DESIGN.md` before adapting it. Parent repository instructions still apply, and they win wherever they differ from these files. These files are hash-locked; do not edit them to match the project.

- “Put the blueprint in repo Y”: verify the target checkout and existing work, use the central `tooling/blueprint.mjs` for a new workbench directory, then adapt in a reviewed change. For a workbench that is already installed, use `--upgrade`, which keeps the files the app adapted. Never overwrite an existing workbench or root AGENTS/README by hand.
- “Grab screens for X”: find X's app-owned screen fixtures or approved capture scenes. A component recipe is not a complete application screen. Capture deterministic sample data, not account data; retain provenance and state what was not captured.
- Application source is authoritative. Keep fixtures and capture scenes near the application code. Do not create a competing UI copy or automatically edit the app from this shell.
- Installing the workbench preserves the app; it does not freeze it. Do not turn “leave the app unchanged during setup” into a standing rule against improving copy, layout or scale. Product changes follow the project's own instructions.
- Record a scale, not a list of literals. If the app's values do not form one, say so in the inventory instead of naming each value. Treat token advice as advice.
- Prefer the project's stated direction and voice over a token table when deciding how something should look or read. If none is written down, propose one and ask before relying on it. The direction's source is the `direction` block in `design/collection.json`; the root `DESIGN.md` says the same thing in prose and the two must agree. Mark text you wrote with `"status": "draft"` until the owner has reviewed it.
- Keep static apps static. Do not add React, a backend, a live configuration store or runtime remote dependency merely for the workbench.
- Leave `vendor/workbench/` unchanged. Upgrade it only with the central `tooling/blueprint.mjs --upgrade`, as one reviewed change that also passes the app's own checks.
- Keep the initial collection list empty until genuine app manifests/fixtures exist. Do not copy the central Robin or reference library into a new project.
- Check the target repository's build, lint, tests and design checks. Verify actual fixture rendering and report missing servers, unavailable tools and unrun checks honestly.
- Do not publish, deploy, replace approved site imagery or install scheduled synchronization as a side effect of setup/capture.
