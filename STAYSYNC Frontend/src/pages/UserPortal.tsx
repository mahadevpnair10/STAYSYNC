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
  Edit
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
  };
  hotel?: {
    property_name: string;
    town: string;
    state: string;
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
}

interface HousekeepingRequest {
  id?: number;
  booking_id: number;
  user_id: string;
  service_type: string;
  preferred_time: string;
  status: string;
  created_at?: string;
}

interface Feedback {
  id?: number;
  booking_id: number;
  user_id: string;
  rating: number;
  comment: string;
  created_at?: string;
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

        // Fetch user's bookings with room details
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

        // Get hotel IDs from the rooms
        const hotelIds = bookingsData
          ?.map(booking => booking.rooms?.hotel_id)
          .filter((id, index, arr) => id && arr.indexOf(id) === index) || [];

        // Fetch hotel details for these IDs
        let hotelsMap = {};
        if (hotelIds.length > 0) {
          const { data: hotelsData, error: hotelsError } = await supabase
            .from('hotel')
            .select('property_id, property_name, town, state')
            .in('property_id', hotelIds);

          if (hotelsError) throw hotelsError;
          
          // Create a mapping of hotel_id to hotel data
          hotelsMap = hotelsData?.reduce((acc, hotel) => {
            acc[hotel.property_id] = hotel;
            return acc;
          }, {}) || {};
        }

        // Combine bookings with hotel data
        const bookingsWithHotels = bookingsData?.map(booking => ({
          ...booking,
          hotel: hotelsMap[booking.rooms?.hotel_id] || null
        })) || [];

        setBookings(bookingsWithHotels);

        // Set current active booking if exists
        const today = new Date().toISOString().split('T')[0];
        const active = bookingsWithHotels.find(b => 
          b.start_date <= today && b.end_date >= today
        );
        setCurrentBooking(active || null);

        // The rest of your data fetching code remains the same...
        const { data: roomServiceData, error: roomServiceError } = await supabase
          .from('room_service_orders')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (roomServiceError) throw roomServiceError;
        setRoomServiceOrders(roomServiceData || []);

        // Continue with other data fetches...

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
          total_amount: 0 // In a real app, you'd calculate this based on menu items
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
          status: 'pending'
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
          booking_id: currentBooking.id,
          user_id: user.id,
          rating: feedback.rating,
          comment: feedback.comment
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

