import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Hotel {
  property_id: number;
  property_name: string;
  address: string | null;
  town: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface HotelMapProps {
  hotels: Hotel[];
  height?: string;
  showAllHotels?: boolean;
  selectedHotel?: Hotel | null;
}

// Component to handle map updates when hotels change
function MapUpdater({ hotels, showAllHotels, selectedHotel }: { hotels: Hotel[]; showAllHotels?: boolean; selectedHotel?: Hotel | null }) {
  const map = useMap();

  useEffect(() => {
    if (hotels.length === 0) return;

    if (showAllHotels) {
      // Fit map to show all hotels
      const bounds = L.latLngBounds(
        hotels
          .filter(h => h.latitude && h.longitude)
          .map(h => [h.latitude!, h.longitude!])
      );
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    } else if (selectedHotel && selectedHotel.latitude && selectedHotel.longitude) {
      // Center map on selected hotel
      map.setView([selectedHotel.latitude, selectedHotel.longitude], 15);
    }
  }, [hotels, showAllHotels, selectedHotel, map]);

  return null;
}

const HotelMap = ({ hotels, height = "400px", showAllHotels = true, selectedHotel }: HotelMapProps) => {
  const [defaultCenter] = useState([20.5937, 78.9629]); // India center
  const [defaultZoom] = useState(5);

  // Filter hotels with valid coordinates
  const hotelsWithCoords = hotels.filter(h => h.latitude && h.longitude);

  // If no hotels with coordinates, show message
  if (hotelsWithCoords.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-muted-foreground">
          <p>No hotel locations available</p>
          <p className="text-sm">Add latitude and longitude to hotels to see them on the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border" style={{ height }}>
      <MapContainer
        center={defaultCenter as [number, number]}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render hotel markers */}
        {hotelsWithCoords.map((hotel) => (
          <Marker
            key={hotel.property_id}
            position={[hotel.latitude!, hotel.longitude!]}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-lg">{hotel.property_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {[hotel.town, hotel.state].filter(Boolean).join(", ")}
                </p>
                {hotel.address && (
                  <p className="text-sm mt-1">{hotel.address}</p>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  ID: {hotel.property_id}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Handle map updates */}
        <MapUpdater 
          hotels={hotels} 
          showAllHotels={showAllHotels} 
          selectedHotel={selectedHotel} 
        />
      </MapContainer>
    </div>
  );
};

export default HotelMap;
