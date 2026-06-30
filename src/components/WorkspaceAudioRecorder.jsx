import React, { useState, useRef, useEffect } from "react";
import {
  doc,
  serverTimestamp,
  collection,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import { FiMic, FiMicOff, FiSend, FiX } from "react-icons/fi";

const WorkspaceAudioRecorder = ({ teamId, channel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const shouldUploadRef = useRef(true);

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
    shouldUploadRef.current = true;

    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "audio/webm",
    });

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      if (shouldUploadRef.current && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        
        if (audioBlob.size > 0) {
          const calculatedDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
          setRecordingTime(calculatedDuration);
          await uploadRecording(audioBlob, calculatedDuration);
        }
      }
      
      audioChunksRef.current = [];
    };

    mediaRecorderRef.current.start(100);
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stopRecording = () => {
    if (!isRecording) return;

    shouldUploadRef.current = true;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    }

    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (!isRecording) return;

    shouldUploadRef.current = false;
    
    audioChunksRef.current = [];

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    }

    clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const uploadRecording = async (audioBlob, duration) => {
    if (!teamId || !channel) {
      console.error("Team ID or Channel ID is missing");
      return;
    }

    setIsUploading(true);
    
    try {
      const timestamp = new Date().getTime();
      const fileName = `audio_${timestamp}.webm`;
      
      const storageRef = ref(storage, `teams/${teamId}/workspace/${channel}/audios/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, audioBlob);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          (error) => {
            console.error("Upload error:", error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              const audioMessagesRef = collection(
                db, 
                "teams", 
                teamId, 
                "workspace", 
                channel, 
                "audioMessages" 
              );

              await addDoc(audioMessagesRef, {
                type: "audio-message",
                url: downloadURL,
                duration: duration,
                timestamp: serverTimestamp(),
                createdAt: serverTimestamp(),
                fileName: fileName,
                originalName: `audio_message_${timestamp}.webm`,
                size: audioBlob.size,
                sender: auth.currentUser?.uid,
                senderName: auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Unknown",
                senderAvatar: auth.currentUser?.photoURL || null,
                channel: channel,
                teamId: teamId
              });

              // Update channel last message info
              const channelDocRef = doc(db, "teams", teamId, "workspace", channel);
              await updateDoc(channelDocRef, {
                lastMessage: "🎤 Voice message",
                lastMessageTime: serverTimestamp(),
                hasMedia: true
              });

              resolve();
            } catch (error) {
              console.error("Error saving audio message:", error);
              reject(error);
            }
          }
        );
      });
    } catch (err) {
      console.error("Unexpected upload error:", err);
    } finally {
      setIsUploading(false);
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
    <div className="relative">
      {permissionDenied ? (
        <button
          disabled
          className="p-2 rounded-lg bg-red-500/20 text-red-500 cursor-not-allowed">
          <FiMicOff className="text-lg" />
        </button>
      ) : (
        <>
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isUploading}
              className={`p-2 rounded-lg text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#3b3d41] transition-colors ${
                isUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}>
              <FiMic className="text-lg" />
            </button>
          ) : (
            <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-[#1e1f22] rounded-lg shadow-xl border border-[#2b2d31] p-4 min-w-[300px]">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={cancelRecording}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                  <FiX className="text-xl" />
                </button>

                <div className="flex-1 flex items-center justify-center gap-3">
                  <div className="flex items-end h-8 space-x-1">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const height = isRecording
                        ? Math.random() * 16 + 4
                        : 4;
                      return (
                        <div
                          key={i}
                          className="w-1 bg-[#5865f2] rounded-full transition-all duration-100 animate-pulse"
                          style={{ height: `${height}px` }}
                        />
                      );
                    })}
                  </div>

                  <span className="text-sm font-mono text-[#dbdee1] min-w-[60px]">
                    {formatTime(recordingTime)}
                  </span>
                </div>

                <button
                  onClick={stopRecording}
                  className="p-2 rounded-lg bg-[#5865f2] text-white hover:bg-[#4752c4] transition-colors">
                  <FiSend className="text-lg" />
                </button>
              </div>
              
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#5865f2] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkspaceAudioRecorder;