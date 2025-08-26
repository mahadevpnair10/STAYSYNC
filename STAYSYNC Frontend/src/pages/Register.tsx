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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords do not match" });
      return;
    }

    try {
      // 1. Create auth account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }, // stored in user_metadata
        },
      });

      if (error) throw error;

      // 2. (Optional) Insert into "profiles" table if you have one
      // await supabase.from("profiles").insert({ id: data.user?.id, full_name: name });

      toast({
        title: "Registration successful",
        description: "Check your email for confirmation.",
      });

      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err.message || "Unknown error",
      });
    }
  };

  return (
    <main className="container mx-auto max-w-md py-10">
      <SEO title="Register | STAYSYNC" description="Create your STAYSYNC account." canonical="/register" />
      <h1 className="sr-only">Register on STAYSYNC</h1>

      <Card className="animate-enter">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Sign up to start managing stays</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full">Create account</Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="story-link">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
};

export default Register;
