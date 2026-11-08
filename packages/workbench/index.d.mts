export const VERSION: '0.4.0';
export type WorkbenchSection = 'foundations' | 'components' | 'patterns' | 'screens' | 'checks' | 'sources';
export function skinName(value?: string): string;
export const SECTIONS: WorkbenchSection[];
export interface WorkbenchToken { type: string; value: string | number; }
export interface WorkbenchTokenDocument {
  schemaVersion: 1;
  namespace: string;
  modes: Array<{id: string; selector: string; tokens: Record<string, WorkbenchToken>}>;
  aliases?: Record<string, string>;
}
export interface CollectionFixture {
  id: string;
  title: string;
  section: 'components' | 'patterns' | 'screens';
  url: string;
  description?: string;
  states?: string[];
}
export interface WorkbenchCollection {
  schemaVersion: 1;
  id: string;
  title: string;
  kind: 'app' | 'original' | 'reference';
  renderer: 'dom' | 'react';
  summary: string;
  tokens: string;
  study?: string;
  studyData?: ReferenceStudy;
  inventory?: string;
  inventoryData?: Inventory;
  themes: string[];
  source: {repository: string; revision: string | null; path: string; publicVersion?: string; withheldRevisions?: string[]};
  provenance: {
    status: 'author-owned' | 'independent-analysis' | 'adapted';
    sources: Array<string | {title?: string; url: string}>;
  };
  license: {spdx: string; note: string};
  fixtures: CollectionFixture[];
  tokensData?: WorkbenchTokenDocument;
  manifestURL?: string;
  publicRelease?: {status?: string};
}
export interface WorkbenchOptions { searchCollections?: boolean; onCollectionChange?: (id: string) => void; collections?: WorkbenchCollection[]; title?: string; skin?: string; initialCollection?: string; initialSection?: WorkbenchSection; }
export interface WorkbenchHandle { setSkin(skin: string): void; destroy(): void; setCollections(collections: WorkbenchCollection[]): void; }
export function safeURL(value: string, base?: string | URL): URL;
export function fixtureURL(value: string, options?: {theme?: string; base?: string | URL}): string;
export function tokenRows(document: WorkbenchTokenDocument | undefined, mode: string): Array<WorkbenchToken & {name: string; mode: string}>;
export function loadCollections(registryURL: string, options?: {
  base?: string | URL;
  fetcher?: (url: string) => Promise<{ok: boolean; status: number; json(): Promise<unknown>}>;
}): Promise<WorkbenchCollection[]>;
export function mountWorkbench(container: Element, options?: WorkbenchOptions): WorkbenchHandle;

export interface Inventory {
 schemaVersion: 1;
 application: string;
 reviewedRevision: string | null;
 withheldRevisions?: string[];
 items: Array<{id: string; title: string; kind: 'component'|'pattern'|'screen'|'domain'|'external'; source: string[]; fixtures: string[]; states: string[]; coverage: 'covered'|'partial'|'excluded'|'blocked'; notes: string}>;
 checks: Array<{id: string; label: string; command: string; status: 'passed'|'failed'|'not-run'; scope: string; evidence?: string}>;
}

export interface ReferenceStudy {
  schemaVersion: 1;
  id: string;
  title: string;
  classification?: string;
  sourceName?: string;
  titleProvenance?: Record<string, unknown>;
  source?: {repository?: string; revision?: string; path?: string; sha256?: string; url?: string};
  analysis?: Record<string, unknown>;
  sections?: Array<{heading: string; level?: number; text: string; line?: number}>;
  tokens?: Array<{path: string; sourcePath?: string; value?: string | number; type?: string; status?: string; evidence?: {line?: number; sourcePath?: string}}>;
  homepage?: {status?: string; verification?: {status: string; url?: string; checkedAt?: string; notes?: string | string[]}; candidates?: Array<{url: string; evidence?: {line?: number; text?: string}}>};
  completeness?: {presentFields?: string[]; missingFields?: string[]; tokenRoles?: string};
  provenance?: Record<string, unknown>;
  limitations?: string[];
}
export function validateStudy(study: unknown): string[];
