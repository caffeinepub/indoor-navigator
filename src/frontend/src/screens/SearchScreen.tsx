import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUserData } from "@/contexts/UserDataContext";
import { FLOOR_DATA } from "@/data/floorData";
import type { HighlightedLocation, MarkerType } from "@/types/map";
import {
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

const categories = [
  { icon: "🚻", label: "Restrooms" },
  { icon: "🚪", label: "Exits" },
  { icon: "🍽️", label: "Cafeteria" },
  { icon: "🛗", label: "Elevators" },
  { icon: "🅿️", label: "Parking" },
  { icon: "ℹ️", label: "Info Desk" },
  { icon: "☕", label: "Café" },
  { icon: "🏥", label: "First Aid" },
];

const MARKER_EMOJI: Record<MarkerType, string> = {
  classroom: "📚",
  lab: "🔬",
  office: "💼",
  restroom: "🚻",
  elevator: "🛗",
  stairs: "🪜",
  exit: "🚪",
  fireExtinguisher: "🧯",
  firstAid: "🩺",
};

interface Props {
  onSelectLocation: (loc: HighlightedLocation) => void;
  onNavigateToMap: () => void;
}

export default function SearchScreen({
  onSelectLocation,
  onNavigateToMap,
}: Props) {
  const [query, setQuery] = useState("");
  const { favorites, addFavorite, removeFavorite, isFavorite } = useUserData();

  const trimmed = query.trim().toLowerCase();

  const searchResults =
    trimmed.length > 0
      ? FLOOR_DATA.flatMap((floor) =>
          floor.markers
            .filter((m) => m.label.toLowerCase().includes(trimmed))
            .map((m) => ({ floor, marker: m })),
        )
      : [];

  const hasQuery = trimmed.length > 0;

  const toggleFav = (
    floor: { id: number; label: string },
    marker: {
      id: number;
      label: string;
      type: MarkerType;
      x: number;
      y: number;
    },
  ) => {
    const id = `floor-${floor.id}-marker-${marker.id}`;
    if (isFavorite(id)) {
      removeFavorite(id);
    } else {
      addFavorite({
        id,
        name: marker.label,
        floor: floor.label,
        floorId: floor.id,
        type: marker.type,
        markerId: marker.id,
        x: marker.x,
        y: marker.y,
      });
    }
  };

  return (
    <section data-ocid="search.section" className="animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-1">
          Discover
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Search Places
        </h1>
      </div>

      {/* Search Bar */}
      <div className="px-5 mb-5">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            data-ocid="search.search_input"
            type="search"
            placeholder="Search classrooms, labs, offices…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10 h-12 rounded-2xl bg-card border-border text-sm font-body shadow-card focus-visible:ring-primary"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center"
            >
              <X size={12} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 mb-5">
        <h2 className="font-display text-base font-bold text-foreground mb-3">
          Browse Categories
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.label}
              data-ocid="search.category.button"
              className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-secondary transition-all active:scale-95 shadow-xs"
            >
              <span className="text-2xl leading-none">{cat.icon}</span>
              <span className="text-[10px] font-semibold font-body text-foreground text-center leading-tight">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Favorites Section (when no query) */}
      {!hasQuery && favorites.length > 0 && (
        <div className="px-5 mb-5">
          <h2 className="font-display text-base font-bold text-foreground mb-3">
            Saved Places
          </h2>
          <Card className="border-0 shadow-card">
            <CardContent className="p-0">
              {favorites.map((fav, i) => (
                <div key={fav.id} data-ocid={`search.favorite.item.${i + 1}`}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">
                      {MARKER_EMOJI[fav.type as MarkerType]}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectLocation({
                          floorId: fav.floorId,
                          markerId: fav.markerId,
                          label: fav.name,
                          x: fav.x,
                          y: fav.y,
                        });
                        onNavigateToMap();
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="font-semibold text-sm text-foreground font-body truncate">
                        {fav.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        {fav.floor}
                      </p>
                    </button>
                    <button
                      type="button"
                      data-ocid={`search.favorite.delete_button.${i + 1}`}
                      onClick={() => removeFavorite(fav.id)}
                      className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors flex-shrink-0"
                      aria-label="Remove from favorites"
                    >
                      <X size={14} className="text-destructive" />
                    </button>
                  </div>
                  {i < favorites.length - 1 && (
                    <div className="h-px bg-border mx-4" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Results or Recent Searches */}
      <div className="px-5 mb-6">
        {hasQuery ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-bold text-foreground">
                Results
              </h2>
              {searchResults.length > 0 && (
                <span className="text-xs text-muted-foreground font-body">
                  {searchResults.length} found
                </span>
              )}
            </div>

            {searchResults.length === 0 ? (
              <div
                data-ocid="search.results.empty_state"
                className="flex flex-col items-center gap-3 py-10 text-center"
              >
                <span className="text-4xl">🔍</span>
                <p className="text-sm font-semibold font-body text-foreground">
                  No locations found
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Try searching for a classroom, lab, or office
                </p>
              </div>
            ) : (
              <Card className="border-0 shadow-card">
                <CardContent className="p-0">
                  {searchResults.map(({ floor, marker }, i) => (
                    <div
                      key={`${floor.id}-${marker.id}`}
                      data-ocid={`search.result.item.${i + 1}`}
                    >
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">
                          {MARKER_EMOJI[marker.type]}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectLocation({
                              floorId: floor.id,
                              markerId: marker.id,
                              label: marker.label,
                              x: marker.x,
                              y: marker.y,
                            });
                            onNavigateToMap();
                          }}
                          className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                        >
                          <p className="font-semibold text-sm text-foreground font-body truncate">
                            {marker.label}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <MapPin
                              size={10}
                              className="text-muted-foreground flex-shrink-0"
                            />
                            <span className="text-xs text-muted-foreground font-body">
                              {floor.label}
                            </span>
                          </div>
                        </button>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            data-ocid={`search.result.toggle_favorite.${i + 1}`}
                            onClick={() => toggleFav(floor, marker)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                            aria-label={
                              isFavorite(
                                `floor-${floor.id}-marker-${marker.id}`,
                              )
                                ? "Remove from favorites"
                                : "Add to favorites"
                            }
                          >
                            <Heart
                              size={15}
                              className={
                                isFavorite(
                                  `floor-${floor.id}-marker-${marker.id}`,
                                )
                                  ? "text-red-500 fill-red-500"
                                  : "text-muted-foreground"
                              }
                            />
                          </button>
                          <div className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold font-body px-2 py-0.5 rounded-full">
                            <Navigation size={9} />
                            <span>Go</span>
                          </div>
                          <ChevronRight
                            size={15}
                            className="text-muted-foreground"
                          />
                        </div>
                      </div>
                      {i < searchResults.length - 1 && (
                        <div className="h-px bg-border mx-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-bold text-foreground">
                Recent Searches
              </h2>
            </div>
            <Card className="border-0 shadow-card">
              <CardContent className="p-0">
                {[
                  { query: "Food Court", type: "Place", floor: "Ground Floor" },
                  { query: "Restrooms", type: "Facility", floor: "All Floors" },
                  { query: "Gate B12", type: "Gate", floor: "Level 2" },
                  { query: "ATM Machine", type: "Service", floor: "Level 1" },
                ].map((item, i) => (
                  <div key={item.query} data-ocid={`search.item.${i + 1}`}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <Clock size={15} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground font-body">
                          {item.query}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin
                            size={10}
                            className="text-muted-foreground flex-shrink-0"
                          />
                          <span className="text-xs text-muted-foreground font-body">
                            {item.floor}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 ml-1 font-semibold"
                          >
                            {item.type}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight
                        size={15}
                        className="text-muted-foreground flex-shrink-0"
                      />
                    </button>
                    {i < 3 && <div className="h-px bg-border mx-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </section>
  );
}
