
import { Camera } from "lucide-react";
import FollowButton from "../FollowButton";


const ProfileHeader = ({
  userData,
  isOwnProfile,
  bannerPreview,
  avatarPreview,
  openEditDialog,
 
}) => {
   

  return (
    <>
      {/* Banner Image */}
      <div className="relative h-52 sm:h-64 rounded-xl overflow-hidden shadow-lg">
        <img
          src={
            bannerPreview ||
            userData.bannerImage ||
            "https://via.placeholder.com/1200x300"
          }
          alt="Banner"
          className="w-full h-full object-cover"
        />
        {isOwnProfile && (
          <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-60 p-2 rounded-full">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <img
            src={
              avatarPreview ||
              userData.avatar ||
              "https://via.placeholder.com/150"
            }
            alt="Avatar"
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md"
          />
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {userData.name}
                  </h1>
                  {userData.isVerified && (
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 0a10 10 0 100 20 10 10 0 000-20zm3.93 6.93l-4.5 4.5a1 1 0 01-1.41 0l-2-2a1 1 0 011.41-1.41L9 9.59l3.93-3.93a1 1 0 011.41 1.41z" />
                    </svg>
                  )}
                </div>
                <p className="text-gray-600 text-lg">@{userData.username}</p>
              </div>
              <div className="flex gap-4">
                {isOwnProfile ? (
                  <button
                    onClick={openEditDialog}
                    className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-medium"
                  >
                    Edit Profile
                  </button>
                ) : (
                 <FollowButton userId={userData._id}  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileHeader;