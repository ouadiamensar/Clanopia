import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

const SharedMediaModal = ({ media, onClose, themeMode }) => {
  const { translations, loading: languageLoading } = useLanguage();

  const t = (key, params = {}) => {
    if (languageLoading) return key;
    let translation = key.split(".").reduce((obj, k) => obj?.[k], translations) || key;
    Object.keys(params).forEach((param) => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
    return translation;
  };

  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaView, setMediaView] = useState("grid"); 
  const [currentIndex, setCurrentIndex] = useState(0);

  const getBgColor = () => (themeMode === "light" ? "bg-white" : "bg-gray-800");
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryBg = () => (themeMode === "light" ? "bg-gray-100" : "bg-gray-700");
  const getBorderColor = () => (themeMode === "light" ? "border-gray-300" : "border-gray-600");
  const getSecondaryTextColor = () => (themeMode === "light" ? "text-gray-500" : "text-gray-400");

  const filteredMedia = media.filter(
    (mediaItem) =>
      mediaItem.type === "image" ||
      mediaItem.type === "video" ||
      mediaItem.type === "document"
  );

  const handleMediaClick = (mediaItem, index) => {
    if (mediaItem.type === "image" || mediaItem.type === "video") {
      setSelectedMedia(mediaItem);
      setCurrentIndex(index);
      setMediaView("preview");
    } else if (mediaItem.type === "document") {
      window.open(mediaItem.url, "_blank");
    }
  };

  const handleClosePreview = () => {
    setSelectedMedia(null);
    setMediaView("grid");
    setCurrentIndex(0);
  };

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % filteredMedia.length;
    setCurrentIndex(nextIndex);
    setSelectedMedia(filteredMedia[nextIndex]);
  };

  const goToPrev = () => {
    const prevIndex = (currentIndex - 1 + filteredMedia.length) % filteredMedia.length;
    setCurrentIndex(prevIndex);
    setSelectedMedia(filteredMedia[prevIndex]);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setSelectedMedia(filteredMedia[index]);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    const iconClass = "w-12 h-12";
    
    if (['pdf'].includes(ext)) {
      return (
        <svg className={`${iconClass} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
        </svg>
      );
    } else if (['doc', 'docx'].includes(ext)) {
      return (
        <svg className={`${iconClass} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
        </svg>
      );
    } else if (['xls', 'xlsx'].includes(ext)) {
      return (
        <svg className={`${iconClass} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
        </svg>
      );
    } else {
      return (
        <svg className={`${iconClass} text-gray-500`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
        </svg>
      );
    }
  };

  const getFileName = (url) => {
    return url.split('/').pop() || 'file';
  };

  const getMediaThumbnail = (mediaItem) => {
    if (mediaItem.type === "image") {
      return (
        <img
          src={mediaItem.url}
          alt={t("sharedMedia.thumbnail")}
          className="w-full h-24 object-cover rounded-lg"
        />
      );
    } else if (mediaItem.type === "video") {
      return (
        <div className="relative w-full h-24">
          <video
            src={mediaItem.thumbnail || mediaItem.url}
            alt={t("sharedMedia.videoThumbnail")}
            className="w-full h-24 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-opacity-30 flex items-center justify-center rounded-lg">
            <div className="w-12 h-12 bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (mediaView === "preview" && selectedMedia) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="relative w-full h-full flex flex-col">
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-black/20 to-transparent">
            <button
              onClick={handleClosePreview}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-white text-sm">
              {currentIndex + 1} / {filteredMedia.length}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            {filteredMedia.length > 1 && (
              <button
                onClick={goToPrev}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 z-10 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {filteredMedia.length > 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 z-10 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <div className="max-w-4xl max-h-[70vh] w-full p-4">
              {selectedMedia.type === "image" ? (
                <img
                  src={selectedMedia.url}
                  alt={t("sharedMedia.preview")}
                  className="w-full h-full max-h-[70vh] object-contain rounded-lg"
                />
              ) : selectedMedia.type === "video" ? (
                <div className="relative w-full h-full">
                  <video
                    controls
                    autoPlay
                    className="w-full h-full max-h-[70vh] object-contain rounded-lg bg-black"
                  >
                    <source src={selectedMedia.url} type="video/mp4" />
                    {t("sharedMedia.videoNotSupported")}
                  </video>
                </div>
              ) : null}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t to-transparent p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex space-x-2 overflow-x-auto pb-2 p-5">
                {filteredMedia.map((mediaItem, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      index === currentIndex 
                        ? 'border-white border-opacity-80 scale-115' 
                        : 'border-white border-opacity-30 hover:border-opacity-60'
                    }`}
                    onClick={() => goToSlide(index)}
                  >
                    {mediaItem.type === "image" ? (
                      <img
                        src={mediaItem.url}
                        alt={`${t("sharedMedia.thumbnail")} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : mediaItem.type === "video" ? (
                      <div className="relative w-full h-full">
                        <video
                          src={mediaItem.thumbnail || mediaItem.url}
                          alt={`${t("sharedMedia.videoThumbnail")} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-opacity-40 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`rounded-xl p-6 w-11/12 max-w-4xl max-h-90vh overflow-hidden ${getBgColor()} ${getTextColor()}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{t("sharedMedia.title")}</h3>
          <button
            onClick={onClose}
            className={`${getSecondaryTextColor()} hover:${getTextColor()} text-xl transition-colors`}>
            ×
          </button>
        </div>

        <div className="overflow-y-auto max-h-96">
          {filteredMedia.length === 0 ? (
            <p className={`text-center ${getSecondaryTextColor()} py-8`}>
              {t("sharedMedia.noMedia")}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((mediaItem, index) => (
                <div
                  key={index}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${getBorderColor()} hover:border-indigo-400 transition-all duration-200`}
                  onClick={() => handleMediaClick(mediaItem, index)}>
                  
                  {mediaItem.type === "image" || mediaItem.type === "video" ? (
                    getMediaThumbnail(mediaItem)
                  ) : (
                    <div className={`w-full h-24 ${getSecondaryBg()} flex flex-col items-center justify-center relative p-2`}>
                      {getFileIcon(mediaItem.url)}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                        {t("sharedMedia.document")}
                      </div>
                      <span className={`text-xs ${getSecondaryTextColor()} mt-1 text-center truncate w-full`}>
                        {getFileName(mediaItem.url)}
                      </span>
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                    {mediaItem.type.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`mt-4 text-sm ${getSecondaryTextColor()} flex justify-between items-center flex-wrap gap-2`}>
          <span>{t("sharedMedia.total")}: {filteredMedia.length} {t("sharedMedia.files")}</span>
          <div className="flex gap-2 text-xs flex-wrap">
            <span className={`px-2 py-1 rounded ${getSecondaryBg()}`}>
              {t("sharedMedia.images")}: {filteredMedia.filter(m => m.type === 'image').length}
            </span>
            <span className={`px-2 py-1 rounded ${getSecondaryBg()}`}>
              {t("sharedMedia.videos")}: {filteredMedia.filter(m => m.type === 'video').length}
            </span>
            <span className={`px-2 py-1 rounded ${getSecondaryBg()}`}>
              {t("sharedMedia.documents")}: {filteredMedia.filter(m => m.type === 'document').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedMediaModal;