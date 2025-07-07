import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axiosInstance from "../lib/axiosIntance";
import { useToast } from "../components/UI/ToastManager";
import { useState, useRef } from "react";
import { Loader2, Save, Camera, Pen } from "lucide-react";
import Dialog from "../components/UI/Dialog";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileDetails from "../components/profile/ProfileDetails";

export default function ProfilePage() {
  const { username } = useParams();
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => await axiosInstance.get(`/users/${username}`),
  });

  const {
    mutate: updateProfileMutation,
    isPending: isUpdateProfileLoading,
  } = useMutation({
    mutationFn: async (updatedData) => await axiosInstance.put("/users/profile", updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      addToast("Profile Updated", {
        type: "success",
        duration: 3000,
      });
      setIsEditing(false);
      setAvatarPreview(null);
      setBannerPreview(null);
    },
    onError: (error) => {
      console.log(error.message);
      addToast("Failed to update Profile", {
        type: "error",
        duration: 3000,
      });
    },
  });

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    updateProfileMutation(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      // const validTypes = ["image/jpeg", "image/png", "image/gif"];
      const maxSize = 5 * 1024 * 1024; // 5MB
      // if (!validTypes.includes(file.type)) {
      //   addToast("Only JPEG, PNG, or GIF images are allowed", {
      //     type: "error",
      //     duration: 3000,
      //   });
      //   return;
      // }
      if (file.size > maxSize) {
        addToast("File size must be less than 5MB", {
          type: "error",
          duration: 3000,
        });
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      if (name === "avatar") {
        setAvatarPreview(previewUrl);
      } else if (name === "bannerImage") {
        setBannerPreview(previewUrl);
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [name]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditDialog = () => {
    setIsEditing(true);
    setFormData({
      name: userData.name,
      bio: userData.bio,
      location: userData.location,
      website: userData.website,
      avatar: userData.avatar,
      bannerImage: userData.bannerImage,
    });
    setAvatarPreview(userData.avatar || null);
    setBannerPreview(userData.bannerImage || null);
  };

  if (isProfileLoading || isUpdateProfileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  const isOwnProfile = authUser?.username === userProfile?.data.username;
  const userData = isOwnProfile ? authUser : userProfile?.data;

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-xl text-gray-600">User not found</p>
      </div>
    );
  }

  const isFollower = authUser && userData.followers?.some((follower) => follower === authUser._id);
console.log(isFollower);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <ProfileHeader
        userData={userData}
        isOwnProfile={isOwnProfile}
        bannerPreview={bannerPreview}
        avatarPreview={avatarPreview}
        openEditDialog={openEditDialog}
      />
      <div className="">
        <ProfileDetails userData={userData} />
      </div>

      {/* Edit Form in Dialog */}
      <Dialog
        isOpen={isEditing && isOwnProfile}
        onClose={() => {
          setIsEditing(false);
          setAvatarPreview(null);
          setBannerPreview(null);
        }}
        headline="Edit Profile"
        description="Update your profile information below."
        actionText="Save Changes"
        actionIcon={<Save className="w-5 h-5" />}
        onAction={handleUpdateProfile}
        isLoading={isUpdateProfileLoading}
      >
        <div className="space-y-4 mt-4">
          {/* Banner Image Section */}
          <div className="relative">
            <div
              className="h-32 w-full bg-cover bg-center rounded-lg"
              style={{
                backgroundImage: `url(${
                  bannerPreview || userData.bannerImage || "/banner-placeholder.png"
                })`,
              }}
            >
              <label
                htmlFor="bannerImageInput"
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-60 p-2 rounded-full cursor-pointer hover:bg-opacity-80 transition"
              >
                <Camera className="w-5 h-5 text-white" />
                <input
                  id="bannerImageInput"
                  type="file"
                  name="bannerImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={bannerInputRef}
                />
              </label>
            </div>
          </div>
          {/* Avatar Image Section */}
          <div className="relative -mt-16 ml-4">
            <img
              src={avatarPreview || userData.avatar || "/avatar-placeholder.png"}
              alt="Avatar Preview"
              className="w-24 h-24 rounded-full object-cover border-4 border-white"
            />
            <label
              htmlFor="avatarInput"
              className="absolute bottom-0 right-0 bg-gray-800 bg-opacity-60 p-1.5 rounded-full cursor-pointer hover:bg-opacity-80 transition"
            >
              <Pen className="w-4 h-4 text-white" />
              <input
                id="avatarInput"
                type="file"
                name="avatar"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                ref={avatarInputRef}
              />
            </label>
          </div>
          {/* Form Inputs */}
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={50}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={160}
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={50}
                  placeholder="Your location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
}