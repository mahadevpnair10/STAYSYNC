// import SEO from "@/components/SEO";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Slider } from "@/components/ui/slider";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Skeleton } from "@/components/ui/skeleton";
// import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
// import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
// import { useToast } from "@/hooks/use-toast";
// import { useEffect, useMemo, useState } from "react";
// import { useHotel, Room, RoomStatus } from "@/contexts/HotelContext";
// import { FloorMap } from "@/components/FloorMap";

// const formatINR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

// const AdminPortal = () => {
//   const { toast } = useToast();
//   const { rooms, floors, addRoom, updateRoom, deleteRoom, addFloor, deleteFloor } = useHotel();

//   const [roomDialogOpen, setRoomDialogOpen] = useState(false);
//   const [floorDialogOpen, setFloorDialogOpen] = useState(false);
//   const [editing, setEditing] = useState<Room | null>(null);
//   const [form, setForm] = useState<Pick<Room, "type" | "status" | "price" | "floor">>({ 
//     type: "Standard", 
//     status: "available", 
//     price: 2999, 
//     floor: 1 
//   });
//   const [floorForm, setFloorForm] = useState({ number: 1, name: "" });

//   // Filters & sorting
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
//   const [priceRange, setPriceRange] = useState<[number, number]>([1000, 15000]);
//   const [sort, setSort] = useState<"price-asc" | "price-desc" | "type" | "status">("price-asc");

//   const filteredRooms = useMemo(() => {
//     let list = rooms.filter((r) =>
//       r.type.toLowerCase().includes(search.toLowerCase()) &&
//       (statusFilter === "all" ? true : r.status === statusFilter) &&
//       r.price >= priceRange[0] && r.price <= priceRange[1]
//     );
//     switch (sort) {
//       case "price-asc":
//         list = list.sort((a, b) => a.price - b.price);
//         break;
//       case "price-desc":
//         list = list.sort((a, b) => b.price - a.price);
//         break;
//       case "type":
//         list = list.sort((a, b) => a.type.localeCompare(b.type));
//         break;
//       case "status":
//         list = list.sort((a, b) => a.status.localeCompare(b.status));
//         break;
//     }
//     return list;
//   }, [rooms, search, statusFilter, priceRange, sort]);

//   const openAddDialog = () => {
//     setEditing(null);
//     setForm({ type: "Standard", status: "available", price: 2999, floor: 1 });
//     setRoomDialogOpen(true);
//   };
  
//   const openEditDialog = (room: Room) => {
//     setEditing(room);
//     setForm({ type: room.type, status: room.status, price: room.price, floor: room.floor });
//     setRoomDialogOpen(true);
//   };
  
//   const saveRoom = () => {
//     if (editing) {
//       // TODO: Backend: updateRoom(editing.id, form)
//       updateRoom(editing.id, form);
//       toast({ title: "Room updated" });
//     } else {
//       // TODO: Backend: createRoom(form)
//       const roomData = {
//         ...form,
//         position: { x: 0, y: 0 } // Auto-arranged by FloorMap component
//       };
//       addRoom(roomData);
//       toast({ title: "Room created" });
//     }
//     setRoomDialogOpen(false);
//   };
  
//   const handleDeleteRoom = (id: string) => {
//     // TODO: Backend: deleteRoom(id)
//     deleteRoom(id);
//     toast({ title: "Room deleted" });
//   };

//   const openFloorDialog = () => {
//     setFloorForm({ number: Math.max(...floors.map(f => f.number), 0) + 1, name: "" });
//     setFloorDialogOpen(true);
//   };

//   const saveFloor = () => {
//     // TODO: Backend: createFloor(floorForm)
//     addFloor(floorForm);
//     toast({ title: "Floor added" });
//     setFloorDialogOpen(false);
//   };

//   const handleDeleteFloor = (floorNumber: number) => {
//     // TODO: Backend: deleteFloor(floorNumber)
//     deleteFloor(floorNumber);
//     toast({ title: "Floor deleted" });
//   };

//   // Accounting mock data + loading
//   const [loadingAccounting, setLoadingAccounting] = useState(true);
//   useEffect(() => {
//     const t = setTimeout(() => setLoadingAccounting(false), 700);
//     return () => clearTimeout(t);
//   }, []);

