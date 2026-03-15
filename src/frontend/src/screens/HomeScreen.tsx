import type { TabId } from "@/App";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useUserData } from "@/contexts/UserDataContext";
import {
  Bell,
  ChevronRight,
  Clock,
  Compass,
  Heart,
  Map as MapIcon,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";

interface HomeScreenProps {
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

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { favorites, history } = useUserData();
  const recentHistory = history.slice(0, 3);
  const recentFavorites = favorites.slice(0, 4);

  return (
    <section data-ocid="home.section" className="animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-1">
            Indoor Navigator
          </p>
          <h1 className="font-display text-[28px] font-bold leading-tight text-foreground">
            Welcome back,
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.50 0.14 182), oklch(0.60 0.14 155))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Navigator!
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-body">
            Find your way indoors with ease
          </p>
        </div>
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mt-1 hover:bg-secondary transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Hero Card */}
      <div className="px-5 mb-5">
        <Card
          className="overflow-hidden border-0 shadow-card"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.50 0.14 182) 0%, oklch(0.42 0.13 200) 100%)",
          }}
        >
          <CardContent className="p-0">
            <div className="relative p-5 pb-6">
              <svg
                aria-hidden="true"
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20"
                width="110"
                height="110"
                viewBox="0 0 110 110"
                fill="none"
              >
                <circle
                  cx="55"
                  cy="55"
                  r="52"
                  stroke="white"
                  strokeWidth="1.5"
                />
                <circle cx="55" cy="55" r="38" stroke="white" strokeWidth="1" />
                <circle cx="55" cy="55" r="4" fill="white" />
                <polygon points="55,10 59,52 55,46 51,52" fill="white" />
                <polygon
                  points="55,100 51,58 55,64 59,58"
                  fill="white"
                  opacity="0.5"
                />
                <polygon
                  points="10,55 52,51 46,55 52,59"
                  fill="white"
                  opacity="0.5"
                />
                <polygon points="100,55 58,59 64,55 58,51" fill="white" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                  <line
                    key={deg}
                    x1="55"
                    y1="18"
                    x2="55"
                    y2="23"
                    stroke="white"
                    strokeWidth="1.5"
                    transform={`rotate(${deg} 55 55)`}
                    opacity="0.6"
                  />
                ))}
              </svg>
              <Badge className="bg-white/20 text-white border-white/30 text-[10px] font-semibold mb-3 backdrop-blur-sm">
                🟢 Navigation Active
              </Badge>
              <h2 className="font-display text-xl font-bold text-white mb-1">
                Westfield Mall
              </h2>
              <p className="text-white/75 text-sm font-body mb-4">
                3 floors · 240 stores · You are on Level 1
              </p>
              <button
                type="button"
                data-ocid="home.explore_map.button"
                onClick={() => onNavigate("map")}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-semibold rounded-full px-4 py-2 transition-colors backdrop-blur-sm"
              >
                <Compass size={15} />
                Open Map
                <ChevronRight size={14} />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mb-5">
        <h2 className="font-display text-base font-bold text-foreground mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card
            data-ocid="home.explore_map.card"
            className="border-0 shadow-card cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
            onClick={() => onNavigate("map")}
          >
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <MapIcon size={20} className="text-primary" />
              </div>
              <h3 className="font-display text-sm font-bold text-foreground">
                Explore Map
              </h3>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                View full floor plan
              </p>
            </CardContent>
          </Card>
          <Card
            data-ocid="home.search_places.card"
            className="border-0 shadow-card cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
            onClick={() => onNavigate("search")}
          >
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center mb-3">
                <Search size={20} className="text-accent-foreground" />
              </div>
              <h3 className="font-display text-sm font-bold text-foreground">
                Find Places
              </h3>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                Search stores & services
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Favorites Section */}
      {recentFavorites.length > 0 && (
        <div className="px-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-bold text-foreground">
              Saved Places
            </h2>
            <button
              type="button"
              data-ocid="home.favorites.button"
              onClick={() => onNavigate("profile")}
              className="text-xs text-primary font-semibold font-body"
            >
              See all
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {recentFavorites.map((fav, i) => (
              <button
                key={fav.id}
                type="button"
                data-ocid={`home.favorite.item.${i + 1}`}
                onClick={() => onNavigate("search")}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border hover:bg-muted/50 transition-colors text-left shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Heart size={14} className="text-primary fill-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs text-foreground font-body truncate">
                    {fav.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-body truncate">
                    {fav.floor}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Trips */}
      {recentHistory.length > 0 ? (
        <div className="px-5 mb-6">
          <div
            className="flex items-center justify-between mb-3"
            data-ocid="home.recent_locations.button"
          >
            <h2 className="font-display text-base font-bold text-foreground">
              Recent Trips
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className="text-xs text-primary font-semibold font-body"
            >
              See all
            </button>
          </div>
          <Card className="border-0 shadow-card">
            <CardContent className="p-0">
              {recentHistory.map((entry, i) => (
                <div key={entry.id}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Navigation size={16} className="text-primary" />
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
                  {i < recentHistory.length - 1 && (
                    <div className="h-px bg-border mx-4" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-bold text-foreground">
              Recent Locations
            </h2>
          </div>
          <Card className="border-0 shadow-card">
            <CardContent className="p-0">
              {[
                { name: "Gate B12", floor: "Level 2", time: "2 min ago" },
                { name: "Food Court", floor: "Ground Floor", time: "1 hr ago" },
                { name: "Info Desk", floor: "Level 1", time: "Yesterday" },
              ].map((loc, i) => (
                <div key={loc.name}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground font-body truncate">
                        {loc.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        {loc.floor}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-body flex-shrink-0">
                      {loc.time}
                    </span>
                  </div>
                  {i < 2 && <div className="h-px bg-border mx-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Offline indicator */}
      <div className="px-5 mb-4 flex items-center gap-2 text-xs text-muted-foreground font-body">
        <MapPin size={11} />
        Map data available offline
      </div>

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
