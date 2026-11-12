# Blank workbench

Copy this entire folder to a new directory. Serve it using any static HTTP server, for example `python3 -m http.server 4100`, then open http://localhost:4100. No build, framework, dependency install, source-app access, or parent repository is needed. Opening through file:// is not supported by browser module/fetch security.

The initial collection list is deliberately empty. Add a version-1 manifest and token document, then add its relative URL to `collections.json`: `{"schemaVersion":1,"collections":["./collections/my-system/collection.json"]}`. A manifest follows the central collection contract and may use DOM or React. Fixtures are HTTP(S) URLs served by your own app; the workbench does not bundle or rewrite that app.

`engine-lock.json` pins the reusable engine version. `vendor/workbench/` is an unmodified distribution of engine 0.4.0, not a starter-specific fork. To upgrade, replace the complete vendor directory, including skins, together from a reviewed release and update the lock. Put your authored collection content outside vendor. No existing app collections are included.

The engine displays source revision, provenance status, license, and reference sources. Fill these honestly before sharing. A public URL does not grant copying or redistribution rights.

The default workbench skin is shipped with the engine; the stethem skin is optional. The starter still has no installed collections, including no Workbench self collection. Add a different scoped skin later without copying the portfolio catalog.

For agent-guided setup in a project, use the portable blueprint in `blueprints/workbench/` at the design-system repository root and `node tooling/blueprint.mjs /absolute/project/path`. It layers ownership, capture and integration guidance over this empty starter.

The supplied original workbench and starter code/documentation are [MIT licensed](LICENSE). See [license scope](LICENSING.md); host applications, added collections and third-party assets retain their own terms.
