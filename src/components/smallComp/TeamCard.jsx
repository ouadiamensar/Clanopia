/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { motion } from "framer-motion";

const TeamCard = ({
  img,
  banner,
  name,
  shortdescription,
  skill_seats,
  creatorname,
  checkIfTeamExists,
  id,
  themeMode,
}) => {
  const [userData, setUserData] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const { translations, loading: languageLoading } = useLanguage();

  const t = (key, params = {}) => {
    if (languageLoading) return key;

    let translation =
      key.split(".").reduce((obj, k) => obj?.[k], translations) || key;

    Object.keys(params).forEach((param) => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });

    return translation;
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth < 480);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const smallMobile = window.innerWidth < 480;
      setIsMobile(mobile);
      setIsSmallMobile(smallMobile);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.log("No such document!");
        }
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const checkIfSaved = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || !id) return;

      try {
        const saveRef = doc(
          db,
          "users",
          currentUser.uid,
          "saves",
          "Teams",
          "data",
          id,
        );
        const saveDoc = await getDoc(saveRef);
        setIsSaved(saveDoc.exists());
      } catch (error) {
        console.error("❌ Error checking team save status:", error);
      }
    };

    checkIfSaved();
  }, [id]);

  const handleSaveTeam = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please login to save teams");
      return;
    }

    if (!id) {
      console.error("❌ Team ID is missing");
      return;
    }

    setIsSaving(true);

    try {
      const saveRef = doc(
        db,
        "users",
        currentUser.uid,
        "saves",
        "Teams",
        "data",
        id,
      );

      const saveDoc = await getDoc(saveRef);

      if (saveDoc.exists()) {
        await deleteDoc(saveRef);
        setIsSaved(false);
        console.log("✅ Team unsaved successfully");
      } else {
        const teamDataToSave = {
          id: id,
          name: name,
          img: img || null,
          banner: banner || null,
          shortdescription: shortdescription || "",
          skill_seats: skill_seats || [],
          creatorname: creatorname || "",
          createdAt: new Date(),
          savedAt: new Date(),
        };

        await setDoc(saveRef, teamDataToSave);
        setIsSaved(true);
        console.log("✅ Team saved successfully at:", saveRef.path);
      }
    } catch (error) {
      console.error("❌ Error saving/unsaving team:", error);
      alert(`Failed to ${isSaved ? "unsave" : "save"} team: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const goToTeamPage = () => {
    navigate(`/teams/${id}`);
  };

  const displayedSkills = isSmallMobile
    ? (skill_seats || []).slice(0, 2)
    : skill_seats || [];

  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-indigo-300";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getSkillBg = () =>
    themeMode === "light"
      ? "bg-cyan-100 text-cyan-900"
      : "bg-indigo-900/50 text-purple-200";
  const getButtonBg = () =>
    themeMode === "light"
      ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
      : "bg-[#29292a] hover:bg-[#2c2d2e] text-gray-200";

  if (languageLoading) {
    return (
      <div
        className={`w-full ${getCardBg()} rounded-2xl shadow-md border ${getBorderColor()} animate-pulse ${
          isMobile ? "max-w-full" : "max-w-s"
        }`}>
        <div className="w-full h-32 md:h-40 bg-gray-300 dark:bg-gray-700"></div>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
          <div className="flex gap-2 justify-center">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full mb-5 ${getCardBg()} rounded-2xl shadow-md transition duration-300 ease-in-out transform hover:shadow-lg hover:shadow-purple-900/30 hover:scale-[1.02] cursor-pointer overflow-hidden flex flex-col group border ${getBorderColor()} ${
        isMobile ? "max-w-full" : "max-w-s"
      }`}>
      <div className="relative w-full h-32 md:h-40 overflow-visible">
        <img
          src={banner || img}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />

        <button
          onClick={handleSaveTeam}
          disabled={isSaving}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
            isSaved
              ? "bg-blue-500/80 hover:bg-blue-600/80 text-white"
              : "bg-black/40 hover:bg-black/60 text-white/80 hover:text-white"
          } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
          title={isSaved ? "Unsave team" : "Save team"}>
          {isSaved ? (
            <FaBookmark className="text-lg" />
          ) : (
            <FaRegBookmark className="text-lg" />
          )}
        </button>

        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <div className="relative">
            <div
              className={`w-30 h-30 md:w-30 md:h-30 rounded-full border-2 border-indigo-500 ${getCardBg()}  p-1 shadow-lg`}>
              <img
                src={img}
                alt={name}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.target.src = "/default-team.png";
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center px-3 md:px-4 pb-3 md:pb-4 pt-8 md:pt-9">
        <h1
          className={`text-base md:text-lg font-bold mb-1 text-center truncate w-full ${getTextColor()}`}>
          {name}
        </h1>

        <p className={`text-xs mb-2 text-center ${getSecondaryTextColor()}`}>
          <span className={`font-semibold ${getTextColor()}`}>
            {userData && creatorname === userData.name
              ? t("teamCard.yourTeam")
              : t("teamCard.createdBy", { creator: creatorname })}
          </span>
        </p>

        <p
          className={`text-xs mb-2 leading-relaxed line-clamp-2 text-center w-full px-1 ${getTextColor()}`}>
          {shortdescription}
        </p>

        <div className="flex flex-wrap gap-1 justify-center mb-2 max-h-12 overflow-hidden">
          {(displayedSkills || []).map((item, index) => (
            <span
              key={index}
              className={`text-xs font-medium px-2 py-0.5 rounded-full shadow-sm truncate max-w-[120px] ${getSkillBg()}`}>
              {item.skill} | {item.NumSkill}
            </span>
          ))}
          {isSmallMobile && skill_seats && skill_seats.length > 2 && (
            <span
              className={`${getSkillBg()} text-xs font-medium px-2 py-0.5 rounded-full shadow-sm`}>
              +{skill_seats.length - 2}
            </span>
          )}
        </div>

        <div className="flex justify-center gap-2 mt-2 w-full">
          {checkIfTeamExists !== true ? (
            <>
              <button
                className="bg-gradient-to-r w-20 font-bold from-cyan-600 to-indigo-700 hover:from-cyan-700 hover:to-indigo-800 text-white  px-2 py-1 rounded-lg shadow transition duration-200 text-xs cursor-pointer flex-1 md:flex-none"
                onClick={goToTeamPage}>
                {t("teamCard.view")}
              </button>
            </>
          ) : (
            <div className="flex gap-2 w-full">
              <button
                className="bg-gradient-to-r  from-cyan-600 to-indigo-700 hover:from-cyan-700 hover:to-indigo-800 text-white font-semibold px-2 py-1 rounded-lg shadow transition duration-200 text-xs cursor-pointer flex-1"
                onClick={goToTeamPage}>
                {t("teamCard.view")}
              </button>
              <Link
                to={`/team/${id}/workspace/channel/general-chat`}
                className="flex-1">
                <button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-2 py-1 rounded-lg shadow transition duration-200 text-xs cursor-pointer">
                  {t("teamCard.workspace")}
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TeamCard;
