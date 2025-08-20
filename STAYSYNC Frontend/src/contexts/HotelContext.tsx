import { createContext, useContext, useState, ReactNode } from "react";

export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

export interface Room {
  id: string;
  type: string;
  status: RoomStatus;
  price: number;
  floor: number;
  position: { x: number; y: number }; // Position on floor map
}

export interface Floor {
  number: number;
  name: string;
  rooms: Room[];
}

interface HotelContextType {
  floors: Floor[];
  rooms: Room[];
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  addFloor: (floor: Omit<Floor, 'rooms'>) => void;
  deleteFloor: (floorNumber: number) => void;
  getRoomsByFloor: (floorNumber: number) => Room[];
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};

export const HotelProvider = ({ children }: { children: ReactNode }) => {
  const [floors, setFloors] = useState<Floor[]>([
    { number: 1, name: "Ground Floor", rooms: [] },
    { number: 2, name: "First Floor", rooms: [] },
    { number: 3, name: "Second Floor", rooms: [] },
  ]);

  const [rooms, setRooms] = useState<Room[]>([
    { id: "101", type: "Standard", status: "available", price: 2999, floor: 1, position: { x: 0, y: 0 } },
    { id: "102", type: "Standard", status: "occupied", price: 2999, floor: 1, position: { x: 1, y: 0 } },
    { id: "201", type: "Deluxe King", status: "available", price: 5499, floor: 2, position: { x: 0, y: 0 } },
    { id: "202", type: "Deluxe King", status: "cleaning", price: 5499, floor: 2, position: { x: 1, y: 0 } },
    { id: "301", type: "Executive Suite", status: "maintenance", price: 8999, floor: 3, position: { x: 0, y: 0 } },
  ]);

  const addRoom = (roomData: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      ...roomData,
      id: `${roomData.floor}${String(Date.now()).slice(-2)}`,
    };
    setRooms(prev => [...prev, newRoom]);
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(room => 
      room.id === id ? { ...room, ...updates } : room
    ));
  };

  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(room => room.id !== id));
  };

  const addFloor = (floorData: Omit<Floor, 'rooms'>) => {
    setFloors(prev => [...prev, { ...floorData, rooms: [] }]);
  };

  const deleteFloor = (floorNumber: number) => {
    setFloors(prev => prev.filter(floor => floor.number !== floorNumber));
    setRooms(prev => prev.filter(room => room.floor !== floorNumber));
  };

  const getRoomsByFloor = (floorNumber: number) => {
    return rooms.filter(room => room.floor === floorNumber);
  };

  return (
    <HotelContext.Provider value={{
      floors,
      rooms,
      addRoom,
      updateRoom,
      deleteRoom,
      addFloor,
      deleteFloor,
      getRoomsByFloor,
    }}>
      {children}
    </HotelContext.Provider>
  );
};