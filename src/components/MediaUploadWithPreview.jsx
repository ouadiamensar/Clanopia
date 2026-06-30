import { useState, useEffect, useRef } from "react";
import { FiX, FiEdit2, FiUpload, FiPlus } from "react-icons/fi";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, storage, auth } from "../firebase";
import { IoIosImages } from "react-icons/io";
import { useLanguage } from "../context/LanguageContext";

const MediaUploadWithPreview = ({
  chatId,
  mediaFiles: initialMedia = [],
  onClose,
  themeMode = "",
}) => {
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

  const [mediaFiles, setMediaFiles] = useState([]);
  const [captions, setCaptions] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const getBgColor = () =>
    themeMode === "light" ? "bg-white" : "bg-[#222223]";
  const getCardBg = () =>
    themeMode === "light" ? "bg-gray-50" : "bg-[#252527]";
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-white";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getHoverBg = () =>
    themeMode === "light" ? "hover:bg-gray-200" : "hover:bg-[#29292a]";
  const getDashedBorder = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getProgressBg = () =>
    themeMode === "light" ? "bg-gray-200" : "bg-[#29292a]";

  useEffect(() => {
    if (initialMedia && initialMedia.length > 0) {
      const formattedMedia = initialMedia.map((file) => ({
        file,
        id: Date.now() + Math.random(),
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
      }));
      setMediaFiles(formattedMedia);
    }
  }, [initialMedia]);

  const handleAddMoreFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      const formattedNewFiles = newFiles.map((file) => ({
        file,
        id: Date.now() + Math.random(),
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
      }));
      setMediaFiles([...mediaFiles, ...formattedNewFiles]);
    }
  };

  const removeMedia = (id) => {
    setMediaFiles(mediaFiles.filter((media) => media.id !== id));
    const newCaptions = { ...captions };
    delete newCaptions[id];
    setCaptions(newCaptions);
  };

  const updateCaption = (id, text) => {
    setCaptions({ ...captions, [id]: text });
  };

  const uploadMedia = async () => {
    if (!chatId || mediaFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const today = new Date().toISOString().split("T")[0];
      const dailyDocRef = doc(db, "chats", chatId, "dailyMessages", today);

      const dailyDoc = await getDoc(dailyDocRef);
      if (!dailyDoc.exists()) {
        await setDoc(dailyDocRef, { createdAt: serverTimestamp() });
      }

      const messagesRef = collection(dailyDocRef, "messages");

      let totalBytes = 0;
      let transferredBytes = 0;

      mediaFiles.forEach((media) => {
        totalBytes += media.file.size;
      });

      const uploadPromises = mediaFiles.map(async (media) => {
        const timestamp = new Date().getTime();
        const fileExtension = media.file.name.split(".").pop();
        const fileName = `${media.type}_${timestamp}.${fileExtension}`;
        const storageRef = ref(
          storage,
          `chats/${chatId}/${media.type}s/${fileName}`,
        );

        const uploadTask = uploadBytesResumable(storageRef, media.file);

        uploadTask.on("state_changed", (snapshot) => {
          transferredBytes += snapshot.bytesTransferred;
          const progress = (transferredBytes / totalBytes) * 100;
          setUploadProgress(progress);
        });

        await uploadTask;
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        await addDoc(messagesRef, {
          type: media.type,
          url: downloadURL,
          content: captions[media.id] || "",
          fileName,
          size: media.file.size,
          timestamp: serverTimestamp(),
          sender: auth.currentUser?.uid,
        });

        return downloadURL;
      });

      await Promise.all(uploadPromises);

      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        lastMessage: `[${t("media.media")}]`,
        lastMessageTime: serverTimestamp(),
      });

      onClose && onClose();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (mediaFiles.length === 0) return null;

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${getBgColor()} rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto ${getTextColor()} transition-colors duration-300`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaFiles.map((media) => (
            <div
              key={media.id}
              className={`border rounded-lg overflow-hidden shadow-sm ${getBgColor()} ${getBorderColor()} relative transition-colors duration-300`}>
              <div className={`relative aspect-video ${getCardBg()}`}>
                {media.type === "image" ? (
                  <img
                    src={media.preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={media.preview}
                    className="w-full h-full object-contain"
                    controls
                  />
                )}
                <button
                  onClick={() => removeMedia(media.id)}
                  className="absolute top-2 right-2 p-1.5 cursor-pointer bg-red-500 text-white rounded-full hover:bg-red-800 transition-colors">
                  <FiX className="text-sm" />
                </button>
              </div>

              <div className={`p-3 border-t ${getBorderColor()}`}>
                <div
                  className={`flex items-center gap-2 ${getSecondaryTextColor()} mb-1`}>
                  <FiEdit2 className="text-sm" />
                  <span className="text-xs">
                    {t("media.caption")} ({media.type})
                  </span>
                </div>
                <input
                  type="text"
                  value={captions[media.id] || ""}
                  onChange={(e) => updateCaption(media.id, e.target.value)}
                  placeholder={t("media.addCaption")}
                  className={`w-full px-2 py-1 text-sm border-b ${getBorderColor()} focus:border-blue-500 outline-none ${getBgColor()} ${getTextColor()} transition-colors duration-300`}
                />
              </div>
            </div>
          ))}

          <div
            className={`border-2 border-dashed ${getDashedBorder()} rounded-lg flex flex-col items-center justify-center cursor-pointer ${getHoverBg()} aspect-video transition-colors duration-300`}
            onClick={() => fileInputRef.current.click()}>
            <FiPlus className={`text-3xl ${getSecondaryTextColor()} mb-2`} />
            <span className={`${getSecondaryTextColor()} text-sm`}>
              {t("media.addMore")}
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAddMoreFiles}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {isUploading && (
            <div className={`w-full ${getProgressBg()} rounded-full h-2.5`}>
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                setMediaFiles([]);
                onClose && onClose();
              }}
              className={`px-4 py-2 ${getSecondaryTextColor()} ${getCardBg()} ${getHoverBg()} rounded cursor-pointer transition-colors duration-300`}>
              {t("media.cancel")}
            </button>

            <div className="flex items-center gap-4">
              <span className={`text-sm ${getSecondaryTextColor()}`}>
                {mediaFiles.length}{" "}
                {mediaFiles.length === 1 ? t("media.file") : t("media.files")}{" "}
                {t("media.selected")}
              </span>

              <button
                onClick={uploadMedia}
                disabled={isUploading}
                className={`flex items-center gap-2 px-6 py-2.5 cursor-pointer text-white rounded-lg transition-colors ${
                  isUploading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}>
                <FiUpload className="text-lg" />
                <span>
                  {isUploading
                    ? `${t("media.uploading")} (${Math.round(uploadProgress)}%)`
                    : t("media.uploadAll")}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaUploadWithPreview;
