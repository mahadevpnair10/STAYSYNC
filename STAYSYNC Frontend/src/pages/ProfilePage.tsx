import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/../supabaseClient";
import { Camera, User, Phone, Mail, Shield, Check, X, Upload, Loader2 } from "lucide-react";

const Profile = () => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  // User data state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  // Track original phone to detect changes
  const [originalPhone, setOriginalPhone] = useState("");
  
  // UI states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user from auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error("Not authenticated");
      }

      setUser(authUser);

      // Get profile from database
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        toast({
          title: "Error loading profile",
          description: "Could not load profile data. Please try refreshing the page.",
          variant: "destructive",
        });
        return;
      }

      // Set profile data
      setProfile(profileData);
      setName(profileData.name || "");
      setEmail(profileData.email || authUser.email || "");
      setPhone(profileData.phone || "");
      setOriginalPhone(profileData.phone || "");
      setRole(profileData.role || "user");
      setProfileImageUrl(profileData.profile_image_url || "");
      setPhoneVerified(profileData.phone_verified || false);

    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Authentication Error",
        description: "Please log in again to access your profile.",
        variant: "destructive",
      });
      // Redirect to login if not authenticated
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `1skn4k9_0/${fileName}`;

      // Delete old image if exists
      if (profileImageUrl) {
        const oldPath = profileImageUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profile-pictures')
            .remove([`1skn4k9_0/${oldPath}`]);
        }
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error("Database update error:", updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      setProfileImageUrl(publicUrl);
      
      toast({
        title: "Success!",
        description: "Profile picture updated successfully",
      });

    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user || !profile) return;

    setIsUpdating(true);

    try {
      const phoneChanged = phone.trim() !== originalPhone;
      
      // Prepare update data
      const updateData = {
        name: name.trim(),
        phone: phone.trim() || null,
        updated_at: new Date().toISOString()
      };

      // If phone changed, mark as not verified
      if (phoneChanged) {
        updateData.phone_verified = false;
        setPhoneVerified(false);
        setPhoneVerificationSent(false);
        setVerificationCode("");
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error("Profile update error:", error);
        throw new Error(`Update failed: ${error.message}`);
      }

      // Update local state
      setOriginalPhone(phone.trim() || "");
      
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('staysync_user') || '{}');
      const updatedUser = {
        ...storedUser,
        name: name.trim(),
        phone: phone.trim() || null,
      };
      localStorage.setItem('staysync_user', JSON.stringify(updatedUser));

      let message = "Your profile has been updated successfully";
      if (phoneChanged) {
        message += ". Phone number needs to be verified again.";
      }

      toast({
        title: "Profile updated!",
        description: message,
      });

    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const sendPhoneVerification = async () => {
    if (!phone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number first",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });

      if (error) {
        console.error("Phone verification error:", error);
        throw new Error(error.message);
      }

      setPhoneVerificationSent(true);
      toast({
        title: "Verification code sent!",
        description: "Check your phone for the verification code",
      });

    } catch (error) {
      console.error("Phone verification error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const verifyPhoneCode = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Code required",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingPhone(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: verificationCode.trim(),
        type: 'sms'
      });

      if (error) {
        console.error("Phone verification error:", error);
        throw new Error(error.message);
      }

      // Update profile to mark phone as verified
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          phone_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw new Error(updateError.message);
      }

      setPhoneVerified(true);
      setPhoneVerificationSent(false);
      setVerificationCode("");

      toast({
        title: "Phone verified!",
        description: "Your phone number has been verified successfully",
      });

    } catch (error) {
      console.error("Phone verification error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load profile data</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <SEO
        title="Profile | STAYSYNC"
        description="Manage your STAYSYNC profile and settings."
        canonical="/profile"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <User className="h-16 w-16 text-gray-400" />
                  )}
                  {!profileImageUrl && (
                    <User className="h-16 w-16 text-gray-400" style={{ display: 'flex' }} />
                  )}
                </div>
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>

              <div className="space-y-2 w-full">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploadingImage ? "Uploading..." : "Change Picture"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground text-center">
                  JPG, PNG up to 5MB
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      disabled={isUpdating}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={email}
                        disabled
                        className="pl-10 bg-muted"
                        placeholder="Email address"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        disabled={isUpdating}
                        className="pl-10"
                      />
                    </div>
                    {phone && !phoneVerified && (
                      <Button
                        type="button"
                        onClick={sendPhoneVerification}
                        variant="outline"
                        disabled={phoneVerificationSent}
                      >
                        {phoneVerificationSent ? "Code Sent" : "Verify"}
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {phoneVerified && phone ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : phone ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <X className="h-3 w-3 mr-1" />
                        Not Verified
                      </Badge>
                    ) : null}
                  </div>

                  {phoneVerificationSent && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
                      <p className="text-sm text-blue-800">
                        Enter the verification code sent to {phone}
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="flex-1"
                          maxLength={6}
                        />
                        <Button
                          type="button"
                          onClick={verifyPhoneCode}
                          disabled={isVerifyingPhone || !verificationCode}
                        >
                          {isVerifyingPhone ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Verify"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Badge variant={role === "admin" ? "default" : "secondary"}>
                      {role === "admin" ? "Administrator" : "Customer"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your account type.
                  </p>
                </div>

                <Button type="submit" disabled={isUpdating} className="w-full">
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account details and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Account ID</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {user.id.substring(0, 8)}...
                </p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm font-medium">Member Since</Label>
                <p className="text-sm text-muted-foreground">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "N/A"}
                </p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm font-medium">Email Status</Label>
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Profile;