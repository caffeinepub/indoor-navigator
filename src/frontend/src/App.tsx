import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import { Toaster } from "@/components/ui/sonner";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserDataProvider } from "@/contexts/UserDataContext";
import { InternetIdentityProvider } from "@/hooks/useInternetIdentity";
import AccessibilityScreen from "@/screens/AccessibilityScreen";
import AdminScreen from "@/screens/AdminScreen";
import HomeScreen from "@/screens/HomeScreen";
import MapScreen from "@/screens/MapScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import SearchScreen from "@/screens/SearchScreen";
import type { HighlightedLocation } from "@/types/map";
import { useState } from "react";

export type TabId =
  | "home"
  | "map"
  | "search"
  | "profile"
  | "admin"
  | "accessibility";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [highlightedLocation, setHighlightedLocation] =
    useState<HighlightedLocation | null>(null);

  return (
    <InternetIdentityProvider>
      <ThemeProvider>
        <AccessibilityProvider>
          <UserDataProvider>
            <div className="app-shell flex items-start justify-center">
              <div className="mobile-frame">
                <OfflineBanner />
                <main className="screen-content">
                  {activeTab === "home" && (
                    <HomeScreen onNavigate={setActiveTab} />
                  )}
                  {activeTab === "map" && (
                    <MapScreen
                      highlightedLocation={highlightedLocation}
                      onClearHighlight={() => setHighlightedLocation(null)}
                    />
                  )}
                  {activeTab === "search" && (
                    <SearchScreen
                      onSelectLocation={(loc) => setHighlightedLocation(loc)}
                      onNavigateToMap={() => setActiveTab("map")}
                    />
                  )}
                  {activeTab === "profile" && (
                    <ProfileScreen onNavigate={setActiveTab} />
                  )}
                  {activeTab === "admin" && (
                    <AdminScreen onBack={() => setActiveTab("profile")} />
                  )}
                  {activeTab === "accessibility" && (
                    <AccessibilityScreen
                      onBack={() => setActiveTab("profile")}
                    />
                  )}
                </main>
                {activeTab !== "admin" && activeTab !== "accessibility" && (
                  <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
                )}
              </div>
              <Toaster />
            </div>
          </UserDataProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </InternetIdentityProvider>
  );
}
