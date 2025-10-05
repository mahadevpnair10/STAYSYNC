// File: src/pages/HotelPage.tsx
// Route: <Route path="/hotels/:id" element={<HotelPage/>} />

import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient"; // adjust path if needed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface Hotel {
  property_id: number;
  property_name: string;
  property_type?: string;
  star_rating?: number;
  address: string;
  town?: string;
  state?: string;
  pincode: number;
  latitude: number;
  longitude: number;
  free_wifi: boolean;
  entire_property: boolean;
  built_year?: number;
  distance_from_center?: number;
  admin_id?: string;
  created_at: string;
}

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

  // UI state
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean | null>(null); // null = original
  const [isShuffled, setIsShuffled] = useState(false);

  // drag-n-drop refs
  const dragIndexRef = useRef<number | null>(null);

  // palette constants
  const BG = "#FAF8F1";
  const ACCENT = "#FAEAB1";
  const PRIMARY = "#34656D";
  const TEXT = "#334443";

  // get current user id helper
  const getCurrentUserId = async (): Promise<string | null> => {
    try {
      // supabase auth v2
      // @ts-ignore
      const { data, error } = await supabase.auth.getUser();
      if (error) return null;
      // @ts-ignore
      if (data?.user?.id) return data.user.id;
    } catch (_) {}

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

        // bookings for these rooms
        const roomIds = (roomsData || []).map((r: any) => r.id);
        if (roomIds.length > 0) {
          const { data: bookingsData, error: bookingsErr } = await supabase
            .from("bookings")
            .select("*")
            .in("room_id", roomIds);
          if (bookingsErr) console.error(bookingsErr);
          else setBookings((bookingsData as Booking[]) || []);
        } else {
          setBookings([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [hotelId]);

  // --- utilities (kept from original) ---
  const rangeOverlaps = (roomId: number, start: string, end: string) => {
    if (!start || !end) return false;
    const s = new Date(start);
    const e = new Date(end);
    if (s > e) return true; // invalid -> block

    const room = rooms.find((r) => r.id === roomId);
    if (room?.booked_till) {
      const bookedTillDate = new Date(room.booked_till);
      if (s <= bookedTillDate) return true;
    }

    const roomBookings = bookings.filter((b) => b.room_id === roomId);
    for (const b of roomBookings) {
      const bs = new Date(b.start_date);
      const be = new Date(b.end_date);
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

  const getDisabledRangesForRoom = (roomId: number) => {
    const disabledRanges: { from: Date; to: Date }[] = [];
    const room = rooms.find((r) => r.id === roomId);

    if (room?.booked_till) {
      const bookedTillDate = new Date(room.booked_till);
      disabledRanges.push({
        from: new Date("2020-01-01"),
        to: bookedTillDate,
      });
    }

    const bookingRanges = bookings
      .filter((b) => b.room_id === roomId)
      .map((b) => ({
        from: new Date(b.start_date),
        to: new Date(b.end_date),
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

    const startDate = formatYMD(from)!;
    const endDate = formatYMD(to)!;

    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s > e) {
      setErrorMsg("Start date must be before end date.");
      return;
    }

    const overlapped = rangeOverlaps(selectedRoom.id, startDate, endDate);
    if (overlapped) {
      if (selectedRoom.booked_till && new Date(startDate) <= new Date(selectedRoom.booked_till)) {
        setErrorMsg(`Room is not available until ${selectedRoom.booked_till}. Please select dates after this.`);
      } else {
        setErrorMsg("Selected dates overlap an existing booking. Pick different dates.");
      }
      return;
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      setErrorMsg("You must be logged in to book. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
      return;
    }

    const nights = daysBetween(startDate, endDate);

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("bookings").insert([
        {
          room_id: selectedRoom.id,
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
          days: nights,
        },
      ]).select();
      if (error) {
        console.error(error);
        setErrorMsg(error.message || "Failed to book. Please try again.");
      } else {
        // refresh bookings for this room, and refresh rooms list
        const { data: bookingsData } = await supabase.from("bookings").select("*").eq("room_id", selectedRoom.id);
        setBookings((prev) => {
          const others = prev.filter((b) => b.room_id !== selectedRoom.id);
          return [...others, ...(bookingsData || [])];
        });

        const { data: roomsData } = await supabase
          .from("rooms")
          .select("*")
          .eq("hotel_id", hotelId)
          .order("id", { ascending: true });
        setRooms((roomsData as Room[]) || []);

        closeModal();
        
        // Calculate total cost for the booking
        const totalCost = nights * selectedRoom.price;
        
        // Store booking details for payment processing
        const bookingId = data && data.length > 0 ? data[0].id : null;
        localStorage.setItem('newBookingForPayment', JSON.stringify({
          bookingId: bookingId,
          roomType: selectedRoom.room_type,
          hotelName: hotel?.property_name,
          nights: nights,
          pricePerNight: selectedRoom.price,
          totalCost: totalCost,
          startDate: startDate,
          endDate: endDate,
          roomId: selectedRoom.id,
          userId: userId
        }));
        
        // Redirect to UserPortal payments tab
        navigate('/user?tab=payments&booking=new');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Unexpected error while booking.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Modern UI interactions: shuffle, sort, drag/drop ----------
  const shuffleRooms = () => {
    // Fisher-Yates shuffle
    const arr = [...rooms];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setRooms(arr);
    setIsShuffled(true);
    setSortAsc(null);
  };

  const sortByPrice = (asc = true) => {
    const arr = [...rooms].sort((a, b) => (asc ? a.price - b.price : b.price - a.price));
    setRooms(arr);
    setSortAsc(asc);
    setIsShuffled(false);
  };

  const resetOrder = async () => {
    // Re-fetch rooms to get original order from DB
    try {
      const { data: roomsData } = await supabase.from("rooms").select("*").eq("hotel_id", hotelId).order("id", { ascending: true });
      setRooms((roomsData as Room[]) || []);
      setSortAsc(null);
      setIsShuffled(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Drag handlers (native HTML5)
  const onDragStart = (e: React.DragEvent, idx: number) => {
    dragIndexRef.current = idx;
    e.dataTransfer.effectAllowed = "move";
    // small transparent drag image to avoid default ghost
    const img = document.createElement("canvas");
    img.width = img.height = 0;
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === undefined) return;
    if (from === dropIndex) return;
    const arr = [...rooms];
    const [moved] = arr.splice(from, 1);
    arr.splice(dropIndex, 0, moved);
    setRooms(arr);
    dragIndexRef.current = null;
    setIsShuffled(false);
    setSortAsc(null);
  };

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: TEXT }}>Loading hotel...</div>;
  if (!hotel) return <div style={{ padding: 32, textAlign: "center", color: TEXT }}>Hotel not found.</div>;

  // Build map iframe src safely
  const latVal = hotel?.latitude;
  const lngVal = hotel?.longitude;
  const latNum = typeof latVal === "string" ? parseFloat(latVal) : latVal;
  const lngNum = typeof lngVal === "string" ? parseFloat(lngVal) : lngVal;
  const coordsValid =
    typeof latNum === "number" && typeof lngNum === "number" && isFinite(latNum as number) && isFinite(lngNum as number);
  const mapSrc = coordsValid ? `https://www.google.com/maps?q=${encodeURIComponent(String(latNum))},${encodeURIComponent(String(lngNum))}&z=14&output=embed` : "";

  return (
    <main style={{ background: BG, minHeight: "100vh", color: TEXT }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{hotel.property_name}</h1>
            <p style={{ marginTop: 4, color: `${TEXT}CC` }}>
              {hotel.town || ""} {hotel.state ? `• ${hotel.state}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/">
              <Button style={{ background: "transparent", color: PRIMARY, border: `1px solid ${PRIMARY}` }}>Back</Button>
            </Link>
            {/* Shuffle + sort controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={shuffleRooms}
                title="Shuffle rooms"
                style={{
                  background: ACCENT,
                  borderRadius: 8,
                  padding: "8px 10px",
                  border: "none",
                  cursor: "pointer",
                  color: TEXT,
                  boxShadow: "0 6px 18px rgba(52,101,109,0.08)",
                }}
              >
                Shuffle
              </button>

              <button
                onClick={() => sortByPrice(true)}
                title="Sort price ↑"
                style={{
                  background: sortAsc === true ? PRIMARY : "transparent",
                  color: sortAsc === true ? BG : PRIMARY,
                  borderRadius: 8,
                  padding: "8px 10px",
                  border: `1px solid ${PRIMARY}`,
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(52,101,109,0.06)",
                }}
              >
                Price ↑
              </button>

              <button
                onClick={() => sortByPrice(false)}
                title="Sort price ↓"
                style={{
                  background: sortAsc === false ? PRIMARY : "transparent",
                  color: sortAsc === false ? BG : PRIMARY,
                  borderRadius: 8,
                  padding: "8px 10px",
                  border: `1px solid ${PRIMARY}`,
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(52,101,109,0.06)",
                }}
              >
                Price ↓
              </button>

              <button
                onClick={resetOrder}
                title="Reset"
                style={{
                  background: "transparent",
                  color: PRIMARY,
                  borderRadius: 8,
                  padding: "8px 10px",
                  border: `1px dashed ${PRIMARY}`,
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* ---------------- Map iframe inserted here ---------------- */}
        <div style={{ marginBottom: 20 }}>
          {coordsValid ? (
            <div
              className="border-2 rounded-2xl overflow-hidden h-96"
              style={{ borderColor: ACCENT, backgroundColor: BG }}
            >
              <iframe
                title={`Hotel ${hotel.property_name} Map`}
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div
              className="border-2 rounded-2xl h-96 flex items-center justify-center text-center"
              style={{ borderColor: ACCENT, backgroundColor: BG }}
            >
              <div>
                <div style={{ width: 64, height: 64, borderRadius: 12, margin: "0 auto 12px", backgroundColor: `${PRIMARY}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: PRIMARY }} />
                </div>
                <h3 style={{ color: TEXT, fontSize: 18, fontWeight: 600, marginBottom: 6 }}>No location data</h3>
                <p style={{ color: PRIMARY }}>This hotel does not have latitude/longitude coordinates.</p>
              </div>
            </div>
          )}
        </div>
        {/* --------------------------------------------------------- */}

        {/* Rooms grid (compact cards, draggable) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.length === 0 && <div style={{ padding: 16 }}>No rooms available.</div>}

          {rooms.map((room, idx) => {
            const today = new Date();
            const bt = room.booked_till ? new Date(room.booked_till) : null;
            const unavailableUntil = bt && bt >= today ? bt.toISOString().slice(0, 10) : null;

            const roomBookings = bookings
              .filter((b) => b.room_id === room.id)
              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

            return (
              <div
                key={room.id}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, idx)}
                className="cursor-grab"
              >
                <Card
                  className="p-3"
                  style={{
                    borderRadius: 12,
                    background: "#fff",
                    boxShadow: "0 10px 30px rgba(51,68,67,0.06)",
                    border: `1px solid ${ACCENT}33`,
                  }}
                >
                  <CardHeader style={{ padding: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <CardTitle style={{ fontSize: 16, marginBottom: 2, color: TEXT }}>
                          {room.room_type}
                        </CardTitle>
                        <div style={{ fontSize: 13, color: `${TEXT}AA` }}>ID: {room.id}</div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: PRIMARY }}>₹{room.price}</div>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: unavailableUntil ? "#B91C1C" : "#047857",
                            background: unavailableUntil ? "#FEE2E2" : "#DCFCE7",
                            padding: "4px 8px",
                            borderRadius: 999,
                            display: "inline-block",
                          }}
                        >
                          {unavailableUntil ? `Unavailable until ${unavailableUntil}` : "Available"}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent style={{ paddingTop: 10 }}>
                    {/* small bookings preview */}
                    {roomBookings.length > 0 ? (
                      <div style={{ fontSize: 12, color: `${TEXT}99`, marginBottom: 8 }}>
                        <strong className="mr-2" style={{ color: TEXT }}>
                          Booked:
                        </strong>
                        {roomBookings.slice(0, 2).map((b) => (
                          <span key={b.id} style={{ display: "inline-block", marginRight: 8 }}>
                            {b.start_date}→{b.end_date}
                          </span>
                        ))}
                        {roomBookings.length > 2 && <span style={{ color: `${TEXT}88` }}>+{roomBookings.length - 2}</span>}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: `${TEXT}88`, marginBottom: 8 }}>No upcoming bookings</div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => openBookModal(room)}
                        style={{
                          background: PRIMARY,
                          color: BG,
                          borderRadius: 8,
                          padding: "8px 10px",
                          border: "none",
                          cursor: "pointer",
                          flex: 1,
                        }}
                      >
                        Book
                      </button>

                      <button
                        onClick={async () => {
                          // quick refresh bookings for this room
                          const { data: bookingsData } = await supabase.from("bookings").select("*").eq("room_id", room.id);
                          setBookings((prev) => {
                            const others = prev.filter((b) => b.room_id !== room.id);
                            return [...others, ...(bookingsData || [])];
                          });
                          alert("Bookings refreshed for this room.");
                        }}
                        style={{
                          background: "transparent",
                          color: PRIMARY,
                          border: `1px solid ${ACCENT}`,
                          borderRadius: 8,
                          padding: "8px 10px",
                          cursor: "pointer",
                        }}
                      >
                        Refresh
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </section>

        {/* Booking modal */}
        {selectedRoom && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <div style={{ width: "min(920px, 96%)", background: BG, borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>Book: {selectedRoom.room_type}</h3>
                  <p style={{ marginTop: 6, color: `${TEXT}CC` }}>Price per night: ₹{selectedRoom.price}</p>
                  {selectedRoom.booked_till && (
                    <p style={{ fontSize: 13, color: PRIMARY, marginTop: 6 }}>
                      Available from: {new Date(selectedRoom.booked_till).toLocaleDateString()} onwards
                    </p>
                  )}
                </div>
                <button onClick={closeModal} style={{ background: "transparent", border: "none", color: TEXT }}>
                  Close
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 13, color: `${TEXT}99`, marginBottom: 8 }}>
                  Pick a date range (blocked days are disabled)
                </p>

                <div style={{ background: "#fff", borderRadius: 8, padding: 12 }}>
                  <DayPicker
                    mode="range"
                    selected={range}
                    onSelect={(r) => setRange(r as DateRange)}
                    disabled={getDisabledRangesForRoom(selectedRoom.id)}
                    fromDate={new Date()}
                  />
                </div>

                <div style={{ marginTop: 12, fontSize: 14, color: TEXT }}>
                  <div>Selected start: {formatYMD(range?.from ?? null) ?? "—"}</div>
                  <div>Selected end: {formatYMD(range?.to ?? null) ?? "—"}</div>
                  {range?.from && range?.to && (
                    <div style={{ marginTop: 8, color: "#047857" }}>
                      Total nights: {daysBetween(formatYMD(range.from)!, formatYMD(range.to)!)} • Total cost:
                      ₹{daysBetween(formatYMD(range.from)!, formatYMD(range.to)!) * selectedRoom.price}
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div style={{ marginTop: 10, color: "#B91C1C", fontSize: 13 }}>
                    {errorMsg}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
                  <button
                    onClick={closeModal}
                    disabled={submitting}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${ACCENT}`,
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBook}
                    disabled={submitting}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      background: PRIMARY,
                      color: BG,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {submitting ? "Booking..." : "Confirm booking"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* small helper styles */}
      <style>{`
        /* keep DayPicker neutral, override calendar colors lightly */
        .rdp-day_selected, .rdp-day_range_middle {
          background: ${PRIMARY} !important;
          color: ${BG} !important;
        }
        .rdp-day_today {
          box-shadow: 0 0 0 1px ${ACCENT} inset;
        }
      `}</style>
    </main>
  );
}
