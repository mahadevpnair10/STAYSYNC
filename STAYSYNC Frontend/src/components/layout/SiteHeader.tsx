import { Link, NavLink, useNavigate } from "react-router-dom";
import { BedDouble, ConciergeBell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const SiteHeader = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('staysync_user');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      setUser(null);
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem('staysync_user');
    setUser(null);
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <nav className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <BedDouble className="h-5 w-5 text-accent" aria-hidden="true" />
          <span>STAYSYNC</span>
        </Link>
        <div className="flex items-center gap-2">
          <NavLink to="/user">
            {({ isActive }) => (
              <Button variant={isActive ? "default" : "outline"} size="sm">
                <ConciergeBell className="mr-2 h-4 w-4" /> User Portal
              </Button>
            )}
          </NavLink>
          <NavLink to="/admin">
            {({ isActive }) => (
              <Button variant={isActive ? "default" : "outline"} size="sm">
                Admin Portal
              </Button>
            )}
          </NavLink>
          {!user && (
            <>
              <NavLink to="/login">
                {({ isActive }) => (
                  <Button variant={isActive ? "default" : "ghost"} size="sm">
                    Login
                  </Button>
                )}
              </NavLink>
              <NavLink to="/register">
                {({ isActive }) => (
                  <Button variant={isActive ? "default" : "secondary"} size="sm">
                    Register
                  </Button>
                )}
              </NavLink>
            </>
          )}
          {user && (
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default SiteHeader;
