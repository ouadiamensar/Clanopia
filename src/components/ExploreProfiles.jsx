import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import ProfileCard from "./smallComp/ProfileCard";
import {
  FiSearch,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import RightSideBar from "./RightSideBar";
import { useLanguage } from "../context/LanguageContext";

const ExploreProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillsFilter, setSkillsFilter] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
  const getBgColor = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#1e1e1f]";
  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
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

  useEffect(() => {
    const getAllUsersWithProfiles = async () => {
      const users = [];
      const skillsSet = new Set();

      try {
        const usersSnapshot = await getDocs(collection(db, "users"));

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();

          const profileRef = doc(db, "users", userDoc.id, "profile", "data");
          const profileSnapshot = await getDoc(profileRef);

          if (profileSnapshot.exists()) {
            const profileData = profileSnapshot.data();

            users.push({
              id: userDoc.id,
              ...userData,
              profile: profileData,
            });

            if (profileData.skills && Array.isArray(profileData.skills)) {
              profileData.skills.forEach((skill) => skillsSet.add(skill));
            }
          }
        }

        setProfiles(users);
        setFilteredProfiles(users);
        setAvailableSkills(Array.from(skillsSet).sort());
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching users and profiles:", error);
        setIsLoading(false);
      }
    };

    getAllUsersWithProfiles();
  }, []);

  useEffect(() => {
    let results = profiles;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (profile) =>
          profile.profile?.name?.toLowerCase().includes(term) ||
          profile.profile?.about?.toLowerCase().includes(term) ||
          (profile.profile?.skills &&
            profile.profile.skills.some((skill) =>
              skill.toLowerCase().includes(term),
            )),
      );
    }

    if (skillsFilter.length > 0) {
      results = results.filter(
        (profile) =>
          profile.profile?.skills &&
          skillsFilter.every((filterSkill) =>
            profile.profile.skills.includes(filterSkill),
          ),
      );
    }

    setFilteredProfiles(results);
  }, [searchTerm, skillsFilter, profiles]);

  const toggleSkillFilter = (skill) => {
    if (skillsFilter.includes(skill)) {
      setSkillsFilter(skillsFilter.filter((s) => s !== skill));
    } else {
      setSkillsFilter([...skillsFilter, skill]);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSkillsFilter([]);
  };

  if (!themeMode || languageLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${getBgColor()}`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${getBgColor()} ${getTextColor()} md:grid md:grid-cols-15 ${
        isMobile && "pt-20"
      }`}>
      <Sidebar themeMode={themeMode} />
      <RightSideBar themeMode={themeMode} />
      <div className="md:col-start-3 md:col-end-15 p-4 md:p-6 ">
        <div className="mb-6 md:mb-8">
          <h1
            className={`text-2xl md:text-3xl font-bold ${getTextColor()} mb-1 md:mb-2`}>
            {t("exploreProfiles.title")}
          </h1>
          <p className={`text-sm md:text-base ${getSecondaryTextColor()}`}>
            {t("exploreProfiles.subtitle")}
          </p>
        </div>

        <div className={`${getCardBg()} rounded-xl p-3 md:p-4 mb-6 md:mb-8`}>
          <div className="flex flex-col gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch
                  className={`${getSecondaryTextColor()} text-sm md:text-base`}
                />
              </div>
              <input
                type="text"
                placeholder={t("exploreProfiles.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${getInputBg()} ${getTextColor()} pl-9 md:pl-10 pr-4 py-2 md:py-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base`}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`${getInputBg()} hover:scale-99 ${getTextColor()} px-3 md:px-4 py-2 md:py-3 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base flex-1 justify-center`}>
                <FiFilter size={isMobile ? 16 : 18} />
                {t("exploreProfiles.filters")}{" "}
                {skillsFilter.length > 0 && `(${skillsFilter.length})`}
                {showFilters ? (
                  <FiChevronUp size={16} />
                ) : (
                  <FiChevronDown size={16} />
                )}
              </button>

              {(searchTerm || skillsFilter.length > 0) && (
                <button
                  onClick={clearAllFilters}
                  className={`${getInputBg()} hover:scale-95 ${getTextColor()} px-3 md:px-4 py-2 md:py-3 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base`}>
                  <FiX size={isMobile ? 16 : 18} />
                  {isMobile
                    ? t("exploreProfiles.clearAll")
                    : t("exploreProfiles.clearFilters")}
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div
              className={`mt-3 md:mt-4 p-3 md:p-4 ${getInputBg()} rounded-lg`}>
              <h3
                className={`text-base md:text-lg font-semibold mb-2 md:mb-3 ${getTextColor()}`}>
                {t("exploreProfiles.filterBySkills")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkillFilter(skill)}
                    className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm transition-colors ${
                      skillsFilter.includes(skill)
                        ? "bg-indigo-600 text-white"
                        : `${getInputBg()} ${getSecondaryTextColor()} hover:bg-gray-600`
                    }`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 md:mb-6 flex justify-between items-center">
          <p className={`text-xs md:text-sm ${getSecondaryTextColor()}`}>
            {filteredProfiles.length}{" "}
            {filteredProfiles.length === 1
              ? t("exploreProfiles.profileFound")
              : t("exploreProfiles.profilesFound")}
            {(searchTerm || skillsFilter.length > 0) &&
              ` ${t("exploreProfiles.withCurrentFilters")}`}
          </p>

          {(searchTerm || skillsFilter.length > 0) && (
            <button
              onClick={clearAllFilters}
              className="text-indigo-400 hover:text-indigo-300 text-xs md:text-sm flex items-center gap-1">
              <FiX size={12} />
              {t("exploreProfiles.clearAll")}
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-48 md:h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
              <p className={`text-sm ${getSecondaryTextColor()}`}>
                {t("exploreProfiles.loadingProfiles")}
              </p>
            </div>
          </div>
        )}

        {!isLoading && filteredProfiles.length === 0 && (
          <div className="text-center py-8 md:py-12">
            <div
              className={`${getSecondaryTextColor()} mb-3 md:mb-4 text-sm md:text-base`}>
              {t("exploreProfiles.noProfilesFound")}
            </div>
            <button
              onClick={clearAllFilters}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-sm md:text-base">
              {t("exploreProfiles.clearFilters")}
            </button>
          </div>
        )}

        {!isLoading && filteredProfiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredProfiles.map((item) => (
              <ProfileCard
                key={item.id}
                name={item.profile?.name}
                image={item.profile?.ProfileImageURL}
                about={item.profile?.about}
                skills={item.profile?.skills}
                id={item.id}
                isMobile={isMobile}
                themeMode={themeMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreProfiles;
