import { useSyncExternalStore } from "react";

import { currentSettings, Settings, subscribeSettings } from "../settings";

/**
 * The settings in effect, re-rendering the caller whenever the quick access panel changes one.
 *
 * Reading `currentSettings()` inside an event handler is live on its own, but anything a screen decides
 * *while rendering* — which handlers it hands to Steam's focus nodes, what it passes to children — is
 * frozen until the next render. Without this, toggling a setting in the panel takes effect only after
 * the screen is left and entered again.
 */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribeSettings, currentSettings);
}
