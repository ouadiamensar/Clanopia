import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { getDoc, setDoc } from "firebase/firestore";

export const sendMessage = async (
  chatId, 
  messageContent, 
  senderId, 
  type = "text", 
  fileUrl = null, 
  duration = null, 
  isForwarded = false, 
  replyTo = null
) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const dailyDocRef = doc(db, "chats", chatId, "dailyMessages", today);

    const dailyDoc = await getDoc(dailyDocRef);
    if (!dailyDoc.exists()) {
      await setDoc(dailyDocRef, { createdAt: serverTimestamp() });
    }

    const messagesRef = collection(dailyDocRef, "messages");
    
    const messageData = {
      sender: senderId,
      content: messageContent,
      timestamp: serverTimestamp(),
      type: type,
      ...(fileUrl && { url: fileUrl }),
      ...(duration && { duration: duration }),
      ...(isForwarded && { forwarded: true }),
      ...(replyTo && { replyTo: replyTo })
    };

    const messageRef = await addDoc(messagesRef, messageData);

    const lastMessageContent = type === "text" 
      ? messageContent 
      : type === "image" 
        ? "📷 صورة" 
        : type === "video" 
          ? "🎥 فيديو" 
          : type === "audio" 
            ? "🎵 رسالة صوتية" 
            : "📎 مرفق";

    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);
    const chatData = chatDoc.data();
    
    await updateDoc(chatRef, {
      lastMessage: lastMessageContent,
      lastMessageTime: serverTimestamp(),
    });

   
    const senderProfileRef = doc(db, "users", senderId, "profile", "data");
    const senderProfile = await getDoc(senderProfileRef);
    const senderName = senderProfile.exists() 
      ? senderProfile.data().name || "Someone"
      : "Someone";


      const recipients = chatData.users.filter(userId => userId !== senderId);

    for (const recipientId of recipients) {

      const settingsRef = doc(db, "users", recipientId, "settings", "data");
      const settingsDoc = await getDoc(settingsRef);
      const settings = settingsDoc.exists() ? settingsDoc.data() : {};
      const notificationsEnabled = settings.notifications?.messages !== false;

      if (!notificationsEnabled) continue;

      let notificationBody = type === 'text' 
        ? (messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent)
        : type === 'image' ? '📷 Sent an image'
        : type === 'video' ? '🎥 Sent a video'
        : type === 'audio' ? '🎙️ Sent a voice message'
        : 'Sent a message';

      const notificationRef = doc(db, "users", recipientId, "notifications", "list");
      const notificationDoc = await getDoc(notificationRef);
      
      const newNotification = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: senderName,
        body: notificationBody,
        timestamp: new Date(),
        read: false,
        type: 'message',
        data: {
          chatId: chatId,
          messageId: messageRef.id,
          senderId: senderId
        }
      };

      if (notificationDoc.exists()) {
        const currentNotifications = notificationDoc.data().notifications || [];
        const updatedNotifications = [newNotification, ...currentNotifications].slice(0, 100);
        await updateDoc(notificationRef, { notifications: updatedNotifications });
      } else {
        await setDoc(notificationRef, { notifications: [newNotification] });
      }
      
      if (document.hidden && Notification.permission === 'granted') {
        new Notification(senderName, {
          body: notificationBody,
          icon: '/favicon.ico',
          data: { chatId: chatId }
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    return false;
  }
};