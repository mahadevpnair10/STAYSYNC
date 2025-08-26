// ProfilePage.tsx (debug-enhanced + fixed)
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

  // Fetch Profile (debugging)
  useEffect(() => {
    let mounted = true;

    const getProfile = async () => {
      console.group("Profile Debug: getProfile start");
      setLoading(true);

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error("Profile Debug: auth.getUser error:", authError);
        }

        const user = authData?.user;
        console.log("Profile Debug: auth user:", user ?? null);

        if (!user) {
          console.warn("Profile Debug: No authenticated user found.");
          if (mounted) setProfile(null);
          return;
        }

        // Fetch profile row
        const { data, error: selectError } = await supabase
          .from("profiles")
          .select("id, email, role, phone, profile_image_url")
          .eq("id", user.id)
          .single();

        if (selectError) {
          console.error("Profile Debug: profiles.select error:", selectError);
          if (mounted) setProfile(null);
        } else {
          console.log("Profile Debug: fetched profile:", data);
          if (mounted) {
            setProfile(data);
            setPhone(data?.phone || "");
          }
        }
      } catch (err) {
        console.error("Profile Debug: unexpected error in getProfile:", err);
      } finally {
        if (mounted) setLoading(false);
        console.groupEnd();
      }
    };

    getProfile();
    return () => {
      mounted = false;
    };
  }, []);

  // Send OTP
  const sendOtp = async () => {
    console.group("Profile Debug: sendOtp");
    try {
      if (!phone) {
        toast({ title: "Phone required", description: "Please enter a phone number." });
        console.warn("Profile Debug: sendOtp called without phone");
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({ phone });
      console.log("Profile Debug: signInWithOtp result error:", error);
      if (error) {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "OTP Sent", description: "Check your SMS for the code." });
        setOtpSent(true);
      }
    } catch (err) {
      console.error("Profile Debug: sendOtp unexpected error:", err);
      toast({ title: "Failed", description: "Unexpected error (see console)", variant: "destructive" });
    } finally {
      console.groupEnd();
    }
  };

  // Verify OTP and update phone in profile
  const verifyOtp = async () => {
    console.group("Profile Debug: verifyOtp");
    try {
      if (!otp || !phone) {
        console.warn("Profile Debug: verifyOtp missing otp or phone");
        return;
      }

      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "sms",
      });

      console.log("Profile Debug: verifyOtp response:", { verifyData, verifyError });
      if (verifyError) {
        toast({ title: "Verification failed", description: verifyError.message, variant: "destructive" });
        return;
      }

      if (profile) {
        const { data: updateData, error: updateError } = await supabase
          .from("profiles")
          .update({ phone })
          .eq("id", profile.id);

        console.log("Profile Debug: profiles.update result:", { updateData, updateError });

        if (updateError) {
          toast({ title: "Update failed", description: updateError.message, variant: "destructive" });
        } else {
          toast({ title: "Phone Verified", description: "Phone number updated successfully." });
          setOtpSent(false);
          setOtp("");
        }
      } else {
        console.warn("Profile Debug: No profile available to update phone");
      }
    } catch (err) {
      console.error("Profile Debug: verifyOtp unexpected error:", err);
      toast({ title: "Failed", description: "Unexpected error (see console)", variant: "destructive" });
    } finally {
      console.groupEnd();
    }
  };

  // Upload profile picture
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.group("Profile Debug: handleFileUpload start");
    try {
      if (!e.target.files || e.target.files.length === 0) {
        console.log("Profile Debug: No file selected");
        return;
      }

      const file = e.target.files[0];
      if (!file) return;

      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile?.id ?? "unknown_user"}.${fileExt}`;
      const filePath = fileName;

      console.log("Profile Debug: selected file:", {
        name: file.name,
        size: file.size,
        type: file.type,
        fileName,
        filePath,
      });

      // Upload to bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, { upsert: true });

      console.log("Profile Debug: storage.upload response:", { uploadData, uploadError });

      if (uploadError) {
        console.error("Profile Debug: uploadError object:", uploadError);
        throw uploadError;
      }

      // Get public URL (fixed destructuring)
      const { data: publicUrlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;
      console.log("Profile Debug: resolved publicUrl:", publicUrl);

      if (!publicUrl) {
        throw new Error("Could not resolve public URL");
      }

      // Save URL to profile
      if (profile) {
        const { data: updateData, error: updateError } = await supabase
          .from("profiles")
          .update({ profile_image_url: publicUrl })
          .eq("id", profile.id);

        console.log("Profile Debug: profiles.update response:", { updateData, updateError });

        if (updateError) {
          console.error("Profile Debug: updateError object:", updateError);
          throw updateError;
        }

        setProfile({ ...profile, profile_image_url: publicUrl });
        toast({ title: "Profile picture updated" });
      } else {
        console.warn("Profile Debug: profile is null, skipping profiles.update");
        toast({ title: "Upload succeeded but profile missing", description: "Check logs", variant: "destructive" });
      }
    } catch (err: any) {
      console.error("Profile Debug: File upload error details:", err);
      toast({ title: "Upload failed", description: err?.message ?? String(err), variant: "destructive" });
    } finally {
      setUploading(false);
      console.groupEnd();
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
