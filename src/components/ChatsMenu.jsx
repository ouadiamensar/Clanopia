/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import RightSideBar from "./rightSideBar.jsx";
import Sidebar from "./Sidebar.jsx";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { auth, db, storage } from "../firebase.js";
import {
  MdCopyAll,
  MdDeleteSweep,
  MdOutlineAddToPhotos,
  MdPeople,
  MdVideoCall,
} from "react-icons/md";
import { Link, useLocation, useParams } from "react-router-dom";
import { BsWechat } from "react-icons/bs";
import { BiDotsVerticalRounded } from "react-icons/bi";
import {
  FaBusinessTime,
  FaEllipsis,
  FaFolderPlus,
  FaPaperPlane,
  FaFaceSmileWink,
  FaRegCirclePlay,
  FaReplyAll,
  FaMapPin,
} from "react-icons/fa6";
import EmojiPicker from "emoji-picker-react";
import { sendMessage } from "./sendMessage.js";
import useChatMessages from "./useChatMessages.js";
import AudioRecorder from "./AudioRecorder.jsx";
import AudioMessage from "./AudioMessage.jsx";
import { IoIosImages } from "react-icons/io";
import { IoDocumentsSharp } from "react-icons/io5";
import MediaUploadWithPreview from "./MediaUploadWithPreview.jsx";
import { TbMessageForward } from "react-icons/tb";
import { FaHandsHelping } from "react-icons/fa";
import AcceptRequest from "./AcceptRequest.jsx";
import { deleteObject, ref } from "firebase/storage";
import TopMenu from "./TopMenu.jsx";
import OverviewModal from "./OverviewModal.jsx";
import SharedMediaModal from "./SharedMediaModal.jsx";
import { useLanguage } from "../context/LanguageContext";
const ChatsMenu = () => {
  const { chatId } = useParams();
  const location = useLocation();

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

  const [chats, setChats] = useState([]);
  const [otherUsersProfiles, setOtherUsersProfiles] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const messagesEndRef = useRef(null);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinMessagePanel, setShowPinMessagePanel] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [showMessageEdit, setShowMessageEdit] = useState(null);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [showAcceptRequestPanel, setShowAcceptRequestPanel] = useState(false);
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

  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [showSharedMediaModal, setShowSharedMediaModal] = useState(false);

  const handleViewOverview = () => {
    setShowOverviewModal(true);
    setShowTopMenu(false);
  };

  const handleViewSharedMedia = () => {
    setShowSharedMediaModal(true);
    setShowTopMenu(false);
  };

  const groupedMessages = useChatMessages(chatId);

  const getBgColor = () =>
    themeMode === "light" ? "bg-white" : "bg-[#1e1e1f]";
  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";

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

      const profiles = await getOtherUsersProfiles(myChats, currentUserId);
      setOtherUsersProfiles(profiles);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [groupedMessages]);

  useEffect(() => {
    if (chatId) {
      loadPinnedMessages();
    }
  }, [chatId]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTextareaChange = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150,
      )}px`;
    }
  };

  const toggleEmojiPicker = () => setShowEmojiPicker((prev) => !prev);

  const handleSendMessage = async () => {
    if (!message.trim() && !replyTo) return;

    const currentChatId = chatId || location.pathname.split("/")[2];
    const currentUserId = auth.currentUser?.uid;

    if (currentChatId && currentUserId) {
      let replyData = null;
      if (replyTo) {
        replyData = {
          messageId: replyTo.id,
          content: replyTo.content,
          sender: replyTo.sender,
          type: replyTo.type,
          timestamp: replyTo.timestamp,
          ...(replyTo.url && { url: replyTo.url }),
          ...(replyTo.duration && { duration: replyTo.duration }),
        };
      }

      const success = await sendMessage(
        currentChatId,
        message.trim(),
        currentUserId,
        "text",
        null,
        null,
        false,
        replyData,
      );

      if (success) {
        setMessage("");
        setReplyTo(null);
        setShowEmojiPicker(false);
        if (textareaRef.current) textareaRef.current.style.height = "44px";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

  const formatChatDate = (dateString) => {
    if (!dateString) return "";
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (dateString === today) return t("chat.today");
    if (dateString === yesterdayStr) return t("chat.yesterday");

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const openFullscreen = (mediaUrl, isVideo) => {
    setFullscreenMedia({ url: mediaUrl, isVideo });
    document.body.style.overflow = "hidden";
  };

  const handelShowMessageEdit = (messageId) => {
    if (showMessageEdit === messageId) {
      setShowMessageEdit(null);
    } else {
      setShowMessageEdit(messageId);
    }
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setMediaFiles(files);
      setShowMediaPreview(true);
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    setShowMessageEdit(null);
    textareaRef.current?.focus();
  };

  const handleCopyMessage = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      setShowMessageEdit(null);
      console.log("Message copied to clipboard");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleForwardMessage = (message) => {
    setForwardMessage(message);
    setShowForwardModal(true);
    setShowMessageEdit(null);
  };

  const handlePinMessage = async (message) => {
    try {
      const chatRef = doc(db, "chats", chatId);
      const pinnedMessageData = {
        ...message,
        pinnedAt: new Date(),
        pinnedBy: auth.currentUser?.uid,
      };

      await updateDoc(chatRef, {
        pinnedMessages: arrayUnion(pinnedMessageData),
      });

      setShowMessageEdit(null);
      loadPinnedMessages();
    } catch (error) {
      console.error("Error pinning message: ", error);
    }
  };

  const loadPinnedMessages = async () => {
    try {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        setPinnedMessages(chatData.pinnedMessages || []);
      }
    } catch (error) {
      console.error("Error loading pinned messages: ", error);
    }
  };

  const handleUnpinMessage = async (messageId) => {
    try {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        const messageToRemove = chatData.pinnedMessages?.find(
          (msg) => msg.id === messageId,
        );

        if (messageToRemove) {
          await updateDoc(chatRef, {
            pinnedMessages: arrayRemove(messageToRemove),
          });
          loadPinnedMessages();
        }
      }
    } catch (error) {
      console.error("Error unpinning message: ", error);
    }
  };

  const executeForwardMessage = async (targetChatId) => {
    if (!forwardMessage) return;

    try {
      await sendMessage(
        targetChatId,
        forwardMessage.content,
        auth.currentUser?.uid,
        forwardMessage.type,
        forwardMessage.url,
        forwardMessage.duration,
        true,
      );

      setShowForwardModal(false);
      setForwardMessage(null);
    } catch (error) {
      console.error("Error forwarding message: ", error);
    }
  };

  const handleDeleteMessage = async (
    chatId,
    messageId,
    date,
    fileUrl,
    type,
  ) => {
    try {
      if (!chatId || !messageId) {
        console.error("Chat ID and Message ID are required");
        return false;
      }

      const messageRef = doc(
        db,
        "chats",
        chatId,
        "dailyMessages",
        date,
        "messages",
        messageId,
      );

      const deletedMessageData = {
        type: "deleted",
        deletedAt: new Date(),
        deletedBy: auth.currentUser?.uid,
        originalType: type,
        timestamp: new Date(),
      };

      if (type !== "text" && fileUrl) {
        try {
          const fileRef = ref(storage, fileUrl);
          await deleteObject(fileRef);
          console.log("Media file deleted from storage");

          deletedMessageData.originalFileUrl = fileUrl;
          deletedMessageData.mediaDeleted = true;
        } catch (storageError) {
          console.warn(
            "Could not delete media file from storage:",
            storageError,
          );
          deletedMessageData.mediaDeleted = false;
        }
      }

      if (type === "text") {
        deletedMessageData.content = t("chat.deletedText");
      } else {
        deletedMessageData.content =
          type === "image"
            ? t("chat.deletedImage")
            : type === "video"
              ? t("chat.deletedVideo")
              : type === "audio"
                ? t("chat.deletedAudio")
                : t("chat.deletedMedia");
      }

      await updateDoc(messageRef, deletedMessageData);

      console.log("Message marked as deleted successfully");
      setShowMessageEdit(null);
      return true;
    } catch (error) {
      console.error("Error updating message to deleted:", error);
      return false;
    }
  };

  const getSenderName = (senderId) => {
    if (senderId === auth.currentUser?.uid) return t("chat.you");
    const userProfile = otherUsersProfiles[senderId];
    return userProfile?.name || t("chat.unknownUser");
  };

  const handleRemoveChat = async () => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      if (window.confirm(t("chat.removeChatConfirm"))) {
        const chatRef = doc(db, "chats", chatId);

        await updateDoc(chatRef, {
          users: arrayRemove(currentUserId),
          deletedBy: arrayUnion(currentUserId),
          deletedAt: new Date(),
        });

        console.log("Chat removed successfully");
        setShowTopMenu(false);

        window.location.href = "/chats";
      }
    } catch (error) {
      console.error("Error removing chat:", error);
      alert(t("chat.removeChatFailed"));
    }
  };

  const handleBlockUser = async () => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      const otherUserId = chats
        .find((chat) => chat.id === chatId)
        ?.users.find((userId) => userId !== currentUserId);

      if (otherUserId) {
        if (window.confirm(t("chat.blockUserConfirm"))) {
          const userRef = doc(db, "users", currentUserId, "settings", "data");

          await updateDoc(userRef, {
            blockedUsers: arrayUnion(otherUserId),
          });

          console.log("User blocked successfully:", otherUserId);
          setShowTopMenu(false);
          alert(t("chat.blockUserSuccess"));
        }
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      alert(t("chat.blockUserFailed"));
    }
  };

  return (
    <div className={`min-h-screen relative ${getBgColor()} ${getTextColor()}`}>
      <Sidebar themeMode={themeMode} />

      <div
        className={`flex-1 transition-all duration-300 ${
          !isMobile && "ml-70 mr-30"
        }`}>
        <div className={`relative h-screen flex flex-col`}>
          {chats
            .filter((chat) => chat.id === chatId)
            .map((chat) => {
              const otherUserId = chat.users.find(
                (userId) => userId !== auth.currentUser?.uid,
              );
              const otherUser = otherUsersProfiles[otherUserId] || {
                ProfileImageURL: "/default-avatar.png",
                name: "Unknown User",
              };
              return (
                <div
                  key={chat.id}
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    isolation: "isolate",
                  }}
                  className={`sticky top-0 z-15 w-full flex justify-between items-center  ${getCardBg()} shadow-lg p-3 border-b ${getBorderColor()} border-t-2  ${
                    isMobile ? "mt-16" : "rounded-4xl mt-3"
                  }`}>
                  <div className="flex items-center">
                    <img
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 object-cover border-indigo-500`}
                      src={otherUser.ProfileImageURL}
                      alt={otherUser.name}
                    />
                    <div className="ml-3 flex gap-2 items-center">
                      <h1 className="font-bold text-indigo-300 text-base md:text-lg">
                        {otherUser.name}
                      </h1>
                      {chat.type === "join_request" ? (
                        <FaBusinessTime className="text-red-400" />
                      ) : (
                        <></>
                      )}
                      {chat.type === "teammate" ? (
                        <FaHandsHelping className="text-green-400" />
                      ) : (
                        <></>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-4">
                    {chat.type === "join_request" ? (
                      <div>
                        <button
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm flex justify-center items-center gap-1 md:gap-2 cursor-pointer font-bold py-1 px-2 border-b-4 border-indigo-700 hover:border-indigo-500 rounded"
                          onClick={() => {
                            setShowAcceptRequestPanel(true);
                          }}>
                          {t("chat.acceptReject")}
                        </button>

                        <AcceptRequest
                          OtherUserId={otherUserId}
                          showModalIsClicked={showAcceptRequestPanel}
                          setShowModalIsClicked={setShowAcceptRequestPanel}
                          teamId={chat.teamId}
                          chatId={chatId}
                          themeMode={themeMode}
                        />
                      </div>
                    ) : (
                      <></>
                    )}

                    <div className="top-menu-container relative">
                      <BiDotsVerticalRounded
                        className="text-indigo-400 text-xl md:text-2xl cursor-pointer hover:text-indigo-300"
                        onClick={() => setShowTopMenu(!showTopMenu)}
                      />

                      <TopMenu
                        isOpen={showTopMenu}
                        onClose={() => setShowTopMenu(false)}
                        onRemoveChat={handleRemoveChat}
                        onBlockUser={handleBlockUser}
                        onViewOverview={handleViewOverview}
                        onViewSharedMedia={handleViewSharedMedia}
                        themeMode={themeMode}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          {showOverviewModal && (
            <OverviewModal
              chat={chats.find((chat) => chat.id === chatId)}
              otherUser={
                otherUsersProfiles[
                  chats
                    .find((chat) => chat.id === chatId)
                    ?.users.find((userId) => userId !== auth.currentUser?.uid)
                ]
              }
              totalMessages={Object.values(groupedMessages).flat().length}
              mediaCount={
                Object.values(groupedMessages)
                  .flat()
                  .filter(
                    (msg) =>
                      msg.type === "image" ||
                      msg.type === "video" ||
                      msg.type === "audio",
                  ).length
              }
              onClose={() => setShowOverviewModal(false)}
              themeMode={themeMode}
            />
          )}

          {showSharedMediaModal && (
            <SharedMediaModal
              media={Object.values(groupedMessages)
                .flat()
                .filter(
                  (msg) =>
                    msg.type === "image" ||
                    msg.type === "video" ||
                    msg.type === "audio" ||
                    msg.type === "file",
                )}
              onClose={() => setShowSharedMediaModal(false)}
              themeMode={themeMode}
            />
          )}

          {pinnedMessages.length > 0 && (
            <div
              className={`px-4 py-2 rounded-2xl m-1 border-b border-1 border-gray-700 ${getCardBg()}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FaMapPin className="text-indigo-400 text-sm" />
                  <span className={`text-sm font-medium ${getTextColor()}`}>
                    {t("chat.pinnedMessages")}
                  </span>
                </div>
                <button
                  onClick={() => setShowPinMessagePanel(!showPinMessagePanel)}
                  className={`text-xs ${getSecondaryTextColor()} hover:${getTextColor()}`}>
                  {showPinMessagePanel ? t("chat.hide") : t("chat.showAll")}
                </button>
              </div>

              {showPinMessagePanel ? (
                <div className="space-y-2">
                  {pinnedMessages.map((pinnedMsg, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg ${getInputBg()} flex justify-between items-start`}>
                      <div className="flex-1">
                        <div
                          className={`text-xs font-medium ${getSecondaryTextColor()}`}>
                          {getSenderName(pinnedMsg.sender)}
                        </div>
                        <div className={`text-sm ${getTextColor()} truncate`}>
                          {pinnedMsg.content ||
                            (pinnedMsg.type !== "text"
                              ? `${pinnedMsg.type} ${t("chat.message")}`
                              : t("chat.message"))}
                        </div>
                        <div className={`text-xs ${getSecondaryTextColor()}`}>
                          {pinnedMsg.timestamp
                            ?.toDate?.()
                            ?.toLocaleTimeString() || "Unknown time"}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnpinMessage(pinnedMsg.id)}
                        className="text-red-400 hover:text-red-300 ml-2">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-xs ${getSecondaryTextColor()} truncate`}>
                  {pinnedMessages[0]?.content || t("chat.pinnedMessage")}
                  {pinnedMessages.length > 1 &&
                    ` ${t("chat.andMore")} ${pinnedMessages.length - 1} ${t("chat.more")}`}
                </div>
              )}
            </div>
          )}

          {replyTo && (
            <div
              className={`px-4 py-2 border-b ${getBorderColor()} ${getCardBg()} flex justify-between items-center`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FaReplyAll className="text-indigo-400 text-sm" />
                  <span className={`text-sm font-medium ${getTextColor()}`}>
                    {t("chat.replyingTo")} {getSenderName(replyTo.sender)}
                  </span>
                </div>
                <div
                  className={`text-xs ${getSecondaryTextColor()} max-w-screen truncate mt-1`}>
                  {replyTo.content.slice(0, 140) ||
                    (replyTo.type !== "text"
                      ? `${replyTo.type} ${t("chat.message")}`
                      : t("chat.message"))}
                </div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="text-gray-400 hover:text-gray-600 text-lg">
                ×
              </button>
            </div>
          )}

          <div
            className={`flex-1 overflow-y-auto p-2 md:p-4 reverse-scroll relative`}>
            <div className="flex flex-col items-center justify-center my-6 px-4 mt-20 mb-20">
              <div className="relative w-full max-w-2xl mx-auto">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center backdrop-blur-sm border-2 border-blue-400/40 shadow-2xl shadow-blue-500/30">
                      <svg
                        className="w-12 h-12 md:w-14 md:h-14 text-cyan-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                    <div className="absolute inset-0 rounded-3xl border-2 border-blue-400/20 animate-ping"></div>
                  </div>
                </div>

                <div
                  className={`
      relative overflow-hidden
      px-6 py-5 md:px-10 md:py-6
      rounded-3xl
      bg-gradient-to-br from-blue-600/30 via-cyan-600/20 to-blue-600/30
      backdrop-blur-xl
      border border-blue-400/30
      shadow-2xl shadow-blue-500/20
      transition-all duration-300
      hover:scale-[1.01] hover:shadow-blue-500/40
      ${getCardBg()}
    `}>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 pointer-events-none"></div>

                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>

                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>

                  <div className="relative z-10 flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-400/30 flex items-center justify-center border border-blue-400/30">
                        <svg
                          className="w-5 h-5 text-cyan-400"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-400 font-bold text-sm md:text-base">
                          🔒 {t("chat.encrypted")}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-[10px] text-emerald-400 font-medium">
                          {t("chat.secure")}
                        </span>
                      </div>
                      <p
                        className={`
            text-sm md:text-base leading-relaxed
            ${getTextColor()}
            font-medium
          `}>
                        <span className="opacity-90">
                          {t("chat.encryptedMessage")}
                        </span>
                        <span className="text-blue-400 font-bold">
                          {" "}
                          Clanopia
                        </span>
                        <span className="text-cyan-400">.</span>
                      </p>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400/30 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400/30 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-blue-400/30 rounded-full"></span>
                  </div>
                </div>
              </div>
            </div>
            {Object.keys(groupedMessages).length > 0 ? (
              Object.entries(groupedMessages)
                .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                .map(([date, messages]) => (
                  <div key={date}>
                    <div className="text-center my-4 ">
                      <span
                        className={`${getInputBg()} ${getSecondaryTextColor()} px-3 py-1 rounded-full text-xs md:text-sm`}>
                        {formatChatDate(date)}
                      </span>
                    </div>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        id={`msg-${msg.id}`}
                        className={`mb-3 flex relative ${
                          msg.sender === auth.currentUser?.uid
                            ? "justify-end"
                            : "justify-start"
                        }`}>
                        <div
                          className={`max-w-xs md:max-w-md relative rounded-lg p-3 animate-fade-in ${
                            msg.sender === auth.currentUser?.uid
                              ? "bg-gradient-to-br from-indigo-600 to-cyan-600 text-white rounded-br-none"
                              : `${getInputBg()} ${getTextColor()} rounded-2xl rounded-bl-none`
                          }`}>
                          {msg.replyTo && (
                            <div
                              className={`mb-2 p-2 rounded-lg ${
                                msg.sender === auth.currentUser?.uid
                                  ? "bg-indigo-500/30"
                                  : "bg-gray-600/30"
                              } border-l-4 border-indigo-400 cursor-pointer`}
                              onClick={() => {
                                console.log(
                                  "Scroll to message:",
                                  msg.replyTo.messageId,
                                );
                              }}>
                              <div
                                className={`text-xs font-medium ${
                                  msg.sender === auth.currentUser?.uid
                                    ? "text-indigo-200"
                                    : "text-indigo-300"
                                }`}>
                                {getSenderName(msg.replyTo.sender)}
                              </div>
                              <div
                                className={`text-xs truncate ${
                                  msg.sender === auth.currentUser?.uid
                                    ? "text-indigo-100"
                                    : "text-gray-300"
                                }`}>
                                {msg.replyTo.content ||
                                  (msg.replyTo.type !== "text"
                                    ? `${msg.replyTo.type} ${t("chat.message")}`
                                    : t("chat.message"))}
                              </div>
                            </div>
                          )}

                          {msg.forwarded && (
                            <div className="flex items-center gap-1 mb-1 text-xs opacity-75">
                              <TbMessageForward className="text-xs" />
                              <span>{t("chat.forwarded")}</span>
                            </div>
                          )}

                          {msg.sender === auth.currentUser?.uid &&
                            msg.type !== "deleted" && (
                              <div
                                className="w-full h-fit flex justify-end mt-1"
                                onClick={() => {
                                  handelShowMessageEdit(msg?.id);
                                }}>
                                <FaEllipsis className="text-gray-300 text-lg md:text-xl cursor-pointer hover:scale-125 transition-all duration-350 ease-in-out" />
                              </div>
                            )}

                          {showMessageEdit === msg.id && (
                            <div
                              className={` rounded-xl w-48 md:w-60 h-fit border-2 border-indigo-500 ${getCardBg()} shadow-2xl`}
                              style={{
                                position: "fixed",
                                zIndex: 999999,
                                ...(msg.sender === auth.currentUser?.uid
                                  ? { right: "10px" }
                                  : { left: "10px" }),
                                bottom: "calc(100% + 10px)",
                                maxHeight: "80vh",
                                overflowY: "auto",
                                isolation: "isolate",
                              }}
                              onClick={(e) => e.stopPropagation()}>
                              <div
                                className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-t-xl cursor-pointer transition-colors hover:${getInputBg()}`}
                                onClick={() => {
                                  handleReply(msg);
                                  setShowMessageEdit(null);
                                }}>
                                <div
                                  className={`p-1 md:p-2 rounded-lg ${getInputBg()} text-indigo-400`}>
                                  <FaReplyAll className="text-xl md:text-2xl" />
                                </div>
                                <div className="flex-1">
                                  <span
                                    className={`block font-medium ${getTextColor()} text-xs md:text-sm`}>
                                    {t("chat.reply")}
                                  </span>
                                  <span
                                    className={`block text-xs ${getSecondaryTextColor()} md:block`}>
                                    {t("chat.replyDesc")}
                                  </span>
                                </div>
                              </div>

                              <div
                                className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer transition-colors hover:${getInputBg()}`}
                                onClick={() => {
                                  handleCopyMessage(msg.content);
                                  setShowMessageEdit(null);
                                }}>
                                <div
                                  className={`p-1 md:p-2 rounded-lg ${getInputBg()} text-indigo-400`}>
                                  <MdCopyAll className="text-xl md:text-2xl" />
                                </div>
                                <div className="flex-1">
                                  <span
                                    className={`block font-medium ${getTextColor()} text-xs md:text-sm`}>
                                    {t("chat.copy")}
                                  </span>
                                  <span
                                    className={`block text-xs ${getSecondaryTextColor()} md:block`}>
                                    {t("chat.copyDesc")}
                                  </span>
                                </div>
                              </div>

                              <div
                                className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer transition-colors hover:${getInputBg()}`}
                                onClick={() => {
                                  handleForwardMessage(msg);
                                  setShowMessageEdit(null);
                                }}>
                                <div
                                  className={`p-1 md:p-2 rounded-lg ${getInputBg()} text-indigo-400`}>
                                  <TbMessageForward className="text-xl md:text-2xl" />
                                </div>
                                <div className="flex-1">
                                  <span
                                    className={`block font-medium ${getTextColor()} text-xs md:text-sm`}>
                                    {t("chat.forward")}
                                  </span>
                                  <span
                                    className={`block text-xs ${getSecondaryTextColor()} md:block`}>
                                    {t("chat.forwardDesc")}
                                  </span>
                                </div>
                              </div>

                              <div
                                className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer transition-colors hover:${getInputBg()}`}
                                onClick={() => {
                                  handlePinMessage(msg);
                                  setShowMessageEdit(null);
                                }}>
                                <div
                                  className={`p-1 md:p-2 rounded-lg ${getInputBg()} text-indigo-400`}>
                                  <FaMapPin className="text-xl md:text-2xl" />
                                </div>
                                <div className="flex-1">
                                  <span
                                    className={`block font-medium ${getTextColor()} text-xs md:text-sm`}>
                                    {t("chat.pin")}
                                  </span>
                                  <span
                                    className={`block text-xs ${getSecondaryTextColor()} md:block`}>
                                    {t("chat.pinDesc")}
                                  </span>
                                </div>
                              </div>

                              <div
                                className={`flex items-center rounded-b-2xl gap-3 md:gap-4 p-3 md:p-4 cursor-pointer transition-colors hover:${getInputBg()}`}
                                onClick={() =>
                                  handleDeleteMessage(
                                    chatId,
                                    msg.id,
                                    date,
                                    msg.url,
                                    msg.type,
                                  )
                                }>
                                <div
                                  className={`p-1 md:p-2 rounded-lg ${getInputBg()} text-indigo-400`}>
                                  <MdDeleteSweep className="text-xl md:text-2xl" />
                                </div>
                                <div className="flex-1">
                                  <span
                                    className={`block font-medium ${getTextColor()} text-xs md:text-sm`}>
                                    {t("chat.delete")}
                                  </span>
                                  <span
                                    className={`block text-xs ${getSecondaryTextColor()} md:block`}>
                                    {t("chat.deleteDesc")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {msg.type === "audio" ? (
                            <AudioMessage
                              audioSrc={msg.url}
                              duration={msg.duration}
                            />
                          ) : (
                            <></>
                          )}
                          {msg.type === "text" ? (
                            <p className="text-sm md:text-base">
                              {msg.content}
                            </p>
                          ) : (
                            <></>
                          )}
                          {msg.type === "image" ? (
                            <div>
                              <img
                                src={msg.url}
                                onClick={() => {
                                  openFullscreen(msg.url, null);
                                }}
                                className="w-full max-w-48 md:max-w-64 h-auto mb-2 md:mb-3 rounded cursor-pointer"
                              />
                              {msg.content && (
                                <p className="text-sm md:text-base">
                                  {msg.content}
                                </p>
                              )}
                            </div>
                          ) : (
                            <></>
                          )}
                          {msg.type === "video" ? (
                            <div className="relative">
                              <video
                                src={msg.url}
                                onClick={() => {
                                  openFullscreen(msg.url, true);
                                }}
                                className="w-full max-w-48 md:max-w-64 rounded object-cover h-auto cursor-pointer"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <FaRegCirclePlay
                                  className="text-white text-2xl md:text-4xl cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    openFullscreen(msg.url, true);
                                  }}
                                />
                              </div>

                              {msg.content && (
                                <p className="text-sm md:text-base mt-2">
                                  {msg.content}
                                </p>
                              )}
                            </div>
                          ) : (
                            <></>
                          )}
                          {msg.type === "deleted" ? (
                            <p className="text-sm md:text-base italic opacity-75">
                              {t("chat.messageDeleted")}
                            </p>
                          ) : (
                            <></>
                          )}
                          {msg.type !== "deleted" && (
                            <p
                              className={`text-xs mt-1 ${
                                msg.sender === auth.currentUser?.uid
                                  ? "text-indigo-200"
                                  : "text-gray-300"
                              }`}>
                              {msg.timestamp?.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              }) || "!!:!!"}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
            ) : (
              <div
                className={`flex items-center justify-center h-full ${getSecondaryTextColor()} p-4`}>
                <p className="text-center">{t("chat.noMessages")}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showForwardModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div
                className={`rounded-xl p-6 w-96 max-w-90vw ${getCardBg()} ${getTextColor()}`}>
                <h3 className="text-lg font-bold mb-4">
                  {t("chat.forwardMessage")}
                </h3>
                <div className="max-h-60 overflow-y-auto mb-4">
                  {chats
                    .filter((chat) => chat.id !== chatId)
                    .map((chat) => {
                      const otherUserId = chat.users.find(
                        (userId) => userId !== auth.currentUser?.uid,
                      );
                      const otherUser = otherUsersProfiles[otherUserId] || {
                        name: "Unknown User",
                      };
                      return (
                        <div
                          key={chat.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer"
                          onClick={() => executeForwardMessage(chat.id)}>
                          <img
                            className="w-10 h-10 rounded-full object-cover"
                            src={
                              otherUser.ProfileImageURL || "/default-avatar.png"
                            }
                            alt={otherUser.name}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{otherUser.name}</div>
                            <div className="text-xs text-gray-400">
                              {chat.type}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    className="px-4 py-2 text-gray-400 hover:text-gray-300"
                    onClick={() => setShowForwardModal(false)}>
                    {t("chat.cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            className={`sticky bottom-0 w-full ${getCardBg()} shadow-lg p-2 md:p-3 border-t ${getBorderColor()} ${
              isMobile ? " " : "rounded-4xl bottom-3"
            }`}>
            <div className="flex items-end">
              <label
                className={`p-1 md:p-2 mb-1 md:mb-2  rounded-full cursor-pointer transition-colors duration-200 ${
                  showEmojiPicker
                    ? "text-indigo-400 hover:text-indigo-300"
                    : "text-blue-600 hover:text-blue-500"
                }`}>
                <IoIosImages className="text-3xl " />

                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaUpload}
                />
              </label>

              <button
                className={`p-1 md:p-2 mb-1 md:mb-2  rounded-full cursor-pointer transition-colors duration-200 ${
                  showEmojiPicker
                    ? "text-indigo-400 hover:text-indigo-300"
                    : "text-yellow-400 hover:text-yellow-300"
                }`}
                onClick={toggleEmojiPicker}>
                <FaFaceSmileWink className="text-xl md:text-2xl" />
              </button>

              <div className="relative flex-1 mx-1 md:mx-2">
                {showMediaPreview && (
                  <div className="absolute bottom-14 md:bottom-15 -left-20 md:-left-28 z-10">
                    <MediaUploadWithPreview
                      chatId={chatId}
                      mediaFiles={mediaFiles}
                      themeMode={themeMode}
                      onClose={() => {
                        setShowMediaPreview(false);
                        setMediaFiles([]);
                      }}
                    />
                  </div>
                )}
                {showEmojiPicker && (
                  <div className="absolute bottom-14 md:bottom-18 left-0 z-10">
                    <EmojiPicker
                      onEmojiClick={(e) =>
                        setMessage((prev) => (prev || "") + e.emoji)
                      }
                      width={isMobile ? 300 : 340}
                      height={isMobile ? 320 : 360}
                      previewConfig={{ showPreview: false }}
                      searchDisabled
                      theme="dark"
                    />
                  </div>
                )}
                <textarea
                  className={`w-full py-2 px-3 ${getInputBg()} rounded-xl focus:outline-none border-2 ${getBorderColor()} resize-none overflow-y-auto ${getTextColor()} placeholder-gray-400 text-sm md:text-base`}
                  placeholder={t("chat.typeMessage")}
                  rows="1"
                  value={message || ""}
                  style={{ maxHeight: "150px", minHeight: "44px" }}
                  ref={textareaRef}
                  onChange={(e) => {
                    handleTextareaChange();
                    setMessage(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <AudioRecorder chatId={chatId} />

              <button
                className="p-2 md:p-3 mb-1 md:mb-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition-colors duration-200"
                onClick={() => {
                  handleSendMessage();
                }}>
                <FaPaperPlane className="text-lg md:text-xl" />
              </button>
            </div>
          </div>
        </div>
        {fullscreenMedia && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/40 bg-opacity-90"
            onClick={() => {
              setFullscreenMedia(null);
              document.body.style.overflow = "auto";
            }}>
            <button
              className="absolute top-4 right-4 text-white text-3xl z-60"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenMedia(null);
                document.body.style.overflow = "auto";
              }}>
              &times;
            </button>
            {fullscreenMedia.isVideo ? (
              <video
                src={fullscreenMedia.url}
                controls
                autoPlay
                className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={fullscreenMedia.url}
                alt="media"
                className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        )}
      </div>
      <RightSideBar themeMode={themeMode} />
    </div>
  );
};

export default ChatsMenu;
