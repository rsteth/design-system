import {useEffect, useState, useSyncExternalStore} from 'react';
import {createAppearanceController} from '../appearance/index.mjs';
export {appearancePalettes} from '../appearance/index.mjs';
/** Pass stable app keys. Each app owns its document and calls this once. */
export function useAppearance(options) {
  const [controller] = useState(() => createAppearanceController(options));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => controller.connect(), [controller]);
  useEffect(() => { options.onThemeChange?.(state.theme); }, [options.onThemeChange, state.theme]);
  return {...state,
    chooseTheme: next => controller.chooseTheme(next),
    toggleTheme: () => controller.toggleTheme(),
    choosePalette: next => controller.choosePalette(next),
    useDeviceTheme: () => controller.useDeviceTheme(),
  };
}