      const { data, error } = await supabase
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
          ),
          hotel:hotel(property_name, town, state)
        `)
        .single();

      if (error) throw error;

      setBookings(prev => [data, ...prev]);
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
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <SEO
        title="User Portal"
        description="Book rooms, request room service, housekeeping, and make payments."
        canonical="/user"
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-full">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">User Portal</h1>
          <p className="mt-1 text-muted-foreground">Welcome back, {user?.email}</p>
        </div>
      </div>

      {currentBooking && (
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    Current Stay
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Until {new Date(currentBooking.end_date).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold">
                  {currentBooking.rooms.room_type} at {currentBooking.hotel?.property_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentBooking.hotel?.town}, {currentBooking.hotel?.state}
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Manage Stay
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="bookings" className="mt-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 p-1 bg-muted/50 h-auto">
          <TabsTrigger value="bookings" className="flex items-center gap-2 py-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Bookings</span>
          </TabsTrigger>
          <TabsTrigger value="room-service" className="flex items-center gap-2 py-2">
            <Utensils className="w-4 h-4" />
            <span className="hidden sm:inline">Room Service</span>
          </TabsTrigger>
          <TabsTrigger value="housekeeping" className="flex items-center gap-2 py-2">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Housekeeping</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2 py-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2 py-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="floor-maps" className="flex items-center gap-2 py-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Maps</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>Past and upcoming reservations</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No bookings yet</h3>
                    <p className="text-muted-foreground mt-2">Book your first stay to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map(booking => (
                      <div key={booking.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{booking.rooms.room_type}</h4>
                            <p className="text-sm text-muted-foreground">
                              {booking.hotel?.property_name}
                            </p>
                          </div>
                          <Badge variant={
                            new Date(booking.end_date) < new Date() ? "outline" : 
                            new Date(booking.start_date) <= new Date() ? "default" : "secondary"
                          }>
                            {new Date(booking.end_date) < new Date() ? "Completed" : 
                             new Date(booking.start_date) <= new Date() ? "Active" : "Upcoming"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                          <div>
                            <span className="text-muted-foreground">Check-in:</span>
                            <p>{new Date(booking.start_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Check-out:</span>
                            <p>{new Date(booking.end_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Nights:</span>
                            <p>{booking.days}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total:</span>
                            <p>₹{booking.rooms.price * booking.days}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Book a New Room</CardTitle>
                <CardDescription>
                  {selectedRoom ? "Complete your reservation" : "Select a room from the floor maps"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRoom ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Room {selectedRoom.id}</span>
                        <Badge variant="default">
                          {selectedRoom.room_type}
                        </Badge>
                      </div>
                      <p className="text-lg font-semibold">₹{selectedRoom.price}/night</p>
                      <p className="text-sm text-muted-foreground">Floor {selectedRoom.floor}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Guest Name</label>
                        <Input 
                          value={bookingForm.guestName} 
                          onChange={(e) => setBookingForm(prev => ({ ...prev, guestName: e.target.value }))}
                          placeholder="Your full name" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Check-in</label>
                          <Input 
                            type="date" 
                            value={bookingForm.checkIn}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, checkIn: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Check-out</label>
                          <Input 
                            type="date"
                            value={bookingForm.checkOut}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, checkOut: e.target.value }))}
                            min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                      
                      {bookingForm.checkIn && bookingForm.checkOut && (
                        <div className="p-3 bg-primary/5 rounded-lg">
                          <div className="flex justify-between">
                            <span>Total nights:</span>
                            <span>
                              {Math.ceil(
                                (new Date(bookingForm.checkOut).getTime() - 
                                 new Date(bookingForm.checkIn).getTime()) / 
                                (1000 * 60 * 60 * 24)
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold mt-1">
                            <span>Total amount:</span>
                            <span>
                              ₹{selectedRoom.price * Math.ceil(
                                (new Date(bookingForm.checkOut).getTime() - 
                                 new Date(bookingForm.checkIn).getTime()) / 
                                (1000 * 60 * 60 * 24)
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className="w-full" 
                        onClick={handleBookRoom}
                        disabled={!bookingForm.guestName || !bookingForm.checkIn || !bookingForm.checkOut}
                      >
                        Confirm Booking
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No room selected</h3>
                    <p className="text-muted-foreground mt-2 mb-4">
                      Go to the Maps tab to select a room for booking
                    </p>
                    <Button onClick={() => {
                      const mapsTab = document.querySelector('[value="floor-maps"]') as HTMLElement;
                      mapsTab?.click();
                    }}>
                      View Floor Maps
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="room-service" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Room Service</CardTitle>
                <CardDescription>Order food or amenities to your room</CardDescription>
              </CardHeader>
              <CardContent>
                {!currentBooking ? (
                  <div className="text-center py-8">
                    <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No active booking</h3>
                    <p className="text-muted-foreground mt-2">
                      You need an active booking to request room service
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Item Requested</label>
                      <Input 
                        placeholder="e.g. Caesar Salad, Extra Towels, Bottled Water" 
                        value={roomServiceForm.item}
                        onChange={(e) => setRoomServiceForm(prev => ({ ...prev, item: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Preferred Time</label>
                      <Input 
                        type="time" 
                        value={roomServiceForm.preferredTime}
                        onChange={(e) => setRoomServiceForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                      />
                    </div>
                    <Button 
                      onClick={handleRoomService}
                      disabled={!roomServiceForm.item || !roomServiceForm.preferredTime}
                      className="w-full"
                    >
                      <Utensils className="w-4 h-4 mr-2" />
                      Request Room Service
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Requests</CardTitle>
                <CardDescription>Your room service history</CardDescription>
              </CardHeader>
              <CardContent>
                {roomServiceOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No room service requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roomServiceOrders.map(order => (
                      <div key={order.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{order.item_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Preferred time: {order.preferred_time}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at!).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={
                            order.status === 'completed' ? 'default' : 
                            order.status === 'in-progress' ? 'secondary' : 'outline'
                          }>
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
            <Card>
              <CardHeader>
                <CardTitle>Housekeeping Services</CardTitle>
                <CardDescription>Schedule cleaning or maintenance</CardDescription>
              </CardHeader>
              <CardContent>
                {!currentBooking ? (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No active booking</h3>
                    <p className="text-muted-foreground mt-2">
                      You need an active booking to request housekeeping
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Service Type</label>
                      <Select 
                        value={housekeepingForm.serviceType} 
                        onValueChange={(value) => setHousekeepingForm(prev => ({ ...prev, serviceType: value }))}
                      >
                        <SelectTrigger>
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
                      <label className="text-sm font-medium mb-1 block">Preferred Time</label>
                      <Input 
                        type="datetime-local"
                        value={housekeepingForm.preferredTime}
                        onChange={(e) => setHousekeepingForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                      />
                    </div>
                    <Button 
                      onClick={handleHousekeepingRequest}
                      disabled={!housekeepingForm.preferredTime}
                      className="w-full"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Request Housekeeping
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Requests</CardTitle>
                <CardDescription>Your housekeeping history</CardDescription>
              </CardHeader>
              <CardContent>
                {housekeepingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No housekeeping requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {housekeepingRequests.map(request => (
                      <div key={request.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium capitalize">{request.service_type}</h4>
                            <p className="text-sm text-muted-foreground">
                              Preferred time: {new Date(request.preferred_time).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.created_at!).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={
                            request.status === 'completed' ? 'default' : 
                            request.status === 'in-progress' ? 'secondary' : 'outline'
                          }>
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
            <Card>
              <CardHeader>
                <CardTitle>Make a Payment</CardTitle>
                <CardDescription>Pay for your stay or additional services</CardDescription>
              </CardHeader>
              <CardContent>
                {!currentBooking ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No active booking</h3>
                    <p className="text-muted-foreground mt-2">
                      You need an active booking to make a payment
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Amount (₹)</label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Payment Method</label>
                      <Select 
                        value={paymentForm.paymentMethod} 
                        onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}
                      >
                        <SelectTrigger>
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
                      className="w-full"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Process Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No payments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map(payment => (
                      <div key={payment.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">₹{payment.amount}</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {payment.payment_method} • {payment.status}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.created_at!).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={payment.status === 'completed' ? 'default' : 'outline'}>
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
            <Card>
              <CardHeader>
                <CardTitle>Share Your Feedback</CardTitle>
                <CardDescription>Help us improve your experience at STAYSYNC</CardDescription>
              </CardHeader>
              <CardContent>
                {!currentBooking ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No active booking</h3>
                    <p className="text-muted-foreground mt-2">
                      You need an active booking to submit feedback
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                            className={`text-2xl transition-colors ${
                              star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Comments</label>
                      <Textarea
                        placeholder="Tell us about your experience..."
                        value={feedback.comment}
                        onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleFeedbackSubmit}
                      disabled={!feedback.comment}
                      className="w-full"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Feedback History</CardTitle>
                <CardDescription>Reviews you've submitted</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbacks.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No feedback submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feedbacks.map(fb => (
                      <div key={fb.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-lg ${
                                  star <= fb.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(fb.created_at!).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{fb.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="floor-maps" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Floor Maps</CardTitle>
              <CardDescription>Click on any available room to select it for booking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Select a Floor</h3>
                  <p className="text-muted-foreground">Rooms are color-coded by availability</p>
                </div>
                <Select value={selectedFloor.toString()} onValueChange={(v) => setSelectedFloor(Number(v))}>
                  <SelectTrigger className="w-48">
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
              
              <div className="border rounded-lg p-4 bg-muted/20">
                <FloorMap 
                  floorNumber={selectedFloor} 
                  interactive={true}
                  onRoomSelect={handleRoomSelect}
                  selectedRoomId={selectedRoom?.id}
                />
              </div>
              
              {selectedRoom && (
                <div className="mt-4 p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Selected: Room {selectedRoom.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRoom.room_type} - ₹{selectedRoom.price}/night
                      </p>
                    </div>
                    <Button onClick={() => {
                      const bookingTab = document.querySelector('[value="bookings"]') as HTMLElement;
                      bookingTab?.click();
                    }}>
                      Book This Room
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default UserPortal;