//   const revenueData = [
//     { month: "Jan", revenue: 1200000, expenses: 800000 },
//     { month: "Feb", revenue: 1350000, expenses: 820000 },
//     { month: "Mar", revenue: 1500000, expenses: 900000 },
//     { month: "Apr", revenue: 1420000, expenses: 880000 },
//     { month: "May", revenue: 1600000, expenses: 950000 },
//   ];
//   const occupancyData = [
//     { month: "Jan", occupancy: 72 },
//     { month: "Feb", occupancy: 76 },
//     { month: "Mar", occupancy: 81 },
//     { month: "Apr", occupancy: 78 },
//     { month: "May", occupancy: 85 },
//   ];

//   const ledger = [
//     { id: "TRX-9001", type: "Payment", amount: 19900, date: "2025-08-10" },
//     { id: "TRX-9002", type: "Refund", amount: -5900, date: "2025-08-11" },
//   ];

//   return (
//     <main className="container mx-auto py-10">
//       <SEO title="Admin Portal | STAYSYNC" description="Manage rooms, housekeeping, and accounting." canonical="/admin" />

//       <h1 className="text-3xl font-bold">Admin Portal</h1>
//       <p className="mt-2 text-muted-foreground">Control room inventory, staff tasks, and financials.</p>

//       <Tabs defaultValue="rooms" className="mt-8">
//         <TabsList>
//           <TabsTrigger value="rooms">Rooms</TabsTrigger>
//           <TabsTrigger value="floors">Floor Maps</TabsTrigger>
//           <TabsTrigger value="housekeeping">Housekeeping</TabsTrigger>
//           <TabsTrigger value="accounting">Accounting</TabsTrigger>
//         </TabsList>

//         <TabsContent value="rooms" className="space-y-4">
//           <Card>
//             <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <CardTitle>Room Inventory</CardTitle>
//                 <CardDescription>Add, update, filter and monitor availability.</CardDescription>
//               </div>
//               <div className="flex gap-2">
//                 <Dialog open={floorDialogOpen} onOpenChange={setFloorDialogOpen}>
//                   <DialogTrigger asChild>
//                     <Button variant="outline" onClick={openFloorDialog}>Add Floor</Button>
//                   </DialogTrigger>
//                   <DialogContent>
//                     <DialogHeader>
//                       <DialogTitle>Add Floor</DialogTitle>
//                       <DialogDescription>Create a new floor for room management.</DialogDescription>
//                     </DialogHeader>
//                     <div className="grid gap-4">
//                       <div className="grid gap-2">
//                         <Label htmlFor="floorNumber">Floor Number</Label>
//                         <Input 
//                           id="floorNumber" 
//                           type="number" 
//                           value={floorForm.number} 
//                           onChange={(e) => setFloorForm(f => ({ ...f, number: Number(e.target.value || 0) }))} 
//                         />
//                       </div>
//                       <div className="grid gap-2">
//                         <Label htmlFor="floorName">Floor Name</Label>
//                         <Input 
//                           id="floorName" 
//                           value={floorForm.name} 
//                           onChange={(e) => setFloorForm(f => ({ ...f, name: e.target.value }))} 
//                           placeholder="e.g., Ground Floor, First Floor"
//                         />
//                       </div>
//                       <div className="flex justify-end gap-2 pt-2">
//                         <Button variant="outline" onClick={() => setFloorDialogOpen(false)}>Cancel</Button>
//                         <Button onClick={saveFloor}>Add Floor</Button>
//                       </div>
//                     </div>
//                   </DialogContent>
//                 </Dialog>
                
