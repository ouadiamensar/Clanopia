import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase.js";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  Compass,
  TrendingUp,
  Sparkles,
  Layers,
  Grid3x3,
  List,
  Zap,
  Star,
  Clock,
  Flame,
  Award,
  ChevronUp,
  Code,
  Gamepad,
  Palette,
  Music,
  Film,
  Book,
  GraduationCap,
  Microscope,
  Briefcase,
  Plane,
  Trophy,
} from "lucide-react";
import CommunityCard from "./smallComp/CommunityCard.jsx";
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

const categoryIcons = {
  All: <Compass className="w-4 h-4" />,
  Technology: <Zap className="w-4 h-4" />,
  Programming: <Code className="w-4 h-4" />,
  Gaming: <Gamepad className="w-4 h-4" />,
  "Art & Design": <Palette className="w-4 h-4" />,
  Music: <Music className="w-4 h-4" />,
  "Movies & TV": <Film className="w-4 h-4" />,
  "Books & Literature": <Book className="w-4 h-4" />,
  Education: <GraduationCap className="w-4 h-4" />,
  Science: <Microscope className="w-4 h-4" />,
  Business: <Briefcase className="w-4 h-4" />,
  Travel: <Plane className="w-4 h-4" />,
  Sports: <Trophy className="w-4 h-4" />,
};

