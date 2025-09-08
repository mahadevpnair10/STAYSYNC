import SEO from "@/components/SEO";
import heroImage from "@/assets/hero-hotel.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, ConciergeBell, Sparkles, CreditCard, Star, ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import HotelsGrid from "@/components/HotelsGrid";

const Index = () => {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("staysync_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    
    // Animation trigger
    setTimeout(() => setIsVisible(true), 100);
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
    <main className="overflow-hidden">
      <SEO
        title="Hotel Management Platform"
        description="Manage bookings, room service, housekeeping, payments, and accounting with a delightful interface."
        canonical="/"
        image={heroImage}
        jsonLd={jsonLd}
      />

      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"></div>
      </div>

      {/* Welcome user if logged in */}
      {user && (
        <section className={`container mx-auto py-6 text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center bg-background/80 backdrop-blur-sm rounded-full px-6 py-3 border shadow-sm">
            <span className="relative flex h-2 w-2 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <h2 className="text-xl font-semibold">Welcome back, {user.name}!</h2>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/80 z-0"></div>
        
        {/* Animated floating elements */}
        <div className="absolute top-1/4 left-1/4 w-6 h-6 rounded-full bg-purple-500/30 animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-8 h-8 rounded-full bg-blue-500/20 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-10 h-10 rounded-full bg-amber-500/10 animate-float animation-delay-4000"></div>
        
        <div className="container mx-auto grid items-center gap-16 py-16 md:grid-cols-2 relative z-10">
          <div className={`transition-all duration-700 delay-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              Revolutionizing Hotel Management
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Elevate your <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">hotel operations</span>
            </h1>
            
            <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
              A modern, unified system for reservations, room service, housekeeping, payments, and accounting. 
              Designed for excellence in hospitality management.
            </p>
            
            <div className="mt-8 flex flex-wrap gap-4">
              {/* Show only relevant portal button */}
              {user?.role === "user" && (
                <Link to="/user">
                  <Button variant="hero" size="lg" className="group rounded-full px-8 py-6 text-lg font-medium shadow-lg shadow-primary/25">
                    <ConciergeBell className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" /> 
                    Enter User Portal
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              )}
              {user?.role === "admin" && (
                <Link to="/admin">
                  <Button variant="outline" size="lg" className="group rounded-full px-8 py-6 text-lg font-medium border-2">
                    <BedDouble className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" /> 
                    Open Admin Portal
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              )}

              {/* If no user logged in, show login/register */}
              {!user && (
                <>
                  <Link to="/login">
                    <Button variant="hero" size="lg" className="group rounded-full px-8 py-6 text-lg font-medium shadow-lg shadow-primary/25">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="outline" size="lg" className="group rounded-full px-8 py-6 text-lg font-medium border-2">
                      Create Account
                      <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            <div className="mt-12 flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-2 font-medium">4.9/5</span>
              </div>
              <div className="h-6 w-px bg-border"></div>
              <div>Trusted by 500+ hotels worldwide</div>
            </div>
          </div>
          
          <div className={`relative transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20">
              <img
                src={heroImage}
                alt="Luxurious hotel lobby with warm lighting and modern furniture"
                className="w-full h-auto rounded-3xl transform transition-all duration-700 hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-background/0"></div>
              
              {/* Decorative frame */}
              <div className="absolute inset-0 rounded-3xl border border-primary/20 pointer-events-none"></div>
            </div>
            
            {/* Floating card elements */}
            <div className="absolute -bottom-6 -left-6 bg-background/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-background"></div>
                  ))}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">24/7 Support</p>
                  <p className="text-xs text-muted-foreground">Always available</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -top-6 -right-6 bg-background/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border">
              <div className="flex items-center">
                <div className="rounded-full bg-green-500/20 p-2">
                  <CreditCard className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">Secure Payments</p>
                  <p className="text-xs text-muted-foreground">Encrypted</p>
                </div>
              </div>
            </div>
            
            <div
              className="pointer-events-none absolute -inset-10 rounded-3xl opacity-40 blur-xl"
              style={{
                background:
                  "radial-gradient(400px 200px at 20% 10%, hsl(var(--primary)/0.35), transparent), radial-gradient(400px 200px at 80% 20%, hsl(var(--primary)/0.25), transparent)",
              }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 overflow-hidden">
        <div className="container mx-auto">
          <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl font-bold mb-6">Everything You Need in One Platform</h2>
            <p className="text-xl text-muted-foreground">
              Streamline your hotel operations with our comprehensive suite of tools designed for modern hospitality businesses.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <Card className={`border-0 bg-gradient-to-br from-background to-background/80 backdrop-blur-sm shadow-2xl shadow-primary/10 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-500/10 mb-4">
                  <Sparkles className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  Room Booking
                </CardTitle>
                <CardDescription className="text-base">
                  Fast, reliable, and flexible reservations with availability insights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Streamline check-ins, manage rates, and keep occupancy high with our intuitive booking system.
                </p>
                <ul className="mt-4 space-y-2">
                  {['Real-time availability', 'Dynamic pricing', 'Multi-channel sync', 'Guest management'].map((item, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card className={`border-0 bg-gradient-to-br from-background to-background/80 backdrop-blur-sm shadow-2xl shadow-primary/10 overflow-hidden transition-all duration-500 delay-150 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-600"></div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-500/10 mb-4">
                  <ConciergeBell className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  Room Service & Housekeeping
                </CardTitle>
                <CardDescription className="text-base">
                  Track requests and staff tasks with clarity and efficiency.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Prioritize, assign, and complete tasks with real-time notifications and status updates.
                </p>
                <ul className="mt-4 space-y-2">
                  {['Task automation', 'Real-time alerts', 'Performance analytics', 'Inventory tracking'].map((item, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card className={`border-0 bg-gradient-to-br from-background to-background/80 backdrop-blur-sm shadow-2xl shadow-primary/10 overflow-hidden transition-all duration-500 delay-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="h-2 bg-gradient-to-r from-green-500 to-teal-600"></div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-500/10 mb-4">
                  <CreditCard className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  Payments & Accounting
                </CardTitle>
                <CardDescription className="text-base">
                  Process payments and keep your books clean with automated tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Integrate with Stripe, view revenue reports, track taxes, and manage settlements all in one place.
                </p>
                <ul className="mt-4 space-y-2">
                  {['Secure transactions', 'Financial reports', 'Tax management', 'Multi-currency'].map((item, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Hotels Showcase Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"></div>
        
        <div className="container mx-auto relative">
          <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl font-bold mb-6">Discover Amazing Properties</h2>
            <p className="text-xl text-muted-foreground">
              Browse through our curated selection of hotels and find the perfect stay for your needs. 
              Each property is vetted for quality and service excellence.
            </p>
          </div>
          <HotelsGrid />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 -z-10"></div>
        <div className="container mx-auto text-center">
          <div className={`max-w-3xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Hotel Management?</h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of hotels that have streamlined their operations and enhanced guest experiences with StaySync.
            </p>
            
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              {user?.role === "user" && (
                <Link to="/user">
                  <Button variant="hero" size="lg" className="group rounded-full px-8 py-6 text-lg font-medium shadow-lg shadow-primary/25">
                    <ConciergeBell className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" /> 
                    Try User Portal
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              )}
              {user?.role === "admin" && (
                <Link to="/admin">
                  <Button variant="outline" size="lg" className="group rounded-full px-8 py-6 text-lg font-medium border-2">
                    <BedDouble className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" /> 
                    Manage as Admin
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              )}
              {!user && (
                <>
                  <Link to="/login">
                    <Button variant="hero" size="lg" className="group rounded-full px-8 py-6 text-lg font-medium shadow-lg shadow-primary/25">
                      Get Started Today
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="outline" size="lg" className="group rounded-full px-8 py-6 text-lg font-medium border-2">
                      Create Account
                      <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            <div className="mt-12 text-sm text-muted-foreground">
              No credit card required • Start your free trial today
            </div>
          </div>
        </div>
      </section>
      
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
};

export default Index;