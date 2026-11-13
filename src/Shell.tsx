import { useBattery, useShowBatteryPercentage } from "./hooks/useBattery";
import { useSteamClockFormat } from "./hooks/useSteamClockFormat";
import { Focusable, GamepadButton, GamepadEvent, Navigation } from "@decky/ui";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { IoLibrary } from "react-icons/io5";
import {
  MdApps,
  MdChat,
  MdDownload,
  MdElectricBolt,
  MdFavorite,
  MdGroup,
  MdLocalOffer,
  MdMail,
  MdPerson,
  MdPhotoLibrary,
  MdPowerSettingsNew,
  MdSearch,
  MdSettings,
  MdShoppingBag,
} from "react-icons/md";

import { Card, FOCUSED_CLASS, IconButton, useFocusReveal } from "./components";
import { LibraryTab } from "./Library";
import { t } from "./i18n";
import { HomeTab } from "./Ps5Home";
import { ROUTES, openStore, persona } from "./steam";
import { PS5_CSS } from "./styles";
import { useSettings } from "./hooks/useSettings";

/** "games" and "media" are the two PS5 tabs; "library" is the Game Library screen opened from the home row. */
export type TabId = "games" | "media" | "library";

const TABS: { id: TabId; label: string }[] = [
  { id: "games", label: t.tabGames },
  { id: "media", label: t.tabMedia },
];

interface CardDef {
  icon: ReactNode;
  title: string;
  description: string;
  go: () => void;
}

const steamWeb = (url: string) => () => Navigation.NavigateToSteamWeb(url);
const PROFILE_URL = "https://steamcommunity.com/my/";

function mediaCards(openApps: () => void): CardDef[] {
  return [
    { icon: <MdPhotoLibrary />, title: t.media, description: t.mediaDesc, go: () => Navigation.Navigate(ROUTES.media) },
    { icon: <MdApps />, title: t.viewApps, description: t.appsDesc, go: openApps },
    { icon: <MdShoppingBag />, title: t.storeTitle, description: t.storeDesc, go: () => openStore() },
    { icon: <MdLocalOffer />, title: t.specialsTitle, description: t.specialsDesc, go: () => openStore("specials") },
    { icon: <MdFavorite />, title: t.wishlistTitle, description: t.wishlistDesc, go: () => openStore("wishlist") },
    { icon: <MdChat />, title: t.gameBaseTitle, description: t.gameBaseDesc, go: () => Navigation.NavigateToChat() },
    { icon: <MdMail />, title: t.invitesTitle, description: t.invitesDesc, go: () => Navigation.NavigateToInvites() },
    { icon: <MdGroup />, title: t.communityTitle, description: t.communityDesc, go: steamWeb("https://steamcommunity.com/") },
    { icon: <MdDownload />, title: t.downloads, description: t.downloadsDesc, go: () => Navigation.Navigate(ROUTES.downloads) },
  ];
}

function CardsTab({ cards }: { cards: CardDef[] }) {
  return (
    <Focusable className="psd-page psd-cards" flow-children="grid">
      {cards.map((c, i) => (
        <Card key={c.title} icon={c.icon} title={c.title} description={c.description} accent={i === 0} preferredFocus={i === 0} onActivate={c.go} />
      ))}
    </Focusable>
  );
}

/**
 * The hour cycle to display in: SteamOS' "24-hour clock" toggle wins over the locale default, so we
 * use the Steam Client's settings via a hook instead of guessing from the locale.
 */
function formatTime(now: Date, is24Hour: boolean): string {
  try {
    const options: Intl.DateTimeFormatOptions = is24Hour
      ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
      : { hour: "numeric", minute: "2-digit", hour12: true };
    return new Intl.DateTimeFormat(undefined, options).format(now);
  } catch {
    return now.toTimeString().slice(0, 5);
  }
}

/** Live clock: ticks every second but only re-renders when the displayed minute actually changes. */
function useClock(is24Hour: boolean): string {
  const [time, setTime] = useState(() => formatTime(new Date(), is24Hour));
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = formatTime(new Date(), is24Hour);
      setTime((prev) => (prev === next ? prev : next));
    }, 1000);
    return () => window.clearInterval(id);
  }, [is24Hour]);
  return time;
}

function Clock() {
  const is24Hour = useSteamClockFormat();
  return <span className="psd-clock">{useClock(is24Hour)}</span>;
}

/**
 * The PS5's monochrome battery: a vertical outlined cell with a proportional fill, a bolt while on
 * AC, and the percentage beside it — but only while SteamOS' "Show Battery Percentage" is on.
 * Low charge tints the cell yellow (11–20%) or red (0–10%). A plain (non-focusable) indicator,
 * like the clock — the console has no battery menu.
 */
function BatteryIndicator() {
  const { hasBattery, level, charging } = useBattery();
  const showPercentage = useShowBatteryPercentage();
  if (!hasBattery) return null;
  const unknown = level === null;
  const pct = level ?? 0;
  const tint = unknown ? "" : level <= 10 ? " psd-battery-critical" : level <= 20 ? " psd-battery-low" : "";
  return (
    <span className={`psd-battery${tint}${unknown ? " psd-battery-unknown" : ""}`} title={t.battery}>
      <span className="psd-battery-icon">
        <span className="psd-battery-fill" style={{ height: unknown ? "100%" : `${pct}%` }} />
      </span>
      {charging && <MdElectricBolt className="psd-battery-bolt" />}
      {showPercentage && <span className="psd-battery-pct">{unknown ? "…" : `${pct}%`}</span>}
    </span>
  );
}

