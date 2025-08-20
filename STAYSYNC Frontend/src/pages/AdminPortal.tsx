import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import { useHotel, Room, RoomStatus } from "@/contexts/HotelContext";
import { FloorMap } from "@/components/FloorMap";

const formatINR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

const AdminPortal = () => {
  const { toast } = useToast();
  const { rooms, floors, addRoom, updateRoom, deleteRoom, addFloor, deleteFloor } = useHotel();

  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [floorDialogOpen, setFloorDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<Pick<Room, "type" | "status" | "price" | "floor">>({ 
    type: "Standard", 
    status: "available", 
    price: 2999, 
    floor: 1 
  });
  const [floorForm, setFloorForm] = useState({ number: 1, name: "" });

  // Filters & sorting
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([1000, 15000]);
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "type" | "status">("price-asc");

  const filteredRooms = useMemo(() => {
    let list = rooms.filter((r) =>
      r.type.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter === "all" ? true : r.status === statusFilter) &&
      r.price >= priceRange[0] && r.price <= priceRange[1]
    );
    switch (sort) {
      case "price-asc":
        list = list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = list.sort((a, b) => b.price - a.price);
        break;
      case "type":
        list = list.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case "status":
        list = list.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }
    return list;
  }, [rooms, search, statusFilter, priceRange, sort]);

  const openAddDialog = () => {
    setEditing(null);
    setForm({ type: "Standard", status: "available", price: 2999, floor: 1 });
    setRoomDialogOpen(true);
  };
  
  const openEditDialog = (room: Room) => {
    setEditing(room);
    setForm({ type: room.type, status: room.status, price: room.price, floor: room.floor });
    setRoomDialogOpen(true);
  };
  
  const saveRoom = () => {
    if (editing) {
      // TODO: Backend: updateRoom(editing.id, form)
      updateRoom(editing.id, form);
      toast({ title: "Room updated" });
    } else {
      // TODO: Backend: createRoom(form)
      const roomData = {
        ...form,
        position: { x: 0, y: 0 } // Auto-arranged by FloorMap component
      };
      addRoom(roomData);
      toast({ title: "Room created" });
    }
    setRoomDialogOpen(false);
  };
  
  const handleDeleteRoom = (id: string) => {
    // TODO: Backend: deleteRoom(id)
    deleteRoom(id);
    toast({ title: "Room deleted" });
  };

  const openFloorDialog = () => {
    setFloorForm({ number: Math.max(...floors.map(f => f.number), 0) + 1, name: "" });
    setFloorDialogOpen(true);
  };

  const saveFloor = () => {
    // TODO: Backend: createFloor(floorForm)
    addFloor(floorForm);
    toast({ title: "Floor added" });
    setFloorDialogOpen(false);
  };

  const handleDeleteFloor = (floorNumber: number) => {
    // TODO: Backend: deleteFloor(floorNumber)
    deleteFloor(floorNumber);
    toast({ title: "Floor deleted" });
  };

  // Accounting mock data + loading
  const [loadingAccounting, setLoadingAccounting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoadingAccounting(false), 700);
    return () => clearTimeout(t);
  }, []);

  const revenueData = [
    { month: "Jan", revenue: 1200000, expenses: 800000 },
    { month: "Feb", revenue: 1350000, expenses: 820000 },
    { month: "Mar", revenue: 1500000, expenses: 900000 },
    { month: "Apr", revenue: 1420000, expenses: 880000 },
    { month: "May", revenue: 1600000, expenses: 950000 },
  ];
  const occupancyData = [
    { month: "Jan", occupancy: 72 },
    { month: "Feb", occupancy: 76 },
    { month: "Mar", occupancy: 81 },
    { month: "Apr", occupancy: 78 },
    { month: "May", occupancy: 85 },
  ];

  const ledger = [
    { id: "TRX-9001", type: "Payment", amount: 19900, date: "2025-08-10" },
    { id: "TRX-9002", type: "Refund", amount: -5900, date: "2025-08-11" },
  ];

  return (
    <main className="container mx-auto py-10">
      <SEO title="Admin Portal | STAYSYNC" description="Manage rooms, housekeeping, and accounting." canonical="/admin" />

      <h1 className="text-3xl font-bold">Admin Portal</h1>
      <p className="mt-2 text-muted-foreground">Control room inventory, staff tasks, and financials.</p>

      <Tabs defaultValue="rooms" className="mt-8">
        <TabsList>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="floors">Floor Maps</TabsTrigger>
          <TabsTrigger value="housekeeping">Housekeeping</TabsTrigger>
          <TabsTrigger value="accounting">Accounting</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Room Inventory</CardTitle>
                <CardDescription>Add, update, filter and monitor availability.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={floorDialogOpen} onOpenChange={setFloorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={openFloorDialog}>Add Floor</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Floor</DialogTitle>
                      <DialogDescription>Create a new floor for room management.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="floorNumber">Floor Number</Label>
                        <Input 
                          id="floorNumber" 
                          type="number" 
                          value={floorForm.number} 
                          onChange={(e) => setFloorForm(f => ({ ...f, number: Number(e.target.value || 0) }))} 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="floorName">Floor Name</Label>
                        <Input 
                          id="floorName" 
                          value={floorForm.name} 
                          onChange={(e) => setFloorForm(f => ({ ...f, name: e.target.value }))} 
                          placeholder="e.g., Ground Floor, First Floor"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setFloorDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveFloor}>Add Floor</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openAddDialog}>Add Room</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit Room" : "Add Room"}</DialogTitle>
                      <DialogDescription>Define the room type, price, floor and status. Prices shown in INR ₹.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <Input id="type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="price">Price per night</Label>
                        <Input id="price" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value || 0) }))} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Floor</Label>
                        <Select value={form.floor.toString()} onValueChange={(v) => setForm((f) => ({ ...f, floor: Number(v) }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select floor" />
                          </SelectTrigger>
                          <SelectContent>
                            {floors.map(floor => (
                              <SelectItem key={floor.number} value={floor.number.toString()}>
                                {floor.name} (Floor {floor.number})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={form.status} onValueChange={(v: RoomStatus) => setForm((f) => ({ ...f, status: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="cleaning">Cleaning</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveRoom}>{editing ? "Save changes" : "Create room"}</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search type</Label>
                  <Input id="search" placeholder="e.g. Deluxe" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price range (₹)</Label>
                  <div className="px-1">
                    <Slider value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} step={500} min={1000} max={20000} />
                    <div className="mt-1 flex justify-between text-sm text-muted-foreground"><span>{priceRange[0]}</span><span>{priceRange[1]}</span></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sort by</Label>
                  <Select value={sort} onValueChange={(v: any) => setSort(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price-asc">Price: Low to High</SelectItem>
                      <SelectItem value="price-desc">Price: High to Low</SelectItem>
                      <SelectItem value="type">Type (A–Z)</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.map((r) => (
                    <TableRow key={r.id} className="animate-fade-in">
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>Floor {r.floor}</TableCell>
                      <TableCell>{formatINR.format(r.price)}</TableCell>
                      <TableCell className="capitalize">{r.status}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(r)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteRoom(r.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRooms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">No rooms match your filters.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="floors" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Floor Maps</h3>
              <p className="text-muted-foreground">Visual representation of all floors and room layouts</p>
            </div>
          </div>
          
          <div className="grid gap-6">
            {floors.map(floor => (
              <div key={floor.number} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Floor {floor.number}: {floor.name}</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteFloor(floor.number)}
                    disabled={rooms.some(r => r.floor === floor.number)}
                  >
                    Delete Floor
                  </Button>
                </div>
                <FloorMap floorNumber={floor.number} />
              </div>
            ))}
            
            {floors.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No floors created yet. Add a floor to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="housekeeping">
          <Card>
            <CardHeader>
              <CardTitle>Housekeeping Tasks</CardTitle>
              <CardDescription>Assign, track, and complete tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[{ id: "HK-21", room: "202", task: "Full Cleaning", status: "In Progress" }, { id: "HK-22", room: "303", task: "Maintenance", status: "Queued" }].map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.id}</TableCell>
                      <TableCell>{t.room}</TableCell>
                      <TableCell>{t.task}</TableCell>
                      <TableCell>{t.status}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => toast({ title: "Task marked complete" })}>Complete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
              <CardDescription>Financial overview in INR (₹)</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAccounting ? (
                <div className="grid gap-3">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <ChartContainer config={{ revenue: { label: "Revenue", color: "hsl(var(--primary))" }, expenses: { label: "Expenses", color: "hsl(var(--accent))" } }}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => formatINR.format(v).replace(".00", "")} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Occupancy Rate</CardTitle>
              <CardDescription>Monthly occupancy percentage</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAccounting ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ChartContainer config={{ occupancy: { label: "Occupancy", color: "hsl(var(--primary))" } }}>
                  <LineChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="occupancy" stroke="var(--color-occupancy)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ledger</CardTitle>
              <CardDescription>Recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.id}</TableCell>
                      <TableCell>{l.type}</TableCell>
                      <TableCell className={l.amount < 0 ? "text-destructive" : ""}>{formatINR.format(l.amount)}</TableCell>
                      <TableCell>{l.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default AdminPortal;
