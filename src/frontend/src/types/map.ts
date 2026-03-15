export type MarkerType =
  | "classroom"
  | "lab"
  | "restroom"
  | "office"
  | "exit"
  | "elevator"
  | "stairs"
  | "fireExtinguisher"
  | "firstAid";

export interface Marker {
  id: number;
  type: MarkerType;
  label: string;
  x: number;
  y: number;
}

export interface FloorData {
  id: number;
  label: string;
  abbr: string;
  markers: Marker[];
}

export interface HighlightedLocation {
  floorId: number;
  markerId: number;
  label: string;
  x: number;
  y: number;
}