//                 <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
//                   <DialogTrigger asChild>
//                     <Button onClick={openAddDialog}>Add Room</Button>
//                   </DialogTrigger>
//                   <DialogContent>
//                     <DialogHeader>
//                       <DialogTitle>{editing ? "Edit Room" : "Add Room"}</DialogTitle>
//                       <DialogDescription>Define the room type, price, floor and status. Prices shown in INR ₹.</DialogDescription>
//                     </DialogHeader>
//                     <div className="grid gap-4">
//                       <div className="grid gap-2">
//                         <Label htmlFor="type">Type</Label>
//                         <Input id="type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} />
//                       </div>
//                       <div className="grid gap-2">
//                         <Label htmlFor="price">Price per night</Label>
//                         <Input id="price" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value || 0) }))} />
//                       </div>
//                       <div className="grid gap-2">
//                         <Label>Floor</Label>
//                         <Select value={form.floor.toString()} onValueChange={(v) => setForm((f) => ({ ...f, floor: Number(v) }))}>
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select floor" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {floors.map(floor => (
//                               <SelectItem key={floor.number} value={floor.number.toString()}>
//                                 {floor.name} (Floor {floor.number})
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>
//                       <div className="grid gap-2">
//                         <Label>Status</Label>
//                         <Select value={form.status} onValueChange={(v: RoomStatus) => setForm((f) => ({ ...f, status: v }))}>
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select status" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="available">Available</SelectItem>
//                             <SelectItem value="occupied">Occupied</SelectItem>
//                             <SelectItem value="cleaning">Cleaning</SelectItem>
//                             <SelectItem value="maintenance">Maintenance</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                       <div className="flex justify-end gap-2 pt-2">
//                         <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>Cancel</Button>
//                         <Button onClick={saveRoom}>{editing ? "Save changes" : "Create room"}</Button>
//                       </div>
//                     </div>
//                   </DialogContent>
//                 </Dialog>
//               </div>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {/* Filters */}
//               <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="search">Search type</Label>
//                   <Input id="search" placeholder="e.g. Deluxe" value={search} onChange={(e) => setSearch(e.target.value)} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Status</Label>
//                   <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Any status" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All</SelectItem>
//                       <SelectItem value="available">Available</SelectItem>
//                       <SelectItem value="occupied">Occupied</SelectItem>
//                       <SelectItem value="cleaning">Cleaning</SelectItem>
//                       <SelectItem value="maintenance">Maintenance</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Price range (₹)</Label>
//                   <div className="px-1">
//                     <Slider value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} step={500} min={1000} max={20000} />
//                     <div className="mt-1 flex justify-between text-sm text-muted-foreground"><span>{priceRange[0]}</span><span>{priceRange[1]}</span></div>
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Sort by</Label>
//                   <Select value={sort} onValueChange={(v: any) => setSort(v)}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="price-asc">Price: Low to High</SelectItem>
//                       <SelectItem value="price-desc">Price: High to Low</SelectItem>
//                       <SelectItem value="type">Type (A–Z)</SelectItem>
//                       <SelectItem value="status">Status</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Room</TableHead>
//                     <TableHead>Type</TableHead>
//                     <TableHead>Floor</TableHead>
//                     <TableHead>Price</TableHead>
//                     <TableHead>Status</TableHead>
//                     <TableHead className="text-right">Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {filteredRooms.map((r) => (
//                     <TableRow key={r.id} className="animate-fade-in">
//                       <TableCell>{r.id}</TableCell>
//                       <TableCell>{r.type}</TableCell>
//                       <TableCell>Floor {r.floor}</TableCell>
//                       <TableCell>{formatINR.format(r.price)}</TableCell>
//                       <TableCell className="capitalize">{r.status}</TableCell>
//                       <TableCell className="text-right space-x-2">
//                         <Button size="sm" variant="outline" onClick={() => openEditDialog(r)}>Edit</Button>
//                         <Button size="sm" variant="destructive" onClick={() => handleDeleteRoom(r.id)}>Delete</Button>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                   {filteredRooms.length === 0 && (
//                     <TableRow>
//                       <TableCell colSpan={6} className="text-center text-muted-foreground">No rooms match your filters.</TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="floors" className="space-y-4">
//           <div className="flex justify-between items-center">
//             <div>
//               <h3 className="text-lg font-semibold">Floor Maps</h3>
//               <p className="text-muted-foreground">Visual representation of all floors and room layouts</p>
//             </div>
//           </div>
          
//           <div className="grid gap-6">
//             {floors.map(floor => (
//               <div key={floor.number} className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <h4 className="font-medium">Floor {floor.number}: {floor.name}</h4>
//                   <Button 
//                     variant="outline" 
//                     size="sm" 
//                     onClick={() => handleDeleteFloor(floor.number)}
//                     disabled={rooms.some(r => r.floor === floor.number)}
//                   >
//                     Delete Floor
//                   </Button>
//                 </div>
//                 <FloorMap floorNumber={floor.number} />
//               </div>
//             ))}
            
