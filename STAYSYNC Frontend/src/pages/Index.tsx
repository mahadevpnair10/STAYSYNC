import SEO from "@/components/SEO";
import heroImage from "@/assets/hero-hotel.jpg";
import { Button } from "@/components/ui/button";
import HotelsGrid from "@/components/HotelsGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, ConciergeBell, Sparkles, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const Index = () => {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    // Using a fallback instead of localStorage for compatibility
    // In a real app, you would use proper authentication state management
    const mockUser = null; // Replace with your auth state
    setUser(mockUser);
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: "STAYSYNC",
    image: "hero-hotel.jpg",
    description:
      "Online Hotel Management System for bookings, room service, housekeeping, payments, and accounting.",
  };

  return (
    <main className="min-h-screen">
      <SEO
        title="Hotel Management Platform"
        description="Manage bookings, room service, housekeeping, payments, and accounting with a delightful interface."
        canonical="/"
        image={heroImage}
        jsonLd={jsonLd}
      />

      {/* Welcome user if logged in */}
      {user && (
        <section className="container mx-auto py-6 text-center bg-gradient-to-r from-primary/5 to-accent/5">
          <h2 className="text-2xl font-semibold">Welcome back, {user.name}!</h2>
          <p className="text-muted-foreground">
            You are logged in as <span className="font-medium">{user.email}</span>
          </p>
        </section>
      )}

      {/* Hero Section */}
      <section className="bg-hero relative overflow-hidden">
        <div className="container mx-auto grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="z-10">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Elevate your hotel operations
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg">
              A modern, unified system for reservations, room service, housekeeping, payments, and
              accounting that transforms how you manage your property.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {/* Show only relevant portal button */}
              {user?.role === "user" && (
                <Link to="/user">
                  <Button variant="hero" size="lg" className="shadow-lg">
                    <ConciergeBell className="mr-2" /> Enter User Portal
                  </Button>
                </Link>
              )}
              {user?.role === "admin" && (
                <Link to="/admin">
                  <Button variant="outline" size="lg" className="shadow-lg">
                    <BedDouble className="mr-2" /> Open Admin Portal
                  </Button>
                </Link>
              )}

              {/* If no user logged in, show login/register */}
              {!user && (
                <>
                  <Link to="/login">
                    <Button variant="default" size="lg" className="shadow-lg">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="secondary" size="lg" className="shadow-lg">
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImage}
              alt="Luxurious hotel lobby with warm lighting and modern furniture"
              className="w-full rounded-xl shadow-2xl"
              loading="eager"
            />
            <div
              className="pointer-events-none absolute -inset-6 rounded-2xl opacity-40 blur-2xl"
              style={{
                background:
                  "radial-gradient(400px 200px at 20% 10%, hsl(var(--accent)/0.35), transparent), radial-gradient(400px 200px at 80% 20%, hsl(var(--primary)/0.35), transparent)",
              }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything you need to manage your hotel</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Streamline operations with our comprehensive suite of tools designed specifically for the hospitality industry.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="text-primary h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Smart Reservations</CardTitle>
                <CardDescription className="text-base">
                  Intelligent booking system with real-time availability and dynamic pricing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Optimize occupancy rates with automated pricing, seamless check-ins, and comprehensive booking analytics.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <ConciergeBell className="text-accent h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Service Management</CardTitle>
                <CardDescription className="text-base">
                  Coordinate room service and housekeeping with intelligent task routing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Real-time notifications, priority queuing, and staff coordination for exceptional guest experiences.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="text-green-600 h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Financial Control</CardTitle>
                <CardDescription className="text-base">
                  Integrated payments and accounting with detailed financial insights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Stripe integration, automated invoicing, revenue tracking, and comprehensive financial reporting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Hotels Showcase Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Discover Amazing Properties
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse through our curated selection of hotels and find the perfect stay for your needs.
            </p>
          </div>
          <HotelsGrid />
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-primary to-accent py-20 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your hotel management?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/90 text-lg mb-8">
            Join thousands of hotels already using StaySync to deliver exceptional guest experiences 
            and streamline their operations.
          </p>
          
          <div className="flex justify-center gap-4 flex-wrap">
            {user?.role === "user" && (
              <Link to="/user">
                <Button variant="secondary" size="lg" className="shadow-lg">
                  <ConciergeBell className="mr-2" /> Access User Portal
                </Button>
              </Link>
            )}
            {user?.role === "admin" && (
              <Link to="/admin">
                <Button variant="secondary" size="lg" className="shadow-lg">
                  <BedDouble className="mr-2" /> Manage as Admin
                </Button>
              </Link>
            )}
            {!user && (
              <>
                <Link to="/register">
                  <Button variant="secondary" size="lg" className="shadow-lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="shadow-lg border-white text-white hover:bg-white hover:text-primary">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          <p className="mt-6 text-sm text-white/70">
            No credit card required • Free 14-day trial • Cancel anytime
          </p>
        </div>
      </section>
    </main>
  );
};

export default Index;