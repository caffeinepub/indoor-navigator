import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { createContext, useContext, useEffect, useState } from "react";

export interface LocationFavorite {
  id: string;
  name: string;
  floor: string;
  floorId: number;
  type: string;
  markerId: number;
  x: number;
  y: number;
}

export interface NavHistory {
  id: string;
  destination: string;
  floor: string;
  floorId: number;
  timestamp: number;
  distance: string;
}

interface UserDataContextValue {
  favorites: LocationFavorite[];
  history: NavHistory[];
  addFavorite: (loc: LocationFavorite) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addHistory: (entry: NavHistory) => void;
  clearHistory: () => void;
}

const UserDataContext = createContext<UserDataContextValue>({
  favorites: [],
  history: [],
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
  addHistory: () => {},
  clearHistory: () => {},
});

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "guest";
  const storageKey = `indoor-nav-data-${principal}`;

  const [favorites, setFavorites] = useState<LocationFavorite[]>([]);
  const [history, setHistory] = useState<NavHistory[]>([]);

  // Load from localStorage when principal changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setFavorites(parsed.favorites ?? []);
        setHistory(parsed.history ?? []);
      } else {
        setFavorites([]);
        setHistory([]);
      }
    } catch {
      setFavorites([]);
      setHistory([]);
    }
  }, [storageKey]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ favorites, history }));
  }, [favorites, history, storageKey]);

  const addFavorite = (loc: LocationFavorite) => {
    setFavorites((prev) =>
      prev.find((f) => f.id === loc.id) ? prev : [loc, ...prev],
    );
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  const addHistory = (entry: NavHistory) => {
    setHistory((prev) => [entry, ...prev].slice(0, 50));
  };

  const clearHistory = () => setHistory([]);

  return (
    <UserDataContext.Provider
      value={{
        favorites,
        history,
        addFavorite,
        removeFavorite,
        isFavorite,
        addHistory,
        clearHistory,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  return useContext(UserDataContext);
}
