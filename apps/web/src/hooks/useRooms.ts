import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface MeetingRoom {
  id: string;
  name: string;
  location?: string;
  capacity: number;
  amenities: string[];
  isActive: boolean;
  createdAt: string;
}

export interface RoomBooking {
  id: string;
  roomId: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: number;
  notes?: string;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  room?: { name: string; location?: string; capacity: number };
  bookedBy?: { firstName: string; lastName: string; employeeCode: string };
}

export interface CreateRoomInput {
  name: string;
  location?: string;
  capacity: number;
  amenities: string[];
}

export interface CreateBookingInput {
  roomId: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: number;
  notes?: string;
}

export function useRooms() {
  return useQuery<MeetingRoom[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const r = await api.get('/rooms');
      return r.data.data;
    },
  });
}

export function useRoomBookings(filters?: { roomId?: string; date?: string }) {
  return useQuery<RoomBooking[]>({
    queryKey: ['room-bookings', filters],
    queryFn: async () => {
      const r = await api.get('/rooms/bookings', { params: filters });
      return r.data.data;
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoomInput) => api.post('/rooms', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CreateRoomInput> & { id: string; isActive?: boolean }) =>
      api.patch(`/rooms/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useDeactivateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/rooms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingInput) => api.post('/rooms/bookings', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['room-bookings'] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/rooms/bookings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['room-bookings'] }),
  });
}
