import type { TabId } from "@/App";
import { Home, Map as MapIcon, Search, User } from "lucide-react";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "search", label: "Search", icon: Search },
  { id: "profile", label: "Profile", icon: User },
];

const ocidMap: Record<string, string> = {
  home: "nav.home.link",
  map: "nav.map.link",
  search: "nav.search.link",
  profile: "nav.profile.link",
  admin: "nav.admin.link",
  accessibility: "nav.accessibility.link",
};

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-card shadow-nav z-50"
      style={{ borderTop: "1px solid oklch(var(--border))" }}
    >
      <div className="flex items-stretch">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              type="button"
              key={id}
              data-ocid={ocidMap[id]}
              onClick={() => onTabChange(id)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px]
                transition-all duration-200 relative
                ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute top-1.5 w-8 h-1 rounded-full bg-primary opacity-80" />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="transition-transform duration-200"
                style={{ transform: isActive ? "scale(1.1)" : "scale(1)" }}
              />
              <span
                className={`text-[10px] font-body font-semibold tracking-wide ${isActive ? "font-bold" : ""}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
