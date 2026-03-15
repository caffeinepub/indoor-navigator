import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserData } from "@/contexts/UserDataContext";
import { FLOOR_DATA } from "@/data/floorData";
import type { HighlightedLocation, Marker, MarkerType } from "@/types/map";
import {
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  Briefcase,
  CornerDownLeft,
  CornerDownRight,
  DoorOpen,
  Droplets,
  Flame,
  FlaskConical,
  Footprints,
  Heart,
  HeartPulse,
  Layers,
  Locate,
  MapPin,
  Navigation,
  ScanLine,
  ShieldAlert,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQRScanner } from "../qr-code/useQRScanner";

import { findShortestPath } from "@/navigation/dijkstra";
import { BUILDING_GRAPH, getMarkerNodeId } from "@/navigation/graph";
import { generateInstructions } from "@/navigation/instructions";
import type { NavStep } from "@/navigation/instructions";
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const MAP_WIDTH = 380;
const MAP_HEIGHT = 340;

const MARKER_CONFIG: Record<
  MarkerType,
  {
    color: string;
    bg: string;
    border: string;
    Icon: React.FC<{ size?: number; className?: string }>;
  }
> = {
  classroom: {
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-300",
    Icon: BookOpen,
  },
  lab: {
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-300",
    Icon: FlaskConical,
  },
  restroom: {
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-300",
    Icon: Droplets,
  },
  office: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-300",
    Icon: Briefcase,
  },
  exit: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-300",
    Icon: DoorOpen,
  },
  elevator: {
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-300",
    Icon: ArrowUpDown,
  },
  stairs: {
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-300",
    Icon: Footprints,
  },
  fireExtinguisher: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-400",
    Icon: Flame,
  },
  firstAid: {
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-400",
    Icon: HeartPulse,
  },
};

const LEGEND_ITEMS: { type: MarkerType; label: string }[] = [
  { type: "classroom", label: "Classroom" },
  { type: "lab", label: "Lab" },
  { type: "restroom", label: "Restroom" },
  { type: "office", label: "Office" },
  { type: "exit", label: "Emergency Exit" },
  { type: "elevator", label: "Elevator" },
  { type: "stairs", label: "Stairs" },
];

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

// SVG floor plans per floor index
function GroundFloorSVG() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: "absolute", inset: 0 }}
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="10"
        y="10"
        width="360"
        height="320"
        rx="8"
        fill="white"
        fillOpacity="0.45"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="2"
        strokeOpacity="0.3"
      />
      <rect
        x="10"
        y="95"
        width="360"
        height="28"
        fill="oklch(0.50 0.14 182)"
        fillOpacity="0.07"
      />
      <rect
        x="10"
        y="235"
        width="360"
        height="22"
        fill="oklch(0.50 0.14 182)"
        fillOpacity="0.07"
      />
      {/* Room 101 */}
      <rect
        x="18"
        y="18"
        width="100"
        height="72"
        rx="5"
        fill="oklch(0.94 0.05 240)"
        fillOpacity="0.7"
        stroke="oklch(0.50 0.18 240)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="68"
        y="52"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.28 0.10 240)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        ROOM 101
      </text>
      <text
        x="68"
        y="64"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.07 240)"
        fontFamily="sans-serif"
      >
        CLASSROOM
      </text>
      {/* Room 102 */}
      <rect
        x="130"
        y="18"
        width="100"
        height="72"
        rx="5"
        fill="oklch(0.94 0.05 240)"
        fillOpacity="0.7"
        stroke="oklch(0.50 0.18 240)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="180"
        y="52"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.28 0.10 240)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        ROOM 102
      </text>
      <text
        x="180"
        y="64"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.07 240)"
        fontFamily="sans-serif"
      >
        CLASSROOM
      </text>
      {/* Computer Lab */}
      <rect
        x="242"
        y="18"
        width="120"
        height="72"
        rx="5"
        fill="oklch(0.94 0.05 290)"
        fillOpacity="0.7"
        stroke="oklch(0.50 0.18 290)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="302"
        y="52"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.28 0.10 290)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        COMPUTER
      </text>
      <text
        x="302"
        y="64"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.07 290)"
        fontFamily="sans-serif"
      >
        LAB
      </text>
      {/* Science Lab */}
      <rect
        x="18"
        y="130"
        width="130"
        height="100"
        rx="5"
        fill="oklch(0.94 0.05 290)"
        fillOpacity="0.7"
        stroke="oklch(0.50 0.18 290)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="83"
        y="180"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.28 0.10 290)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        SCIENCE
      </text>
      <text
        x="83"
        y="192"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.07 290)"
        fontFamily="sans-serif"
      >
        LAB
      </text>
      {/* Office */}
      <rect
        x="158"
        y="130"
        width="100"
        height="100"
        rx="5"
        fill="oklch(0.96 0.06 75)"
        fillOpacity="0.7"
        stroke="oklch(0.60 0.16 75)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="208"
        y="180"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.30 0.10 75)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        MAIN
      </text>
      <text
        x="208"
        y="192"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.08 75)"
        fontFamily="sans-serif"
      >
        OFFICE
      </text>
      {/* Restroom */}
      <rect
        x="268"
        y="130"
        width="94"
        height="100"
        rx="5"
        fill="oklch(0.94 0.06 182)"
        fillOpacity="0.7"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="315"
        y="180"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.28 0.10 182)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        RESTROOM
      </text>
      {/* Room 201 */}
      <rect
        x="75"
        y="262"
        width="180"
        height="55"
        rx="5"
        fill="oklch(0.94 0.05 240)"
        fillOpacity="0.7"
        stroke="oklch(0.50 0.18 240)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="165"
        y="289"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.28 0.10 240)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        ROOM 201
      </text>
      <text
        x="165"
        y="302"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.07 240)"
        fontFamily="sans-serif"
      >
        CLASSROOM
      </text>
      {/* Emergency Exits */}
      <rect
        x="10"
        y="262"
        width="55"
        height="55"
        rx="5"
        fill="oklch(0.96 0.05 25)"
        fillOpacity="0.7"
        stroke="oklch(0.55 0.22 25)"
        strokeWidth="2"
        strokeOpacity="0.6"
        strokeDasharray="5 3"
      />
      <text
        x="37"
        y="292"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.14 25)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        EXIT A
      </text>
      <rect
        x="265"
        y="262"
        width="97"
        height="55"
        rx="5"
        fill="oklch(0.96 0.05 25)"
        fillOpacity="0.7"
        stroke="oklch(0.55 0.22 25)"
        strokeWidth="2"
        strokeOpacity="0.6"
        strokeDasharray="5 3"
      />
      <text
        x="313"
        y="292"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.14 25)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        EXIT B
      </text>
      {/* Shared: Elevator */}
      <rect
        x="340"
        y="95"
        width="30"
        height="28"
        rx="3"
        fill="oklch(0.93 0.06 215)"
        fillOpacity="0.8"
        stroke="oklch(0.50 0.14 215)"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <text
        x="355"
        y="107"
        textAnchor="middle"
        fontSize="5.5"
        fill="oklch(0.28 0.10 215)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        ELEV
      </text>
      <text
        x="355"
        y="116"
        textAnchor="middle"
        fontSize="4.5"
        fill="oklch(0.40 0.10 215)"
        fontFamily="sans-serif"
      >
        ALL FLOORS
      </text>
      {/* Shared: Staircase A */}
      <rect
        x="10"
        y="123"
        width="38"
        height="50"
        rx="3"
        fill="oklch(0.95 0.06 50)"
        fillOpacity="0.8"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="14"
        y1="135"
        x2="44"
        y2="135"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="14"
        y1="143"
        x2="44"
        y2="143"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="14"
        y1="151"
        x2="44"
        y2="151"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="14"
        y1="159"
        x2="44"
        y2="159"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <text
        x="29"
        y="165"
        textAnchor="middle"
        fontSize="5.5"
        fill="oklch(0.35 0.12 50)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        STAIRS
      </text>
      <text
        x="29"
        y="172"
        textAnchor="middle"
        fontSize="4.5"
        fill="oklch(0.45 0.10 50)"
        fontFamily="sans-serif"
      >
        ALL FLOORS
      </text>
      {/* Shared: Staircase B */}
      <rect
        x="340"
        y="257"
        width="30"
        height="60"
        rx="3"
        fill="oklch(0.95 0.06 50)"
        fillOpacity="0.8"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="343"
        y1="267"
        x2="367"
        y2="267"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="343"
        y1="275"
        x2="367"
        y2="275"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="343"
        y1="283"
        x2="367"
        y2="283"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="343"
        y1="291"
        x2="367"
        y2="291"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <text
        x="355"
        y="298"
        textAnchor="middle"
        fontSize="5.5"
        fill="oklch(0.35 0.12 50)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        STAIRS
      </text>
      <text
        x="355"
        y="305"
        textAnchor="middle"
        fontSize="4.5"
        fill="oklch(0.45 0.10 50)"
        fontFamily="sans-serif"
      >
        ALL FLOORS
      </text>
      {/* Door notches */}
      <line
        x1="68"
        y1="95"
        x2="68"
        y2="123"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <line
        x1="180"
        y1="95"
        x2="180"
        y2="123"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <line
        x1="300"
        y1="95"
        x2="300"
        y2="123"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <line
        x1="83"
        y1="235"
        x2="83"
        y2="255"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <line
        x1="210"
        y1="235"
        x2="210"
        y2="255"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
    </svg>
  );
}

