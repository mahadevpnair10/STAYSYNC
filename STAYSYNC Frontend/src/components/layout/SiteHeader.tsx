import { Link } from "react-router-dom";
import { User } from "lucide-react"; // profile icon
import { useEffect, useState } from "react";
import { supabase } from "@/../supabaseClient";
import { Button } from "@/components/ui/button";

const SiteHeader = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Fetch current session on mount
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    getSession();

    // Listen for login/logout
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("staysync_user"); // <-- Add this line
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <header className="flex items-center justify-between p-4 shadow-md bg-white">
      <Link to="/" className="text-2xl font-bold text-green-900">
        StaySync
      </Link>

      <nav className="flex items-center gap-4">
        {user ? (
          <>
            {/* Profile icon */}
            <Link to="/profile" className="p-2 rounded-full hover:bg-gray-100">
              <User size={22} />
            </Link>

            <Button onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-blue-500">Login</Link>
            <Link to="/register" className="hover:text-blue-500">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default SiteHeader;
