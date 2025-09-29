import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { supabase } from "@/../supabaseClient";
import { useHotel } from "@/contexts/HotelContext";
import { FloorMap } from "@/components/FloorMap";
import { 
  User, 
  Calendar, 
  CreditCard, 
  Star, 
  MessageSquare, 
  Utensils, 
  Sparkles, 
  Plus,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Bed,
  Coffee,
  Shield,
  Heart
} from "lucide-react";

interface Room {
  id: number;
  hotel_id: number;
  room_type: string;
  price: number;
  booked_till?: string | null;
  room_images?: string[] | null;
  status?: 'available' | 'occupied' | 'maintenance';
  floor?: number;
}

interface Booking {
  id: number;
  room_id: number;
  user_id: string;
  start_date: string;
  end_date: string;
  days: number;
  created_at: string;
  rooms: {
    id: number;
    room_type: string;
    price: number;
    hotel_id: number;
    hotel?: {
      property_id: number;
      property_name: string;
      town: string;
      state: string;
    };
  };
}

interface RoomServiceOrder {
  id?: number;
  booking_id: number;
  user_id: string;
  item_name: string;
  preferred_time: string;
  status: string;
  total_amount: number;
  created_at?: string;
  property_id?: number;
}

interface HousekeepingRequest {
  id?: number;
  booking_id: number;
  user_id: string;
  service_type: string;
  preferred_time: string;
  status: string;
  created_at?: string;
  property_id?: number;
}

interface Feedback {
  id?: number;
  user_id: string;
  rating: number;
  comment: string;
  created_at?: string;
  property_id?: number;
}

interface Payment {
  id?: number;
  booking_id: number;
  user_id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at?: string;
}

