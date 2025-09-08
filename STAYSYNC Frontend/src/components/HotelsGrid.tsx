import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { Search, MapPin, Star, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
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

const getRandomImage = (propertyId: number) => {
  return dummyImages[propertyId % dummyImages.length];
};

export default function HotelsGrid() {
  const navigate = useNavigate();
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const hotelsPerPage = 18; // 3 rows × 6 columns

  useEffect(() => {
    const fetchHotels = async () => {
      const { data, error } = await supabase.from("hotel").select("*"); // Fetch ALL hotels

      if (error) {
        console.error(error);
      } else {
        const sortedData = sortHotels(data as Hotel[], sortBy);
        setAllHotels(sortedData || []);
        setFilteredHotels(sortedData || []);
      }
      setLoading(false);
    };

    fetchHotels();
  }, []);

  // Sort hotels based on selected criteria
  const sortHotels = (hotels: Hotel[], criteria: string) => {
    const sorted = [...hotels];
    switch (criteria) {
      case "rating":
        return sorted.sort((a, b) => b.star_rating - a.star_rating);
      case "distance":
        return sorted.sort((a, b) => a.distance_from_center - b.distance_from_center);
      case "name":
      default:
        return sorted.sort((a, b) => a.property_name.localeCompare(b.property_name));
    }
  };

  // Filter hotels based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHotels(sortHotels(allHotels, sortBy));
    } else {
      const q = searchTerm.toLowerCase();
      const filtered = allHotels.filter((hotel) =>
        hotel.property_name.toLowerCase().includes(q) ||
        hotel.town?.toLowerCase().includes(q) ||
        hotel.state?.toLowerCase().includes(q) ||
        hotel.property_type.toLowerCase().includes(q)
      );
      setFilteredHotels(sortHotels(filtered, sortBy));
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, allHotels, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredHotels.length / hotelsPerPage);
  const startIndex = (currentPage - 1) * hotelsPerPage;
  const endIndex = startIndex + hotelsPerPage;
  const currentHotels = filteredHotels.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
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
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Loading Hotels</h3>
          <p className="text-muted-foreground">Discovering amazing places for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Search and Filter Header */}
      <div className="mb-8 p-4 bg-gradient-to-r from-background to-muted/30 rounded-xl border">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search hotels by name, location, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-full bg-background/80 backdrop-blur-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 rounded-full"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-2 pl-3 pr-10 bg-background border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="name">Sort by Name</option>
                <option value="rating">Sort by Rating</option>
                <option value="distance">Sort by Distance</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="mt-4 p-4 bg-background/50 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Filters</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsFilterOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Add your filter options here */}
              <div>
                <label className="text-sm font-medium mb-2 block">Star Rating</label>
                <div className="flex flex-wrap gap-2">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <Button 
                      key={rating} 
                      variant="outline" 
                      size="sm"
                      className="rounded-full flex items-center gap-1"
                    >
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {rating}+
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Property Type</label>
                <div className="flex flex-wrap gap-2">
                  {['Hotel', 'Resort', 'Apartment', 'Villa'].map(type => (
                    <Button key={type} variant="outline" size="sm" className="rounded-full">
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Distance</label>
                <div className="flex flex-wrap gap-2">
                  {['< 1km', '1-5km', '5-10km', '> 10km'].map(distance => (
                    <Button key={distance} variant="outline" size="sm" className="rounded-full">
                      {distance}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hotels Grid - responsive columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
        {currentHotels.map((hotel) => (
          <div
            key={hotel.property_id}
            className="group bg-background rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-border hover:border-primary/20 relative"
          >
            {/* Hotel Image */}
            <div className="relative h-40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10"></div>
              <img
                src={getRandomImage(hotel.property_id)}
                alt={hotel.property_name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1 z-20">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {hotel.star_rating}
              </div>
              
              {/* Premium badge for 4+ star hotels */}
              {hotel.star_rating >= 4 && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full z-20">
                  Premium
                </div>
              )}
            </div>

            {/* Hotel Content */}
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {hotel.property_name}
              </h3>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
                  {hotel.property_type}
                </div>
                
                {hotel.town && hotel.state && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{hotel.town}, {hotel.state}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span>{hotel.distance_from_center} km from center</span>
                </div>
              </div>

              {/* View Details Button */}
              <Button
                className="w-full mt-4 text-xs py-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary shadow-md hover:shadow-primary/25 transition-all duration-300 transform group-hover:-translate-y-1"
                onClick={() => navigate(`/hotels/${hotel.property_id}`)}
              >
                View Details
              </Button>
            </div>
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredHotels.length)}</span> of{' '}
            <span className="font-medium">{filteredHotels.length}</span> results
            {searchTerm && <span> (filtered from {allHotels.length} total)</span>}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-full"
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
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page as number)}
                      className={`min-w-[40px] h-9 rounded-full ${currentPage === page ? 'shadow-md' : ''}`}
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
              className="flex items-center gap-1 rounded-full"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* No results message */}
      {filteredHotels.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-6">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No hotels found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setIsFilterOpen(false);
            }}
            className="rounded-full"
          >
            Clear search
          </Button>
        </div>
      )}
    </div>
  );
}