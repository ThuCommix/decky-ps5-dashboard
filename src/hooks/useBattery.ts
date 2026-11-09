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
 * Reads the console's battery level. SteamOS exposes it through the Steam client's System API, and the
 * field names differ between the Deck/PS5 runtime (`GetBatteryDetail` → `nBatteryPercentage`) and the
 * type definitions (`RegisterForBatteryStateChanges` → `flLevel`/`eACState`), so each reader tolerates
 * both. `System` is cast to `any` because the typed surface doesn't declare `GetBatteryDetail`.
 */
export function useBattery(): Battery {
  const [hasBattery, setHasBattery] = useState(true);
  const [level, setLevel] = useState<number | null>(null);
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    const system: any = window.SteamClient?.System;
    if (!system) return;

    const read = (detail: any) => {
      if (!detail) return;
      if (detail.bHasBattery === false) setHasBattery(false);
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
      if (typeof pct === "number" && Number.isFinite(pct)) setLevel(Math.round(clamp(pct)));
      // EBatteryState.Charging = 2, EACState.Connected/ConnectedSlow = 2/3.
      setCharging(detail.bCharging === true || detail.eBatteryState === 2 || detail.eACState === 2 || detail.eACState === 3);
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
