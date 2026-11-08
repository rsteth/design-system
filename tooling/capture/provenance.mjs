import {createHash} from 'node:crypto';
import {readFile,readdir,realpath,lstat} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const SOURCE_ROOTS = ['src','capture','workbench','vendor/design-system','public'];
const SOURCE_FILES = ['package.json','package-lock.json','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json','index.html'];
export async function sourceProvenance(root, manifest) {
  const base = await realpath(root), fileHashes = {};
  async function hash(path) {
    const full = resolve(base,path);
    if (!full.startsWith(base + sep)) throw new Error('Source path escaped checkout');
    const info = await lstat(full);
    if (info.isSymbolicLink()) throw new Error(`Capture source must not be a symlink: ${path}`);
    const actual = await realpath(full);
    if (!actual.startsWith(base + sep)) throw new Error('Source realpath escaped checkout');
    if (info.isDirectory()) {
      for (const entry of (await readdir(full)).sort()) {
        if (entry.startsWith('.') || entry === 'node_modules') continue;
        await hash(`${path}/${entry}`);
      }
    } else if (info.isFile()) fileHashes[path.split(sep).join('/')] = sha256(await readFile(full));
  }
  for (const path of [...SOURCE_ROOTS,...SOURCE_FILES]) {
    try { await hash(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  for (const path of manifest.sourceFiles) {
    if (!fileHashes[path]) throw new Error(`Declared scene source was not hashed: ${path}`);
  }
  const git = args => execFileSync('git',['-C',base,...args],{encoding:'utf8'}).trim();
  if (await realpath(git(['rev-parse','--show-toplevel'])) !== base) throw new Error('App path must be its Git checkout root');
  const revision = git(['rev-parse','HEAD']), branch = git(['branch','--show-current']);
  const dirty = Boolean(git(['status','--porcelain','--untracked-files=normal']));
  if (!/^[a-f0-9]{40,64}$/.test(revision)) throw new Error('Cannot identify app source revision');
  const ordered = Object.fromEntries(Object.entries(fileHashes).sort(([a],[b])=>a.localeCompare(b)));
  return {revision,branch,dirty,treeSha256:sha256(JSON.stringify(ordered)),files:ordered,scope:'App src, capture, workbench, vendored design system, public assets and build manifests; secrets, personal data and dependency installations excluded.'};
}
export function assertWithin(root, path) {
  const relation = relative(resolve(root),resolve(path));
  if (!relation || relation === '..' || relation.startsWith('..'+sep) || relation.startsWith(sep)) throw new Error('Capture output must be inside the local review directory');
  return path;
}
