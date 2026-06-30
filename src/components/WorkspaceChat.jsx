/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import WorkspaceSideMenu from "./WorkspaceSideMenu.jsx";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  addDoc,
  orderBy,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { Link, useParams } from "react-router-dom";
import {
  FiSend,
  FiPaperclip,
  FiSmile,
  FiBell,
  FiSearch,
  FiEdit,
  FiUser,
  FiLogOut,
  FiPlus,
  FiDownload,
  FiExternalLink,
  FiX,
  FiMenu,
  FiHash,
  FiAtSign,
  FiSettings,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { BsStar, BsPin, BsStarFill, BsPinFill } from "react-icons/bs";
import { Avatar, Badge, Tooltip } from "@mui/material";
import EmojiPicker from "emoji-picker-react";
import CreatNewChannel from "./CreatNewChannel";
import { IoIosImages } from "react-icons/io";
import { IoDocumentsSharp } from "react-icons/io5";
import WorkspaceMediaUpload from "./WorkspaceMediaUpload";
import { FaEllipsis, FaDiscord } from "react-icons/fa6";
import {
  MdVideoLibrary,
  MdAudiotrack,
  MdInsertDriveFile,
  MdContentCopy,
  MdDelete,
  MdReply,
} from "react-icons/md";
import WorkspaceAudioRecorder from "./WorkspaceAudioRecorder";
import AudioMessage from "./AudioMessage";
import NotificationBell from "./NotificationBell";
import { useLanguage } from "../context/LanguageContext";

const WorkspaceChat = () => {
  const { team, channel } = useParams();
  const [teamData, setTeamData] = useState({ name: "", imageURL: "" });
  const [messages, setMessages] = useState({});
  const [mediaMessages, setMediaMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showUploadTab, setShowUploadTab] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [showMessageEdit, setShowMessageEdit] = useState(null);
  const [editMessage, setEditMessage] = useState(null);
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
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(-1);

  const [channelSearchQuery, setChannelSearchQuery] = useState("");
  const channelSearchRef = useRef(null);
  const [channels, setChannels] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const getBorderColor = () =>
    themeMode === "light" ? "border-blue-200" : "border-cyan-800";
  const getTextColor = () =>
    themeMode === "light" ? "text-slate-700" : "text-gray-300";
  const getButtonBg = () =>
    themeMode === "light" ? "bg-white/80" : "bg-gray-800/80";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  const filteredChannels = useMemo(() => {
    const query = channelSearchQuery.trim().toLowerCase();
    if (!query) return channels;

    return channels.filter((ch) =>
      (ch.name || ch.id || "").toLowerCase().includes(query),
    );
  }, [channelSearchQuery, channels]);

  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const profilePanelRef = useRef(null);
  const uploadTabRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sideMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const contextMenuRef = useRef(null);

  const themeColors = {
    dark: {
      background: "bg-[#1e1e1f]",
      backgroundPrimary: "bg-[#222223]",
      backgroundSecondary: "bg-[#252527]",
      backgroundTertiary: "bg-[#29292a]",
      backgroundHover: "hover:bg-[#29292a]",
      backgroundInput: "bg-[#252527]",
      backgroundChat: "bg-[#1e1e1f]",
      backgroundHeader: "bg-[#222223]",
      backgroundChannel: "bg-[#222223]",
      backgroundMessage: "bg-[#222223]",
      backgroundMessageSelf: "bg-[#3b82f6]",
      backgroundReply: "bg-[#252527]",
      border: "border-[#2c2d2e]",
      borderSecondary: "border-[#2c2d2e]",
      textPrimary: "text-[#f0f6fc]",
      textSecondary: "text-[#8b949e]",
      textMuted: "text-[#6e7681]",
      textWhite: "text-white",
      textBlack: "text-black",
      textGreen: "text-[#3fb950]",
      textRed: "text-[#f85149]",
      textBlue: "text-[#58a6ff]",
      textYellow: "text-[#d29922]",
      placeholder: "placeholder-[#6e7681]",
      shadow: "shadow-lg shadow-blue-500/10",
      inputBorder: "border-[#2c2d2e]",
      inputFocus: "focus:border-[#58a6ff] focus:ring-2 focus:ring-blue-500/20",
      scrollbar: "scrollbar-thumb-[#29292a] scrollbar-track-transparent",
    },
    light: {
      background: "bg-[#f0f2f5]",
      backgroundPrimary: "bg-[#ffffff]",
      backgroundSecondary: "bg-[#e8eaed]",
      backgroundTertiary: "bg-[#d0d3d8]",
      backgroundHover: "hover:bg-[#e8eaed]",
      backgroundInput: "bg-[#f0f2f5]",
      backgroundChat: "bg-[#ffffff]",
      backgroundHeader: "bg-[#e8eaed]",
      backgroundChannel: "bg-[#f0f2f5]",
      backgroundMessage: "bg-[#f0f2f5]",
      backgroundMessageSelf: "bg-[#5865f2]",
      backgroundReply: "bg-[#f0f2f5]",
      border: "border-[#d0d3d8]",
      borderSecondary: "border-[#e0e3e8]",
      textPrimary: "text-[#1a1b1e]",
      textSecondary: "text-[#5e5f64]",
      textMuted: "text-[#8e8f94]",
      textWhite: "text-white",
      textBlack: "text-black",
      textGreen: "text-[#1e8e4a]",
      textRed: "text-[#c72a2f]",
      textBlue: "text-[#4752c4]",
      textYellow: "text-[#d48a0a]",
      placeholder: "placeholder-[#8e8f94]",
      shadow: "shadow-md",
      inputBorder: "border-[#d0d3d8]",
      inputFocus: "focus:border-[#5865f2]",
      scrollbar: "scrollbar-thumb-[#d0d3d8] scrollbar-track-transparent",
    },
  };

  const [isAdmin, setIsAdmin] = useState(false);

  const theme = themeColors[themeMode] || themeColors.dark;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserData({
        uid: currentUser.uid,
        displayName:
          currentUser.displayName || currentUser.email?.split("@")[0] || "User",
        email: currentUser.email,
        photoURL: currentUser.photoURL,
      });

      fetchUserProfileData(currentUser.uid);
    }
  }, []);

  const fetchUserProfileData = async (userId) => {
    try {
      const userProfileRef = doc(db, "users", userId, "profile", "data");
      const userProfileSnap = await getDoc(userProfileRef);

      if (userProfileSnap.exists()) {
        const profileData = userProfileSnap.data();
        setUserProfileData(profileData);

        setUserData((prev) => ({
          ...prev,
          displayName: profileData.name || prev.displayName,
          photoURL: profileData.ProfileImageURL || prev.photoURL,
          bannerURL: profileData.BannerImageURL || null,
          about: profileData.about || "",
          education: profileData.education || "",
          experience: profileData.experience || "",
          github: profileData.github || "",
          interests: profileData.interests || "",
          languages: profileData.languages || "",
          linkedin: profileData.linkedin || "",
          location: profileData.location || "",
          phone: profileData.phone || "",
          portfolio: profileData.portfolio || "",
          skills: profileData.skills || [],
          followers: profileData.followers || [],
          following: profileData.following || [],
          whoIFollow: profileData.Who_I_follow || [],
        }));
      } else {
        console.log("No profile data found for user:", userId);
      }
    } catch (error) {
      console.error("Error fetching user profile data:", error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const allMessagesList = [];
    Object.keys(mergedMessages).forEach((date) => {
      mergedMessages[date].forEach((message) => {
        if (
          message.content &&
          message.content.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          allMessagesList.push({
            ...message,
            dateKey: date,
          });
        }
      });
    });

    setSearchResults(allMessagesList);
    setShowSearchResults(true);
    setCurrentHighlightIndex(-1);
  }, [searchQuery, messages, mediaMessages]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentHighlightIndex + 1) % searchResults.length;
    setCurrentHighlightIndex(nextIndex);
    scrollToMessage(searchResults[nextIndex].id);
  };

  const handlePrevResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex =
      currentHighlightIndex - 1 < 0
        ? searchResults.length - 1
        : currentHighlightIndex - 1;
    setCurrentHighlightIndex(prevIndex);
    scrollToMessage(searchResults[prevIndex].id);
  };

  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight-message");
      setTimeout(() => {
        element.classList.remove("highlight-message");
      }, 2000);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mediaMessages]);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const teamDoc = await getDoc(doc(db, "teams", team));
        setTeamData({
          name: teamDoc.exists() ? teamDoc.data().name : "Team",
          imageURL: teamDoc.exists()
            ? teamDoc.data().imageURL
            : "/default-team.png",
        });
      } catch (error) {
        console.error("Error getting team data:", error);
      }
    };

    const unsubscribeMessages = onSnapshot(
      query(
        collection(db, "teams", team, "workspace", channel, "messages"),
        orderBy("createdAt", "asc"),
      ),
      (snapshot) => {
        const groupedMessages = {};
        snapshot.docs.forEach((doc) => {
          const messageData = doc.data();

          let messageType = "unknown";
          if (messageData.type) {
            messageType = messageData.type;
          } else if (messageData.content) {
            messageType = "text";
          } else if (messageData.url) {
            messageType = "media";
          }

          const message = {
            id: doc.id,
            ...messageData,
            type: messageType,
          };

          if (message.createdAt?.toDate) {
            const dateKey = message.createdAt
              .toDate()
              .toISOString()
              .split("T")[0];
            if (!groupedMessages[dateKey]) groupedMessages[dateKey] = [];
            groupedMessages[dateKey].push(message);
          }
        });
        setMessages(groupedMessages);
      },
    );

    const unsubscribeMedia = onSnapshot(
      query(
        collection(db, "teams", team, "workspace", channel, "media"),
        orderBy("timestamp", "asc"),
      ),
      (snapshot) => {
        const groupedMedia = {};
        snapshot.docs.forEach((doc) => {
          const media = {
            id: doc.id,
            ...doc.data(),
            type: doc.data().type || "file",
          };
          if (media.timestamp?.toDate) {
            const dateKey = media.timestamp
              .toDate()
              .toISOString()
              .split("T")[0];
            if (!groupedMedia[dateKey]) groupedMedia[dateKey] = [];
            groupedMedia[dateKey].push(media);
          }
        });
        setMediaMessages(groupedMedia);
      },
    );

    const unsubscribeMembers = onSnapshot(
      query(
        collection(db, "teams", team, "members"),
        where("status", "==", "online"),
      ),
      (snapshot) => {
        setOnlineMembers(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
    );

    fetchTeamData();
    return () => {
      unsubscribeMessages();
      unsubscribeMedia();
      unsubscribeMembers();
    };
  }, [team, channel]);

  useEffect(() => {
    if (!team || !channel) return;

    const pinnedRef = collection(
      db,
      "teams",
      team,
      "workspace",
      channel,
      "pinnedMessages",
    );

    const unsubscribe = onSnapshot(
      query(pinnedRef, orderBy("pinnedAt", "desc")),
      (snap) => {
        const pinned = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPinnedMessages(pinned);
      },
      (error) => {
        console.error("Error fetching pinned messages:", error);
      },
    );

    return () => unsubscribe();
  }, [team, channel]);

  const getMergedMessages = () => {
    const allMessages = { ...messages };

    Object.keys(mediaMessages).forEach((date) => {
      if (!allMessages[date]) {
        allMessages[date] = [];
      }
      allMessages[date] = [...allMessages[date], ...mediaMessages[date]];
    });

    Object.keys(allMessages).forEach((date) => {
      allMessages[date].sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || a.createdAt?.toDate?.();
        const timeB = b.timestamp?.toDate?.() || b.createdAt?.toDate?.();
        return timeA - timeB;
      });
    });

    return allMessages;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() && mediaFiles.length === 0) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("❌ No user");
        return;
      }

      const senderName =
        userProfileData?.name ||
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "User";
      const senderAvatar =
        userProfileData?.ProfileImageURL || currentUser.photoURL || null;

      const messageData = {
        sender: currentUser.uid,
        senderName: senderName,
        senderAvatar: senderAvatar,
        type: "text",
        content: newMessage,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
      };

      if (replyTo) {
        messageData.replyTo = {
          id: replyTo.id,
          content: replyTo.content || "[Media]",
          senderName: replyTo.senderName,
          senderId: replyTo.sender,
          type: replyTo.type,
        };
      }

      const messagesRef = collection(
        db,
        "teams",
        team,
        "workspace",
        channel,
        "messages",
      );
      const messageRef = await addDoc(messagesRef, messageData);

      await sendWorkspaceNotification(
        team,
        channel,
        messageData,
        messageRef.id,
        newMessage,
      );

      setNewMessage("");
      setReplyTo(null);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("❌ Error:", error);
    }
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setMediaFiles(files);
      setShowMediaPreview(true);
      setShowUploadTab(false);
    }
  };

  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150,
      )}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const mergedMessages = getMergedMessages();
  const sortedDates = Object.keys(mergedMessages).sort(
    (a, b) => new Date(a) - new Date(b),
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        profilePanelRef.current &&
        !profilePanelRef.current.contains(event.target)
      ) {
        setShowProfilePanel(false);
      }
      if (
        uploadTabRef.current &&
        !uploadTabRef.current.contains(event.target)
      ) {
        setShowUploadTab(false);
      }
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSearchResults(false);
      }
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target)
      ) {
        setContextMenu(null);
        setSelectedMessage(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleEmojiPicker = () => setShowEmojiPicker((prev) => !prev);
  const toggleProfilePanel = () => setShowProfilePanel((prev) => !prev);
  const toggleUploadTab = () => setShowUploadTab((prev) => !prev);
  const toggleStar = () => setIsStarred((prev) => !prev);
  const togglePin = () => setIsPinned((prev) => !prev);

  const openFullscreen = (mediaUrl, isVideo) => {
    setFullscreenMedia({ url: mediaUrl, isVideo });
    document.body.style.overflow = "hidden";
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "teams", team, "workspace"),
      (querySnapshot) => {
        const channelsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChannels(channelsList);
      },
    );

    return () => unsubscribe();
  }, [team]);

  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

  const [channelData, setChannelData] = useState({});

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const teamDoc = await getDoc(doc(db, "teams", team));
        setTeamData({
          name: teamDoc.exists() ? teamDoc.data().name : "Team",
          imageURL: teamDoc.exists()
            ? teamDoc.data().imageURL
            : "/default-team.png",
        });
      } catch (error) {
        console.error("Error getting team data:", error);
      }
    };

    const unsubscribeMessages = onSnapshot(
      query(
        collection(db, "teams", team, "workspace", channel, "messages"),
        orderBy("timestamp", "asc"),
      ),
      (snapshot) => {
        const groupedMessages = {};
        snapshot.docs.forEach((doc) => {
          const message = { id: doc.id, ...doc.data() };

          let dateKey;
          if (message.timestamp?.toDate) {
            dateKey = message.timestamp.toDate().toISOString().split("T")[0];
          } else if (message.createdAt?.toDate) {
            dateKey = message.createdAt.toDate().toISOString().split("T")[0];
          }

          if (dateKey) {
            if (!groupedMessages[dateKey]) groupedMessages[dateKey] = [];
            groupedMessages[dateKey].push(message);
          }
        });
        setMessages(groupedMessages);
      },
    );

    const unsubscribeMedia = onSnapshot(
      query(
        collection(db, "teams", team, "workspace", channel, "media"),
        orderBy("timestamp", "asc"),
      ),
      (snapshot) => {
        const groupedMedia = {};
        snapshot.docs.forEach((doc) => {
          const media = {
            id: doc.id,
            ...doc.data(),
            type: doc.data().type || "file",
          };
          if (media.timestamp?.toDate) {
            const dateKey = media.timestamp
              .toDate()
              .toISOString()
              .split("T")[0];
            if (!groupedMedia[dateKey]) groupedMedia[dateKey] = [];
            groupedMedia[dateKey].push(media);
          }
        });
        setMediaMessages(groupedMedia);
      },
    );

    const unsubscribeMembers = onSnapshot(
      query(
        collection(db, "teams", team, "members"),
        where("status", "==", "online"),
      ),
      (snapshot) => {
        setOnlineMembers(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
    );

    fetchTeamData();
    return () => {
      unsubscribeMessages();
      unsubscribeMedia();
      unsubscribeMembers();
    };
  }, [team, channel]);

  const formatChatDate = (dateString) => {
    if (!dateString) return "";
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (dateString === today) return t("workspace.today");
    if (dateString === yesterdayStr) return t("workspace.yesterday");

    return new Date(dateString).toLocaleDateString(
      language === "ar" ? "ar-SA" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );
  };

  const getFileType = (fileName) => {
    if (!fileName) return "file";
    const extension = fileName.split(".").pop().toLowerCase();

    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"];
    const audioExtensions = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];
    const docExtensions = ["pdf", "doc", "docx", "txt", "rtf"];
    const sheetExtensions = ["xls", "xlsx", "csv"];
    const pptExtensions = ["ppt", "pptx"];

    if (imageExtensions.includes(extension)) return "image";
    if (videoExtensions.includes(extension)) return "video";
    if (audioExtensions.includes(extension)) return "audio";
    if (docExtensions.includes(extension)) return "document";
    if (sheetExtensions.includes(extension)) return "spreadsheet";
    if (pptExtensions.includes(extension)) return "presentation";

    return "file";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const downloadFile = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      window.open(url, "_blank");
    }
  };

  const getFileIcon = (fileType, fileName) => {
    switch (fileType) {
      case "image":
        return <IoIosImages className="text-2xl text-blue-400" />;
      case "video":
        return <MdVideoLibrary className="text-2xl text-red-400" />;
      case "audio":
        return <MdAudiotrack className="text-2xl text-green-400" />;
      case "document":
        return <IoDocumentsSharp className="text-2xl text-yellow-400" />;
      case "spreadsheet":
        return <MdInsertDriveFile className="text-2xl text-green-500" />;
      case "presentation":
        return <MdInsertDriveFile className="text-2xl text-orange-400" />;
      default:
        return <MdInsertDriveFile className="text-2xl text-gray-400" />;
    }
  };

  const FileBanner = ({ file, onDownload, onOpen }) => {
    const fileName = file?.fileName || file?.originalName || "File";
    const ext = (fileName.split(".").pop() || "").toUpperCase();
    const type = getFileType(fileName);

    return (
      <div className="mb-2">
        <div
          className={`w-full rounded-lg border ${theme.border} ${theme.backgroundSecondary} overflow-hidden`}>
          <div className="flex items-center p-3 gap-4">
            <div className="flex-shrink-0 w-16 h-16  rounded-md bg-gradient-to-br from-gray-700 to-gray-600 flex flex-col items-center justify-center text-white text-sm font-semibold">
              <div className="text-lg">{ext.slice(0, 4)}</div>
              <div className="text-xs m-1 mt-0.5 ">{type}</div>
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${theme.textPrimary}`}>
                {fileName}
              </p>
              <p className={`text-xs ${theme.textSecondary}`}>
                {file?.size ? formatFileSize(file.size) : type}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip title={t("workspace.open")} arrow>
                <button
                  onClick={() => onOpen(file.url)}
                  className={`px-3 py-1.5 border ${theme.border} ${theme.textSecondary} rounded-md text-sm hover:${theme.backgroundHover} transition-colors`}>
                  <FiExternalLink className="inline mr-2" />{" "}
                  {t("workspace.open")}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
        {file.caption}
      </div>
    );
  };

  const getMessageTime = (message) => {
    if (message.createdAt?.toDate) {
      return message.createdAt.toDate();
    }
    if (message.timestamp?.toDate) {
      return message.timestamp.toDate();
    }
    return new Date();
  };

  const getSenderInfo = (message) => {
    if (message.senderName) {
      return {
        name: message.senderName,
        avatar: message.senderAvatar,
        uid: message.sender,
      };
    }
    if (message.uploadedBy) {
      return {
        name: message.uploadedBy.name || "Unknown",
        avatar: null,
        uid: message.uploadedBy.uid,
      };
    }
    return {
      name: "Unknown",
      avatar: null,
      uid: null,
    };
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu(null);
    setSelectedMessage(null);

    setSelectedMessage(message);

    const menuWidth = 220;
    const menuHeight = 200;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    if (x < 10) x = 10;
    if (y < 10) y = 10;

    setTimeout(() => {
      setContextMenu({ x, y });
    }, 50);
  };

  const handleCopyMessage = async () => {
    if (selectedMessage?.content) {
      try {
        await navigator.clipboard.writeText(selectedMessage.content);
        setContextMenu(null);
        setSelectedMessage(null);
        const notification = document.createElement("div");
        notification.className =
          "fixed bottom-20 right-4 bg-[#5865f2] text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out";
        notification.textContent = t("workspace.copyToClipboard");
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      } catch (error) {
        console.error("Error copying message:", error);
      }
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      const messageRef = doc(
        db,
        "teams",
        team,
        "workspace",
        channel,
        selectedMessage.type === "text" ? "messages" : "media",
        selectedMessage.id,
      );

      await deleteDoc(messageRef);

      if (selectedMessage.isPinned) {
        const pinnedRef = doc(
          db,
          "teams",
          team,
          "workspace",
          channel,
          "pinnedMessages",
          selectedMessage.id,
        );
        await deleteDoc(pinnedRef);
      }

      setContextMenu(null);
      setSelectedMessage(null);

      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-20 right-4 bg-[#23a55a] text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out";
      notification.textContent = t("workspace.messageDeleted");
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    } catch (error) {
      console.error("Error deleting message:", error);
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-20 right-4 bg-[#da373c] text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out";
      notification.textContent = t("workspace.errorDeleting");
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }
  };

  const handlePinMessage = async () => {
    try {
      if (!selectedMessage) {
        setContextMenu(null);
        return;
      }

      const pinnedRef = doc(
        db,
        "teams",
        team,
        "workspace",
        channel,
        "pinnedMessages",
        selectedMessage.id,
      );
      const pinnedDoc = await getDoc(pinnedRef);

      if (pinnedDoc.exists()) {
        await deleteDoc(pinnedRef);

        const messageRef = doc(
          db,
          "teams",
          team,
          "workspace",
          channel,
          selectedMessage.type === "text" ? "messages" : "media",
          selectedMessage.id,
        );
        await updateDoc(messageRef, { isPinned: false });

        setContextMenu(null);
        setSelectedMessage(null);

        const notification = document.createElement("div");
        notification.className =
          "fixed bottom-20 right-4 bg-[#23a55a] text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out";
        notification.textContent = t("workspace.messageUnpinned");
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      } else {
        const pinnedData = {
          ...selectedMessage,
          pinnedAt: serverTimestamp(),
          isPinned: true,
        };

        await setDoc(pinnedRef, pinnedData);

        const messageRef = doc(
          db,
          "teams",
          team,
          "workspace",
          channel,
          selectedMessage.type === "text" ? "messages" : "media",
          selectedMessage.id,
        );
        await updateDoc(messageRef, { isPinned: true });

        setContextMenu(null);
        setSelectedMessage(null);

        const notification = document.createElement("div");
        notification.className =
          "fixed bottom-20 right-4 bg-[#23a55a] text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out";
        notification.textContent = t("workspace.messagePinned");
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-20 right-4 bg-[#da373c] text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out";
      notification.textContent = t("workspace.errorPinning");
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }
  };

  const handleReplyMessage = () => {
    setReplyTo(selectedMessage);
    setContextMenu(null);
    setSelectedMessage(null);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const ReplyPreview = ({ replyTo }) => {
    if (!replyTo) return null;

    const getPreviewText = () => {
      if (replyTo.content) {
        return replyTo.content.length > 60
          ? replyTo.content.substring(0, 60) + "..."
          : replyTo.content;
      }
      if (replyTo.type === "image") return "📷 " + t("workspace.image");
      if (replyTo.type === "video") return "🎥 " + t("workspace.video");
      if (replyTo.type === "audio") return "🎵 " + t("workspace.audio");
      if (replyTo.type === "audio-message") return "🎤 Voice Message";
      if (replyTo.type === "file") return "📄 " + t("workspace.file");
      return t("workspace.media");
    };

    return (
      <div
        className={`mb-3 p-3 rounded-lg border-l-4 border-[#5865f2] ${theme.backgroundReply}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold mb-1 text-[#5865f2]">
              {t("workspace.replyingTo")} {replyTo.senderName}
            </p>
            <p className={`text-sm ${theme.textPrimary}`}>{getPreviewText()}</p>
          </div>
          <button
            onClick={cancelReply}
            className={`ml-2 p-1 rounded-lg ${theme.backgroundHover} transition-colors`}>
            <FiX className={`w-4 h-4 ${theme.textSecondary}`} />
          </button>
        </div>
      </div>
    );
  };

  const MessageReply = ({ replyTo }) => {
    if (!replyTo) return null;

    const getReplyContent = () => {
      if (replyTo.content) {
        return replyTo.content.length > 80
          ? replyTo.content.substring(0, 80) + "..."
          : replyTo.content;
      }
      if (replyTo.type === "image") return "📷 " + t("workspace.image");
      if (replyTo.type === "video") return "🎥 " + t("workspace.video");
      if (replyTo.type === "audio") return "🎵 " + t("workspace.audio");
      if (replyTo.type === "audio-message") return "🎤 Voice Message";
      if (replyTo.type === "file") return "📄 " + t("workspace.file");
      return t("workspace.media");
    };

    return (
      <div
        className={`mb-2 p-2 rounded-lg border-l-3 border-[#5865f2] ${theme.backgroundReply} ${theme.backgroundHover} transition-colors cursor-pointer`}
        onClick={() => {
          const element = document.getElementById(`msg-${replyTo.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("highlight-message");
            setTimeout(() => {
              element.classList.remove("highlight-message");
            }, 2000);
          }
        }}>
        <p className="text-xs font-semibold mb-1 text-[#5865f2]">
          {replyTo.senderName}
        </p>
        <p className={`text-xs ${theme.textSecondary}`}>{getReplyContent()}</p>
      </div>
    );
  };

  const sendWorkspaceNotification = async (
    teamId,
    channelId,
    messageData,
    messageId,
    messageContent,
  ) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;

      const senderName =
        messageData.senderName ||
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "User";

      let recipientIds = [];

      try {
        const membersRef = collection(db, "teams", teamId, "members");
        const membersSnapshot = await getDocs(membersRef);
        if (membersSnapshot.size > 0) {
          recipientIds = membersSnapshot.docs.map((doc) => doc.id);
        }
      } catch (err) {
        console.log("Error reading members:", err);
      }

      if (recipientIds.length === 0) {
        const teamDoc = await getDoc(doc(db, "teams", teamId));
        if (teamDoc.exists()) {
          const teamData = teamDoc.data();
          if (teamData.members && Array.isArray(teamData.members)) {
            recipientIds = teamData.members;
          } else if (teamData.users && Array.isArray(teamData.users)) {
            recipientIds = teamData.users;
          }
        }
      }

      const recipients = recipientIds.filter((id) => id !== currentUser.uid);

      if (recipients.length === 0) return false;

      for (const recipientId of recipients) {
        try {
          const notificationRef = doc(
            db,
            "users",
            recipientId,
            "notifications",
            "list",
          );
          const notificationDoc = await getDoc(notificationRef);

          const notificationBody =
            messageContent?.length > 100
              ? messageContent.substring(0, 100) + "..."
              : messageContent || "Sent a message";

          const newNotification = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: `${senderName} in #${channelId}`,
            body: notificationBody,
            timestamp: new Date(),
            read: false,
            type: "workspace_message",
            data: {
              teamId: teamId,
              channelId: channelId,
              messageId: messageId,
              senderId: currentUser.uid,
              senderName: senderName,
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
          } else {
            await setDoc(notificationRef, { notifications: [newNotification] });
          }
        } catch (err) {
          console.error(`Error for ${recipientId}:`, err);
        }
      }

      return true;
    } catch (error) {
      console.error("Error in sendWorkspaceNotification:", error);
      return false;
    }
  };

  const SideMenuContent = useMemo(() => {
    return (
      <div
        className={`${theme.backgroundChannel} ml-15 h-full flex flex-col overflow-y-auto ${theme.scrollbar}`}>
        <div className={`flex-shrink-0 p-4 border-b ${theme.border}`}>
          <div className="flex items-center justify-between mb-4">
            <h4
              className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary}`}>
              {t("workspace.textChannels")}
            </h4>
            {isAdmin && (
              <button
                onClick={() => setIsCreateChannelOpen(true)}
                className={`${theme.textSecondary} hover:${theme.textPrimary} transition-colors p-1 rounded`}>
                <FiPlus size={16} />
              </button>
            )}
          </div>
          <div className="relative">
            <FiSearch
              className={`absolute left-3 top-2.5 ${theme.textMuted}`}
              size={16}
            />
            <input
              ref={channelSearchRef}
              type="text"
              value={channelSearchQuery}
              onChange={(e) => {
                e.preventDefault();
                setChannelSearchQuery(e.target.value);
              }}
              placeholder={t("workspace.findChannels")}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg ${theme.backgroundInput} border ${theme.inputBorder} ${theme.inputFocus} ${theme.textPrimary} ${theme.placeholder}`}
            />
            {channelSearchQuery && (
              <button
                onClick={() => {
                  setChannelSearchQuery("");
                  setTimeout(() => channelSearchRef.current?.focus(), 0);
                }}
                className={`absolute right-3 top-2.5 ${theme.textMuted} hover:${theme.textPrimary} transition-colors`}>
                <FiX size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {channelSearchQuery && filteredChannels.length === 0 ? (
            <div className={`text-center py-6 ${theme.textMuted} text-xs`}>
              <p>
                {t("workspace.noChannelsFound")} "{channelSearchQuery}"
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filteredChannels.map((channelItem) => (
                <li key={channelItem.id}>
                  <Link
                    to={`/team/${team}/workspace/channel/${channelItem.id}`}
                    onClick={() => {
                      setChannelSearchQuery("");
                      setChannelData(channelItem);
                    }}
                    className={`flex items-center px-3 py-2 rounded-md transition-all text-sm group ${
                      channel === channelItem.id
                        ? `${theme.backgroundTertiary} ${theme.textPrimary}`
                        : `${theme.textSecondary} ${theme.backgroundHover} hover:${theme.textPrimary}`
                    }`}>
                    <FiHash className="mr-2 text-base flex-shrink-0" />
                    <span className="truncate flex-1">
                      {channelItem.name || channelItem.id}
                    </span>
                    {channel === channelItem.id && (
                      <span className="w-2 h-2 rounded-full bg-[#5865f2]"></span>
                    )}
                  </Link>
                </li>
              ))}

              {channels.length === 0 && !channelSearchQuery && (
                <li className={`text-center py-6 ${theme.textMuted} text-xs`}>
                  {t("workspace.noChannelsYet")}
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    );
  }, [
    theme,
    channelSearchQuery,
    filteredChannels,
    channels,
    team,
    channel,
    setIsCreateChannelOpen,
  ]);

  return (
    <div
      className={`min-h-screen flex ${theme.background} ${theme.textPrimary}`}>
      {isMobile && !mobileMenuOpen && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`fixed top-4 left-4 z-50 p-2.5 rounded-lg ${getButtonBg()} backdrop-blur-sm shadow-lg border ${getBorderColor()} transition-all duration-300 hover:scale-105`}>
          <FiMenu className={`w-5 h-5 ${getTextColor()}`} />
        </button>
      )}

      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className={`relative w-100 max-w-full h-full ${theme.backgroundPrimary} shadow-2xl overflow-y-auto`}>
            <WorkspaceSideMenu activeChannel={channel} />
            {SideMenuContent}
          </div>
        </div>
      )}

      <div
        className={`hidden md:flex w-100 flex-col ${theme.backgroundPrimary}`}>
        <div className="flex-shrink-0">
          <WorkspaceSideMenu activeChannel={channel} />
        </div>
        {SideMenuContent}
      </div>

      {isCreateChannelOpen && (
        <CreatNewChannel onClose={() => setIsCreateChannelOpen(false)} />
      )}

      <div className="flex-1 flex flex-col h-screen">
        <div
          className={`sticky top-0 z-20 flex items-center justify-between px-4 py-3 ${theme.backgroundHeader} border-b ${theme.border} shadow-sm backdrop-blur-sm`}>
          <div className={`flex items-center ${isMobile && "pl-15"} space-x-3`}>
            <div className="relative ">
              <img
                src={teamData.imageURL}
                className="w-10 h-10  rounded-full border-2 border-[#5865f2] object-cover"
                alt={teamData.name}
              />
            </div>
            <div className="flex items-center">
              <FiHash className={`${theme.textSecondary} mr-1`} size={20} />
              <h1 className={`text-base font-semibold ${theme.textPrimary}`}>
                {channelData.name || channel}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAdmin && (
              <Tooltip title={t("workspace.createChannel")} arrow>
                <button
                  className={`p-2 rounded-lg ${theme.textSecondary} hover:${theme.textPrimary} ${theme.backgroundHover} transition-all`}
                  onClick={() => setIsCreateChannelOpen(true)}>
                  <FiPlus size={18} />
                </button>
              </Tooltip>
            )}

            <div className={`h-6 w-px ${theme.border}`}></div>

            <NotificationBell themeMode={themeMode} />

            <div className="flex items-center -space-x-1">
              {onlineMembers.slice(0, 3).map((member) => (
                <Tooltip
                  key={member.id}
                  title={
                    member.name || member.displayName || t("workspace.member")
                  }
                  arrow>
                  <Avatar
                    src={member.avatar || member.photoURL || null}
                    className={`w-7 h-7 border-2 ${theme.border}`}
                  />
                </Tooltip>
              ))}
              {onlineMembers.length > 3 && (
                <div
                  className={`w-7 h-7 rounded-full ${theme.backgroundPrimary} border-2 ${theme.border} flex items-center justify-center text-xs ${theme.textSecondary}`}>
                  +{onlineMembers.length - 3}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={toggleProfilePanel}
                className={`flex items-center space-x-2 p-1 rounded-lg ${theme.backgroundHover} transition-colors`}>
                <Avatar
                  src={
                    userProfileData?.ProfileImageURL ||
                    auth.currentUser?.photoURL ||
                    null
                  }
                  className="w-8 h-8"
                />
                <div className="hidden lg:block text-left">
                  <p className={`text-sm font-medium ${theme.textPrimary}`}>
                    {userProfileData?.name ||
                      auth.currentUser?.displayName ||
                      auth.currentUser?.email?.split("@")[0] ||
                      "User"}
                  </p>
                </div>
              </button>

              {showProfilePanel && (
                <div
                  ref={profilePanelRef}
                  className={`absolute right-0 top-12 w-80 ${theme.backgroundPrimary} rounded-lg shadow-xl border ${theme.border} z-20 overflow-hidden`}>
                  <div className="relative">
                    {userProfileData?.BannerImageURL && (
                      <div
                        className="h-24 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${userProfileData.BannerImageURL})`,
                        }}
                      />
                    )}
                    <div className={`absolute -bottom-8 left-4`}>
                      <Avatar
                        src={
                          userProfileData?.ProfileImageURL ||
                          auth.currentUser?.photoURL ||
                          null
                        }
                        className={`w-16 h-16 border-4 ${theme.backgroundPrimary}`}
                      />
                    </div>
                  </div>

                  <div className="pt-10 px-4 pb-4">
                    <div className="mb-4">
                      <h3
                        className={`text-lg font-semibold ${theme.textPrimary}`}>
                        {userProfileData?.name ||
                          auth.currentUser?.displayName ||
                          auth.currentUser?.email?.split("@")[0] ||
                          "User"}
                      </h3>
                      <p className={`text-sm ${theme.textGreen}`}>
                        {t("workspace.online")}
                      </p>
                    </div>

                    {userProfileData?.about && (
                      <div className="mb-3">
                        <p className={`text-sm ${theme.textPrimary}`}>
                          {userProfileData.about}
                        </p>
                      </div>
                    )}

                    {userProfileData?.location && (
                      <div className={`mb-3 text-sm ${theme.textSecondary}`}>
                        📍 {userProfileData.location}
                      </div>
                    )}

                    {userProfileData?.skills &&
                      userProfileData.skills.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1.5">
                            {userProfileData.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 text-xs rounded-md bg-[#5865f2]/20 text-[#5865f2]`}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    <div
                      className={`flex items-center gap-2 text-xs ${theme.textSecondary} mb-3`}>
                      <span>
                        📊 {userProfileData?.followers?.length || 0}{" "}
                        {t("workspace.followers")}
                      </span>
                      <span>•</span>
                      <span>
                        👥 {userProfileData?.following?.length || 0}{" "}
                        {t("workspace.following")}
                      </span>
                    </div>

                    {(userProfileData?.github ||
                      userProfileData?.linkedin ||
                      userProfileData?.portfolio) && (
                      <div className="mb-3 flex gap-2">
                        {userProfileData.github && (
                          <a
                            href={userProfileData.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#5865f2] hover:underline text-sm">
                            GitHub
                          </a>
                        )}
                        {userProfileData.linkedin && (
                          <a
                            href={userProfileData.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#5865f2] hover:underline text-sm">
                            LinkedIn
                          </a>
                        )}
                        {userProfileData.portfolio && (
                          <a
                            href={userProfileData.portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#5865f2] hover:underline text-sm">
                            Portfolio
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={`border-t ${theme.border} p-2`}>
                    <button
                      onClick={() => auth.signOut()}
                      className={`w-full flex items-center space-x-2 p-2 ${theme.textRed} ${theme.backgroundHover} rounded-lg transition-colors`}>
                      <FiLogOut />
                      <span>{t("workspace.logOut")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={`sticky top-14 z-10 flex items-center justify-between px-4 py-2 ${theme.backgroundHeader} border-b ${theme.border}`}>
          <div className="flex items-center space-x-3">
            <h2
              className={`text-sm font-medium ${theme.textSecondary} flex items-center`}>
              <FiHash className="mr-1" size={16} />
              {channelData.name || channel}
            </h2>

            {pinnedMessages.length > 0 && (
              <button
                onClick={() => setShowPinnedModal(true)}
                className={`px-2 py-1 rounded-md ${theme.backgroundPrimary} ${theme.backgroundHover} transition-all flex items-center gap-1.5`}>
                <BsPinFill className="text-[#5865f2] text-xs" />
                <span className={`text-xs ${theme.textSecondary}`}>
                  {pinnedMessages.length}
                </span>
              </button>
            )}
          </div>

          <div className="relative w-72 hidden md:block" ref={searchInputRef}>
            <FiSearch
              className={`absolute left-3 top-2 ${theme.textMuted}`}
              size={14}
            />
            <input
              type="text"
              placeholder={t("workspace.searchPlaceholder")}
              value={searchQuery}
              onChange={handleSearch}
              className={`w-full pl-8 pr-3 py-1 text-xs rounded-md ${theme.backgroundInput} border ${theme.inputBorder} ${theme.inputFocus} ${theme.textPrimary} ${theme.placeholder}`}
            />
            {showSearchResults && searchResults.length > 0 && (
              <div
                className={`absolute top-full left-0 right-0 mt-2 ${theme.backgroundPrimary} rounded-lg border ${theme.border} shadow-xl z-30 max-h-96 overflow-y-auto ${theme.scrollbar}`}>
                <div
                  className={`sticky top-0 ${theme.backgroundSecondary} px-3 py-2 border-b ${theme.border} flex items-center justify-between`}>
                  <span className={`text-xs ${theme.textSecondary}`}>
                    {searchResults.length} {t("workspace.searchResults")}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevResult}
                      className="px-2 py-1 text-xs bg-[#5865f2] hover:bg-[#4752c4] rounded transition-colors text-white">
                      ↑ {t("workspace.prevResult")}
                    </button>
                    <button
                      onClick={handleNextResult}
                      className="px-2 py-1 text-xs bg-[#5865f2] hover:bg-[#4752c4] rounded transition-colors text-white">
                      {t("workspace.nextResult")} ↓
                    </button>
                  </div>
                </div>
                {searchResults.map((result, idx) => (
                  <div
                    key={result.id}
                    className={`px-3 py-2 border-b ${theme.border} ${theme.backgroundHover} cursor-pointer transition-colors ${currentHighlightIndex === idx ? "bg-[#5865f2]/20 border-l-2 border-l-[#5865f2]" : ""}`}
                    onClick={() => {
                      scrollToMessage(result.id);
                      setShowSearchResults(false);
                      setSearchQuery("");
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[#5865f2]">
                        {result.senderName}
                      </span>
                      <span className={`text-xs ${theme.textSecondary}`}>
                        {result.createdAt?.toDate().toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={`text-sm ${theme.textPrimary} line-clamp-2`}>
                      {result.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {showSearchResults && searchResults.length === 0 && searchQuery && (
              <div
                className={`absolute top-full left-0 right-0 mt-2 ${theme.backgroundPrimary} rounded-lg border ${theme.border} shadow-xl z-30 p-4 text-center`}>
                <p className={`text-sm ${theme.textSecondary}`}>
                  {t("workspace.noSearchResults")} "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          className={`flex-1 overflow-y-auto px-5 py-3 ${theme.backgroundChat} ${theme.scrollbar}`}>
          {sortedDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center p-6">
                <div
                  className={`w-16 h-16 rounded-full ${theme.backgroundPrimary} flex items-center justify-center mx-auto mb-4`}>
                  <FiHash className="text-[#5865f2] text-3xl" />
                </div>
                <h3 className={`text-lg font-medium mb-2 ${theme.textPrimary}`}>
                  {t("workspace.welcomeTo")} #{channelData.name || channel}!
                </h3>
                <p className={`text-sm ${theme.textSecondary}`}>
                  {t("workspace.channelStart")}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-3">
                  <div className="relative flex items-center justify-center my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className={`w-full border-t ${theme.border}`}></div>
                    </div>
                    <div
                      className={`relative px-3 py-1 ${theme.backgroundPrimary} text-xs ${theme.textSecondary} rounded-full`}>
                      {formatChatDate(date)}
                    </div>
                  </div>

                  {mergedMessages[date].map((message, index, arr) => {
                    const senderInfo = getSenderInfo(message);
                    const messageTime = getMessageTime(message);
                    const isCurrentUser =
                      senderInfo.uid === auth.currentUser?.uid;

                    const showAvatar =
                      index === 0 ||
                      getSenderInfo(arr[index - 1]).uid !== senderInfo.uid ||
                      messageTime - getMessageTime(arr[index - 1]) >
                        5 * 60 * 1000;

                    return (
                      <div
                        key={message.id}
                        id={`msg-${message.id}`}
                        className={`flex group relative ${isCurrentUser ? "justify-end" : "justify-start"} `}
                        onContextMenu={(e) => handleContextMenu(e, message)}>
                        {!isCurrentUser && showAvatar && (
                          <Avatar
                            src={senderInfo.avatar || null}
                            className="w-9 h-9 mt-0.5 flex-shrink-0 mr-3 cursor-pointer"
                            onClick={(e) => handleContextMenu(e, message)}>
                            {!senderInfo.avatar &&
                              senderInfo.name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                        )}

                        {!isCurrentUser && !showAvatar && (
                          <div className="w-12 flex-shrink-0"></div>
                        )}

                        <div
                          className={`max-w-[80%] ${isCurrentUser ? "flex flex-col items-end" : ""} pl-5`}>
                          {(showAvatar || isCurrentUser) && (
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={`top-1 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                                <button
                                  data-context-menu
                                  className={`p-1.5 rounded-md ${theme.textSecondary} hover:${theme.textPrimary} ${theme.backgroundHover} hover:scale-110 shadow-lg`}
                                  onClick={(e) =>
                                    handleContextMenu(e, message)
                                  }>
                                  <FaEllipsis size={14} />
                                </button>
                              </div>
                              <span
                                className={`text-sm font-medium ${theme.textPrimary}`}>
                                {isCurrentUser
                                  ? t("workspace.you")
                                  : senderInfo.name}
                              </span>
                              <span
                                className={`text-xs ${theme.textSecondary}`}>
                                {messageTime.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}

                          <div
                            className={`px-3 py-2 rounded-2xl ${
                              isCurrentUser
                                ? "bg-[#5865f2] text-white rounded-br-none"
                                : `${theme.backgroundMessage} ${theme.textPrimary} rounded-bl-none`
                            }`}>
                            {message.replyTo && (
                              <MessageReply replyTo={message.replyTo} />
                            )}

                            {message.type === "image" && (
                              <div className="mb-1">
                                <img
                                  src={message.url}
                                  onClick={() =>
                                    openFullscreen(message.url, false)
                                  }
                                  className="max-w-[300px] max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  alt="Uploaded content"
                                />
                                {message.caption && (
                                  <p
                                    className={`text-sm mt-1 ${theme.textSecondary}`}>
                                    {message.caption}
                                  </p>
                                )}
                              </div>
                            )}

                            {message.type === "video" && (
                              <div className="mb-1">
                                <video
                                  src={message.url}
                                  className="max-w-[300px] max-h-48 rounded-lg cursor-pointer"
                                  onClick={() =>
                                    openFullscreen(message.url, true)
                                  }
                                />
                                {message.caption && (
                                  <p
                                    className={`text-sm mt-1 ${theme.textSecondary}`}>
                                    {message.caption}
                                  </p>
                                )}
                              </div>
                            )}

                            {(message.type === "file" ||
                              message.type === "document") && (
                              <FileBanner
                                file={message}
                                onDownload={downloadFile}
                                onOpen={(url) => window.open(url, "_blank")}
                              />
                            )}

                            {message.type === "audio" && (
                              <div className="mb-1">
                                <audio controls className="h-8">
                                  <source src={message.url} />
                                </audio>
                                {message.caption && (
                                  <p
                                    className={`text-sm mt-1 ${theme.textSecondary}`}>
                                    {message.caption}
                                  </p>
                                )}
                              </div>
                            )}

                            {message.type === "audio-message" && (
                              <AudioMessage
                                audioSrc={message.url}
                                duration={message.duration}
                              />
                            )}

                            {(message.type === "text" || message.content) && (
                              <p className="break-words text-sm">
                                {message.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div
          className={`sticky bottom-0 p-4 ${theme.backgroundHeader} border-t ${theme.border} shadow-lg`}>
          {showMediaPreview && (
            <div className="absolute bottom-20 left-4 right-4 z-10">
              <WorkspaceMediaUpload
                channel={channel}
                teamId={team}
                mediaFiles={mediaFiles}
                onClose={() => {
                  setShowMediaPreview(false);
                  setMediaFiles([]);
                }}
                themeMode={themeMode}
              />
            </div>
          )}

          <form onSubmit={handleSendMessage} className="relative">
            {replyTo && <ReplyPreview replyTo={replyTo} />}

            <div
              className={`flex items-center ${theme.backgroundInput} rounded-lg border ${theme.inputBorder} focus-within:border-[#5865f2] transition-colors`}>
              <button
                type="button"
                onClick={toggleUploadTab}
                className={`p-2 ${theme.textSecondary} hover:${theme.textPrimary} ${theme.backgroundHover} transition-colors`}>
                <FiPlus size={18} />
              </button>

              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  replyTo
                    ? `${t("workspace.replyingTo")} ${replyTo.senderName}...`
                    : `${t("workspace.typeMessage")} #${channelData.name || channel}`
                }
                className={`flex-1 p-2 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none ${theme.textPrimary} ${theme.placeholder} text-sm`}
                style={{ minHeight: "40px", maxHeight: "120px" }}
                rows={1}
              />

              <button
                type="button"
                onClick={toggleEmojiPicker}
                className={`p-2 ${theme.textSecondary} hover:${theme.textPrimary} ${theme.backgroundHover} transition-colors`}>
                <FiSmile size={18} />
              </button>

              <WorkspaceAudioRecorder teamId={team} channel={channel} />

              <button
                type="submit"
                disabled={!newMessage.trim() && mediaFiles.length === 0}
                className={`p-2 rounded-r-lg transition-colors ${
                  newMessage.trim() || mediaFiles.length > 0
                    ? "text-[#5865f2] hover:text-[#4752c4] hover:bg-[#3b3d41]"
                    : "text-[#5d5f63] cursor-not-allowed"
                }`}>
                <FiSend size={18} />
              </button>
            </div>

            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-12 left-0 z-20">
                <EmojiPicker
                  onEmojiClick={(e) =>
                    setNewMessage((prev) => (prev || "") + e.emoji)
                  }
                  width={320}
                  height={400}
                  theme={themeMode}
                />
              </div>
            )}

            {showUploadTab && (
              <div
                ref={uploadTabRef}
                className={`absolute bottom-12 left-0 z-20 w-56 ${theme.backgroundPrimary} rounded-lg border ${theme.border} shadow-xl overflow-hidden`}>
                <div className={`p-3 border-b ${theme.border}`}>
                  <h3 className={`text-sm font-medium ${theme.textPrimary}`}>
                    {t("workspace.upload")}
                  </h3>
                </div>
                <div className={`divide-y ${theme.border}`}>
                  <label
                    className={`flex items-center gap-3 p-3 ${theme.backgroundHover} transition-colors cursor-pointer`}>
                    <IoIosImages className="text-xl text-[#5865f2]" />
                    <span className={`text-sm ${theme.textPrimary}`}>
                      {t("workspace.imageAndVideo")}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaUpload}
                    />
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3 ${theme.backgroundHover} transition-colors cursor-pointer`}>
                    <IoDocumentsSharp className="text-xl text-[#5865f2]" />
                    <span className={`text-sm ${theme.textPrimary}`}>
                      {t("workspace.documents")}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                      onChange={handleMediaUpload}
                    />
                  </label>
                </div>
              </div>
            )}
          </form>
        </div>

        {fullscreenMedia && (
          <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            <button
              onClick={() => {
                setFullscreenMedia(null);
                document.body.style.overflow = "auto";
              }}
              className="absolute top-4 right-4 text-white text-3xl hover:text-[#5865f2] hover:scale-110 transition-all z-10">
              &times;
            </button>
            <div className="w-full max-w-6xl h-[85vh]">
              {fullscreenMedia.isVideo ? (
                <video
                  controls
                  autoPlay
                  className="w-full h-full rounded-xl object-contain"
                  src={fullscreenMedia.url}
                />
              ) : (
                <img
                  src={fullscreenMedia.url}
                  alt={t("workspace.fullscreen")}
                  className="w-full h-full rounded-xl object-contain"
                />
              )}
            </div>
          </div>
        )}

        {showPinnedModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div
              className={`w-full max-w-2xl rounded-xl border ${theme.border} shadow-2xl overflow-hidden ${theme.backgroundPrimary}`}>
              <div
                className={`flex items-center justify-between p-4 border-b ${theme.border} ${theme.backgroundSecondary}`}>
                <div className="flex items-center gap-2">
                  <BsPinFill className="text-[#5865f2] text-lg" />
                  <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>
                    {t("workspace.pinnedMessages")}
                  </h2>
                </div>
                <button
                  onClick={() => setShowPinnedModal(false)}
                  className={`${theme.textSecondary} hover:${theme.textPrimary} transition-colors`}>
                  <FiX size={20} />
                </button>
              </div>

              <div
                className={`max-h-[70vh] overflow-y-auto space-y-3 p-4 ${theme.scrollbar}`}>
                {pinnedMessages.length === 0 ? (
                  <div className={`text-center py-8 ${theme.textSecondary}`}>
                    {t("workspace.noPinnedMessages")}
                  </div>
                ) : (
                  pinnedMessages.map((pinnedMsg, index) => {
                    const sender = getSenderInfo(pinnedMsg);
                    return (
                      <div
                        key={pinnedMsg.id}
                        className={`p-3 rounded-lg border ${theme.border} ${theme.backgroundSecondary} ${theme.backgroundHover} transition-all cursor-pointer`}
                        onClick={() => {
                          const element = document.getElementById(
                            `msg-${pinnedMsg.id}`,
                          );
                          if (element) {
                            element.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                            element.classList.add("highlight-message");
                            setTimeout(
                              () =>
                                element.classList.remove("highlight-message"),
                              2000,
                            );
                            setShowPinnedModal(false);
                          }
                        }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-sm font-medium ${theme.textPrimary}`}>
                            {sender.name}
                          </span>
                          <span className="text-xs text-[#5865f2]">
                            #{index + 1}
                          </span>
                        </div>
                        <p
                          className={`text-sm ${theme.textSecondary} line-clamp-2`}>
                          {pinnedMsg.content || "[Media message]"}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {contextMenu && selectedMessage && (
          <div
            ref={contextMenuRef}
            className={`fixed z-[10000] ${theme.backgroundPrimary} rounded-lg shadow-2xl border ${theme.border} overflow-hidden animate-in fade-in zoom-in duration-150`}
            style={{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
              minWidth: "220px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
            }}>
            <button
              onClick={handleReplyMessage}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${theme.textPrimary} ${theme.backgroundHover} transition-all duration-150 border-b ${theme.border}`}>
              <MdReply size={18} className="text-[#5865f2] flex-shrink-0" />
              <span className="font-medium">{t("workspace.reply")}</span>
            </button>

            <button
              onClick={handleCopyMessage}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${theme.textPrimary} ${theme.backgroundHover} transition-all duration-150 border-b ${theme.border}`}>
              <MdContentCopy
                size={18}
                className="text-[#5865f2] flex-shrink-0"
              />
              <span className="font-medium">{t("workspace.copyText")}</span>
            </button>

            <button
              onClick={handlePinMessage}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${theme.textPrimary} ${theme.backgroundHover} transition-all duration-150 border-b ${theme.border}`}>
              {selectedMessage.isPinned ? (
                <>
                  <BsPinFill
                    size={18}
                    className="text-[#faa61a] flex-shrink-0"
                  />
                  <span className="font-medium">{t("workspace.unpin")}</span>
                </>
              ) : (
                <>
                  <BsPin size={18} className="text-[#5865f2] flex-shrink-0" />
                  <span className="font-medium">{t("workspace.pin")}</span>
                </>
              )}
            </button>

            <button
              onClick={handleDeleteMessage}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${theme.textRed} ${theme.backgroundHover} transition-all duration-150 font-medium`}>
              <MdDelete size={18} className="flex-shrink-0" />
              <span>{t("workspace.delete")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceChat;
