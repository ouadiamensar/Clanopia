import React, { useState, useRef, useEffect } from "react";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import { AiFillAudio, AiOutlineAudioMuted } from "react-icons/ai";
import { FaTrashAlt } from "react-icons/fa";
import { RiSendPlaneFill } from "react-icons/ri";

const AudioRecorder = ({ chatId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const getMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return stream;
    } catch (err) {
      console.error("Microphone access error:", err);
      setPermissionDenied(true);
      return null;
    }
  };

  const startRecording = async () => {
    if (isRecording) return;

    const stream = await getMicrophonePermission();
    if (!stream) return;

    audioChunksRef.current = [];
    setRecordingTime(0);
    startTimeRef.current = Date.now();

    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "audio/webm",
    });

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      const audioContext = new AudioContext();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const calculatedDuration = audioBuffer.duration;

      setRecordingTime(Math.round(calculatedDuration));

      await uploadRecording(audioBlob, Math.round(calculatedDuration));
    };

    mediaRecorderRef.current.start(100);
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stopRecording = () => {
    if (!isRecording) return;

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream
      .getTracks()
      .forEach((track) => track.stop());

    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const uploadRecording = async (audioBlob, duration) => {
    if (!chatId) {
      return;
    }

    try {
      const timestamp = new Date().getTime();
      const fileName = `audio_${timestamp}.webm`;
      const storageRef = ref(storage, `chats/${chatId}/audios/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, audioBlob);

      uploadTask.on(
        "state_changed",

        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const today = new Date().toISOString().split("T")[0];
          const dailyDocRef = doc(db, "chats", chatId, "dailyMessages", today);

          const dailyDoc = await getDoc(dailyDocRef);
          if (!dailyDoc.exists()) {
            await setDoc(dailyDocRef, { createdAt: serverTimestamp() });
          }

          const messagesRef = collection(dailyDocRef, "messages");

          await addDoc(messagesRef, {
            type: "audio",
            url: downloadURL,
            duration: duration,
            timestamp: serverTimestamp(),
            fileName,
            size: audioBlob.size,
            sender: auth.currentUser?.uid,
          });

          const chatRef = doc(db, "chats", chatId);
          await updateDoc(chatRef, {
            lastMessage: "voice message",
            lastMessageTime: serverTimestamp(),
          });
        }
      );
    } catch (err) {
      console.error("Unexpected upload error:", err);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="mr-2">
      {permissionDenied ? (
        <p className="text-red-500 font-semibold">
          <AiOutlineAudioMuted className="text-3xl text-red-500" />
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-full px-2 py-2 w-full max-w-md">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="p-2 rounded-full bg-gradient-to-br from-indigo-400 to-green-600 shadow-md hover:from-indigo-500 hover:to-green-700 cursor-pointer an transition-colors">
                <AiFillAudio className="text-2xl text-white" />
              </button>
            ) : (
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={() => {
                    stopRecording();
                    audioChunksRef.current = [];
                  }}
                  className="p-2 text-red-500 hover:text-red-700 cursor-pointer hover:scale-105 transition-colors">
                  <FaTrashAlt className="text-xl" />
                </button>

                <div className="flex-1 mx-4 flex items-center">
                  <div className="flex items-end h-7 space-x-1">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const height = isRecording
                        ? Math.random() * 10 + 2
                        : 4 + Math.abs(Math.sin(i * 0.3)) * 6;

                      return (
                        <div
                          key={i}
                          className="w-1 bg-blue-500 rounded-full transition-all duration-100"
                          style={{ height: `${height}px` }}
                        />
                      );
                    })}
                  </div>

                  <span className="ml-3 text-sm font-medium text-gray-700 min-w-[40px]">
                    {formatTime(recordingTime)}
                  </span>
                </div>

                <button
                  onClick={stopRecording}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-800 hover:scale-95 cursor-pointer transition-colors">
                  <RiSendPlaneFill className="text-xl" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AudioRecorder;
