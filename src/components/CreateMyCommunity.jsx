import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { useLanguage } from "../context/LanguageContext";

const CreateCommunity = () => {
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    themeMode === "light" ? "bg-gray-100" : "bg-[#1e1e1f]";
  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const communityCategories = [
    "Technology",
    "Programming",
    "Gaming",
    "Art & Design",
    "Music",
    "Movies & TV",
    "Books & Literature",
    "Education",
    "Science",
    "Math",
    "Engineering",
    "Photography",
    "Business",
    "Marketing",
    "Finance & Investing",
    "Startups",
    "Health & Fitness",
    "Mental Health",
    "Nutrition",
    "Travel",
    "Food & Cooking",
    "History",
    "Philosophy",
    "Politics",
    "News & Current Events",
    "Religion & Spirituality",
    "Languages",
    "Writing & Blogging",
    "DIY & Crafts",
    "Fashion & Style",
    "Parenting",
    "Pets & Animals",
    "Relationships",
    "Memes",
    "Productivity",
    "Career & Jobs",
    "Self Improvement",
    "Environment",
    "Crypto & Blockchain",
    "AI & Machine Learning",
    "Web Development",
    "Mobile Development",
    "UX/UI",
    "Anime & Manga",
    "Comics",
    "Sports",
    "Esports",
    "Automotive",
    "Hobbies & Interests",
  ];

  const [communityData, setCommunityData] = useState({
    name: "",
    shortDescription: "",
    fullDescription: "",
    category: "",
    Members: [auth.currentUser?.uid],
    createdBy: auth.currentUser?.uid,
  });

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (communityData.createdBy) {
        const docRef = doc(db, "users", communityData.createdBy);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.log("No such document!");
        }
      }
    };

    fetchUserData();
  }, [communityData.createdBy]);

  const createYourcommunity = async (communityData) => {
    if (
      communityData.name !== "" &&
      communityData.shortDescription !== "" &&
      communityData.fullDescription !== "" &&
      communityData.category !== "" &&
      Array.isArray(communityData.Members) &&
      communityData.createdBy != null
    ) {
      try {
        setIsUploading(true);
        setUploadProgress(0);

        const categoryCollectionRef = collection(
          db,
          "communities",
          communityData.category,
          "items",
        );

        setUploadProgress(10);

        const docRef = await addDoc(categoryCollectionRef, {
          ...communityData,
          creatorname: userData?.name || "",
          createdAt: serverTimestamp(),
        });

        const communityId = docRef.id;

        setUploadProgress(20);

        await updateDoc(docRef, { id: communityId });

        const userCommunityRef = doc(
          db,
          "users",
          auth.currentUser.uid,
          "myOwnCommunities",
          communityId,
        );

        await setDoc(userCommunityRef, {
          communityId: communityId,
          communityName: communityData.name,
          category: communityData.category,
          shortDescription: communityData.shortDescription,
          fullDescription: communityData.fullDescription,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser.uid,
          creatorname: userData?.name || "",
          Members: [auth.currentUser?.uid],
        });

        setUploadProgress(40);

        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userDocRef, {
          communities: arrayUnion(communityId),
        });

        setUploadProgress(50);

        if (bannerFile) {
          const bannerRef = ref(
            storage,
            `community_banners/${communityId}-banner-${bannerFile.name}`,
          );
          await uploadBytes(bannerRef, bannerFile);
          const downloadURL = await getDownloadURL(bannerRef);
          await updateDoc(docRef, { bannerURL: downloadURL });

          await updateDoc(userCommunityRef, {
            bannerURL: downloadURL,
          });
        }

        setUploadProgress(70);

        if (logoFile) {
          const logoRef = ref(
            storage,
            `community_logos/${communityId}-logo-${logoFile.name}`,
          );
          await uploadBytes(logoRef, logoFile);
          const downloadURL = await getDownloadURL(logoRef);
          await updateDoc(docRef, { logoURL: downloadURL });

          await updateDoc(userCommunityRef, {
            logoURL: downloadURL,
          });
        }

        setUploadProgress(90);

        setFormError("");
        setSuccessMsg(t("createCommunity.successMessage"));
        setTimeout(() => setSuccessMsg(""), 3000);

        setCommunityData({
          name: "",
          shortDescription: "",
          fullDescription: "",
          category: "",
          Members: [auth.currentUser?.uid],
          createdBy: auth.currentUser?.uid,
        });
        setBannerFile(null);
        setLogoFile(null);

        // ✅ Progress: 100%
        setUploadProgress(100);

        // ✅ Hide spinner after delay
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } catch (e) {
        console.error(e);
        setFormError(t("createCommunity.uploadError"));
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else {
      setFormError(t("createCommunity.requiredFields"));
    }
  };

  // Loading state for language
  if (!themeMode || languageLoading) {
    return (
      <div
        className={`min-h-screen ${getBgColor()} flex items-center justify-center`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <div className={`${getTextColor()}`}>
            {language === "ar" ? "جاري التحميل..." : "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getBgColor()} pt-3 pb-8 px-3 md:px-0`}>
      <div
        className={`max-w-7xl mx-auto transition-all duration-500 ease-in-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        } ${!isMobile && "mt-10"}`}>
        <div
          className={`${getCardBg()} rounded-xl shadow-lg overflow-hidden border ${getBorderColor()}`}>
          <div className="bg-gradient-to-r from-cyan-600 to-purple-800 p-4 md:p-6">
            <h1
              className={`font-bold text-white ${
                isMobile ? "text-xl" : "text-3xl"
              }`}>
              🌐 {t("createCommunity.title")}
            </h1>
          </div>

          <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
            <div className="space-y-4 md:space-y-6">
              <div>
                <label
                  className={`block font-semibold mb-2 ${getTextColor()} ${
                    isMobile ? "text-base" : "text-lg"
                  }`}>
                  {t("createCommunity.name")}
                </label>
                <input
                  type="text"
                  placeholder={t("createCommunity.namePlaceholder")}
                  value={communityData.name}
                  onChange={(e) =>
                    setCommunityData({ ...communityData, name: e.target.value })
                  }
                  className={`w-full px-4 py-2 md:py-3 rounded-lg ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 focus:border-transparent ${getTextColor()} placeholder-gray-400 text-sm md:text-base`}
                  disabled={isUploading}
                />
              </div>

              <div>
                <label
                  className={`block font-semibold mb-2 ${getTextColor()} ${
                    isMobile ? "text-base" : "text-lg"
                  }`}>
                  {t("createCommunity.shortDescription")}
                </label>
                <input
                  type="text"
                  placeholder={t("createCommunity.shortDescriptionPlaceholder")}
                  maxLength={150}
                  value={communityData.shortDescription}
                  onChange={(e) =>
                    setCommunityData({
                      ...communityData,
                      shortDescription: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 md:py-3 rounded-lg ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 focus:border-transparent ${getTextColor()} placeholder-gray-400 text-sm md:text-base`}
                  disabled={isUploading}
                />
              </div>

              <div>
                <label
                  className={`block font-semibold mb-2 ${getTextColor()} ${
                    isMobile ? "text-base" : "text-lg"
                  }`}>
                  {t("createCommunity.fullDescription")}
                </label>
                <textarea
                  rows={isMobile ? 5 : 8}
                  placeholder={t("createCommunity.fullDescriptionPlaceholder")}
                  value={communityData.fullDescription}
                  onChange={(e) =>
                    setCommunityData({
                      ...communityData,
                      fullDescription: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 md:py-3 rounded-lg ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 focus:border-transparent ${getTextColor()} placeholder-gray-400 text-sm md:text-base`}
                  disabled={isUploading}></textarea>
              </div>

              <div>
                <label
                  className={`block font-semibold mb-2 ${getTextColor()} ${
                    isMobile ? "text-base" : "text-lg"
                  }`}>
                  {t("createCommunity.category")}
                </label>
                <select
                  onChange={(e) =>
                    setCommunityData({
                      ...communityData,
                      category: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 md:py-3 rounded-lg ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 ${getTextColor()} text-sm md:text-base`}
                  defaultValue=""
                  disabled={isUploading}>
                  <option value="" disabled className={getCardBg()}>
                    {t("createCommunity.selectCategory")}
                  </option>
                  {communityCategories.map((item, idx) => (
                    <option
                      key={`${item}-${idx}`}
                      value={item}
                      className={getCardBg()}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div>
                <label
                  className={`block font-semibold mb-2 ${getTextColor()} ${
                    isMobile ? "text-base" : "text-lg"
                  }`}>
                  {t("createCommunity.communityLogo")}
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-3 md:p-4 hover:border-purple-500 transition-colors ${getInputBg()} ${getBorderColor()}`}>
                  {logoFile ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={URL.createObjectURL(logoFile)}
                        alt={t("createCommunity.logoPreview")}
                        className={`object-cover rounded-full mb-2 border-2 border-purple-500 ${
                          isMobile ? "w-20 h-20" : "w-32 h-32"
                        }`}
                      />
                      <button
                        onClick={() => setLogoFile(null)}
                        className="text-purple-300 text-xs md:text-sm cursor-pointer hover:text-purple-200"
                        disabled={isUploading}>
                        {t("createCommunity.remove")}
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer">
                      <svg
                        className={`text-gray-500 mb-2 ${
                          isMobile ? "w-8 h-8" : "w-12 h-12"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-400 mb-1 text-xs md:text-sm text-center">
                        {t("createCommunity.clickToUploadLogo")}
                      </span>
                      <span className="text-xs text-gray-500 text-center">
                        {t("createCommunity.logoRequirements")}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => setLogoFile(e.target.files[0])}
                        accept="image/*"
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label
                  className={`block font-semibold mb-2 ${getTextColor()} ${
                    isMobile ? "text-base" : "text-lg"
                  }`}>
                  {t("createCommunity.communityBanner")}
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-3 md:p-4 hover:border-purple-500 transition-colors ${getInputBg()} ${getBorderColor()}`}>
                  {bannerFile ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={URL.createObjectURL(bannerFile)}
                        alt={t("createCommunity.bannerPreview")}
                        className={`w-full object-cover rounded-lg mb-2 ${
                          isMobile ? "h-20" : "h-32"
                        }`}
                      />
                      <button
                        onClick={() => setBannerFile(null)}
                        className="text-purple-300 text-xs md:text-sm cursor-pointer hover:text-purple-200"
                        disabled={isUploading}>
                        {t("createCommunity.remove")}
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer">
                      <svg
                        className={`text-gray-500 mb-2 ${
                          isMobile ? "w-8 h-8" : "w-12 h-12"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-400 mb-1 text-xs md:text-sm text-center">
                        {t("createCommunity.clickToUploadBanner")}
                      </span>
                      <span className="text-xs text-gray-500 text-center">
                        {t("createCommunity.bannerRequirements")}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => setBannerFile(e.target.files[0])}
                        accept="image/*"
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`${getInputBg()} px-4 md:px-8 py-4 md:py-6 border-t ${getBorderColor()} flex flex-col md:flex-row justify-end items-center gap-3`}>
            <div className="flex-1">
              {formError && (
                <div className="text-red-400 text-xs md:text-sm">
                  {formError}
                </div>
              )}
              {successMsg && (
                <div className="text-green-400 text-xs md:text-sm">
                  {successMsg}
                </div>
              )}
              {/* ✅ Progress Bar */}
              {isUploading && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-gradient-to-r from-cyan-600 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className={`text-xs ${getSecondaryTextColor()} mt-1`}>
                    {t("createCommunity.uploading")}...{" "}
                    {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => createYourcommunity(communityData)}
              disabled={isUploading}
              className={`bg-gradient-to-r from-cyan-600 to-indigo-700 text-white px-6 py-2 md:px-8 md:py-3 rounded-lg font-semibold transition-colors shadow-md text-sm md:text-base w-full md:w-auto flex items-center justify-center gap-2 ${
                isUploading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-cyan-700 hover:to-indigo-800"
              }`}>
              {isUploading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("createCommunity.creating")}
                </>
              ) : (
                t("createCommunity.createButton")
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunity;
