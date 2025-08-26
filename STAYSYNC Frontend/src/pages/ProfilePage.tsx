import { useEffect, useState } from "react";
import { supabase } from "@/../supabaseClient"; // adjust path
import { Loader2 } from "lucide-react";

type Profile = {
  id: string;
  email: string;
  role: string;
  logs?: string; 
};

const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("profile")
          .select("id, email, role, logs")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setProfile(data);
        }
      }
      setLoading(false);
    };

    getProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6 text-center">No profile found.</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Role:</strong> {profile.role}</p>
      <p><strong>Logs:</strong> {profile.logs || "No logs yet"}</p>
    </div>
  );
};

export default ProfilePage;
