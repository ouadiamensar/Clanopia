/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import Sidebar from "./Sidebar";
import { useParams } from "react-router-dom";
import PostCard from "./smallComp/PostCard";
import { Link } from "react-router-dom";
import { FiEdit } from "react-icons/fi";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaGithub,
  FaLinkedin,
  FaGlobe,
  FaBriefcase,
  FaGraduationCap,
  FaLanguage,
  FaStar,
  FaUserAlt,
  FaUserPlus,
  FaRegHeart,
  FaRegCommentDots,
  FaRegShareSquare,
  FaUsers,
} from "react-icons/fa";
import { MdOutlineInterests } from "react-icons/md";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  serverTimestamp,
  updateDoc,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  where,
} from "firebase/firestore";
import RightSideBar from "./RightSideBar";
import { useLanguage } from "../context/LanguageContext";
import unvisible from "../assets/unvisible2.png";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollower, setIsFollower] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [postFiles, setPostFiles] = useState([]);
  const [postImages, setPostImages] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [projectName, setProjectName] = useState("");
  const [postTags, setPostTags] = useState([]);
  const [postType, setPostType] = useState("general");
  const [userPosts, setUserPosts] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isMedium, setIsMedium] = useState(
    window.innerWidth < 1428 && window.innerWidth > 768,
  );
  const [privacy, setPrivacy] = useState({
    messagePrivacy: "",
    profileVisibility: "",
  });
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
  const [showFollowersTooltip, setShowFollowersTooltip] = useState(false);
  const [showFollowingTooltip, setShowFollowingTooltip] = useState(false);
  const [followersDetails, setFollowersDetails] = useState([]);
  const [followingDetails, setFollowingDetails] = useState([]);
  const navigate = useNavigate();

  const toggleCreatePostPanel = () => {
    setShowCreatePost(!showCreatePost);
  };

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
  const getShadow = () =>
    themeMode === "light" ? "shadow-md" : "shadow-neumorph-dark";
  const getInnerShadow = () =>
    themeMode === "light" ? "shadow-sm" : "shadow-neumorph-dark-inner";
  const getHoverShadow = () =>
    themeMode === "light"
      ? "hover:shadow-lg"
      : "hover:shadow-neumorph-dark-hover";
  const getButtonBg = () =>
    themeMode === "light" ? "bg-gray-200" : "bg-[#222223]";
  const getButtonHover = () =>
    themeMode === "light" ? "hover:bg-gray-300" : "hover:bg-[#29292a]";
  const getIconColor = () =>
    themeMode === "light" ? "text-gray-700" : "text-gray-300";
  const getGradientFrom = () =>
    themeMode === "light" ? "from-purple-500" : "from-purple-600";
  const getGradientTo = () =>
    themeMode === "light" ? "to-blue-500" : "to-blue-600";
  const getGradientHoverFrom = () =>
    themeMode === "light" ? "from-purple-600" : "from-purple-700";
  const getGradientHoverTo = () =>
    themeMode === "light" ? "to-blue-600" : "to-blue-700";
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMedium(window.innerWidth < 1428 && window.innerWidth > 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchUsersDetails = async (userIds) => {
    if (!userIds || userIds.length === 0) return [];

    const details = [];
    for (const userId of userIds) {
      try {
        const profileRef = doc(db, "users", userId, "profile", "data");
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          details.push({
            id: userId,
            name: data.name || "Unknown",
            image: data.ProfileImageURL || "/default-avatar.png",
          });
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }
    return details;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return setProfile(null);

      try {
        const profileRef = doc(db, "users", id, "profile", "data");
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile(data);
          setFollowers(data.followers || []);
          setFollowing(data.following || []);

          if (data.followers && data.followers.length > 0) {
            const details = await fetchUsersDetails(data.followers);
            setFollowersDetails(details);
          }
          if (data.following && data.following.length > 0) {
            const details = await fetchUsersDetails(data.following);
            setFollowingDetails(details);
          }

          if (
            auth.currentUser &&
            data.followers?.includes(auth.currentUser.uid)
          ) {
            setIsFollowing(true);
          }
        } else {
          setProfile(null);
        }

        const postsRef = collection(
          db,
          "users",
          id,
          "profile",
          "data",
          "posts",
        );
        const postsQuery = query(postsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(postsQuery);
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          createdAt: doc.data().createdAt || new Date(),
          ...doc.data(),
        }));
        setUserPosts(postsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const checkIsFollower = async () => {
      try {
        const profileRef = doc(
          db,
          "users",
          auth.currentUser?.uid,
          "profile",
          "data",
        );
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const data = profileSnap.data();

          if (data.followers?.includes(id)) {
            setIsFollower(true);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    checkIsFollower();
    fetchData();
  }, [id, profile]);

  useEffect(() => {
    const fetchPrivacy = async () => {
      if (!id) return;
      const docRef = doc(db, "users", id, "settings", "data");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const privacyData = docSnap.data().privacy;
        if (privacyData) {
          setPrivacy({
            messagePrivacy: privacyData?.messagePrivacy || "",
            profileVisibility: privacyData?.profileVisibility || "",
          });
        }
      }
    };
    fetchPrivacy();
  }, [id]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 50 * 1024 * 1024;

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isWithinSizeLimit = file.size <= MAX_SIZE;

      if (!isImage && !isVideo) {
        alert(`${file.name} is not an image or video`);
        return false;
      }

      if (!isWithinSizeLimit) {
        alert(`${file.name} exceeds maximum size (50MB)`);
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

  const uploadMedia = async (userId, postId, files) => {
    const storage = getStorage();
    const mediaUrls = [];

    for (const file of files) {
      const fileRef = ref(storage, `posts/${userId}/${postId}/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      mediaUrls.push(url);
    }

    return mediaUrls;
  };

  const savePost = async (userId, files) => {
    if (!userId) return alert("Please login first");

    try {
      if (!postContent.trim() && postImages.length === 0) {
        alert("Please add content or media to your post");
        return;
      }

      const initialPostData = {
        content: postContent.trim(),
        projectName: projectName.trim() || null,
        tags: postTags.filter((tag) => tag.trim()),
        type: postType,
        createdAt: serverTimestamp(),
        images: [],
        createdBy: auth.currentUser?.uid,
        profileImage: profile?.ProfileImageURL || null,
        creatorName: profile?.name || "Anonymous",
        likes: [],
        comments: [],
      };

      const postRef = collection(
        db,
        "users",
        userId,
        "profile",
        "data",
        "posts",
      );
      const newPostDoc = await addDoc(postRef, initialPostData);

      let mediaUrls = [];
      if (files && files.length > 0) {
        const filesToUpload = files.map((item) => item.file || item);
        mediaUrls = await uploadMedia(userId, newPostDoc.id, filesToUpload);

        await updateDoc(newPostDoc, {
          images: mediaUrls,
          hasMedia: mediaUrls.length > 0,
        });
      }

      const updatedPost = {
        id: newPostDoc.id,
        ...initialPostData,
        images: mediaUrls,
      };

      setUserPosts((prev) => [updatedPost, ...prev]);

      setPostContent("");
      setProjectName("");
      setPostTags([]);
      setPostType("general");
      setPostFiles([]);
      setPostImages([]);

      alert("Post published successfully!");
    } catch (error) {
      console.error("Error saving post:", error);
      alert(`Error saving post: ${error.message}`);
    }
  };

  const addFollower = async () => {
    try {
      const profileRef = doc(db, "users", id, "profile", "data");
      await updateDoc(profileRef, {
        followers: arrayUnion(auth.currentUser.uid),
      });

      const currentUserRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "profile",
        "data",
      );
      await updateDoc(currentUserRef, {
        following: arrayUnion(id),
      });

      setFollowers((prev) => [...prev, auth.currentUser.uid]);
      setIsFollowing(true);
    } catch (error) {
      console.error("Error adding follower:", error);
    }
  };

  const removeFollower = async () => {
    try {
      const profileRef = doc(db, "users", id, "profile", "data");
      await updateDoc(profileRef, {
        followers: arrayRemove(auth.currentUser.uid),
      });

      const currentUserRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "profile",
        "data",
      );
      await updateDoc(currentUserRef, {
        following: arrayRemove(id),
      });

      setFollowers((prev) =>
        prev.filter((uid) => uid !== auth.currentUser.uid),
      );
      setIsFollowing(false);
    } catch (error) {
      console.error("Error removing follower:", error);
    }
  };

  const handleFollow = () => {
    if (!auth.currentUser) {
      alert("Please login first");
      return;
    }

    if (isFollowing) {
      removeFollower();
    } else {
      addFollower();
    }
  };

  const handleStartNewChat = async (otherUserId) => {
    const currentUserId = auth.currentUser?.uid;

    const q = query(
      collection(db, "chats"),
      where("users", "in", [
        [currentUserId, otherUserId],
        [otherUserId, currentUserId],
      ]),
    );

    const querySnapshot = await getDocs(q);

    let chatId;

    if (!querySnapshot.empty) {
      chatId = querySnapshot.docs[0].id;
    } else {
      const chatDocRef = await addDoc(collection(db, "chats"), {
        type: "normal",
        users: [currentUserId, otherUserId],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageTime: null,
      });
      chatId = chatDocRef.id;
    }

    navigate(`/chat/${chatId}`);
  };

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

  const TooltipList = ({ users, title }) => {
    if (!users || users.length === 0) {
      return (
        <div className={`text-sm ${getSecondaryTextColor()} p-2`}>
          No {title} yet
        </div>
      );
    }
    return (
      <div className="p-2 max-h-60 overflow-y-auto">
        {users.map((user) => (
          <Link
            key={user.id}
            to={`/profile/${user.id}`}
            onClick={() => {
              setShowFollowersTooltip(false);
            }}
            className="flex items-center gap-2 p-2 rounded-lg transition-colors">
            <img
              src={user.image}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => (e.target.src = "/default-avatar.png")}
            />
            <span className={`text-sm ${getTextColor()}`}>{user.name}</span>
          </Link>
        ))}
      </div>
    );
  };

  if (!themeMode || languageLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${getBgColor()}`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <div className={getTextColor()}>
            {language === "ar" ? "جاري التحميل..." : "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex-col ${getBgColor()} ${getTextColor()} relative transition-colors duration-300`}>
      <Sidebar themeMode={themeMode} />
      <div
        className={`flex-1 flex flex-col ${
          isMobile ? "px-2 pl-2 pr-2 " : "pl-70 pr-30"
        } pt-5 animate-fade-in`}>
        {profile ? (
          <div
            className={`w-full max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in`}>
            <div
              className={`w-full rounded-3xl p-6 transition-all duration-300 ${
                isMobile && "mt-15"
              } 
              ${getCardBg()} ${getShadow()} ${getHoverShadow()} ${getBorderColor()} border`}>
              <div className="relative h-40 md:h-56 rounded-2xl overflow-hidden mb-16 md:mb-20">
                {profile.BannerImageURL ? (
                  <img
                    src={profile.BannerImageURL}
                    className="w-full h-full object-cover"
                    alt="Banner"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-r ${getGradientFrom()} ${getGradientTo()}`}></div>
                )}

                {id === auth.currentUser?.uid && (
                  <Link to={`/editProfile`}>
                    <div
                      className={`absolute top-4 right-4 ${getButtonBg()} p-2 rounded-xl ${getInnerShadow()} ${getHoverShadow()} transition-all duration-300`}>
                      <FiEdit
                        className={`w-4 h-4 md:w-5 md:h-5 ${themeMode === "light" ? "text-cyan-600" : "text-cyan-400"}`}
                      />
                    </div>
                  </Link>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center md:items-end justify-between px-4">
                <div className="flex items-center md:items-end gap-4 md:gap-6 -mt-24 md:-mt-28">
                  <div className="relative">
                    <div
                      className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl ${getCardBg()} p-1 ${getInnerShadow()}`}>
                      <img
                        src={profile.ProfileImageURL}
                        alt="Profile"
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    </div>
                  </div>

                  <div className={`text-center md:text-left mb-4 md:mb-6`}>
                    <h1
                      className={`text-2xl md:text-3xl font-bold ${getTextColor()}`}>
                      {profile.name}
                    </h1>
                    {profile.title && (
                      <p
                        className={`text-sm md:text-base ${getSecondaryTextColor()} mt-1`}>
                        {profile.title}
                      </p>
                    )}
                  </div>
                </div>

                {id !== auth.currentUser?.uid && (
                  <div>
                    <button
                      onClick={handleFollow}
                      className={`mb-4 flex items-center gap-2 px-6 py-3 rounded-xl font-semibold ${getShadow()} transition-all duration-300 text-sm md:text-base ${
                        isFollowing
                          ? `${getButtonBg()} ${getTextColor()} ${getHoverShadow()}`
                          : `bg-gradient-to-r ${getGradientFrom()} ${getGradientTo()} text-white hover:bg-gradient-to-r ${getGradientHoverFrom()} ${getGradientHoverTo()}`
                      }`}>
                      <FaUserPlus className="text-sm md:text-lg" />
                      {isFollowing ? t("following") : t("follow")}
                    </button>

                    {privacy.messagePrivacy === "anyone" && isFollowing && (
                      <Link
                        to={`/chat/${id}`}
                        onClick={() => {
                          handleStartNewChat(id);
                        }}
                        className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                          themeMode === "light"
                            ? "bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600"
                            : "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700"
                        }`}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.10M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        {t("rightSidebar.startChat")}
                      </Link>
                    )}
                    {privacy.messagePrivacy === "friends" &&
                      isFollowing &&
                      isFollower && (
                        <Link
                          to={`/chat/${id}`}
                          onClick={() => {
                            handleStartNewChat(id);
                          }}
                          className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                            themeMode === "light"
                              ? "bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600"
                              : "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700"
                          }`}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.10M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          {t("rightSidebar.startChat")}
                        </Link>
                      )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between mt-6 px-4">
                <div className="flex gap-6">
                  <div
                    className="relative text-center cursor-pointer"
                    onClick={() => {
                      if (
                        showFollowersTooltip == false ||
                        showFollowingTooltip == true
                      ) {
                        setShowFollowersTooltip(true);
                        setShowFollowingTooltip(false);
                      } else {
                        setShowFollowersTooltip(false);
                      }
                    }}>
                    <div
                      className={`text-xl md:text-2xl font-bold ${getTextColor()}`}>
                      {followers.length}
                    </div>
                    <div
                      className={`text-xs md:text-sm ${getSecondaryTextColor()}`}>
                      {t("profile.followers")}
                    </div>
                    {showFollowersTooltip && followers.length > 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                        <div
                          className={`${getCardBg()} rounded-xl ${getShadow()} border ${getBorderColor()} min-w-[200px] max-w-[250px]`}>
                          <div className={`p-2 border-b ${getBorderColor()}`}>
                            <span
                              className={`text-sm font-semibold ${getTextColor()}`}>
                              Followers ({followers.length})
                            </span>
                          </div>
                          <TooltipList
                            users={followersDetails}
                            title="followers"
                          />
                        </div>
                        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-3 h-3 rotate-45 bg-gray-800 border-r border-b border-gray-700"></div>
                      </div>
                    )}
                  </div>

                  <div
                    className="relative text-center cursor-pointer"
                    onClick={() => {
                      if (
                        showFollowingTooltip == false ||
                        showFollowersTooltip == true
                      ) {
                        setShowFollowingTooltip(true);
                        setShowFollowersTooltip(false);
                      } else {
                        setShowFollowingTooltip(false);
                      }
                    }}>
                    <div
                      className={`text-xl md:text-2xl font-bold ${getTextColor()}`}>
                      {following.length}
                    </div>
                    <div
                      className={`text-xs md:text-sm ${getSecondaryTextColor()}`}>
                      {t("profile.followingCount")}
                    </div>
                    {showFollowingTooltip && following.length > 0 && (
                      <div className="absolute bottom-full left-10 transform -translate-x-1/2 mb-2 z-50">
                        <div
                          className={`${getCardBg()} rounded-xl ${getShadow()} border ${getBorderColor()} min-w-[200px] max-w-[250px]`}>
                          <div className={`p-2 border-b ${getBorderColor()}`}>
                            <span
                              className={`text-sm font-semibold ${getTextColor()}`}>
                              Following ({following.length})
                            </span>
                          </div>
                          <TooltipList
                            users={followingDetails}
                            title="following"
                          />
                        </div>
                        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-3 h-3 rotate-45 bg-gray-800 border-r border-b border-gray-700"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 md:gap-4 mt-4 md:mt-0">
                  {profile.location && (
                    <div
                      className={`flex items-center gap-2 text-sm ${getSecondaryTextColor()} ${getCardBg()} px-3 py-2 rounded-xl ${getInnerShadow()}`}>
                      <FaMapMarkerAlt
                        className={`${themeMode === "light" ? "text-purple-600" : "text-purple-400"} text-sm`}
                      />
                      <span>{profile.location}</span>
                    </div>
                  )}

                  {profile.github && (
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm ${getSecondaryTextColor()} ${getCardBg()} px-3 py-2 rounded-xl ${getInnerShadow()} ${getHoverShadow()} transition-all`}>
                      <FaGithub className="text-lg" />
                    </a>
                  )}

                  {profile.linkedin && (
                    <a
                      href={profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm ${getSecondaryTextColor()} ${getCardBg()} px-3 py-2 rounded-xl ${getInnerShadow()} ${getHoverShadow()} transition-all`}>
                      <FaLinkedin className="text-lg" />
                    </a>
                  )}

                  {profile.portfolio && (
                    <a
                      href={profile.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm ${getSecondaryTextColor()} ${getCardBg()} px-3 py-2 rounded-xl ${getInnerShadow()} ${getHoverShadow()} transition-all`}>
                      <FaGlobe className="text-lg" />
                    </a>
                  )}
                </div>
              </div>

              {isMobile && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowMore(!showMore)}
                    className={`px-6 py-2 rounded-xl ${getButtonBg()} ${getTextColor()} font-medium ${getShadow()} ${getHoverShadow()} transition-all flex items-center gap-2`}>
                    {showMore ? (
                      <>
                        <span>{t("profile.showLess")}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>{t("profile.showMore")}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}

              {showMore && (
                <div className={`mt-8 pt-6 border-t ${getBorderColor()}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div
                      className={`${getCardBg()} p-5 rounded-2xl ${getInnerShadow()}`}>
                      <h3
                        className={`text-lg font-semibold ${getTextColor()} mb-3 flex items-center gap-2`}>
                        <FaGraduationCap
                          className={
                            themeMode === "light"
                              ? "text-purple-600"
                              : "text-purple-400"
                          }
                        />
                        {t("profile.education")}
                      </h3>
                      <p className={`text-sm ${getSecondaryTextColor()}`}>
                        {profile.education || t("profile.notSpecified")}
                      </p>
                    </div>

                    <div
                      className={`${getCardBg()} p-5 rounded-2xl ${getInnerShadow()}`}>
                      <h3
                        className={`text-lg font-semibold ${getTextColor()} mb-3 flex items-center gap-2`}>
                        <FaBriefcase
                          className={
                            themeMode === "light"
                              ? "text-purple-600"
                              : "text-purple-400"
                          }
                        />
                        {t("profile.experience")}
                      </h3>
                      <p className={`text-sm ${getSecondaryTextColor()}`}>
                        {profile.experience || t("profile.notSpecified")}
                      </p>
                    </div>

                    <div
                      className={`${getCardBg()} p-5 rounded-2xl ${getInnerShadow()}`}>
                      <h3
                        className={`text-lg font-semibold ${getTextColor()} mb-3 flex items-center gap-2`}>
                        <FaLanguage
                          className={
                            themeMode === "light"
                              ? "text-purple-600"
                              : "text-purple-400"
                          }
                        />
                        {t("profile.languages")}
                      </h3>
                      <p className={`text-sm ${getSecondaryTextColor()}`}>
                        {profile.languages || t("profile.notSpecified")}
                      </p>
                    </div>

                    <div
                      className={`${getCardBg()} p-5 rounded-2xl ${getInnerShadow()}`}>
                      <h3
                        className={`text-lg font-semibold ${getTextColor()} mb-3 flex items-center gap-2`}>
                        <MdOutlineInterests
                          className={
                            themeMode === "light"
                              ? "text-purple-600"
                              : "text-purple-400"
                          }
                        />
                        {t("profile.interests")}
                      </h3>
                      <p className={`text-sm ${getSecondaryTextColor()}`}>
                        {profile.interests || t("profile.notSpecified")}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-6 ${getCardBg()} p-5 rounded-2xl ${getInnerShadow()}`}>
                    <h3
                      className={`text-lg font-semibold ${getTextColor()} mb-3 flex items-center gap-2`}>
                      <FaStar
                        className={
                          themeMode === "light"
                            ? "text-purple-600"
                            : "text-purple-400"
                        }
                      />
                      {t("profile.skills")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(profile.skills) ? (
                        profile.skills.map((skill, index) => (
                          <span
                            key={index}
                            className={`${themeMode === "light" ? "bg-gray-200 text-gray-800" : "bg-gray-700 text-gray-300"} px-3 py-1 rounded-xl text-sm font-medium ${getInnerShadow()}`}>
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className={`text-sm ${getSecondaryTextColor()}`}>
                          {profile.skills || t("profile.notSpecified")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`mt-6 ${getCardBg()} p-5 rounded-2xl ${getInnerShadow()} lg:hidden`}>
                    <h3
                      className={`text-lg font-semibold ${getTextColor()} mb-3`}>
                      {t("profile.about")}
                    </h3>
                    <p
                      className={`text-sm ${getSecondaryTextColor()} whitespace-pre-line`}>
                      {profile?.about || t("profile.noAboutInfo")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full flex flex-col gap-6">
              {id === auth.currentUser?.uid && !showCreatePost && (
                <div
                  className={`${getCardBg()} rounded-2xl ${getShadow()} p-6`}>
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${getCardBg()} p-1 ${getInnerShadow()}`}>
                      <img
                        src={profile?.ProfileImageURL}
                        alt="Profile"
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    </div>
                    <button
                      onClick={toggleCreatePostPanel}
                      className={`flex-1 text-left p-4 ${getInputBg()} rounded-xl ${getButtonHover()} transition-colors ${getSecondaryTextColor()} ${getInnerShadow()}`}>
                      {t("profile.shareThoughts")}
                    </button>
                  </div>
                </div>
              )}

              {id === auth.currentUser?.uid && showCreatePost && (
                <div
                  className={`${getCardBg()} rounded-2xl ${getShadow()} p-6`}>
                  <h2 className={`text-xl font-bold ${getTextColor()} mb-4`}>
                    {t("profile.createNewPost")}
                  </h2>

                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${getCardBg()} p-1 ${getInnerShadow()}`}>
                      <img
                        src={profile.ProfileImageURL}
                        alt="Profile"
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <textarea
                        rows={3}
                        placeholder={t("profile.shareThoughts")}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        className={`w-full p-4 border-none rounded-2xl focus:outline-none resize-none ${getTextColor()} ${getInputBg()} placeholder-gray-500 ${getInnerShadow()} text-sm`}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <input
                          type="text"
                          placeholder={t("profile.projectTitle")}
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          className={`p-3 border-none rounded-xl focus:outline-none ${getTextColor()} ${getInputBg()} placeholder-gray-500 ${getInnerShadow()} text-sm`}
                        />

                        <input
                          type="text"
                          placeholder={t("profile.tagSkills")}
                          value={postTags.join(", ")}
                          onChange={(e) => {
                            const tagsArray = e.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter((tag) => tag.length > 0);
                            setPostTags(tagsArray);
                          }}
                          className={`p-3 border-none rounded-xl focus:outline-none ${getTextColor()} ${getInputBg()} placeholder-gray-500 ${getInnerShadow()} text-sm`}
                        />
                      </div>

                      <select
                        className={`w-full mt-3 p-3 border-none rounded-xl focus:outline-none ${getTextColor()} ${getInputBg()} ${getInnerShadow()} text-sm`}
                        value={postType}
                        onChange={(e) => setPostType(e.target.value)}>
                        <option value="general">
                          {t("profile.generalPost")}
                        </option>
                        <option value="project">{t("profile.project")}</option>
                        <option value="job">{t("profile.jobOffer")}</option>
                        <option value="question">
                          {t("profile.question")}
                        </option>
                      </select>

                      <div className="mt-4">
                        <label
                          className="cursor-pointer inline-flex items-center gap-2 text-sm"
                          style={{
                            color:
                              themeMode === "light" ? "#9333EA" : "#A78BFA",
                          }}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {t("profile.addMedia")}
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                          />
                        </label>

                        {privacy.profileVisibility == "public" && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                            {postImages.map((item, index) => (
                              <div key={index} className="relative group">
                                {item.type === "video" ? (
                                  <video
                                    src={item.url}
                                    controls
                                    className={`w-full h-fit object-cover rounded-xl ${getShadow()}`}
                                  />
                                ) : (
                                  <img
                                    src={item.url}
                                    alt={`Preview ${index}`}
                                    className={`max-w-60 h-fit object-cover rounded-xl ${getShadow()}`}
                                  />
                                )}
                                <button
                                  onClick={() => handleDeleteImage(index)}
                                  className={`absolute top-2 right-2 ${getButtonBg()} rounded-full p-1 ${getShadow()} ${getButtonHover()} transition-colors`}>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-red-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end mt-4 gap-3">
                        <button
                          onClick={toggleCreatePostPanel}
                          className={`px-5 py-2 rounded-xl font-medium ${getSecondaryTextColor()} ${getButtonBg()} ${getButtonHover()} transition-colors ${getShadow()}`}>
                          {t("profile.cancel")}
                        </button>
                        <button
                          onClick={() =>
                            savePost(auth.currentUser?.uid, postFiles)
                          }
                          disabled={!postContent && postImages.length === 0}
                          className={`px-6 py-2 rounded-xl font-medium ${getShadow()} transition-colors text-sm ${
                            !postContent && postImages.length === 0
                              ? `${getButtonBg()} ${getSecondaryTextColor()} cursor-not-allowed`
                              : `bg-gradient-to-r ${getGradientFrom()} ${getGradientTo()} hover:bg-gradient-to-r ${getGradientHoverFrom()} ${getGradientHoverTo()} text-white`
                          }`}>
                          {t("profile.publish")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={getSecondaryTextColor()}>
                {t("profile.loadingProfile")}
              </p>
            </div>
          </div>
        )}
      </div>
      {privacy.profileVisibility === "public" ||
      id === auth.currentUser?.uid ||
      isFollowing ? (
        <div className="flex flex-col mt-6 gap-6 items-center relative">
          <div className="w-full flex flex-col md:flex-row justify-center gap-6 relative">
            <div className="w-full max-w-2xl relative mb-5">
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <PostCard key={post.id} post={post} themeMode={themeMode} />
                ))
              ) : (
                <div
                  className={`${getCardBg()} rounded-2xl p-6 text-center ${getShadow()}`}>
                  <p className={getSecondaryTextColor()}>
                    {t("profile.noPosts")}
                  </p>
                  <img
                    src="https://cdni.iconscout.com/illustration/premium/thumb/uploading-file-illustration-svg-download-png-11253998.png"
                    draggable={false}
                    className="select-none mt-4 mx-auto max-w-xs"
                    alt="No posts"
                  />
                </div>
              )}
            </div>

            {!isMedium && !isMobile && (
              <div className={`mt-8 pt-6 border-t ${getBorderColor()}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div
                    className={`${getCardBg()} p-5 rounded-2xl ${getInnerShadow()}`}>
                    <h3
                      className={`text-lg font-semibold ${getTextColor()} mb-3 flex items-center gap-2`}>
                      <FaGraduationCap
                        className={
                          themeMode === "light"
                            ? "text-sky-600"
                            : "text-sky-400"
                        }
                      />
                      {t("profile.education")}
                    </h3>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>
                      {profile?.education || t("profile.notSpecified")}
                    </p>
                  </div>

                  <div
                    className={`${getCardBg()} p-5 rounded-2xl ${getInnerShadow()}`}>
                    <h3
                      className={`text-lg font-semibold ${getTextColor()} mb-3 flex items-center gap-2`}>
                      <FaBriefcase
                        className={
                          themeMode === "light"
                            ? "text-sky-600"
                            : "text-sky-400"
                        }
                      />
                      {t("profile.experience")}
                    </h3>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>
                      {profile?.experience || t("profile.notSpecified")}
                    </p>
                  </div>

                  <div
                    className={`${getCardBg()} p-5 rounded-2xl ${getInnerShadow()}`}>
                    <h3
                      className={`text-lg font-semibold ${getTextColor()} mb-3 flex items-center gap-2`}>
                      <FaLanguage
                        className={
                          themeMode === "light"
                            ? "text-sky-600"
                            : "text-sky-400"
                        }
                      />
                      {t("profile.languages")}
                    </h3>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>
                      {profile?.languages || t("profile.notSpecified")}
                    </p>
                  </div>

                  <div
                    className={`${getCardBg()} p-5 rounded-2xl ${getInnerShadow()}`}>
                    <h3
                      className={`text-lg font-semibold ${getTextColor()} mb-3 flex items-center gap-2`}>
                      <MdOutlineInterests
                        className={
                          themeMode === "light"
                            ? "text-sky-600"
                            : "text-sky-400"
                        }
                      />
                      {t("profile.interests")}
                    </h3>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>
                      {profile?.interests || t("profile.notSpecified")}
                    </p>
                  </div>
                </div>

                <div
                  className={`mt-6 ${getCardBg()} p-5 rounded-2xl ${getInnerShadow()}`}>
                  <h3
                    className={`text-lg font-semibold ${getTextColor()} mb-3 flex items-center gap-2`}>
                    <FaStar
                      className={
                        themeMode === "light" ? "text-sky-600" : "text-sky-400"
                      }
                    />
                    {t("profile.skills")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(profile?.skills) ? (
                      profile?.skills.map((skill, index) => (
                        <span
                          key={index}
                          className={`${themeMode === "light" ? "bg-gray-200 text-gray-800" : "bg-gray-700 text-gray-300"} px-3 py-1 rounded-xl text-sm font-medium ${getInnerShadow()}`}>
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className={`text-sm ${getSecondaryTextColor()}`}>
                        {profile?.skills || t("profile.notSpecified")}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`mt-6 ${getCardBg()} p-5 rounded-2xl ${getInnerShadow()}`}>
                  <h3
                    className={`text-lg font-semibold ${getTextColor()} mb-3`}>
                    {t("profile.aboutMe")}
                  </h3>
                  <p
                    className={`text-sm ${getSecondaryTextColor()} whitespace-pre-line`}>
                    {profile?.about || t("profile.noAboutInfo")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className=" w-full justify-center ">
          <img className=" justify-center m-auto max-w-60" src={unvisible} />
        </div>
      )}
      <RightSideBar themeMode={themeMode} />
    </div>
  );
};

export default Profile;
