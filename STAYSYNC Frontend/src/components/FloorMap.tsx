import { useHotel, Room } from "@/contexts/HotelContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FloorMapProps {
  floorNumber: number;
  interactive?: boolean;
  onRoomSelect?: (room: Room) => void;
  selectedRoomId?: string;
}

const statusColors = {
  available: "bg-emerald-500 hover:bg-emerald-600 border-emerald-600",
  occupied: "bg-red-500 hover:bg-red-600 border-red-600",
  cleaning: "bg-yellow-500 hover:bg-yellow-600 border-yellow-600",
  maintenance: "bg-orange-500 hover:bg-orange-600 border-orange-600",
};

const statusLabels = {
  available: "Available",
  occupied: "Occupied", 
  cleaning: "Cleaning",
  maintenance: "Maintenance",
};

export const FloorMap = ({ floorNumber, interactive = false, onRoomSelect, selectedRoomId }: FloorMapProps) => {
  const { floors, getRoomsByFloor } = useHotel();
  const floor = floors.find(f => f.number === floorNumber);
  const rooms = getRoomsByFloor(floorNumber);

  if (!floor) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Floor {floorNumber} not found</p>
        </CardContent>
      </Card>
    );
  }

  // Auto-arrange rooms in a grid if positions are not properly set
  const arrangedRooms = rooms.map((room, index) => {
    const gridCols = Math.ceil(Math.sqrt(rooms.length)) || 1;
    const row = Math.floor(index / gridCols);
    const col = index % gridCols;
    
    return {
      ...room,
      gridPosition: {
        x: room.position.x !== 0 || room.position.y !== 0 ? room.position.x : col,
        y: room.position.x !== 0 || room.position.y !== 0 ? room.position.y : row,
      }
    };
  });

  const maxX = Math.max(...arrangedRooms.map(r => r.gridPosition.x), 0);
  const maxY = Math.max(...arrangedRooms.map(r => r.gridPosition.y), 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {floor.name}
          <Badge variant="secondary">Floor {floorNumber}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {Object.entries(statusColors).map(([status, colorClass]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={cn("w-3 h-3 rounded border", colorClass)} />
              <span className="capitalize">{statusLabels[status as keyof typeof statusLabels]}</span>
            </div>
          ))}
        </div>
        
        {rooms.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted rounded-lg">
            <p className="text-muted-foreground">No rooms on this floor</p>
          </div>
        ) : (
          <div 
            className="relative border-2 border-border rounded-lg p-4 bg-muted/10"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${maxX + 1}, 1fr)`,
              gridTemplateRows: `repeat(${maxY + 1}, 1fr)`,
              gap: '8px',
              minHeight: '200px',
            }}
          >
            {arrangedRooms.map((room) => (
              <div
                key={room.id}
                className={cn(
                  "relative rounded-lg border-2 p-3 transition-all duration-200 cursor-pointer",
                  statusColors[room.status],
                  interactive && "hover:scale-105 hover:shadow-lg",
                  selectedRoomId === room.id && "ring-2 ring-primary ring-offset-2",
                  "text-white font-medium text-sm"
                )}
                style={{
                  gridColumn: room.gridPosition.x + 1,
                  gridRow: room.gridPosition.y + 1,
                }}
                onClick={() => interactive && onRoomSelect?.(room)}
              >
                <div className="text-center">
                  <div className="font-bold text-lg">{room.id}</div>
                  <div className="text-xs opacity-90">{room.type}</div>
                  <div className="text-xs opacity-90">₹{room.price.toLocaleString()}</div>
                </div>
                
                {room.status !== 'available' && (
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                    <Badge variant="secondary" className="text-xs">
                      {statusLabels[room.status]}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};