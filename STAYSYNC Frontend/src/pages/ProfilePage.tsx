import { useEffect, useState } from "react";
import { supabase } from "@/../supabaseClient";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Profile = {
  id: string;
  email: string;
  role: string;
  phone?: string;
  profile_image_url?: string;
};

const ProfilePage = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch Profile
  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, role, phone, profile_image_url")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(error);
        } else {
          setProfile(data);
          setPhone(data?.phone || "");
        }
      }
      setLoading(false);
    };

    getProfile();
  }, []);

  // Send OTP for phone verification
  const sendOtp = async () => {
    if (!phone) {
      toast({ title: "Phone required", description: "Please enter a phone number." });
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "OTP Sent", description: "Check your SMS for the code." });
      setOtpSent(true);
    }
  };

  // Verify OTP and update phone in profile
  const verifyOtp = async () => {
    if (!otp || !phone) return;

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
      return;
    }

    // Update profile table
    if (profile) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone })
        .eq("id", profile.id);

      if (updateError) {
        toast({ title: "Update failed", description: updateError.message, variant: "destructive" });
      } else {
        toast({ title: "Phone Verified", description: "Phone number updated successfully." });
        setOtpSent(false);
        setOtp("");
      }
    }
  };

  // Upload profile picture
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile?.id}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to bucket
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      // Save URL to profile
      if (profile) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ profile_image_url: data.publicUrl })
          .eq("id", profile.id);

        if (updateError) throw updateError;

        setProfile({ ...profile, profile_image_url: data.publicUrl });
        toast({ title: "Profile picture updated" });
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

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
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded-lg space-y-4">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      
      {/* Profile picture */}
      {profile.profile_image_url ? (
        <img
          src={profile.profile_image_url}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
        />
      ) : (
        <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4" />
      )}
      <Input type="file" onChange={handleFileUpload} disabled={uploading} />

      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Role:</strong> {profile.role}</p>

      {/* Phone verification */}
      <div className="space-y-2">
        <Input
          type="tel"
          placeholder="Enter phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {!otpSent ? (
          <Button onClick={sendOtp} className="w-full">Send OTP</Button>
        ) : (
          <>
            <Input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <Button onClick={verifyOtp} className="w-full">Verify OTP</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
