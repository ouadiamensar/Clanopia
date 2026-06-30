/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useLanguage } from "../context/LanguageContext";
import {
  RiCommunityLine,
  RiUserLine,
  RiCalendarLine,
  RiArrowRightLine,
  RiAddLine,
  RiSearchLine,
  RiGridLine,
  RiListCheck,
  RiDeleteBinLine,
  RiSettings3Line,
} from "react-icons/ri";

const MyOwnCommunities = () => {
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const navigate = useNavigate();
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
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getHoverColor = () =>
    themeMode === "light" ? "hover:bg-gray-200" : "hover:bg-[#29292a]";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) navigate("/login");
    });
    return unsubscribe;
  }, [navigate]);

  const fetchMyOwnCommunities = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const myOwnCommunitiesRef = collection(
        db,
        "users",
        currentUser.uid,
        "myOwnCommunities",
      );

      console.log(
        "📌 Fetching my own communities from:",
        myOwnCommunitiesRef.path,
      );

      const snapshot = await getDocs(myOwnCommunitiesRef);

      if (snapshot.empty) {
        console.log("📭 No my own communities found");
        setCommunities([]);
        setFilteredCommunities([]);
        setIsLoading(false);
        return;
      }

      const communitiesData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("📌 Found my own community:", doc.id, data.communityName);

        communitiesData.push({
          id: doc.id,
          ...data,
          communityData: data.communityData || {},
          createdAt: data.createdAt || null,
        });
      });

      setCommunities(communitiesData);
      setFilteredCommunities(communitiesData);
      console.log("✅ Loaded", communitiesData.length, "my own communities");
    } catch (error) {
      console.error("❌ Error fetching my own communities:", error);
      console.error("❌ Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOwnCommunities();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const myOwnCommunitiesRef = collection(
      db,
      "users",
      currentUser.uid,
      "myOwnCommunities",
    );

    console.log(
      "👂 Listening to my own communities at:",
      myOwnCommunitiesRef.path,
    );

    const unsubscribe = onSnapshot(
      myOwnCommunitiesRef,
      (snapshot) => {
        console.log("🔄 Real-time update received for my own communities");

        if (snapshot.empty) {
          setCommunities([]);
          setFilteredCommunities([]);
          return;
        }

        const communitiesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          communitiesData.push({
            id: doc.id,
            ...data,
            communityData: data.communityData || {},
            createdAt: data.createdAt || null,
          });
        });

        setCommunities(communitiesData);
        setFilteredCommunities(communitiesData);
        console.log(
          "✅ Updated with",
          communitiesData.length,
          "my own communities",
        );
      },
      (error) => {
        console.error("❌ Error in real-time listener:", error);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    let result = [...communities];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (community) =>
          community.communityName?.toLowerCase().includes(query) ||
          community.communityData?.description?.toLowerCase().includes(query) ||
          community.category?.toLowerCase().includes(query) ||
          community.shortDescription?.toLowerCase().includes(query),
      );
    }

    setFilteredCommunities(result);
  }, [searchQuery, communities]);

  const navigateToCommunity = (communityId, category, communityName) => {
    navigate(`/community/${category}/${communityId}/${communityName}`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years}y ago`;
    if (months > 0) return `${months}mo ago`;
    if (days > 0) return `${days}d ago`;
    return "Today";
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  const getCategoryIcon = (category) => {
    const icons = {
      tech: "💻",
      design: "🎨",
      business: "💼",
      gaming: "🎮",
      art: "🖼️",
      science: "🔬",
      music: "🎵",
      sports: "⚽",
      food: "🍕",
      travel: "✈️",
    };
    return icons[category] || "🏠";
  };

  const getCategoryColor = (category) => {
    const colors = {
      tech: "bg-blue-500",
      design: "bg-purple-500",
      business: "bg-green-500",
      gaming: "bg-red-500",
      art: "bg-pink-500",
      science: "bg-indigo-500",
      music: "bg-yellow-500",
      sports: "bg-orange-500",
      food: "bg-rose-500",
      travel: "bg-teal-500",
    };
    return colors[category] || "bg-gray-500";
  };

  if (languageLoading || isLoading) {
    return (
      <div
        className={`min-h-screen ${getBgColor()} flex items-center justify-center`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <div className={getTextColor()}>{t("myOwnCommunities.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${getBgColor()} ${getTextColor()} transition-colors duration-300`}>
      <div className="flex pt-12 lg:pt-0">
        <div className="flex-1 flex flex-col lg:flex-row pt-10 justify-center">
          <div className="flex-1 max-w-7xl w-full px-2 lg:px-5 py-2 lg:py-6">
            <div className="mb-8">
              <h1
                className={`text-3xl lg:text-4xl font-bold ${getTextColor()} mb-2`}>
                <RiCommunityLine className="inline mr-3 text-purple-500" />
                {t("myOwnCommunities.title")}
              </h1>
              <p className={getSecondaryTextColor()}>
                {t("myOwnCommunities.subtitle", { count: communities.length })}
              </p>
            </div>

            <div
              className={`${getCardBg()} rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4 border ${getBorderColor()} shadow-md`}>
              <div className="flex-1 min-w-[200px] relative">
                <input
                  type="text"
                  placeholder={t("myOwnCommunities.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 ${getInputBg()} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${getTextColor()} transition-colors duration-300`}
                />
                <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors duration-300 ${
                    viewMode === "grid"
                      ? `${getInputBg()} text-purple-500`
                      : getHoverColor()
                  }`}>
                  <RiGridLine size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors duration-300 ${
                    viewMode === "list"
                      ? `${getInputBg()} text-purple-500`
                      : getHoverColor()
                  }`}>
                  <RiListCheck size={20} />
                </button>
              </div>
            </div>

            {filteredCommunities.length === 0 ? (
              <div
                className={`${getCardBg()} rounded-2xl p-12 text-center shadow-lg border ${getBorderColor()}`}>
                <div className="text-6xl mb-4">🚀</div>
                <h3 className={`text-2xl font-bold ${getTextColor()} mb-2`}>
                  {searchQuery
                    ? t("myOwnCommunities.noCommunitiesFound")
                    : t("myOwnCommunities.noCommunitiesCreated")}
                </h3>
                <p className={`${getSecondaryTextColor()} mb-6`}>
                  {searchQuery
                    ? t("myOwnCommunities.adjustSearch")
                    : t("myOwnCommunities.createFirst")}
                </p>
                <button
                  onClick={() => navigate("/Communities/create-community")}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105">
                  <RiAddLine className="inline mr-2" />
                  {t("myOwnCommunities.createCommunity")}
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "flex flex-col gap-4"
                }>
                {filteredCommunities.map((community) => (
                  <div
                    key={community.id}
                    className={`${getCardBg()} rounded-2xl overflow-hidden shadow-lg border ${getBorderColor()} transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer group`}>
                    <div className="relative h-32">
                      <img
                        src={
                          community.communityData?.bannerURL ||
                          community.bannerURL ||
                          "/default-banner.jpg"
                        }
                        alt={community.communityName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-2 left-4 flex items-center gap-3">
                        <img
                          src={
                            community.communityData?.logoURL ||
                            community.logoURL ||
                            "/default-avatar.png"
                          }
                          alt={community.communityName}
                          className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-lg"
                        />
                        <div>
                          <h3 className="text-white font-bold text-lg">
                            r/{community.communityName}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(community.category)} text-white`}>
                            {getCategoryIcon(community.category)}{" "}
                            {community.category}
                          </span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-purple-600/90 text-white text-xs px-2 py-1 rounded-full">
                        👑 {t("myOwnCommunities.youCreated")}
                      </div>
                    </div>

                    <div className="p-4">
                      <p
                        className={`text-sm ${getSecondaryTextColor()} line-clamp-2 mb-3`}>
                        {community.communityData?.description ||
                          community.shortDescription ||
                          t("myOwnCommunities.noDescription")}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <RiUserLine className={getSecondaryTextColor()} />
                            <span className={getSecondaryTextColor()}>
                              {formatNumber(
                                community.communityData?.membersCount ||
                                  community.Members?.length ||
                                  0,
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <RiCalendarLine
                              className={getSecondaryTextColor()}
                            />
                            <span className={getSecondaryTextColor()}>
                              {formatDate(community.createdAt)}
                            </span>
                          </div>
                        </div>
                        {currentUser &&
                          community.createdBy === currentUser.uid && (
                            <Link
                              to={`/communitySettings/${community.category}/${community.id}`}
                              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-300 hover:scale-110"
                              title={t("myOwnCommunities.settings")}>
                              <RiSettings3Line className="w-5 h-5" />
                            </Link>
                          )}
                      </div>

                      <button
                        className="mt-3 w-full py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToCommunity(
                            community.id,
                            community.category,
                            community.communityName,
                          );
                        }}>
                        {t("myOwnCommunities.manageCommunity")}
                        <RiArrowRightLine />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOwnCommunities;
