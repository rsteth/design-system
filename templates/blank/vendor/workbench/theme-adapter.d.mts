/** Apply the requested theme using the app's own semantics. Throw/reject if unsupported. */
export type ApplyWorkbenchTheme = (theme: string) => void | Promise<void>;
/** Only a successfully completed callback is acknowledged to the parent workbench. */
export function installThemeAdapter(applyTheme: ApplyWorkbenchTheme, options?: {themes?: string[]}): () => void;
