# Workbench agent entry point

This is a portable, one-way blueprint from `rsteth/design-system`. Read `README.md` and `DESIGN.md` before adapting it. Parent repository instructions still apply.

- “Put the blueprint in repo Y”: verify the target checkout and existing work, use the central `tooling/blueprint.mjs` only for a new workbench directory, then adapt in a reviewed change. Never overwrite an existing workbench or root AGENTS/README.
- “Grab screens for X”: find X's app-owned screen fixtures or approved capture scenes. A component recipe is not a complete application screen. Capture deterministic sample data, not account data; retain provenance and state what was not captured.
- Application source is authoritative. Keep fixtures and capture scenes near the application code. Do not create a competing UI copy or automatically edit the app from this shell.
- Keep static apps static. Do not add React, a backend, a live configuration store or runtime remote dependency merely for the workbench.
- Leave `vendor/workbench/` unchanged. Upgrade the complete reviewed engine separately and preserve the source pin.
- Keep the initial collection list empty until genuine app manifests/fixtures exist. Do not copy the central Robin or reference library into a new project.
- Check the target repository's build, lint, tests and design checks. Verify actual fixture rendering and report missing servers, unavailable tools and unrun checks honestly.
- Do not publish, deploy, replace approved site imagery or install scheduled synchronization as a side effect of setup/capture.