function Floor1SVG() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: "absolute", inset: 0 }}
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="10"
        y="10"
        width="360"
        height="320"
        rx="8"
        fill="white"
        fillOpacity="0.45"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="2"
        strokeOpacity="0.3"
      />
      <rect
        x="10"
        y="95"
        width="360"
        height="28"
        fill="oklch(0.50 0.14 182)"
        fillOpacity="0.07"
      />
      <rect
        x="10"
        y="235"
        width="360"
        height="22"
        fill="oklch(0.50 0.14 182)"
        fillOpacity="0.07"
      />
      {/* Lecture Hall A — large top-left */}
      <rect
        x="18"
        y="18"
        width="155"
        height="72"
        rx="5"
        fill="oklch(0.94 0.05 240)"
        fillOpacity="0.7"
        stroke="oklch(0.50 0.18 240)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="95"
        y="52"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.28 0.10 240)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        LECTURE HALL A
      </text>
      <text
        x="95"
        y="64"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.07 240)"
        fontFamily="sans-serif"
      >
        CLASSROOM
      </text>
      {/* Lecture Hall B — large top-right */}
      <rect
        x="185"
        y="18"
        width="177"
        height="72"
        rx="5"
        fill="oklch(0.94 0.05 240)"
        fillOpacity="0.7"
        stroke="oklch(0.50 0.18 240)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="273"
        y="52"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.28 0.10 240)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        LECTURE HALL B
      </text>
      <text
        x="273"
        y="64"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.07 240)"
        fontFamily="sans-serif"
      >
        CLASSROOM
      </text>
      {/* Staff Room — middle left */}
      <rect
        x="18"
        y="130"
        width="110"
        height="100"
        rx="5"
        fill="oklch(0.96 0.06 75)"
        fillOpacity="0.7"
        stroke="oklch(0.60 0.16 75)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="73"
        y="180"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.30 0.10 75)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        STAFF
      </text>
      <text
        x="73"
        y="192"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.08 75)"
        fontFamily="sans-serif"
      >
        ROOM
      </text>
      {/* Faculty Office — middle */}
      <rect
        x="138"
        y="130"
        width="120"
        height="100"
        rx="5"
        fill="oklch(0.96 0.06 75)"
        fillOpacity="0.7"
        stroke="oklch(0.60 0.16 75)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="198"
        y="180"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.30 0.10 75)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        FACULTY
      </text>
      <text
        x="198"
        y="192"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.08 75)"
        fontFamily="sans-serif"
      >
        OFFICE
      </text>
      {/* Restroom */}
      <rect
        x="268"
        y="130"
        width="94"
        height="100"
        rx="5"
        fill="oklch(0.94 0.06 182)"
        fillOpacity="0.7"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="315"
        y="180"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.28 0.10 182)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        RESTROOM
      </text>
      {/* Bottom open hallway */}
      <rect
        x="75"
        y="262"
        width="180"
        height="55"
        rx="5"
        fill="oklch(0.96 0.05 240)"
        fillOpacity="0.4"
        stroke="oklch(0.50 0.18 240)"
        strokeWidth="1"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <text
        x="165"
        y="292"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.07 240)"
        fontFamily="sans-serif"
      >
        OPEN HALL
      </text>
      {/* Emergency Exits */}
      <rect
        x="10"
        y="262"
        width="55"
        height="55"
        rx="5"
        fill="oklch(0.96 0.05 25)"
        fillOpacity="0.7"
        stroke="oklch(0.55 0.22 25)"
        strokeWidth="2"
        strokeOpacity="0.6"
        strokeDasharray="5 3"
      />
      <text
        x="37"
        y="292"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.14 25)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        EXIT A
      </text>
      <rect
        x="265"
        y="262"
        width="97"
        height="55"
        rx="5"
        fill="oklch(0.96 0.05 25)"
        fillOpacity="0.7"
        stroke="oklch(0.55 0.22 25)"
        strokeWidth="2"
        strokeOpacity="0.6"
        strokeDasharray="5 3"
      />
      <text
        x="313"
        y="292"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.14 25)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        EXIT B
      </text>
      {/* Shared: Elevator */}
      <rect
        x="340"
        y="95"
        width="30"
        height="28"
        rx="3"
        fill="oklch(0.93 0.06 215)"
        fillOpacity="0.8"
        stroke="oklch(0.50 0.14 215)"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <text
        x="355"
        y="107"
        textAnchor="middle"
        fontSize="5.5"
        fill="oklch(0.28 0.10 215)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        ELEV
      </text>
      <text
        x="355"
        y="116"
        textAnchor="middle"
        fontSize="4.5"
        fill="oklch(0.40 0.10 215)"
        fontFamily="sans-serif"
      >
        ALL FLOORS
      </text>
      {/* Shared: Staircase A */}
      <rect
        x="10"
        y="123"
        width="38"
        height="50"
        rx="3"
        fill="oklch(0.95 0.06 50)"
        fillOpacity="0.8"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="14"
        y1="135"
        x2="44"
        y2="135"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="14"
        y1="143"
        x2="44"
        y2="143"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="14"
        y1="151"
        x2="44"
        y2="151"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="14"
        y1="159"
        x2="44"
        y2="159"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <text
        x="29"
        y="165"
        textAnchor="middle"
        fontSize="5.5"
        fill="oklch(0.35 0.12 50)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        STAIRS
      </text>
      <text
        x="29"
        y="172"
        textAnchor="middle"
        fontSize="4.5"
        fill="oklch(0.45 0.10 50)"
        fontFamily="sans-serif"
      >
        ALL FLOORS
      </text>
      {/* Shared: Staircase B */}
      <rect
        x="340"
        y="257"
        width="30"
        height="60"
        rx="3"
        fill="oklch(0.95 0.06 50)"
        fillOpacity="0.8"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="343"
        y1="267"
        x2="367"
        y2="267"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="343"
        y1="275"
        x2="367"
        y2="275"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="343"
        y1="283"
        x2="367"
        y2="283"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="343"
        y1="291"
        x2="367"
        y2="291"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <text
        x="355"
        y="298"
        textAnchor="middle"
        fontSize="5.5"
        fill="oklch(0.35 0.12 50)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        STAIRS
      </text>
      <text
        x="355"
        y="305"
        textAnchor="middle"
        fontSize="4.5"
        fill="oklch(0.45 0.10 50)"
        fontFamily="sans-serif"
      >
        ALL FLOORS
      </text>
      {/* Door notches */}
      <line
        x1="95"
        y1="95"
        x2="95"
        y2="123"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <line
        x1="273"
        y1="95"
        x2="273"
        y2="123"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <line
        x1="198"
        y1="235"
        x2="198"
        y2="255"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
    </svg>
  );
}