//             {floors.length === 0 && (
//               <Card>
//                 <CardContent className="flex items-center justify-center h-32">
//                   <p className="text-muted-foreground">No floors created yet. Add a floor to get started.</p>
//                 </CardContent>
//               </Card>
//             )}
//           </div>
//         </TabsContent>

//         <TabsContent value="housekeeping">
//           <Card>
//             <CardHeader>
//               <CardTitle>Housekeeping Tasks</CardTitle>
//               <CardDescription>Assign, track, and complete tasks.</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>ID</TableHead>
//                     <TableHead>Room</TableHead>
//                     <TableHead>Task</TableHead>
//                     <TableHead>Status</TableHead>
//                     <TableHead className="text-right">Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {[{ id: "HK-21", room: "202", task: "Full Cleaning", status: "In Progress" }, { id: "HK-22", room: "303", task: "Maintenance", status: "Queued" }].map((t) => (
//                     <TableRow key={t.id}>
//                       <TableCell>{t.id}</TableCell>
//                       <TableCell>{t.room}</TableCell>
//                       <TableCell>{t.task}</TableCell>
//                       <TableCell>{t.status}</TableCell>
//                       <TableCell className="text-right">
//                         <Button size="sm" variant="outline" onClick={() => toast({ title: "Task marked complete" })}>Complete</Button>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="accounting" className="space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle>Revenue vs Expenses</CardTitle>
//               <CardDescription>Financial overview in INR (₹)</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {loadingAccounting ? (
//                 <div className="grid gap-3">
//                   <Skeleton className="h-8 w-40" />
//                   <Skeleton className="h-64 w-full" />
//                 </div>
//               ) : (
//                 <ChartContainer config={{ revenue: { label: "Revenue", color: "hsl(var(--primary))" }, expenses: { label: "Expenses", color: "hsl(var(--accent))" } }}>
//                   <BarChart data={revenueData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="month" />
//                     <YAxis tickFormatter={(v) => formatINR.format(v).replace(".00", "")} />
//                     <ChartTooltip content={<ChartTooltipContent />} />
//                     <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
//                     <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
//                   </BarChart>
//                 </ChartContainer>
//               )}
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Occupancy Rate</CardTitle>
//               <CardDescription>Monthly occupancy percentage</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {loadingAccounting ? (
//                 <Skeleton className="h-64 w-full" />
//               ) : (
//                 <ChartContainer config={{ occupancy: { label: "Occupancy", color: "hsl(var(--primary))" } }}>
//                   <LineChart data={occupancyData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="month" />
//                     <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
//                     <ChartTooltip content={<ChartTooltipContent />} />
//                     <Line type="monotone" dataKey="occupancy" stroke="var(--color-occupancy)" strokeWidth={2} dot={false} />
//                   </LineChart>
//                 </ChartContainer>
//               )}
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Ledger</CardTitle>
//               <CardDescription>Recent transactions</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>ID</TableHead>
//                     <TableHead>Type</TableHead>
//                     <TableHead>Amount</TableHead>
//                     <TableHead>Date</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {ledger.map((l) => (
//                     <TableRow key={l.id}>
//                       <TableCell>{l.id}</TableCell>
//                       <TableCell>{l.type}</TableCell>
//                       <TableCell className={l.amount < 0 ? "text-destructive" : ""}>{formatINR.format(l.amount)}</TableCell>
//                       <TableCell>{l.date}</TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </main>
//   );
// };

// export default AdminPortal;


import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/../supabaseClient";
import HotelMap from "@/components/HotelMap";

// Generate a BIGINT-safe numeric property_id: milliseconds * 1000 + 0-999
// Stays below Number.MAX_SAFE_INTEGER (~9e15)
const generateNumericPropertyId = (): number => (Date.now() * 1000) + Math.floor(Math.random() * 1000);

// Matches your existing table columns
interface Hotel {
 property_id: number; // BIGINT
 property_name: string;
 built_year: number | null;
 star_rating: number | null;
 pincode: string | null;
 property_type: string | null;
 free_wifi: boolean | null;
 entire_property: boolean | null;
 latitude: number | null;
 longitude: number | null;
 distance_from_center: number | null;
 town: string | null;
 state: string | null;
 uuid: string; // admin/user id (FK to profiles.id)
 address: string | null;
 created_at: string;
}

