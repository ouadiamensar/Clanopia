/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/Clanopia.png";
import {
  HiHome,
  HiGlobe,
  HiUserGroup,
  HiUsers,
  HiChat,
  HiViewGrid,
  HiPencil,
  HiCog,
  HiSparkles,
  HiLogout,
  HiX,
  HiChevronLeft,
  HiMenu,
  HiSearch,
} from "react-icons/hi";
import {
  FiCompass,
  FiPlusCircle,
  FiUsers as FiUsersIcon,
  FiTrendingUp,
  FiStar,
} from "react-icons/fi";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import default_profile_image from "../assets/default-profile-image.jpg";
import { FaBusinessTime } from "react-icons/fa";
import { MdOutlineAddToPhotos } from "react-icons/md";
import { useLanguage } from "../context/LanguageContext";
import { IoBookmarks } from "react-icons/io5";

const Sidebar = ({ themeMode }) => {
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isHovered, setIsHovered] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCommunitiesSidebar, setShowCommunitiesSidebar] = useState(false);
  const [communitiesSidebarHovered, setCommunitiesSidebarHovered] =
    useState(false);
  const [showChatsSidebar, setShowChatsSidebar] = useState(false);
  const [chatsSidebarHovered, setChatsSidebarHovered] = useState(false);
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [otherUsersProfiles, setOtherUsersProfiles] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

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
    // تأخير بسيط للتأكد من أن themeMode قد تم تحميله
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [themeMode]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile && showMobileSidebar) {
        setShowMobileSidebar(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showMobileSidebar]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserProfile = async () => {
      const profileRef = doc(db, "users", currentUser.uid, "profile", "data");
      const snapshot = await getDoc(profileRef);
      setProfile(snapshot.exists() ? snapshot.data() : null);
    };

    const fetchUserData = async () => {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      setUserData(docSnap.exists() ? docSnap.data() : null);
    };

    fetchUserProfile();
    fetchUserData();
  }, [currentUser]);

  const getOtherUsersProfiles = async (chats, currentUserId) => {
    const profiles = {};
    const usersToFetch = new Set();
    chats.forEach((chat) =>
      chat.users.forEach(
        (userId) => userId !== currentUserId && usersToFetch.add(userId),
      ),
    );

    for (const userId of usersToFetch) {
      try {
        const userSnap = await getDoc(
          doc(db, "users", userId, "profile", "data"),
        );
        if (userSnap.exists()) profiles[userId] = userSnap.data();
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }

    return profiles;
  };

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("users", "array-contains", currentUserId));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const myChats = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChats(myChats);
      setFilteredChats(myChats);

      const profiles = await getOtherUsersProfiles(myChats, currentUserId);
      setOtherUsersProfiles(profiles);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase().trim();

    const filtered = chats.filter((chat) => {
      const otherUserId = chat.users.find(
        (userId) => userId !== auth.currentUser?.uid,
      );
      const otherUser = otherUsersProfiles[otherUserId] || {
        name: t("sidebar.user"),
      };

      const nameMatch = otherUser.name?.toLowerCase().includes(query);

      const messageMatch = chat.lastMessage?.toLowerCase().includes(query);

      const typeMatch = chat.type?.toLowerCase().includes(query);

      return nameMatch || messageMatch || typeMatch;
    });

    setFilteredChats(filtered);
  }, [searchQuery, chats, otherUsersProfiles]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    setIsSearching(true);
  };

  const handleSearchBlur = () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    searchInputRef.current?.focus();
  };

  const navItems = [
    { label: t("sidebar.home"), to: "/home", icon: <HiHome /> },
    { label: t("sidebar.exploreTeams"), to: "/exploreteam", icon: <HiGlobe /> },
    { label: t("sidebar.profiles"), to: "/exploreProfiles", icon: <HiUsers /> },
  ];

  const communitiesNavItems = [
    {
      path: "/Communities",
      icon: <FiCompass className="w-5 h-5" />,
      label: t("sidebar.exploreAll"),
    },
    {
      path: "/Communities/joined-communities",
      icon: <FiStar className="w-5 h-5" />,
      label: t("sidebar.joined"),
    },
    {
      path: "/Communities/MyOwn-Communities",
      icon: <FiUsersIcon className="w-5 h-5" />,
      label: t("sidebar.myCommunities"),
    },
  ];

  const controlItems = [
    { label: t("sidebar.myTeams"), to: "/myteams", icon: <HiViewGrid /> },
    { label: t("sidebar.settings"), to: "/settings", icon: <HiCog /> },
    { label: t("sidebar.saves"), to: "/Saves", icon: <IoBookmarks /> },
  ];

  const isActiveLink = (path, matchPaths = []) => {
    if (path === "/chat") {
      return location.pathname.startsWith("/chat");
    } else if (path === "/Communities") {
      return location.pathname.startsWith("/Communities");
    } else {
      return (
        location.pathname === path || matchPaths.includes(location.pathname)
      );
    }
  };

  const navLinkClass = (path, matchPaths = [], index) => {
    const isActive = isActiveLink(path, matchPaths);
    return `flex items-center gap-3 h-12 px-4 rounded-xl transition-all duration-300 font-medium text-sm relative overflow-hidden group w-full ${
      isActive
        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
        : themeMode === "light"
          ? "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
          : "text-gray-300 hover:bg-gray-750 hover:text-white"
    }`;
  };

  const communitiesLinkClass = (path) => {
    const isActive =
      location.pathname === path || location.pathname.startsWith(path + "/");
    return `flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-300 w-full ${
      isActive
        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
        : themeMode === "light"
          ? "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setShowLogoutModal(false);
      navigate("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const toggleChatsSidebar = () => {
    setShowChatsSidebar(!showChatsSidebar);
    setShowCommunitiesSidebar(false);
    setShowMobileSidebar(false);
    setSearchQuery("");
    setFilteredChats(chats);
  };

  const toggleCommunitiesSidebar = () => {
    setShowCommunitiesSidebar(!showCommunitiesSidebar);
    setShowChatsSidebar(false);
    setShowMobileSidebar(false);
  };

  const closeAllSidebars = () => {
    setShowChatsSidebar(false);
    setShowCommunitiesSidebar(false);
    setShowMobileSidebar(false);
    setSearchQuery("");
    setFilteredChats(chats);
  };

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  const getBgColor = () => {
    return themeMode === "light" ? "bg-gray-100" : "bg-[#1e1e1f]";
  };

  const getBorderColor = () => {
    return themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  };

  const getTextColor = () => {
    return themeMode === "light" ? "text-gray-900" : "text-gray-100";
  };

  const getSecondaryTextColor = () => {
    return themeMode === "light" ? "text-gray-600" : "text-gray-400";
  };

  const getHoverIndex = (baseIndex) => {
    if (typeof isHovered === "string") return isHovered;
    return isHovered;
  };

  

  return (
    <>
      {isMobile && (
        <button
          className={`fixed top-3 left-2 z-50 p-2 rounded-lg text-white shadow-lg md:hidden ${
            themeMode === "light"
              ? "bg-gradient-to-br from-indigo-500 to-sky-600"
              : "bg-gradient-to-br from-indigo-900 to-sky-700"
          }`}
          onClick={toggleMobileSidebar}>
          <HiMenu className="text-xl" />
        </button>
      )}

      <aside
        className={`${getBgColor()} border-r p-3 ${getBorderColor()} shadow-2xl fixed top-0 h-screen z-30 flex flex-col justify-between transition-all duration-500 ${
          isMobile
            ? `fixed inset-y-0 left-0 transform ${
                showMobileSidebar ? "translate-x-0" : "-translate-x-full"
              } transition-transform duration-300 w-64`
            : isExpanded
              ? "w-64"
              : "w-18"
        }`}
        onMouseLeave={() => {
          setIsHovered(null);
        }}>
        {isMobile && (
          <button
            className={`absolute top-4 right-4 p-1 rounded-lg text-white md:hidden ${
              themeMode === "light" ? "bg-indigo-600" : "bg-gray-750"
            }`}
            onClick={() => setShowMobileSidebar(false)}>
            <HiX className="text-xl" />
          </button>
        )}

        <div
          className={`p-5 flex justify-between items-center border-b ${getBorderColor()}`}>
          {isExpanded && !isMobile && !showMobileSidebar && (
            <img
              src={logo}
              alt="Clanopia"
              className="w-40 h-auto object-contain transition-opacity duration-500"
            />
          )}
        </div>

        <div className="flex-1 px-1 py-6 ">
          <div className="mb-8">
            {isExpanded && (
              <h3
                className={`text-xs uppercase tracking-wider font-semibold mb-4 px-2 ${
                  themeMode === "light" ? "text-indigo-600" : "text-indigo-300"
                }`}>
                {t("sidebar.overview")}
              </h3>
            )}
            <ul className="space-y-3">
              {navItems.map((item, index) => (
                <li key={index} className="w-full">
                  <Link
                    to={item.to}
                    className={navLinkClass(
                      item.to,
                      item.matchPaths || [],
                      index,
                    )}
                    onMouseEnter={() => setIsHovered(index)}
                    onMouseLeave={() => setIsHovered(null)}
                    onClick={closeAllSidebars}>
                    <span className="text-xl transition-transform duration-300 group-hover:scale-110">
                      {item.icon}
                    </span>
                    {isExpanded && (
                      <span className="transition-opacity duration-300">
                        {item.label}
                      </span>
                    )}
                    {isHovered === index && (
                      <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></span>
                    )}
                  </Link>
                </li>
              ))}

              <li className="relative w-full">
                <button
                  className={navLinkClass(
                    "/chat",
                    ["/chat", "/chat/*"],
                    "chat",
                  )}
                  onMouseEnter={() => setIsHovered("chat")}
                  onMouseLeave={() => setIsHovered(null)}
                  onClick={toggleChatsSidebar}>
                  <span className="text-xl transition-transform duration-300 group-hover:scale-110">
                    <HiChat />
                  </span>
                  {isExpanded && (
                    <span className="transition-opacity duration-300">
                      {t("sidebar.chats")}
                    </span>
                  )}
                  {isHovered === "chat" && (
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></span>
                  )}
                </button>
              </li>

              <li className="relative w-full">
                <button
                  className={navLinkClass(
                    "/Communities",
                    ["/Communities", "/Communities/*"],
                    "communities",
                  )}
                  onMouseEnter={() => setIsHovered("communities")}
                  onMouseLeave={() => setIsHovered(null)}
                  onClick={toggleCommunitiesSidebar}>
                  <span className="text-xl transition-transform duration-300 group-hover:scale-110">
                    <HiUserGroup />
                  </span>
                  {isExpanded && (
                    <span className="transition-opacity duration-300">
                      {t("sidebar.communities")}
                    </span>
                  )}
                  {isHovered === "communities" && (
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></span>
                  )}
                </button>
              </li>
            </ul>
          </div>

          <div>
            {isExpanded && (
              <h3
                className={`text-xs uppercase tracking-wider font-semibold mb-4 px-2 ${
                  themeMode === "light" ? "text-indigo-600" : "text-indigo-300"
                }`}>
                {t("sidebar.controls")}
              </h3>
            )}
            <ul className="space-y-3">
              {controlItems.map((item, index) => {
                const hoverKey = `control_${index}`;
                return (
                  <li key={index} className="w-full">
                    <Link
                      to={item.to}
                      className={navLinkClass(item.to, [], hoverKey)}
                      onMouseEnter={() => setIsHovered(hoverKey)}
                      onMouseLeave={() => setIsHovered(null)}
                      onClick={closeAllSidebars}>
                      <span className="text-xl transition-transform duration-300 group-hover:scale-110">
                        {item.icon}
                      </span>
                      {isExpanded && (
                        <span className="transition-opacity duration-300">
                          {item.label}
                        </span>
                      )}
                      {isHovered === hoverKey && (
                        <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></span>
                      )}
                    </Link>
                  </li>
                );
              })}
              <li className="w-full">
                <Link
                  to="/createTeam"
                  className="flex items-center gap-3 h-12 px-4 text-white rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-indigo-500/30 group relative overflow-hidden w-full"
                  onMouseEnter={() => setIsHovered("create")}
                  onMouseLeave={() => setIsHovered(null)}
                  onClick={closeAllSidebars}>
                  <HiPencil className="text-xl transition-transform duration-300 group-hover:scale-110" />
                  {isExpanded && <span>{t("sidebar.createTeam")}</span>}
                  {isHovered === "create" && (
                    <span className="absolute inset-0 bg-white/10"></span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={`p-3 border-t ${getBorderColor()} ${getBgColor()}`}>
          <div className="flex items-center gap-3">
            <div className="relative mr-1">
              <Link to={`/profile/${auth.currentUser?.uid}`}>
                <img
                  src={profile?.ProfileImageURL || default_profile_image}
                  alt="User"
                  className="w-12 h-12 min-h-7 min-w-12 rounded-xl object-cover border-2 border-indigo-500 shadow-lg transition-all duration-300 hover:scale-105"
                  onError={(e) => {
                    e.target.src = default_profile_image;
                  }}
                />
              </Link>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 border-2 border-gray-800"></div>
            </div>

            {isExpanded && (
              <div className="flex-1 overflow-hidden">
                <p
                  className={`text-sm font-semibold truncate ${getTextColor()}`}>
                  {profile?.name || t("sidebar.user")}
                </p>

                <div className="flex items-center justify-between mt-1">
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                      themeMode === "light"
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                    }`}>
                    <HiLogout className="text-sm" />
                    {t("sidebar.signOut")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {!isExpanded && !isMobile && (
          <div
            className={`absolute left-20 top-0 h-full pointer-events-none ${getBgColor()}`}>
            {isHovered !== null &&
              typeof isHovered === "number" &&
              isHovered < navItems.length && (
                <div
                  className={`absolute text-xs py-2 px-3 rounded-md shadow-lg ml-2 mt-2 pointer-events-none transition-opacity duration-300 ${
                    themeMode === "light"
                      ? "bg-white text-gray-900"
                      : "bg-[#222223] text-white"
                  }`}
                  style={{ top: `${120 + isHovered * 60}px` }}>
                  {navItems[isHovered].label}
                </div>
              )}
            {isHovered === "chat" && (
              <div
                className={`absolute text-xs py-2 px-3 rounded-md shadow-lg ml-2 mt-2 pointer-events-none transition-opacity duration-300 ${
                  themeMode === "light"
                    ? "bg-white text-gray-900"
                    : "bg-[#222223] text-white"
                }`}
                style={{ top: `${120 + navItems.length * 60}px` }}>
                {t("sidebar.chats")}
              </div>
            )}
            {isHovered === "communities" && (
              <div
                className={`absolute text-xs py-2 px-3 rounded-md shadow-lg ml-2 mt-2 pointer-events-none transition-opacity duration-300 ${
                  themeMode === "light"
                    ? "bg-white text-gray-900"
                    : "bg-[#222223] text-white"
                }`}
                style={{ top: `${120 + (navItems.length + 1) * 60}px` }}>
                {t("sidebar.communities")}
              </div>
            )}
            {isHovered !== null &&
              typeof isHovered === "string" &&
              isHovered.startsWith("control_") && (
                <div
                  className={`absolute text-xs py-2 px-3 rounded-md shadow-lg ml-2 mt-2 pointer-events-none transition-opacity duration-300 ${
                    themeMode === "light"
                      ? "bg-white text-gray-900"
                      : "bg-[#222223] text-white"
                  }`}
                  style={{
                    top: `${120 + (navItems.length + 2 + parseInt(isHovered.split("_")[1])) * 60}px`,
                  }}>
                  {controlItems[parseInt(isHovered.split("_")[1])].label}
                </div>
              )}
            {isHovered === "create" && (
              <div
                className={`absolute text-xs py-2 px-3 rounded-md shadow-lg ml-2 mt-2 pointer-events-none transition-opacity duration-300 ${
                  themeMode === "light"
                    ? "bg-white text-gray-900"
                    : "bg-[#222223] text-white"
                }`}
                style={{
                  top: `${120 + (navItems.length + 2 + controlItems.length) * 60}px`,
                }}>
                {t("sidebar.createTeam")}
              </div>
            )}
          </div>
        )}
      </aside>

      {showChatsSidebar && (
        <div
          className={`fixed top-0 h-screen w-80 ${getBgColor()} border-r ${getBorderColor()} shadow-xl z-50 transition-all duration-300 ${
            isMobile
              ? "left-0 transform translate-x-0"
              : isExpanded
                ? "left-64"
                : "left-15"
          }`}
          onMouseEnter={() => {
            setChatsSidebarHovered(true);
          }}
          onMouseLeave={() => {
            if (!isMobile) {
              setChatsSidebarHovered(false);
            }
          }}>
          <div
            className={`flex items-center justify-between mb-4 p-4 border-b ${getBorderColor()}`}>
            <h2 className={`text-lg font-semibold ${getTextColor()}`}>
              {t("sidebar.messages")}
            </h2>
            <div className="flex items-center gap-2">
              {searchQuery && (
                <span className={`text-xs ${getSecondaryTextColor()}`}>
                  {filteredChats.length} {t("sidebar.results")}
                </span>
              )}
              <button
                className={`p-1 rounded-full transition-colors ${
                  themeMode === "light"
                    ? "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                    : "text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                }`}
                onClick={() => setShowChatsSidebar(false)}
                aria-label={t("sidebar.closeChats")}>
                {isMobile ? (
                  <HiChevronLeft className="text-xl" />
                ) : (
                  <HiX className="text-xl" />
                )}
              </button>
            </div>
          </div>

          <div className="relative mb-4 px-4">
            <div className="relative">
              <HiSearch
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isSearching ? "text-indigo-400" : getSecondaryTextColor()
                } transition-colors duration-200`}
                size={18}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder={t("sidebar.searchConversations")}
                className={`w-full py-2.5 pl-10 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder-gray-400 transition-all duration-200 ${
                  themeMode === "light"
                    ? "border-gray-300 bg-white text-gray-900"
                    : "border-[#2c2d2e] bg-[#252527] text-gray-100"
                } ${isSearching ? "ring-2 ring-indigo-500/30" : ""}`}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                    themeMode === "light"
                      ? "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                      : "text-gray-400 hover:text-gray-300 hover:bg-[#29292a]"
                  }`}>
                  <HiX size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto px-2 pb-4">
            {isSearching && searchQuery && filteredChats.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center h-64 text-sm ${
                  themeMode === "light" ? "text-gray-600" : "text-gray-400"
                }`}>
                <div className="text-4xl mb-3">🔍</div>
                <p className="mb-1">{t("sidebar.noResults")}</p>
                <p className="text-xs opacity-70">
                  {t("sidebar.tryDifferentSearch")}
                </p>
              </div>
            ) : filteredChats.length > 0 ? (
              filteredChats.map((chat) => {
                const otherUserId = chat.users.find(
                  (userId) => userId !== auth.currentUser?.uid,
                );
                const otherUser = otherUsersProfiles[otherUserId] || {
                  ProfileImageURL: default_profile_image,
                  name: t("sidebar.user"),
                };

                // Highlight matching text in name
                const highlightMatch = (text, query) => {
                  if (!query || !text) return text;
                  const index = text.toLowerCase().indexOf(query.toLowerCase());
                  if (index === -1) return text;
                  return (
                    <>
                      {text.substring(0, index)}
                      <span className="bg-indigo-500/30 text-indigo-300 px-0.5 rounded">
                        {text.substring(index, index + query.length)}
                      </span>
                      {text.substring(index + query.length)}
                    </>
                  );
                };

                const isActive = location.pathname === `/chat/${chat.id}`;

                return (
                  <Link
                    to={`/chat/${chat.id}`}
                    key={chat.id}
                    className={`flex items-center rounded-lg p-3 text-sm transition-all duration-200 border-l-4 ${
                      isActive
                        ? "bg-indigo-900/30 border-indigo-500 shadow-lg shadow-indigo-500/10"
                        : themeMode === "light"
                          ? "hover:bg-gray-200 border-transparent"
                          : "hover:bg-[#29292a] border-transparent"
                    } ${searchQuery ? "hover:scale-[1.02]" : ""}`}
                    onClick={() => {
                      if (isMobile) {
                        setShowChatsSidebar(false);
                      }
                      setSearchQuery("");
                      setFilteredChats(chats);
                      setIsSearching(false);
                    }}>
                    <div className="relative flex-shrink-0">
                      <img
                        src={otherUser.ProfileImageURL || default_profile_image}
                        className="w-12 h-12 rounded-full border-2 border-gray-600 object-cover"
                        alt={otherUser.name}
                        onError={(e) => {
                          e.target.src = default_profile_image;
                        }}
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
                    </div>

                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3
                          className={`font-medium truncate ${getTextColor()}`}>
                          {searchQuery
                            ? highlightMatch(otherUser.name, searchQuery)
                            : otherUser.name}
                          {chat.type === "join_request" && (
                            <FaBusinessTime className="inline ml-1 text-red-400 text-xs" />
                          )}
                        </h3>
                        <span
                          className={`text-xs whitespace-nowrap ${getSecondaryTextColor()}`}>
                          {chat.lastMessageTime
                            ?.toDate()
                            .toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate ${getSecondaryTextColor()}`}>
                        {chat.lastMessage
                          ? searchQuery
                            ? highlightMatch(
                                chat.lastMessage.slice(0, 40) +
                                  (chat.lastMessage.length >= 40 ? "..." : ""),
                                searchQuery,
                              )
                            : `${chat.lastMessage.slice(0, 40)}${
                                chat.lastMessage.length >= 40 ? "..." : ""
                              }`
                          : t("sidebar.startNewConversation")}
                      </p>
                    </div>
                  </Link>
                );
              })
            ) : chats.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center h-64 text-sm ${
                  themeMode === "light" ? "text-gray-600" : "text-gray-400"
                }`}>
                <div className="text-4xl mb-3">💬</div>
                <p className="mb-2">{t("sidebar.noConversations")}</p>
                <button
                  onClick={() => navigate("/new-chat")}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors">
                  {t("sidebar.startConversation")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showCommunitiesSidebar && (
        <div
          className={`fixed top-0 h-screen w-64 ${getBgColor()} border-r ${getBorderColor()} shadow-xl z-50 transition-all duration-300 ${
            isMobile
              ? "left-0 transform translate-x-0"
              : isExpanded
                ? "left-64"
                : "left-15"
          }`}
          onMouseEnter={() => {
            setCommunitiesSidebarHovered(true);
          }}
          onMouseLeave={() => {
            if (!isMobile) {
              setCommunitiesSidebarHovered(false);
            }
          }}>
          <div
            className={`p-4 border-b ${getBorderColor()} flex justify-between items-center`}>
            <h2
              className={`text-md font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent`}>
              {t("sidebar.communities")}
            </h2>
            <button
              className={`p-1 rounded-full transition-colors ${
                themeMode === "light"
                  ? "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                  : "text-gray-400 hover:bg-[#29292a] hover:text-gray-300"
              }`}
              onClick={() => setShowCommunitiesSidebar(false)}
              aria-label={t("sidebar.closeCommunities")}>
              {isMobile ? (
                <HiChevronLeft className="text-xl" />
              ) : (
                <HiX className="text-xl" />
              )}
            </button>
          </div>

          <div className="p-4 overflow-y-auto h-full">
            <div className="space-y-2 mb-6">
              {communitiesNavItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className={communitiesLinkClass(item.path)}
                  onClick={() => {
                    if (isMobile) {
                      setShowCommunitiesSidebar(false);
                    }
                  }}>
                  <span className="transition-colors duration-300">
                    {item.icon}
                  </span>
                  <span className="font-medium text-sm">{item.label}</span>
                  {location.pathname === item.path && (
                    <span className="ml-auto w-2 h-2 bg-purple-300 rounded-full animate-pulse"></span>
                  )}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-purple-500/30">
              <Link
                to="/Communities/create-community"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-700 text-white hover:from-cyan-700 hover:to-indigo-800 shadow-md hover:shadow-lg transition-all duration-300 text-sm font-semibold"
                onClick={() => {
                  if (isMobile) {
                    setShowCommunitiesSidebar(false);
                  }
                }}>
                <FiPlusCircle className="w-5 h-5" />
                <span>{t("sidebar.createCommunity")}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div
            className={`${getBgColor()} rounded-2xl p-6 max-w-md w-full border ${getBorderColor()} shadow-2xl`}>
            <div className="text-center">
              <div className="text-6xl mb-4">🚪</div>
              <h2 className={`text-2xl font-bold ${getTextColor()} mb-2`}>
                {t("sidebar.confirmLogout")}
              </h2>
              <p className={`${getSecondaryTextColor()} mb-6`}>
                {t("sidebar.logoutMessage")}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className={`px-6 py-2.5 border ${getBorderColor()} ${getTextColor()} rounded-xl font-medium hover:bg-gray-600 transition-all duration-300`}>
                  {t("sidebar.cancel")}
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105">
                  <HiLogout className="w-4 h-4" />
                  {t("sidebar.signOut")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;