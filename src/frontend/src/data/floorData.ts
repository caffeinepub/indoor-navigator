import type { FloorData, Marker } from "@/types/map";

const SHARED_STAIRS_A: Marker = {
  id: 11,
  type: "stairs",
  label: "Staircase A · All Floors",
  x: 20,
  y: 145,
};

const SHARED_STAIRS_B: Marker = {
  id: 12,
  type: "stairs",
  label: "Staircase B · All Floors",
  x: 355,
  y: 280,
};

const SHARED_ELEVATOR: Marker = {
  id: 10,
  type: "elevator",
  label: "Elevator · All Floors",
  x: 355,
  y: 120,
};

export const FLOOR_DATA: FloorData[] = [
  {
    id: 0,
    label: "Ground Floor",
    abbr: "G",
    markers: [
      { id: 1, type: "classroom", label: "Room 101 — Classroom", x: 70, y: 55 },
      {
        id: 2,
        type: "classroom",
        label: "Room 102 — Classroom",
        x: 180,
        y: 55,
      },
      { id: 3, type: "lab", label: "Computer Lab", x: 300, y: 55 },
      { id: 4, type: "lab", label: "Science Lab", x: 90, y: 185 },
      { id: 5, type: "office", label: "Main Office", x: 220, y: 185 },
      { id: 6, type: "restroom", label: "Restroom", x: 320, y: 185 },
      {
        id: 7,
        type: "classroom",
        label: "Room 201 — Classroom",
        x: 120,
        y: 290,
      },
      { id: 8, type: "exit", label: "Emergency Exit A", x: 30, y: 315 },
      { id: 9, type: "exit", label: "Emergency Exit B", x: 350, y: 315 },
      SHARED_ELEVATOR,
      SHARED_STAIRS_A,
      SHARED_STAIRS_B,
      {
        id: 13,
        type: "fireExtinguisher",
        label: "Fire Extinguisher",
        x: 160,
        y: 95,
      },
      {
        id: 14,
        type: "fireExtinguisher",
        label: "Fire Extinguisher",
        x: 290,
        y: 260,
      },
      {
        id: 15,
        type: "fireExtinguisher",
        label: "Fire Extinguisher",
        x: 60,
        y: 260,
      },
      { id: 16, type: "firstAid", label: "First Aid Station", x: 220, y: 290 },
      { id: 17, type: "firstAid", label: "First Aid Kit", x: 340, y: 55 },
    ],
  },
  {
    id: 1,
    label: "Floor 1",
    abbr: "1",
    markers: [
      { id: 1, type: "classroom", label: "Lecture Hall A", x: 75, y: 55 },
      { id: 2, type: "classroom", label: "Lecture Hall B", x: 290, y: 55 },
      { id: 3, type: "office", label: "Faculty Office", x: 195, y: 185 },
      { id: 4, type: "restroom", label: "Restroom", x: 320, y: 185 },
      { id: 5, type: "office", label: "Staff Room", x: 80, y: 185 },
      { id: 6, type: "exit", label: "Emergency Exit A", x: 30, y: 315 },
      { id: 7, type: "exit", label: "Emergency Exit B", x: 350, y: 315 },
      SHARED_ELEVATOR,
      SHARED_STAIRS_A,
      SHARED_STAIRS_B,
      {
        id: 13,
        type: "fireExtinguisher",
        label: "Fire Extinguisher",
        x: 160,
        y: 95,
      },
      {
        id: 14,
        type: "fireExtinguisher",
        label: "Fire Extinguisher",
        x: 310,
        y: 260,
      },
      { id: 15, type: "firstAid", label: "First Aid Room", x: 195, y: 290 },
      { id: 16, type: "firstAid", label: "First Aid Kit", x: 75, y: 290 },
    ],
  },
  {
    id: 2,
    label: "Floor 2",
    abbr: "2",
    markers: [
      { id: 1, type: "lab", label: "Library", x: 165, y: 55 },
      { id: 2, type: "office", label: "Conference Room A", x: 75, y: 185 },
      { id: 3, type: "office", label: "Conference Room B", x: 220, y: 185 },
      { id: 4, type: "lab", label: "IT Lab", x: 310, y: 55 },
      { id: 5, type: "office", label: "Print Room", x: 165, y: 290 },
      { id: 6, type: "restroom", label: "Restroom", x: 320, y: 185 },
      { id: 7, type: "exit", label: "Emergency Exit A", x: 30, y: 315 },
      { id: 8, type: "exit", label: "Emergency Exit B", x: 350, y: 315 },
      SHARED_ELEVATOR,
      SHARED_STAIRS_A,
      SHARED_STAIRS_B,
      {
        id: 13,
        type: "fireExtinguisher",
        label: "Fire Extinguisher",
        x: 100,
        y: 95,
      },
      {
        id: 14,
        type: "fireExtinguisher",
        label: "Fire Extinguisher",
        x: 290,
        y: 260,
      },
      {
        id: 15,
        type: "fireExtinguisher",
        label: "Fire Extinguisher",
        x: 250,
        y: 95,
      },
      { id: 16, type: "firstAid", label: "First Aid Room", x: 165, y: 185 },
    ],
  },
];

export { SHARED_STAIRS_A, SHARED_STAIRS_B, SHARED_ELEVATOR };
