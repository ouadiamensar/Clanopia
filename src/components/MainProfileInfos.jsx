/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { doc, setDoc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import LoadingSpinner from "./LoadingSpinner";
import {
  HiUser,
  HiPhone,
  HiLocationMarker,
  HiGlobe,
  HiLink,
  HiBookOpen,
  HiBriefcase,
  HiAcademicCap,
  HiStar,
  HiPlus,
  HiX,
  HiCamera,
  HiPhotograph,
  HiSave,
  HiCode,
  HiChat,
  HiPencil,
  HiCheck,
  HiUserGroup,
  HiMail,
  HiInformationCircle,
  HiCheckCircle,
  HiExclamationCircle,
} from "react-icons/hi";
import {
  FaGithub,
  FaLinkedin,
  FaLanguage,
  FaTwitter,
  FaYoutube,
  FaInstagram,
} from "react-icons/fa";

const MainProfileInfos = () => {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1e1e1f]">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Please Login
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You need to be logged in to view this page.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const [profile, setProfile] = useState({
    image: null,
    banner: null,
    name: currentUser.displayName || "",
    about: "",
    phone: "",
    location: "",
    portfolio: "",
    github: "",
    linkedin: "",
    twitter: "",
    youtube: "",
    instagram: "",
    skills: [],
    newSkill: "",
    education: "",
    experience: "",
    languages: "",
    interests: "",
    followers: [],
    Who_I_follow: [],
    following: [],
  });

  const [profileBefore, setProfileBefore] = useState({});
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem("themeMode");
    return savedTheme || "light";
  });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      const savedTheme = localStorage.getItem("themeMode");
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
      return;
    }

    const settingsRef = doc(db, "users", currentUser.uid, "settings", "data");
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.theme && data.theme.mode) {
          localStorage.setItem("themeMode", data.theme.mode);
          setThemeMode(data.theme.mode);
        }
      }
    });

    return () => unsubscribe();
  }, []);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("basic");
  const [previewImage, setPreviewImage] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [showInfoPopup, setShowInfoPopup] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const { language, translations, loading: languageLoading } = useLanguage();

  const t = (key, params = {}) => {
    if (languageLoading) return key;
    let translation =
      key.split(".").reduce((obj, k) => obj?.[k], translations) || key;
    Object.keys(params).forEach((param) => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
    return translation;
  };

  const getBgColor = () =>
    themeMode === "light" ? "bg-gray-50" : "bg-[#1e1e1f]";
  const getCardBg = () =>
    themeMode === "light" ? "bg-white" : "bg-[#222223]";
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-50" : "bg-[#252527]";
  const getInputBorder = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getLabelColor = () =>
    themeMode === "light" ? "text-gray-700" : "text-gray-300";
  const getGradientBg = () =>
    themeMode === "light"
      ? "bg-gradient-to-r from-indigo-500 to-blue-500"
      : "bg-gradient-to-r from-indigo-600 to-blue-600";

  const isProfileComplete = () => {
    const hasName = profile.name && profile.name.trim() !== "";
    const hasImage =
      profile.image instanceof File ||
      profileBefore?.ProfileImageURL ||
      previewImage;
    const hasBanner =
      profile.banner instanceof File ||
      profileBefore?.BannerImageURL ||
      previewBanner;
    return hasName && hasImage && hasBanner;
  };

  const createOrGetProfile = async () => {
    if (!currentUser) return null;

    try {
      const profileRef = doc(db, "users", currentUser.uid, "profile", "data");
      const snapshot = await getDoc(profileRef);

      if (snapshot.exists()) {
        return snapshot.data();
      } else {
        const defaultProfile = {
          name: currentUser.displayName || "",
          email: currentUser.email || "",
          about: "",
          phone: "",
          location: "",
          portfolio: "",
          github: "",
          linkedin: "",
          twitter: "",
          youtube: "",
          instagram: "",
          skills: [],
          education: "",
          experience: "",
          languages: "",
          interests: "",
          followers: [],
          Who_I_follow: [],
          following: [],
          ProfileImageURL: "",
          BannerImageURL: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(profileRef, defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error("❌ Error creating profile:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await createOrGetProfile();

        if (profileData) {
          setProfile((prev) => ({
            ...prev,
            name: profileData.name || "",
            about: profileData.about || "",
            phone: profileData.phone || "",
            location: profileData.location || "",
            portfolio: profileData.portfolio || "",
            github: profileData.github || "",
            linkedin: profileData.linkedin || "",
            twitter: profileData.twitter || "",
            youtube: profileData.youtube || "",
            instagram: profileData.instagram || "",
            skills: profileData.skills || [],
            education: profileData.education || "",
            experience: profileData.experience || "",
            languages: profileData.languages || "",
            interests: profileData.interests || "",
            followers: profileData.followers || [],
            Who_I_follow: profileData.Who_I_follow || [],
            following: profileData.following || [],
          }));
          setProfileBefore(profileData);
        }
      } catch (error) {
        console.error("❌ Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (e.target.name === "image") {
      setProfile((prev) => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    } else if (e.target.name === "banner") {
      setProfile((prev) => ({ ...prev, banner: file }));
      setPreviewBanner(URL.createObjectURL(file));
    }
  };

  const addSkill = () => {
    if (profile.newSkill && !profile.skills.includes(profile.newSkill)) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill],
        newSkill: "",
      }));
    }
  };

  const removeSkill = (idx) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveProfile = async () => {
    if (!currentUser) {
      setSaveMessage({ type: "error", text: "Please login first" });
      return;
    }

    if (!isProfileComplete()) {
      setSaveMessage({
        type: "error",
        text: "⚠️ Please complete all required fields",
      });
      setTimeout(() => setSaveMessage({ type: "", text: "" }), 4000);
      return;
    }

    setIsSaving(true);
    setSaveMessage({ type: "", text: "" });

    const profileRef = doc(db, "users", currentUser.uid, "profile", "data");
    let profileData = { ...profile };

    delete profileData.image;
    delete profileData.banner;
    delete profileData.newSkill;
    delete profileData.followers;
    delete profileData.Who_I_follow;
    delete profileData.following;

    if (profile.image instanceof File) {
      try {
        const imageRef = ref(
          storage,
          `profileImages/${currentUser.uid}/${Date.now()}-profile.jpg`,
        );
        await uploadBytes(imageRef, profile.image);
        const downloadURL = await getDownloadURL(imageRef);
        profileData.ProfileImageURL = downloadURL;
      } catch (error) {
        setSaveMessage({ type: "error", text: "Failed to upload profile image" });
        setIsSaving(false);
        return;
      }
    } else if (profileBefore?.ProfileImageURL) {
      profileData.ProfileImageURL = profileBefore.ProfileImageURL;
    }

    if (profile.banner instanceof File) {
      try {
        const bannerRef = ref(
          storage,
          `bannerImages/${currentUser.uid}/${Date.now()}-banner.jpg`,
        );
        await uploadBytes(bannerRef, profile.banner);
        const downloadURL = await getDownloadURL(bannerRef);
        profileData.BannerImageURL = downloadURL;
      } catch (error) {
        setSaveMessage({ type: "error", text: "Failed to upload banner image" });
        setIsSaving(false);
        return;
      }
    } else if (profileBefore?.BannerImageURL) {
      profileData.BannerImageURL = profileBefore.BannerImageURL;
    }

    profileData.updatedAt = new Date();

    try {
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        await updateDoc(profileRef, profileData);
      } else {
        await setDoc(profileRef, profileData);
      }

      setSaveMessage({ type: "success", text: "✅ Profile saved successfully!" });
      setProfileBefore(profileData);

      setTimeout(() => {
        navigate("/home");
      }, 1500);

      setTimeout(() => setSaveMessage({ type: "", text: "" }), 4000);
    } catch (error) {
      setSaveMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || languageLoading) {
    return (
      <div className={`min-h-screen ${getBgColor()} flex items-center justify-center`}>
        <LoadingSpinner />
      </div>
    );
  }

  const tabs = [
    { id: "basic", label: "Basic Info", icon: <HiUser /> },
    { id: "skills", label: "Skills", icon: <HiStar /> },
    { id: "links", label: "Links", icon: <HiLink /> },
    { id: "additional", label: "More", icon: <HiChat /> },
  ];

  return (
    <div className={`min-h-screen ${getBgColor()} ${getTextColor()} transition-colors duration-300`}>
      <div className="flex">
        <div className="flex-1 p-4 md:p-6 pt-5">
          <div className="max-w-6xl mx-auto">
            {showInfoPopup && (
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowInfoPopup(false);
                }}>
                <div className={`${getCardBg()} rounded-2xl max-w-md w-full p-6 border ${getBorderColor()} shadow-2xl`}>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center mx-auto mb-3">
                      <HiInformationCircle className="text-3xl text-white" />
                    </div>
                    <h2 className={`text-xl font-bold ${getTextColor()}`}>
                      Complete Your Profile
                    </h2>
                    <p className={`${getSecondaryTextColor()} text-sm mt-1`}>
                      Please fill in the required fields below
                    </p>
                  </div>

                  <div className="space-y-2 mb-6">
                    {[
                      { label: "Full Name", completed: profile.name?.trim() !== "" },
                      { label: "Profile Image", completed: profile.image instanceof File || profileBefore?.ProfileImageURL || previewImage },
                      { label: "Banner Image", completed: profile.banner instanceof File || profileBefore?.BannerImageURL || previewBanner },
                    ].map((item, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${item.completed ? "bg-green-500/10" : "bg-red-500/10"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.completed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {item.completed ? <HiCheck className="text-sm" /> : <HiExclamationCircle className="text-sm" />}
                        </div>
                        <span className={`text-sm ${getTextColor()}`}>{item.label}</span>
                        <span className={`text-xs ml-auto ${item.completed ? "text-green-400" : "text-red-400"}`}>
                          {item.completed ? "✓ Done" : "Required"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (!isProfileComplete()) {
                        setSaveMessage({ type: "error", text: "⚠️ Please complete all required fields" });
                        setTimeout(() => setSaveMessage({ type: "", text: "" }), 4000);
                        return;
                      }
                      setShowInfoPopup(false);
                    }}
                    className={`w-full py-2.5 rounded-xl font-medium transition-all duration-300 ${isProfileComplete() ? `${getGradientBg()} text-white hover:scale-[1.02]` : "bg-gray-500 text-white cursor-not-allowed opacity-50"}`}>
                    {isProfileComplete() ? "Get Started" : "Complete All Fields"}
                  </button>
                </div>
              </div>
            )}

            <div className={`mb-6 ${isMobile && "mt-14"}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className={`text-2xl md:text-3xl font-bold ${getTextColor()}`}>
                    {profile.name ? "Edit Profile" : "Complete Your Profile"}
                  </h1>
                  <p className={`${getSecondaryTextColor()} text-sm`}>
                    {profile.name ? "Update your profile information" : "Fill in your details to get started"}
                  </p>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !isProfileComplete()}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 text-white ${isSaving || !isProfileComplete() ? "bg-gray-500 opacity-50 cursor-not-allowed" : `${getGradientBg()} hover:scale-[1.02]`}`}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <HiSave className="text-lg" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>

            {saveMessage.text && (
              <div
                className={`mb-4 p-3 rounded-xl text-sm ${
                  saveMessage.type === "success"
                    ? "bg-green-500/10 text-green-400 border border-green-500/30"
                    : "bg-red-500/10 text-red-400 border border-red-500/30"
                }`}>
                {saveMessage.text}
              </div>
            )}

            <div
              className={`${getCardBg()} rounded-2xl shadow-lg overflow-hidden mb-6 border ${getBorderColor()}`}>
              {/* Banner */}
              <div className="relative h-48 md:h-56 bg-gradient-to-r from-indigo-600 to-blue-600">
                {(profile.banner instanceof File || profileBefore?.BannerImageURL || previewBanner) ? (
                  <>
                    <img
                      src={previewBanner || (profile.banner instanceof File ? URL.createObjectURL(profile.banner) : profileBefore?.BannerImageURL)}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <HiPhotograph className="text-5xl text-white/20 mx-auto mb-2" />
                      <p className="text-white/40 text-sm">Upload Banner</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 right-3">
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer bg-black/50 backdrop-blur-sm text-white text-sm hover:bg-black/70 transition-all">
                    <HiPhotograph className="text-base" />
                    <span>Change</span>
                    <input type="file" name="banner" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-indigo-500 to-blue-500">
                      {(profile.image instanceof File || profileBefore?.ProfileImageURL || previewImage) ? (
                        <img
                          src={previewImage || (profile.image instanceof File ? URL.createObjectURL(profile.image) : profileBefore?.ProfileImageURL)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                          {profile.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-1.5 rounded-full cursor-pointer bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-lg">
                      <HiCamera className="text-sm" />
                      <input type="file" name="image" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className={`text-xs px-2 py-0.5 rounded-full ${isProfileComplete() ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {isProfileComplete() ? "✓ Complete" : "⚠️ Incomplete"}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <HiUserGroup className={getSecondaryTextColor()} />
                      <span className={getSecondaryTextColor()}>{profile.followers?.length || 0} Followers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <HiStar className={getSecondaryTextColor()} />
                      <span className={getSecondaryTextColor()}>{profile.skills?.length || 0} Skills</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === tab.id ? `${getGradientBg()} text-white shadow-md` : `${getCardBg()} ${getSecondaryTextColor()} hover:scale-[1.02] border ${getBorderColor()}`}`}>
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              className={`${getCardBg()} rounded-2xl shadow-lg p-6 border ${getBorderColor()}`}>

              {activeTab === "basic" && (
                <div>
                  <h2 className={`text-lg font-bold mb-4 ${getTextColor()}`}>Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${!profile.name?.trim() ? "border-red-500" : ""}`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>Email</label>
                      <input
                        type="email"
                        value={currentUser?.email || ""}
                        disabled
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#2c2d2e] bg-gray-100 dark:bg-[#252527] text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>About Me</label>
                      <textarea
                        name="about"
                        value={profile.about}
                        onChange={handleChange}
                        rows={3}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none`}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>Location</label>
                      <input
                        type="text"
                        name="location"
                        value={profile.location}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>Education</label>
                      <input
                        type="text"
                        name="education"
                        value={profile.education}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="University, Degree"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>Experience</label>
                      <input
                        type="text"
                        name="experience"
                        value={profile.experience}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="Years of experience"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "skills" && (
                <div>
                  <h2 className={`text-lg font-bold mb-4 ${getTextColor()}`}>Skills</h2>
                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      name="newSkill"
                      value={profile.newSkill}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                      placeholder="Add a skill..."
                      onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    />
                    <button
                      onClick={addSkill}
                      className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-1 ${getGradientBg()} text-white hover:scale-[1.02]`}>
                      <HiPlus className="text-lg" />
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <span key={idx} className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 ${themeMode === "light" ? "bg-indigo-100 text-indigo-800" : "bg-indigo-900/50 text-indigo-300"}`}>
                        <HiCode className="text-xs" />
                        {skill}
                        <button onClick={() => removeSkill(idx)} className="hover:text-red-400 transition-colors">
                          <HiX className="text-sm" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "links" && (
                <div>
                  <h2 className={`text-lg font-bold mb-4 ${getTextColor()}`}>Social Links</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>Portfolio</label>
                      <input
                        type="url"
                        name="portfolio"
                        value={profile.portfolio}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="https://your-portfolio.com"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>GitHub</label>
                      <input
                        type="url"
                        name="github"
                        value={profile.github}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="https://github.com/username"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>LinkedIn</label>
                      <input
                        type="url"
                        name="linkedin"
                        value={profile.linkedin}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>Twitter</label>
                      <input
                        type="url"
                        name="twitter"
                        value={profile.twitter}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "additional" && (
                <div>
                  <h2 className={`text-lg font-bold mb-4 ${getTextColor()}`}>Additional Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>Languages</label>
                      <input
                        type="text"
                        name="languages"
                        value={profile.languages}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="English, Arabic, French..."
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>Interests</label>
                      <input
                        type="text"
                        name="interests"
                        value={profile.interests}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="Coding, Design, Music..."
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>YouTube</label>
                      <input
                        type="url"
                        name="youtube"
                        value={profile.youtube}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="https://youtube.com/@username"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>Instagram</label>
                      <input
                        type="url"
                        name="instagram"
                        value={profile.instagram}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="https://instagram.com/username"
                      />
                    </div>
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

export default MainProfileInfos;