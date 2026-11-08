import type {AppearanceOptions, AppearanceState, Theme, Palette} from '../appearance/index.mjs';
export {appearancePalettes} from '../appearance/index.mjs';
export function useAppearance(options: AppearanceOptions & {onThemeChange?: (theme: Theme) => void}): AppearanceState & {
  chooseTheme(theme: Theme): void; toggleTheme(): void; choosePalette(palette: Palette): void; useDeviceTheme(): void;
};
