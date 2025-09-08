"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Search, MapPin, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Hotel {
  property_id: number;
  property_name: string;
  star_rating: number;
  property_type: string;
  distance_from_center: number;
  town: string | null;
  state: string | null;
}

// Dummy hotel images - you can replace these with actual hotel images
const dummyImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=250&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=250&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=250&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=250&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400&h=250&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=250&fit=crop&crop=center"
];

// Function to get a random image for each hotel
const getRandomImage = (propertyId: number) => {
  return dummyImages[propertyId % dummyImages.length];
};

export default function HotelsGrid() {
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const hotelsPerPage = 18; // 3 rows × 6 columns

  useEffect(() => {
    const fetchHotels = async () => {
      const { data, error } = await supabase
        .from("hotel")
        .select("*"); // Fetch ALL hotels

      if (error) {
        console.error(error);
      } else {
        setAllHotels(data || []);
        setFilteredHotels(data || []);
      }
      setLoading(false);
    };

    fetchHotels();
  }, []);

  // Filter hotels based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHotels(allHotels);
    } else {
      const filtered = allHotels.filter((hotel) =>
        hotel.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.town?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.property_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHotels(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, allHotels]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredHotels.length / hotelsPerPage);
  const startIndex = (currentPage - 1) * hotelsPerPage;
  const endIndex = startIndex + hotelsPerPage;
  const currentHotels = filteredHotels.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <p className="text-lg text-muted-foreground">Loading hotels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Search Filter */}
      <div className="mb-8 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search hotels by name, location, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
      </div>

      {/* Hotels Grid - 6 columns, responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
        {currentHotels.map((hotel) => (
          <div
            key={hotel.property_id}
            className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
          >
            {/* Hotel Image */}
            <div className="relative h-40 overflow-hidden">
              <img
                src={getRandomImage(hotel.property_id)}
                alt={hotel.property_name}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {hotel.star_rating}
              </div>
            </div>

            {/* Hotel Content */}
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2 leading-tight">
                {hotel.property_name}
              </h3>
              
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="capitalize">{hotel.property_type}</p>
                
                {hotel.town && hotel.state && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{hotel.town}, {hotel.state}</span>
                  </div>
                )}
                
                <p>{hotel.distance_from_center} km from center</p>
              </div>

              {/* Book Now Button */}
              <button className="w-full mt-3 bg-primary text-primary-foreground text-xs py-2 rounded-lg hover:bg-primary/90 transition-colors">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <div key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-muted-foreground">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(page as number)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Pagination Info */}
      {filteredHotels.length > 0 && (
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredHotels.length)} of {filteredHotels.length} hotels
            {searchTerm && <span> (filtered from {allHotels.length} total)</span>}
          </p>
        </div>
      )}

      {/* No results message */}
      {filteredHotels.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mb-4">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No hotels found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search terms or browse all hotels
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setSearchTerm("")}
            className="mt-4"
          >
            Clear search
          </Button>
        </div>
      )}
    </div>
  );
}