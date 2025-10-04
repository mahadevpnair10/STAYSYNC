import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { supabase } from "@/../supabaseClient";
import { 
  Building, 
  MapPin, 
  Coffee, 
  Sparkles, 
  MessageSquare,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  User,
  Bed,
  X,
  Image
} from "lucide-react";

interface Hotel {
  property_id: number;
  property_name: string;
  property_type: string;
  star_rating: number;
  address: string;
  town: string;
  state: string;
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

interface Room {
  id: number;
  hotel_id: number;
  room_type: string;
  price: number;
  booked_till?: string | null;
  room_images?: string[] | null;
  status?: 'available' | 'occupied' | 'maintenance';
}

interface RoomServiceOrder {
  id: number;
  booking_id: number;
  user_id: string;
  item_name: string;
  preferred_time: string;
  status: string;
  total_amount: number;
  created_at: string;
  property_id: number;
  profiles?: {
    name: string;
    email: string;
  };
  bookings?: {
    rooms?: {
      room_type: string;
    };
  };
}

interface HousekeepingRequest {
  id: number;
  booking_id: number;
  user_id: string;
  service_type: string;
  preferred_time: string;
  status: string;
  created_at: string;
  property_id: number;
  profiles?: {
    name: string;
    email: string;
  };
  bookings?: {
    rooms?: {
      room_type: string;
    };
  };
}

interface Feedback {
  id: number;
  booking_id: number;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
  };
  bookings?: {
    rooms?: {
      room_type: string;
      hotel_id: number;
    };
  };
}

