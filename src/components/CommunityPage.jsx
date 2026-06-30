/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import RightSideBar from "./RightSideBar";
import Sidebar from "./Sidebar";
import { useParams, Link } from "react-router";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  limit,
  startAfter,
  onSnapshot,
  where,
  deleteDoc,
  increment,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { HiDotsHorizontal } from "react-icons/hi";
import {
  RiChat1Line,
  RiShareForwardLine,
  RiBookmarkLine,
  RiCloseLine,
  RiSunLine,
  RiMoonLine,
  RiFireLine,
  RiTimeLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiFilterLine,
  RiSearchLine,
  RiAddLine,
  RiUserAddLine,
  RiUserFollowLine,
  RiNotificationLine,
  RiSettingsLine,
  RiPencilLine,
  RiImageLine,
  RiVideoLine,
  RiAwardLine,
  RiEyeLine,
  RiMessageLine,
  RiShareLine,
  RiHeartLine,
  RiHeartFill,
  RiBookmarkFill,
  RiMoreLine,
} from "react-icons/ri";
import { BsArrowUpShort, BsArrowDownShort } from "react-icons/bs";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import CommunityPostCard from "./smallComp/CommunityPostCard";
import Profile from "./Profile";
import { useLanguage } from "../context/LanguageContext";
import { LuCrown } from "react-icons/lu";