const ExploreCommunity = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCateg, setSelectedCateg] = useState("All");
  const [communities, setCommunities] = useState([]);
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
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("popular");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollRef = useRef();
  const mainScrollRef = useRef();

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

  const getTranslatedCategory = (category) => {
    return t(`categories.${category.replace(/\s+/g, '_')}`);
  };

  const getCardBg = () =>
    themeMode === "light"
      ? "bg-white/80 backdrop-blur-sm"
      : "bg-[#222223]/80 backdrop-blur-sm";
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200/50" : "border-[#2c2d2e]/50";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-100/80" : "bg-[#252527]/80";
  const getHoverColor = () =>
    themeMode === "light" ? "hover:bg-gray-200/80" : "hover:bg-[#29292a]/80";
  const getGradientBg = () =>
    themeMode === "light"
      ? "bg-gradient-to-r from-cyan-500 to-indigo-600"
      : "bg-gradient-to-r from-cyan-600 to-indigo-700";
  const getGlassBg = () =>
    themeMode === "light"
      ? "bg-white/30 backdrop-blur-xl"
      : "bg-[#1e1e1f]/30 backdrop-blur-xl";
      
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);

    const handleScroll = () => {
      if (mainScrollRef.current) {
        setShowScrollTop(mainScrollRef.current.scrollTop > 400);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchCommunities = async () => {
      setIsLoading(true);
      try {
        let data = [];
        if (selectedCateg === "All") {
          const allData = await Promise.all(
            categories
              .filter((cat) => cat !== "All")
              .map(async (cat) => {
                try {
                  const catRef = collection(db, "communities", cat, "items");
                  const snapshot = await getDocs(catRef);
                  return snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    category: cat,
                  }));
                } catch (error) {
                  console.error(`Failed to load ${cat}:`, error);
                  return [];
                }
              }),
          );
          data = allData.flat();
        } else {
          const ref = collection(db, "communities", selectedCateg, "items");
          const snapshot = await getDocs(ref);
          data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            category: selectedCateg,
          }));
        }

        const sortedData = sortCommunities(data, sortBy);
        setCommunities(sortedData);
      } catch (error) {
        console.error("Error fetching communities:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCommunities();
  }, [selectedCateg, sortBy]);

  const sortCommunities = (data, sortType) => {
    const sorted = [...data];
    switch (sortType) {
      case "popular":
        return sorted.sort(
          (a, b) => (b.members?.length || 0) - (a.members?.length || 0),
        );
      case "newest":
        return sorted.sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0),
        );
      case "trending":
        return sorted.sort((a, b) => {
          const aScore = (a.members?.length || 0) * 2 + (a.postsCount || 0);
          const bScore = (b.members?.length || 0) * 2 + (b.postsCount || 0);
          return bScore - aScore;
        });
      case "alphabetical":
        return sorted.sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );
      default:
        return sorted;
    }
  };

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredCommunities = communities.filter(
    (community) =>
      community.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.shortDescription
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  if (!themeMode || languageLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center `}>
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500/30 border-t-cyan-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className={`mt-4 ${getTextColor()} font-medium`}>
            {t("explore.loading")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mainScrollRef}
      className={`w-full min-h-screen p-2 md:p-6 transition-all duration-500 ${getTextColor()}`}
      dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-8xl mx-auto relative z-10">
        <div className="relative mb-8">
          <div
            className={`${getGlassBg()} rounded-3xl p-6 md:p-8 border ${getBorderColor()} shadow-xl`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-2xl ${getGradientBg()} shadow-lg shadow-cyan-500/30`}>
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1
                    className={`text-2xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent`}>
                    {t("explore.title")}
                  </h1>
                  <p
                    className={`${getSecondaryTextColor()} mt-1 text-sm md:text-base flex items-center gap-2`}>
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    {t("explore.subtitle")}
                    <span className="hidden md:inline">•</span>
                  </p>
                </div>
              </div>

              <div className="flex w-full md:w-auto gap-2">
                <div className="relative flex-1 md:w-80">
                  <div
                    className={`absolute inset-y-0 ${language === "ar" ? "right-0 pr-3" : "left-0 pl-3"} flex items-center pointer-events-none`}>
                    <Search className={`h-4 w-4 ${getSecondaryTextColor()}`} />
                  </div>
                  <input
                    type="text"
                    className={`block w-full ${language === "ar" ? "pr-10 pl-4" : "pl-10 pr-4"} py-3 border-2 ${getBorderColor()} rounded-xl ${getInputBg()} focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${getTextColor()} placeholder-gray-500 transition-all duration-300 text-sm backdrop-blur-sm`}
                    placeholder={t("explore.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className={`absolute inset-y-0 ${language === "ar" ? "left-0 pl-3" : "right-0 pr-3"} flex items-center`}>
                      <X
                        className={`h-4 w-4 ${getSecondaryTextColor()} hover:text-red-500 transition-colors`}
                      />
                    </button>
                  )}
                </div>

                <div
                  className={`hidden md:flex items-center gap-1 ${getCardBg()} rounded-xl border ${getBorderColor()} p-1`}>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "grid" ? `${getGradientBg()} text-white shadow-lg` : getHoverColor()}`}>
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "list" ? `${getGradientBg()} text-white shadow-lg` : getHoverColor()}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`md:hidden p-3 rounded-xl ${getCardBg()} border ${getBorderColor()} ${getHoverColor()} transition-all duration-300`}>
                  {isFilterOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Filter className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700/30">
              <span className={`text-sm ${getSecondaryTextColor()}`}>
                Sort by:
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl ${getCardBg()} border ${getBorderColor()} ${getHoverColor()} transition-all duration-300 text-sm`}>
                  {sortBy === "popular" && (
                    <Flame className="w-4 h-4 text-orange-400" />
                  )}
                  {sortBy === "newest" && (
                    <Clock className="w-4 h-4 text-blue-400" />
                  )}
                  {sortBy === "trending" && (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  )}
                  {sortBy === "alphabetical" && (
                    <Layers className="w-4 h-4 text-purple-400" />
                  )}
                  <span className="capitalize">{sortBy}</span>
                </button>

                {showSortDropdown && (
                  <div
                    className={`absolute ${language === "ar" ? "left-0" : "right-0"} mt-2 w-48 ${getCardBg()} rounded-xl border ${getBorderColor()} shadow-2xl overflow-hidden z-50 backdrop-blur-sm`}>
                    {["popular", "newest", "trending", "alphabetical"].map(
                      (option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSortBy(option);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 ${getHoverColor()} transition-colors duration-200 flex items-center gap-2 text-sm ${sortBy === option ? `bg-cyan-500/10 text-cyan-400` : ""}`}>
                          {option === "popular" && (
                            <Flame className="w-4 h-4" />
                          )}
                          {option === "newest" && <Clock className="w-4 h-4" />}
                          {option === "trending" && (
                            <TrendingUp className="w-4 h-4" />
                          )}
                          {option === "alphabetical" && (
                            <Layers className="w-4 h-4" />
                          )}
                          <span className="capitalize">{option}</span>
                          {sortBy === option && (
                            <Star className="w-4 h-4 ml-auto text-cyan-400" />
                          )}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className=" mb-6 group">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-1 h-6 ${getGradientBg()} rounded-full`}></div>
            <label className={`text-sm font-medium ${getSecondaryTextColor()}`}>
              {t("explore.categories")}
            </label>
          </div>

          <div className="flex gap-2 items-center">
            <button
              onClick={() => scroll("left")}
              className={`flex items-center justify-center w-10 h-10 rounded-xl ${getCardBg()} border ${getBorderColor()} shadow-lg ${getHoverColor()} transition-all duration-300 hover:scale-95`}>
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-2 flex-1">
              {categories.map((cat, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCateg(cat)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300 transform hover:scale-95 text-sm font-medium ${
                    selectedCateg === cat
                      ? `${getGradientBg()} text-white shadow-lg shadow-cyan-500/30 scale-[1.05]`
                      : `${getCardBg()} ${getSecondaryTextColor()} ${getHoverColor()} border ${getBorderColor()} shadow-md`
                  }`}>
                  {categoryIcons[cat] || <Layers className="w-4 h-4" />}
                  {getTranslatedCategory(cat)}
                  {selectedCateg === cat && (
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => scroll("right")}
              className={`flex items-center justify-center w-10 h-10 rounded-xl ${getCardBg()} border ${getBorderColor()} shadow-lg ${getHoverColor()} transition-all duration-300 hover:scale-95`}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isFilterOpen && (
          <div
            className={`md:hidden mb-4 ${getCardBg()} rounded-2xl border ${getBorderColor()} shadow-xl p-4 backdrop-blur-sm animate-slide-down`}>
            <h3
              className={`text-sm font-medium ${getTextColor()} mb-3 flex items-center gap-2`}>
              <Filter className="w-4 h-4" />
              {t("explore.categories")}
            </h3>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto thin-scrollbar">
              {categories.map((cat, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedCateg(cat);
                    setIsFilterOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    selectedCateg === cat
                      ? `${getGradientBg()} text-white shadow-lg`
                      : `${getCardBg()} ${getSecondaryTextColor()} ${getHoverColor()} border ${getBorderColor()}`
                  }`}>
                  {categoryIcons[cat] || <Layers className="w-4 h-4" />}
                  {getTranslatedCategory(cat)}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500/30 border-t-cyan-500"></div>
            </div>
          </div>
        )}

        {!isLoading && (
          <div
            className={`grid gap-4 md:gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}>
            {filteredCommunities.length > 0 ? (
              filteredCommunities.map((community, index) => (
                <div
                  key={community.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}>
                  <CommunityCard
                    id={community.id}
                    category={community.category || selectedCateg}
                    logo={community.logoURL}
                    name={community.name}
                    MembersNum={community.members?.length || 0}
                    shortDescription={community.shortDescription}
                    themeMode={themeMode}
                    language={language}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="flex flex-col items-center">
                  <div
                    className={`p-6 rounded-full ${getCardBg()} border ${getBorderColor()} mb-4`}>
                    <Search
                      className={`w-12 h-12 ${getSecondaryTextColor()}`}
                    />
                  </div>
                  <h3
                    className={`text-xl font-semibold ${getTextColor()} mb-2`}>
                    {searchQuery
                      ? t("explore.noSearchResults")
                      : t("explore.noCommunities")}
                  </h3>

                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCateg("All");
                    }}
                    className={`px-6 py-3 ${getGradientBg()} text-white rounded-xl font-medium shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300`}>
                    {t("explore.showAll")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:scale-110 transition-all duration-300 z-50 animate-bounce-slow">
            <ChevronUp className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ExploreCommunity;