import SEO from "@/components/SEO";
import heroImage from "@/assets/hero-hotel.jpg";
import { Button } from "@/components/ui/button";
import HotelsGrid from "@/components/HotelsGrid";
import { BedDouble, ConciergeBell, Sparkles, CreditCard, Star, ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

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
    <main className="overflow-hidden" style={{ backgroundColor: "#FAF8F1" }}>
      <SEO
        title="Hotel Management Platform"
        description="Manage bookings, room service, housekeeping, payments, and accounting with a delightful interface."
        canonical="/"
        image={heroImage}
        jsonLd={jsonLd}
      />

      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full"
          style={{ backgroundColor: "#34656D20" }}
        ></div>
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full"
          style={{ backgroundColor: "#33444320" }}
        ></div>
      </div>

      {/* Welcome user if logged in */}
      {user && (
        <section
          className={`container mx-auto py-4 text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div
            className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-lg px-6 py-3 border shadow-sm"
            style={{ borderColor: "#FAEAB1" }}
          >
            <span className="relative flex h-2 w-2 mr-3">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full"
                style={{ backgroundColor: "#34656D80" }}
              ></span>
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: "#34656D" }}
              ></span>
            </span>
            <h2 className="text-xl font-semibold" style={{ color: "#334443" }}>
              Welcome back, {user.name}!
            </h2>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF8F1] via-[#FAF8F1] to-[#FAF8F1]/80 z-0"></div>

        {/* Animated floating elements */}
        <div
          className="absolute top-1/4 left-1/4 w-6 h-6 rounded-full animate-float"
          style={{ backgroundColor: "#34656D30" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-8 h-8 rounded-full animate-float animation-delay-2000"
          style={{ backgroundColor: "#33444320" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-10 h-10 rounded-full animate-float animation-delay-4000"
          style={{ backgroundColor: "#FAEAB130" }}
        ></div>

        <div className="container mx-auto grid items-center gap-16 py-8 md:grid-cols-2 relative z-10">
          {/* Hero Text */}
          <div
            className={`transition-all duration-700 delay-150 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium mb-6"
              style={{ backgroundColor: "#FAEAB1", color: "#334443" }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Revolutionizing Hotel Management
            </div>

            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight"
              style={{ color: "#334443" }}
            >
              Elevate your <span style={{ color: "#34656D" }}>hotel operations</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed" style={{ color: "#334443" }}>
              A modern, unified system for reservations, room service, housekeeping, payments, and
              accounting. Designed for excellence in hospitality management.
            </p>

            {/* Portal Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              {user?.role === "user" && (
                <Link to="/user">
                  <Button
                    size="lg"
                    className="group rounded-lg px-8 py-6 text-lg font-medium shadow-lg transition-all hover:shadow-xl"
                    style={{
                      backgroundColor: "#34656D",
                      color: "#FAF8F1",
                    }}
                  >
                    <ConciergeBell className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    Enter User Portal
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              )}
              {user?.role === "admin" && (
                <div className="flex space-x-4"> {/* flex with gap between buttons */}
                {/* Admin Portal Button (transparent style) */}
                <Link to="/admin">
                  <Button
                    size="md" // smaller than lg
                    className="group rounded-lg px-6 py-4 text-base font-medium border-2 transition-all hover:shadow-lg"
                    style={{
                      backgroundColor: "transparent",
                      color: "#34656D",
                      borderColor: "#34656D",
                    }}
                  >
                    <BedDouble className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    Open Admin Portal
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>

                {/* Forecast Portal Button (filled style) */}
                <Link to="/forecast">
                  <Button
                    size="md"
                    className="group rounded-lg px-6 py-4 text-base font-medium border-2 transition-all hover:shadow-lg"
                    style={{
                      backgroundColor: "#34656D", // filled
                      color: "white",
                      borderColor: "#34656D",
                    }}
                  >
                    <BedDouble className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    Open Forecast Portal
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

              )}

              {!user && (
                <>
                  <Link to="/login">
                    <Button
                      size="lg"
                      className="group rounded-lg px-8 py-6 text-lg font-medium shadow-lg transition-all hover:shadow-xl"
                      style={{
                        backgroundColor: "#34656D",
                        color: "#FAF8F1",
                      }}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button
                      size="lg"
                      className="group rounded-lg px-8 py-6 text-lg font-medium border-2 transition-all hover:shadow-lg"
                      style={{
                        backgroundColor: "transparent",
                        color: "#34656D",
                        borderColor: "#34656D",
                      }}
                    >
                      Create Account
                      <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Rating + Trust */}
            <div className="mt-12 flex items-center gap-6" style={{ color: "#334443" }}>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-5 w-5"
                    style={{ fill: "#FAEAB1", color: "#FAEAB1" }}
                  />
                ))}
                <span className="ml-2 font-medium">4.9/5</span>
              </div>
              <div className="h-6 w-px" style={{ backgroundColor: "#FAEAB1" }}></div>
              <div>Trusted by 500+ hotels worldwide</div>
            </div>
          </div>

          {/* Hero Image */}
          <div
            className={`relative transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div
              className="relative rounded-2xl overflow-hidden shadow-xl"
              style={{ boxShadow: "0 20px 40px rgba(52, 101, 109, 0.15)" }}
            >
              <img
                src={heroImage}
                alt="Luxurious hotel lobby with warm lighting and modern furniture"
                className="w-full h-auto rounded-2xl transform transition-all duration-700 hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F1]/40 to-[#FAF8F1]/0"></div>
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ border: "1px solid #FAEAB1" }}
              ></div>
            </div>

            {/* Floating cards */}
            <div
              className="absolute -bottom-6 -left-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border"
              style={{ borderColor: "#FAEAB1" }}
            >
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-8 w-8 rounded-full border-2 border-white"
                      style={{
                        background: "linear-gradient(135deg, #34656D, #334443)",
                      }}
                    ></div>
                  ))}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium" style={{ color: "#334443" }}>
                    24/7 Support
                  </p>
                  <p className="text-xs" style={{ color: "#34656D" }}>
                    Always available
                  </p>
                </div>
              </div>
            </div>

            <div
              className="absolute -top-6 -right-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border"
              style={{ borderColor: "#FAEAB1" }}
            >
              <div className="flex items-center">
                <div
                  className="rounded-full p-2"
                  style={{ backgroundColor: "#FAEAB1" }}
                >
                  <CreditCard className="h-5 w-5" style={{ color: "#34656D" }} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium" style={{ color: "#334443" }}>
                    Secure Payments
                  </p>
                  <p className="text-xs" style={{ color: "#34656D" }}>
                    Encrypted
                  </p>
                </div>
              </div>
            </div>

            <div
              className="pointer-events-none absolute -inset-10 rounded-2xl opacity-40 blur-xl"
              style={{
                background:
                  "radial-gradient(400px 200px at 20% 10%, rgba(52, 101, 109, 0.35), transparent), radial-gradient(400px 200px at 80% 20%, rgba(51, 68, 67, 0.25), transparent)",
              }}
            />
          </div>
        </div>
      </section>

      {/* Hotels Showcase Section (only for user role) */}
      {user?.role === "user" && (
        <section className="py-12 relative overflow-hidden">
          <div
            className="absolute -top-10 -right-40 h-80 w-80 rounded-full blur-3xl"
            style={{ backgroundColor: "#34656D10" }}
          ></div>
          <div
            className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl"
            style={{ backgroundColor: "#33444310" }}
          ></div>

          <div className="container mx-auto relative">
            <HotelsGrid />
          </div>
        </section>
      )}

      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(5deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
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
