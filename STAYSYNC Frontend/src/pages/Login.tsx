import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/../supabaseClient";

const Login = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Step 1: Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;
      if (!user) {
        throw new Error("User not found after login.");
      }

      // Check if email is confirmed
      if (!user.email_confirmed_at) {
        throw new Error("Please confirm your email address before logging in. Check your inbox for the confirmation link.");
      }

      // Step 2: Fetch profile (should exist due to trigger)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      let userRole = "user";
      
      if (profileError) {
        // If profile doesn't exist yet, fallback to user metadata
        console.warn("Profile not found, using fallback:", profileError);
        userRole = user.user_metadata?.role || "user";
        
        // Optionally, you could create the profile here as a fallback
        // But the trigger should handle this automatically
      } else {
        userRole = profile.role || "user";
      }

      // Step 3: Store user data in localStorage
      const userData = {
        id: user.id,
        email: user.email,
        role: userRole,
        name: profile?.name || user.user_metadata?.name || "",
        phone: profile?.phone || user.user_metadata?.phone || null,
        profile_image_url: profile?.profile_image_url || null,
      };

      localStorage.setItem("staysync_user", JSON.stringify(userData));

      // Step 4: Success message and redirect
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name || userData.email}!`,
      });

      // Redirect based on role
      const redirectPath = userRole === "admin" ? "/admin" : "/dashboard";
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 1000);

    } catch (err: any) {
      console.error("Login error:", err);
      toast({
        title: "Login failed",
        description: err.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto max-w-md py-10">
      <SEO 
        title="Login | STAYSYNC" 
        description="Access your STAYSYNC account." 
        canonical="/login" 
      />
      <h1 className="sr-only">Login to STAYSYNC</h1>

      <Card className="animate-enter">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to continue to STAYSYNC</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link 
              to="/forgot-password" 
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Forgot your password?
            </Link>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            New to STAYSYNC?{" "}
            <Link to="/register" className="story-link">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
};

export default Login;