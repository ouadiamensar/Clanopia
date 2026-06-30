/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { IoNotificationsOutline, IoNotifications } from "react-icons/io5";
import { MdClose, MdDoneAll, MdVolumeUp, MdVolumeOff } from "react-icons/md";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";

const NotificationBell = ({ themeMode = "" }) => {
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

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [requestNotifications, setRequestNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState("default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userSettings, setUserSettings] = useState({
    notifications: {
      messages: true,
      teamRequests: true,
      communityActivity: false,
      workspaceNotifications: true,
    },
  });

  const audioRef = useRef(null);
  const playedSoundIds = useRef(new Set());
  const lastProcessedId = useRef(null);
  const lastProcessedRequestId = useRef(null);
  const soundTimeoutRef = useRef(null);
  const isInitialLoad = useRef(true);

  const getBgColor = () =>
    themeMode === "light" ? "bg-white" : "bg-[#222223]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getHoverBg = () =>
    themeMode === "light" ? "hover:bg-gray-100" : "hover:bg-[#29292a]";
  const getGradientBg = () =>
    themeMode === "light"
      ? "bg-gradient-to-r from-indigo-500 to-purple-600"
      : "bg-gradient-to-r from-indigo-600 to-purple-700";

  useEffect(() => {
    audioRef.current = new Audio("/NotificationSound.wav");
    audioRef.current.volume = 0.7;
    audioRef.current.load();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (soundTimeoutRef.current) {
        clearTimeout(soundTimeoutRef.current);
      }
    };
  }, []);

  const playSound = useCallback(() => {
    const messagesEnabled = userSettings.notifications?.messages !== false;
    if (!soundEnabled || !audioRef.current || !messagesEnabled) {
      return;
    }

    if (soundTimeoutRef.current) {
      return;
    }

    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.log("Audio play failed:", error);
      });

      soundTimeoutRef.current = setTimeout(() => {
        soundTimeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.log("Audio play error:", error);
    }
  }, [soundEnabled, userSettings.notifications?.messages]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const settingsRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "settings",
      "data",
    );

    const unsubscribeSettings = onSnapshot(settingsRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setUserSettings({
          notifications: {
            messages: data.notifications?.messages !== false,
            teamRequests: data.notifications?.teamRequests !== false,
            communityActivity: data.notifications?.communityActivity === true,
            workspaceNotifications:
              data.notifications?.workspaceNotifications !== false,
          },
        });
      } else {
        setUserSettings({
          notifications: {
            messages: true,
            teamRequests: true,
            communityActivity: false,
            workspaceNotifications: true,
          },
        });
      }
    });

    return () => unsubscribeSettings();
  }, [auth.currentUser]);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    const savedSoundSetting = localStorage.getItem("notificationSound");
    if (savedSoundSetting !== null) {
      setSoundEnabled(savedSoundSetting === "true");
    }

    const timer = setTimeout(() => {
      isInitialLoad.current = false;
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const shouldShowNotification = useCallback(
    (notification) => {
      const messagesEnabled = userSettings.notifications?.messages !== false;
      const workspaceEnabled =
        userSettings.notifications?.workspaceNotifications !== false;

      if (!messagesEnabled) {
        return false;
      }

      if (notification.type === "community_post") {
        return userSettings.notifications?.communityActivity === true;
      }

      if (notification.type === "team_request") {
        return userSettings.notifications?.teamRequests !== false;
      }

      if (
        notification.type === "workspace_message" ||
        notification.type === "workspace_media" ||
        notification.type === "workspace_notification"
      ) {
        return workspaceEnabled;
      }

      return true;
    },
    [userSettings],
  );

  const handleNewNotifications = useCallback(
    (notifs, source = "regular") => {
      if (!notifs || notifs.length === 0) return;

      if (isInitialLoad.current) {
        console.log("⏳ Initial load, skipping sound");
        if (notifs.length > 0) {
          const firstNotif = notifs[0];
          const key = firstNotif.id || firstNotif.notificationId;
          if (source === "regular") {
            lastProcessedId.current = key;
          } else {
            lastProcessedRequestId.current = key;
          }
        }
        return;
      }

      const sortedNotifs = [...notifs].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );

      const newestUnread = sortedNotifs.find((n) => !n.read);

      if (!newestUnread) {
        return;
      }

      const notificationKey = newestUnread.id || newestUnread.notificationId;
      if (!notificationKey) return;

      let isNew = false;
      if (source === "regular") {
        isNew = lastProcessedId.current !== notificationKey;
        if (isNew) {
          lastProcessedId.current = notificationKey;
        }
      } else {
        isNew = lastProcessedRequestId.current !== notificationKey;
        if (isNew) {
          lastProcessedRequestId.current = notificationKey;
        }
      }

      if (!isNew) {
        console.log("ℹ️ Notification already processed:", notificationKey);
        return;
      }

      if (playedSoundIds.current.has(notificationKey)) {
        console.log(
          "🔇 Sound already played for notification:",
          notificationKey,
        );
        return;
      }

      console.log("🆕 New notification detected:", newestUnread);

      if (shouldShowNotification(newestUnread)) {
        console.log("🔊 Playing sound for new notification:", notificationKey);
        playSound();
        playedSoundIds.current.add(notificationKey);

        if (permission === "granted") {
          const notification = new Notification(newestUnread.title, {
            body: newestUnread.body,
            icon: "/vite.svg",
            silent: false,
            vibrate: [200, 100, 200],
            requireInteraction: true,
          });

          notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            if (newestUnread.data?.teamId && newestUnread.data?.channelId) {
              window.location.href = `/workspace/${newestUnread.data.teamId}/channel/${newestUnread.data.channelId}`;
            } else if (newestUnread.data?.chatId) {
              window.location.href = `/chat/${newestUnread.data.chatId}`;
            } else if (
              newestUnread.data?.communityId &&
              newestUnread.data?.category
            ) {
              window.location.href = `/community/${newestUnread.data.category}/${newestUnread.data.communityId}`;
            } else if (newestUnread.data?.teamId) {
              window.location.href = `/team/${newestUnread.data.teamId}`;
            }
            notification.close();
          };
        }
      }
    },
    [shouldShowNotification, playSound],
  );

  useEffect(() => {
    if (!auth.currentUser) {
      return;
    }

    const notificationsRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "notifications",
      "list",
    );

    const unsubscribe = onSnapshot(
      notificationsRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const notifs = data.notifications || [];
          setNotifications(notifs);
          handleNewNotifications(notifs, "regular");
        } else {
          setNotifications([]);
        }
      },
      (error) => {
        console.error("❌ Error in notifications snapshot:", error);
      },
    );

    return () => unsubscribe();
  }, [auth.currentUser, handleNewNotifications]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const requestNotificationsRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "request_notifications",
      "list",
    );

    const unsubscribe = onSnapshot(requestNotificationsRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const notifs = data.notifications || [];
        setRequestNotifications(notifs);
        handleNewNotifications(notifs, "request");
      } else {
        setRequestNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser, handleNewNotifications]);

  const allNotifications = [...requestNotifications, ...notifications].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );

  const totalUnread = [
    ...requestNotifications.filter((n) => !n.read),
    ...notifications.filter((n) => !n.read),
  ].length;

  useEffect(() => {
    setUnreadCount(totalUnread);
  }, [requestNotifications, notifications, totalUnread]);

  const markAsRead = async (notificationId) => {
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    );

    const notificationsRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "notifications",
      "list",
    );
    await updateDoc(notificationsRef, { notifications: updated });
    setNotifications(updated);
  };

  const markRequestAsRead = async (notificationId) => {
    const updated = requestNotifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    );

    const requestNotificationsRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "request_notifications",
      "list",
    );
    await updateDoc(requestNotificationsRef, { notifications: updated });
    setRequestNotifications(updated);
  };

  const deleteNotification = async (notificationId) => {
    const updated = notifications.filter((n) => n.id !== notificationId);
    const notificationsRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "notifications",
      "list",
    );
    await updateDoc(notificationsRef, { notifications: updated });
    setNotifications(updated);
    playedSoundIds.current.delete(notificationId);
  };

  const deleteRequestNotification = async (notificationId) => {
    const updated = requestNotifications.filter((n) => n.id !== notificationId);
    const requestNotificationsRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "request_notifications",
      "list",
    );
    await updateDoc(requestNotificationsRef, { notifications: updated });
    setRequestNotifications(updated);
    playedSoundIds.current.delete(notificationId);
  };

  const clearAll = async () => {
    const notificationsRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "notifications",
      "list",
    );
    await updateDoc(notificationsRef, { notifications: [] });
    setNotifications([]);
    playedSoundIds.current.clear();
  };

  const clearAllRequestNotifications = async () => {
    const requestNotificationsRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "request_notifications",
      "list",
    );
    await updateDoc(requestNotificationsRef, { notifications: [] });
    setRequestNotifications([]);
    playedSoundIds.current.clear();
  };

  const clearAllNotifications = async () => {
    await clearAll();
    await clearAllRequestNotifications();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return t("notification.justNow");
    if (diff < 3600)
      return t("notification.minAgo", { count: Math.floor(diff / 60) });
    if (diff < 86400)
      return t("notification.hourAgo", { count: Math.floor(diff / 3600) });
    return t("notification.dayAgo", { count: Math.floor(diff / 86400) });
  };

  const getNotificationIcon = (notification) => {
    if (notification.type === "team_request") return "👤";
    if (notification.type === "community_post") {
      if (notification.title?.includes("📁")) return "📁";
      if (notification.title?.includes("💼")) return "💼";
      if (notification.title?.includes("❓")) return "❓";
      return "📝";
    }
    if (notification.type === "workspace_message") return "🏢";
    if (notification.type === "workspace_media") return "📎";
    if (notification.type === "workspace_notification") return "🔔";
    return "🔔";
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      if (notification.type === "team_request") {
        markRequestAsRead(notification.id);
      } else {
        markAsRead(notification.id);
      }
    }

    if (notification.data?.chatId) {
      window.location.href = `/chat/${notification.data.chatId}`;
    }

    if (notification.data?.teamId && notification.data?.channelId) {
      window.location.href = `/workspace/${notification.data.teamId}/channel/${notification.data.channelId}`;
    }

    if (notification.data?.communityId && notification.data?.category) {
      window.location.href = `/community/${notification.data.category}/${notification.data.communityId}`;
    }

    if (notification.data?.teamId && !notification.data?.channelId) {
      window.location.href = `/team/${notification.data.teamId}`;
    }

    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all duration-300 ${getHoverBg()} ${getTextColor()} hover:scale-105`}>
        <IoNotifications className="text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-3 w-80 md:w-96 rounded-2xl shadow-2xl z-50 ${getBgColor()} border ${getBorderColor()} overflow-hidden backdrop-blur-sm transition-all duration-300 animate-slideDown`}>
          <div
            className={`flex justify-between items-center p-4 border-b ${getBorderColor()} ${getGradientBg()}`}>
            <h3
              className={`font-bold ${getTextColor()} flex items-center gap-2`}>
              <IoNotifications className="text-xl" />
              {t("notification.title")}
              {unreadCount > 0 && (
                <span className="ml-2 text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  {unreadCount} {t("notification.new")}
                </span>
              )}
            </h3>
            <div className="flex gap-2 items-center">
              {allNotifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className={`text-sm ${getSecondaryTextColor()} hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10`}>
                  <MdDoneAll className="text-lg" />
                  {t("notification.clearAll")}
                </button>
              )}
            </div>
          </div>

          <div
            className={`px-4 py-2.5 text-xs border-b ${getBorderColor()} ${getSecondaryTextColor()} bg-opacity-50`}>
            {userSettings.notifications?.messages === false ? (
              <div className="flex items-center gap-2 text-amber-400">
                <span></span>
                <span>{t("notification.disabled")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400">
                <span></span>
                <span>{t("notification.enabled")}</span>
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {allNotifications.length === 0 ? (
              <div className={`p-8 text-center ${getSecondaryTextColor()}`}>
                <div className="text-5xl mb-3 opacity-30"></div>
                <p className="font-medium">
                  {t("notification.noNotifications")}
                </p>
                <p className="text-xs mt-1 opacity-60">
                  {t("notification.noNotificationsDesc")}
                </p>
                {permission !== "granted" && (
                  <button
                    onClick={async () => {
                      const result = await Notification.requestPermission();
                      setPermission(result);
                    }}
                    className={`mt-4 ${getGradientBg()} text-white px-4 py-2 rounded-xl text-sm font-medium hover:scale-105 transition-all duration-300 shadow-lg`}>
                    {t("notification.enableNotifications")}
                  </button>
                )}
              </div>
            ) : (
              allNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b ${getBorderColor()} cursor-pointer transition-all duration-200 ${getHoverBg()} ${
                    !notification.read
                      ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-l-4 border-l-indigo-500"
                      : ""
                  } hover:pl-6`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div
                        className={`font-medium ${getTextColor()} text-sm flex items-center gap-1.5`}>
                        <span className="text-lg">
                          {getNotificationIcon(notification)}
                        </span>
                        {notification.title}
                        {!notification.read && (
                          <span className="ml-1 inline-block w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <div
                        className={`text-xs ${getSecondaryTextColor()} mt-1.5 leading-relaxed`}>
                        {notification.body}
                      </div>
                      <div
                        className={`text-xs ${getSecondaryTextColor()} mt-2 opacity-60 flex items-center gap-1`}>
                        <span className="text-[10px]"></span>
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notification.type === "team_request") {
                          deleteRequestNotification(notification.id);
                        } else {
                          deleteNotification(notification.id);
                        }
                      }}
                      className={`p-1.5 rounded-full ${getSecondaryTextColor()} hover:bg-red-500/20 hover:text-red-400 transition-all duration-200`}>
                      <MdClose className="text-lg" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {allNotifications.length > 0 && (
            <div
              className={`p-2 text-center border-t ${getBorderColor()} ${getSecondaryTextColor()} text-xs opacity-60`}>
              {t("notification.clickToOpen")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
