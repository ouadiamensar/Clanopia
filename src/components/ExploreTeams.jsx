import React, { useRef, useState, useEffect } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { ChevronLeft, ChevronRight, Search, X, Menu } from "lucide-react";
import TeamCard from "./smallComp/TeamCard";
import Sidebar from "./Sidebar";
import RightSideBar from "./RightSideBar";
import { useLanguage } from "../context/LanguageContext";

const categories = [
  "All",
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

const workStyles = [
  "all",
  "profit",
  "nonProfit",
  "hobby",
  "startup",
  "paid",
  "volunteer",
];

const ExploreTeams = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCateg, setSelectedCateg] = useState("All");
  const [selectedWorkStyle, setSelectedWorkStyle] = useState("All");
  const [selectedTimeZone, setSelectedTimeZone] = useState("All");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [teams, setTeams] = useState([]);
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
  const scrollRef = useRef();

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

  const getTranslatedCategory = (category) => {
    return t(`categories.${category.replace(/\s+/g, "_")}`);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = isMobile ? 300 : 500;
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "teams"));
        const teamsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const allSkills = new Set();
        teamsArray.forEach((team) => {
          if (team.skills) {
            team.skills.forEach((skillObj) => {
              if (skillObj.skill) {
                allSkills.add(skillObj.skill);
              }
            });
          }
        });
        setAvailableSkills(Array.from(allSkills).sort());

        setTeams(teamsArray);
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  async function checkIfTeamExists(teamId, arrayField = "teams") {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.warn("User document not found");
        return false;
      }

      const userData = userSnap.data();
      const teamsArray = userData[arrayField] || [];

      return teamsArray.includes(teamId);
    } catch (error) {
      console.error("Error checking team existence: ", error);
      return false;
    }
  }

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
    setSkillSearch("");
  };

  const removeSkill = (skill) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const filteredSkills = availableSkills.filter(
    (skill) =>
      skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !selectedSkills.includes(skill),
  );

  const filteredTeams = teams.filter((team) => {
    if (selectedCateg !== "All" && team.category !== selectedCateg)
      return false;

    if (selectedWorkStyle !== "All" && team.workStyle !== selectedWorkStyle)
      return false;

    if (selectedTimeZone !== "All" && team.timezone !== selectedTimeZone)
      return false;

    if (selectedSkills.length > 0) {
      const teamSkills = team.skills?.map((s) => s.skill) || [];
      const hasAllSelectedSkills = selectedSkills.every((skill) =>
        teamSkills.includes(skill),
      );
      if (!hasAllSelectedSkills) return false;
    }

    const matchesSearch =
      team.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.shortDescription
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      team.fullDescription?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const [teamChecks, setTeamChecks] = useState({});

  useEffect(() => {
    const fetchChecks = async () => {
      const results = {};
      for (const team of teams) {
        results[team.id] = await checkIfTeamExists(team.id);
      }
      setTeamChecks(results);
    };

    fetchChecks();
  }, [teams]);
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

  return (
    <div
      className={`min-h-screen ${getBgColor()}  md:grid md:grid-cols-15 ${getTextColor()} relative`}>
      {isMobile && (
        <div
          className={`fixed top-0 left-0 right-0 z-40 ${getCardBg()} p-3 flex justify-between items-center shadow-md`}>
          <h1 className={`font-bold text-lg ${getTextColor()}`}>
            {t("exploreTeams.title")}
          </h1>
        </div>
      )}

      <div className="flex min-h-screen">
        <Sidebar themeMode={themeMode} />

        <div
          className={`
          flex-1 transition-all duration-300 p-4 max-w-screen 
          ${isMobile ? "mt-16" : "pl-70 pr-30 "} 
        `}>
          <div className="md:col-start-3 md:col-end-15 mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="w-full md:w-auto">
                <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-600">
                  {t("exploreTeams.title")}
                </h1>
                <p
                  className={`${getSecondaryTextColor()} mt-1 text-sm md:text-base`}>
                  {t("exploreTeams.subtitle")}
                </p>
              </div>

              <div className="relative w-full md:w-80 lg:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search
                    className={`h-4 w-4 md:h-5 md:w-5 ${getSecondaryTextColor()}`}
                  />
                </div>
                <input
                  type="text"
                  className={`block w-full pl-10 pr-4 py-2 md:py-2.5 border-0 rounded-xl ${getInputBg()} shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getTextColor()} placeholder-gray-500 transition-all text-sm md:text-base`}
                  placeholder={t("exploreTeams.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="relative mb-4 group">
              <label
                className={`block text-sm font-medium ${getSecondaryTextColor()} mb-1`}>
                {t("exploreTeams.category")}
              </label>
              <div className="flex space-x-2 md:space-x-3 items-center">
                <button
                  onClick={() => scroll("left")}
                  className={`flex items-center cursor-pointer justify-center w-8 h-8 md:w-10 md:h-10 rounded-full ${getCardBg()} shadow-lg text-indigo-400 hover:bg-gray-700 transition-colors`}>
                  <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </button>

                <div
                  ref={scrollRef}
                  className="flex space-x-2 md:space-x-3 overflow-x-auto scrollbar-hide px-1 py-2 md:py-3">
                  {categories.map((cat, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedCateg(cat)}
                      className={`px-3 py-1.5 md:px-5 md:py-2 rounded-full whitespace-nowrap transition-all cursor-pointer duration-300 transform hover:scale-95 text-xs md:text-sm ${
                        selectedCateg === cat
                          ? "bg-gradient-to-r from-cyan-600 to-indigo-800 text-white shadow-lg"
                          : `${getCardBg()} ${getSecondaryTextColor()} hover:scale-103 shadow-md`
                      }`}>
                      {getTranslatedCategory(cat)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => scroll("right")}
                  className={`flex items-center cursor-pointer justify-center w-8 h-8 md:w-10 md:h-10 rounded-full ${getCardBg()} shadow-lg text-indigo-400 hover:bg-gray-700 transition-colors`}>
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label
                  className={`block text-sm font-medium ${getSecondaryTextColor()} mb-1`}>
                  {t("exploreTeams.workStyle")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {workStyles.map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedWorkStyle(style)}
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm transition-all ${
                        selectedWorkStyle === style
                          ? "bg-gradient-to-r from-cyan-500 to-indigo-700 text-white shadow-md"
                          : `${getCardBg()} ${getSecondaryTextColor()} hover:scale-103 shadow-sm`
                      }`}>
                      {t(`exploreTeams.${style.replace("-", "")}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${getSecondaryTextColor()} mb-1`}>
                  {t("exploreTeams.timeZone")}
                </label>
                <select
                  value={selectedTimeZone}
                  onChange={(e) => setSelectedTimeZone(e.target.value)}
                  defaultValue=""
                  className={`w-full px-3 py-2 md:px-4 md:py-2 rounded-xl ${getCardBg()} shadow-sm ${getSecondaryTextColor()} focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm md:text-base`}>
                  <option value="" disabled className={getCardBg()}>
                    {t("exploreTeams.selectTimeZone")}
                  </option>
                  <option value="All" className={getCardBg()}>
                    {t("exploreTeams.all")}
                  </option>
                  <option value="" disabled className="text-gray-500">
                    {t("createTeam.selectTimeZone")}
                  </option>
                  <option value="UTC-12:00">UTC -12:00 (Baker Island)</option>
                  <option value="UTC-11:00">UTC -11:00 (American Samoa)</option>
                  <option value="UTC-10:00">UTC -10:00 (Hawaii)</option>
                  <option value="UTC-09:00">UTC -09:00 (Alaska)</option>
                  <option value="UTC-08:00">
                    UTC -08:00 (Pacific Time - US & Canada)
                  </option>
                  <option value="UTC-07:00">
                    UTC -07:00 (Mountain Time - US & Canada)
                  </option>
                  <option value="UTC-06:00">
                    UTC -06:00 (Central Time - US & Canada)
                  </option>
                  <option value="UTC-05:00">
                    UTC -05:00 (Eastern Time - US & Canada)
                  </option>
                  <option value="UTC-04:00">
                    UTC -04:00 (Atlantic Time - Canada, Caribbean)
                  </option>
                  <option value="UTC-03:00">
                    UTC -03:00 (Argentina, Brazil, Uruguay)
                  </option>
                  <option value="UTC-02:00">UTC -02:00 (South Georgia)</option>
                  <option value="UTC-01:00">
                    UTC -01:00 (Azores, Cape Verde)
                  </option>
                  <option value="UTC+00:00">
                    UTC +00:00 (Greenwich Mean Time - UK)
                  </option>
                  <option value="UTC+01:00">
                    UTC +01:00 (Morocco, Central Europe)
                  </option>
                  <option value="UTC+02:00">
                    UTC +02:00 (Egypt, South Africa)
                  </option>
                  <option value="UTC+03:00">
                    UTC +03:00 (Saudi Arabia, East Africa)
                  </option>
                  <option value="UTC+03:30">UTC +03:30 (Iran)</option>
                  <option value="UTC+04:00">
                    UTC +04:00 (UAE, Azerbaijan)
                  </option>
                  <option value="UTC+04:30">UTC +04:30 (Afghanistan)</option>
                  <option value="UTC+05:00">
                    UTC +05:00 (Pakistan, Uzbekistan)
                  </option>
                  <option value="UTC+05:30">
                    UTC +05:30 (India, Sri Lanka)
                  </option>
                  <option value="UTC+05:45">UTC +05:45 (Nepal)</option>
                  <option value="UTC+06:00">
                    UTC +06:00 (Bangladesh, Bhutan)
                  </option>
                  <option value="UTC+06:30">UTC +06:30 (Myanmar)</option>
                  <option value="UTC+07:00">
                    UTC +07:00 (Thailand, Vietnam)
                  </option>
                  <option value="UTC+08:00">
                    UTC +08:00 (China, Singapore, Malaysia)
                  </option>
                  <option value="UTC+09:00">UTC +09:00 (Japan, Korea)</option>
                  <option value="UTC+09:30">
                    UTC +09:30 (Central Australia)
                  </option>
                  <option value="UTC+10:00">
                    UTC +10:00 (Eastern Australia, Papua New Guinea)
                  </option>
                  <option value="UTC+11:00">
                    UTC +11:00 (Solomon Islands, New Caledonia)
                  </option>
                  <option value="UTC+12:00">
                    UTC +12:00 (New Zealand, Fiji)
                  </option>
                  <option value="UTC+13:00">UTC +13:00 (Tonga, Samoa)</option>
                  <option value="UTC+14:00">UTC +14:00 (Line Islands)</option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${getSecondaryTextColor()} mb-1`}>
                  {t("exploreTeams.skills")}
                </label>
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      placeholder={t("exploreTeams.searchAndAddSkills")}
                      className={`w-full pl-3 pr-10 py-2 rounded-xl ${getCardBg()} shadow-sm ${getSecondaryTextColor()} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base`}
                    />
                    <Search
                      className={`absolute right-3 top-2.5 h-4 w-4 ${getSecondaryTextColor()}`}
                    />
                  </div>

                  {skillSearch && filteredSkills.length > 0 && (
                    <div
                      className={`absolute z-10 mt-1 w-full ${getCardBg()} rounded-lg shadow-lg max-h-60 overflow-auto border ${getBorderColor()}`}>
                      {filteredSkills.map((skill) => (
                        <div
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-2 hover:bg-gray-700 cursor-pointer ${getSecondaryTextColor()} text-sm`}>
                          {skill}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSkills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white px-2 py-1 rounded-full text-xs md:text-sm animate-fade-in">
                      {skill.length > 12
                        ? `${skill.substring(0, 10)}...`
                        : skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-1 text-white hover:text-purple-300">
                        <X className="h-3 w-3 md:h-4 md:w-4 hover:scale-115 cursor-pointer" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-12 md:py-20">
                <div className="flex flex-col items-center">
                  <div className="flex space-x-2 mb-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <p className={`${getSecondaryTextColor()} text-sm`}>
                    {t("exploreTeams.loading")}
                  </p>
                </div>
              </div>
            )}

            {!isLoading && (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 `}>
                {filteredTeams.length > 0 ? (
                  filteredTeams.map((team) => (
                    <TeamCard
                      key={team.id}
                      img={team.imageURL}
                      name={team.name}
                      banner={team.bannerURL}
                      shortdescription={team.shortDescription}
                      skill_seats={team.skills}
                      language={team.language}
                      creatorname={team.creatorname}
                      checkIfTeamExists={teamChecks[team.id]}
                      id={team.id}
                      workStyle={team.workStyle}
                      timezone={team.timezone}
                      themeMode={themeMode}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 md:py-12">
                    <div
                      className={`${getSecondaryTextColor()} text-base md:text-lg mb-4`}>
                      {searchQuery ||
                      selectedCateg !== "All" ||
                      selectedWorkStyle !== "All" ||
                      selectedTimeZone !== "All" ||
                      selectedSkills.length > 0
                        ? t("exploreTeams.noTeamsMatch")
                        : t("exploreTeams.noTeamsAvailable")}
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCateg("All");
                        setSelectedWorkStyle("All");
                        setSelectedTimeZone("All");
                        setSelectedSkills([]);
                      }}
                      className="px-5 py-2 md:px-6 md:py-2 bg-gradient-to-r from-indigo-600 to-cyan-800 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 text-sm md:text-base">
                      {t("exploreTeams.resetAllFilters")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <RightSideBar themeMode={themeMode} />
      </div>
    </div>
  );
};

export default ExploreTeams;
