import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserData } from "@/contexts/UserDataContext";
import { FLOOR_DATA } from "@/data/floorData";
import type { MarkerType } from "@/types/map";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CustomRoom {
  id: string;
  name: string;
  type: MarkerType;
  floorId: number;
  floorLabel: string;
}

const ROOM_TYPES: MarkerType[] = [
  "classroom",
  "lab",
  "office",
  "restroom",
  "elevator",
  "stairs",
  "exit",
  "fireExtinguisher",
  "firstAid",
];

const TYPE_EMOJI: Record<MarkerType, string> = {
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
  onBack: () => void;
}

export default function AdminScreen({ onBack }: Props) {
  const { history } = useUserData();
  const [customRooms, setCustomRooms] = useState<CustomRoom[]>(() => {
    try {
      const raw = localStorage.getItem("indoor-nav-custom-rooms");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [addOpen, setAddOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<CustomRoom | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<MarkerType>("classroom");
  const [formFloor, setFormFloor] = useState(0);

  useEffect(() => {
    localStorage.setItem(
      "indoor-nav-custom-rooms",
      JSON.stringify(customRooms),
    );
  }, [customRooms]);

  const allRooms: CustomRoom[] = [
    ...FLOOR_DATA.flatMap((floor) =>
      floor.markers
        .filter((m) => m.type !== "fireExtinguisher" && m.type !== "firstAid")
        .map((m) => ({
          id: `floor-${floor.id}-marker-${m.id}`,
          name: m.label,
          type: m.type,
          floorId: floor.id,
          floorLabel: floor.label,
        })),
    ),
    ...customRooms,
  ];

  const handleAdd = () => {
    if (!formName.trim()) return;
    const floor = FLOOR_DATA.find((f) => f.id === formFloor);
    const newRoom: CustomRoom = {
      id: `custom-${Date.now()}`,
      name: formName.trim(),
      type: formType,
      floorId: formFloor,
      floorLabel: floor?.label ?? "Unknown",
    };
    setCustomRooms((prev) => [...prev, newRoom]);
    setAddOpen(false);
    setFormName("");
    toast.success("Room added successfully");
  };

  const handleEdit = () => {
    if (!editRoom || !formName.trim()) return;
    const floor = FLOOR_DATA.find((f) => f.id === formFloor);
    setCustomRooms((prev) =>
      prev.map((r) =>
        r.id === editRoom.id
          ? {
              ...r,
              name: formName.trim(),
              type: formType,
              floorId: formFloor,
              floorLabel: floor?.label ?? "Unknown",
            }
          : r,
      ),
    );
    setEditRoom(null);
    toast.success("Room updated");
  };

  const handleDelete = (id: string) => {
    setCustomRooms((prev) => prev.filter((r) => r.id !== id));
    toast.success("Room removed");
  };

  const openEdit = (room: CustomRoom) => {
    setEditRoom(room);
    setFormName(room.name);
    setFormType(room.type);
    setFormFloor(room.floorId);
  };

  // Stats by type
  const typeCounts: Partial<Record<MarkerType, number>> = {};
  for (const room of allRooms) {
    typeCounts[room.type] = (typeCounts[room.type] ?? 0) + 1;
  }

  return (
    <section data-ocid="admin.section" className="animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          type="button"
          data-ocid="admin.back.button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center shadow-xs hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={17} className="text-foreground" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Admin Panel
          </h1>
          <p className="text-xs text-muted-foreground font-body">
            Building map management
          </p>
        </div>
      </div>

      <div className="px-5">
        <Tabs defaultValue="floors" data-ocid="admin.tabs">
          <TabsList className="w-full mb-4">
            <TabsTrigger
              value="floors"
              data-ocid="admin.floors.tab"
              className="flex-1"
            >
              <Building2 size={14} className="mr-1" /> Floors
            </TabsTrigger>
            <TabsTrigger
              value="rooms"
              data-ocid="admin.rooms.tab"
              className="flex-1"
            >
              <MapPin size={14} className="mr-1" /> Rooms
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              data-ocid="admin.stats.tab"
              className="flex-1"
            >
              <BarChart3 size={14} className="mr-1" /> Stats
            </TabsTrigger>
          </TabsList>

          {/* Floors Tab */}
          <TabsContent value="floors">
            <Card className="border-0 shadow-card">
              <CardContent className="p-0">
                {FLOOR_DATA.map((floor, i) => {
                  const count = allRooms.filter(
                    (r) => r.floorId === floor.id,
                  ).length;
                  return (
                    <div key={floor.id}>
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-sm">
                          {floor.abbr}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-foreground font-body">
                            {floor.label}
                          </p>
                          <p className="text-xs text-muted-foreground font-body">
                            {count} rooms
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                      {i < FLOOR_DATA.length - 1 && (
                        <Separator className="mx-4" />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-body">
                {allRooms.length} total rooms
              </p>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    data-ocid="admin.add_room.button"
                    onClick={() => {
                      setFormName("");
                      setFormType("classroom");
                      setFormFloor(0);
                    }}
                  >
                    <Plus size={14} className="mr-1" /> Add Room
                  </Button>
                </DialogTrigger>
                <DialogContent data-ocid="admin.add_room.dialog">
                  <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1">
                      <Label>Room Name</Label>
                      <Input
                        data-ocid="admin.room_name.input"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Meeting Room 3A"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Type</Label>
                      <Select
                        value={formType}
                        onValueChange={(v) => setFormType(v as MarkerType)}
                      >
                        <SelectTrigger data-ocid="admin.room_type.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOM_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {TYPE_EMOJI[t]} {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Floor</Label>
                      <Select
                        value={String(formFloor)}
                        onValueChange={(v) => setFormFloor(Number(v))}
                      >
                        <SelectTrigger data-ocid="admin.room_floor.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FLOOR_DATA.map((f) => (
                            <SelectItem key={f.id} value={String(f.id)}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      data-ocid="admin.add_room.cancel_button"
                      onClick={() => setAddOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      data-ocid="admin.add_room.confirm_button"
                      onClick={handleAdd}
                    >
                      Add Room
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-0 shadow-card">
              <CardContent className="p-0">
                {allRooms.slice(0, 30).map((room, i) => (
                  <div key={room.id} data-ocid={`admin.room.item.${i + 1}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="text-lg flex-shrink-0">
                        {TYPE_EMOJI[room.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground font-body truncate">
                          {room.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-body">
                          {room.floorLabel}
                        </p>
                      </div>
                      {room.id.startsWith("custom-") && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            data-ocid={`admin.room.edit_button.${i + 1}`}
                            onClick={() => openEdit(room)}
                            className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-secondary transition-colors"
                            aria-label="Edit room"
                          >
                            <Pencil
                              size={12}
                              className="text-muted-foreground"
                            />
                          </button>
                          <button
                            type="button"
                            data-ocid={`admin.room.delete_button.${i + 1}`}
                            onClick={() => handleDelete(room.id)}
                            className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                            aria-label="Delete room"
                          >
                            <Trash2 size={12} className="text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>
                    {i < Math.min(allRooms.length, 30) - 1 && (
                      <Separator className="mx-4" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog
              open={!!editRoom}
              onOpenChange={(open) => !open && setEditRoom(null)}
            >
              <DialogContent data-ocid="admin.edit_room.dialog">
                <DialogHeader>
                  <DialogTitle>Edit Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <Label>Room Name</Label>
                    <Input
                      data-ocid="admin.edit_room_name.input"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Select
                      value={formType}
                      onValueChange={(v) => setFormType(v as MarkerType)}
                    >
                      <SelectTrigger data-ocid="admin.edit_room_type.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TYPE_EMOJI[t]} {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Floor</Label>
                    <Select
                      value={String(formFloor)}
                      onValueChange={(v) => setFormFloor(Number(v))}
                    >
                      <SelectTrigger data-ocid="admin.edit_room_floor.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FLOOR_DATA.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    data-ocid="admin.edit_room.cancel_button"
                    onClick={() => setEditRoom(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    data-ocid="admin.edit_room.confirm_button"
                    onClick={handleEdit}
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="space-y-3">
              <Card className="border-0 shadow-card">
                <CardContent className="p-4">
                  <h3 className="font-display text-sm font-bold text-foreground mb-3">
                    Overview
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center py-2 rounded-xl bg-primary/5">
                      <span className="font-display text-xl font-bold text-primary">
                        {allRooms.length}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-body">
                        Total Rooms
                      </span>
                    </div>
                    <div className="flex flex-col items-center py-2 rounded-xl bg-primary/5">
                      <span className="font-display text-xl font-bold text-primary">
                        {FLOOR_DATA.length}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-body">
                        Floors
                      </span>
                    </div>
                    <div className="flex flex-col items-center py-2 rounded-xl bg-primary/5">
                      <span className="font-display text-xl font-bold text-primary">
                        {history.length}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-body">
                        Nav Trips
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-card">
                <CardContent className="p-4">
                  <h3 className="font-display text-sm font-bold text-foreground mb-3">
                    Rooms by Type
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(typeCounts).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-3">
                        <span className="text-base w-6">
                          {TYPE_EMOJI[type as MarkerType]}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-semibold font-body text-foreground capitalize">
                              {type}
                            </span>
                            <span className="text-xs text-muted-foreground font-body">
                              {count}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${Math.round((count / allRooms.length) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <footer className="px-5 py-6 text-center">
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
