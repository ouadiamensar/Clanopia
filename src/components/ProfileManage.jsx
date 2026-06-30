/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { doc, setDoc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import Sidebar from "./Sidebar";
import RightSideBar from "./rightSideBar";
import { useLanguage } from "../context/LanguageContext";
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
  HiCalendar,
  HiMail,
} from "react-icons/hi";
import {
  FaGithub,
  FaLinkedin,
  FaLanguage,
  FaTwitter,
  FaYoutube,
  FaInstagram,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ProfileManage = () => {
  const [profile, setProfile] = useState({
    image: null,
    banner: null,
    name: "",
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
  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-500" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-50" : "bg-[#252527]";
  const getInputBorder = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getLabelColor = () =>
    themeMode === "light" ? "text-gray-700" : "text-gray-300";
  const getGradientBg = () =>
    themeMode === "light"
      ? "bg-indigo-600 hover:bg-indigo-700"
      : "bg-indigo-600 hover:bg-indigo-700";

  const currentUser = auth.currentUser;

  useEffect(() => {
    const getUserProfile = async () => {
      if (!currentUser) return;
      const profileRef = doc(db, "users", currentUser.uid, "profile", "data");
      const snapshot = await getDoc(profileRef);
      setProfileBefore(snapshot.exists() ? snapshot.data() : null);
    };
    getUserProfile();
  }, [currentUser]);

  useEffect(() => {
    const fetchProfileData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const profileRef = doc(db, "users", user.uid, "profile", "data");
        const docSnap = await getDoc(profileRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();
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
          }));
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, []);

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
    const user = auth.currentUser;
    if (!user) {
      setSaveMessage({ type: "error", text: t("profile.pleaseLogin") });
      return;
    }

    if (!profile.name || profile.name.trim() === "") {
      setSaveMessage({ type: "error", text: t("profile.nameRequired") });
      return;
    }

    const hasProfileImage =
      profile.image instanceof File ||
      profileBefore?.ProfileImageURL ||
      previewImage;
    if (!hasProfileImage) {
      setSaveMessage({ type: "error", text: t("profile.imageRequired") });
      return;
    }

    const hasBanner =
      profile.banner instanceof File ||
      profileBefore?.BannerImageURL ||
      previewBanner;
    if (!hasBanner) {
      setSaveMessage({ type: "error", text: t("profile.bannerRequired") });
      return;
    }

    setIsSaving(true);
    setSaveMessage({ type: "", text: "" });

    const profileRef = doc(db, "users", user.uid, "profile", "data");
    let profileData = { ...profile };

    delete profileData.image;
    delete profileData.banner;
    delete profileData.newSkill;
    delete profileData.followers;
    delete profileData.Who_I_follow;

    if (profile.image instanceof File) {
      try {
        const imageRef = ref(storage, `users-images/${user.uid}-image`);
        await uploadBytes(imageRef, profile.image);
        const downloadURL = await getDownloadURL(imageRef);
        profileData.ProfileImageURL = downloadURL;
      } catch (error) {
        setSaveMessage({ type: "error", text: t("profile.imageUploadError") });
        setIsSaving(false);
        return;
      }
    } else if (profileBefore?.ProfileImageURL) {
      profileData.ProfileImageURL = profileBefore.ProfileImageURL;
    }

    if (profile.banner instanceof File) {
      try {
        const bannerRef = ref(storage, `users-banners/${user.uid}-banner`);
        await uploadBytes(bannerRef, profile.banner);
        const downloadURL = await getDownloadURL(bannerRef);
        profileData.BannerImageURL = downloadURL;
      } catch (error) {
        setSaveMessage({ type: "error", text: t("profile.bannerUploadError") });
        setIsSaving(false);
        return;
      }
    } else if (profileBefore?.BannerImageURL) {
      profileData.BannerImageURL = profileBefore.BannerImageURL;
    }

    try {
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        await updateDoc(profileRef, profileData);
      } else {
        await setDoc(profileRef, profileData);
      }
      setSaveMessage({ type: "success", text: t("profile.saveSuccess") });
      setProfileBefore(profileData);
      setTimeout(() => setSaveMessage({ type: "", text: "" }), 5000);
    } catch (error) {
      setSaveMessage({ type: "error", text: t("profile.saveError") });
    } finally {
      setIsSaving(false);
    }
  };

  if (!themeMode) return null;

  const tabs = [
    { id: "basic", label: t("profile.tabs.basic"), icon: <HiUser /> },
    { id: "skills", label: t("profile.tabs.skills"), icon: <HiStar /> },
    { id: "links", label: t("profile.tabs.links"), icon: <HiLink /> },
    { id: "additional", label: t("profile.tabs.additional"), icon: <HiChat /> },
  ];

  return (
    <div
      className={`min-h-screen ${getBgColor()} ${getTextColor()} transition-colors duration-300`}>
      <div className="flex">
        <Sidebar themeMode={themeMode} />
        <div className="flex-1 p-4 md:p-6 pt-5">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 ${isMobile && "mt-14"}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1
                    className={`text-2xl md:text-3xl font-bold ${getTextColor()} flex items-center gap-2`}>
                    <HiPencil className="text-indigo-500" />
                    {profile.name
                      ? t("profile.editTitle", { name: profile.name })
                      : t("profile.completeTitle")}
                  </h1>
                  <p className={`${getSecondaryTextColor()} text-sm`}>
                    {profile.name
                      ? t("profile.editSubtitle")
                      : t("profile.completeSubtitle")}
                  </p>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    isSaving
                      ? "opacity-50 cursor-not-allowed bg-gray-500"
                      : `${getGradientBg()} text-white hover:scale-[1.02]`
                  }`}>
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t("profile.saving")}
                    </>
                  ) : (
                    <>
                      <HiSave className="text-lg" />
                      {t("profile.saveProfile")}
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            <AnimatePresence>
              {saveMessage.text && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-4 p-3 rounded-xl text-sm ${
                    saveMessage.type === "success"
                      ? "bg-green-500/10 text-green-400 border border-green-500/30"
                      : "bg-red-500/10 text-red-400 border border-red-500/30"
                  }`}>
                  {saveMessage.text}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${getCardBg()} rounded-2xl shadow-lg overflow-hidden mb-6 border ${getBorderColor()}`}>
              <div className="relative h-48 md:h-56 bg-gradient-to-r from-indigo-600 to-blue-600">
                {profile.banner instanceof File ||
                profileBefore?.BannerImageURL ||
                previewBanner ? (
                  <>
                    <img
                      src={
                        previewBanner ||
                        (profile.banner instanceof File
                          ? URL.createObjectURL(profile.banner)
                          : profileBefore?.BannerImageURL)
                      }
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
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
                    <input
                      type="file"
                      name="banner"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-indigo-500 to-blue-500">
                      {profile.image instanceof File ||
                      profileBefore?.ProfileImageURL ||
                      previewImage ? (
                        <img
                          src={
                            previewImage ||
                            (profile.image instanceof File
                              ? URL.createObjectURL(profile.image)
                              : profileBefore?.ProfileImageURL)
                          }
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
                      <input
                        type="file"
                        name="image"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <HiUserGroup className={getSecondaryTextColor()} />
                      <span className={getSecondaryTextColor()}>
                        {profile.followers?.length || 0} Followers
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HiStar className={getSecondaryTextColor()} />
                      <span className={getSecondaryTextColor()}>
                        {profile.skills?.length || 0} Skills
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-wrap gap-1.5 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-md"
                      : `${getCardBg()} ${getSecondaryTextColor()} hover:bg-gray-100 dark:hover:bg-[#29292a] border ${getBorderColor()}`
                  }`}>
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${getCardBg()} rounded-2xl shadow-lg p-6 border ${getBorderColor()}`}>
              {activeTab === "basic" && (
                <div>
                  <h2 className={`text-lg font-bold mb-4 ${getTextColor()}`}>
                    Basic Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${getInputBorder()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={currentUser?.email || ""}
                        disabled
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#2c2d2e] bg-gray-100 dark:bg-[#252527] text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        Phone
                      </label>
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
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        About Me
                      </label>
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
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        Location
                      </label>
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
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        Education
                      </label>
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
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        Experience
                      </label>
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
                  <h2 className={`text-lg font-bold mb-4 ${getTextColor()}`}>
                    Skills
                  </h2>
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
                      <span
                        key={idx}
                        className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 ${themeMode === "light" ? "bg-gray-100 text-gray-700" : "bg-[#252527] text-gray-300"}`}>
                        <HiCode className="text-xs" />
                        {skill}
                        <button
                          onClick={() => removeSkill(idx)}
                          className="hover:text-red-400 transition-colors">
                          <HiX className="text-sm" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "links" && (
                <div>
                  <h2 className={`text-lg font-bold mb-4 ${getTextColor()}`}>
                    Social Links
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        Portfolio
                      </label>
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
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        GitHub
                      </label>
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
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        LinkedIn
                      </label>
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
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        Twitter
                      </label>
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
                  <h2 className={`text-lg font-bold mb-4 ${getTextColor()}`}>
                    Additional Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        Languages
                      </label>
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
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        Interests
                      </label>
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
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        YouTube
                      </label>
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
                      <label
                        className={`block text-sm font-medium mb-1 ${getLabelColor()}`}>
                        Instagram
                      </label>
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
            </motion.div>
          </div>
        </div>
        <RightSideBar themeMode={themeMode} />
      </div>
    </div>
  );
};

export default ProfileManage;
