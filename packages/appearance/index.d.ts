export type Theme = 'light' | 'dark';
export type Palette = 'standard' | 'red-green' | 'blue-yellow' | 'high-contrast';
export interface AppearanceState { theme: Theme; palette: Palette; explicitTheme: boolean }
export interface AppearanceOptions {
  themeKey: string; paletteKey: string;
  root?: Pick<HTMLElement, 'dataset'>;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  mediaQuery?: Pick<MediaQueryList, 'matches' | 'addEventListener' | 'removeEventListener'>;
}
export interface AppearanceController {
  getSnapshot(): AppearanceState;
  subscribe(listener: () => void): () => void;
  connect(): () => void;
  chooseTheme(theme: Theme): void;
  toggleTheme(): void;
  choosePalette(palette: Palette): void;
  useDeviceTheme(): void;
}
export const appearancePalettes: readonly (readonly [Palette, string])[];
export function createAppearanceController(options: AppearanceOptions): AppearanceController;
