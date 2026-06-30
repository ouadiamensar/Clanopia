import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

const useChatMessages = (chatId) => {
  const [groupedMessages, setGroupedMessages] = useState({});

  useEffect(() => {
    if (!chatId) return;

    setGroupedMessages({});

    const dailyMessagesRef = collection(db, "chats", chatId, "dailyMessages");
    const unsubscribes = [];

    const unsubscribeDaily = onSnapshot(dailyMessagesRef, (snapshot) => {
      snapshot.docs.forEach((dailyDoc) => {
        const date = dailyDoc.id;
        const messagesRef = collection(dailyDoc.ref, "messages");

        const unsubscribeMessages = onSnapshot(
          query(messagesRef, orderBy("timestamp", "asc")),
          (messagesSnapshot) => {
            const messages = messagesSnapshot.docs.map((doc) => {
              const data = doc.data();
              // التحويل الآمن للوقت
              const timestamp = data.timestamp
                ? typeof data.timestamp.toDate === "function"
                  ? data.timestamp.toDate()
                  : new Date(data.timestamp)
                : new Date(); // وقت حالى كقيمة افتراضية

              return {
                id: doc.id,
                ...data,
                timestamp: timestamp,
              };
            });

            setGroupedMessages((prev) => ({
              ...prev,
              [date]: messages,
            }));
          }
        );

        unsubscribes.push(unsubscribeMessages);
      });
    });

    unsubscribes.push(unsubscribeDaily);

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [chatId]);

  return groupedMessages;
};

export default useChatMessages;
