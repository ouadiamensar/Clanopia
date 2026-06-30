/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef, useCallback } from "react";
import RightSideBar from "./rightSideBar";
import Sidebar from "./Sidebar";
import CommunityCard from "./smallComp/CommunityCard";
import ProfileCard from "./smallComp/ProfileCard";
import TeamCard from "./smallComp/teamCard";
import PostCard from "./smallComp/PostCard";
import CommunityPostCard from "./smallComp/CommunityPostCard";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  startAfter,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  FiSearch,
  FiTrendingUp,
  FiUsers,
  FiStar,
  FiClock,
  FiChevronRight,
  FiChevronLeft,
  FiMessageSquare,
  FiHeart,
  FiEye,
  FiShare,
  FiZap,
  FiAward,
  FiCalendar,
  FiFilter,
  FiX,
  FiHome,
  FiHash,
  FiGlobe,
  FiUser,
  FiUsers as FiUsersIcon,
  FiLayers,
  FiGrid,
  FiList,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const categories = [
  "Technology",
  "Programming",
  "Gaming",
  "Art & Design",
  "Music",
  "Movies & TV",
  "Books & Literature",
  "Education",
  "Science",
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
];

const QUICK_CATEGORIES = [
  "Technology",
  "Programming",
  "Gaming",
  "Art & Design",
  "Music",
  "Science",
  "Business",
  "Health & Fitness",
];

