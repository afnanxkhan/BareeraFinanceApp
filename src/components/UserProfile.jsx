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

  const handleSave = () => {
    alert("Profile update logic to be implemented with Appwrite Database updateDocument.");
    setIsEditing(false);
  };

  const handlePasswordUpdate = () => {
    alert("Password update logic to be implemented with Appwrite Account updatePassword.");
    setIsChangingPassword(false);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              User Profile
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-2 italic">
              Manage your identity and security preferences
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:-translate-y-1 transition-all active:translate-y-0"
              >
                EDIT PROFILE
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT CARDS: PERSONAL INFO & ADDRESS */}
          <div className="lg:col-span-2 space-y-8">
            <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-all duration-700"></div>

              <h2 className="text-xl font-bold flex items-center gap-2 mb-10 relative z-10">
                <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest px-1">Full Name</label>
                  {isEditing ? (
                    <input
                      className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    />
                  ) : (
                    <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/5 text-white/80 font-bold text-lg">
                      {userInfo.name || "N/A"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest px-1">Email Address</label>
                  <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/5 text-white/40 font-medium">
                    {userInfo.email}
                  </div>
                  <p className="text-[10px] text-white/20 px-1 italic">Email cannot be changed directly.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest px-1">CNIC / Identity No.</label>
                  {isEditing ? (
                    <input
                      className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium"
                      value={userInfo.cnic}
                      onChange={(e) => setUserInfo({ ...userInfo, cnic: e.target.value })}
                    />
                  ) : (
                    <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/5 text-white/80 font-bold">
                      {userInfo.cnic || "Not Provided"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest px-1">Phone Number</label>
                  {isEditing ? (
                    <input
                      className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium"
                      value={userInfo.phone}
                      onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    />
                  ) : (
                    <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/5 text-white/80 font-bold">
                      {userInfo.phone || "Not Provided"}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 space-y-2 relative z-10">
                <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest px-1">Physical Address</label>
                {isEditing ? (
                  <textarea
                    rows="3"
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium resize-none"
                    value={userInfo.address}
                    onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                  />
                ) : (
                  <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/5 text-white/60 italic leading-relaxed">
                    {userInfo.address || "No address on file."}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="mt-12 flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/10 relative z-10">
                  <button
                    className="flex-1 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-lg shadow-emerald-500/20 hover:-translate-y-1 transition-all"
                    onClick={handleSave}
                  >
                    SAVE CHANGES
                  </button>
                </div>
              )}
            </div>

            {/* ADDITIONAL NOTES */}
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/20 mb-6">Staff Internal Notes</h2>
              <textarea
                rows="3"
                className="w-full px-6 py-5 rounded-2xl bg-white/5 border border-white/5 text-white/40 italic text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/10"
                placeholder="Personal thoughts, reminders, or admin notations..."
              />
            </div>
          </div>

          {/* RIGHT COL: SECURITY & PROFILE IMAGE */}
          <div className="space-y-8">

            {/* PROFILE HEAD */}
            <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-pink-600 to-rose-700 text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl font-black text-white border-4 border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  {userInfo.name?.charAt(0) || "U"}
                </div>
                <h3 className="text-xl font-black text-white">{userInfo.name}</h3>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">System Administrator</p>
                <div className="mt-6 flex justify-center gap-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-tighter">Verified</span>
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-tighter">Active</span>
                </div>
              </div>
            </div>

            {/* SECURITY/PASSWORD */}
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-8">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                Security
              </h2>

              {!isChangingPassword ? (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-xs text-white/40 mb-1">Last Login</p>
                    <p className="font-bold text-white/80">Today, 09:12 AM</p>
                  </div>
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full py-4 rounded-2xl bg-white/10 text-white font-bold hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 hover:border-amber-500/40 transition-all"
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {["currentPassword", "newPassword", "confirmPassword"].map((field) => (
                    <div key={field}>
                      <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-2 px-1">
                        {field.replace(/([A-Z])/g, " $1")}
                      </label>
                      <input
                        type="password"
                        className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-amber-500 transition-all font-medium"
                        value={passwordInfo[field]}
                        onChange={(e) => setPasswordInfo({ ...passwordInfo, [field]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-3 mt-6">
                    <button className="w-full py-4 rounded-xl bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20" onClick={handlePasswordUpdate}>
                      UPDATE SECURELY
                    </button>
                    <button className="w-full py-4 rounded-xl bg-white/5 text-white/40 text-sm font-bold" onClick={() => setIsChangingPassword(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
