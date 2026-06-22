import { useState } from 'react';
import { Plus, Trash2, Calendar, Clock, Users, MapPin, Wifi, Monitor, Coffee, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import {
  useRooms, useRoomBookings, useCreateRoom, useDeactivateRoom, useCreateBooking, useCancelBooking,
  type MeetingRoom, type CreateRoomInput,
} from '@/hooks/useRooms';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="h-3 w-3" />,
  Projector: <Monitor className="h-3 w-3" />,
  TV: <Monitor className="h-3 w-3" />,
  Whiteboard: <span className="text-[10px]">WB</span>,
  Coffee: <Coffee className="h-3 w-3" />,
};

function AmenityBadge({ name }: { name: string }) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]">
      {AMENITY_ICONS[name] ?? null}
      {name}
    </span>
  );
}

interface RoomCardProps {
  room: MeetingRoom;
  isHr: boolean;
  onBook: (room: MeetingRoom) => void;
  onDeactivate: (id: string) => void;
}

function RoomCard({ room, isHr, onBook, onDeactivate }: RoomCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{room.name}</CardTitle>
            {room.location && (
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" /> {room.location}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0">
            <Users className="mr-1 h-3 w-3" /> {room.capacity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {room.amenities.map((a) => <AmenityBadge key={a} name={a} />)}
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onBook(room)}>
            <Calendar className="mr-1.5 h-3.5 w-3.5" /> Book Room
          </Button>
          {isHr && (
            <Button
              size="sm" variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onDeactivate(room.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const COMMON_AMENITIES = ['WiFi', 'Projector', 'TV', 'Whiteboard', 'Coffee', 'AC', 'Video Conferencing'];

function AddRoomDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createRoom = useCreateRoom();
  const [form, setForm] = useState<CreateRoomInput>({ name: '', location: '', capacity: 1, amenities: [] });

  function toggle(a: string) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createRoom.mutateAsync(form);
      toast.success('Room created');
      onClose();
      setForm({ name: '', location: '', capacity: 1, amenities: [] });
    } catch {
      toast.error('Failed to create room');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Meeting Room</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Room Name *</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>Location / Floor</Label>
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. 2nd Floor, East Wing" />
          </div>
          <div className="space-y-1.5">
            <Label>Capacity (persons)</Label>
            <Input
              type="number" min={1}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_AMENITIES.map((a) => (
                <button
                  type="button" key={a}
                  onClick={() => toggle(a)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${form.amenities.includes(a) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createRoom.isPending}>
              {createRoom.isPending ? 'Creating…' : 'Create Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BookRoomDialog({ room, open, onClose }: { room: MeetingRoom | null; open: boolean; onClose: () => void }) {
  const createBooking = useCreateBooking();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    title: '', date: today, startTime: '09:00', endTime: '10:00',
    attendees: 1, notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!room) return;
    const startTime = new Date(`${form.date}T${form.startTime}:00`).toISOString();
    const endTime = new Date(`${form.date}T${form.endTime}:00`).toISOString();
    try {
      await createBooking.mutateAsync({ roomId: room.id, title: form.title, startTime, endTime, attendees: form.attendees, notes: form.notes || undefined });
      toast.success('Room booked successfully');
      onClose();
      setForm({ title: '', date: today, startTime: '09:00', endTime: '10:00', attendees: 1, notes: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to book room');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Room — {room?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Meeting Title *</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input type="date" value={form.date} min={today} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Time *</Label>
              <Input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>End Time *</Label>
              <Input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Number of Attendees (max {room?.capacity})</Label>
            <Input
              type="number" min={1} max={room?.capacity}
              value={form.attendees}
              onChange={(e) => setForm((f) => ({ ...f, attendees: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createBooking.isPending}>
              {createBooking.isPending ? 'Booking…' : 'Book Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BookingRow({ booking, canCancel, onCancel }: { booking: any; canCancel: boolean; onCancel: (id: string) => void }) {
  const start = parseISO(booking.startTime);
  const end = parseISO(booking.endTime);
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-medium text-sm">{booking.title}</p>
        <p className="text-muted-foreground text-xs">{booking.room?.name}{booking.room?.location ? ` · ${booking.room.location}` : ''}</p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(start, 'dd MMM yyyy')}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(start, 'HH:mm')} – {format(end, 'HH:mm')}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{booking.attendees}</span>
        </div>
        {booking.bookedBy && (
          <p className="text-muted-foreground text-xs">By: {booking.bookedBy.firstName} {booking.bookedBy.lastName} ({booking.bookedBy.employeeCode})</p>
        )}
      </div>
      {canCancel && (
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0" onClick={() => onCancel(booking.id)}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default function RoomsPage() {
  const { user } = useAuthStore();
  const isHr = HR_ROLES.includes(user?.role ?? '');
  const isPrivileged = isHr || user?.role === 'MANAGER';

  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: bookings = [], isLoading: bookingsLoading } = useRoomBookings();
  const deactivate = useDeactivateRoom();
  const cancelBooking = useCancelBooking();

  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [bookRoom, setBookRoom] = useState<MeetingRoom | null>(null);
  const [filterDate, setFilterDate] = useState('');

  const filteredBookings = filterDate
    ? bookings.filter((b) => b.startTime.startsWith(filterDate))
    : bookings;

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this room? Existing bookings will remain.')) return;
    try {
      await deactivate.mutateAsync(id);
      toast.success('Room deactivated');
    } catch {
      toast.error('Failed to deactivate room');
    }
  }

  async function handleCancelBooking(id: string) {
    if (!confirm('Cancel this booking?')) return;
    try {
      await cancelBooking.mutateAsync(id);
      toast.success('Booking cancelled');
    } catch {
      toast.error('Failed to cancel booking');
    }
  }

  const myBookings = bookings.filter((b) => !isPrivileged);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meeting Rooms</h1>
          <p className="text-muted-foreground text-sm">Book conference rooms and manage schedules.</p>
        </div>
        {isHr && (
          <Button onClick={() => setAddRoomOpen(true)}>
            <Plus className="h-4 w-4" /> Add Room
          </Button>
        )}
      </div>

      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms">Available Rooms ({rooms.length})</TabsTrigger>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          {isPrivileged && <TabsTrigger value="all">All Bookings</TabsTrigger>}
        </TabsList>

        <TabsContent value="rooms" className="mt-4">
          {roomsLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : rooms.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
              No meeting rooms configured yet.
              {isHr && <div><button className="text-primary mt-1 underline-offset-2 hover:underline" onClick={() => setAddRoomOpen(true)}>Add your first room</button></div>}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isHr={isHr}
                  onBook={(r) => setBookRoom(r)}
                  onDeactivate={handleDeactivate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <Label className="text-sm">Filter by date:</Label>
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="h-8 w-40 text-xs" />
            {filterDate && <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>Clear</Button>}
          </div>
          {bookingsLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <ScrollArea className="h-[500px] pr-3">
              <div className="space-y-2">
                {filteredBookings.filter((b) => !isPrivileged || true).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No bookings found.</p>
                ) : (
                  filteredBookings.map((b) => (
                    <BookingRow
                      key={b.id}
                      booking={b}
                      canCancel={true}
                      onCancel={handleCancelBooking}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {isPrivileged && (
          <TabsContent value="all" className="mt-4">
            <div className="mb-4 flex items-center gap-3">
              <Label className="text-sm">Filter by date:</Label>
              <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="h-8 w-40 text-xs" />
              {filterDate && <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>Clear</Button>}
            </div>
            {bookingsLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (
              <ScrollArea className="h-[500px] pr-3">
                <div className="space-y-2">
                  {filteredBookings.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No bookings found.</p>
                  ) : (
                    filteredBookings.map((b) => (
                      <BookingRow
                        key={b.id}
                        booking={b}
                        canCancel={true}
                        onCancel={handleCancelBooking}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        )}
      </Tabs>

      <AddRoomDialog open={addRoomOpen} onClose={() => setAddRoomOpen(false)} />
      <BookRoomDialog room={bookRoom} open={!!bookRoom} onClose={() => setBookRoom(null)} />
    </div>
  );
}