const CommunityPage = () => {
  const { id, category } = useParams();
  const [communityData, setCommunityData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [activeSort, setActiveSort] = useState("hot");
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [postFiles, setPostFiles] = useState([]);
  const [postImages, setPostImages] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [projectName, setProjectName] = useState("");
  const [postTags, setPostTags] = useState([]);
  const [postType, setPostType] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showCreatePost, setShowCreatePost] = useState(false);
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
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [communityStats, setCommunityStats] = useState({
    postsCount: 0,
    commentsCount: 0,
    activeUsers: 0,
    growthRate: 0,
  });
  const [topContributors, setTopContributors] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [showFeatured, setShowFeatured] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postDraft, setPostDraft] = useState(null);
  const [showDraftAlert, setShowDraftAlert] = useState(false);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [viewedPosts, setViewedPosts] = useState(new Set());
  const [trendingScore, setTrendingScore] = useState({});

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
  const getPrimaryColor = () =>
    themeMode === "light" ? "text-blue-600" : "text-blue-400";
  const getAccentColor = () =>
    themeMode === "light" ? "bg-blue-600" : "bg-blue-500";

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsRightSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

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
    fetchUserBookmarks();
  }, [currentUser]);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const docRef = doc(db, "communities", category, "items", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCommunityData(docSnap.data());

          if (currentUser) {
            const isCreator = docSnap.data().createdBy === currentUser.uid;
            setIsCreator(isCreator);

            if (
              !isCreator &&
              docSnap.data().members?.includes(currentUser.uid)
            ) {
              setIsJoined(true);
            }
          }
        } else {
          console.log("No such Community!");
        }
      } catch (error) {
        console.error("Error fetching Community:", error);
      }
    };

    if (id) {
      fetchCommunity();
    }
  }, [id, currentUser, category]);

  useEffect(() => {
    if (!id) return;

    const fetchPostsWithComments = async () => {
      try {
        setIsLoading(true);

        const postsRef = collection(
          db,
          "communities",
          category,
          "items",
          id,
          "posts",
        );

        const postsSnapshot = await getDocs(
          query(postsRef, orderBy("createdAt", "desc")),
        );

        const postsWithComments = await Promise.all(
          postsSnapshot.docs.map(async (doc) => {
            const postData = doc.data();

            let comments = [];
            try {
              const commentsRef = collection(
                db,
                `communities/${category}/items/${id}/posts/${doc.id}/comments`,
              );
              const commentsSnapshot = await getDocs(
                query(commentsRef, orderBy("timestamp", "asc")),
              );
              comments = commentsSnapshot.docs.map((commentDoc) => ({
                id: commentDoc.id,
                ...commentDoc.data(),
              }));
            } catch (commentError) {
              console.error(
                `Error fetching comments for post ${doc.id}:`,
                commentError,
              );
            }

            return {
              id: doc.id,
              ...postData,
              comments: comments,
              commentsCount: comments.length,
            };
          }),
        );

        setPosts(postsWithComments);
        setIsLoading(false);

        calculateTrendingScores(postsWithComments);
        updateCommunityStats(postsWithComments);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setIsLoading(false);
      }
    };

    fetchPostsWithComments();

    const postsRef = collection(
      db,
      "communities",
      category,
      "items",
      id,
      "posts",
    );

    const unsubscribe = onSnapshot(
      query(postsRef, orderBy("createdAt", "desc")),
      async (snapshot) => {
        const postsData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const postData = doc.data();

            let comments = [];
            try {
              const commentsRef = collection(
                db,
                `communities/${category}/items/${id}/posts/${doc.id}/comments`,
              );
              const commentsSnapshot = await getDocs(
                query(commentsRef, orderBy("timestamp", "asc")),
              );
              comments = commentsSnapshot.docs.map((commentDoc) => ({
                id: commentDoc.id,
                ...commentDoc.data(),
              }));
            } catch (commentError) {
              console.error(
                `Error fetching comments for post ${doc.id}:`,
                commentError,
              );
            }

            return {
              id: doc.id,
              ...postData,
              comments: comments,
              commentsCount: comments.length,
            };
          }),
        );

        setPosts(postsData);
        setIsLoading(false);

        calculateTrendingScores(postsData);
        updateCommunityStats(postsData);
      },
      (error) => {
        console.error("Error fetching posts:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [id, category]);

  const calculateTrendingScores = (postsData) => {
    const scores = {};
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    postsData.forEach((post) => {
      const createdAt = post.createdAt?.toMillis?.() || post.createdAt || now;
      const age = now - createdAt;
      const hoursOld = age / hour;

      const likes = post.likes?.length || 0;
      const comments = post.comments?.length || 0;
      const views = post.views || 0;

      const score = likes - (post.dislikes || 0);
      const order = Math.log10(Math.max(Math.abs(score), 1));
      const sign = Math.sign(score);
      const seconds = age / 1000;

      const hotScore = sign * order + seconds / 45000;

      const newScore = createdAt;

      const topScore = score + comments * 2 + views * 0.1;

      scores[post.id] = {
        hot: hotScore,
        new: newScore,
        top: topScore,
        trending: hotScore * (1 + (views / 1000) * 0.1),
      };
    });

    setTrendingScore(scores);
  };

  const updateCommunityStats = (postsData) => {
    const totalPosts = postsData.length;
    let totalComments = 0;
    const activeUsers = new Set();

    postsData.forEach((post) => {
      totalComments += post.comments?.length || 0;
      if (post.authorId) activeUsers.add(post.authorId);
    });

    setCommunityStats({
      postsCount: totalPosts,
      commentsCount: totalComments,
      activeUsers: activeUsers.size,
      growthRate: totalPosts > 0 ? (totalPosts / 30) * 100 : 0,
    });

    const tagsMap = {};
    postsData.forEach((post) => {
      (post.tags || []).forEach((tag) => {
        tagsMap[tag] = (tagsMap[tag] || 0) + 1;
      });
    });

    const sortedTags = Object.entries(tagsMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);

    setTrendingTags(sortedTags);
  };

  const getSortedPosts = useCallback(() => {
    if (!posts.length) return [];

    let sorted = [...posts];

    switch (activeSort) {
      case "hot":
        sorted.sort((a, b) => {
          const scoreA = trendingScore[a.id]?.hot || 0;
          const scoreB = trendingScore[b.id]?.hot || 0;
          return scoreB - scoreA;
        });
        break;
      case "new":
        sorted.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || a.createdAt || 0;
          const timeB = b.createdAt?.toMillis?.() || b.createdAt || 0;
          return timeB - timeA;
        });
        break;
      case "top":
        sorted.sort((a, b) => {
          const scoreA = (a.likes?.length || 0) + (a.comments?.length || 0) * 2;
          const scoreB = (b.likes?.length || 0) + (b.comments?.length || 0) * 2;
          return scoreB - scoreA;
        });
        break;
      case "trending":
        sorted.sort((a, b) => {
          const scoreA = trendingScore[a.id]?.trending || 0;
          const scoreB = trendingScore[b.id]?.trending || 0;
          return scoreB - scoreA;
        });
        break;
      default:
        break;
    }

    if (selectedFilter !== "all") {
      sorted = sorted.filter((post) => {
        if (selectedFilter === "media") return post.images?.length > 0;
        if (selectedFilter === "text") return !post.images?.length;
        if (selectedFilter === "questions") return post.type === "question";
        if (selectedFilter === "projects") return post.type === "project";
        if (selectedFilter === "jobs") return post.type === "job";
        return true;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      sorted = sorted.filter((post) => {
        const content = post.content?.toLowerCase() || "";
        const title = post.title?.toLowerCase() || "";
        const tags = (post.tags || []).join(" ").toLowerCase();
        const author = post.authorName?.toLowerCase() || "";
        return (
          content.includes(query) ||
          title.includes(query) ||
          tags.includes(query) ||
          author.includes(query)
        );
      });
    }

    return sorted;
  }, [posts, activeSort, selectedFilter, searchQuery, trendingScore]);

  const sortedPosts = useMemo(() => getSortedPosts(), [getSortedPosts]);

  const fetchUserBookmarks = async () => {
    if (!currentUser) return;
    try {
      const bookmarksRef = collection(
        db,
        "users",
        currentUser.uid,
        "bookmarks",
      );
      const snapshot = await getDocs(bookmarksRef);
      const bookmarks = snapshot.docs.map((doc) => doc.data().postId);
      setBookmarkedPosts(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    }
  };

  const handleJoinCommunity = async () => {
    if (!currentUser) {
      alert(t("communityPage.loginRequired"));
      return;
    }

    try {
      const communityRef = doc(db, "communities", category, "items", id);
      const communityDoc = await getDoc(communityRef);

      if (!communityDoc.exists()) {
        alert(t("communityPage.communityNotFound"));
        return;
      }

      const communityData = communityDoc.data();

      if (isJoined) {
        await updateDoc(communityRef, {
          members: arrayRemove(currentUser.uid),
        });

        const userCommunityRef = doc(
          db,
          "users",
          currentUser.uid,
          "communities",
          id,
        );
        await deleteDoc(userCommunityRef);

        setIsJoined(false);
      } else {
        await updateDoc(communityRef, {
          members: arrayUnion(currentUser.uid),
        });

        const userCommunityRef = doc(
          db,
          "users",
          currentUser.uid,
          "communities",
          id,
        );

        await setDoc(userCommunityRef, {
          communityId: id,
          communityName: communityData.name || "Unknown",
          category: category,
          joinedAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          communityData: {
            name: communityData.name || "Unknown",
            description: communityData.fullDescription || "",
            logoURL: communityData.logoURL || null,
            bannerURL: communityData.bannerURL || null,
            membersCount: communityData.members?.length || 0,
          },
        });

        setIsJoined(true);
      }
    } catch (error) {
      console.error("Error updating community membership:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleBookmark = async (postId) => {
    if (!currentUser) {
      alert(t("communityPage.loginRequired"));
      return;
    }

    try {
      const bookmarkRef = doc(
        db,
        "users",
        currentUser.uid,
        "bookmarks",
        postId,
      );
      const isBookmarked = bookmarkedPosts.includes(postId);

      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        setBookmarkedPosts((prev) => prev.filter((id) => id !== postId));
      } else {
        await setDoc(bookmarkRef, {
          postId,
          bookmarkedAt: serverTimestamp(),
        });
        setBookmarkedPosts((prev) => [...prev, postId]);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const uploadMedia = async (communityId, postId, files, onProgress) => {
    const storage = getStorage();
    const mediaUrls = [];
    let uploaded = 0;

    for (const file of files) {
      const fileRef = ref(
        storage,
        `communities/${communityId}/posts/${postId}/${Date.now()}_${file.name}`,
      );

      const uploadTask = uploadBytes(fileRef, file);

      try {
        const snapshot = await uploadTask;
        const url = await getDownloadURL(snapshot.ref);
        mediaUrls.push(url);
        uploaded++;
        if (onProgress) {
          onProgress((uploaded / files.length) * 100);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }

    return mediaUrls;
  };

  const savePost = async () => {
    if (!currentUser) return alert(t("communityPage.loginRequired"));
    if (!communityData) return alert(t("communityPage.communityNotFound"));

    try {
      if (!postContent.trim() && postImages.length === 0) {
        alert(t("communityPage.contentRequired"));
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      let mediaUrls = [];
      if (postFiles.length > 0) {
        mediaUrls = await uploadMedia(id, "temp", postFiles, setUploadProgress);
      }

      const postData = {
        content: postContent.trim(),
        title: projectName.trim() || null,
        tags: postTags.filter((tag) => tag.trim()),
        type: postType,
        createdAt: serverTimestamp(),
        images: mediaUrls,
        authorId: currentUser.uid,
        authorName: profile?.name || t("communityPage.anonymous"),
        authorAvatar: profile?.ProfileImageURL || null,
        communityId: id,
        communityName: communityData.name,
        comments: [],
        likes: [],
        dislikes: [],
        views: 0,
        bookmarks: [],
        lastUpdated: serverTimestamp(),
        isPinned: false,
        isLocked: false,
      };

      const postsRef = collection(
        db,
        "communities",
        category,
        "items",
        id,
        "posts",
      );
      const newPostDoc = await addDoc(postsRef, postData);
      await updateDoc(newPostDoc, { id: newPostDoc.id });

      const userPostRef = collection(db, "users", currentUser.uid, "posts");
      await addDoc(userPostRef, {
        postId: newPostDoc.id,
        communityId: id,
        createdAt: serverTimestamp(),
        ...postData,
      });

      await sendCommunityNotification(id, postData, newPostDoc.id);

      setPostContent("");
      setProjectName("");
      setPostTags([]);
      setPostType("general");
      setPostFiles([]);
      setPostImages([]);
      setShowCreatePost(false);
      setIsUploading(false);

      alert(t("communityPage.postPublished"));
    } catch (error) {
      console.error("Error saving post:", error);
      alert(`${t("communityPage.postError")}: ${error.message}`);
      setIsUploading(false);
    }
  };

  const sendCommunityNotification = async (communityId, postData, postId) => {
    console.log("🔔 sendCommunityNotification STARTED");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("❌ No current user");
        return false;
      }

      const communityRef = doc(
        db,
        "communities",
        category,
        "items",
        communityId,
      );
      const communityDoc = await getDoc(communityRef);

      if (!communityDoc.exists()) {
        console.log("❌ Community not found");
        return false;
      }

      const communityMembers = communityDoc.data().members || [];
      console.log("👥 Community members:", communityMembers.length);

      const recipients = communityMembers.filter(
        (memberId) => memberId !== currentUser.uid,
      );

      if (recipients.length === 0) {
        console.log("⚠️ No recipients to notify");
        return false;
      }

      const senderName =
        postData.authorName || currentUser.displayName || "Someone";
      const communityName = communityDoc.data().name || "Community";

      let notificationBody = "";
      let icon = "";
      let priority = "normal";

      switch (postData.type) {
        case "project":
          notificationBody = `📁 New project: ${postData.title || postData.projectName || "New project"}`;
          icon = "📁";
          priority = "high";
          break;
        case "job":
          notificationBody = `💼 New job opportunity: ${postData.title || "Job offer"}`;
          icon = "💼";
          priority = "high";
          break;
        case "question":
          notificationBody = `❓ New question: ${postData.content?.substring(0, 80) || "New question"}...`;
          icon = "❓";
          break;
        default:
          notificationBody = `📝 New post: ${postData.content?.substring(0, 80) || "New post"}...`;
          icon = "📝";
      }

      if (postData.content && postData.content.length > 100) {
        notificationBody = notificationBody.substring(0, 97) + "...";
      }

      for (const recipientId of recipients) {
        try {
          const settingsRef = doc(db, "users", recipientId, "settings", "data");
          const settingsDoc = await getDoc(settingsRef);
          const settings = settingsDoc.exists() ? settingsDoc.data() : {};

          const notificationsEnabled =
            settings.notifications?.communityActivity !== false;
          const pushEnabled =
            settings.notifications?.pushNotifications !== false;

          if (!notificationsEnabled) {
            console.log(
              `🔕 User ${recipientId} has community notifications disabled`,
            );
            continue;
          }

          const notificationRef = doc(
            db,
            "users",
            recipientId,
            "notifications",
            "list",
          );
          const notificationDoc = await getDoc(notificationRef);

          const newNotification = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: `${icon} ${senderName} in r/${communityName}`,
            body: notificationBody,
            timestamp: new Date(),
            read: false,
            type: "community_post",
            priority: priority,
            data: {
              communityId: communityId,
              communityName: communityName,
              postId: postId,
              postType: postData.type,
              senderId: currentUser.uid,
              senderName: senderName,
              category: category,
            },
          };

          if (notificationDoc.exists()) {
            const currentNotifications =
              notificationDoc.data().notifications || [];
            const updatedNotifications = [
              newNotification,
              ...currentNotifications,
            ].slice(0, 100);
            await updateDoc(notificationRef, {
              notifications: updatedNotifications,
            });
            console.log(`✅ Notification sent to ${recipientId}`);
          } else {
            await setDoc(notificationRef, { notifications: [newNotification] });
            console.log(`✅ New notification doc created for ${recipientId}`);
          }

          if (
            pushEnabled &&
            document.hidden &&
            Notification.permission === "granted"
          ) {
            new Notification(`${icon} ${senderName} in r/${communityName}`, {
              body: notificationBody,
              icon: "/vite.svg",
              data: {
                communityId: communityId,
                postId: postId,
                url: `/community/${category}/${communityId}`,
              },
            });
          }
        } catch (err) {
          console.error(`❌ Error for ${recipientId}:`, err);
        }
      }

      console.log(
        `✅ Successfully sent notifications to ${recipients.length} members`,
      );
      return true;
    } catch (error) {
      console.error("❌ Error in sendCommunityNotification:", error);
      return false;
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years}y`;
    if (months > 0) return `${months}mo`;
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 50 * 1024 * 1024;

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isWithinSizeLimit = file.size <= MAX_SIZE;

      if (!isImage && !isVideo) {
        alert(t("communityPage.invalidFileType", { fileName: file.name }));
        return false;
      }

      if (!isWithinSizeLimit) {
        alert(t("communityPage.fileTooLarge", { fileName: file.name }));
        return false;
      }

      return true;
    });

    setPostFiles((prev) => [...prev, ...validFiles]);

    const filePreviews = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
      file,
    }));

    setPostImages((prev) => [...prev, ...filePreviews]);
    e.target.value = "";
  };

  const handleDeleteImage = (index) => {
    URL.revokeObjectURL(postImages[index].url);
    setPostFiles((prev) => prev.filter((_, i) => i !== index));
    setPostImages((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      postImages.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, [postImages]);

  const saveDraft = () => {
    if (postContent.trim() || postImages.length > 0) {
      const draft = {
        content: postContent,
        projectName: projectName,
        tags: postTags,
        type: postType,
        images: postImages,
        files: postFiles,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`post_draft_${id}`, JSON.stringify(draft));
      setShowDraftAlert(true);
      setTimeout(() => setShowDraftAlert(false), 3000);
    }
  };

  useEffect(() => {
    const draftData = localStorage.getItem(`post_draft_${id}`);
    if (draftData) {
      const draft = JSON.parse(draftData);
      setPostDraft(draft);
    }
  }, [id]);

  const loadDraft = () => {
    if (postDraft) {
      setPostContent(postDraft.content);
      setProjectName(postDraft.projectName);
      setPostTags(postDraft.tags);
      setPostType(postDraft.type);
      setPostImages(postDraft.images);
      setPostFiles(postDraft.files);
      setShowCreatePost(true);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(`post_draft_${id}`);
    setPostDraft(null);
  };

  const toggleCreatePostPanel = () => {
    setShowCreatePost(!showCreatePost);
    if (!showCreatePost && postDraft) {
      loadDraft();
    }
  };

  const toggleRightSidebar = () => {
    setIsRightSidebarOpen(!isRightSidebarOpen);
  };

  const handleSortChange = (sortType) => {
    setActiveSort(sortType);
    setShowSortDropdown(false);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
  };

  if (languageLoading) {
    return (
      <div
        className={`min-h-screen ${getBgColor()} flex items-center justify-center`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${getBgColor()} ${getTextColor()} transition-colors duration-300`}>
      {showDraftAlert && (
        <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
          <div
            className={`${getCardBg()} p-4 rounded-xl shadow-2xl border ${getBorderColor()}`}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">💾</div>
              <div>
                <div className={`font-semibold ${getTextColor()}`}>
                  Draft Saved
                </div>
                <div className={`text-sm ${getSecondaryTextColor()}`}>
                  Your post has been saved as draft
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex pt-12 lg:pt-0">
        <Sidebar themeMode={themeMode} />

        <div className="flex-1 flex flex-col lg:flex-row pt-10 justify-center">
          <div className="flex-1 max-w-7xl w-full px-2 lg:px-5 py-2 lg:py-6">
            <div
              className={`w-full h-40 lg:h-60 relative rounded-t-xl overflow-hidden mb-6 shadow-lg ${getCardBg()} transition-colors duration-300`}>
              <img
                src={communityData?.bannerURL || "/default-banner.jpg"}
                className="w-full h-full object-cover"
                alt={t("communityPage.communityBanner")}
              />
              <div className="absolute bottom-0 left-0 right-0 h-24 lg:h-32 bg-gradient-to-t from-gray-900 to-transparent"></div>
              <div className="absolute bottom-4 lg:bottom-6 left-6 lg:left-8 flex items-end">
                <img
                  src={communityData?.logoURL || "/default-avatar.png"}
                  className="w-16 h-16 lg:w-24 lg:h-24 rounded-full border-4 lg:border-4 border-cyan-500 object-cover shadow-lg"
                  alt={t("communityPage.communityLogo")}
                />
                <div className="ml-4 lg:ml-6 mb-2 lg:mb-3">
                  <h1 className="text-2xl lg:text-4xl font-bold text-white">
                    C/{communityData?.name}
                  </h1>
                  <p className="text-gray-200 text-sm lg:text-base mt-1 max-w-2xl">
                    {communityData?.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                    <span>
                      👥 {formatNumber(communityData?.members?.length || 0)}{" "}
                      members
                    </span>
                    <span>📝 {communityStats.postsCount} posts</span>
                    <span>
                      📈 {communityStats.growthRate.toFixed(1)}% growth
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 lg:top-6 right-4 lg:right-6 flex gap-2">
                {isCreator ? (
                  <Link
                    to={`/communitySettings/${category}/${id}`}
                    className="px-4 py-2 lg:px-5 lg:py-2 text-base lg:text-lg rounded-full font-semibold transition-all duration-300 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white hover:scale-105 flex items-center gap-2">
                    <LuCrown className="text-yellow-400" />
                    <span>Owner</span>
                    <RiSettingsLine className="ml-1" />
                  </Link>
                ) : (
                  <button
                    onClick={handleJoinCommunity}
                    className={`px-4 py-2 lg:px-5 lg:py-2 text-base lg:text-lg rounded-full font-semibold transition-all duration-300 ${
                      isJoined
                        ? `${getCardBg()} ${getTextColor()} border-2 ${getBorderColor()} hover:scale-105`
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-105"
                    }`}>
                    {isJoined ? (
                      <span className="flex items-center gap-2">
                        <RiUserFollowLine /> Joined
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <RiUserAddLine /> Join
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {isMobile && (
              <button
                onClick={toggleRightSidebar}
                className={`w-full ${getCardBg()} p-3 rounded-xl mb-4 flex items-center justify-between ${getBorderColor()} border shadow-md`}>
                <span className={`font-semibold ${getTextColor()}`}>
                  Community Info
                </span>
                <span className={getSecondaryTextColor()}>
                  {isRightSidebarOpen ? "▲" : "▼"}
                </span>
              </button>
            )}

            {isMobile && isRightSidebarOpen && (
              <div
                className={`w-full  mb-5 animate-fade-in transition-all duration-300`}>
                <div
                  className={`${getCardBg()} rounded-xl overflow-hidden mb-4 shadow-md transition-colors duration-300`}>
                  <div className="p-4 lg:p-5">
                    <div className="flex items-center -mt-12 mb-4">
                      <img
                        src={communityData?.logoURL || "/default-avatar.png"}
                        className="w-14 h-14 mt-15 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-md"
                        alt={t("communityPage.communityLogo")}
                      />
                      <h2
                        className={`ml-4 text-xl font-semibold ${getTextColor()} transition-colors duration-300`}>
                        r/{communityData?.name}
                      </h2>
                    </div>
                    <p
                      className={`text-sm ${getSecondaryTextColor()} mb-5 transition-colors duration-300`}>
                      {communityData?.description ||
                        t("communityPage.defaultDescription")}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div
                        className={`${getInputBg()} p-3 rounded-lg transition-colors duration-300`}>
                        <div
                          className={`text-xl font-bold ${getTextColor()} transition-colors duration-300`}>
                          {formatNumber(communityData?.members?.length || 0)}
                        </div>
                        <div
                          className={`text-xs ${getSecondaryTextColor()} transition-colors duration-300`}>
                          {t("communityPage.members")}
                        </div>
                      </div>
                      <div
                        className={`${getInputBg()} p-3 rounded-lg transition-colors duration-300`}>
                        <div
                          className={`text-xl font-bold ${getTextColor()} transition-colors duration-300`}>
                          {communityData?.online || 0}
                        </div>
                        <div
                          className={`text-xs ${getSecondaryTextColor()} transition-colors duration-300`}>
                          {t("communityPage.online")}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-sm ${getSecondaryTextColor()} mb-5 transition-colors duration-300`}>
                      {t("communityPage.created")}{" "}
                      {communityData?.createdAt
                        ? new Date(
                            communityData.createdAt.seconds * 1000,
                          ).toLocaleDateString()
                        : "N/A"}
                    </div>
                    {isCreator ? (
                      <Link
                        to={`/communitySettings/${category}/${id}/`}
                        className={`w-full py-3 text-base rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center gap-2`}>
                        <LuCrown className="text-yellow-400" />
                        <span>Owner Settings</span>
                        <RiSettingsLine />
                      </Link>
                    ) : (
                      <button
                        onClick={handleJoinCommunity}
                        className={`w-full py-3 text-base rounded-xl font-semibold transition-all duration-300 ${
                          isJoined
                            ? `${getInputBg()} ${getTextColor()} border ${getBorderColor()}`
                            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        }`}>
                        {isJoined
                          ? t("communityPage.joined")
                          : t("communityPage.joinCommunity")}
                      </button>
                    )}
                  </div>
                </div>
                <div
                  className={`${getCardBg()} rounded-xl p-4 shadow-md mb-4 transition-colors duration-300`}>
                  <h3
                    className={`font-semibold text-lg mb-3 ${getTextColor()} transition-colors duration-300`}>
                    {t("communityPage.about")}
                  </h3>
                  <p
                    className={`text-sm ${getSecondaryTextColor()} transition-colors duration-300`}>
                    {communityData?.fullDescription ||
                      communityData?.description ||
                      t("communityPage.defaultDescription")}
                  </p>
                  {trendingTags.length > 0 && (
                    <div className="mt-4">
                      <h4
                        className={`text-sm font-semibold ${getSecondaryTextColor()} mb-2`}>
                        Trending Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {trendingTags.slice(0, 5).map((tag, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full ${getInputBg()} ${getSecondaryTextColor()}`}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-8/12">
                <div className="w-full flex flex-col gap-6">
                  {currentUser &&
                    !showCreatePost &&
                    (isJoined || isCreator) && (
                      <div
                        className={`${getCardBg()} rounded-2xl shadow-lg p-5 border ${getBorderColor()} transition-colors duration-300`}>
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              profile?.ProfileImageURL || "/default-avatar.png"
                            }
                            alt={t("communityPage.profile")}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-700 shadow-md"
                          />
                          <button
                            onClick={toggleCreatePostPanel}
                            className={`flex-1 text-left p-4 ${getInputBg()} rounded-xl ${getHoverColor()} transition-colors duration-300 ${getSecondaryTextColor()} text-base`}>
                            {t("communityPage.sharePlaceholder")}
                          </button>
                        </div>
                        {postDraft && (
                          <div className="mt-3 flex items-center gap-2">
                            <span
                              className={`text-sm ${getSecondaryTextColor()}`}>
                              💾 Draft available
                            </span>
                            <button
                              onClick={loadDraft}
                              className={`text-sm ${getPrimaryColor()} hover:underline`}>
                              Load draft
                            </button>
                            <button
                              onClick={clearDraft}
                              className={`text-sm text-red-500 hover:underline`}>
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  {currentUser && showCreatePost && (isJoined || isCreator) && (
                    <div
                      className={`${getCardBg()} rounded-2xl shadow-xl p-5 border ${getBorderColor()} relative transition-colors duration-300`}>
                      <button
                        onClick={() => {
                          saveDraft();
                          toggleCreatePostPanel();
                        }}
                        className={`absolute top-5 right-5 ${getSecondaryTextColor()} hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-300`}>
                        <RiCloseLine size={28} />
                      </button>

                      <h2
                        className={`text-xl lg:text-2xl font-bold mb-5 ${getTextColor()} transition-colors duration-300`}>
                        {t("communityPage.createPost")}
                      </h2>

                      <div className="flex items-start gap-5">
                        <img
                          src={
                            profile?.ProfileImageURL || "/default-avatar.png"
                          }
                          alt={t("communityPage.profile")}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-700 shadow-md"
                        />

                        <div className="flex-1">
                          <textarea
                            rows={5}
                            placeholder={t("communityPage.contentPlaceholder")}
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            className={`w-full p-4 border ${getBorderColor()} rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none ${getTextColor()} ${getInputBg()} placeholder-gray-500 dark:placeholder-gray-400 text-base transition-colors duration-300`}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <label
                                className={`block text-base font-medium ${getTextColor()} mb-2 transition-colors duration-300`}>
                                {t("communityPage.projectTitle")}
                              </label>
                              <input
                                type="text"
                                placeholder={t(
                                  "communityPage.projectTitlePlaceholder",
                                )}
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className={`w-full p-3 border ${getBorderColor()} rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 ${getTextColor()} ${getInputBg()} text-base transition-colors duration-300`}
                              />
                            </div>

                            <div>
                              <label
                                className={`block text-base font-medium ${getTextColor()} mb-2 transition-colors duration-300`}>
                                {t("communityPage.tags")}
                              </label>
                              <input
                                type="text"
                                placeholder={t("communityPage.tagsPlaceholder")}
                                value={postTags.join(", ")}
                                onChange={(e) => {
                                  const tagsArray = e.target.value
                                    .split(",")
                                    .map((tag) => tag.trim())
                                    .filter((tag) => tag.length > 0);
                                  setPostTags(tagsArray);
                                }}
                                className={`w-full p-3 border ${getBorderColor()} rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 ${getTextColor()} ${getInputBg()} text-base transition-colors duration-300`}
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label
                              className={`block text-base font-medium ${getTextColor()} mb-2 transition-colors duration-300`}>
                              {t("communityPage.postType")}
                            </label>
                            <select
                              className={`w-full p-3 border ${getBorderColor()} rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 ${getTextColor()} ${getInputBg()} text-base transition-colors duration-300`}
                              value={postType}
                              onChange={(e) => setPostType(e.target.value)}>
                              <option value="general">
                                📝 {t("communityPage.generalPost")}
                              </option>
                              <option value="project">
                                📁 {t("communityPage.project")}
                              </option>
                              <option value="job">
                                💼 {t("communityPage.jobOffer")}
                              </option>
                              <option value="question">
                                ❓ {t("communityPage.question")}
                              </option>
                            </select>
                          </div>

                          <div className="mt-5">
                            <label
                              className={`cursor-pointer inline-flex items-center gap-3 px-5 py-3 ${getInputBg()} rounded-xl ${getHoverColor()} transition-colors duration-300 text-base`}>
                              <RiImageLine size={24} />
                              {t("communityPage.addMedia")}
                              <input
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                              />
                            </label>

                            {isUploading && (
                              <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                  <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                                <p
                                  className={`text-sm ${getSecondaryTextColor()} mt-1`}>
                                  Uploading... {Math.round(uploadProgress)}%
                                </p>
                              </div>
                            )}

                            {postImages.length > 0 && (
                              <div className="mt-4">
                                <h4
                                  className={`text-base font-medium ${getTextColor()} mb-3 transition-colors duration-300`}>
                                  {t("communityPage.mediaPreview")}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {postImages.map((item, index) => (
                                    <div key={index} className="relative group">
                                      {item.type === "video" ? (
                                        <video
                                          src={item.url}
                                          controls
                                          className="w-full h-40 object-cover rounded-lg"
                                        />
                                      ) : (
                                        <img
                                          src={item.url}
                                          alt={`${t("communityPage.preview")} ${index}`}
                                          className="w-full h-40 object-cover rounded-lg"
                                        />
                                      )}
                                      <button
                                        onClick={() => handleDeleteImage(index)}
                                        className="absolute top-2 right-2 bg-red-500 rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors">
                                        <RiCloseLine
                                          size={16}
                                          className="text-white"
                                        />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between gap-4 mt-6">
                            <button
                              onClick={saveDraft}
                              className={`px-6 py-2 rounded-xl font-medium border ${getBorderColor()} ${getTextColor()} ${getHoverColor()} transition-colors duration-300 text-base flex items-center gap-2`}>
                              💾 Save Draft
                            </button>
                            <div className="flex gap-4">
                              <button
                                onClick={() => {
                                  saveDraft();
                                  toggleCreatePostPanel();
                                }}
                                className={`px-6 py-2 rounded-xl font-medium border ${getBorderColor()} ${getTextColor()} ${getHoverColor()} transition-colors duration-300 text-base`}>
                                {t("communityPage.cancel")}
                              </button>
                              <button
                                onClick={savePost}
                                disabled={
                                  (!postContent && postImages.length === 0) ||
                                  isUploading
                                }
                                className={`px-6 py-2 rounded-xl font-semibold shadow-md transition-all duration-300 text-base ${
                                  (!postContent && postImages.length === 0) ||
                                  isUploading
                                    ? `${getInputBg()} ${getSecondaryTextColor()} cursor-not-allowed`
                                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-105"
                                }`}>
                                {isUploading
                                  ? "Uploading..."
                                  : t("communityPage.publish")}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className={`${getCardBg()} rounded-xl p-4 mb-5 flex flex-wrap items-center gap-3 border ${getBorderColor()} shadow-md transition-colors duration-300`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className={`px-4 py-2 text-base font-semibold rounded-lg transition-all duration-300 ${
                          activeSort === "hot"
                            ? `${getInputBg()} ${getPrimaryColor()}`
                            : `${getHoverColor()}`
                        }`}
                        onClick={() => handleSortChange("hot")}>
                        <RiFireLine className="inline mr-1" />{" "}
                        {t("communityPage.hot")}
                      </button>
                      <button
                        className={`px-4 py-2 text-base font-semibold rounded-lg transition-all duration-300 ${
                          activeSort === "new"
                            ? `${getInputBg()} ${getPrimaryColor()}`
                            : `${getHoverColor()}`
                        }`}
                        onClick={() => handleSortChange("new")}>
                        <RiTimeLine className="inline mr-1" />{" "}
                        {t("communityPage.new")}
                      </button>
                      <button
                        className={`px-4 py-2 text-base font-semibold rounded-lg transition-all duration-300 ${
                          activeSort === "top"
                            ? `${getInputBg()} ${getPrimaryColor()}`
                            : `${getHoverColor()}`
                        }`}
                        onClick={() => handleSortChange("top")}>
                        {t("communityPage.top")}
                      </button>
                    </div>

                    <div className="flex-1"></div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`pl-10 pr-4 py-2 ${getInputBg()} rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 ${getTextColor()} text-base w-48 lg:w-64 transition-colors duration-300`}
                      />
                      <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>

                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className={`p-2 rounded-xl ${getHoverColor()} transition-colors duration-300 relative`}>
                      <RiFilterLine size={20} />
                      {selectedFilter !== "all" && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </button>

                    {showFilterDropdown && (
                      <div
                        className={` w-full ${getCardBg()} rounded-xl shadow-2xl p-2 border ${getBorderColor()} z-50 min-w-[150px]`}>
                        <button
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-300 ${
                            selectedFilter === "all"
                              ? getInputBg()
                              : getHoverColor()
                          }`}
                          onClick={() => handleFilterChange("all")}>
                          All Posts
                        </button>
                        <button
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-300 ${
                            selectedFilter === "media"
                              ? getInputBg()
                              : getHoverColor()
                          }`}
                          onClick={() => handleFilterChange("media")}>
                          🖼️ Media
                        </button>
                        <button
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-300 ${
                            selectedFilter === "text"
                              ? getInputBg()
                              : getHoverColor()
                          }`}
                          onClick={() => handleFilterChange("text")}>
                          📝 Text
                        </button>
                        <button
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-300 ${
                            selectedFilter === "questions"
                              ? getInputBg()
                              : getHoverColor()
                          }`}
                          onClick={() => handleFilterChange("questions")}>
                          ❓ Questions
                        </button>
                        <button
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-300 ${
                            selectedFilter === "projects"
                              ? getInputBg()
                              : getHoverColor()
                          }`}
                          onClick={() => handleFilterChange("projects")}>
                          📁 Projects
                        </button>
                        <button
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-300 ${
                            selectedFilter === "jobs"
                              ? getInputBg()
                              : getHoverColor()
                          }`}
                          onClick={() => handleFilterChange("jobs")}>
                          💼 Jobs
                        </button>
                      </div>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500" />
                    </div>
                  ) : sortedPosts.length > 0 ? (
                    <>
                      {sortedPosts.map((post) => {
                        const commentsCount =
                          post.commentsCount || post.comments?.length || 0;

                        return (
                          <CommunityPostCard
                            key={post.id}
                            post={{
                              id: post.id,
                              content: post.content,
                              projectName: post.title || post.projectName,
                              tags: post.tags,
                              type: post.type,
                              images: post.images,
                              createdAt: post.createdAt,
                              creatorName: post.authorName,
                              profileImage: post.authorAvatar,
                              createdBy: post.createdBy,
                              userId: post.authorId,
                              likes: post.likes || [],
                              dislikes: post.dislikes || [],
                              comments: post.comments || [],
                              commentsCount: commentsCount,
                              views: post.views || 0,
                              communityData: communityData,
                              isBookmarked: bookmarkedPosts.includes(post.id),
                              trendingScore: trendingScore[post.id]?.hot || 0,
                              category: category,
                              communityId: id,
                              communityName: communityData?.name,
                            }}
                            themeMode={themeMode}
                            onBookmark={handleBookmark}
                            onPostDeleted={(postId) => {
                              setPosts((prevPosts) =>
                                prevPosts.filter((p) => p.id !== postId),
                              );
                            }}
                          />
                        );
                      })}

                      {hasMorePosts && (
                        <div className="flex justify-center mt-6 mb-8">
                          <button
                            onClick={() => setHasMorePosts(false)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold flex items-center justify-center text-base transition-all duration-300 hover:scale-105">
                            {isLoadingMore ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2" />
                                {t("communityPage.loading")}...
                              </>
                            ) : (
                              t("communityPage.loadMore")
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      className={`${getCardBg()} rounded-xl p-12 text-center shadow-md transition-colors duration-300`}>
                      <div className="text-6xl mb-4">📭</div>
                      <p
                        className={`${getSecondaryTextColor()} text-lg transition-colors duration-300`}>
                        {searchQuery
                          ? "No posts match your search"
                          : t("communityPage.noPosts")}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={toggleCreatePostPanel}
                          className={`mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105`}>
                          <RiAddLine className="inline mr-2" />
                          Create First Post
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!isMobile && (
                <div
                  className={`w-full lg:w-4/12 lg:pl-4 transition-colors duration-300`}>
                  <div
                    className={`${getCardBg()} rounded-xl overflow-hidden mb-6 shadow-lg transition-colors duration-300`}>
                    <div className="p-5">
                      <div className="flex items-center  mb-4">
                        <img
                          src={communityData?.logoURL || "/default-avatar.png"}
                          className="w-14 h-14 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-md"
                          alt={t("communityPage.communityLogo")}
                        />
                        <h2
                          className={`ml-4 text-xl font-semibold ${getTextColor()} transition-colors duration-300`}>
                          C/{communityData?.name}
                        </h2>
                      </div>
                      <p
                        className={`text-sm ${getSecondaryTextColor()} mb-5 transition-colors duration-300`}>
                        {communityData?.description ||
                          t("communityPage.defaultDescription")}
                      </p>
                      <div
                        className={`text-sm ${getSecondaryTextColor()} mb-5 transition-colors duration-300`}>
                        {t("communityPage.created")}{" "}
                        {communityData?.createdAt
                          ? new Date(
                              communityData.createdAt.seconds * 1000,
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                      {isCreator ? (
                        <Link
                          to={`/communitySettings/${category}/${id}/`}
                          className={`w-full py-3 text-base rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white flex items-center justify-center gap-2`}>
                          <LuCrown className="text-yellow-400" />
                          <span>Owner Settings</span>
                          <RiSettingsLine />
                        </Link>
                      ) : (
                        <button
                          onClick={handleJoinCommunity}
                          className={`w-full py-3 text-base rounded-xl font-semibold transition-all duration-300 ${
                            isJoined
                              ? `${getInputBg()} ${getTextColor()} border ${getBorderColor()}`
                              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          }`}>
                          {isJoined
                            ? t("communityPage.joined")
                            : t("communityPage.joinCommunity")}
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    className={`${getCardBg()} rounded-xl p-5 mb-6 shadow-md transition-colors duration-300`}>
                    <h3
                      className={`font-semibold text-xl mb-4 ${getTextColor()} transition-colors duration-300`}>
                      📊 Community Stats
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={getSecondaryTextColor()}>
                          Total Posts
                        </span>
                        <span className={`font-semibold ${getTextColor()}`}>
                          {communityStats.postsCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={getSecondaryTextColor()}>
                          Active Users
                        </span>
                        <span className={`font-semibold ${getTextColor()}`}>
                          {communityStats.activeUsers}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={getSecondaryTextColor()}>
                          Growth Rate
                        </span>
                        <span className={`font-semibold ${getTextColor()}`}>
                          {communityStats.growthRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {trendingTags.length > 0 && (
                    <div
                      className={`${getCardBg()} rounded-xl p-5 shadow-md transition-colors duration-300`}>
                      <h3
                        className={`font-semibold text-xl mb-4 ${getTextColor()} transition-colors duration-300`}>
                        🔥 Trending Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {trendingTags.map((tag, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 ${getInputBg()} rounded-full text-sm ${getSecondaryTextColor()} cursor-pointer hover:${getHoverColor()} transition-colors duration-300`}
                            onClick={() => setSearchQuery(`#${tag}`)}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <RightSideBar themeMode={themeMode} />
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