/** The time plus search, settings, power, the profile picture and the battery: the PS5's top right corner. */
function TopIcons() {
  const me = useMemo(persona, []);
  return (
    <Focusable className="psd-topicons" flow-children="row">
      <IconButton icon={<MdSearch />} label={t.search} onActivate={() => Navigation.Navigate(ROUTES.search)} />
      <IconButton icon={<MdSettings />} label={t.settings} onActivate={() => Navigation.Navigate(ROUTES.settings)} />
      <IconButton icon={<MdPowerSettingsNew />} label={t.powerTitle} onActivate={() => Navigation.OpenPowerMenu()} />
      <IconButton
        icon={me.avatar ? <img className="psd-avatar" src={me.avatar} /> : <MdPerson />}
        label={me.name || t.profile}
        onActivate={steamWeb(PROFILE_URL)}
      />
      <BatteryIndicator />
      <Clock />
    </Focusable>
  );
}

function TabBar({ tab }: { tab: TabId }) {
  if (tab === "library") {
    return (
      <div className="psd-tabbar">
        <span className="psd-tab psd-tab-active">
          <IoLibrary /> {t.library}
        </span>
      </div>
    );
  }
  return (
    <div className="psd-tabbar">
      <span className="psd-bumper">L1</span>
      {TABS.map((x) => (
        <div key={x.id} className={`psd-tab ${x.id === tab ? "psd-tab-active" : ""}`}>
          {x.label}
        </div>
      ))}
      <span className="psd-bumper">R1</span>
    </div>
  );
}

/** The PS5 home: Games / Media on top (L1 / R1 to switch), icons on the right and one page per tab. */
export function Ps5Shell({ initialTab = "games" }: { initialTab?: TabId }) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [libraryView, setLibraryView] = useState("installed");
  const root = useRef<HTMLDivElement>(null);
  const contentNav = useRef<any>(null);
  const firstRender = useRef(true);
  // Re-renders this screen when a setting changes, so what it renders from settings stays current.
  const settings = useSettings();
  /** Same gate as theme.ts: the setting that keeps Steam's top bar away and gives us `--psd-topbar`. */
  const hideTopBar = settings.ps5Home && settings.hideTopStatus;
  useFocusReveal(root);

  // Moving to another tab — or flipping the top-bar setting, which remounts the content node — unmounts
  // the focused tile, so hand focus to the new page's first item.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        contentNav.current?.TakeFocus?.();
      } catch (e) {
        console.error("[ps5-dashboard] TakeFocus failed", e);
      }
      if (!root.current?.querySelector(`.psd-page .${FOCUSED_CLASS}, .psd-scroller .${FOCUSED_CLASS}`)) {
        (root.current?.querySelector(
          ".psd-scroller .psd-tile, .psd-page .psd-tile, .psd-page .psd-card, .psd-page .psd-chip",
        ) as HTMLElement | null)?.focus();
      }
    }, 30);
    return () => window.clearTimeout(timer);
  }, [tab, hideTopBar]);

  const goTab = (next: TabId, view = "installed") => {
    // Every way into the Game Library comes through here, so this one check covers them all.
    if (next === "library" && settings.openSteamLibrary) {
      Navigation.Navigate(ROUTES.library);
      return;
    }
    setLibraryView(view);
    setTab(next);
  };
  const cards = useMemo(() => mediaCards(() => goTab("library", "apps")), []);

  const step = (dir: 1 | -1) => {
    const i = Math.max(0, TABS.findIndex((x) => x.id === tab));
    setTab(TABS[(i + dir + TABS.length) % TABS.length].id);
  };

  const onButtonDown = (e: GamepadEvent) => {
    const button = e.detail?.button;
    if (button === GamepadButton.BUMPER_LEFT) step(-1);
    else if (button === GamepadButton.BUMPER_RIGHT) step(1);
  };

  // Steam's top bar (search field, clock, WiFi, battery, avatar) slides in when the D-pad goes up past
  // our top row, over the PS5 screens; everything in it is in our own bar already. Steam hands this
  // handler to its own focus node, which keeps the callback it was created with — so it is *attached
  // only while the setting is on* and `.psd-content` is keyed on that too (below): flipping the setting
  // rebuilds the node, which is what makes the off state really let the press through.
  const handleDirection = (e: GamepadEvent) => {
    if (e.detail.button !== GamepadButton.DIR_UP) return;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={`psd-root psd-tab-${tab}`} ref={root}>
      <style>{PS5_CSS}</style>
      <TabBar tab={tab} />
      <Focusable
        key={`${tab}:${hideTopBar ? "no-top-bar" : "top-bar"}`}
        className="psd-content"
        flow-children="column"
        onGamepadDirection={hideTopBar ? handleDirection : undefined}
        {...({ navRef: contentNav } as any)}
        onButtonDown={onButtonDown}
        onCancelButton={tab === "games" ? undefined : () => setTab("games")}
        onCancelActionDescription={tab === "games" ? undefined : t.tabGames}
        actionDescriptionMap={{
          [GamepadButton.BUMPER_LEFT]: t.prevTab,
          [GamepadButton.BUMPER_RIGHT]: t.nextTab,
        }}
      >
        <TopIcons />
        {tab === "games" && <HomeTab goTab={goTab} />}
        {tab === "media" && <CardsTab cards={cards} />}
        {tab === "library" && <LibraryTab initialView={libraryView} />}
      </Focusable>
    </div>
  );
}