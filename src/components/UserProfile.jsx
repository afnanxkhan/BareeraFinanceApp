import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";

const UserProfile = () => {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Initialize with profile data or defaults
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    cnic: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    if (profile && user) {
      setUserInfo({
        name: profile.fullName || user.name || "",
        email: profile.email || user.email || "",
        cnic: profile.cnic || "",
        phone: profile.phoneNo || "",
        address: profile.address || ""
      });
    }
  }, [profile, user]);

  const [passwordInfo, setPasswordInfo] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  /* INPUT */
  const inputClass =
    "w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white " +
    "focus:outline-none focus:ring-2 focus:ring-pink-500";

  /* BUTTONS */
  const primaryBtn =
    "h-11 px-6 rounded-xl font-medium text-white transition-all " +
    "bg-gradient-to-r from-pink-500 to-pink-400 " +
    "hover:shadow-[0_8px_25px_rgba(255,45,112,0.45)]";

  const secondaryBtn =
    "h-11 px-6 rounded-xl font-medium text-white transition-all " +
    "bg-white/10 hover:bg-pink-500/20";

  const handleSave = () => {
    alert("Profile update logic to be implemented with Appwrite Database updateDocument.");
    setIsEditing(false);
  };

  const handlePasswordUpdate = () => {
    alert("Password update logic to be implemented with Appwrite Account updatePassword.");
    setIsChangingPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6
      bg-gradient-to-br from-[#141822] to-[#1f1b2e]">

      <div className="w-full max-w-3xl p-8 rounded-2xl
        bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white">User Profile</h1>
            <p className="text-sm text-white/60">
              Manage your personal information
            </p>
          </div>

          {!isEditing && (
            <button className={primaryBtn} onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div key="name">
            <label className="block text-sm text-white/70 mb-1 capitalize">Name</label>
            {isEditing ? (
              <input className={inputClass} value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} />
            ) : (
              <div className="px-4 py-3 rounded-lg bg-white/10 text-white">{userInfo.name}</div>
            )}
          </div>
          <div key="email">
            <label className="block text-sm text-white/70 mb-1 capitalize">Email</label>
            {/* Email usually read-only or requires auth verification to change */}
            <div className="px-4 py-3 rounded-lg bg-white/10 text-white opacity-70">{userInfo.email}</div>
          </div>
          <div key="cnic">
            <label className="block text-sm text-white/70 mb-1 capitalize">CNIC</label>
            {isEditing ? (
              <input className={inputClass} value={userInfo.cnic} onChange={(e) => setUserInfo({ ...userInfo, cnic: e.target.value })} />
            ) : (
              <div className="px-4 py-3 rounded-lg bg-white/10 text-white">{userInfo.cnic || "N/A"}</div>
            )}
          </div>
          <div key="phone">
            <label className="block text-sm text-white/70 mb-1 capitalize">Phone</label>
            {isEditing ? (
              <input className={inputClass} value={userInfo.phone} onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })} />
            ) : (
              <div className="px-4 py-3 rounded-lg bg-white/10 text-white">{userInfo.phone || "N/A"}</div>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="mt-6">
          <label className="block text-sm text-white/70 mb-1">
            Address
          </label>
          {isEditing ? (
            <textarea
              rows="3"
              className={inputClass}
              value={userInfo.address}
              onChange={(e) =>
                setUserInfo({ ...userInfo, address: e.target.value })
              }
            />
          ) : (
            <div className="px-4 py-3 rounded-lg bg-white/10 text-white">
              {userInfo.address || "N/A"}
            </div>
          )}
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="flex gap-4 mt-6">
            <button className={secondaryBtn} onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button className={primaryBtn} onClick={handleSave}>
              Save Changes
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="my-8 border-t border-white/10" />

        {/* Change Password */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">
              Change Password
            </h2>
            {!isChangingPassword && (
              <button
                className={secondaryBtn}
                onClick={() => setIsChangingPassword(true)}
              >
                Change
              </button>
            )}
          </div>

          {isChangingPassword && (
            <div className="space-y-4">
              {["currentPassword", "newPassword", "confirmPassword"].map(
                (field) => (
                  <input
                    key={field}
                    type="password"
                    placeholder={field.replace(/([A-Z])/g, " $1")}
                    className={inputClass}
                    value={passwordInfo[field]}
                    onChange={(e) =>
                      setPasswordInfo({
                        ...passwordInfo,
                        [field]: e.target.value
                      })
                    }
                  />
                )
              )}

              <div className="flex gap-4">
                <button
                  className={secondaryBtn}
                  onClick={() => setIsChangingPassword(false)}
                >
                  Cancel
                </button>
                <button className={primaryBtn} onClick={handlePasswordUpdate}>
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Internal Note */}
        <div className="mt-8">
          <label className="block text-sm text-white/70 mb-1">
            Internal Note
          </label>
          <textarea
            rows="3"
            className={inputClass}
            placeholder="Internal admin note..."
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