const AdminPortal = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hotels");

  // Hotels state
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [hotelForm, setHotelForm] = useState({
    property_name: "",
    property_type: "",
    star_rating: 3,
    address: "",
    town: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    free_wifi: true,
    entire_property: true
  });

  // Room management state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomForm, setRoomForm] = useState({
    room_type: "",
    price: "",
    booked_till: "",
    room_images: [] as string[],
    status: "available" as "available" | "occupied" | "maintenance"
  });
  const [newImageUrl, setNewImageUrl] = useState("");

  // Room service state
  const [roomServiceOrders, setRoomServiceOrders] = useState<RoomServiceOrder[]>([]);
  const [roomServiceFilter, setRoomServiceFilter] = useState("all");

  // Housekeeping state
  const [housekeepingRequests, setHousekeepingRequests] = useState<HousekeepingRequest[]>([]);
  const [housekeepingFilter, setHousekeepingFilter] = useState("all");

  // Feedback state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  // Fetch user data and admin hotels
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authUser) throw new Error('Not authenticated');
        
        setUser(authUser);

        // Fetch admin's hotels
        const { data: hotelsData, error: hotelsError } = await supabase
          .from('hotel')
          .select('*')
          .eq('admin_id', authUser.id)
          .order('created_at', { ascending: false });

        if (hotelsError) throw hotelsError;
        setHotels(hotelsData || []);

        // If admin has hotels, fetch related data
        if (hotelsData && hotelsData.length > 0) {
          const hotelIds = hotelsData.map(h => h.property_id);

          // Fetch rooms for all hotels
          const { data: roomsData, error: roomsError } = await supabase
            .from('rooms')
            .select('*')
            .in('hotel_id', hotelIds)
            .order('id', { ascending: true });

          if (roomsError) throw roomsError;
          setRooms(roomsData || []);

          // Fetch room service orders
          const { data: roomServiceData, error: roomServiceError } = await supabase
            .from('room_service_orders')
            .select(`
              *,
              profiles(name, email),
              bookings(
                rooms(room_type)
              )
            `)
            .in('property_id', hotelIds)
            .order('created_at', { ascending: false });

          if (roomServiceError) throw roomServiceError;
          setRoomServiceOrders(roomServiceData || []);

          // Fetch housekeeping requests
          const { data: housekeepingData, error: housekeepingError } = await supabase
            .from('housekeeping_requests')
            .select(`
              *,
              profiles(name, email),
              bookings(
                rooms(room_type)
              )
            `)
            .in('property_id', hotelIds)
            .order('created_at', { ascending: false });



          if (housekeepingError) throw housekeepingError;
          setHousekeepingRequests(housekeepingData || []);

          // Fetch feedbacks
            // hotelIds: number[] (e.g. [123, 456])
            const { data: feedbackData, error: feedbackError } = await supabase
            .from('feedback')
            .select(`
                *,
                profiles(name, email)
            `)
            .in('property_id', hotelIds)
            .order('created_at', { ascending: false });

            if (feedbackError) throw feedbackError;
            setFeedbacks(feedbackData || []);

        }

      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: "Error",
          description: "Failed to load admin data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [toast]);

  // Create new hotel
  const handleCreateHotel = async () => {
    if (!user) return;

    try {
      // Generate a unique property_id (in real app, you might want a better approach)
      const property_id = Date.now();

      const { data, error } = await supabase
        .from('hotel')
        .insert({
          property_id,
          ...hotelForm,
          pincode: parseInt(hotelForm.pincode),
          latitude: parseFloat(hotelForm.latitude) || null,
          longitude: parseFloat(hotelForm.longitude) || null,
          admin_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setHotels(prev => [data, ...prev]);
      setShowHotelForm(false);
      setHotelForm({
        property_name: "",
        property_type: "",
        star_rating: 3,
        address: "",
        town: "",
        state: "",
        pincode: "",
        latitude: "",
        longitude: "",
        free_wifi: true,
        entire_property: true
      });

      toast({
        title: "Hotel created!",
        description: `${hotelForm.property_name} has been added successfully.`
      });

    } catch (error) {
      console.error('Error creating hotel:', error);
      toast({
        title: "Error",
        description: "Failed to create hotel",
        variant: "destructive"
      });
    }
  };

  // Create new room
  const handleCreateRoom = async () => {
    if (!selectedHotel) return;

    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          hotel_id: selectedHotel.property_id,
          room_type: roomForm.room_type,
          price: parseFloat(roomForm.price),
          booked_till: roomForm.booked_till || null,
          room_images: roomForm.room_images.length > 0 ? roomForm.room_images : null,
          status: roomForm.status
        })
        .select()
        .single();

      if (error) throw error;

      setRooms(prev => [data, ...prev]);
      setShowRoomForm(false);
      setRoomForm({
        room_type: "",
        price: "",
        booked_till: "",
        room_images: [],
        status: "available"
      });
      setNewImageUrl("");

      toast({
        title: "Room created!",
        description: `${roomForm.room_type} has been added to ${selectedHotel.property_name}.`
      });

    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive"
      });
    }
  };

  // Delete room
  const handleDeleteRoom = async (roomId: number) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      setRooms(prev => prev.filter(room => room.id !== roomId));

      toast({
        title: "Room deleted!",
        description: "Room has been removed successfully."
      });

    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive"
      });
    }
  };

  // Add image URL to room images
  const addImageUrl = () => {
    if (newImageUrl.trim() && !roomForm.room_images.includes(newImageUrl.trim())) {
      setRoomForm(prev => ({
        ...prev,
        room_images: [...prev.room_images, newImageUrl.trim()]
      }));
      setNewImageUrl("");
    }
  };

  // Remove image URL from room images
  const removeImageUrl = (imageUrl: string) => {
    setRoomForm(prev => ({
      ...prev,
      room_images: prev.room_images.filter(url => url !== imageUrl)
    }));
  };

  // Update room service order status
  const updateRoomServiceStatus = async (orderId: number, status: string) => {
    try {
      const { error } = await supabase
        .from('room_service_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      setRoomServiceOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status } : order
        )
      );

      toast({
        title: "Status updated!",
        description: `Room service order marked as ${status}`
      });

    } catch (error) {
      console.error('Error updating room service status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  // Update housekeeping request status
  const updateHousekeepingStatus = async (requestId: number, status: string) => {
    try {
      const { error } = await supabase
        .from('housekeeping_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      setHousekeepingRequests(prev => 
        prev.map(request => 
          request.id === requestId ? { ...request, status } : request
        )
      );

      toast({
        title: "Status updated!",
        description: `Housekeeping request marked as ${status}`
      });

    } catch (error) {
      console.error('Error updating housekeeping status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  // Filtered data
  const filteredRoomServiceOrders = roomServiceOrders.filter(order => 
    roomServiceFilter === "all" || order.status === roomServiceFilter
  );

  const filteredHousekeepingRequests = housekeepingRequests.filter(request => 
    housekeepingFilter === "all" || request.status === housekeepingFilter
  );

  // Get rooms for selected hotel
  const hotelRooms = selectedHotel 
    ? rooms.filter(room => room.hotel_id === selectedHotel.property_id)
    : [];

  if (loading) {
    return (
      <div className="container mx-auto py-10" style={{ backgroundColor: '#FAF8F1', minHeight: '100vh' }}>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: '#34656D' }}></div>
          <p style={{ color: '#334443' }}>Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4" style={{ backgroundColor: '#FAF8F1', minHeight: '100vh' }}>
      <SEO
        title="Admin Portal"
        description="Manage hotels, view requests, and monitor feedback."
        canonical="/admin"
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
              <Building className="w-8 h-8" style={{ color: '#FAF8F1' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: '#334443' }}>Admin Portal</h1>
              <p className="mt-1 text-lg" style={{ color: '#34656D' }}>Manage your hotels and services</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full shadow-sm" style={{ backgroundColor: '#FAEAB1' }}>
            <User className="w-5 h-5" style={{ color: '#334443' }} />
            <span className="text-sm font-medium" style={{ color: '#334443' }}>{user?.email}</span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#34656D' }}>Total Hotels</p>
                  <h3 className="text-2xl font-bold mt-1" style={{ color: '#334443' }}>{hotels.length}</h3>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#FAEAB1' }}>
                  <Building className="w-6 h-6" style={{ color: '#34656D' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#34656D' }}>Total Rooms</p>
                  <h3 className="text-2xl font-bold mt-1" style={{ color: '#334443' }}>{rooms.length}</h3>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#FAEAB1' }}>
                  <Bed className="w-6 h-6" style={{ color: '#34656D' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#34656D' }}>Pending Requests</p>
                  <h3 className="text-2xl font-bold mt-1" style={{ color: '#334443' }}>
                    {roomServiceOrders.filter(o => o.status === 'pending').length + 
                     housekeepingRequests.filter(h => h.status === 'pending').length}
                  </h3>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#FAEAB1' }}>
                  <Clock className="w-6 h-6" style={{ color: '#34656D' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#34656D' }}>Avg Rating</p>
                  <h3 className="text-2xl font-bold mt-1" style={{ color: '#334443' }}>
                    {feedbacks.length > 0 
                      ? (feedbacks.reduce((acc, fb) => acc + fb.rating, 0) / feedbacks.length).toFixed(1)
                      : '0.0'
                    }
                  </h3>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#FAEAB1' }}>
                  <Star className="w-6 h-6" style={{ color: '#34656D' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-3 p-2 h-auto rounded-2xl" style={{ backgroundColor: '#FAEAB1' }}>
            <TabsTrigger 
              value="hotels" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 data-[state=active]:shadow-lg"
              style={{ 
                backgroundColor: 'transparent',
                color: '#334443'
              }}
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#34656D20' }}>
                <Building className="w-4 h-4" style={{ color: '#34656D' }} />
              </div>
              <span className="font-medium">Hotels</span>
            </TabsTrigger>

            <TabsTrigger 
              value="maps" 
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
              value="feedback" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 data-[state=active]:shadow-lg"
              style={{ 
                backgroundColor: 'transparent',
                color: '#334443'
              }}
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#34656D20' }}>
                <MessageSquare className="w-4 h-4" style={{ color: '#34656D' }} />
              </div>
              <span className="font-medium">Feedback</span>
            </TabsTrigger>
          </TabsList>

          {/* Hotels Tab */}
          <TabsContent value="hotels" className="space-y-6 mt-6">
            <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
              <div className="h-2" style={{ backgroundColor: '#34656D' }}></div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                      <Building className="w-6 h-6" style={{ color: '#34656D' }} />
                      Hotel Management
                    </CardTitle>
                    <CardDescription style={{ color: '#34656D' }}>
                      Manage your hotel properties and details
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowHotelForm(true)}
                    className="transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                    style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Hotel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showHotelForm ? (
                  <div className="space-y-6 p-6 border-2 rounded-2xl mb-6" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                    <h3 className="text-xl font-bold" style={{ color: '#334443' }}>Add New Hotel</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Property Name</label>
                        <Input 
                          value={hotelForm.property_name}
                          onChange={(e) => setHotelForm(prev => ({ ...prev, property_name: e.target.value }))}
                          placeholder="Enter property name"
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Property Type</label>
                        <Select 
                          value={hotelForm.property_type} 
                          onValueChange={(value) => setHotelForm(prev => ({ ...prev, property_type: value }))}
                        >
                          <SelectTrigger className="rounded-lg border-2" style={{ borderColor: '#FAEAB1' }}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hotel">Hotel</SelectItem>
                            <SelectItem value="Resort">Resort</SelectItem>
                            <SelectItem value="Motel">Motel</SelectItem>
                            <SelectItem value="Guest House">Guest House</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Star Rating</label>
                        <Select 
                          value={hotelForm.star_rating.toString()} 
                          onValueChange={(value) => setHotelForm(prev => ({ ...prev, star_rating: parseInt(value) }))}
                        >
                          <SelectTrigger className="rounded-lg border-2" style={{ borderColor: '#FAEAB1' }}>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(star => (
                              <SelectItem key={star} value={star.toString()}>
                                {star} Star{star > 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Pincode</label>
                        <Input 
                          value={hotelForm.pincode}
                          onChange={(e) => setHotelForm(prev => ({ ...prev, pincode: e.target.value }))}
                          placeholder="Enter pincode"
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Town/City</label>
                        <Input 
                          value={hotelForm.town}
                          onChange={(e) => setHotelForm(prev => ({ ...prev, town: e.target.value }))}
                          placeholder="Enter town/city"
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>State</label>
                        <Input 
                          value={hotelForm.state}
                          onChange={(e) => setHotelForm(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="Enter state"
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Latitude</label>
                        <Input 
                          value={hotelForm.latitude}
                          onChange={(e) => setHotelForm(prev => ({ ...prev, latitude: e.target.value }))}
                          placeholder="Enter latitude"
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Longitude</label>
                        <Input 
                          value={hotelForm.longitude}
                          onChange={(e) => setHotelForm(prev => ({ ...prev, longitude: e.target.value }))}
                          placeholder="Enter longitude"
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Address</label>
                        <Textarea 
                          value={hotelForm.address}
                          onChange={(e) => setHotelForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter full address"
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleCreateHotel}
                        disabled={!hotelForm.property_name || !hotelForm.property_type}
                        className="transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                        style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}
                      >
                        Create Hotel
                      </Button>
                      <Button 
                        onClick={() => setShowHotelForm(false)}
                        variant="outline"
                        className="transition-all duration-300"
                        style={{ borderColor: '#34656D', color: '#34656D' }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}

                {hotels.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#334443' }}>No hotels yet</h3>
                    <p style={{ color: '#34656D' }}>Add your first hotel property to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hotels.map(hotel => (
                      <div key={hotel.property_id} className="p-6 border rounded-2xl transition-all duration-300 hover:shadow-lg" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-xl mb-2" style={{ color: '#334443' }}>{hotel.property_name}</h4>
                            <div className="flex items-center gap-4 flex-wrap">
                              <Badge className="px-3 py-1 rounded-full" style={{ backgroundColor: '#FAEAB1', color: '#334443' }}>
                                {hotel.property_type}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${i < hotel.star_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                              <span style={{ color: '#34656D' }}>{hotel.town}, {hotel.state}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              style={{ borderColor: '#34656D', color: '#34656D' }}
                              onClick={() => {
                                setSelectedHotel(hotel);
                                setShowRoomForm(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" style={{ borderColor: '#34656D', color: '#34656D' }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm mb-3" style={{ color: '#334443' }}>{hotel.address}</p>
                        <div className="flex items-center gap-4 text-sm">
                          {hotel.free_wifi && (
                            <Badge variant="outline" style={{ borderColor: '#34656D', color: '#34656D' }}>
                              Free WiFi
                            </Badge>
                          )}
                          {hotel.entire_property && (
                            <Badge variant="outline" style={{ borderColor: '#34656D', color: '#34656D' }}>
                              Entire Property
                            </Badge>
                          )}
                          {hotel.latitude && hotel.longitude && (
                            <Badge variant="outline" style={{ borderColor: '#34656D', color: '#34656D' }}>
                              Location Set
                            </Badge>
                          )}
                          <Badge variant="outline" style={{ borderColor: '#34656D', color: '#34656D' }}>
                            {rooms.filter(room => room.hotel_id === hotel.property_id).length} Rooms
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maps Tab */}
          <TabsContent value="maps" className="space-y-6 mt-6">
            <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
              <div className="h-2" style={{ backgroundColor: '#34656D' }}></div>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                  <MapPin className="w-6 h-6" style={{ color: '#34656D' }} />
                  Hotel Locations
                </CardTitle>
                <CardDescription style={{ color: '#34656D' }}>
                  View your hotel properties on the map
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hotels.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#334443' }}>No hotels to display</h3>
                    <p style={{ color: '#34656D' }}>Add hotels with location data to see them on the map</p>
                  </div>
                ) : hotels.filter(h => h.latitude && h.longitude).length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#334443' }}>No location data</h3>
                    <p style={{ color: '#34656D' }}>Add latitude and longitude coordinates to your hotels to view them on the map</p>
                  </div>
                ) : (
                  <div
                    className="border-2 rounded-2xl overflow-hidden h-96"
                    style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}
                  >
                    {(() => {
                      const firstHotel = hotels.find(h => h.latitude && h.longitude);
                      if (!firstHotel) return null;
                      // Ensure values are safe for URL (they might be strings or numbers)
                      const lat = encodeURIComponent(firstHotel.latitude);
                      const lng = encodeURIComponent(firstHotel.longitude);
                      // Google Maps embed centered on the first hotel's coordinates
                      const src = `https://www.google.com/maps?q=${lat},${lng}&z=14&output=embed`;

                      return (
                        <iframe
                          title="Hotel Map"
                          src={src}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      );
                    })()}
                  </div>
                )}

                {/* Hotels list with coordinates */}
                {hotels.filter(h => h.latitude && h.longitude).length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4 text-lg" style={{ color: '#334443' }}>Hotels with Coordinates</h4>
                    <div className="space-y-3">
                      {hotels.filter(h => h.latitude && h.longitude).map(hotel => (
                        <div key={hotel.property_id} className="p-4 border rounded-xl" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-medium" style={{ color: '#334443' }}>{hotel.property_name}</h5>
                              <p className="text-sm" style={{ color: '#34656D' }}>
                                Lat: {hotel.latitude}, Lng: {hotel.longitude}
                              </p>
                            </div>
                            <Badge style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}>
                              {hotel.town}, {hotel.state}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Room Service Tab */}
          <TabsContent value="room-service" className="space-y-6 mt-6">
            <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
              <div className="h-2" style={{ backgroundColor: '#34656D' }}></div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                      <Coffee className="w-6 h-6" style={{ color: '#34656D' }} />
                      Room Service Requests
                    </CardTitle>
                    <CardDescription style={{ color: '#34656D' }}>
                      Manage room service orders from guests
                    </CardDescription>
                  </div>
                  <Select value={roomServiceFilter} onValueChange={setRoomServiceFilter}>
                    <SelectTrigger className="w-32 rounded-lg border-2" style={{ borderColor: '#FAEAB1' }}>
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {roomServiceOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Coffee className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#334443' }}>No room service requests</h3>
                    <p style={{ color: '#34656D' }}>Room service orders will appear here when guests make requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRoomServiceOrders.map(order => (
                      <div key={order.id} className="p-6 border rounded-2xl transition-all duration-300 hover:shadow-lg" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-lg mb-2" style={{ color: '#334443' }}>{order.item_name}</h4>
                            <div className="space-y-1 text-sm">
                              <p style={{ color: '#34656D' }}>
                                <strong>Guest:</strong> {order.profiles?.name || 'Unknown'} ({order.profiles?.email})
                              </p>
                              <p style={{ color: '#34656D' }}>
                                <strong>Room Type:</strong> {order.bookings?.rooms?.room_type || 'Unknown'}
                              </p>
                              <p style={{ color: '#34656D' }}>
                                <strong>Preferred Time:</strong> {order.preferred_time}
                              </p>
                              <p style={{ color: '#34656D' }}>
                                <strong>Amount:</strong> ₹{order.total_amount}
                              </p>
                              <p style={{ color: '#34656D' }}>
                                <strong>Requested:</strong> {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className="px-3 py-1 rounded-full font-medium" style={{ 
                              backgroundColor: order.status === 'completed' ? '#34656D' : 
                                order.status === 'in-progress' ? '#FAEAB1' : '#33444320',
                              color: order.status === 'completed' ? '#FAF8F1' : '#334443'
                            }}>
                              {order.status}
                            </Badge>
                            <div className="flex gap-2">
                              {order.status !== 'completed' && (
                                <Button 
                                  size="sm"
                                  onClick={() => updateRoomServiceStatus(order.id, 'completed')}
                                  className="transition-all duration-300"
                                  style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Complete
                                </Button>
                              )}
                              {order.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateRoomServiceStatus(order.id, 'in-progress')}
                                  style={{ borderColor: '#34656D', color: '#34656D' }}
                                >
                                  <Clock className="w-4 h-4 mr-1" />
                                  Start
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Housekeeping Tab */}
          <TabsContent value="housekeeping" className="space-y-6 mt-6">
            <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
              <div className="h-2" style={{ backgroundColor: '#34656D' }}></div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                      <Sparkles className="w-6 h-6" style={{ color: '#34656D' }} />
                      Housekeeping Requests
                    </CardTitle>
                    <CardDescription style={{ color: '#34656D' }}>
                      Manage housekeeping and maintenance requests
                    </CardDescription>
                  </div>
                  <Select value={housekeepingFilter} onValueChange={setHousekeepingFilter}>
                    <SelectTrigger className="w-32 rounded-lg border-2" style={{ borderColor: '#FAEAB1' }}>
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {housekeepingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#334443' }}>No housekeeping requests</h3>
                    <p style={{ color: '#34656D' }}>Housekeeping requests will appear here when guests make requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHousekeepingRequests.map(request => (
                      <div key={request.id} className="p-6 border rounded-2xl transition-all duration-300 hover:shadow-lg" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-lg mb-2 capitalize" style={{ color: '#334443' }}>{request.service_type}</h4>
                            <div className="space-y-1 text-sm">
                              <p style={{ color: '#34656D' }}>
                                <strong>Guest:</strong> {request.profiles?.name || 'Unknown'} ({request.profiles?.email})
                              </p>
                              <p style={{ color: '#34656D' }}>
                                <strong>Room Type:</strong> {request.bookings?.rooms?.room_type || 'Unknown'}
                              </p>
                              <p style={{ color: '#34656D' }}>
                                <strong>Preferred Time:</strong> {new Date(request.preferred_time).toLocaleString()}
                              </p>
                              <p style={{ color: '#34656D' }}>
                                <strong>Requested:</strong> {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className="px-3 py-1 rounded-full font-medium" style={{ 
                              backgroundColor: request.status === 'completed' ? '#34656D' : 
                                request.status === 'in-progress' ? '#FAEAB1' : '#33444320',
                              color: request.status === 'completed' ? '#FAF8F1' : '#334443'
                            }}>
                              {request.status}
                            </Badge>
                            <div className="flex gap-2">
                              {request.status !== 'completed' && (
                                <Button 
                                  size="sm"
                                  onClick={() => updateHousekeepingStatus(request.id, 'completed')}
                                  className="transition-all duration-300"
                                  style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Complete
                                </Button>
                              )}
                              {request.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateHousekeepingStatus(request.id, 'in-progress')}
                                  style={{ borderColor: '#34656D', color: '#34656D' }}
                                >
                                  <Clock className="w-4 h-4 mr-1" />
                                  Start
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6 mt-6">
            <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
              <div className="h-2" style={{ backgroundColor: '#34656D' }}></div>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#334443' }}>
                  <MessageSquare className="w-6 h-6" style={{ color: '#34656D' }} />
                  Guest Feedback
                </CardTitle>
                <CardDescription style={{ color: '#34656D' }}>
                  Reviews and feedback from your guests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedbacks.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: '#34656D' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#334443' }}>No feedback yet</h3>
                    <p style={{ color: '#34656D' }}>Guest feedback will appear here once they submit reviews</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Feedback Summary */}
                    <div className="p-6 border-2 rounded-2xl" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                      <h4 className="font-bold text-lg mb-4" style={{ color: '#334443' }}>Feedback Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold" style={{ color: '#334443' }}>{feedbacks.length}</p>
                          <p className="text-sm" style={{ color: '#34656D' }}>Total Reviews</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold" style={{ color: '#334443' }}>
                            {(feedbacks.reduce((acc, fb) => acc + fb.rating, 0) / feedbacks.length).toFixed(1)}
                          </p>
                          <p className="text-sm" style={{ color: '#34656D' }}>Average Rating</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold" style={{ color: '#334443' }}>
                            {feedbacks.filter(fb => fb.rating >= 4).length}
                          </p>
                          <p className="text-sm" style={{ color: '#34656D' }}>Positive Reviews</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold" style={{ color: '#334443' }}>
                            {feedbacks.filter(fb => fb.rating <= 2).length}
                          </p>
                          <p className="text-sm" style={{ color: '#34656D' }}>Needs Improvement</p>
                        </div>
                      </div>
                    </div>

                    {/* Feedback List */}
                    <div className="space-y-4">
                      {feedbacks.map(feedback => (
                        <div key={feedback.id} className="p-6 border rounded-2xl transition-all duration-300 hover:shadow-lg" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-lg mb-2" style={{ color: '#334443' }}>
                                {feedback.profiles?.name || 'Anonymous Guest'}
                              </h4>
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`w-5 h-5 ${star <= feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-sm" style={{ color: '#34656D' }}>
                                  {new Date(feedback.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Badge style={{ backgroundColor: 
                              feedback.rating >= 4 ? '#34656D' : 
                              feedback.rating >= 3 ? '#FAEAB1' : '#33444320',
                              color: feedback.rating >= 4 ? '#FAF8F1' : '#334443'
                            }}>
                              {feedback.rating >= 4 ? 'Excellent' : feedback.rating >= 3 ? 'Good' : 'Needs Improvement'}
                            </Badge>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: '#334443' }}>
                            {feedback.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Room Management Modal */}
      {showRoomForm && selectedHotel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="h-2" style={{ backgroundColor: '#34656D' }}></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#334443' }}>
                  Manage Rooms - {selectedHotel.property_name}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRoomForm(false);
                    setSelectedHotel(null);
                    setRoomForm({
                      room_type: "",
                      price: "",
                      booked_till: "",
                      room_images: [],
                      status: "available"
                    });
                    setNewImageUrl("");
                  }}
                  style={{ color: '#34656D' }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Add Room Form */}
              <div className="space-y-6 mb-8 p-4 border-2 rounded-xl" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                <h3 className="text-lg font-semibold" style={{ color: '#334443' }}>Add New Room</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Room Type</label>
                    <Input 
                      value={roomForm.room_type}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, room_type: e.target.value }))}
                      placeholder="e.g., Deluxe Suite, Standard Room"
                      className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                      style={{ borderColor: '#FAEAB1' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Price per Night (₹)</label>
                    <Input 
                      type="number"
                      value={roomForm.price}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="Enter price"
                      className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                      style={{ borderColor: '#FAEAB1' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Booked Till (Optional)</label>
                    <Input 
                      type="date"
                      value={roomForm.booked_till}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, booked_till: e.target.value }))}
                      className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                      style={{ borderColor: '#FAEAB1' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Status</label>
                    <Select 
                      value={roomForm.status} 
                      onValueChange={(value: "available" | "occupied" | "maintenance") => 
                        setRoomForm(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="rounded-lg border-2" style={{ borderColor: '#FAEAB1' }}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-2 block" style={{ color: '#334443' }}>Room Images (URLs)</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input 
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="Enter image URL"
                          className="rounded-lg border-2 transition-colors focus:border-[#34656D]"
                          style={{ borderColor: '#FAEAB1' }}
                        />
                        <Button 
                          onClick={addImageUrl}
                          disabled={!newImageUrl.trim()}
                          style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {roomForm.room_images.length > 0 && (
                        <div className="space-y-2">
                          {roomForm.room_images.map((url, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: '#FAEAB1' }}>
                              <Image className="w-4 h-4" style={{ color: '#34656D' }} />
                              <span className="text-sm flex-1 truncate" style={{ color: '#334443' }}>{url}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeImageUrl(url)}
                                style={{ color: '#34656D' }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleCreateRoom}
                  disabled={!roomForm.room_type || !roomForm.price}
                  className="w-full transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: '#34656D', color: '#FAF8F1' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </Button>
              </div>

              {/* Existing Rooms List */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#334443' }}>Existing Rooms</h3>
                {hotelRooms.length === 0 ? (
                  <div className="text-center py-8 border-2 rounded-xl" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                    <Bed className="w-12 h-12 mx-auto mb-4" style={{ color: '#34656D' }} />
                    <p style={{ color: '#34656D' }}>No rooms added yet. Add your first room above.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hotelRooms.map(room => (
                      <div key={room.id} className="p-4 border rounded-xl flex justify-between items-center" style={{ borderColor: '#FAEAB1', backgroundColor: '#FAF8F1' }}>
                        <div>
                          <h4 className="font-semibold" style={{ color: '#334443' }}>{room.room_type}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm" style={{ color: '#34656D' }}>₹{room.price}/night</span>
                            <Badge style={{ 
                              backgroundColor: room.status === 'available' ? '#34656D' : 
                                room.status === 'occupied' ? '#FAEAB1' : '#33444320',
                              color: room.status === 'available' ? '#FAF8F1' : '#334443'
                            }}>
                              {room.status}
                            </Badge>
                            {room.booked_till && (
                              <span className="text-xs" style={{ color: '#34656D' }}>
                                Booked till: {new Date(room.booked_till).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRoom(room.id)}
                          style={{ borderColor: '#34656D', color: '#34656D' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

export default AdminPortal;