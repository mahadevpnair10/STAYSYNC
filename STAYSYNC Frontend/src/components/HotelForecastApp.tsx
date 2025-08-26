import React, { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Calendar, DollarSign, Hotel, BarChart3, Loader2 } from 'lucide-react';

// Standalone Card Component
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`font-semibold text-lg ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = "" }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-4 ${className}`}>
    {children}
  </div>
);

// Standalone Button Component
const Button = ({ children, onClick, disabled, className = "", ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    {...props}
  >
    {children}
  </button>
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

  const API_BASE_URL = 'http://localhost:9000'; // Change to your API URL

  // Load properties on component mount
  useEffect(() => {
    loadProperties();
  }, []);

const loadProperties = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/properties`);
    if (response.ok) {
      const data = await response.json();
      // Extract just the names into a string[]
      setProperties(data.map((p) => p["Property Name"]));
    } else {
      setError('Failed to load properties. Please ensure the API is running.');
    }
  } catch (err) {
    console.error('API Error:', err);
    setError('Connection error. Please check if the API server is running on http://localhost:9000');
  }
};


const handlePropertySearch = (value: string) => {
  setSelectedProperty(value);
  if (value) {
    const filtered = properties.filter(property =>
      property?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredProperties(filtered.slice(0, 10));
    setShowDropdown(true);
  } else {
    setShowDropdown(false);
  }
};

  const selectProperty = (property) => {
    setSelectedProperty(property);
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    if (!selectedProperty || !adr) {
      setError('Please select a property and enter an ADR');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Hotel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hotel Forecast Analytics
                </h1>
                <p className="text-sm text-gray-600">Advanced occupancy prediction & revenue insights</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Predict Your Hotel's Future Performance
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate accurate 30-day occupancy forecasts with AI-powered analytics to optimize your revenue strategy.
          </p>
        </section>

        {/* Forecast Form */}
        <section className="mb-12">
          <Card className="max-w-2xl mx-auto shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5" />
                Generate Forecast
              </CardTitle>
              <CardDescription className="text-blue-100">
                Select your property and set your average daily rate to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Property Selection */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Property Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedProperty}
                      onChange={(e) => handlePropertySearch(e.target.value)}
                      onFocus={() => selectedProperty && setShowDropdown(true)}
                      placeholder="Start typing to search properties..."
                      className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    />
                    <MapPin className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
                    
                    {showDropdown && filteredProperties.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto mt-1">
                        {filteredProperties.map((property, index) => (
                          <div
                            key={index}
                            onClick={() => selectProperty(property)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <Hotel className="w-4 h-4 text-blue-500" />
                              <span className="text-sm">{property}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ADR Input */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Average Daily Rate (ADR)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={adr}
                      onChange={(e) => setAdr(e.target.value)}
                      placeholder="Enter your ADR"
                      step="0.01"
                      min="0"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !selectedProperty || !adr}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transform hover:scale-[1.02] transition-all duration-200 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Forecast...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Generate 30-Day Forecast
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Results Section */}
        {results && (
          <section className="space-y-8">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Calendar className="w-5 h-5" />
                    Total Room Nights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800">
                    {formatNumber(results.total_room_nights)}
                  </div>
                  <p className="text-sm text-green-600 mt-1">Forecasted for next 30 days</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <DollarSign className="w-5 h-5" />
                    Projected Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-800">
                    {formatCurrency(results.total_revenue)}
                  </div>
                  <p className="text-sm text-blue-600 mt-1">Based on your ADR settings</p>
                </CardContent>
              </Card>
            </div>

            {/* Forecast Chart */}
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Occupancy Forecast Trend
                </CardTitle>
                <CardDescription>
                  Historical data (last 30 days) vs. predicted occupancy (next 30 days)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-white rounded-lg p-4 shadow-inner">
                  <img
                    src={`data:image/png;base64,${results.plot_image}`}
                    alt="Occupancy Forecast Chart"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property Location Map */}
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-500" />
                  Property Location
                </CardTitle>
                <CardDescription>
                  Geographic location of the selected property
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div 
                  className="w-full h-96 rounded-lg overflow-hidden shadow-inner"
                  dangerouslySetInnerHTML={{ __html: results.map_html }}
                />
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Generating Forecast</h3>
              <p className="text-gray-600">Analyzing data and predicting trends...</p>
            </div>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">
              Powered by advanced machine learning algorithms for accurate hospitality forecasting
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HotelForecastApp;