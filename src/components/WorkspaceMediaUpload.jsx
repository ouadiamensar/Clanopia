/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiEdit2,
  FiUpload,
  FiPlus,
  FiVideo,
  FiImage,
  FiFile,
  FiFileText,
  FiMusic,
  FiAlertCircle,
} from "react-icons/fi";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db, storage, auth } from "../firebase";

const WorkspaceMediaUpload = ({
  channel,
  teamId,
  mediaFiles: initialMedia = [],
  onClose,
  themeMode: parentThemeMode,
}) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [captions, setCaptions] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [currentView, setCurrentView] = useState("grid");
  const [currentIndex, setCurrentIndex] = useState(0);
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
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const fileInputRef = useRef(null);
  const getBgColor = () =>
    themeMode === "light" ? "bg-white" : "bg-[#1e1e1f]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-white";
  const getTextSecondaryColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getCardBorder = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getInputBg = () =>
    themeMode === "light" ? "bg-white" : "bg-[#222223]";
  const getInputBorder = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getInputText = () =>
    themeMode === "light" ? "text-gray-900" : "text-white";
  const getOverlayBg = () =>
    themeMode === "light" ? "bg-gray-900/50" : "bg-[#1e1e1f]/70";
  const getShadowColor = () =>
    themeMode === "light" ? "shadow-2xl" : "shadow-2xl shadow-black/50";
  const getHoverBg = () =>
    themeMode === "light" ? "hover:bg-gray-50" : "hover:bg-[#29292a]";
  const getPlaceholderColor = () =>
    themeMode === "light" ? "placeholder-gray-400" : "placeholder-gray-500";
  const getDocPreviewBg = () =>
    themeMode === "light" ? "bg-gray-50" : "bg-[#222223]/50";
  const readFileContent = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const fileType = file.type;

      if (fileType.startsWith("text/") || fileType === "application/pdf") {
        reader.onload = (e) => {
          resolve({
            content: e.target.result,
            type: fileType,
          });
        };
        reader.readAsText(file);
      } else if (fileType.includes("word") || fileType.includes("document")) {
        resolve({
          content: "Word document",
          type: fileType,
          isWord: true,
        });
      } else {
        resolve({
          content: "Preview not available",
          type: fileType,
        });
      }
    });
  };

  useEffect(() => {
    if (initialMedia && initialMedia.length > 0) {
      const formattedMedia = initialMedia.map((file, index) => ({
        file,
        id: `media-${Date.now()}-${index}`,
        preview: file.type.startsWith("video/")
          ? URL.createObjectURL(file)
          : file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : null,
        type: file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("audio/")
              ? "audio"
              : "document",
        name: file.name,
        size: file.size,
        fileType: file.type,
      }));
      setMediaFiles(formattedMedia);
    }
  }, [initialMedia]);

  useEffect(() => {
    return () => {
      mediaFiles.forEach((media) => {
        if (media.preview) {
          URL.revokeObjectURL(media.preview);
        }
      });
    };
  }, [mediaFiles]);

  const handleAddMoreFiles = async (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      const formattedNewFiles = await Promise.all(
        newFiles.map(async (file, index) => {
          let preview = null;
          let type = "document";

          if (file.type.startsWith("video/")) {
            preview = URL.createObjectURL(file);
            type = "video";
          } else if (file.type.startsWith("image/")) {
            preview = URL.createObjectURL(file);
            type = "image";
          } else if (file.type.startsWith("audio/")) {
            type = "audio";
          } else {
            type = "document";
          }

          let content = null;
          if (type === "document") {
            const result = await readFileContent(file);
            content = result;
          }

          return {
            file,
            id: `media-${Date.now()}-${mediaFiles.length + index}`,
            preview,
            type,
            name: file.name,
            size: file.size,
            fileType: file.type,
            content,
          };
        }),
      );
      setMediaFiles([...mediaFiles, ...formattedNewFiles]);
    }
    e.target.value = null;
  };

  const removeMedia = (id) => {
    const mediaToRemove = mediaFiles.find((media) => media.id === id);
    if (mediaToRemove && mediaToRemove.preview) {
      URL.revokeObjectURL(mediaToRemove.preview);
    }

    const newMediaFiles = mediaFiles.filter((media) => media.id !== id);
    setMediaFiles(newMediaFiles);

    const newCaptions = { ...captions };
    delete newCaptions[id];
    setCaptions(newCaptions);

    if (currentView === "carousel" && newMediaFiles.length === 0) {
      setCurrentView("grid");
    }
  };

  const updateCaption = (id, text) => {
    setCaptions({ ...captions, [id]: text });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const openCarousel = (index) => {
    setCurrentIndex(index);
    setCurrentView("carousel");
  };

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaFiles.length);
  };

  const prevMedia = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length,
    );
  };

  const openDocViewer = (media) => {
    setSelectedDoc(media);
    setIsDocViewerOpen(true);
  };

  const sendMediaNotification = async (
    teamId,
    channelId,
    mediaData,
    fileType,
    messageId,
  ) => {
    console.log("🔔 sendMediaNotification STARTED for type:", fileType);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("❌ No current user");
        return false;
      }

      const senderName =
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "Someone";

      let notificationBody = "";
      let icon = "";
      switch (fileType) {
        case "image":
          notificationBody = "📷 Sent an image";
          icon = "🖼️";
          break;
        case "video":
          notificationBody = "🎥 Sent a video";
          icon = "🎬";
          break;
        case "audio":
          notificationBody = "🎙️ Sent a voice message";
          icon = "🎤";
          break;
        case "document":
          notificationBody = "📄 Sent a document";
          icon = "📄";
          break;
        default:
          notificationBody = "Sent a media file";
          icon = "📁";
      }

      if (mediaData.caption) {
        notificationBody += `: "${mediaData.caption.substring(0, 50)}${mediaData.caption.length > 50 ? "..." : ""}"`;
      }

      let recipientIds = [];

      try {
        const membersRef = collection(db, "teams", teamId, "members");
        const membersSnapshot = await getDocs(membersRef);
        if (membersSnapshot.size > 0) {
          recipientIds = membersSnapshot.docs.map((doc) => doc.id);
        }
      } catch (err) {
        console.log("Error reading members collection:", err);
      }

      if (recipientIds.length === 0) {
        try {
          const teamDoc = await getDoc(doc(db, "teams", teamId));
          if (teamDoc.exists()) {
            const teamData = teamDoc.data();
            if (teamData.members && Array.isArray(teamData.members)) {
              recipientIds = teamData.members;
            } else if (teamData.users && Array.isArray(teamData.users)) {
              recipientIds = teamData.users;
            }
          }
        } catch (err) {
          console.log("Error reading team document:", err);
        }
      }

      const recipients = recipientIds.filter((id) => id !== currentUser.uid);
      console.log("👥 Media notification recipients:", recipients.length);

      if (recipients.length === 0) {
        console.log("⚠️ No recipients for media notification");
        return false;
      }

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

          const newNotification = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: `${icon} ${senderName} in #${channelId}`,
            body: notificationBody,
            timestamp: new Date(),
            read: false,
            type: "workspace_media",
            data: {
              teamId: teamId,
              channelId: channelId,
              messageId: messageId,
              senderId: currentUser.uid,
              senderName: senderName,
              mediaType: fileType,
              mediaUrl: mediaData.url,
              caption: mediaData.caption || "",
              fileName: mediaData.fileName,
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

          if (document.hidden && Notification.permission === "granted") {
            new Notification(`${icon} ${senderName} in #${channelId}`, {
              body: notificationBody,
              icon: "/vite.svg",
              data: {
                teamId: teamId,
                channelId: channelId,
                url: `/workspace/${teamId}/channel/${channelId}`,
              },
            });
          }
        } catch (err) {
          console.error(`❌ Error for ${recipientId}:`, err);
        }
      }

      console.log("✅ sendMediaNotification completed!");
      return true;
    } catch (error) {
      console.error("❌ Error in sendMediaNotification:", error);
      return false;
    }
  };

  const uploadMedia = async () => {
    if (!teamId || !channel || mediaFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({});

    try {
      const channelDocRef = doc(db, "teams", teamId, "workspace", channel);
      const uploadedMediaList = [];

      for (let i = 0; i < mediaFiles.length; i++) {
        const media = mediaFiles[i];
        const timestamp = new Date().getTime();
        const fileExtension = media.file.name.split(".").pop();
        const fileName = `${media.type}_${timestamp}_${i}.${fileExtension}`;
        const storageRef = ref(
          storage,
          `teams/${teamId}/workspace/${channel}/${media.type}s/${fileName}`,
        );

        const uploadTask = uploadBytesResumable(storageRef, media.file);

        const downloadURL = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress((prev) => ({
                ...prev,
                [media.id]: Math.round(progress),
              }));
            },
            (error) => reject(error),
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (error) {
                reject(error);
              }
            },
          );
        });

        const mediaData = {
          type: media.type,
          url: downloadURL,
          caption: captions[media.id] || "",
          fileName: fileName,
          originalName: media.name,
          size: media.file.size,
          fileType: media.file.type,
          timestamp: serverTimestamp(),
          uploadedBy: {
            uid: auth.currentUser?.uid,
            name: auth.currentUser?.displayName || "",
            email: auth.currentUser?.email || "",
          },
          storagePath: uploadTask.snapshot.ref.fullPath,
          channel: channel,
          teamId: teamId,
          ...(media.type === "document" && {
            documentInfo: {
              isWord: media.content?.isWord || false,
              fileType: media.file.type,
            },
          }),
        };

        const mediaCollectionRef = collection(
          db,
          "teams",
          teamId,
          "workspace",
          channel,
          "media",
        );
        const docRef = await addDoc(mediaCollectionRef, mediaData);

        uploadedMediaList.push({
          ...mediaData,
          id: docRef.id,
        });

        await sendMediaNotification(
          teamId,
          channel,
          mediaData,
          media.type,
          docRef.id,
        );
      }

      await updateDoc(channelDocRef, {
        lastMediaUpdate: serverTimestamp(),
        mediaCount: uploadedMediaList.length,
        hasMedia: true,
      });

      console.log(
        `✅ Successfully uploaded ${uploadedMediaList.length} media files`,
      );

      setTimeout(() => {
        onClose && onClose();
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const renderFileIcon = (media) => {
    const fileType = media.fileType || media.type;

    if (fileType.includes("pdf")) {
      return <FiFileText className="text-red-500 text-4xl" />;
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return <FiFileText className="text-blue-500 text-4xl" />;
    } else if (fileType.includes("text")) {
      return <FiFileText className="text-gray-500 text-4xl" />;
    } else if (fileType.includes("audio")) {
      return <FiMusic className="text-purple-500 text-4xl" />;
    } else {
      return <FiFile className="text-gray-400 text-4xl" />;
    }
  };

  if (mediaFiles.length === 0) {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center p-4 z-100 ${getOverlayBg()}`}>
        <div
          className={`${getCardBg()} rounded-lg p-8 text-center max-w-md w-full ${getShadowColor()}`}>
          <div
            className={`w-16 h-16 ${themeMode === "light" ? "bg-gray-100" : "bg-gray-700"} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <FiImage
              className={`text-2xl ${themeMode === "light" ? "text-gray-400" : "text-gray-500"}`}
            />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${getTextColor()}`}>
            No Media Selected
          </h3>
          <p className={`${getTextSecondaryColor()} mb-6`}>
            Please select files to upload
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Choose Files
            </button>
            <button
              onClick={onClose}
              className={`px-6 py-2 border ${getBorderColor()} ${getTextColor()} rounded-lg ${getHoverBg()} transition-colors`}>
              Cancel
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAddMoreFiles}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx"
            multiple
            className="hidden"
          />
        </div>
      </div>
    );
  }

  if (isDocViewerOpen && selectedDoc) {
    return (
      <div
        className={`fixed inset-0 ${getOverlayBg()} flex items-center justify-center p-4 z-50`}>
        <div
          className={`${getCardBg()} rounded-lg p-6 max-w-4xl w-full max-h-[90vh] ${getShadowColor()}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-xl font-semibold ${getTextColor()}`}>
              {selectedDoc.name}
            </h3>
            <button
              onClick={() => setIsDocViewerOpen(false)}
              className={`p-2 ${getTextSecondaryColor()} rounded-full ${getHoverBg()} transition-colors`}>
              <FiX className="text-xl" />
            </button>
          </div>

          <div
            className={`${getDocPreviewBg()} rounded-lg p-8 overflow-auto max-h-[60vh]`}>
            <div className="flex flex-col items-center justify-center space-y-4">
              {renderFileIcon(selectedDoc)}
              <div className="text-center">
                <p className={`font-medium ${getTextColor()}`}>
                  {selectedDoc.name}
                </p>
                <p className={`text-sm ${getTextSecondaryColor()}`}>
                  {formatFileSize(selectedDoc.size)} •{" "}
                  {selectedDoc.fileType || selectedDoc.type}
                </p>
                {selectedDoc.content?.isWord && (
                  <p className="text-sm text-blue-500 mt-2">
                    ⚡ Word document detected. Download to view full content.
                  </p>
                )}
                {selectedDoc.content?.content &&
                  !selectedDoc.content.isWord && (
                    <div
                      className={`mt-4 p-4 ${themeMode === "light" ? "bg-white" : "bg-gray-900"} rounded border ${getBorderColor()} max-h-[300px] overflow-auto text-left`}>
                      <pre
                        className={`text-sm ${getTextColor()} whitespace-pre-wrap`}>
                        {selectedDoc.content.content.substring(0, 500)}
                        {selectedDoc.content.content.length > 500 && "..."}
                      </pre>
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => setIsDocViewerOpen(false)}
              className={`px-6 py-2 border ${getBorderColor()} ${getTextColor()} rounded-lg ${getHoverBg()} transition-colors`}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "carousel") {
    const currentMedia = mediaFiles[currentIndex];

    return (
      <div
        className={`fixed inset-0 ${getOverlayBg()} flex items-center justify-center p-4 z-50`}>
        <div className="relative max-w-4xl w-full max-h-[90vh]">
          <button
            onClick={() => setCurrentView("grid")}
            className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors">
            <FiX className="text-xl" />
          </button>

          <div
            className={`${themeMode === "light" ? "bg-black" : "bg-gray-900"} rounded-lg overflow-hidden`}>
            {currentMedia.type === "image" ? (
              <img
                src={currentMedia.preview}
                alt="Preview"
                className="w-full h-[70vh] object-contain"
              />
            ) : currentMedia.type === "video" ? (
              <video
                src={currentMedia.preview}
                className="w-full h-[70vh] object-contain"
                controls
                autoPlay
              />
            ) : (
              <div className="w-full h-[70vh] flex flex-col items-center justify-center p-8">
                {renderFileIcon(currentMedia)}
                <p className={`text-white mt-4 text-center`}>
                  {currentMedia.name}
                </p>
                <button
                  onClick={() => openDocViewer(currentMedia)}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  View Document
                </button>
              </div>
            )}
          </div>

          <div className={`${getCardBg()} p-4 rounded-b-lg`}>
            <div className="flex justify-between items-center mb-3">
              <h4 className={`font-semibold truncate ${getTextColor()}`}>
                {currentMedia.name}
              </h4>
              <span className={`text-sm ${getTextSecondaryColor()}`}>
                {formatFileSize(currentMedia.size)}
              </span>
            </div>

            <input
              type="text"
              value={captions[currentMedia.id] || ""}
              onChange={(e) => updateCaption(currentMedia.id, e.target.value)}
              placeholder="Add a caption..."
              className={`w-full px-3 py-2 border ${getInputBorder()} ${getInputBg()} ${getInputText()} ${getPlaceholderColor()} rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none`}
              disabled={isUploading}
            />
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={prevMedia}
              disabled={mediaFiles.length <= 1}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors">
              Previous
            </button>

            <span className="text-white">
              {currentIndex + 1} / {mediaFiles.length}
            </span>

            <button
              onClick={nextMedia}
              disabled={mediaFiles.length <= 1}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 ${getOverlayBg()} flex items-center justify-center p-4 z-50`}>
      <div
        className={`${getCardBg()} rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col ${getShadowColor()}`}>
        <div
          className={`flex justify-between items-center mb-6 ${getBorderColor()} pb-4 border-b`}>
          <h2 className={`text-xl font-semibold ${getTextColor()}`}>
            Media Preview ({mediaFiles.length} files)
          </h2>
          <button
            onClick={onClose}
            className={`p-2 ${getTextSecondaryColor()} rounded-full ${getHoverBg()} transition-colors`}>
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 flex-1 overflow-y-auto p-2">
          {mediaFiles.map((media, index) => (
            <div
              key={media.id}
              className={`${getCardBg()} border ${getCardBorder()} rounded-lg overflow-hidden shadow-sm group relative hover:shadow-md transition-shadow`}>
              <div
                className="relative aspect-video bg-gray-100 dark:bg-gray-700 cursor-pointer"
                onClick={() =>
                  media.type === "document"
                    ? openDocViewer(media)
                    : openCarousel(index)
                }>
                {media.type === "image" ? (
                  <img
                    src={media.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : media.type === "video" ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <video
                      src={media.preview}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FiVideo className="text-white text-3xl opacity-70" />
                    </div>
                  </div>
                ) : media.type === "audio" ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                    <FiMusic className="text-white text-4xl mb-2" />
                    <span className="text-white text-sm truncate px-2">
                      {media.name}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                    {renderFileIcon(media)}
                    <span className="text-white text-sm mt-2 truncate px-2">
                      {media.name}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      {formatFileSize(media.size)}
                    </span>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMedia(media.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                  <FiX className="text-sm" />
                </button>

                {uploadProgress[media.id] !== undefined &&
                  uploadProgress[media.id] < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50">
                      <div
                        className="bg-indigo-500 h-1 rounded-full transition-all"
                        style={{ width: `${uploadProgress[media.id]}%` }}
                      />
                    </div>
                  )}

                {uploadProgress[media.id] === 100 && (
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Uploaded!
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`text-xs ${getTextSecondaryColor()} font-medium truncate max-w-[150px]`}>
                    {media.name}
                  </span>
                  <span className={`text-xs ${getTextSecondaryColor()}`}>
                    {formatFileSize(media.size)}
                  </span>
                </div>

                <input
                  type="text"
                  value={captions[media.id] || ""}
                  onChange={(e) => updateCaption(media.id, e.target.value)}
                  placeholder="Add caption..."
                  className={`w-full px-2 py-1 text-sm border ${getInputBorder()} ${getInputBg()} ${getInputText()} ${getPlaceholderColor()} rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none`}
                  disabled={isUploading}
                />
              </div>
            </div>
          ))}

          {!isUploading && (
            <div
              className={`border-2 border-dashed ${getCardBorder()} rounded-lg flex flex-col items-center justify-center cursor-pointer ${getHoverBg()} transition-colors aspect-video`}
              onClick={() => fileInputRef.current?.click()}>
              <FiPlus className={`text-3xl ${getTextSecondaryColor()} mb-2`} />
              <span className={`${getTextSecondaryColor()} text-sm`}>
                Add More
              </span>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAddMoreFiles}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx"
          multiple
          className="hidden"
          disabled={isUploading}
        />

        <div className={`border-t ${getBorderColor()} pt-4`}>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className={`text-sm ${getTextSecondaryColor()}`}>
                {mediaFiles.length} file(s) ready to upload
              </span>

              {isUploading && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-indigo-600 dark:text-indigo-400">
                    Uploading...
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={onClose}
                disabled={isUploading}
                className={`px-6 py-2 border ${getBorderColor()} ${getTextColor()} rounded-lg ${getHoverBg()} disabled:opacity-50 transition-colors`}>
                Cancel
              </button>

              <button
                onClick={uploadMedia}
                disabled={isUploading || mediaFiles.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                <FiUpload className="text-lg" />
                Upload {mediaFiles.length} file(s)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceMediaUpload;