const UserPortal = () => {
  const { toast } = useToast();
  const { floors, rooms: hotelRooms } = useHotel();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ rating: 5, comment: "" });
  const [bookingForm, setBookingForm] = useState({
    guestName: "",
    checkIn: "",
    checkOut: ""
  });
  const [roomServiceForm, setRoomServiceForm] = useState({
    item: "",
    preferredTime: ""
  });
  const [housekeepingForm, setHousekeepingForm] = useState({
    serviceType: "refresh",
    preferredTime: ""
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: "card"
  });
  const [roomServiceOrders, setRoomServiceOrders] = useState<RoomServiceOrder[]>([]);
  const [housekeepingRequests, setHousekeepingRequests] = useState<HousekeepingRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  // Fetch user data and related information
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authUser) throw new Error('Not authenticated');
        
        setUser(authUser);

        // Fetch user's bookings with room details first
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            rooms (
              id,
              room_type,
              price,
              hotel_id
            )
          `)
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;

        // Then fetch hotel details separately for each booking
        const bookingsWithHotel = await Promise.all(
          (bookingsData || []).map(async (booking) => {
            if (booking.rooms?.hotel_id) {
              const { data: hotelData } = await supabase
                .from('hotel')
                .select('property_id, property_name, town, state')
                .eq('property_id', booking.rooms.hotel_id)
                .single();
              
              return {
                ...booking,
                rooms: {
                  ...booking.rooms,
                  hotel: hotelData
                }
              };
            }
            return booking;
          })
        );

        setBookings(bookingsWithHotel);

        // Set current active booking if exists
        const today = new Date().toISOString().split('T')[0];
        const active = bookingsWithHotel?.find(b => 
          b.start_date <= today && b.end_date >= today
        );
        setCurrentBooking(active || null);

        // Fetch room service orders with property_id
        const { data: roomServiceData, error: roomServiceError } = await supabase
          .from('room_service_orders')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (roomServiceError) throw roomServiceError;
        setRoomServiceOrders(roomServiceData || []);

        // Fetch housekeeping requests with property_id
        const { data: housekeepingData, error: housekeepingError } = await supabase
          .from('housekeeping_requests')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (housekeepingError) throw housekeepingError;
        setHousekeepingRequests(housekeepingData || []);

        // Fetch feedbacks with property_id
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (feedbackError) throw feedbackError;
        setFeedbacks(feedbackData || []);

        // Fetch payments
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (paymentError) throw paymentError;
        setPayments(paymentData || []);

      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error",
          description: "Failed to load your data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [toast]);

  // Room Service Request Handler
  const handleRoomService = async () => {
    if (!currentBooking) {
      toast({
        title: "No active booking",
        description: "You need an active booking to request room service",
        variant: "destructive"
      });
      return;
    }

    if (!roomServiceForm.item || !roomServiceForm.preferredTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('room_service_orders')
        .insert({
          booking_id: currentBooking.id,
          user_id: user.id,
          item_name: roomServiceForm.item,
          preferred_time: roomServiceForm.preferredTime,
          status: 'pending',
          total_amount: 0,
          property_id: currentBooking.rooms.hotel_id
        })
        .select()
        .single();

      if (error) throw error;

      setRoomServiceOrders(prev => [data, ...prev]);
      setRoomServiceForm({ item: "", preferredTime: "" });
      
      toast({
        title: "Request submitted",
        description: "Your room service request has been received"
      });
    } catch (error) {
      console.error('Error submitting room service request:', error);
      toast({
        title: "Error",
        description: "Failed to submit room service request",
        variant: "destructive"
      });
    }
  };

  // Housekeeping Request Handler
  const handleHousekeepingRequest = async () => {
    if (!currentBooking) {
      toast({
        title: "No active booking",
        description: "You need an active booking to request housekeeping",
        variant: "destructive"
      });
      return;
    }

    if (!housekeepingForm.preferredTime) {
      toast({
        title: "Missing information",
        description: "Please select a preferred time",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('housekeeping_requests')
        .insert({
          booking_id: currentBooking.id,
          user_id: user.id,
          service_type: housekeepingForm.serviceType,
          preferred_time: housekeepingForm.preferredTime,
          status: 'pending',
          property_id: currentBooking.rooms.hotel_id
        })
        .select()
        .single();

      if (error) throw error;

      setHousekeepingRequests(prev => [data, ...prev]);
      setHousekeepingForm({ serviceType: "refresh", preferredTime: "" });
      
      toast({
        title: "Request submitted",
        description: "Your housekeeping request has been received"
      });
    } catch (error) {
      console.error('Error submitting housekeeping request:', error);
      toast({
        title: "Error",
        description: "Failed to submit housekeeping request",
        variant: "destructive"
      });
    }
  };

  // Feedback Submission Handler
  const handleFeedbackSubmit = async () => {
    if (!currentBooking) {
      toast({
        title: "No active booking",
        description: "You need an active booking to submit feedback",
        variant: "destructive"
      });
      return;
    }

    if (!feedback.comment) {
      toast({
        title: "Missing comment",
        description: "Please provide your feedback comment",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          rating: feedback.rating,
          comment: feedback.comment,
          property_id: currentBooking.rooms.hotel_id
        })
        .select()
        .single();

      if (error) throw error;

      setFeedbacks(prev => [data, ...prev]);
      setFeedback({ rating: 5, comment: "" });
      
      toast({
        title: "Feedback submitted!",
        description: "Thank you for helping us improve STAYSYNC."
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive"
      });
    }
  };

  // Payment Handler
  const handlePayment = async () => {
    if (!currentBooking) {
      toast({
        title: "No active booking",
        description: "You need an active booking to make a payment",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          booking_id: currentBooking.id,
          user_id: user.id,
          amount: paymentForm.amount,
          payment_method: paymentForm.paymentMethod,
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;

      setPayments(prev => [data, ...prev]);
      setPaymentForm({ amount: 0, paymentMethod: "card" });
      
      toast({
        title: "Payment successful!",
        description: `Your payment of ₹${paymentForm.amount} has been processed.`
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive"
      });
    }
  };

  // Booking Handler
  const handleBookRoom = async () => {
    if (!user || !selectedRoom) return;

    if (!bookingForm.guestName || !bookingForm.checkIn || !bookingForm.checkOut) {
      toast({
        title: "Missing information",
        description: "Please fill in all booking details",
        variant: "destructive"
      });
      return;
    }

    try {
      const days = Math.ceil(
        (new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      // First insert the booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          room_id: selectedRoom.id,
          user_id: user.id,
          start_date: bookingForm.checkIn,
          end_date: bookingForm.checkOut,
          days: days
        })
        .select(`
          *,
          rooms (
            id,
            room_type,
            price,
            hotel_id
          )
        `)
        .single();

      if (bookingError) throw bookingError;

      // Then fetch hotel details for the new booking
      if (bookingData?.rooms?.hotel_id) {
        const { data: hotelData } = await supabase
          .from('hotel')
          .select('property_id, property_name, town, state')
          .eq('property_id', bookingData.rooms.hotel_id)
          .single();

        const completeBooking = {
          ...bookingData,
          rooms: {
            ...bookingData.rooms,
            hotel: hotelData
          }
        };

        setBookings(prev => [completeBooking, ...prev]);
      } else {
        setBookings(prev => [bookingData, ...prev]);
      }

      setBookingForm({ guestName: "", checkIn: "", checkOut: "" });
      
      toast({ 
        title: "Booking confirmed!", 
        description: `Room ${selectedRoom.id} booked successfully.` 
      });
    } catch (error) {
      console.error('Error booking room:', error);
      toast({
        title: "Booking failed",
        description: "Failed to book the room. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Select Room Handler
  const handleRoomSelect = (room: Room) => {
    if (room.status !== 'available') {
      toast({
        title: "Room not available",
        description: "Please select an available room",
        variant: "destructive"
      });
      return;
    }
    setSelectedRoom(room);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10" style={{ backgroundColor: '#FAF8F1', minHeight: '100vh' }}>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: '#34656D' }}></div>
          <p style={{ color: '#334443' }}>Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4" style={{ backgroundColor: '#FAF8F1', minHeight: '100vh' }}>
      <SEO
        title="User Portal"
        description="Book rooms, request room service, housekeeping, and make payments."
        canonical="/user"
      />

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" style={{ backgroundColor: '#34656D' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" style={{ backgroundColor: '#334443' }}></div>
        <div className="absolute top-1/2 left-1/4 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" style={{ backgroundColor: '#FAEAB1' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl shadow-lg" style={{ backgroundColor: '#34656D' }}>
              <User className="w-8 h-8" style={{ color: '#FAF8F1' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: '#334443' }}>User Portal</h1>
              <p className="mt-1 text-lg" style={{ color: '#34656D' }}>Welcome back, {user?.email}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full shadow-sm" style={{ backgroundColor: '#FAEAB1' }}>
            <Shield className="w-5 h-5" style={{ color: '#334443' }} />
            <span className="text-sm font-medium" style={{ color: '#334443' }}>Secure Portal</span>
          </div>
        </div>

        {currentBooking && (
          <Card className="mb-8 border-0 shadow-xl overflow-hidden relative" style={{ backgroundColor: '#FAEAB1' }}>
            <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: '#34656D' }}></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#34656D' }}>
                    <Bed className="w-6 h-6" style={{ color: '#FAF8F1' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="px-3 py-1 rounded-full" style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}>
                        Current Stay
                      </Badge>
                      <span className="text-sm" style={{ color: '#334443' }}>
                        Until {new Date(currentBooking.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-xl" style={{ color: '#334443' }}>
                      {currentBooking.rooms.room_type} at {currentBooking.rooms.hotel?.property_name}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: '#34656D' }}>
                      {currentBooking.rooms.hotel?.town}, {currentBooking.rooms.hotel?.state}
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: '#FAF8F1' }}>
                  <Clock className="w-4 h-4" style={{ color: '#34656D' }} />
                  <span className="text-sm font-medium" style={{ color: '#334443' }}>Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="bookings" className="mt-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-3 p-2 h-auto rounded-2xl" style={{ backgroundColor: '#FAEAB1' }}>
            <TabsTrigger 
              value="bookings" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 data-[state=active]:shadow-lg"
              style={{ 
                backgroundColor: 'transparent',
                color: '#334443'
              }}
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#34656D20' }}>
                <Calendar className="w-4 h-4" style={{ color: '#34656D' }} />
              </div>
              <span className="font-medium">Bookings</span>
            </TabsTrigger>
            <TabsTrigger 
              value="room-service" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 data-[state=active]:shadow-lg"
              style={{ 
                backgroundColor: 'transparent',
                color: '#334443'
              }}
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#34656D20' }}>
                <Coffee className="w-4 h-4" style={{ color: '#34656D' }} />
              </div>
              <span className="font-medium">Room Service</span>
            </TabsTrigger>
            <TabsTrigger 
              value="housekeeping" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 data-[state=active]:shadow-lg"
              style={{ 
                backgroundColor: 'transparent',
                color: '#334443'
              }}
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#34656D20' }}>
                <Sparkles className="w-4 h-4" style={{ color: '#34656D' }} />
              </div>
              <span className="font-medium">Housekeeping</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 data-[state=active]:shadow-lg"
              style={{ 
                backgroundColor: 'transparent',
                color: '#334443'
              }}
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#34656D20' }}>
                <CreditCard className="w-4 h-4" style={{ color: '#34656D' }} />
              </div>
              <span className="font-medium">Payments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="feedback" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 data-[state=active]:shadow-lg"
              style={{ 
                backgroundColor: 'transparent',
                color: '#334443'
              }}
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#34656D20' }}>
                <Heart className="w-4 h-4" style={{ color: '#34656D' }} />
              </div>
              <span className="font-medium">Feedback</span>
            </TabsTrigger>
            <TabsTrigger 
              value="floor-maps" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 data-[state=active]:shadow-lg"
              style={{ 
                backgroundColor: 'transparent',
                color: '#334443'
              }}
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#34656D20' }}>
                <MapPin className="w-4 h-4" style={{ color: '#34656D' }} />
              </div>
              <span className="font-medium">Maps</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-1">
              <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
                <div className="h-2" style={{ backgroundColor: '#34656D' }}></div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                    <Calendar className="w-6 h-6" style={{ color: '#34656D' }} />
                    Your Bookings
                  </CardTitle>
                  <CardDescription style={{ color: '#34656D' }}>
                    Past and upcoming reservations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                      <h3 className="text-xl font-semibold mb-2" style={{ color: '#334443' }}>No bookings yet</h3>
                      <p style={{ color: '#34656D' }}>Book your first stay to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map(booking => (
                        <div key={booking.id} className="p-6 border rounded-2xl transition-all duration-300 hover:shadow-lg" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-lg mb-1" style={{ color: '#334443' }}>{booking.rooms.room_type}</h4>
                              <p className="text-sm" style={{ color: '#34656D' }}>
                                {booking.rooms.hotel?.property_name}
                              </p>
                            </div>
                            <Badge className="px-3 py-1 rounded-full font-medium" style={{ 
                              backgroundColor: new Date(booking.end_date) < new Date() ? '#FAEAB1' : 
                                new Date(booking.start_date) <= new Date() ? '#34656D' : '#33444320',
                              color: new Date(booking.end_date) < new Date() ? '#334443' : '#FAF8F1'
                            }}>
                              {new Date(booking.end_date) < new Date() ? "Completed" : 
                               new Date(booking.start_date) <= new Date() ? "Active" : "Upcoming"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span style={{ color: '#34656D' }}>Check-in:</span>
                              <p className="font-medium mt-1" style={{ color: '#334443' }}>{new Date(booking.start_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span style={{ color: '#34656D' }}>Check-out:</span>
                              <p className="font-medium mt-1" style={{ color: '#334443' }}>{new Date(booking.end_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span style={{ color: '#34656D' }}>Nights:</span>
                              <p className="font-medium mt-1" style={{ color: '#334443' }}>{booking.days}</p>
                            </div>
                            <div>
                              <span style={{ color: '#34656D' }}>Total:</span>
                              <p className="font-medium mt-1" style={{ color: '#334443' }}>₹{booking.rooms.price * booking.days}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="room-service" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
                <div className="h-2" style={{ backgroundColor: '#34656D' }}></div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                    <Coffee className="w-6 h-6" style={{ color: '#34656D' }} />
                    Room Service
                  </CardTitle>
                  <CardDescription style={{ color: '#34656D' }}>
                    Order food or amenities to your room
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!currentBooking ? (
                    <div className="text-center py-12">
                      <Coffee className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                      <h3 className="text-xl font-semibold mb-2" style={{ color: '#334443' }}>No active booking</h3>
                      <p style={{ color: '#34656D' }}>
                        You need an active booking to request room service
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Item Requested</label>
                        <Input 
                          placeholder="e.g. Caesar Salad, Extra Towels, Bottled Water" 
                          value={roomServiceForm.item}
                          onChange={(e) => setRoomServiceForm(prev => ({ ...prev, item: e.target.value }))}
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Preferred Time</label>
                        <Input 
                          type="time" 
                          value={roomServiceForm.preferredTime}
                          onChange={(e) => setRoomServiceForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                      </div>
                      <Button 
                        onClick={handleRoomService}
                        disabled={!roomServiceForm.item || !roomServiceForm.preferredTime}
                        className="w-full py-3 rounded-xl text-lg font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                        style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}
                      >
                        <Coffee className="w-5 h-5 mr-2" />
                        Request Room Service
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
                <div className="h-2" style={{ backgroundColor: '#334443' }}></div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                    <MessageSquare className="w-6 h-6" style={{ color: '#34656D' }} />
                    Recent Requests
                  </CardTitle>
                  <CardDescription style={{ color: '#34656D' }}>
                    Your room service history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {roomServiceOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                      <p style={{ color: '#34656D' }}>No room service requests yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {roomServiceOrders.map(order => (
                        <div key={order.id} className="p-4 border rounded-xl transition-all duration-300 hover:shadow-md" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-lg mb-1" style={{ color: '#334443' }}>{order.item_name}</h4>
                              <p className="text-sm mb-1" style={{ color: '#34656D' }}>
                                Preferred time: {order.preferred_time}
                              </p>
                              <p className="text-xs" style={{ color: '#34656D' }}>
                                {new Date(order.created_at!).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className="px-3 py-1 rounded-full font-medium" style={{ 
                              backgroundColor: order.status === 'completed' ? '#34656D' : 
                                order.status === 'in-progress' ? '#FAEAB1' : '#33444320',
                              color: order.status === 'completed' ? '#FAF8F1' : '#334443'
                            }}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="housekeeping" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
                <div className="h-2" style={{ backgroundColor: '#34656D' }}></div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                    <Sparkles className="w-6 h-6" style={{ color: '#34656D' }} />
                    Housekeeping Services
                  </CardTitle>
                  <CardDescription style={{ color: '#34656D' }}>
                    Schedule cleaning or maintenance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!currentBooking ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                      <h3 className="text-xl font-semibold mb-2" style={{ color: '#334443' }}>No active booking</h3>
                      <p style={{ color: '#34656D' }}>
                        You need an active booking to request housekeeping
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Service Type</label>
                        <Select 
                          value={housekeepingForm.serviceType} 
                          onValueChange={(value) => setHousekeepingForm(prev => ({ ...prev, serviceType: value }))}
                        >
                          <SelectTrigger className="rounded-lg border-2" style={{ borderColor: '#FAEAB1' }}>
                            <SelectValue placeholder="Select service type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="refresh">Refresh Room</SelectItem>
                            <SelectItem value="full">Full Cleaning</SelectItem>
                            <SelectItem value="maintenance">Maintenance Issue</SelectItem>
                            <SelectItem value="linen">Linen Change</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Preferred Time</label>
                        <Input 
                          type="datetime-local"
                          value={housekeepingForm.preferredTime}
                          onChange={(e) => setHousekeepingForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                      </div>
                      <Button 
                        onClick={handleHousekeepingRequest}
                        disabled={!housekeepingForm.preferredTime}
                        className="w-full py-3 rounded-xl text-lg font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                        style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Request Housekeeping
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
                <div className="h-2" style={{ backgroundColor: '#334443' }}></div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                    <MessageSquare className="w-6 h-6" style={{ color: '#34656D' }} />
                    Recent Requests
                  </CardTitle>
                  <CardDescription style={{ color: '#34656D' }}>
                    Your housekeeping history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {housekeepingRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                      <p style={{ color: '#34656D' }}>No housekeeping requests yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {housekeepingRequests.map(request => (
                        <div key={request.id} className="p-4 border rounded-xl transition-all duration-300 hover:shadow-md" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-lg mb-1 capitalize" style={{ color: '#334443' }}>{request.service_type}</h4>
                              <p className="text-sm mb-1" style={{ color: '#34656D' }}>
                                Preferred time: {new Date(request.preferred_time).toLocaleString()}
                              </p>
                              <p className="text-xs" style={{ color: '#34656D' }}>
                                {new Date(request.created_at!).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className="px-3 py-1 rounded-full font-medium" style={{ 
                              backgroundColor: request.status === 'completed' ? '#34656D' : 
                                request.status === 'in-progress' ? '#FAEAB1' : '#33444320',
                              color: request.status === 'completed' ? '#FAF8F1' : '#334443'
                            }}>
                              {request.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
                <div className="h-2" style={{ backgroundColor: '#34656D' }}></div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                    <CreditCard className="w-6 h-6" style={{ color: '#34656D' }} />
                    Make a Payment
                  </CardTitle>
                  <CardDescription style={{ color: '#34656D' }}>
                    Pay for your stay or additional services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!currentBooking ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                      <h3 className="text-xl font-semibold mb-2" style={{ color: '#334443' }}>No active booking</h3>
                      <p style={{ color: '#34656D' }}>
                        You need an active booking to make a payment
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Amount (₹)</label>
                        <Input 
                          type="number" 
                          min="1" 
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                          placeholder="Enter amount"
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Payment Method</label>
                        <Select 
                          value={paymentForm.paymentMethod} 
                          onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}
                        >
                          <SelectTrigger className="rounded-lg border-2" style={{ borderColor: '#FAEAB1' }}>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="card">Credit/Debit Card</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="netbanking">Net Banking</SelectItem>
                            <SelectItem value="wallet">Wallet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handlePayment}
                        disabled={!paymentForm.amount}
                        className="w-full py-3 rounded-xl text-lg font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                        style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        Process Payment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
                <div className="h-2" style={{ backgroundColor: '#334443' }}></div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                    <CreditCard className="w-6 h-6" style={{ color: '#34656D' }} />
                    Payment History
                  </CardTitle>
                  <CardDescription style={{ color: '#34656D' }}>
                    Your transaction history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                      <p style={{ color: '#34656D' }}>No payments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments.map(payment => (
                        <div key={payment.id} className="p-4 border rounded-xl transition-all duration-300 hover:shadow-md" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-lg mb-1" style={{ color: '#334443' }}>₹{payment.amount}</h4>
                              <p className="text-sm mb-1 capitalize" style={{ color: '#34656D' }}>
                                {payment.payment_method} • {payment.status}
                              </p>
                              <p className="text-xs" style={{ color: '#34656D' }}>
                                {new Date(payment.created_at!).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className="px-3 py-1 rounded-full font-medium" style={{ 
                              backgroundColor: payment.status === 'completed' ? '#34656D' : '#33444320',
                              color: payment.status === 'completed' ? '#FAF8F1' : '#334443'
                            }}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
                <div className="h-2" style={{ backgroundColor: '#34656D' }}></div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                    <Heart className="w-6 h-6" style={{ color: '#34656D' }} />
                    Share Your Feedback
                  </CardTitle>
                  <CardDescription style={{ color: '#34656D' }}>
                    Help us improve your experience at STAYSYNC
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!currentBooking ? (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                      <h3 className="text-xl font-semibold mb-2" style={{ color: '#334443' }}>No active booking</h3>
                      <p style={{ color: '#34656D' }}>
                        You need an active booking to submit feedback
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                              className={`text-3xl transition-all duration-300 transform hover:scale-110 ${
                                star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Comments</label>
                        <Textarea
                          placeholder="Tell us about your experience..."
                          value={feedback.comment}
                          onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                          rows={4}
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                      </div>
                      
                      <Button 
                        onClick={handleFeedbackSubmit}
                        disabled={!feedback.comment}
                        className="w-full py-3 rounded-xl text-lg font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                        style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}
                      >
                        <Heart className="w-5 h-5 mr-2" />
                        Submit Feedback
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
                <div className="h-2" style={{ backgroundColor: '#334443' }}></div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                    <MessageSquare className="w-6 h-6" style={{ color: '#34656D' }} />
                    Your Feedback History
                  </CardTitle>
                  <CardDescription style={{ color: '#34656D' }}>
                    Reviews you've submitted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {feedbacks.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                      <p style={{ color: '#34656D' }}>No feedback submitted yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedbacks.map(fb => (
                        <div key={fb.id} className="p-4 border rounded-xl transition-all duration-300 hover:shadow-md" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-xl ${
                                    star <= fb.rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-xs" style={{ color: '#34656D' }}>
                              {new Date(fb.created_at!).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: '#334443' }}>{fb.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="floor-maps" className="space-y-6 mt-6">
            <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
              <div className="h-2" style={{ backgroundColor: '#34656D' }}></div>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                  <MapPin className="w-6 h-6" style={{ color: '#34656D' }} />
                  Interactive Floor Maps
                </CardTitle>
                <CardDescription style={{ color: '#34656D' }}>
                  Click on any available room to select it for booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1" style={{ color: '#334443' }}>Select a Floor</h3>
                    <p style={{ color: '#34656D' }}>Rooms are color-coded by availability</p>
                  </div>
                  <Select value={selectedFloor.toString()} onValueChange={(v) => setSelectedFloor(Number(v))}>
                    <SelectTrigger className="w-48 rounded-lg border-2" style={{ borderColor: '#FAEAB1' }}>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.map(floor => (
                        <SelectItem key={floor.number} value={floor.number.toString()}>
                          {floor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border-2 rounded-2xl p-6" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                  <FloorMap 
                    floorNumber={selectedFloor} 
                    interactive={true}
                    onRoomSelect={handleRoomSelect}
                    selectedRoomId={selectedRoom?.id}
                  />
                </div>
                
                {selectedRoom && (
                  <div className="mt-6 p-6 border-2 rounded-2xl transition-all duration-300" style={{ borderColor: '#34656D', backgroundColor: '#FAEAB1' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg mb-1" style={{ color: '#334443' }}>Selected: Room {selectedRoom.id}</p>
                        <p className="text-sm" style={{ color: '#34656D' }}>
                          {selectedRoom.room_type} - ₹{selectedRoom.price}/night
                        </p>
                      </div>
                      <Button 
                        onClick={() => {
                          const bookingTab = document.querySelector('[value="bookings"]') as HTMLElement;
                          bookingTab?.click();
                        }}
                        className="rounded-lg font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                        style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}
                      >
                        Book This Room
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
};

export default UserPortal;