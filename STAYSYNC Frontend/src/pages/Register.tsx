import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/../supabaseClient";

const Register = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirm) {
      toast({ 
        title: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({ 
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create auth account - trigger will handle profile creation on email confirmation
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name, 
            role,
            phone: phone || null // Include phone if provided
          },
        },
      });

      if (error) throw error;

      // Success message
      toast({
        title: "Registration successful!",
        description: "Please check your email and click the confirmation link to activate your account.",
      });

      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setPhone("");
      setRole("user");

      // Redirect after delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);

    } catch (err: any) {
      console.error("Registration error:", err);
      toast({
        title: "Registration failed",
        description: err.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto max-w-md py-10">
      <SEO
        title="Register | STAYSYNC"
        description="Create your STAYSYNC account."
        canonical="/register"
      />
      <h1 className="sr-only">Register on STAYSYNC</h1>

      <Card className="animate-enter">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Sign up to start managing stays</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name *</Label>
              <Input
                id="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
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
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                autoComplete="tel"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password *</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={role === "user"}
                    onChange={() => setRole("user")}
                    disabled={isLoading}
                    className="cursor-pointer"
                  />
                  <span>Customer (User)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={role === "admin"}
                    onChange={() => setRole("admin")}
                    disabled={isLoading}
                    className="cursor-pointer"
                  />
                  <span>Admin</span>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="story-link">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
};

export default Register;