function Floor2SVG() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: "absolute", inset: 0 }}
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="10"
        y="10"
        width="360"
        height="320"
        rx="8"
        fill="white"
        fillOpacity="0.45"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="2"
        strokeOpacity="0.3"
      />
      <rect
        x="10"
        y="95"
        width="360"
        height="28"
        fill="oklch(0.50 0.14 182)"
        fillOpacity="0.07"
      />
      <rect
        x="10"
        y="235"
        width="360"
        height="22"
        fill="oklch(0.50 0.14 182)"
        fillOpacity="0.07"
      />
      {/* Library — large central top */}
      <rect
        x="18"
        y="18"
        width="210"
        height="72"
        rx="5"
        fill="oklch(0.94 0.05 290)"
        fillOpacity="0.7"
        stroke="oklch(0.50 0.18 290)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="123"
        y="52"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.28 0.10 290)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        LIBRARY
      </text>
      <text
        x="123"
        y="64"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.07 290)"
        fontFamily="sans-serif"
      >
        READING ROOM
      </text>
      {/* IT Lab */}
      <rect
        x="242"
        y="18"
        width="120"
        height="72"
        rx="5"
        fill="oklch(0.94 0.05 290)"
        fillOpacity="0.7"
        stroke="oklch(0.50 0.18 290)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="302"
        y="52"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.28 0.10 290)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        IT LAB
      </text>
      <text
        x="302"
        y="64"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.07 290)"
        fontFamily="sans-serif"
      >
        COMPUTER
      </text>
      {/* Conference Room A */}
      <rect
        x="18"
        y="130"
        width="110"
        height="100"
        rx="5"
        fill="oklch(0.96 0.06 75)"
        fillOpacity="0.7"
        stroke="oklch(0.60 0.16 75)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="73"
        y="177"
        textAnchor="middle"
        fontSize="7.5"
        fill="oklch(0.30 0.10 75)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        CONFERENCE
      </text>
      <text
        x="73"
        y="188"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.08 75)"
        fontFamily="sans-serif"
      >
        ROOM A
      </text>
      {/* Conference Room B */}
      <rect
        x="138"
        y="130"
        width="120"
        height="100"
        rx="5"
        fill="oklch(0.96 0.06 75)"
        fillOpacity="0.7"
        stroke="oklch(0.60 0.16 75)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="198"
        y="177"
        textAnchor="middle"
        fontSize="7.5"
        fill="oklch(0.30 0.10 75)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        CONFERENCE
      </text>
      <text
        x="198"
        y="188"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.08 75)"
        fontFamily="sans-serif"
      >
        ROOM B
      </text>
      {/* Restroom */}
      <rect
        x="268"
        y="130"
        width="94"
        height="100"
        rx="5"
        fill="oklch(0.94 0.06 182)"
        fillOpacity="0.7"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="315"
        y="180"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.28 0.10 182)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        RESTROOM
      </text>
      {/* Print Room */}
      <rect
        x="75"
        y="262"
        width="180"
        height="55"
        rx="5"
        fill="oklch(0.96 0.06 75)"
        fillOpacity="0.7"
        stroke="oklch(0.60 0.16 75)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text
        x="165"
        y="289"
        textAnchor="middle"
        fontSize="8"
        fill="oklch(0.30 0.10 75)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        PRINT ROOM
      </text>
      <text
        x="165"
        y="302"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.08 75)"
        fontFamily="sans-serif"
      >
        OFFICE
      </text>
      {/* Emergency Exits */}
      <rect
        x="10"
        y="262"
        width="55"
        height="55"
        rx="5"
        fill="oklch(0.96 0.05 25)"
        fillOpacity="0.7"
        stroke="oklch(0.55 0.22 25)"
        strokeWidth="2"
        strokeOpacity="0.6"
        strokeDasharray="5 3"
      />
      <text
        x="37"
        y="292"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.14 25)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        EXIT A
      </text>
      <rect
        x="265"
        y="262"
        width="97"
        height="55"
        rx="5"
        fill="oklch(0.96 0.05 25)"
        fillOpacity="0.7"
        stroke="oklch(0.55 0.22 25)"
        strokeWidth="2"
        strokeOpacity="0.6"
        strokeDasharray="5 3"
      />
      <text
        x="313"
        y="292"
        textAnchor="middle"
        fontSize="7"
        fill="oklch(0.40 0.14 25)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        EXIT B
      </text>
      {/* Shared: Elevator */}
      <rect
        x="340"
        y="95"
        width="30"
        height="28"
        rx="3"
        fill="oklch(0.93 0.06 215)"
        fillOpacity="0.8"
        stroke="oklch(0.50 0.14 215)"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <text
        x="355"
        y="107"
        textAnchor="middle"
        fontSize="5.5"
        fill="oklch(0.28 0.10 215)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        ELEV
      </text>
      <text
        x="355"
        y="116"
        textAnchor="middle"
        fontSize="4.5"
        fill="oklch(0.40 0.10 215)"
        fontFamily="sans-serif"
      >
        ALL FLOORS
      </text>
      {/* Shared: Staircase A */}
      <rect
        x="10"
        y="123"
        width="38"
        height="50"
        rx="3"
        fill="oklch(0.95 0.06 50)"
        fillOpacity="0.8"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="14"
        y1="135"
        x2="44"
        y2="135"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="14"
        y1="143"
        x2="44"
        y2="143"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="14"
        y1="151"
        x2="44"
        y2="151"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="14"
        y1="159"
        x2="44"
        y2="159"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <text
        x="29"
        y="165"
        textAnchor="middle"
        fontSize="5.5"
        fill="oklch(0.35 0.12 50)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        STAIRS
      </text>
      <text
        x="29"
        y="172"
        textAnchor="middle"
        fontSize="4.5"
        fill="oklch(0.45 0.10 50)"
        fontFamily="sans-serif"
      >
        ALL FLOORS
      </text>
      {/* Shared: Staircase B */}
      <rect
        x="340"
        y="257"
        width="30"
        height="60"
        rx="3"
        fill="oklch(0.95 0.06 50)"
        fillOpacity="0.8"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="343"
        y1="267"
        x2="367"
        y2="267"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="343"
        y1="275"
        x2="367"
        y2="275"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="343"
        y1="283"
        x2="367"
        y2="283"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="343"
        y1="291"
        x2="367"
        y2="291"
        stroke="oklch(0.60 0.16 50)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <text
        x="355"
        y="298"
        textAnchor="middle"
        fontSize="5.5"
        fill="oklch(0.35 0.12 50)"
        fontFamily="sans-serif"
        fontWeight="700"
      >
        STAIRS
      </text>
      <text
        x="355"
        y="305"
        textAnchor="middle"
        fontSize="4.5"
        fill="oklch(0.45 0.10 50)"
        fontFamily="sans-serif"
      >
        ALL FLOORS
      </text>
      {/* Door notches */}
      <line
        x1="123"
        y1="95"
        x2="123"
        y2="123"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <line
        x1="302"
        y1="95"
        x2="302"
        y2="123"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <line
        x1="165"
        y1="235"
        x2="165"
        y2="255"
        stroke="oklch(0.50 0.14 182)"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
    </svg>
  );
}

