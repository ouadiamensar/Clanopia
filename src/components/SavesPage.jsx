/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Sidebar from "./Sidebar";
import LoadingSpinner from "./loadingSpinner";
import RightSideBar from "./rightSideBar";
import CommunityPostCard from "./smallComp/CommunityPostCard";
import PostCard from "./smallComp/PostCard";
import TeamCard from "./smallComp/TeamCard";
import {
  RiBookmarkLine,
  RiTeamLine,
  RiArticleLine,
  RiSearchLine,
  RiGridLine,
  RiListCheck,
  RiUserLine,
} from "react-icons/ri";
import { useLanguage } from "../context/LanguageContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SavedPage = () => {
  const [userData, setUserData] = useState(null);
  const [savedTeams, setSavedTeams] = useState([]);
  const [savedNormalPosts, setSavedNormalPosts] = useState([]);
  const [savedCommunityPosts, setSavedCommunityPosts] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [activeTab, setActiveTab] = useState("all");
  const [postType, setPostType] = useState("all");

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
    themeMode === "light" ? "bg-gray-50" : "bg-[#1e1e1f]";
  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-white";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getHoverColor = () =>
    themeMode === "light" ? "hover:bg-gray-100" : "hover:bg-[#29292a]";
  const getGradientBg = () =>
    themeMode === "light"
      ? "bg-gradient-to-r from-blue-500 to-cyan-600"
      : "bg-gradient-to-r from-blue-600 to-cyan-700";
  const getTabActive = () =>
    themeMode === "light" ? "bg-blue-500 text-white" : "bg-blue-600 text-white";

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchSavedData = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const userId = auth.currentUser.uid;

      try {
        const teamsRef = collection(
          db,
          "users",
          userId,
          "saves",
          "Teams",
          "data",
        );
        const teamsSnapshot = await getDocs(teamsRef);
        const teamsData = teamsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          category: "team",
          savedAt: doc.data().savedAt || new Date(),
        }));
        setSavedTeams(teamsData);

        const normalPostsRef = collection(
          db,
          "users",
          userId,
          "saves",
          "NormalPosts",
          "data",
        );
        const normalPostsSnapshot = await getDocs(normalPostsRef);
        const normalPostsData = normalPostsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          category: "normal",
          savedAt: doc.data().savedAt || new Date(),
        }));
        setSavedNormalPosts(normalPostsData);

        const communityPostsRef = collection(
          db,
          "users",
          userId,
          "saves",
          "CommunitiesPosts",
          "data",
        );
        const communityPostsSnapshot = await getDocs(communityPostsRef);
        const communityPostsData = communityPostsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          category: "community",
          savedAt: doc.data().savedAt || new Date(),
        }));
        setSavedCommunityPosts(communityPostsData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching saved data:", error);
        setLoading(false);
      }
    };

    fetchSavedData();
  }, [auth.currentUser]);

  const getAllSavedItems = () => {
    const allItems = [
      ...savedTeams.map((item) => ({ ...item, type: "team" })),
      ...savedNormalPosts.map((item) => ({ ...item, type: "normal" })),
      ...savedCommunityPosts.map((item) => ({ ...item, type: "community" })),
    ];

    return allItems.sort((a, b) => {
      const dateA = a.savedAt?.toDate
        ? a.savedAt.toDate()
        : new Date(a.savedAt);
      const dateB = b.savedAt?.toDate
        ? b.savedAt.toDate()
        : new Date(b.savedAt);
      return dateB - dateA;
    });
  };

  const getFilteredItems = () => {
    let items = [];

    if (activeTab === "all") {
      items = getAllSavedItems();
    } else if (activeTab === "teams") {
      items = savedTeams.map((item) => ({ ...item, type: "team" }));
    } else if (activeTab === "posts") {
      if (postType === "all") {
        items = [
          ...savedNormalPosts.map((item) => ({ ...item, type: "normal" })),
          ...savedCommunityPosts.map((item) => ({
            ...item,
            type: "community",
          })),
        ];
      } else if (postType === "normal") {
        items = savedNormalPosts.map((item) => ({ ...item, type: "normal" }));
      } else if (postType === "community") {
        items = savedCommunityPosts.map((item) => ({
          ...item,
          type: "community",
        }));
      }
      items = items.sort((a, b) => {
        const dateA = a.savedAt?.toDate
          ? a.savedAt.toDate()
          : new Date(a.savedAt);
        const dateB = b.savedAt?.toDate
          ? b.savedAt.toDate()
          : new Date(b.savedAt);
        return dateB - dateA;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter((item) => {
        const searchableText = [
          item.name,
          item.creatorName,
          item.creatorname,
          item.projectName,
          item.title,
          item.content,
          item.shortdescription,
          item.shortDescription,
          ...(item.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchableText.includes(query);
      });
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  const handlePostDeleted = (postId) => {
    setSavedNormalPosts((prev) => prev.filter((post) => post.id !== postId));
    setSavedCommunityPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const handleTeamDeleted = (teamId) => {
    setSavedTeams((prev) => prev.filter((team) => team.id !== teamId));
  };

  const renderTeamCard = (team) => {
    return (
      <TeamCard
        key={`team-${team.id}`}
        img={team.img || team.imageURL}
        banner={team.banner || team.bannerURL}
        name={team.name}
        shortdescription={team.shortdescription || team.shortDescription || ""}
        skill_seats={team.skill_seats || team.skills || []}
        creatorname={team.creatorname || team.createdBy || "Unknown"}
        checkIfTeamExists={true}
        id={team.id}
        workStyle={team.workStyle}
        timezone={team.timezone}
        compact={viewMode === "list"}
        themeMode={themeMode}
        onTeamDeleted={handleTeamDeleted}
      />
    );
  };

  const renderPostCard = (post) => {
    const isCommunity =
      post.type === "community" || post.category === "community";

    if (isCommunity) {
      return (
        <CommunityPostCard
          key={`community-${post.id}`}
          themeMode={themeMode}
          onPostDeleted={handlePostDeleted}
          post={{
            id: post.id,
            content: post.content || "",
            projectName: post.projectName || post.title || "",
            tags: post.tags || [],
            type: post.type || "communityPost",
            images: post.images || [],
            createdAt: post.createdAt,
            creatorName: post.creatorName || post.authorName || "Anonymous",
            profileImage: post.profileImage || post.authorAvatar || "",
            userId: post.userId || post.authorId || "",
            likes: post.likes || [],
            communityData: post.communityData || {
              category: post.category || "general",
              id: post.communityId,
              name: post.communityName,
            },
            commentsCount: post.commentsCount || 0,
            comments: post.comments || [],
            communityId: post.communityId,
            category: post.category || post.communityData?.category,
            communityName: post.communityName || post.communityData?.name,
          }}
        />
      );
    } else {
      return (
        <PostCard
          key={`normal-${post.id}`}
          themeMode={themeMode}
          onPostDeleted={handlePostDeleted}
          post={{
            id: post.id,
            content: post.content || "",
            projectName: post.projectName || post.title || "",
            tags: post.tags || [],
            type: post.type || "normal",
            images: post.images || [],
            createdAt: post.createdAt,
            creatorName: post.creatorName || "Anonymous",
            profileImage: post.profileImage || "",
            userId: post.userId || "",
            createdBy: post.createdBy || post.userId || "",
            likes: post.likes || [],
            savedAt: post.savedAt,
          }}
        />
      );
    }
  };

  return (
    <div
      className={`min-h-screen ${getBgColor()} ${getTextColor()} transition-colors duration-300`}>
      <div className="flex pt-12 lg:pt-0">
        <Sidebar themeMode={themeMode} />

        <div className="flex-2 flex flex-col lg:flex-row pt-10 justify-center">
          <div className="flex-1 max-w-7xl w-full px-2 lg:px-5 py-2 lg:py-6">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-3 rounded-2xl ${getGradientBg()} shadow-lg`}>
                  <RiBookmarkLine className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1
                    className={`text-3xl lg:text-4xl font-bold ${getTextColor()}`}>
                    {t("savedPage.title")}
                  </h1>
                  <p className={getSecondaryTextColor()}>
                    {t("savedPage.subtitle", { count: getAllSavedItems().length })}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`${getCardBg()} rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4 border ${getBorderColor()} shadow-lg`}>
              <div className="flex-1 min-w-[200px] relative">
                <input
                  type="text"
                  placeholder={t("savedPage.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 ${getInputBg()} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${getTextColor()} transition-colors duration-300`}
                />
                <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    viewMode === "grid"
                      ? `${getGradientBg()} text-white shadow-lg`
                      : `${getInputBg()} ${getHoverColor()}`
                  }`}>
                  <RiGridLine className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    viewMode === "list"
                      ? `${getGradientBg()} text-white shadow-lg`
                      : `${getInputBg()} ${getHoverColor()}`
                  }`}>
                  <RiListCheck className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => {
                  setActiveTab("all");
                  setPostType("all");
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === "all"
                    ? getTabActive()
                    : `${getCardBg()} ${getHoverColor()} border ${getBorderColor()}`
                }`}>
                {t("savedPage.all")}
              </button>
              <button
                onClick={() => {
                  setActiveTab("teams");
                  setPostType("all");
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === "teams"
                    ? getTabActive()
                    : `${getCardBg()} ${getHoverColor()} border ${getBorderColor()}`
                }`}>
                <RiTeamLine className="w-4 h-4" />
                {t("savedPage.teams")} ({savedTeams.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("posts");
                  setPostType("all");
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === "posts"
                    ? getTabActive()
                    : `${getCardBg()} ${getHoverColor()} border ${getBorderColor()}`
                }`}>
                <RiArticleLine className="w-4 h-4" />
                {t("savedPage.posts")} ({savedNormalPosts.length + savedCommunityPosts.length})
              </button>

              {activeTab === "posts" && (
                <>
                  <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                  <button
                    onClick={() => setPostType("all")}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      postType === "all"
                        ? getTabActive()
                        : `${getCardBg()} ${getHoverColor()} border ${getBorderColor()}`
                    }`}>
                    {t("savedPage.allPosts")}
                  </button>
                  <button
                    onClick={() => setPostType("normal")}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      postType === "normal"
                        ? getTabActive()
                        : `${getCardBg()} ${getHoverColor()} border ${getBorderColor()}`
                    }`}>
                    {t("savedPage.normal")} ({savedNormalPosts.length})
                  </button>
                  <button
                    onClick={() => setPostType("community")}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      postType === "community"
                        ? getTabActive()
                        : `${getCardBg()} ${getHoverColor()} border ${getBorderColor()}`
                    }`}>
                    {t("savedPage.community")} ({savedCommunityPosts.length})
                  </button>
                </>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div
                className={`${getCardBg()} rounded-2xl p-12 text-center shadow-lg border ${getBorderColor()}`}>
                <div className="text-6xl mb-4">📚</div>
                <h3 className={`text-2xl font-bold ${getTextColor()} mb-2`}>
                  {searchQuery ? t("savedPage.noResults") : t("savedPage.noSavedItems")}
                </h3>
                <p className={`${getSecondaryTextColor()} mb-6`}>
                  {searchQuery ? t("savedPage.adjustSearch") : t("savedPage.startSaving")}
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                    : "flex flex-col gap-6"
                }>
                {filteredItems.map((item) => (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full">
                    <div className="-mb-6">
                      {item.type === "team"
                        ? renderTeamCard(item)
                        : renderPostCard(item)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <RightSideBar themeMode={themeMode} />
      </div>
    </div>
  );
};

export default SavedPage;