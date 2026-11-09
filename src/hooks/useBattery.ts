import { useEffect, useState } from "react";

/** A normalized battery reading. `level` stays null until the first reading arrives. */
export interface Battery {
  /** False once the client reports the console has no battery (the icon is then hidden). */
  hasBattery: boolean;
  /** 0–100, or null before the first reading. */
  level: number | null;
  /** True while on AC power / charging. */
  charging: boolean;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Module-level cache of the latest reading. The battery indicator lives in a keyed subtree
 * that React remounts on every tab switch, so seeding the initial state from here keeps the
 * displayed level stable across remounts instead of flashing the "unknown" full bar until
 * the initial fetch resolves.
 */
let lastReading: Battery | null = null;

/**
 * Reads the console's battery level. SteamOS exposes it through the Steam client's System API, and the
 * field names differ between the Deck/PS5 runtime (`GetBatteryDetail` → `nBatteryPercentage`) and the
 * type definitions (`RegisterForBatteryStateChanges` → `flLevel`/`eACState`), so each reader tolerates
 * both. `System` is cast to `any` because the typed surface doesn't declare `GetBatteryDetail`.
 */
export function useBattery(): Battery {
  // Seed from the module-level cache so a remount (e.g. tab switch) starts with the last
  // known reading rather than "unknown".
  const [hasBattery, setHasBattery] = useState(lastReading?.hasBattery ?? true);
  const [level, setLevel] = useState<number | null>(lastReading?.level ?? null);
  const [charging, setCharging] = useState(lastReading?.charging ?? false);

  useEffect(() => {
    const system: any = window.SteamClient?.System;
    if (!system) return;

    const read = (detail: any) => {
      if (!detail) return;
      // The runtime reports the level as `nBatteryPercentage` (0–100) while the typed
      // `BatteryState` carries `flLevel` as a 0–1 fraction, which must be scaled up
      // before rounding or a ~1.0 fraction rounds down to "0%".
      const fl = detail.flLevel;
      const pct =
        typeof detail.nBatteryPercentage === "number"
          ? detail.nBatteryPercentage
          : typeof fl === "number"
            ? fl <= 1
              ? fl * 100
              : fl
            : undefined;
      const level = typeof pct === "number" && Number.isFinite(pct) ? Math.round(clamp(pct)) : null;
      // EBatteryState.Charging = 2, EACState.Connected/ConnectedSlow = 2/3.
      const charging =
        detail.bCharging === true || detail.eBatteryState === 2 || detail.eACState === 2 || detail.eACState === 3;
      const hasBattery = detail.bHasBattery !== false;
      // Cache the reading at module scope (keeping the last known level if this
      // detail lacks one) so a remount can seed its initial state from it.
      lastReading = { hasBattery, level: level ?? lastReading?.level ?? null, charging };
      if (level !== null) setLevel(level);
      setHasBattery(hasBattery);
      setCharging(charging);
    };

    // Initial reading.
    try {
      system.GetBatteryDetail?.().then?.(read);
    } catch {
      /* older client without GetBatteryDetail */
    }

    // Live updates on battery changes.
    let unregister: (() => void) | undefined;
    try {
      const handle = system.RegisterForBatteryStateChanges?.((detail: any) => read(detail));
      if (typeof handle?.unregister === "function") unregister = () => handle.unregister();
      else if (typeof handle === "function") unregister = handle;
    } catch {
      /* ignore */
    }

    return () => unregister?.();
  }, []);

  return { hasBattery, level, charging };
}

/**
 * SteamOS' "Show Battery Percentage" toggle (Settings → Power). The client API has no getter for it,
 * but the UI's settings store holds it as a subscribable value, so we read `m_BatteryPreferences`
 * directly. Defaults to off so the number stays hidden when the store isn't reachable.
 */
export function useShowBatteryPercentage(): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const store: any = window.settingsStore;
    if (!store) return;

    let unregister: (() => void) | undefined;
    const apply = (prefs: any) => {
      if (prefs && typeof prefs.bShowBatteryPercentage === "boolean") setShow(prefs.bShowBatteryPercentage);
    };

    try {
      apply(store.m_BatteryPreferences?.Value ?? store.GetBatteryPreferences?.());
    } catch {
      /* older UI without battery preferences */
    }

    try {
      const sub = store.m_BatteryPreferences?.Subscribe?.(apply);
      if (typeof sub?.Unregister === "function") unregister = () => sub.Unregister();
    } catch {
      /* ignore */
    }

    return () => unregister?.();
  }, []);

  return show;
}