const FLOOR_SVG = [GroundFloorSVG, Floor1SVG, Floor2SVG];

interface MapScreenProps {
  highlightedLocation?: HighlightedLocation | null;
  onClearHighlight?: () => void;
}

export default function MapScreen({
  highlightedLocation = null,
  onClearHighlight,
}: MapScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [activeFloor, setActiveFloor] = useState(0);
  const [navigationActive, setNavigationActive] = useState(false);
  const [navSteps, setNavSteps] = useState<NavStep[]>([]);
  const [startNodeId, setStartNodeId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    x: number;
    y: number;
    floorId: number;
  } | null>(null);
  const [settingLocation, setSettingLocation] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const { addFavorite, removeFavorite, isFavorite } = useUserData();

  // Pan to highlighted location when it changes
  useEffect(() => {
    if (!highlightedLocation) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const containerW = rect.width || 340;
    const containerH = rect.height || 340;
    const targetScale = 1.8;
    const targetTx = containerW / 2 - highlightedLocation.x * targetScale;
    const targetTy = containerH / 2 - highlightedLocation.y * targetScale;
    setActiveFloor(highlightedLocation.floorId);
    setScale(targetScale);
    setTx(targetTx);
    setTy(targetTy);
    setActiveMarker(highlightedLocation.markerId);
    setNavigationActive(false);
    setNavSteps([]);
  }, [highlightedLocation]);

  const speak = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };
  const youAreHere = userLocation ?? { x: 30, y: 290 };

  const routeInfo = (() => {
    if (!navigationActive || !highlightedLocation) return null;
    // Try to use actual graph path distance
    let resolvedStartIdRI = startNodeId;
    if (!resolvedStartIdRI) {
      const originRI = userLocation ?? { x: 30, y: 290 };
      const floorMarkersRI = FLOOR_DATA[activeFloor]?.markers ?? [];
      let nearestMarkerRI = floorMarkersRI[0];
      let nearestDistRI = Number.POSITIVE_INFINITY;
      for (const m of floorMarkersRI) {
        const d = Math.sqrt((m.x - originRI.x) ** 2 + (m.y - originRI.y) ** 2);
        if (d < nearestDistRI) {
          nearestDistRI = d;
          nearestMarkerRI = m;
        }
      }
      resolvedStartIdRI = getMarkerNodeId(
        activeFloor,
        nearestMarkerRI?.id ?? 1,
      );
    }
    const endIdRI = getMarkerNodeId(
      highlightedLocation.floorId,
      highlightedLocation.markerId,
    );
    const resultRI = findShortestPath(
      BUILDING_GRAPH,
      resolvedStartIdRI,
      endIdRI,
    );
    const pixelDist = resultRI
      ? resultRI.totalDistance
      : (() => {
          const dx = Math.abs(highlightedLocation.x - youAreHere.x);
          const dy = Math.abs(highlightedLocation.y - youAreHere.y);
          return dx + dy;
        })();
    const meters = Math.round(pixelDist * 0.1);
    const minutes = Math.max(1, Math.round(meters / 80));
    return { meters, minutes };
  })();

  // Pointer drag state
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Touch pinch state
  const lastPinchDist = useRef<number | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      if (settingLocation) {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const mapX = (e.clientX - rect.left - tx) / scale;
        const mapY = (e.clientY - rect.top - ty) / scale;
        setUserLocation({
          x: Math.round(mapX),
          y: Math.round(mapY),
          floorId: activeFloor,
        });
        setSettingLocation(false);
        toast.success("Location set on map");
        return;
      }
      dragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setActiveMarker(null);
    },
    [settingLocation, tx, ty, scale, activeFloor],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTx((prev) => prev + dx);
    setTy((prev) => prev + dy);
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => {
      const next = clamp(prev * delta, MIN_SCALE, MAX_SCALE);
      const ratio = next / prev;
      setTx((px) => mouseX - ratio * (mouseX - px));
      setTy((py) => mouseY - ratio * (mouseY - py));
      return next;
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current !== null) {
        const ratio = dist / lastPinchDist.current;
        setScale((prev) => clamp(prev * ratio, MIN_SCALE, MAX_SCALE));
      }
      lastPinchDist.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
  }, []);

  const zoomAt = useCallback((factor: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setScale((prev) => {
      const next = clamp(prev * factor, MIN_SCALE, MAX_SCALE);
      const ratio = next / prev;
      setTx((px) => cx - ratio * (cx - px));
      setTy((py) => cy - ratio * (cy - py));
      return next;
    });
  }, []);

  const handleFloorChange = useCallback((floorId: number) => {
    setActiveFloor(floorId);
    setActiveMarker(null);
  }, []);

  const currentFloor = FLOOR_DATA[activeFloor];
  const FloorSVG = FLOOR_SVG[activeFloor];

  // Emergency mode: find nearest exit on current floor
  const emergencyExitInfo = (() => {
    if (!emergencyMode) return null;
    const origin = userLocation ?? { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
    const exits = currentFloor.markers.filter((m) => m.type === "exit");
    if (exits.length === 0) return null;
    let nearest = exits[0];
    let minDist = Number.POSITIVE_INFINITY;
    for (const exit of exits) {
      const dist = Math.abs(exit.x - origin.x) + Math.abs(exit.y - origin.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = exit;
      }
    }
    const meters = Math.round(minDist * 0.9);
    return { exit: nearest, meters, origin };
  })();

  // Compute tooltip screen position for the active marker
  const getTooltipStyle = (marker: Marker): React.CSSProperties => {
    const container = containerRef.current;
    if (!container) return { display: "none" };
    const rect = container.getBoundingClientRect();
    const screenX = rect.left + tx + marker.x * scale;
    const screenY = rect.top + ty + marker.y * scale - 14 * scale;
    return {
      position: "fixed",
      left: screenX,
      top: screenY,
      transform: "translate(-50%, -100%) translateY(-6px)",
      pointerEvents: "none",
      zIndex: 9999,
    };
  };

  const activeMarkerData =
    activeMarker !== null
      ? currentFloor.markers.find((m) => m.id === activeMarker)
      : null;
  const activeCfg = activeMarkerData
    ? MARKER_CONFIG[activeMarkerData.type]
    : null;

  return (
    <section data-ocid="map.section" className="animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-1">
          Navigation
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Floor Map
        </h1>
        <p className="text-sm text-muted-foreground font-body mt-0.5">
          Campus Building · {currentFloor.label}
        </p>
      </div>

      {/* Emergency Mode Banner */}
      <AnimatePresence>
        {emergencyMode && (
          <motion.div
            data-ocid="map.emergency_mode.banner"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="mx-5 mb-3 flex items-center gap-2 bg-red-600 border border-red-700 rounded-2xl px-4 py-2.5"
            style={{ animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" }}
          >
            <span className="text-lg">🚨</span>
            <p className="flex-1 text-xs font-bold text-white font-body tracking-wide">
              EMERGENCY MODE — Follow evacuation route
            </p>
            <ShieldAlert size={16} className="text-red-200 flex-shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Highlight Banner */}
      {highlightedLocation && (
        <div
          data-ocid="map.highlight_banner"
          className="mx-5 mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5"
        >
          <span className="text-lg">📍</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-800 font-body">
              Showing location
            </p>
            <p className="text-xs text-amber-700 font-body truncate">
              {highlightedLocation.label}
            </p>
          </div>
          <button
            type="button"
            data-ocid="map.start_navigation_button"
            disabled={navigationActive}
            onClick={() => {
              setNavigationActive(true);
              let resolvedStartId = startNodeId;
              if (!resolvedStartId) {
                const origin = userLocation ?? { x: 30, y: 290 };
                const floorMarkers = FLOOR_DATA[activeFloor]?.markers ?? [];
                let nearestMarker = floorMarkers[0];
                let nearestDist = Number.POSITIVE_INFINITY;
                for (const m of floorMarkers) {
                  const d = Math.sqrt(
                    (m.x - origin.x) ** 2 + (m.y - origin.y) ** 2,
                  );
                  if (d < nearestDist) {
                    nearestDist = d;
                    nearestMarker = m;
                  }
                }
                resolvedStartId = getMarkerNodeId(
                  activeFloor,
                  nearestMarker?.id ?? 1,
                );
              }
              const endId = getMarkerNodeId(
                highlightedLocation.floorId,
                highlightedLocation.markerId,
              );
              const result = findShortestPath(
                BUILDING_GRAPH,
                resolvedStartId,
                endId,
              );
              const steps = result ? generateInstructions(result.path) : [];
              setNavSteps(steps);
              setCurrentStepIdx(0);
              speak(steps[0]?.text ?? "");
              toast.success(
                `Navigation started to ${highlightedLocation.label}`,
              );
            }}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-xl py-2 px-3 hover:bg-primary/90 transition-colors disabled:opacity-60 flex-shrink-0 shadow-sm"
          >
            <Navigation size={12} />
            {navigationActive ? "Navigating..." : "Start Navigation"}
          </button>
          <button
            type="button"
            data-ocid="map.highlight_clear_button"
            onClick={() => {
              setNavigationActive(false);
              setNavSteps([]);
              window.speechSynthesis?.cancel();
              onClearHighlight?.();
            }}
            aria-label="Clear highlight"
            className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 hover:bg-amber-200 transition-colors"
          >
            <X size={12} className="text-amber-700" />
          </button>
        </div>
      )}

      {/* Setting Location Banner */}
      {settingLocation && (
        <div className="mx-5 mb-2 px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-blue-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-blue-700">
              Tap the map to set your location
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSettingLocation(false)}
            className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
          >
            <X size={10} className="text-blue-600" />
          </button>
        </div>
      )}

      {/* Map Area */}
      <div className="px-5 mb-4">
        <div className="relative">
          <div
            ref={containerRef}
            data-ocid="map.canvas_target"
            className={`map-grid relative rounded-3xl overflow-hidden select-none ${settingLocation ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
            style={{ height: "340px", touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Transformable map layer with floor transition */}
            <div
              ref={mapRef}
              style={{
                position: "absolute",
                transformOrigin: "0 0",
                transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                width: MAP_WIDTH,
                height: MAP_HEIGHT,
                willChange: "transform",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFloor}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: MAP_WIDTH,
                    height: MAP_HEIGHT,
                  }}
                >
                  {/* SVG Floor Plan */}
                  <FloorSVG />

                  {/* Markers */}
                  {currentFloor.markers.map((marker) => {
                    if (
                      !emergencyMode &&
                      (marker.type === "fireExtinguisher" ||
                        marker.type === "firstAid")
                    ) {
                      return null;
                    }
                    const cfg = MARKER_CONFIG[marker.type];
                    const { Icon } = cfg;
                    const isActive = activeMarker === marker.id;
                    const isHighlighted =
                      highlightedLocation !== null &&
                      highlightedLocation.floorId === activeFloor &&
                      highlightedLocation.markerId === marker.id;
                    const isNearestExit =
                      emergencyMode &&
                      emergencyExitInfo?.exit.id === marker.id &&
                      marker.type === "exit";
                    const isFireExtinguisher =
                      emergencyMode && marker.type === "fireExtinguisher";
                    const isFirstAid =
                      emergencyMode && marker.type === "firstAid";
                    return (
                      <div
                        key={marker.id}
                        style={{
                          position: "absolute",
                          left: marker.x,
                          top: marker.y,
                          transform: "translate(-50%, -50%)",
                          zIndex: isActive ? 20 : isNearestExit ? 15 : 10,
                        }}
                      >
                        {/* Pulsing highlight ring */}
                        {isHighlighted && (
                          <span
                            className="absolute inset-0 rounded-full animate-ping"
                            style={{
                              width: "36px",
                              height: "36px",
                              top: "-4px",
                              left: "-4px",
                              backgroundColor: "oklch(0.75 0.18 60)",
                              opacity: 0.6,
                            }}
                          />
                        )}
                        {/* Nearest exit pulsing red ring */}
                        {isNearestExit && (
                          <span
                            className="absolute rounded-full animate-ping"
                            style={{
                              width: "40px",
                              height: "40px",
                              top: "-6px",
                              left: "-6px",
                              backgroundColor: "rgb(239 68 68)",
                              opacity: 0.5,
                            }}
                          />
                        )}
                        {/* Fire extinguisher highlight ring */}
                        {isFireExtinguisher && (
                          <span
                            className="absolute rounded-full"
                            style={{
                              width: "34px",
                              height: "34px",
                              top: "-3px",
                              left: "-3px",
                              border: "2px solid rgb(239 68 68)",
                              borderRadius: "50%",
                              opacity: 0.8,
                            }}
                          />
                        )}
                        {/* First aid highlight ring */}
                        {isFirstAid && (
                          <span
                            className="absolute rounded-full"
                            style={{
                              width: "34px",
                              height: "34px",
                              top: "-3px",
                              left: "-3px",
                              border: "2px solid rgb(34 197 94)",
                              borderRadius: "50%",
                              opacity: 0.8,
                            }}
                          />
                        )}
                        <motion.button
                          type="button"
                          data-ocid={`map.marker.${marker.id}`}
                          aria-label={marker.label}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMarker(isActive ? null : marker.id);
                          }}
                          className={`w-7 h-7 rounded-full border-2 shadow-lg flex items-center justify-center cursor-pointer ${cfg.bg} ${
                            isNearestExit
                              ? "border-red-500 ring-2 ring-red-400 ring-offset-1"
                              : isFireExtinguisher
                                ? "border-red-400 ring-1 ring-red-300"
                                : isFirstAid
                                  ? "border-green-400 ring-1 ring-green-300"
                                  : isHighlighted
                                    ? "border-amber-400 ring-2 ring-amber-300 ring-offset-1"
                                    : cfg.border
                          }`}
                          style={{ pointerEvents: "all" }}
                        >
                          <Icon size={13} className={cfg.color} />
                        </motion.button>
                      </div>
                    );
                  })}
                  {/* Route overlay — graph-based path */}
                  {navigationActive &&
                    navSteps.length > 0 &&
                    (() => {
                      // Reconstruct path from graph for current floor
                      // Use a simpler approach: re-run pathfinding and filter by floor
                      let resolvedStartId2 = startNodeId;
                      if (!resolvedStartId2 && highlightedLocation) {
                        const origin2 = userLocation ?? { x: 30, y: 290 };
                        const floorMarkers2 =
                          FLOOR_DATA[activeFloor]?.markers ?? [];
                        let nearestMarker2 = floorMarkers2[0];
                        let nearestDist2 = Number.POSITIVE_INFINITY;
                        for (const m of floorMarkers2) {
                          const d2 = Math.sqrt(
                            (m.x - origin2.x) ** 2 + (m.y - origin2.y) ** 2,
                          );
                          if (d2 < nearestDist2) {
                            nearestDist2 = d2;
                            nearestMarker2 = m;
                          }
                        }
                        resolvedStartId2 = getMarkerNodeId(
                          activeFloor,
                          nearestMarker2?.id ?? 1,
                        );
                      }
                      const endId2 = highlightedLocation
                        ? getMarkerNodeId(
                            highlightedLocation.floorId,
                            highlightedLocation.markerId,
                          )
                        : null;
                      if (!resolvedStartId2 || !endId2) return null;
                      const result2 = findShortestPath(
                        BUILDING_GRAPH,
                        resolvedStartId2,
                        endId2,
                      );
                      if (!result2) return null;
                      const floorNodes = result2.path.filter(
                        (n) => n.floorId === activeFloor,
                      );
                      if (floorNodes.length < 2) return null;
                      const pts = floorNodes
                        .map((n) => `${n.x},${n.y}`)
                        .join(" ");
                      const startN = floorNodes[0];
                      return (
                        <svg
                          style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            overflow: "visible",
                          }}
                          width={MAP_WIDTH}
                          height={MAP_HEIGHT}
                          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                          aria-label="Route overlay"
                        >
                          <title>Route overlay</title>
                          <polyline
                            data-ocid="map.route_map_marker"
                            points={pts}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            strokeDasharray="6,4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={0.85}
                          />
                          <circle
                            cx={startN.x}
                            cy={startN.y}
                            r={7}
                            fill="#3b82f6"
                            opacity={0.25}
                          />
                          <circle
                            data-ocid="map.you_are_here_marker"
                            cx={startN.x}
                            cy={startN.y}
                            r={4}
                            fill="#2563eb"
                          />
                          <circle
                            cx={startN.x}
                            cy={startN.y}
                            r={2}
                            fill="white"
                          />
                          <text
                            x={startN.x + 10}
                            y={startN.y + 4}
                            fontSize={8}
                            fill="#1d4ed8"
                            fontWeight={700}
                            fontFamily="sans-serif"
                          >
                            YOU
                          </text>
                        </svg>
                      );
                    })()}

                  {/* Blue "You Are Here" marker (when manually set) */}
                  {userLocation && userLocation.floorId === activeFloor && (
                    <svg
                      style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        overflow: "visible",
                      }}
                      width={MAP_WIDTH}
                      height={MAP_HEIGHT}
                      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                    >
                      <title>User location marker</title>
                      <circle
                        cx={userLocation.x}
                        cy={userLocation.y}
                        r={14}
                        fill="oklch(0.55 0.22 250)"
                        opacity={0.18}
                      />
                      <circle
                        cx={userLocation.x}
                        cy={userLocation.y}
                        r={8}
                        fill="oklch(0.55 0.22 250)"
                        opacity={0.3}
                      />
                      <circle
                        data-ocid="map.location_marker"
                        cx={userLocation.x}
                        cy={userLocation.y}
                        r={5}
                        fill="oklch(0.45 0.28 250)"
                        stroke="white"
                        strokeWidth="1.5"
                      />
                      <text
                        x={userLocation.x + 9}
                        y={userLocation.y + 4}
                        fontSize={7}
                        fill="oklch(0.35 0.22 250)"
                        fontWeight={700}
                        fontFamily="sans-serif"
                      >
                        YOU
                      </text>
                    </svg>
                  )}
                  {/* Evacuation route overlay */}
                  {emergencyMode && emergencyExitInfo && (
                    <svg
                      style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        overflow: "visible",
                      }}
                      width={MAP_WIDTH}
                      height={MAP_HEIGHT}
                      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                      aria-label="Evacuation route overlay"
                    >
                      <title>Evacuation route</title>
                      <polyline
                        data-ocid="map.evacuation_route.canvas_target"
                        points={`${emergencyExitInfo.origin.x},${emergencyExitInfo.origin.y} ${emergencyExitInfo.exit.x},${emergencyExitInfo.origin.y} ${emergencyExitInfo.exit.x},${emergencyExitInfo.exit.y}`}
                        fill="none"
                        stroke="rgb(239 68 68)"
                        strokeWidth="3.5"
                        strokeDasharray="10 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                      />
                      <circle
                        cx={emergencyExitInfo.origin.x}
                        cy={emergencyExitInfo.origin.y}
                        r={8}
                        fill="rgb(239 68 68)"
                        opacity={0.2}
                      />
                      <circle
                        cx={emergencyExitInfo.origin.x}
                        cy={emergencyExitInfo.origin.y}
                        r={4}
                        fill="rgb(239 68 68)"
                        opacity={0.9}
                      />
                    </svg>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Zoom controls */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
              <button
                type="button"
                data-ocid="map.zoom_in.button"
                aria-label="Zoom in"
                onClick={() => zoomAt(1.25)}
                className="w-9 h-9 bg-white rounded-xl shadow-card flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <ZoomIn size={16} className="text-foreground" />
              </button>
              <button
                type="button"
                data-ocid="map.zoom_out.button"
                aria-label="Zoom out"
                onClick={() => zoomAt(0.8)}
                className="w-9 h-9 bg-white rounded-xl shadow-card flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <ZoomOut size={16} className="text-foreground" />
              </button>
            </div>

            {/* Floor selector — top right */}
            <div
              data-ocid="map.floor_selector.tab"
              className="absolute top-3 right-3 flex flex-col gap-1 z-20"
            >
              {FLOOR_DATA.map((floor, idx) => (
                <button
                  key={floor.id}
                  type="button"
                  data-ocid={`map.floor.button.${idx + 1}`}
                  aria-label={`Switch to ${floor.label}`}
                  onClick={() => handleFloorChange(floor.id)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold shadow-card transition-all duration-200 flex items-center justify-center ${
                    activeFloor === floor.id
                      ? "bg-primary text-primary-foreground scale-105"
                      : "bg-white text-foreground hover:bg-secondary"
                  }`}
                >
                  {floor.abbr}
                </button>
              ))}
              {/* Reset view button */}
              <button
                type="button"
                data-ocid="map.location.button"
                onClick={() => {
                  setScale(1);
                  setTx(0);
                  setTy(0);
                }}
                className="w-9 h-9 bg-white rounded-xl shadow-card flex items-center justify-center hover:bg-secondary transition-colors mt-1"
                aria-label="Reset view"
              >
                <Locate size={16} className="text-primary" />
              </button>
              {/* Set My Location button */}
              <button
                type="button"
                data-ocid="map.set_location_button"
                onClick={() => setLocationSheetOpen(true)}
                className={`w-9 h-9 rounded-xl shadow-card flex items-center justify-center transition-colors mt-0.5 ${userLocation ? "bg-blue-500 hover:bg-blue-600" : "bg-white hover:bg-secondary"}`}
                aria-label="Set my location"
              >
                <MapPin
                  size={16}
                  className={userLocation ? "text-white" : "text-blue-500"}
                />
              </button>
              {/* Set Start Node button */}
              <button
                type="button"
                data-ocid="map.set_start_button"
                onClick={() => {
                  if (userLocation) {
                    const floorMarkers =
                      FLOOR_DATA[userLocation.floorId]?.markers ?? [];
                    let nearestMarker = floorMarkers[0];
                    let nearestDist = Number.POSITIVE_INFINITY;
                    for (const m of floorMarkers) {
                      const d = Math.sqrt(
                        (m.x - userLocation.x) ** 2 +
                          (m.y - userLocation.y) ** 2,
                      );
                      if (d < nearestDist) {
                        nearestDist = d;
                        nearestMarker = m;
                      }
                    }
                    if (nearestMarker) {
                      setStartNodeId(
                        getMarkerNodeId(userLocation.floorId, nearestMarker.id),
                      );
                      toast.success("Start point set to your location");
                    }
                  } else {
                    toast.info(
                      "Set your location first to define a start point",
                    );
                  }
                }}
                className={`w-9 h-9 rounded-xl shadow-card flex items-center justify-center transition-colors mt-0.5 ${startNodeId ? "bg-green-500 hover:bg-green-600" : "bg-white hover:bg-secondary"}`}
                aria-label="Set start point"
                title="Set navigation start point"
              >
                <Navigation
                  size={16}
                  className={startNodeId ? "text-white" : "text-green-600"}
                />
              </button>
              {/* Emergency Mode toggle */}
              <button
                type="button"
                data-ocid="map.emergency_mode.toggle"
                onClick={() => {
                  const next = !emergencyMode;
                  setEmergencyMode(next);
                  if (next) {
                    speak(
                      "Emergency mode activated. Proceed to the nearest emergency exit.",
                    );
                    toast.error("🚨 Emergency mode activated", {
                      duration: 3000,
                    });
                  } else {
                    window.speechSynthesis?.cancel();
                  }
                }}
                aria-label={
                  emergencyMode
                    ? "Deactivate emergency mode"
                    : "Activate emergency mode"
                }
                className={`w-9 h-9 rounded-xl shadow-card flex items-center justify-center transition-all mt-0.5 ${emergencyMode ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-white hover:bg-red-50 border border-red-200"}`}
              >
                <ShieldAlert
                  size={16}
                  className={emergencyMode ? "text-white" : "text-red-600"}
                />
              </button>
            </div>

            {/* Scale indicator */}
            <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold text-muted-foreground z-20">
              {Math.round(scale * 100)}%
            </div>

            {/* Layers */}
            <button
              type="button"
              aria-label="Toggle layers"
              className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-2xl shadow-card flex items-center justify-center hover:bg-secondary transition-colors z-20"
            >
              <Layers size={18} className="text-foreground" />
            </button>
          </div>

          {/* Tooltip overlay — sits above the overflow-hidden map container */}
          <AnimatePresence>
            {activeMarkerData && activeCfg && (
              <motion.div
                key={`${activeFloor}-${activeMarkerData.id}`}
                initial={{ opacity: 0, y: 4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                style={getTooltipStyle(activeMarkerData)}
              >
                <div
                  className={`rounded-2xl border shadow-xl overflow-hidden ${activeCfg.bg} ${activeCfg.border}`}
                  style={{ minWidth: "140px", pointerEvents: "all" }}
                >
                  <div
                    className={`text-[10px] font-bold px-3 py-2 whitespace-nowrap ${activeCfg.color}`}
                  >
                    {activeMarkerData.label}
                  </div>
                  <div className="px-2 pb-1 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      data-ocid="map.favorite_button"
                      onClick={() => {
                        const favId = `floor-${activeFloor}-marker-${activeMarkerData.id}`;
                        if (isFavorite(favId)) {
                          removeFavorite(favId);
                        } else {
                          addFavorite({
                            id: favId,
                            name: activeMarkerData.label,
                            floor: FLOOR_DATA[activeFloor]?.label ?? "",
                            floorId: activeFloor,
                            type: activeMarkerData.type,
                            markerId: activeMarkerData.id,
                            x: activeMarkerData.x,
                            y: activeMarkerData.y,
                          });
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center hover:bg-white/80 transition-colors"
                      aria-label={
                        isFavorite(
                          `floor-${activeFloor}-marker-${activeMarkerData.id}`,
                        )
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <Heart
                        size={12}
                        className={
                          isFavorite(
                            `floor-${activeFloor}-marker-${activeMarkerData.id}`,
                          )
                            ? "text-red-500 fill-red-500"
                            : "text-muted-foreground"
                        }
                      />
                    </button>
                  </div>
                  {highlightedLocation &&
                    highlightedLocation.floorId === activeFloor &&
                    highlightedLocation.markerId === activeMarkerData.id && (
                      <div className="px-2 pb-2">
                        <button
                          type="button"
                          data-ocid="map.navigate_button"
                          onClick={() => {
                            setNavigationActive(true);
                            toast.success(
                              `Navigation to ${activeMarkerData.label} started`,
                            );
                          }}
                          className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-xl py-1.5 px-2 hover:bg-primary/90 transition-colors"
                        >
                          <Navigation size={10} />
                          Navigate Here
                        </button>
                      </div>
                    )}
                </div>
                <div
                  className={`w-2 h-2 mx-auto -mt-1 rotate-45 border-b border-r ${activeCfg.border} ${activeCfg.bg}`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Info Panel */}
      <AnimatePresence>
        {routeInfo && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="mx-5 mb-4"
            data-ocid="map.navigation_panel"
          >
            <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
              <Navigation size={20} className="flex-shrink-0 opacity-90" />
              <div className="flex-1">
                <p className="text-xs font-bold leading-tight">
                  Route to {highlightedLocation?.label}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-bold">
                    {routeInfo.meters} m
                  </span>
                  <span className="text-xs opacity-75">·</span>
                  <span className="text-sm font-bold">
                    ~{routeInfo.minutes} min walk
                  </span>
                </div>
              </div>
              <button
                type="button"
                data-ocid="map.stop_navigation_button"
                onClick={() => {
                  setNavigationActive(false);
                  setNavSteps([]);
                  window.speechSynthesis?.cancel();
                }}
                className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors"
                aria-label="Stop navigation"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Mode Active Panel */}
      <AnimatePresence>
        {emergencyMode && emergencyExitInfo && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            className="mx-5 mb-3"
          >
            <div className="bg-red-600 border border-red-700 rounded-2xl overflow-hidden shadow-lg">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚨</span>
                  <div>
                    <p className="text-xs font-bold text-white font-body tracking-widest uppercase">
                      Emergency Mode Active
                    </p>
                    <p className="text-[11px] text-red-100 font-body mt-0.5">
                      Nearest exit: {emergencyExitInfo.exit.label} · ~
                      {emergencyExitInfo.meters}m
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  data-ocid="map.emergency_mode.deactivate_button"
                  onClick={() => {
                    setEmergencyMode(false);
                    window.speechSynthesis?.cancel();
                  }}
                  className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold rounded-xl py-1.5 px-3 transition-colors border border-white/30"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step-by-step Navigation Instructions */}
      <AnimatePresence>
        {navSteps.length > 0 && (
          <motion.div
            data-ocid="nav.instructions.panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            className="mx-5 mb-4"
          >
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                <div className="flex items-center gap-2">
                  <Navigation size={14} className="text-primary" />
                  <span className="text-xs font-bold text-foreground font-body">
                    Navigation Instructions
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-body bg-muted rounded-full px-2 py-0.5">
                    {navSteps.length} steps
                  </span>
                  <button
                    type="button"
                    data-ocid="nav.voice_toggle"
                    aria-label={
                      voiceEnabled
                        ? "Mute voice guidance"
                        : "Unmute voice guidance"
                    }
                    onClick={() => {
                      if (voiceEnabled) {
                        window.speechSynthesis?.cancel();
                      }
                      setVoiceEnabled((v) => !v);
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                  >
                    {voiceEnabled ? (
                      <Volume2 size={13} />
                    ) : (
                      <VolumeX size={13} />
                    )}
                  </button>
                </div>
              </div>
              {/* Steps list */}
              <div className="overflow-y-auto max-h-52">
                {navSteps.map((step, idx) => {
                  const StepIcon =
                    step.iconType === "straight"
                      ? ArrowUp
                      : step.iconType === "turn-left"
                        ? CornerDownLeft
                        : step.iconType === "turn-right"
                          ? CornerDownRight
                          : step.iconType === "stairs"
                            ? Footprints
                            : step.iconType === "elevator"
                              ? ArrowUpDown
                              : MapPin;
                  return (
                    <div
                      key={step.id}
                      data-ocid={`nav.instructions.item.${idx + 1}`}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${
                        step.active ? "bg-primary/10" : "bg-transparent"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          step.active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <StepIcon size={13} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <span
                          className={`text-xs leading-snug font-body ${
                            step.active
                              ? "font-bold text-foreground"
                              : "font-normal text-muted-foreground"
                          }`}
                        >
                          {step.text}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] flex-shrink-0 mt-1 ${step.active ? "text-primary font-bold" : "text-muted-foreground/50"}`}
                      >
                        {idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Next / Prev step controls */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20">
                <button
                  type="button"
                  data-ocid="nav.instructions.pagination_prev"
                  disabled={currentStepIdx === 0}
                  onClick={() => {
                    const newIdx = Math.max(0, currentStepIdx - 1);
                    setCurrentStepIdx(newIdx);
                    setNavSteps((prev) =>
                      prev.map((s, i) => ({ ...s, active: i === newIdx })),
                    );
                    speak(navSteps[newIdx]?.text ?? "");
                  }}
                  className="text-[11px] font-semibold text-primary disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-[10px] text-muted-foreground font-body">
                  Step {currentStepIdx + 1} of {navSteps.length}
                </span>
                <button
                  type="button"
                  data-ocid="nav.instructions.pagination_next"
                  disabled={currentStepIdx >= navSteps.length - 1}
                  onClick={() => {
                    const newIdx = Math.min(
                      navSteps.length - 1,
                      currentStepIdx + 1,
                    );
                    setCurrentStepIdx(newIdx);
                    setNavSteps((prev) =>
                      prev.map((s, i) => ({ ...s, active: i === newIdx })),
                    );
                    speak(navSteps[newIdx]?.text ?? "");
                  }}
                  className="text-[11px] font-semibold text-primary disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <div className="px-5 mb-3">
        <p className="text-[11px] text-muted-foreground font-body text-center">
          Drag to pan · Scroll or pinch to zoom · Tap markers for details
        </p>
      </div>

      {/* Legend */}
      <div className="px-5 mb-6">
        <Card className="border-0 shadow-card">
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={13} className="text-muted-foreground" />
              <span className="text-xs font-bold font-body text-foreground">
                Map Legend
              </span>
              <Badge className="ml-auto text-[10px] bg-secondary text-secondary-foreground border-0">
                {currentFloor.label}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {LEGEND_ITEMS.map(({ type, label }) => {
                const cfg = MARKER_CONFIG[type];
                const { Icon } = cfg;
                return (
                  <div key={type} className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.border}`}
                    >
                      <Icon size={11} className={cfg.color} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-body leading-tight">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Location Detection Sheet */}
      <Sheet open={locationSheetOpen} onOpenChange={setLocationSheetOpen}>
        <SheetContent
          side="bottom"
          data-ocid="map.location_sheet"
          className="rounded-t-3xl max-h-[85vh] overflow-y-auto"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-bold">
              Set Your Location
            </SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="tap">
            <TabsList className="w-full mb-4">
              <TabsTrigger
                value="tap"
                className="flex-1"
                data-ocid="map.tap_map_tab"
              >
                <MapPin size={14} className="mr-1.5" />
                Tap Map
              </TabsTrigger>
              <TabsTrigger
                value="qr"
                className="flex-1"
                data-ocid="map.qr_scan_tab"
              >
                <ScanLine size={14} className="mr-1.5" />
                QR Code
              </TabsTrigger>
            </TabsList>
            <TabsContent value="tap" className="space-y-4 pb-4">
              <div className="bg-blue-50 rounded-2xl p-4 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <MapPin size={22} className="text-blue-600" />
                </div>
                <p className="text-sm text-blue-700 font-medium">
                  Tap anywhere on the map to pin your current position
                </p>
                <p className="text-xs text-blue-500">
                  Switch to the correct floor first, then tap to mark your
                  location
                </p>
              </div>
              <button
                type="button"
                data-ocid="map.tap_map_button"
                onClick={() => {
                  setSettingLocation(true);
                  setLocationSheetOpen(false);
                }}
                className="w-full py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <MapPin size={16} />
                Tap on Map
              </button>
            </TabsContent>
            <TabsContent value="qr" className="pb-4">
              <QRLocationScanner
                onLocationDetected={(loc) => {
                  setUserLocation(loc);
                  setLocationSheetOpen(false);
                  toast.success("Location detected from QR code");
                }}
              />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </section>
  );
}

// ─── QR Location Scanner sub-component ──────────────────────────────────────
function QRLocationScanner({
  onLocationDetected,
}: {
  onLocationDetected: (loc: { x: number; y: number; floorId: number }) => void;
}) {
  const {
    qrResults,
    isScanning,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    videoRef,
    canvasRef,
  } = useQRScanner({ facingMode: "environment", scanInterval: 150 });

  useEffect(() => {
    if (canStartScanning) {
      startScanning();
    }
  }, [canStartScanning, startScanning]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  useEffect(() => {
    if (!qrResults.length) return;
    const latest = qrResults[0];
    try {
      const parsed = JSON.parse(latest.data);
      if (
        typeof parsed.x === "number" &&
        typeof parsed.y === "number" &&
        typeof parsed.floorId === "number"
      ) {
        stopScanning();
        onLocationDetected({
          x: parsed.x,
          y: parsed.y,
          floorId: parsed.floorId,
        });
        return;
      }
    } catch {
      // not JSON
    }
    const label = latest.data.trim().toLowerCase();
    for (const floor of FLOOR_DATA) {
      for (const marker of floor.markers) {
        if (marker.label.toLowerCase() === label) {
          stopScanning();
          onLocationDetected({ x: marker.x, y: marker.y, floorId: floor.id });
          return;
        }
      }
    }
  }, [qrResults, stopScanning, onLocationDetected]);

  if (isSupported === false) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <X size={22} className="text-destructive" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Camera not supported
        </p>
        <p className="text-xs text-muted-foreground">
          Your device or browser does not support camera access
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="relative rounded-2xl overflow-hidden bg-black"
        style={{ aspectRatio: "4/3" }}
      >
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef as React.RefObject<HTMLCanvasElement>}
          className="hidden"
        />
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-white/60 rounded-2xl relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
              <motion.div
                className="absolute left-2 right-2 h-0.5 bg-blue-400/80"
                animate={{ top: ["10%", "85%", "10%"] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              />
            </div>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-white text-sm font-medium">
              Starting camera...
            </span>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive text-center">{error.message}</p>
      )}
      <p className="text-xs text-muted-foreground text-center">
        {isScanning
          ? "Point at a location QR code to set your position"
          : "Camera inactive"}
      </p>
      {!isScanning && !isLoading && (
        <button
          type="button"
          onClick={() => startScanning()}
          disabled={!canStartScanning}
          className="w-full py-2.5 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
        >
          Start Camera
        </button>
      )}
    </div>
  );
}
