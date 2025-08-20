
import SEO from "@/components/SEO";
import heroImage from "@/assets/hero-hotel.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, ConciergeBell, Sparkles, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";


const Index = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const stored = localStorage.getItem('staysync_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
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
    <main>
      <SEO
        title="Hotel Management Platform"
        description="Manage bookings, room service, housekeeping, payments, and accounting with a delightful interface."
        canonical="/"
        image={heroImage}
        jsonLd={jsonLd}
      />

      {/* Welcome user if logged in */}
      {user && (
        <section className="container mx-auto py-6 text-center">
          <h2 className="text-2xl font-semibold">Welcome, {user.name}!</h2>
          <p className="text-muted-foreground">You are logged in as <b>{user.email}</b>.</p>
        </section>
      )}

      {/* Hero */}
      <section className="bg-hero">
        <div className="container mx-auto grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Elevate your hotel operations
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              A modern, unified system for reservations, room service, housekeeping, payments, and accounting.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/user"><Button variant="hero" size="lg"><ConciergeBell className="mr-2" /> Enter User Portal</Button></Link>
              <Link to="/admin"><Button variant="outline" size="lg"><BedDouble className="mr-2" /> Open Admin Portal</Button></Link>
              {!user && (
                <>
                  <Link to="/login"><Button variant="secondary" size="lg">Login</Button></Link>
                  <Link to="/register"><Button variant="secondary" size="lg">Register</Button></Link>
                </>
              )}
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImage}
              alt="Luxurious hotel lobby with warm lighting and modern furniture"
              className="w-full rounded-xl shadow-elevated"
              loading="eager"
            />
            <div className="pointer-events-none absolute -inset-6 rounded-2xl opacity-40 blur-2xl" style={{background:"radial-gradient(400px 200px at 20% 10%, hsl(var(--accent)/0.35), transparent), radial-gradient(400px 200px at 80% 20%, hsl(var(--primary)/0.35), transparent)"}} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto grid gap-6 py-12 md:grid-cols-3">
        <Card className="transition hover:shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent" /> Room Booking</CardTitle>
            <CardDescription>Fast, reliable, and flexible reservations with availability insights.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Streamline check-ins, manage rates, and keep occupancy high.</p>
          </CardContent>
        </Card>
        <Card className="transition hover:shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ConciergeBell className="text-accent" /> Room Service & Housekeeping</CardTitle>
            <CardDescription>Track requests and staff tasks with clarity.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Prioritize, assign, and complete tasks with notifications.</p>
          </CardContent>
        </Card>
        <Card className="transition hover:shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="text-accent" /> Payments & Accounting</CardTitle>
            <CardDescription>Process payments and keep your books clean.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Integrate Stripe, view revenue, taxes, and settlements.</p>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container mx-auto py-20 text-center">
        <h2 className="text-3xl font-semibold">Run smoother stays with StaySync</h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Start with the portals below. Add authentication, real data, and payments when you’re ready.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/user"><Button variant="hero" size="lg">Try User Portal</Button></Link>
          <Link to="/admin"><Button variant="outline" size="lg"><BedDouble className="mr-2" />Manage as Admin</Button></Link>
          {!user && (
            <>
              <Link to="/login"><Button variant="secondary" size="lg">Login</Button></Link>
              <Link to="/register"><Button variant="secondary" size="lg">Register</Button></Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default Index;
