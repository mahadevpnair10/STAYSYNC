import React, { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Calendar, DollarSign, Hotel, BarChart3, Loader2, Search, Building2, Star, Waves } from 'lucide-react';

// Color theme constants
const COLORS = {
  background: '#FAF8F1',
  accent: '#FAEAB1',
  primary: '#34656D',
  secondary: '#334443'
};

// Standalone Card Component - Updated with new theme
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-${COLORS.accent} shadow-lg backdrop-blur-sm ${className}`} style={{ borderColor: COLORS.accent }}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`font-bold text-xl ${className}`} style={{ color: COLORS.secondary }}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = "" }) => (
  <p className={`text-sm mt-2 ${className}`} style={{ color: COLORS.primary }}>
    {children}
  </p>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-4 ${className}`}>
    {children}
  </div>
);

// Standalone Button Component - Updated
const Button = ({ children, onClick, disabled, className = "", ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] ${className}`}
    style={{ backgroundColor: COLORS.primary }}
    {...props}
  >
    {children}
  </button>
);

// New decorative elements
const WaveDivider = () => (
  <div className="w-full h-4 relative overflow-hidden mb-8">
    <div className="absolute inset-0" style={{ backgroundColor: COLORS.accent }}></div>
    <Waves className="absolute top-2 w-full h-6" style={{ color: COLORS.primary, opacity: 0.3 }} />
  </div>
);

const FloatingShape = ({ position, delay }) => (
  <div 
    className={`absolute w-24 h-24 rounded-full opacity-10 animate-float ${position}`}
    style={{ 
      backgroundColor: COLORS.primary,
      animationDelay: `${delay}s`
    }}
  ></div>
);

const HotelForecastApp = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [adr, setAdr] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const API_BASE_URL = 'http://localhost:9000';
  
  // Supabase configuration - replace with your actual values
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

  // Load properties from Supabase on component mount
  useEffect(() => {
    loadPropertiesFromSupabase();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.property-dropdown');
      const input = document.querySelector('.property-input');
      if (dropdown && input && !dropdown.contains(event.target) && !input.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPropertiesFromSupabase = async () => {
    setLoadingProperties(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=name`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Extract hotel names from the response
        const hotelNames = data.map(profile => profile.name).filter(name => name);
        setProperties(hotelNames);
        setError(''); // Clear any previous errors
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error('Supabase Error:', err);
      // setError('Failed to load properties from database. Please check your Supabase configuration.');
      
      // Fallback: try to load from the original API as backup
      try {
        const fallbackResponse = await fetch(`${API_BASE_URL}/properties`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setProperties(fallbackData);
          setError('Loaded properties from backup source.');
        }
      } catch (fallbackErr) {
        console.error('Fallback API Error:', fallbackErr);
        // setError('Could not load properties from any source. Please check your configuration.');
      }
    } finally {
      setLoadingProperties(false);
    }
  };

  const handlePropertySearch = (value) => {
    setSelectedProperty(value);
    if (value.trim()) {
      const filtered = properties.filter(property =>
        property.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProperties(filtered.slice(0, 10)); // Limit to 10 results
      setShowDropdown(true);
    } else {
      setFilteredProperties([]);
      setShowDropdown(false);
    }
  };

  const selectProperty = (property) => {
    setSelectedProperty(property);
    setShowDropdown(false);
    setFilteredProperties([]);
  };

  const handleInputFocus = () => {
    if (selectedProperty.trim() && filteredProperties.length > 0) {
      setShowDropdown(true);
    } else if (selectedProperty.trim()) {
      handlePropertySearch(selectedProperty);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProperty.trim() || !adr) {
      setError('Please select a property and enter an ADR');
      return;
    }

    // Validate that the selected property exists in our list
    const propertyExists = properties.some(
      property => property.toLowerCase() === selectedProperty.toLowerCase()
    );

    if (!propertyExists) {
      setError('Please select a valid property from the dropdown');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch(`${API_BASE_URL}/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_name: selectedProperty,
          adr: parseFloat(adr)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to generate forecast');
      }
    } catch (err) {
      console.error('Forecast Error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: COLORS.background }}>
      {/* Floating background shapes */}
      <FloatingShape position="top-20 left-10" delay="0" />
      <FloatingShape position="top-40 right-16" delay="1.5" />
      <FloatingShape position="bottom-60 left-20" delay="2.5" />
      
      {/* Header */}
      <header className="relative z-10" style={{ backgroundColor: COLORS.accent }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl shadow-lg" style={{ backgroundColor: COLORS.primary }}>
                <Hotel className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: COLORS.secondary }}>
                  Hotel Forecast Analytics
                </h1>
                <p className="text-sm mt-1" style={{ color: COLORS.primary }}>
                  AI-Powered Occupancy Prediction & Revenue Insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: COLORS.background }}>
              <Star className="w-5 h-5" style={{ color: COLORS.primary }} fill={COLORS.accent} />
              {/* <span className="font-medium" style={{ color: COLORS.secondary }}>Premium</span> */}
            </div>
          </div>
        </div>
        <WaveDivider />
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 shadow-md" style={{ backgroundColor: COLORS.accent }}>
            <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
            <span className="font-medium" style={{ color: COLORS.secondary }}>Predict Future Performance</span>
          </div>
          <h2 className="text-5xl font-bold mb-6 max-w-3xl mx-auto leading-tight" style={{ color: COLORS.secondary }}>
            Transform Your Hotel's Revenue Strategy with AI
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: COLORS.primary }}>
            Generate accurate 30-day occupancy forecasts with our advanced machine learning algorithms to optimize your pricing and maximize revenue.
          </p>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
              <span style={{ color: COLORS.secondary }}>Accurate Predictions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
              <span style={{ color: COLORS.secondary }}>Revenue Optimization</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
              <span style={{ color: COLORS.secondary }}>Market Insights</span>
            </div>
          </div>
        </section>

        {/* Forecast Form */}
        <section className="mb-16">
          <Card className="max-w-2xl mx-auto shadow-2xl overflow-hidden">
            <div className="p-1 rounded-t-2xl" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}>
              <div className="bg-white rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: COLORS.accent }}>
                      <BarChart3 className="w-6 h-6" style={{ color: COLORS.primary }} />
                    </div>
                    <CardTitle>Generate Forecast</CardTitle>
                  </div>
                  <CardDescription>
                    Select your property and set your average daily rate to get started with AI-powered forecasting
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="space-y-6">
                    {/* Property Selection */}
                    <div className="relative">
                      <label className="block text-sm font-semibold mb-3" style={{ color: COLORS.secondary }}>
                        <Building2 className="inline w-4 h-4 mr-1" />
                        Property Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={selectedProperty}
                          onChange={(e) => handlePropertySearch(e.target.value)}
                          onFocus={handleInputFocus}
                          placeholder={loadingProperties ? "Loading properties..." : "Start typing to search properties..."}
                          disabled={loadingProperties}
                          className="property-input w-full px-4 py-4 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 bg-white focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm"
                          style={{ 
                            borderColor: COLORS.accent,
                            focusBorderColor: COLORS.primary,
                            focusRingColor: COLORS.primary
                          }}
                        />
                        {loadingProperties ? (
                          <Loader2 className="absolute right-4 top-4 w-5 h-5 animate-spin" style={{ color: COLORS.primary }} />
                        ) : (
                          <Search className="absolute right-4 top-4 w-5 h-5" style={{ color: COLORS.primary }} />
                        )}
                        
                        {showDropdown && filteredProperties.length > 0 && (
                          <div className="property-dropdown absolute top-full left-0 right-0 bg-white border-2 rounded-xl shadow-2xl z-20 max-h-60 overflow-y-auto mt-2" style={{ borderColor: COLORS.accent }}>
                            {filteredProperties.map((property, index) => (
                              <div
                                key={index}
                                onClick={() => selectProperty(property)}
                                className="px-4 py-4 hover:bg-opacity-50 cursor-pointer transition-all duration-200 border-b last:border-b-0 flex items-center gap-3 group"
                                style={{ 
                                  borderColor: COLORS.accent,
                                  backgroundColor: index % 2 === 0 ? `${COLORS.background}80` : 'transparent',
                                  hoverBackgroundColor: COLORS.accent
                                }}
                              >
                                <Hotel className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: COLORS.primary }} />
                                <span className="font-medium group-hover:translate-x-1 transition-transform" style={{ color: COLORS.secondary }}>{property}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {showDropdown && filteredProperties.length === 0 && selectedProperty.trim() && (
                          <div className="property-dropdown absolute top-full left-0 right-0 bg-white border-2 rounded-xl shadow-2xl z-20 mt-2" style={{ borderColor: COLORS.accent }}>
                            <div className="px-4 py-4 text-center" style={{ color: COLORS.primary }}>
                              <Hotel className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No properties found matching "{selectedProperty}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {properties.length > 0 && (
                        <p className="text-xs mt-2 font-medium" style={{ color: COLORS.primary }}>
                          {properties.length} properties available in database
                        </p>
                      )}
                    </div>

                    {/* ADR Input */}
                    <div>
                      <label className="block text-sm font-semibold mb-3" style={{ color: COLORS.secondary }}>
                        <DollarSign className="inline w-4 h-4 mr-1" />
                        Average Daily Rate (ADR)
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-4 w-5 h-5 flex items-center justify-center rounded-full" style={{ backgroundColor: COLORS.accent }}>
                          <DollarSign className="w-3 h-3" style={{ color: COLORS.primary }} />
                        </div>
                        <input
                          type="number"
                          value={adr}
                          onChange={(e) => setAdr(e.target.value)}
                          placeholder="Enter your average daily rate"
                          step="0.01"
                          min="0"
                          className="w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 bg-white focus:bg-white shadow-sm"
                          style={{ 
                            borderColor: COLORS.accent,
                            focusBorderColor: COLORS.primary
                          }}
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="p-4 rounded-xl border-2 shadow-sm" style={{ backgroundColor: `${COLORS.accent}40`, borderColor: COLORS.accent }}>
                        <p className="font-medium text-sm" style={{ color: COLORS.secondary }}>{error}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || !selectedProperty.trim() || !adr || loadingProperties}
                      className="w-full py-4 text-white rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 disabled:transform-none flex items-center justify-center gap-2 font-bold text-lg"
                      style={{ 
                        backgroundColor: COLORS.primary,
                        hoverBackgroundColor: COLORS.secondary
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating AI Forecast...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-5 h-5" />
                          Generate 30-Day Forecast
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </section>

        {/* Results Section */}
        {results && (
          <section className="space-y-12">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="rounded-2xl overflow-hidden shadow-2xl border-0 transform hover:scale-[1.02] transition-all duration-300">
                <div className="p-1" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}>
                  <div className="bg-white rounded-2xl p-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ backgroundColor: `${COLORS.accent}80` }}>
                          <Calendar className="w-6 h-6" style={{ color: COLORS.primary }} />
                        </div>
                        <CardTitle>Total Room Nights</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold mb-2" style={{ color: COLORS.secondary }}>
                        {formatNumber(results.total_room_nights)}
                      </div>
                      <p className="text-sm font-medium" style={{ color: COLORS.primary }}>
                        Forecasted occupancy for the next 30 days
                      </p>
                    </CardContent>
                  </div>
                </div>
              </Card>

              <Card className="rounded-2xl overflow-hidden shadow-2xl border-0 transform hover:scale-[1.02] transition-all duration-300">
                <div className="p-1" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}>
                  <div className="bg-white rounded-2xl p-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ backgroundColor: `${COLORS.accent}80` }}>
                          <DollarSign className="w-6 h-6" style={{ color: COLORS.primary }} />
                        </div>
                        <CardTitle>Projected Revenue</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold mb-2" style={{ color: COLORS.secondary }}>
                        {formatCurrency(results.total_revenue)}
                      </div>
                      <p className="text-sm font-medium" style={{ color: COLORS.primary }}>
                        Based on your current ADR settings
                      </p>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </div>

            {/* Forecast Chart */}
            <Card className="rounded-2xl shadow-2xl border-0 overflow-hidden">
              <div className="p-1" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}>
                <div className="bg-white rounded-2xl p-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl" style={{ backgroundColor: COLORS.accent }}>
                        <TrendingUp className="w-6 h-6" style={{ color: COLORS.primary }} />
                      </div>
                      <div>
                        <CardTitle>Occupancy Forecast Trend</CardTitle>
                        <CardDescription>
                          Historical data vs. predicted occupancy for the next 30 days
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="rounded-2xl overflow-hidden shadow-inner border-2" style={{ borderColor: COLORS.accent }}>
                      <img
                        src={`data:image/png;base64,${results.plot_image}`}
                        alt="Occupancy Forecast Chart"
                        className="w-full h-auto"
                      />
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>

            {/* Property Location Map */}
            <Card className="rounded-2xl shadow-2xl border-0 overflow-hidden">
              <div className="p-1" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}>
                <div className="bg-white rounded-2xl p-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl" style={{ backgroundColor: COLORS.accent }}>
                        <MapPin className="w-6 h-6" style={{ color: COLORS.primary }} />
                      </div>
                      <div>
                        <CardTitle>Property Location</CardTitle>
                        <CardDescription>
                          Geographic location of the selected property
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div 
                      className="w-full h-96 rounded-2xl overflow-hidden shadow-inner border-2"
                      style={{ borderColor: COLORS.accent }}
                      dangerouslySetInnerHTML={{ __html: results.map_html }}
                    />
                  </CardContent>
                </div>
              </div>
            </Card>
          </section>
        )}
      </main>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-8 border-0 shadow-2xl max-w-md mx-4 transform scale-110">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div 
                  className="w-20 h-20 rounded-full animate-pulse opacity-20 absolute inset-0"
                  style={{ backgroundColor: COLORS.primary }}
                ></div>
                <div 
                  className="w-20 h-20 rounded-full border-4 border-transparent border-t-current animate-spin absolute top-0"
                  style={{ color: COLORS.primary }}
                ></div>
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: COLORS.secondary }}>
                Generating Forecast
              </h3>
              <p className="font-medium" style={{ color: COLORS.primary }}>
                Analyzing historical data and predicting future trends...
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 relative z-10" style={{ backgroundColor: COLORS.accent }}>
        <WaveDivider />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Hotel className="w-6 h-6" style={{ color: COLORS.primary }} />
              <span className="text-xl font-bold" style={{ color: COLORS.secondary }}>Hotel Forecast Analytics</span>
            </div>
            <p className="max-w-2xl mx-auto font-medium" style={{ color: COLORS.primary }}>
              Powered by advanced machine learning algorithms for accurate hospitality forecasting and revenue optimization
            </p>
          </div>
        </div>
      </footer>

      {/* Add custom styles for the floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default HotelForecastApp;