import type { TabId } from "@/App";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserData } from "@/contexts/UserDataContext";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  Accessibility,
  Bell,
  Bookmark,
  ChevronRight,
  Clock,
  HelpCircle,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  Star,
  Sun,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  onNavigate: (tab: TabId) => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ProfileScreen({ onNavigate }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const isLoggedIn = !!identity && !identity.getPrincipal().isAnonymous();
  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}…${principal.slice(-4)}`
    : "";

  const { favorites, history, removeFavorite, clearHistory } = useUserData();
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <section data-ocid="profile.section" className="animate-fade-in">
      {/* Offline Banner */}
      {offline && (
        <div className="mx-5 mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold font-body rounded-xl px-3 py-2">
          <WifiOff size={13} />
          You're offline — cached map data available
        </div>
      )}

      {/* Header */}
      <div
        className="px-5 pt-12 pb-8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.50 0.14 182 / 0.08) 0%, oklch(0.85 0.13 75 / 0.05) 100%)",
        }}
      >
        <div
          className="absolute -right-12 -top-12 w-40 h-40 rounded-full opacity-10"
          style={{ background: "oklch(0.50 0.14 182)" }}
        />

        {isLoggedIn ? (
          <div className="flex items-center gap-4 relative">
            <Avatar className="w-16 h-16 border-2 border-primary/20 shadow-card">
              <AvatarFallback className="bg-primary text-primary-foreground font-display text-xl font-bold">
                {shortPrincipal.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="font-display text-xl font-bold text-foreground">
                Navigator User
              </h1>
              <p className="text-xs text-muted-foreground font-body font-mono">
                {shortPrincipal}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-primary" />
                  <span className="text-xs font-semibold font-body text-foreground">
                    {history.length} trips
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-accent-foreground" />
                  <span className="text-xs font-semibold font-body text-foreground">
                    {favorites.length} saved
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center text-center py-4 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-3xl">👤</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Welcome!
              </h1>
              <p className="text-sm text-muted-foreground font-body mt-1">
                Sign in to save favorites & history
              </p>
            </div>
            <Button
              data-ocid="profile.login.button"
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="flex items-center gap-2"
            >
              <LogIn size={16} />
              {isLoggingIn ? "Connecting…" : "Sign In with Internet Identity"}
            </Button>
          </div>
        )}
      </div>

      {/* Stats Row */}
      {isLoggedIn && (
        <div className="px-5 mb-5">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-0 divide-x divide-border">
                {[
                  { value: String(history.length), label: "Trips" },
                  { value: String(favorites.length), label: "Saved" },
                  { value: "3", label: "Floors" },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col items-center py-1">
                    <span className="font-display text-xl font-bold text-foreground">
                      {value}
                    </span>
                    <span className="text-xs text-muted-foreground font-body">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings List */}
      <div className="px-5 mb-4">
        <h2 className="font-display text-base font-bold text-foreground mb-3">
          Settings
        </h2>
        <Card className="border-0 shadow-card">
          <CardContent className="p-0">
            {/* Appearance */}
            <div data-ocid="profile.settings.item.1">
              <div className="w-full flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  {isDark ? (
                    <Moon size={17} className="text-primary" />
                  ) : (
                    <Sun size={17} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground font-body">
                    Appearance
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    {isDark ? "Dark mode" : "Light mode"}
                  </p>
                </div>
                <Switch
                  data-ocid="profile.theme.switch"
                  checked={isDark}
                  onCheckedChange={toggleTheme}
                  aria-label="Toggle dark mode"
                />
              </div>
              <Separator className="mx-4" />
            </div>

            {/* Saved Places */}
            <div data-ocid="profile.settings.item.2">
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Bookmark size={17} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground font-body">
                        My Saved Places
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        {favorites.length} saved locations
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {favorites.length > 0 && (
                        <Badge className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary border-0 font-bold">
                          {favorites.length}
                        </Badge>
                      )}
                      <ChevronRight
                        size={16}
                        className="text-muted-foreground"
                      />
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="max-h-[70vh] rounded-t-2xl"
                  data-ocid="profile.favorites.sheet"
                >
                  <SheetHeader className="pb-3">
                    <SheetTitle>My Saved Places</SheetTitle>
                  </SheetHeader>
                  {favorites.length === 0 ? (
                    <div
                      data-ocid="profile.favorites.empty_state"
                      className="flex flex-col items-center gap-3 py-10 text-center"
                    >
                      <span className="text-4xl">📍</span>
                      <p className="text-sm font-semibold font-body text-foreground">
                        No saved places yet
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        Heart a location on the map to save it here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 overflow-y-auto max-h-[50vh]">
                      {favorites.map((fav, i) => (
                        <div
                          key={fav.id}
                          data-ocid={`profile.favorite.item.${i + 1}`}
                          className="flex items-center gap-3 py-2.5 px-1"
                        >
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <MapPin size={16} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground font-body truncate">
                              {fav.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-body">
                              {fav.floor}
                            </p>
                          </div>
                          <button
                            type="button"
                            data-ocid={`profile.favorite.delete_button.${i + 1}`}
                            onClick={() => removeFavorite(fav.id)}
                            className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors flex-shrink-0"
                            aria-label="Remove favorite"
                          >
                            <X size={14} className="text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </SheetContent>
              </Sheet>
              <Separator className="mx-4" />
            </div>

            {/* Navigation History */}
            <div data-ocid="profile.settings.item.3">
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Clock size={17} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground font-body">
                        Navigation History
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        {history.length} trips
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {history.length > 0 && (
                        <Badge className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary border-0 font-bold">
                          {history.length}
                        </Badge>
                      )}
                      <ChevronRight
                        size={16}
                        className="text-muted-foreground"
                      />
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="max-h-[70vh] rounded-t-2xl"
                  data-ocid="profile.history.sheet"
                >
                  <SheetHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <SheetTitle>Navigation History</SheetTitle>
                      {history.length > 0 && (
                        <button
                          type="button"
                          data-ocid="profile.history.clear_button"
                          onClick={clearHistory}
                          className="flex items-center gap-1.5 text-xs text-destructive font-semibold font-body"
                        >
                          <Trash2 size={12} /> Clear all
                        </button>
                      )}
                    </div>
                  </SheetHeader>
                  {history.length === 0 ? (
                    <div
                      data-ocid="profile.history.empty_state"
                      className="flex flex-col items-center gap-3 py-10 text-center"
                    >
                      <span className="text-4xl">🗺️</span>
                      <p className="text-sm font-semibold font-body text-foreground">
                        No navigation history
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        Start navigating to see your trips here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 overflow-y-auto max-h-[50vh]">
                      {history.map((entry, i) => (
                        <div
                          key={entry.id}
                          data-ocid={`profile.history.item.${i + 1}`}
                          className="flex items-center gap-3 py-2.5 px-1"
                        >
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <MapPin size={16} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground font-body truncate">
                              {entry.destination}
                            </p>
                            <p className="text-xs text-muted-foreground font-body">
                              {entry.floor} · {entry.distance}
                            </p>
                          </div>
                          <span className="text-[11px] text-muted-foreground font-body flex-shrink-0">
                            {timeAgo(entry.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </SheetContent>
              </Sheet>
              <Separator className="mx-4" />
            </div>

            {/* Accessibility */}
            <div data-ocid="profile.settings.item.4">
              <button
                type="button"
                onClick={() => onNavigate("accessibility")}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Accessibility size={17} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground font-body">
                    Accessibility
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    Font size, contrast, motion
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
              {isLoggedIn && <Separator className="mx-4" />}
            </div>

            {/* Admin Dashboard - only when logged in */}
            {isLoggedIn && (
              <div data-ocid="profile.settings.item.5">
                <button
                  type="button"
                  onClick={() => onNavigate("admin")}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <LayoutDashboard size={17} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground font-body">
                      Admin Dashboard
                    </p>
                    <p className="text-xs text-muted-foreground font-body">
                      Manage building maps
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <div className="px-5 mb-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-0">
            <button
              type="button"
              data-ocid="profile.notifications.button"
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <Bell size={17} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground font-body">
                  Notifications
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Alerts & reminders
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
            <Separator className="mx-4" />
            <button
              type="button"
              data-ocid="profile.help.button"
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <HelpCircle size={17} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground font-body">
                  Help & Support
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  FAQs, contact us
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
            <Separator className="mx-4" />
            <button
              type="button"
              data-ocid="profile.about.button"
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <Info size={17} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground font-body">
                  About
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Version 2.4.1
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Sign Out */}
      {isLoggedIn && (
        <div className="px-5 mb-6">
          <button
            type="button"
            data-ocid="profile.sign_out.button"
            onClick={clear}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors text-destructive font-semibold text-sm font-body"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="px-5 pb-4 text-center">
        <p className="text-[11px] text-muted-foreground font-body">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </section>
  );
}
