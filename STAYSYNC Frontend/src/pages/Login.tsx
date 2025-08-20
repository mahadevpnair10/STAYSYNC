import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useState } from "react";

const Login = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Login successful', description: `Welcome, ${data.user.name}` });
        localStorage.setItem('staysync_user', JSON.stringify(data.user));
  window.location.href = '/';
      } else {
        toast({ title: 'Login failed', description: data.error || 'Unknown error' });
      }
    } catch (err) {
      toast({ title: 'Login failed', description: 'Network error' });
    }
  };

  return (
    <main className="container mx-auto max-w-md py-10">
      <SEO title="Login | STAYSYNC" description="Access your STAYSYNC account." canonical="/login" />
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
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full">Sign in</Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            New to STAYSYNC? <Link to="/register" className="story-link">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
};

export default Login;
