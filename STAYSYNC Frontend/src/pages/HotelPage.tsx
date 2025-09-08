// File: src/pages/HotelPage.tsx
// Create a route: <Route path="/hotels/:id" element={<HotelPage/>} />
// Adjust the import path to your supabaseClient if necessary (project root vs alias).

import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient"; // <-- adjust if your client is elsewhere
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Date picker
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// Types
type Hotel = {
  property_id: number;
  property_name: string;
  star_rating?: number;
  property_type?: string;
  distance_from_center?: number;
  town?: string;
  state?: string;
};

type Room = {
  id: number;
  hotel_id: number;
  room_type: string;
  price: number;
  booked_till?: string | null; // date string
  room_images?: string[] | null;
};

type Booking = {
  id: number;
  room_id: number;
  user_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
};

export default function HotelPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hotelId = Number(id);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // modal state (use react-day-picker date range)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // get current user id helper
  const getCurrentUserId = async (): Promise<string | null> => {
    try {
      // try supabase auth (v2)
      // @ts-ignore
      const { data, error } = await supabase.auth.getUser();
      if (error) return null;
      // @ts-ignore
      if (data?.user?.id) return data.user.id;
    } catch (_) {}

    // fallback: if you store user in localStorage (earlier code saved staysync_user)
    try {
      const stored = localStorage.getItem("staysync_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) return parsed.id;
      }
    } catch (_) {}

    return null;
  };

  useEffect(() => {
    if (!hotelId) return;

    const fetchAll = async () => {
      setLoading(true);
      console.log(hotelId);
      try {
        const { data: hotelData, error: hotelErr } = await supabase
          .from("hotel")
          .select("*")
          .eq("property_id", hotelId)
          .single();
        if (hotelErr) console.error(hotelErr);
        else setHotel(hotelData as Hotel);

        const { data: roomsData, error: roomsErr } = await supabase
          .from("rooms")
          .select("*")
          .eq("hotel_id", hotelId)
          .order("id", { ascending: true });
        if (roomsErr) console.error(roomsErr);
        else setRooms((roomsData as Room[]) || []);

        // fetch bookings for rooms of this hotel
        const roomIds = (roomsData || []).map((r: any) => r.id);
        if (roomIds.length > 0) {
          const { data: bookingsData, error: bookingsErr } = await supabase
            .from("bookings")
            .select("*")
            .in("room_id", roomIds);
          if (bookingsErr) console.error(bookingsErr);
          else setBookings((bookingsData as Booking[]));
        } else {
          setBookings([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
      console.log(bookings);
    };

    fetchAll();
  }, [hotelId]);

  // utility: check if requested range overlaps ANY booking for that room OR comes before booked_till
  const rangeOverlaps = (roomId: number, start: string, end: string) => {
    if (!start || !end) return false;
    const s = new Date(start);
    const e = new Date(end);
    if (s > e) return true; // invalid range -> treat as overlap to block

    // Find the room to check booked_till
    const room = rooms.find(r => r.id === roomId);
    if (room?.booked_till) {
      const bookedTillDate = new Date(room.booked_till);
      // If start date is before or on booked_till date, it's not available
      if (s <= bookedTillDate) {
        return true;
      }
    }

    const roomBookings = bookings.filter((b) => b.room_id === roomId);
    for (const b of roomBookings) {
      const bs = new Date(b.start_date);
      const be = new Date(b.end_date);
      // overlap if start <= be && end >= bs
      if (s <= be && e >= bs) return true;
    }
    return false;
  };

  const openBookModal = (room: Room) => {
    setSelectedRoom(room);
    setRange(undefined);
    setErrorMsg(null);
  };

  const closeModal = () => {
    setSelectedRoom(null);
    setRange(undefined);
    setErrorMsg(null);
  };

  const daysBetween = (a: string, b: string) => {
    const A = new Date(a);
    const B = new Date(b);
    const diff = Math.ceil((B.getTime() - A.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  // Build disabled ranges for a given room from bookings AND booked_till
  const getDisabledRangesForRoom = (roomId: number) => {
    const disabledRanges = [];
    
    // Find the room to get booked_till
    const room = rooms.find(r => r.id === roomId);
    
    // If room has booked_till, disable all dates from start of time until booked_till
    if (room?.booked_till) {
      const bookedTillDate = new Date(room.booked_till);
      // Disable from a very early date to booked_till (inclusive)
      disabledRanges.push({
        from: new Date('2020-01-01'), // or any early date
        to: bookedTillDate
      });
    }
    
    // Add disabled ranges for existing bookings
    const bookingRanges = bookings
      .filter((b) => b.room_id === roomId)
      .map((b) => ({ 
        from: new Date(b.start_date), 
        to: new Date(b.end_date) 
      }));
    
    return [...disabledRanges, ...bookingRanges];
  };

  const formatYMD = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

  const handleBook = async () => {
    setErrorMsg(null);
    if (!selectedRoom) return;

    const from = range?.from ?? null;
    const to = range?.to ?? null;

    if (!from || !to) {
      setErrorMsg("Please select a start and end date in the picker.");
      return;
    }

    // convert to yyyy-mm-dd
    const startDate = formatYMD(from)!;
    const endDate = formatYMD(to)!;

    // validate
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s > e) {
      setErrorMsg("Start date must be before end date.");
      return;
    }

    // check overlap with existing bookings AND booked_till (extra guard — picker should prevent this)
    const overlapped = rangeOverlaps(selectedRoom.id, startDate, endDate);
    if (overlapped) {
      if (selectedRoom.booked_till && new Date(startDate) <= new Date(selectedRoom.booked_till)) {
        setErrorMsg(`Room is not available until ${selectedRoom.booked_till}. Please select dates after this.`);
      } else {
        setErrorMsg("Selected dates overlap an existing booking. Pick different dates.");
      }
      return;
    }

    // ensure logged in
    const userId = await getCurrentUserId();
    if (!userId) {
      setErrorMsg("You must be logged in to book. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
      return;
    }

    const days = daysBetween(startDate, endDate);

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("bookings").insert([
        {
          room_id: selectedRoom.id,
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
          days: days,
        },
      ]);
      if (error) {
        console.error(error);
        setErrorMsg(error.message || "Failed to book. Please try again.");
      } else {
        // success: refresh bookings & rooms (trigger will update rooms.booked_till on backend)
        // fetch bookings again
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("*")
          .eq("room_id", selectedRoom.id);
        setBookings((prev) => {
          const others = prev.filter((b) => b.room_id !== selectedRoom.id);
          return [...others, ...(bookingsData || [])];
        });

        // refresh rooms row
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("*")
          .eq("hotel_id", hotelId)
          .order("id", { ascending: true });
        setRooms((roomsData as Room[]) || []);

        closeModal();
        alert("Booking created — your reservation is saved. You can complete payment later.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Unexpected error while booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center p-8">Loading hotel...</p>;
  if (!hotel) return <p className="text-center p-8">Hotel not found.</p>;

  return (
    <main className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{hotel.property_name}</h1>
          <p className="text-sm text-muted-foreground">
            {hotel.town || ""} {hotel.state ? `• ${hotel.state}` : ""}
          </p>
        </div>
        <Link to="/">
          <Button variant="ghost">Back to hotels</Button>
        </Link>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rooms.length === 0 && (
          <p className="text-muted-foreground">No rooms available for this hotel.</p>
        )}

        {rooms.map((room) => {
          // derive quick availability text: if booked_till >= today then 'Unavailable until X'
          const today = new Date();
          const bt = room.booked_till ? new Date(room.booked_till) : null;
          const unavailableUntil = bt && bt >= today ? bt.toISOString().slice(0, 10) : null;

          // find bookings for this room as ranges
          const roomBookings = bookings
            .filter((b) => b.room_id === room.id)
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

          return (
            <Card key={room.id} className="p-4">
              <CardHeader>
                <CardTitle>
                  {room.room_type} — ₹{room.price}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">Room ID: {room.id}</p>
                {unavailableUntil ? (
                  <p className="text-sm text-rose-600">Unavailable until {unavailableUntil}</p>
                ) : (
                  <p className="text-sm text-emerald-600">Available now</p>
                )}

                {roomBookings.length > 0 && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    <strong>Booked ranges:</strong>
                    <ul className="list-disc ml-5">
                      {roomBookings.map((b) => (
                        <li key={b.id}>
                          {b.start_date} → {b.end_date}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button onClick={() => openBookModal(room)}>Book this room</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Booking modal (react-day-picker range) */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Book: {selectedRoom.room_type}</h3>
                <p className="text-sm mb-2">Price per night: ₹{selectedRoom.price}</p>
                {selectedRoom.booked_till && (
                  <p className="text-xs text-amber-600">
                    Available from: {new Date(selectedRoom.booked_till).toLocaleDateString()} onwards
                  </p>
                )}
              </div>
              <button onClick={closeModal} className="text-sm text-muted-foreground">Close</button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Pick a date range (blocked days are disabled)</p>

              <div className="bg-gray-50 rounded p-3">
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={(r) => setRange(r as DateRange)}
                  // disable ranges that already have bookings for this room AND dates before booked_till
                  disabled={getDisabledRangesForRoom(selectedRoom.id)}
                  // Optional: prevent selection of past dates
                  fromDate={new Date()}
                />
              </div>

              <div className="mt-3 text-sm">
                <div>Selected start: {formatYMD(range?.from ?? null) ?? "—"}</div>
                <div>Selected end: {formatYMD(range?.to ?? null) ?? "—"}</div>
                {range?.from && range?.to && (
                  <div className="mt-1 text-emerald-600">
                    Total nights: {daysBetween(formatYMD(range.from)!, formatYMD(range.to)!)} 
                    • Total cost: ₹{daysBetween(formatYMD(range.from)!, formatYMD(range.to)!) * selectedRoom.price}
                  </div>
                )}
              </div>

              {errorMsg && <p className="text-rose-600 text-sm mt-2">{errorMsg}</p>}

              <div className="flex justify-end gap-2 mt-4">
                <button className="btn" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleBook}
                  disabled={submitting}
                >
                  {submitting ? "Booking..." : "Confirm booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

