// src/hooks/useNotifications.js
import { useEffect, useState } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const useNotifications = () => {
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        await getFCMToken();
      }
      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  };

  const getFCMToken = async () => {
    try {
      const messaging = getMessaging();
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

      const token = await getToken(messaging, { vapidKey });

      if (token) {
        setFcmToken(token);
        await saveTokenToFirestore(token);
        return token;
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
    }
    return null;
  };

  const saveTokenToFirestore = async (token) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const tokenRef = doc(
        db,
        "users",
        currentUser.uid,
        "notifications",
        "fcmTokens",
      );
      const tokenDoc = await getDoc(tokenRef);

      if (tokenDoc.exists()) {
        const tokens = tokenDoc.data().tokens || [];
        if (!tokens.includes(token)) {
          await updateDoc(tokenRef, {
            tokens: arrayUnion(token),
            lastUpdated: new Date(),
          });
        }
      } else {
        await setDoc(tokenRef, {
          tokens: [token],
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      console.error("Error saving token to Firestore:", error);
    }
  };

  const listenToForegroundMessages = () => {
    const messaging = getMessaging();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📱 Foreground message received:", payload);

      if (Notification.permission === "granted") {
        new Notification(
          payload.notification?.title ||
            payload.data?.title ||
            "New Notification",
          {
            body:
              payload.notification?.body ||
              payload.data?.body ||
              "You have a new message",
            icon: "/favicon.ico",
          },
        );
      }
    });

    return unsubscribe;
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (notificationPermission === "granted") {
      const unsubscribe = listenToForegroundMessages();
      return () => unsubscribe();
    }
  }, [notificationPermission]);

  const loadNotifications = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    try {
      const notificationsRef = doc(
        db,
        "users",
        currentUser.uid,
        "notifications",
        "list",
      );
      const notificationsDoc = await getDoc(notificationsRef);

      if (notificationsDoc.exists()) {
        const notifications = notificationsDoc.data().notifications || [];
        return notifications.sort((a, b) => {
          const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
          const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
          return timeB - timeA;
        });
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
    return [];
  };

  const markNotificationAsRead = async (notificationId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const notificationsRef = doc(
        db,
        "users",
        currentUser.uid,
        "notifications",
        "list",
      );
      const notificationsDoc = await getDoc(notificationsRef);

      if (notificationsDoc.exists()) {
        const notifications = notificationsDoc.data().notifications || [];
        const updatedNotifications = notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif,
        );

        await updateDoc(notificationsRef, {
          notifications: updatedNotifications,
        });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const notificationsRef = doc(
        db,
        "users",
        currentUser.uid,
        "notifications",
        "list",
      );
      const notificationsDoc = await getDoc(notificationsRef);

      if (notificationsDoc.exists()) {
        const notifications = notificationsDoc.data().notifications || [];
        const updatedNotifications = notifications.filter(
          (notif) => notif.id !== notificationId,
        );

        await updateDoc(notificationsRef, {
          notifications: updatedNotifications,
        });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const notificationsRef = doc(
        db,
        "users",
        currentUser.uid,
        "notifications",
        "list",
      );
      await updateDoc(notificationsRef, {
        notifications: [],
      });
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  return {
    notificationPermission,
    fcmToken,
    requestNotificationPermission,
    getFCMToken,
    loadNotifications,
    markNotificationAsRead,
    deleteNotification,
    clearAllNotifications,
  };
};

export default useNotifications;