const AdminPortal = () => {
 const { toast } = useToast();
 const [hotels, setHotels] = useState<Hotel[]>([]);
 const [loading, setLoading] = useState(true);
 const [hotelDialogOpen, setHotelDialogOpen] = useState(false);
 const [editing, setEditing] = useState<Hotel | null>(null);
 const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
 const [hotelToDelete, setHotelToDelete] = useState<Hotel | null>(null);

 // Minimal form matching your UI, mapped to DB columns on save
 const [form, setForm] = useState({
 name: "", // -> property_name
 location: "", // -> split into town, state (e.g., "Mumbai, Maharashtra")
 address: "", // -> address
 description: "", // not stored yet (add a column later if needed)
 latitude: "", // -> latitude
 longitude: "" // -> longitude
 });

 const [isGeocoding, setIsGeocoding] = useState(false);

 useEffect(() => {
 fetchHotels();
 }, []);

 // Function to automatically fetch coordinates from address
 const fetchCoordinates = async () => {
 if (!form.name || !form.location || !form.address) {
 toast({ 
 title: "Missing Information", 
 description: "Please fill in hotel name, location, and address first",
 variant: "destructive"
 });
 return;
 }

 setIsGeocoding(true);
 try {
 // Combine all location information for better geocoding
 const searchQuery = `${form.name}, ${form.address}, ${form.location}`;
 const encodedQuery = encodeURIComponent(searchQuery);
 
 const response = await fetch(
 `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&addressdetails=1`
 );
 
 if (!response.ok) throw new Error('Geocoding service unavailable');
 
 const data = await response.json();
 
 if (data && data.length > 0) {
 const result = data[0];
 setForm(prev => ({
 ...prev,
 latitude: result.lat,
 longitude: result.lon
 }));
 
 toast({ 
 title: "Coordinates Found!", 
 description: `Location: ${result.lat}, ${result.lon}` 
 });
 } else {
 toast({ 
 title: "No coordinates found", 
 description: "Try being more specific with the address or enter coordinates manually",
 variant: "destructive"
 });
 }
 } catch (error) {
 console.error('Geocoding error:', error);
 toast({ 
 title: "Geocoding failed", 
 description: "Please enter coordinates manually or try again later",
 variant: "destructive"
 });
 } finally {
 setIsGeocoding(false);
 }
 };

 const fetchHotels = async () => {
 try {
 setLoading(true);
 const { data: { user }, error: userError } = await supabase.auth.getUser();
 if (userError || !user) throw new Error("Not authenticated");

 const { data, error } = await supabase
 .from('hotel')
 .select('*')
 .eq('uuid', user.id)
 .order('created_at', { ascending: false });

 if (error) throw error;
 setHotels((data as Hotel[]) || []);
 } catch (error: any) {
 console.error('Error fetching hotels:', error);
 toast({ title: "Error loading hotels", description: error.message || "Failed to load hotels", variant: "destructive" });
 } finally {
 setLoading(false);
 }
 };

 const openAddDialog = () => {
 setEditing(null);
 setForm({ name: "", location: "", address: "", description: "", latitude: "", longitude: "" });
 setHotelDialogOpen(true);
 };

 const openEditDialog = (hotel: Hotel) => {
 setEditing(hotel);
 const loc = [hotel.town, hotel.state].filter(Boolean).join(", ");
 setForm({
 name: hotel.property_name || "",
 location: loc,
 address: hotel.address || "",
 description: "",
 latitude: hotel.latitude ? hotel.latitude.toString() : "",
 longitude: hotel.longitude ? hotel.longitude.toString() : ""
 });
 setHotelDialogOpen(true);
 };

 const openDeleteDialog = (hotel: Hotel) => {
 setHotelToDelete(hotel);
 setDeleteDialogOpen(true);
 };

 const parseTownState = (location: string): { town: string | null; state: string | null } => {
 const parts = location.split(",").map(s => s.trim()).filter(Boolean);
 if (parts.length === 0) return { town: null, state: null };
 if (parts.length === 1) return { town: parts[0], state: null };
 return { town: parts[0], state: parts.slice(1).join(", ") };
 };

 const saveHotel = async () => {
 if (!form.name || !form.address) {
 toast({ title: "Validation Error", description: "Hotel name and address are required", variant: "destructive" });
 return;
 }

 try {
 const { data: { user }, error: userError } = await supabase.auth.getUser();
 if (userError || !user) throw new Error("Not authenticated");

 const { town, state } = parseTownState(form.location);
 const latitude = form.latitude ? parseFloat(form.latitude) : null;
 const longitude = form.longitude ? parseFloat(form.longitude) : null;

 if (editing) {
 const { error } = await supabase
 .from('hotel')
 .update({
 property_name: form.name,
 town,
 state,
 address: form.address,
 latitude: latitude,
 longitude: longitude
 })
 .eq('property_id', editing.property_id)
 .eq('uuid', user.id);

 if (error) throw error;
 toast({ title: "Hotel updated successfully" });
 } else {
 const newPropertyId = generateNumericPropertyId();
 const { error } = await supabase
 .from('hotel')
 .insert([{
 property_id: newPropertyId,
 property_name: form.name,
 town,
 state,
 address: form.address,
 uuid: user.id, // link to admin (profiles.id)
 admin_id: user.id, // required for RLS policy
 latitude: latitude,
 longitude: longitude
 }]);

 if (error) throw error;
 toast({ title: "Hotel registered successfully" });
 }

 setHotelDialogOpen(false);
 fetchHotels();
 } catch (error: any) {
 console.error('Error saving hotel:', error);
 toast({ title: "Error saving hotel", description: error.message || "Failed to save hotel", variant: "destructive" });
 }
 };

 const handleDeleteHotel = async () => {
 if (!hotelToDelete) return;
 
 try {
 const { data: { user }, error: userError } = await supabase.auth.getUser();
 if (userError || !user) throw new Error("Not authenticated");

 const { error } = await supabase
 .from('hotel')
 .delete()
 .eq('property_id', hotelToDelete.property_id)
 .eq('uuid', user.id);

 if (error) throw error;
 toast({ title: "Hotel deleted successfully" });
 setDeleteDialogOpen(false);
 setHotelToDelete(null);
 fetchHotels();
 } catch (error: any) {
 console.error('Error deleting hotel:', error);
 toast({ title: "Error deleting hotel", description: error.message || "Failed to delete hotel", variant: "destructive" });
 }
 };

 if (loading) {
 return (
 <main className="container mx-auto py-10">
 <div className="flex items-center justify-center h-64">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
 <p className="text-muted-foreground">Loading hotels...</p>
 </div>
 </div>
 </main>
 );
 }

 return (
 <main className="container mx-auto py-10">
 <SEO title="Admin Portal | STAYSYNC" description="Manage hotels under your control." canonical="/admin" />

 <div className="mb-8">
 <h1 className="text-3xl font-bold">Admin Portal</h1>
 <p className="mt-2 text-muted-foreground">Register hotels under your account. Data is linked to your admin id.</p>
 </div>

 <Tabs defaultValue="hotels" className="mt-8">
 <TabsList>
 <TabsTrigger value="hotels">My Hotels</TabsTrigger>
 <TabsTrigger value="map">Map View</TabsTrigger>
 <TabsTrigger value="settings">Settings</TabsTrigger>
 </TabsList>

 <TabsContent value="hotels" className="space-y-4">
 <Card>
 <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <CardTitle>Hotel Management</CardTitle>
 <CardDescription>Register new hotels and manage those under your control.</CardDescription>
 </div>
 <Dialog open={hotelDialogOpen} onOpenChange={setHotelDialogOpen}>
 <DialogTrigger asChild>
 <Button onClick={openAddDialog}>Register New Hotel</Button>
 </DialogTrigger>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>{editing ? "Edit Hotel" : "Register New Hotel"}</DialogTitle>
 <DialogDescription>
 {editing ? "Update hotel information" : "Add a new hotel to your portfolio"}
 </DialogDescription>
 </DialogHeader>
 <div className="grid gap-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="name">Hotel Name *</Label>
 <Input id="name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Grand Plaza Hotel" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="location">Location *</Label>
 <Input id="location" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g., Mumbai, Maharashtra" />
 </div>
 </div>
 
 {/* Auto-fetch coordinates section */}
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <Label className="text-base font-medium">Coordinates</Label>
 <Button 
 type="button" 
 variant="outline" 
 size="sm"
 onClick={fetchCoordinates}
 disabled={isGeocoding || !form.name || !form.location || !form.address}
 className="text-xs"
 >
 {isGeocoding ? (
 <>
 <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2"></div>
 Fetching...
 </>
 ) : (
 "🔍 Auto-fetch Coordinates"
 )}
 </Button>
 </div>
 <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md">
 💡 <strong>Automatic:</strong> Click "Auto-fetch Coordinates" to get coordinates from your address, or enter them manually below.
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="latitude">Latitude</Label>
 <Input id="latitude" value={form.latitude} onChange={(e) => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="e.g., 19.0760" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="longitude">Longitude</Label>
 <Input id="longitude" value={form.longitude} onChange={(e) => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="e.g., 72.8777" />
 </div>
 </div>
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="description">Description</Label>
 <Textarea id="description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description (not stored yet)" rows={3} />
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="address">Full Address *</Label>
 <Textarea id="address" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Complete street address" rows={3} />
 </div>
 <div className="flex justify-end gap-2 pt-4">
 <Button variant="outline" onClick={() => setHotelDialogOpen(false)}>Cancel</Button>
 <Button onClick={saveHotel}>{editing ? "Update Hotel" : "Register Hotel"}</Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </CardHeader>
 <CardContent>
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Property</TableHead>
 <TableHead>Location</TableHead>
 <TableHead>Coordinates</TableHead>
 <TableHead>Address</TableHead>
 <TableHead>Created</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {hotels.map((h) => (
 <TableRow key={h.property_id}>
 <TableCell>
 <div>
 <div className="font-medium">{h.property_name}</div>
 <div className="text-sm text-muted-foreground">{h.property_id}</div>
 </div>
 </TableCell>
 <TableCell>{[h.town, h.state].filter(Boolean).join(", ")}</TableCell>
 <TableCell>
 {h.latitude && h.longitude ? (
 <div className="text-xs font-mono">
 <div>{h.latitude.toFixed(4)}</div>
 <div>{h.longitude.toFixed(4)}</div>
 </div>
 ) : (
 <span className="text-muted-foreground text-xs">Not set</span>
 )}
 </TableCell>
 <TableCell className="max-w-xs truncate">{h.address}</TableCell>
 <TableCell className="text-sm text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</TableCell>
 <TableCell className="text-right space-x-2">
 <Button size="sm" variant="outline" onClick={() => openEditDialog(h)}>Edit</Button>
 <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(h)}>Delete</Button>
 </TableCell>
 </TableRow>
 ))}
 {hotels.length === 0 && (
 <TableRow>
 <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No hotels registered yet. Click "Register New Hotel" to get started.</TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="map" className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Hotel Locations</CardTitle>
 <CardDescription>View all your hotels on an interactive map</CardDescription>
 </CardHeader>
 <CardContent>
 <HotelMap 
 hotels={hotels} 
 height="600px" 
 showAllHotels={true}
 />
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="settings" className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Admin Settings</CardTitle>
 <CardDescription>Manage your admin account and preferences</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid gap-4 md:grid-cols-2">
 <div className="space-y-2">
 <Label htmlFor="adminId">Admin ID</Label>
 <Input id="adminId" value="Current User" disabled />
 </div>
 <div className="space-y-2">
 <Label htmlFor="adminName">Admin Name</Label>
 <Input id="adminName" placeholder="Your Name" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="adminEmail">Admin Email</Label>
 <Input id="adminEmail" type="email" placeholder="admin@staysync.com" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="adminPhone">Admin Phone</Label>
 <Input id="adminPhone" placeholder="+91-XXXXXXXXXX" />
 </div>
 </div>
 <div className="flex justify-end">
 <Button>Save Settings</Button>
 </div>
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>

 {/* Delete Confirmation Dialog */}
 <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>Are you sure?</AlertDialogTitle>
 <AlertDialogDescription>
 This action cannot be undone. This will permanently delete the hotel "{hotelToDelete?.property_name}" 
 and remove it from your portfolio.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel onClick={() => {
 setDeleteDialogOpen(false);
 setHotelToDelete(null);
 }}>
 Cancel
 </AlertDialogCancel>
 <AlertDialogAction onClick={handleDeleteHotel} className="bg-red-600 hover:bg-red-700">
 Delete Hotel
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </main>
 );
};

export default AdminPortal;

