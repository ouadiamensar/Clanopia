/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import add from "../assets/add.png";
import trash from "../assets/trash.png";
import { db, auth, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import RightSideBar from "./RightSideBar";
import { useLanguage } from "../context/LanguageContext";

const CreateTeam = () => {
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

  const [currentStep, setCurrentStep] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [teamData, setTeamData] = useState({
    name: "",
    shortDescription: "",
    fullDescription: "",
    skills: [],
    category: "",
    language: "",
    timezone: "",
    workStyle: "",
    Members: [],
    createdBy: auth.currentUser?.uid,
  });
  const [userData, setUserData] = useState(null);
  const [formError, setFormError] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [numSkillInput, setNumSkillInput] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
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
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (teamData.createdBy) {
        const docRef = doc(db, "users", teamData.createdBy);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.log("No such document!");
        }
      }
    };

    fetchUserData();
  }, [teamData.createdBy]);

  const getBgColor = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#1e1e1f]";
  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-300";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getHoverColor = () =>
    themeMode === "light" ? "hover:bg-gray-200" : "hover:bg-[#29292a]";

  function addSkill() {
    if (
      skillInput !== "" &&
      numSkillInput !== "" &&
      !teamData.skills.some((s) => s.skill === skillInput)
    ) {
      setTeamData((prev) => ({
        ...prev,
        skills: [
          ...prev.skills,
          { skill: skillInput, NumSkill: numSkillInput },
        ],
      }));
      setSkillInput("");
      setNumSkillInput("");
    }
  }

  function deleteSkill(idx) {
    const skillAfterDelete = [...teamData.skills];
    skillAfterDelete.splice(idx, 1);
    setTeamData({
      ...teamData,
      skills: skillAfterDelete,
    });
  }

  const nextStep = () => {
    if (currentStep === 1) {
      if (!teamData.name || !teamData.shortDescription) {
        setFormError(t("createTeam.fillRequiredFields"));
        return;
      }
    } else if (currentStep === 2) {
      if (!teamData.fullDescription || teamData.skills.length === 0) {
        setFormError(t("createTeam.fillRequiredFields"));
        return;
      }
    } else if (currentStep === 3) {
      if (!teamData.category || !teamData.workStyle) {
        setFormError(t("createTeam.fillRequiredFields"));
        return;
      }
    }

    setFormError("");
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setFormError("");
    setCurrentStep(currentStep - 1);
  };

  const createYourTeam = async (teamData) => {
    if (!auth.currentUser) {
      setFormError(t("createTeam.mustBeLoggedIn"));
      return;
    }

    const requiredFields = [
      teamData.name,
      teamData.shortDescription,
      teamData.fullDescription,
      teamData.skills.length > 0,
      teamData.category,
      teamData.language,
      teamData.timezone,
      teamData.workStyle,
    ];

    if (requiredFields.some((field) => !field)) {
      setFormError(t("createTeam.fillRequiredFields"));
      return;
    }

    setLoading(true);
    setFormError("");
    
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: userData?.name || "",
          email: auth.currentUser.email || "",
          teams: [],
          createdAt: serverTimestamp(),
        });
      }

      const teamDocRef = await addDoc(collection(db, "teams"), {
        ...teamData,
        creatorname: userData?.name || auth.currentUser.displayName || "",
        createdAt: serverTimestamp(),
        members: [auth.currentUser.uid],
        imageURL: "",
        bannerURL: "",
      });

      const teamId = teamDocRef.id;

      await updateDoc(teamDocRef, { id: teamId });

      await updateDoc(userDocRef, {
        teams: arrayUnion(teamId),
      });

      let imageUploadError = null;
      let bannerUploadError = null;

      if (imageFile) {
        try {
          if (imageFile.size > 5 * 1024 * 1024) {
            throw new Error(t("createTeam.logoTooLarge"));
          }

          const cleanImageName = imageFile.name.replace(/\s+/g, "_");
          const logoRef = ref(
            storage,
            `teams/${teamId}/logo_${Date.now()}_${cleanImageName}`
          );
          
          const snapshot = await uploadBytes(logoRef, imageFile);
          const downloadURL = await getDownloadURL(snapshot.ref);
          await updateDoc(teamDocRef, { imageURL: downloadURL });
          
          console.log("Logo uploaded successfully!");
        } catch (error) {
          console.error("Logo upload failed:", error);
          imageUploadError = error.message || t("createTeam.logoUploadFailed");
        }
      }

      if (bannerFile) {
        try {
          if (bannerFile.size > 10 * 1024 * 1024) {
            throw new Error(t("createTeam.bannerTooLarge"));
          }

          const cleanBannerName = bannerFile.name.replace(/\s+/g, "_");
          const bannerRef = ref(
            storage,
            `teams/${teamId}/banner_${Date.now()}_${cleanBannerName}`
          );
          
          const snapshot = await uploadBytes(bannerRef, bannerFile);
          const downloadURL = await getDownloadURL(snapshot.ref);
          await updateDoc(teamDocRef, { bannerURL: downloadURL });
          
          console.log("Banner uploaded successfully!");
        } catch (error) {
          console.error("Banner upload failed:", error);
          bannerUploadError = error.message || t("createTeam.bannerUploadFailed");
        }
      }

      let successMessage = t("createTeam.teamCreated");
      if (imageUploadError) {
        successMessage += " (Logo upload failed: " + imageUploadError + ")";
      }
      if (bannerUploadError) {
        successMessage += " (Banner upload failed: " + bannerUploadError + ")";
      }
      
      setSuccessMsg(successMessage);
      setTimeout(() => setSuccessMsg(""), 5000);
      
      resetForm();
      
      setTimeout(() => {
        window.location.href = `/myteams`;
      }, 2000);
      
    } catch (error) {
      console.error("Error creating team:", error);
      setFormError(error.message || t("createTeam.teamCreationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTeamData({
      name: "",
      shortDescription: "",
      fullDescription: "",
      skills: [],
      category: "",
      language: "",
      timezone: "",
      workStyle: "",
      Members: [],
      createdBy: auth.currentUser?.uid,
    });
    setImageFile(null);
    setBannerFile(null);
    setCurrentStep(1);
  };

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  const StepIndicator = () => (
    <div className="flex justify-center mb-6 md:mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center 
              ${
                currentStep >= step
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-400"
              }
              font-semibold text-sm md:text-base transition-all duration-300`}>
            {step}
          </div>
          {step < 4 && (
            <div
              className={`w-8 md:w-16 h-1 transition-all duration-500 ${
                currentStep > step ? "bg-indigo-600" : "bg-gray-700"
              }`}></div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className={`min-h-screen ${getBgColor()}`}>
      <div className="flex">
        <Sidebar themeMode={themeMode} />
        <div
          className={`flex-1 h-screen p-4 transition-all duration-500 ease-in-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          } ${!isMobile && "pl-70  pr-30"} ${isMobile && "pt-20"}`}>
          <div
            className={`${getCardBg()} h-full  rounded-xl shadow-lg overflow-hidden border ${getBorderColor()} transition-all duration-300`}>
            <div className="bg-gradient-to-r from-indigo-700 to-cyan-700 p-4 md:p-6 mb-4 md:mb-5">
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                <svg
                  className="w-8 h-8 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {t("createTeam.title")}
              </h1>
            </div>

            <div className="px-4 md:px-8 pt-4">
              <StepIndicator />
            </div>

            <div className="p-4 md:p-8">
              {currentStep === 1 && (
                <div className="space-y-4 md:space-y-6">
                  <h2
                    className={` ${getTextColor()} text-xl md:text-2xl font-semibold text-gray-00 mb-4 md:mb-6 flex items-center`}>
                    <svg
                      className="w-6 h-6 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {t("createTeam.basicInfo")}
                  </h2>

                  <div>
                    <label className="block text-base md:text-lg font-semibold text-gray-300 mb-2">
                      {t("createTeam.teamName")}
                    </label>
                    <input
                      type="text"
                      placeholder={t("createTeam.teamNamePlaceholder")}
                      value={teamData.name}
                      onChange={(e) =>
                        setTeamData({ ...teamData, name: e.target.value })
                      }
                      className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border ${getBorderColor()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base transition-colors duration-300`}
                    />
                  </div>

                  <div>
                    <label className="block text-base md:text-lg font-semibold text-gray-300 mb-2">
                      {t("createTeam.shortDescription")}
                    </label>
                    <input
                      type="text"
                      placeholder={t("createTeam.shortDescriptionPlaceholder")}
                      maxLength={150}
                      value={teamData.shortDescription}
                      onChange={(e) =>
                        setTeamData({
                          ...teamData,
                          shortDescription: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border ${getBorderColor()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base transition-colors duration-300`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {teamData.shortDescription.length}/150{" "}
                      {t("createTeam.characters")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-base md:text-lg font-semibold text-gray-300 mb-2">
                      {t("createTeam.teamLogo")}
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 md:p-4 hover:border-indigo-500 transition-colors  cursor-pointer">
                      {imageFile ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={URL.createObjectURL(imageFile)}
                            alt="Logo Preview"
                            className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-full mb-2 md:mb-3 border-2 border-indigo-500"
                          />
                          <button
                            onClick={() => setImageFile(null)}
                            className="text-red-400  text-lg md:text-sm cursor-pointer hover:text-red-300 transition-colors">
                            {t("createTeam.remove")}
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center cursor-pointer">
                          <svg
                            className="w-10 h-10 md:w-12 md:h-12 text-gray-500 mb-2 md:mb-3"
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
                          <span className="text-gray-400 mb-1 text-sm md:text-base">
                            {t("createTeam.uploadLogo")}
                          </span>
                          <span className="text-xs text-gray-500">
                            {t("createTeam.fileTypes")}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            accept="image/*"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-200 mb-4 md:mb-6 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    {t("createTeam.teamDetails")}
                  </h2>

                  <div>
                    <label className="block text-base md:text-lg font-semibold text-gray-300 mb-2">
                      {t("createTeam.fullDescription")}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={t("createTeam.fullDescriptionPlaceholder")}
                      value={teamData.fullDescription}
                      onChange={(e) =>
                        setTeamData({
                          ...teamData,
                          fullDescription: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border ${getBorderColor()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base transition-colors duration-300`}></textarea>
                  </div>

                  <div>
                    <label className="block text-base md:text-lg font-semibold text-gray-300 mb-2">
                      {t("createTeam.requiredSkills")}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {teamData.skills.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center bg-gray-700 rounded-full px-3 py-1 md:px-4 md:py-2 border border-gray-600 text-xs md:text-sm transition-all duration-300 hover:scale-105">
                          <span className="mr-2 text-gray-300">
                            {item.skill} | {item.NumSkill}
                          </span>
                          <button
                            onClick={() => deleteSkill(idx)}
                            className="text-red-400 hover:text-red-300 transition-colors">
                            <img
                              src={trash}
                              className="w-3 h-3 md:w-4 md:h-4"
                              alt="Delete"
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                      <input
                        type="text"
                        placeholder={t("createTeam.skillPlaceholder")}
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        className={`flex-1 px-3 py-2 md:px-4 md:py-2 rounded-lg border ${getBorderColor()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 text-sm md:text-base transition-colors duration-300`}
                      />
                      <input
                        type="number"
                        min={1}
                        placeholder={t("createTeam.seatsPlaceholder")}
                        value={numSkillInput}
                        onChange={(e) => setNumSkillInput(e.target.value)}
                        className={`w-full md:w-20 px-3 py-2 md:px-4 md:py-2 rounded-lg border ${getBorderColor()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 text-sm md:text-base transition-colors duration-300`}
                      />
                      <button
                        onClick={addSkill}
                        className={`p-2 rounded-lg ${getHoverColor()} cursor-pointer transition-all duration-300 border ${getBorderColor()} flex items-center justify-center hover:scale-105`}>
                        <img
                          src={add}
                          className="w-4 h-4 md:w-5 md:h-5 invert"
                          alt="Add"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-200 mb-4 md:mb-6 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {t("createTeam.teamPreferences")}
                  </h2>

                  <div>
                    <label className="block text-base md:text-lg font-semibold text-gray-300 mb-2">
                      {t("createTeam.category")}
                    </label>
                    <select
                      onChange={(e) =>
                        setTeamData({ ...teamData, category: e.target.value })
                      }
                      className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border ${getBorderColor()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 text-sm md:text-base transition-colors duration-300`}
                      defaultValue="">
                      <option value="" disabled className="text-gray-500">
                        {t("createTeam.selectCategory")}
                      </option>
                      {communityCategories.map((item, idx) => (
                        <option
                          key={`${item}-${idx}`}
                          value={item}
                          className="bg-gray-800">
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-base md:text-lg font-semibold text-gray-300 mb-2">
                      {t("createTeam.workStyle")}
                    </label>
                    <select
                      onChange={(e) =>
                        setTeamData({ ...teamData, workStyle: e.target.value })
                      }
                      className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border ${getBorderColor()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 text-sm md:text-base transition-colors duration-300`}
                      defaultValue="">
                      <option value="" disabled className="text-gray-500">
                        {t("createTeam.selectWorkStyle")}
                      </option>
                      <option value="volunteer" className="bg-gray-800">
                        {t("workStyles.volunteer")}
                      </option>
                      <option value="paid" className="bg-gray-800">
                        {t("workStyles.paid")}
                      </option>
                      <option value="profit" className="bg-gray-800">
                        {t("workStyles.profit")}
                      </option>
                      <option value="startup" className="bg-gray-800">
                        {t("workStyles.startup")}
                      </option>
                      <option value="hobby" className="bg-gray-800">
                        {t("workStyles.hobby")}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-base md:text-lg font-semibold text-gray-300 mb-2">
                      {t("createTeam.communicationLanguage")}
                    </label>
                    <select
                      onChange={(e) =>
                        setTeamData({ ...teamData, language: e.target.value })
                      }
                      className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border ${getBorderColor()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 text-sm md:text-base transition-colors duration-300`}
                      defaultValue="">
                      <option value="" disabled className="text-gray-500">
                        {t("createTeam.selectLanguage")}
                      </option>
                      {Object.keys(translations.languages || {}).map((lang) => (
                        <option key={lang} value={lang} className="bg-gray-800">
                          {t(`languages.${lang}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-base md:text-lg font-semibold text-gray-300 mb-2">
                      {t("createTeam.timeZone")}
                    </label>
                    <select
                      onChange={(e) =>
                        setTeamData({ ...teamData, timezone: e.target.value })
                      }
                      className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border ${getBorderColor()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-indigo-500 text-sm md:text-base transition-colors duration-300`}
                      defaultValue="">
                      <option value="" disabled className="text-gray-500">
                        {t("createTeam.selectTimeZone")}
                      </option>
                      <option value="UTC-12:00" className="bg-gray-800">
                        UTC -12:00 (Baker Island)
                      </option>
                      <option value="UTC-11:00" className="bg-gray-800">
                        UTC -11:00 (American Samoa)
                      </option>
                      <option value="UTC-10:00" className="bg-gray-800">
                        UTC -10:00 (Hawaii)
                      </option>
                      <option value="UTC-09:00" className="bg-gray-800">
                        UTC -09:00 (Alaska)
                      </option>
                      <option value="UTC-08:00" className="bg-gray-800">
                        UTC -08:00 (Pacific Time - US & Canada)
                      </option>
                      <option value="UTC-07:00" className="bg-gray-800">
                        UTC -07:00 (Mountain Time - US & Canada)
                      </option>
                      <option value="UTC-06:00" className="bg-gray-800">
                        UTC -06:00 (Central Time - US & Canada)
                      </option>
                      <option value="UTC-05:00" className="bg-gray-800">
                        UTC -05:00 (Eastern Time - US & Canada)
                      </option>
                      <option value="UTC-04:00" className="bg-gray-800">
                        UTC -04:00 (Atlantic Time - Canada, Caribbean)
                      </option>
                      <option value="UTC-03:00" className="bg-gray-800">
                        UTC -03:00 (Argentina, Brazil, Uruguay)
                      </option>
                      <option value="UTC-02:00" className="bg-gray-800">
                        UTC -02:00 (South Georgia)
                      </option>
                      <option value="UTC-01:00" className="bg-gray-800">
                        UTC -01:00 (Azores, Cape Verde)
                      </option>
                      <option value="UTC+00:00" className="bg-gray-800">
                        UTC +00:00 (Greenwich Mean Time - UK)
                      </option>
                      <option value="UTC+01:00" className="bg-gray-800">
                        UTC +01:00 (Morocco, Central Europe)
                      </option>
                      <option value="UTC+02:00" className="bg-gray-800">
                        UTC +02:00 (Egypt, South Africa)
                      </option>
                      <option value="UTC+03:00" className="bg-gray-800">
                        UTC +03:00 (Saudi Arabia, East Africa)
                      </option>
                      <option value="UTC+03:30" className="bg-gray-800">
                        UTC +03:30 (Iran)
                      </option>
                      <option value="UTC+04:00" className="bg-gray-800">
                        UTC +04:00 (UAE, Azerbaijan)
                      </option>
                      <option value="UTC+04:30" className="bg-gray-800">
                        UTC +04:30 (Afghanistan)
                      </option>
                      <option value="UTC+05:00" className="bg-gray-800">
                        UTC +05:00 (Pakistan, Uzbekistan)
                      </option>
                      <option value="UTC+05:30" className="bg-gray-800">
                        UTC +05:30 (India, Sri Lanka)
                      </option>
                      <option value="UTC+05:45" className="bg-gray-800">
                        UTC +05:45 (Nepal)
                      </option>
                      <option value="UTC+06:00" className="bg-gray-800">
                        UTC +06:00 (Bangladesh, Bhutan)
                      </option>
                      <option value="UTC+06:30" className="bg-gray-800">
                        UTC +06:30 (Myanmar)
                      </option>
                      <option value="UTC+07:00" className="bg-gray-800">
                        UTC +07:00 (Thailand, Vietnam)
                      </option>
                      <option value="UTC+08:00" className="bg-gray-800">
                        UTC +08:00 (China, Singapore, Malaysia)
                      </option>
                      <option value="UTC+09:00" className="bg-gray-800">
                        UTC +09:00 (Japan, Korea)
                      </option>
                      <option value="UTC+09:30" className="bg-gray-800">
                        UTC +09:30 (Central Australia)
                      </option>
                      <option value="UTC+10:00" className="bg-gray-800">
                        UTC +10:00 (Eastern Australia, Papua New Guinea)
                      </option>
                      <option value="UTC+11:00" className="bg-gray-800">
                        UTC +11:00 (Solomon Islands, New Caledonia)
                      </option>
                      <option value="UTC+12:00" className="bg-gray-800">
                        UTC +12:00 (New Zealand, Fiji)
                      </option>
                      <option value="UTC+13:00" className="bg-gray-800">
                        UTC +13:00 (Tonga, Samoa)
                      </option>
                      <option value="UTC+14:00" className="bg-gray-800">
                        UTC +14:00 (Line Islands)
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-200 mb-4 md:mb-6 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {t("createTeam.finalTouches")}
                  </h2>

                  <div>
                    <label className="block text-base md:text-lg font-semibold text-gray-300 mb-2">
                      {t("createTeam.teamBanner")}
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 md:p-4 hover:border-indigo-500 transition-colors bg-gray-700/50 cursor-pointer">
                      {bannerFile ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={URL.createObjectURL(bannerFile)}
                            alt="Banner Preview"
                            className="w-full h-24 md:h-32 object-cover rounded-lg mb-2 md:mb-3 border-2 border-indigo-500"
                          />
                          <button
                            onClick={() => setBannerFile(null)}
                            className="text-red-400 text-xs md:text-sm cursor-pointer hover:text-red-300 transition-colors">
                            {t("createTeam.remove")}
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center cursor-pointer">
                          <svg
                            className="w-10 h-10 md:w-12 md:h-12 text-gray-500 mb-2 md:mb-3"
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
                          <span className="text-gray-400 mb-1 text-sm md:text-base">
                            {t("createTeam.uploadBanner")}
                          </span>
                          <span className="text-xs text-gray-500">
                            {t("createTeam.bannerFileTypes")}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setBannerFile(e.target.files[0])}
                            accept="image/*"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div
                    className={`${getInputBg()} p-4 md:p-6 rounded-lg border ${getBorderColor()}`}>
                    <h3 className="text-base md:text-lg font-semibold mb-3 text-gray-300">
                      {t("createTeam.reviewTeam")}
                    </h3>
                    <div className="space-y-2 text-gray-300 text-sm md:text-base">
                      <p>
                        <span className="font-medium">
                          {t("createTeam.teamName")}
                        </span>{" "}
                        {teamData.name || "Not provided"}
                      </p>
                      <p>
                        <span className="font-medium">
                          {t("createTeam.shortDescription")}
                        </span>{" "}
                        {teamData.shortDescription || "Not provided"}
                      </p>
                      <p>
                        <span className="font-medium">
                          {t("createTeam.category")}
                        </span>{" "}
                        {teamData.category || "Not provided"}
                      </p>
                      <p>
                        <span className="font-medium">
                          {t("createTeam.workStyle")}
                        </span>{" "}
                        {teamData.workStyle || "Not provided"}
                      </p>
                      <p>
                        <span className="font-medium">
                          {t("createTeam.requiredSkills")}
                        </span>
                        {teamData.skills.length > 0
                          ? teamData.skills
                              .map((s) => `${s.skill} (${s.NumSkill})`)
                              .join(", ")
                          : "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`${getCardBg()} px-4 md:px-8 py-4 md:py-6 border-t ${getBorderColor()} flex flex-col md:flex-row justify-between gap-3 md:gap-0`}>
              <div>
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className={`${getInputBg()} ${getTextColor()} px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold ${getHoverColor()} transition-all duration-300 border ${getBorderColor()} text-sm md:text-base hover:scale-105`}>
                    {t("createTeam.back")}
                  </button>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                {formError && (
                  <div className="text-red-400 text-xs md:text-sm flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formError}
                  </div>
                )}
                {successMsg && (
                  <div className="text-green-400 text-xs md:text-sm flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {successMsg}
                  </div>
                )}

                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white px-4 py-2 md:px-8 md:py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-cyan-700 transition-all duration-300 shadow-md text-sm md:text-base w-full md:w-auto hover:scale-105 flex items-center justify-center">
                    {t("createTeam.next")}
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => createYourTeam(teamData)}
                    disabled={loading}
                    className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white px-4 py-2 md:px-8 md:py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-cyan-700 transition-all duration-300 shadow-md text-sm md:text-base w-full md:w-auto hover:scale-105 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        {t("createTeam.creating")}
                      </>
                    ) : (
                      <>
                        {t("createTeam.createTeam")}
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <RightSideBar themeMode={themeMode} />
      </div>
    </div>
  );
};

export default CreateTeam;