const Home = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAllCommunities, setShowAllCommunities] = useState(false);
  const [showAllTeams, setShowAllTeams] = useState(false);
  const [showAllProfiles, setShowAllProfiles] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
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

  const [communities, setCommunities] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    activeUsers: 0,
    newCommunities: 0,
    trendingTopics: 0,
  });

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

  const observer = useRef();
  const lastItemRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !searchQuery) {
          loadMoreData();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore, searchQuery],
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchFeedData = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();

      const communitiesPromise = fetchCommunities();

      const teamsPromise = fetchTeams();

      const usersPromise = fetchUsers();

      // 4. جلب المنشورات (محدودة)
      const postsPromise = fetchPosts();

      const [communitiesData, teamsData, usersData, postsData] =
        await Promise.allSettled([
          communitiesPromise,
          teamsPromise,
          usersPromise,
          postsPromise,
        ]);

      if (communitiesData.status === "fulfilled") {
        setCommunities(communitiesData.value);
      }

      if (teamsData.status === "fulfilled") {
        setTeams(teamsData.value);
      }

      if (usersData.status === "fulfilled") {
        setUsers(usersData.value);
      }

      if (postsData.status === "fulfilled") {
        const { userPostsData, communityPostsData, trendingData } =
          postsData.value;
        setUserPosts(userPostsData);
        setCommunityPosts(communityPostsData);
        setTrendingPosts(trendingData);
      }

      fetchStats();

      const endTime = performance.now();
      console.log(
        `⏱️ وقت تحميل الصفحة: ${((endTime - startTime) / 1000).toFixed(2)} ثانية`,
      );

      setLoading(false);
    } catch (error) {
      console.error("Error fetching feed data:", error);
      setLoading(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      const communityPromises = QUICK_CATEGORIES.map(async (category) => {
        try {
          const communitiesRef = collection(
            db,
            `communities/${category}/items`,
          );
          const q = query(
            communitiesRef,
            orderBy("createdAt", "desc"),
            limit(5),
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            type: "community",
            category: category,
            membersCount: doc.data().members
              ? Array.isArray(doc.data().members)
                ? doc.data().members.length
                : 0
              : 0,
          }));
        } catch (error) {
          console.error(`Error fetching communities for ${category}:`, error);
          return [];
        }
      });

      const results = await Promise.allSettled(communityPromises);
      const communities = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value);

      return communities.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    } catch (error) {
      console.error("Error fetching communities:", error);
      return [];
    }
  };

  const fetchTeams = async () => {
    try {
      const q = query(
        collection(db, "teams"),
        orderBy("createdAt", "desc"),
        limit(10),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "team",
        imageURL: doc.data().imageURL || "",
        shortDescription: doc.data().shortDescription || "",
        skills: doc.data().skills || [],
        workStyle: doc.data().workStyle || "",
        timezone: doc.data().timezone || "",
        creatorname: doc.data().creatorname || "",
      }));
    } catch (error) {
      console.error("Error fetching teams:", error);
      return [];
    }
  };

  const fetchUsers = async () => {
    try {
      const q = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        limit(15),
      );
      const snapshot = await getDocs(q);

      const userPromises = snapshot.docs.map(async (userDoc) => {
        try {
          const profileRef = doc(db, `users/${userDoc.id}/profile/data`);
          const profileSnapshot = await getDoc(profileRef);

          return {
            id: userDoc.id,
            ...userDoc.data(),
            type: "user",
            profile: profileSnapshot.exists()
              ? {
                  name: profileSnapshot.data().name || "",
                  ProfileImageURL: profileSnapshot.data().ProfileImageURL || "",
                  about: profileSnapshot.data().about || "",
                  skills: profileSnapshot.data().skills?.slice(0, 3) || [],
                }
              : {
                  name: userDoc.data().name || "",
                  ProfileImageURL: userDoc.data().profileImage || "",
                  about: userDoc.data().about || "",
                  skills: [],
                },
          };
        } catch (error) {
          return {
            id: userDoc.id,
            ...userDoc.data(),
            type: "user",
            profile: {
              name: userDoc.data().name || "",
              ProfileImageURL: userDoc.data().profileImage || "",
              about: userDoc.data().about || "",
              skills: [],
            },
          };
        }
      });

      return await Promise.allSettled(userPromises).then((results) =>
        results.filter((r) => r.status === "fulfilled").map((r) => r.value),
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  const fetchPosts = async () => {
    try {
      const POSTS_LIMIT = 3;

      const userPostsData = await fetchUserPosts(POSTS_LIMIT);

      const communityPostsData = await fetchCommunityPosts(POSTS_LIMIT);

      const allPosts = [...userPostsData, ...communityPostsData];
      const trendingData = allPosts
        .sort((a, b) => {
          const aEngagement = (a.likes?.length || 0) + (a.commentsCount || 0);
          const bEngagement = (b.likes?.length || 0) + (b.commentsCount || 0);
          return bEngagement - aEngagement;
        })
        .slice(0, 5);

      return {
        userPostsData,
        communityPostsData,
        trendingData,
      };
    } catch (error) {
      console.error("Error fetching posts:", error);
      return {
        userPostsData: [],
        communityPostsData: [],
        trendingData: [],
      };
    }
  };

  const fetchUserPosts = async (limitCount) => {
    try {
      const usersSnapshot = await getDocs(
        query(collection(db, "users"), orderBy("createdAt", "desc"), limit(8)),
      );

      const postPromises = usersSnapshot.docs.map(async (userDoc) => {
        try {
          const postsRef = collection(
            db,
            `users/${userDoc.id}/profile/data/posts`,
          );
          const postsSnapshot = await getDocs(
            query(postsRef, orderBy("createdAt", "desc"), limit(limitCount)),
          );

          return postsSnapshot.docs.map((doc) => {
            const postData = doc.data();
            return {
              id: doc.id,
              ...postData,
              type: "userPost",
              userId: userDoc.id,
              userData: {
                id: userDoc.id,
                name: userDoc.data().name || "",
                profileImage: userDoc.data().profileImage || "",
              },
              comments: [],
              commentsCount: 0,
            };
          });
        } catch (error) {
          console.error(`Error fetching posts for user ${userDoc.id}:`, error);
          return [];
        }
      });

      const results = await Promise.allSettled(postPromises);
      return results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error("Error fetching user posts:", error);
      return [];
    }
  };

  const fetchCommunityPosts = async (limitCount) => {
    try {
      const communitiesData = await fetchCommunities();
      const topCommunities = communitiesData.slice(0, 6);

      const postPromises = topCommunities.map(async (community) => {
        try {
          const postsRef = collection(
            db,
            `communities/${community.category}/items/${community.id}/posts`,
          );
          const postsSnapshot = await getDocs(
            query(postsRef, orderBy("createdAt", "desc"), limit(limitCount)),
          );

          return postsSnapshot.docs.map((doc) => {
            const postData = doc.data();
            return {
              id: doc.id,
              ...postData,
              type: "communityPost",
              communityId: community.id,
              communityName: community.name,
              communityData: community,
              communityCategory:
                postData.communityCategory || community.category,
              content: postData.content || postData.text || "",
              title: postData.title || postData.projectName || "",
              tags: postData.tags || [],
              images: postData.images || [],
              authorName: postData.authorName || postData.creatorName || "",
              authorAvatar:
                postData.authorAvatar || postData.profileImage || "",
              authorId: postData.authorId || postData.userId || "",
              likes: postData.likes || [],
              comments: [],
              commentsCount: 0,
              category: community.category,
            };
          });
        } catch (error) {
          console.error(
            `Error fetching posts for community ${community.id}:`,
            error,
          );
          return [];
        }
      });

      const results = await Promise.allSettled(postPromises);
      return results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error("Error fetching community posts:", error);
      return [];
    }
  };

  const fetchStats = async () => {
    try {
      const activeUsers = users.length;

      const totalPosts = userPosts.length + communityPosts.length;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newCommunities = communities.filter(
        (c) => c.createdAt && c.createdAt.toDate?.() >= oneWeekAgo,
      ).length;

      setStats({
        totalPosts,
        activeUsers,
        newCommunities,
        trendingTopics: trendingPosts.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const loadMoreData = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);

      setTimeout(() => {
        const currentPosts = [...userPosts, ...communityPosts];
        const startIdx = page * 10;
        const endIdx = startIdx + 10;
        const newPosts = currentPosts.slice(startIdx, endIdx);

        if (newPosts.length === 0 || startIdx >= currentPosts.length) {
          setHasMore(false);
        } else {
          setPage((prev) => prev + 1);
        }
        setLoadingMore(false);
      }, 500);
    } catch (error) {
      console.error("Error loading more data:", error);
      setLoadingMore(false);
    }
  };

  const getFilteredItems = () => {
    let items = [];

    switch (activeFilter) {
      case "all":
        items = [...userPosts, ...communityPosts];
        break;
      case "community":
        items = communities;
        break;
      case "team":
        items = teams;
        break;
      case "user":
        items = users;
        break;
      default:
        items = [...userPosts, ...communityPosts];
    }

    if (selectedCategory !== "All" && activeFilter === "community") {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return items.filter((item) => {
        const searchableText =
          item.name ||
          item.content ||
          item.title ||
          item.profile?.name ||
          item.shortDescription ||
          "";
        return searchableText.toLowerCase().includes(query);
      });
    }

    switch (sortBy) {
      case "newest":
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  const scrollLeft = (id) => {
    const container = document.getElementById(id);
    if (container) {
      container.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = (id) => {
    const container = document.getElementById(id);
    if (container) {
      container.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const createMixedFeed = () => {
    const posts = [...userPosts, ...communityPosts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 15);

    const mixedFeed = [];
    let postCount = 0;

    for (let i = 0; i < posts.length; i++) {
      mixedFeed.push(posts[i]);
      postCount++;

      if (postCount === 3 && users.length > 0 && i === 2) {
        mixedFeed.push({ type: "profileSlider", id: "profile-slider-item" });
      }

      if (postCount === 6 && teams.length > 0 && i === 5) {
        mixedFeed.push({ type: "teamSlider", id: "team-slider-item" });
      }

      if (postCount === 9 && communities.length > 0 && i === 8) {
        mixedFeed.push({
          type: "communitySlider",
          id: "community-slider-item",
        });
        postCount = 0;
      }
    }

    return mixedFeed;
  };

  const mixedFeed = createMixedFeed();

  const displayedCommunities = showAllCommunities
    ? communities
    : communities.slice(0, 8);
  const displayedTeams = showAllTeams ? teams : teams.slice(0, 6);
  const displayedProfiles = showAllProfiles ? users : users.slice(0, 6);

  const getBgColor = () =>
    themeMode === "light" ? "bg-gray-50" : "bg-[#1e1e1f]";
  const getCardBgColor = () =>
    themeMode === "light" ? "bg-white" : "bg-[#222223]";
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-white";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBgColor = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getHoverBgColor = () =>
    themeMode === "light" ? "hover:bg-gray-100" : "hover:bg-[#29292a]";
  const getGradientBg = () =>
    themeMode === "light"
      ? "bg-gradient-to-r from-blue-500 to-purple-600"
      : "bg-gradient-to-r from-blue-600 to-purple-700";
  useEffect(() => {
    fetchFeedData();
  }, []);

  return (
    <div
      className={`min-h-screen grid ${isMobile ? "pb-20 grid-cols-9" : "grid-cols-11"} ${getBgColor()} ${getTextColor()} transition-colors duration-300`}>
      <div className="col-span-9 md:col-span-2">
        <Sidebar themeMode={themeMode} />
        <RightSideBar themeMode={themeMode} />
      </div>

      <div
        className={`col-span-9 md:col-span-5 p-4 pt-15 mt-16 md:mt-0 ${isMobile ? "pb-20 md:col-span-5" : "md:col-span-8"}`}>
        <div
          className={`${getCardBgColor()} rounded-2xl p-6 mb-6 ${getBorderColor()} border shadow-lg transition-all duration-300`}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                {t("home.title")}
              </h1>
              <p className={`mt-1 ${getSecondaryTextColor()}`}>
                {t("home.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`${getCardBgColor()} rounded-2xl p-5 mb-6 ${getBorderColor()} border shadow-lg transition-all duration-300`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className={`${getSecondaryTextColor()} w-4 h-4`} />
              </div>
              <input
                type="text"
                placeholder={t("home.searchPlaceholder")}
                className={`w-full ${getInputBgColor()} ${getTextColor()} rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex overflow-x-auto gap-2 mt-4 pb-2 scrollbar-hide">
            {["all", "community", "team", "user"].map((filter) => (
              <button
                key={filter}
                className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm transition-all duration-300 ${
                  activeFilter === filter
                    ? `${getGradientBg()} text-white shadow-md`
                    : `${getInputBgColor()} ${getTextColor()} ${getHoverBgColor()}`
                }`}
                onClick={() => setActiveFilter(filter)}>
                {t(`filters.${filter}`)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
            </div>
          </div>
        ) : searchQuery || activeFilter !== "all" ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {searchQuery
                  ? `${t("home.searchResults")} "${searchQuery}"`
                  : `${t(`filters.${activeFilter}`)}`}
                {filteredItems.length > 0 && ` (${filteredItems.length})`}
              </h2>
            </div>

            {filteredItems.length === 0 ? (
              <div
                className={`${getCardBgColor()} rounded-2xl p-12 text-center ${getBorderColor()} border shadow-lg`}>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className={`text-xl font-semibold ${getTextColor()} mb-2`}>
                  {t("home.noContent")}
                </h3>
                <p className={`${getSecondaryTextColor()}`}>
                  {searchQuery
                    ? t("home.tryDifferentKeywords")
                    : t("home.noItemsFound")}
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                    : "space-y-4"
                }>
                {filteredItems.map((item) => {
                  switch (item.type) {
                    case "community":
                      return (
                        <CommunityCard
                          key={`community-${item.id}`}
                          id={item.id}
                          logo={item.logoURL}
                          name={item.name}
                          MembersNum={item.membersCount}
                          shortDescription={item.shortDescription}
                          category={item.category}
                          isMobile={isMobile}
                          themeMode={themeMode}
                        />
                      );
                    case "user":
                      return (
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
                      );
                    case "team":
                      return (
                        <TeamCard
                          key={`team-${item.id}`}
                          img={item.imageURL}
                          name={item.name}
                          banner={item.bannerURL}
                          shortdescription={item.shortDescription}
                          skill_seats={item.skills}
                          language={item.language}
                          creatorname={item.creatorname}
                          checkIfTeamExists={() => {}}
                          id={item.id}
                          workStyle={item.workStyle}
                          timezone={item.timezone}
                          themeMode={themeMode}
                        />
                      );
                    case "userPost":
                      return (
                        <PostCard
                          key={`user-${item.userId}-post-${item.id}`}
                          post={item}
                          themeMode={themeMode}
                        />
                      );
                    case "communityPost":
                      return (
                        <CommunityPostCard
                          key={`community-${item.communityId}-post-${item.id}`}
                          post={{
                            id: item.id,
                            images: item.images || [],
                            createdAt: item.createdAt,
                            creatorName:
                              item.authorName ||
                              item.creatorName ||
                              "Anonymous",
                            profileImage:
                              item.authorAvatar || item.profileImage || "",
                            userId: item.authorId || item.userId || "",
                            likes: item.likes || [],
                            community: item.communityData,
                            commentsCount: item.commentsCount || 0,
                            comments: item.comments || [],
                            content: item.content || "",
                            projectName: item.title || item.projectName || "",
                            tags: item.tags || [],
                            type: item.type || "communityPost",
                            communityData: item.communityData,
                            communityId: item.communityId,
                            category:
                              item.category || item.communityData?.category,
                            communityName:
                              item.communityName || item.communityData?.name,
                          }}
                          themeMode={themeMode}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {trendingPosts.length > 0 && (
              <div
                className={`${getCardBgColor()} rounded-2xl p-5 ${getBorderColor()} border shadow-lg transition-all duration-300`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                    <FiTrendingUp className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold">{t("home.trendingNow")}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-orange-500/50 to-transparent"></div>
                </div>
                <div className="space-y-3">
                  {trendingPosts.slice(0, 3).map((post, index) => (
                    <Link
                      key={`trending-${post.id}`}
                      to={`/post/${post.createdBy}/${post.id}`}
                      className={`${getInputBgColor()} rounded-xl p-4 flex items-start gap-3 ${getHoverBgColor()} transition-all duration-300 group`}>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium ${getTextColor()} group-hover:text-blue-500 transition-colors duration-300 truncate`}>
                          {post.title || post.content?.substring(0, 60) + "..."}
                        </h3>
                        <div
                          className={`flex items-center gap-4 mt-2 text-sm ${getSecondaryTextColor()}`}>
                          <span className="flex items-center gap-1">
                            <FiHeart className="w-3.5 h-3.5" />
                            {post.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiMessageSquare className="w-3.5 h-3.5" />
                            {post.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                      <FiChevronRight
                        className={`${getSecondaryTextColor()} group-hover:translate-x-1 transition-transform duration-300`}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {mixedFeed.map((item, index) => {
              if (item.type === "userPost" || item.type === "communityPost") {
                if (item.type === "userPost") {
                  return (
                    <div
                      key={`user-${item.userId}-post-${item.id}`}
                      className="animate-fadeIn"
                      style={{ animationDelay: `${index * 50}ms` }}>
                      <PostCard themeMode={themeMode} post={item} />
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={`community-${item.communityId}-post-${item.id}`}
                      className="animate-fadeIn"
                      style={{ animationDelay: `${index * 50}ms` }}>
                      <CommunityPostCard
                        themeMode={themeMode}
                        post={{
                          id: item.id,
                          content: item.content || "",
                          projectName: item.title || item.projectName || "",
                          tags: item.tags || [],
                          type: item.type || "communityPost",
                          images: item.images || [],
                          createdAt: item.createdAt,
                          creatorName:
                            item.authorName || item.creatorName || "Anonymous",
                          profileImage:
                            item.authorAvatar || item.profileImage || "",
                          userId: item.authorId || item.userId || "",
                          likes: item.likes || [],
                          communityData: item.communityData,
                          commentsCount: item.commentsCount || 0,
                          comments: item.comments || [],
                          communityId: item.communityId,
                          category:
                            item.category || item.communityData?.category,
                          communityName:
                            item.communityName || item.communityData?.name,
                        }}
                      />
                    </div>
                  );
                }
              } else if (item.type === "profileSlider") {
                return (
                  <div
                    key={item.id}
                    className={`${getCardBgColor()} rounded-2xl p-5 ${getBorderColor()} border shadow-lg transition-all duration-300`}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                          <FiUsers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">
                          {t("home.peopleYouMayKnow")}
                        </h2>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => scrollLeft("profiles-slider")}
                          className={`p-2 rounded-xl ${getInputBgColor()} ${getHoverBgColor()} transition-all duration-300`}>
                          <FiChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollRight("profiles-slider")}
                          className={`p-2 rounded-xl ${getInputBgColor()} ${getHoverBgColor()} transition-all duration-300`}>
                          <FiChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div
                      id="profiles-slider"
                      className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}>
                      {displayedProfiles.map((user) => (
                        <div key={user.id} className="flex-shrink-0 w-56">
                          <ProfileCard
                            name={user.profile?.name}
                            image={user.profile?.ProfileImageURL}
                            about={user.profile?.about}
                            skills={user.profile?.skills}
                            id={user.id}
                            isMobile={isMobile}
                            compact={true}
                            themeMode={themeMode}
                          />
                        </div>
                      ))}
                    </div>
                    {!showAllProfiles && users.length > 6 && (
                      <div className="text-center mt-4">
                        <button
                          className="text-blue-500 hover:text-blue-700 font-medium transition-colors duration-300"
                          onClick={() => setShowAllProfiles(true)}>
                          {t("home.viewMore")} →
                        </button>
                      </div>
                    )}
                  </div>
                );
              } else if (item.type === "teamSlider") {
                return (
                  <div
                    key={item.id}
                    className={`${getCardBgColor()} rounded-2xl p-5 ${getBorderColor()} border shadow-lg transition-all duration-300`}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                          <FiUsersIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">
                          {t("home.activeTeams")}
                        </h2>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => scrollLeft("teams-slider")}
                          className={`p-2 rounded-xl ${getInputBgColor()} ${getHoverBgColor()} transition-all duration-300`}>
                          <FiChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollRight("teams-slider")}
                          className={`p-2 rounded-xl ${getInputBgColor()} ${getHoverBgColor()} transition-all duration-300`}>
                          <FiChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div
                      id="teams-slider"
                      className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}>
                      {displayedTeams.map((team) => (
                        <div
                          key={`team-${team.id}`}
                          className="flex-shrink-0 w-72">
                          <TeamCard
                            img={team.imageURL}
                            name={team.name}
                            banner={team.bannerURL}
                            shortdescription={team.shortDescription}
                            skill_seats={team.skills}
                            language={team.language}
                            creatorname={team.creatorname}
                            checkIfTeamExists={() => {}}
                            id={team.id}
                            workStyle={team.workStyle}
                            timezone={team.timezone}
                            compact={true}
                            themeMode={themeMode}
                          />
                        </div>
                      ))}
                    </div>
                    {!showAllTeams && teams.length > 6 && (
                      <div className="text-center mt-4">
                        <button
                          className="text-blue-500 hover:text-blue-700 font-medium transition-colors duration-300"
                          onClick={() => setShowAllTeams(true)}>
                          {t("home.viewMore")} →
                        </button>
                      </div>
                    )}
                  </div>
                );
              } else if (item.type === "communitySlider") {
                return (
                  <div
                    key={item.id}
                    className={`${getCardBgColor()} rounded-2xl p-5 ${getBorderColor()} border shadow-lg transition-all duration-300`}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                          <FiGlobe className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">
                          {t("home.communitiesYouMayLike")}
                        </h2>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => scrollLeft("communities-slider")}
                          className={`p-2 rounded-xl ${getInputBgColor()} ${getHoverBgColor()} transition-all duration-300`}>
                          <FiChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollRight("communities-slider")}
                          className={`p-2 rounded-xl ${getInputBgColor()} ${getHoverBgColor()} transition-all duration-300`}>
                          <FiChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div
                      id="communities-slider"
                      className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}>
                      {displayedCommunities.map((community) => (
                        <div
                          key={`community-${community.id}`}
                          className="flex-shrink-0 w-64">
                          <CommunityCard
                            id={community.id}
                            logo={community.logoURL}
                            name={community.name}
                            MembersNum={community.membersCount}
                            shortDescription={community.shortDescription}
                            category={community.category}
                            isMobile={isMobile}
                            compact={true}
                            themeMode={themeMode}
                          />
                        </div>
                      ))}
                    </div>
                    {!showAllCommunities && communities.length > 8 && (
                      <div className="text-center mt-4">
                        <button
                          className="text-blue-500 hover:text-blue-700 font-medium transition-colors duration-300"
                          onClick={() => setShowAllCommunities(true)}>
                          {t("home.viewMore")} →
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })}

            {hasMore && !searchQuery && (
              <div ref={lastItemRef} className="flex justify-center py-6">
                {loadingMore ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500/30 border-t-blue-500"></div>
                  </div>
                ) : (
                  <button
                    onClick={loadMoreData}
                    className={`px-6 py-3 ${getCardBgColor()} ${getTextColor()} ${getHoverBgColor()} rounded-xl ${getBorderColor()} border shadow-md hover:shadow-lg transition-all duration-300 font-medium`}>
                    {t("home.loadMore")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
