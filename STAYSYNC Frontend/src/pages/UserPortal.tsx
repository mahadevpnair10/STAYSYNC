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
import { useState } from "react";
import { useHotel, Room } from "@/contexts/HotelContext";
import { FloorMap } from "@/components/FloorMap";

const UserPortal = () => {
  const { toast } = useToast();
  const { floors, rooms } = useHotel();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [bookings, setBookings] = useState<{ id: string; guest: string; room: string; date: string; status: string; }[]>([
    { id: "BK-1001", guest: "Alex Morgan", room: "Deluxe King 201", date: "2025-08-20", status: "confirmed" },
  ]);
  const [feedback, setFeedback] = useState({ rating: 5, comment: "" });

  return (
    <main className="container mx-auto py-10">
      <SEO
        title="User Portal"
        description="Book rooms, request room service, housekeeping, and make payments."
        canonical="/user"
      />

      <h1 className="text-3xl font-bold">User Portal</h1>
      <p className="mt-2 text-muted-foreground">Manage your stay: bookings, room service, housekeeping, and payments.</p>

      <Tabs defaultValue="booking" className="mt-8">
        <TabsList>
          <TabsTrigger value="booking">Room Selection</TabsTrigger>
          <TabsTrigger value="floor-maps">Floor Maps</TabsTrigger>
          <TabsTrigger value="room-service">Room Service</TabsTrigger>
          <TabsTrigger value="housekeeping">Housekeeping</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="booking" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Selected Room</CardTitle>
                <CardDescription>
                  {selectedRoom ? "Room details and booking information" : "Select a room from the floor maps to see details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRoom ? (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Room {selectedRoom.id}</span>
                        <Badge variant={selectedRoom.status === 'available' ? 'default' : 'secondary'}>
                          {selectedRoom.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedRoom.type}</p>
                      <p className="text-lg font-semibold">₹{selectedRoom.price.toLocaleString()}/night</p>
                      <p className="text-sm">Floor {selectedRoom.floor}</p>
                    </div>
                    
                    {selectedRoom.status === 'available' && (
                      <div className="space-y-3">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Guest Name</label>
                          <Input placeholder="Your full name" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-sm font-medium">Check-in</label>
                            <Input type="date" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Check-out</label>
                            <Input type="date" />
                          </div>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => {
                            const newBooking = {
                              id: `BK-${Date.now()}`,
                              guest: "Guest User",
                              room: `${selectedRoom.type} ${selectedRoom.id}`,
                              date: new Date().toISOString().split('T')[0],
                              status: "confirmed"
                            };
                            setBookings(prev => [newBooking, ...prev]);
                            toast({ title: "Booking confirmed!", description: `Room ${selectedRoom.id} booked successfully.` });
                          }}
                        >
                          Book Room {selectedRoom.id} - ₹{selectedRoom.price.toLocaleString()}
                        </Button>
                      </div>
                    )}
                    
                    {selectedRoom.status !== 'available' && (
                      <p className="text-sm text-muted-foreground">This room is currently not available for booking.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Go to Floor Maps tab and click on any available room to select it for booking.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>Recent and upcoming reservations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bookings.map(booking => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{booking.room}</p>
                        <p className="text-sm text-muted-foreground">{booking.date}</p>
                      </div>
                      <Badge variant="outline">{booking.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="floor-maps" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Interactive Floor Maps</h3>
              <p className="text-muted-foreground">Click on any available room to select it for booking</p>
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
          
          <FloorMap 
            floorNumber={selectedFloor} 
            interactive={true}
            onRoomSelect={setSelectedRoom}
            selectedRoomId={selectedRoom?.id}
          />
          
          {selectedRoom && (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">Selected: Room {selectedRoom.id}</p>
                  <p className="text-sm text-muted-foreground">{selectedRoom.type} - ₹{selectedRoom.price.toLocaleString()}/night</p>
                </div>
                <Button onClick={() => {
                  // Switch to booking tab
                  const bookingTab = document.querySelector('[value="booking"]') as HTMLElement;
                  bookingTab?.click();
                }}>
                  Book This Room
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="room-service">
          <Card>
            <CardHeader>
              <CardTitle>Room Service Request</CardTitle>
              <CardDescription>Order food or amenities to your room.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm">Item</label>
                <Input placeholder="e.g. Caesar Salad, Extra Towels" />
              </div>
              <div>
                <label className="mb-2 block text-sm">Preferred Time</label>
                <Input type="time" />
              </div>
              <div className="md:col-span-3">
                <Button onClick={() => toast({ title: "Room service requested", description: "We're on it!" })}>Submit Request</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="housekeeping">
          <Card>
            <CardHeader>
              <CardTitle>Housekeeping Request</CardTitle>
              <CardDescription>Schedule cleaning or maintenance.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm">Service</label>
                <Select defaultValue="full">
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refresh">Refresh</SelectItem>
                    <SelectItem value="full">Full Cleaning</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm">Preferred Time</label>
                <Input type="datetime-local" />
              </div>
              <div className="md:col-span-3">
                <Button onClick={() => toast({ title: "Housekeeping scheduled", description: "Thank you!" })}>Schedule</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Settle your stay securely.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm">Amount (₹)</label>
                <Input type="number" min={1} defaultValue={19900} />
              </div>
              <div>
                <label className="mb-2 block text-sm">Payment Method</label>
                <Select defaultValue="card">
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cash">Cash (at desk)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Button
                  variant="hero"
                  onClick={() => {
                    toast({
                      title: "Demo payment",
                      description: "Payment integration pending. Redirecting to success page...",
                    });
                    setTimeout(() => {
                      window.location.href = "/payment/success";
                    }, 600);
                  }}
                >
                  Pay Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Share Your Feedback</CardTitle>
              <CardDescription>Help us improve your experience at STAYSYNC</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                onClick={() => {
                  toast({ 
                    title: "Feedback submitted!", 
                    description: "Thank you for helping us improve STAYSYNC." 
                  });
                  setFeedback({ rating: 5, comment: "" });
                }}
              >
                Submit Feedback
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default UserPortal;