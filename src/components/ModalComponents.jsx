import React from "react";
import { useLanguage } from "../context/LanguageContext";

export const OverviewModal = ({
  chat,
  otherUser,
  totalMessages,
  mediaCount,
  onClose,
  themeMode,
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
  const getBgColor = () =>
    themeMode === "light" ? "bg-white" : "bg-[#222223]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-500" : "text-gray-400";

  return (
    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`rounded-xl p-6 w-96 max-w-90vw ${getBgColor()} ${getTextColor()}`}>
        <h3 className="text-lg font-bold mb-4">{t("overview.title")}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={otherUser?.ProfileImageURL || "/default-avatar.png"}
              alt={otherUser?.name || t("overview.unknown")}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h4 className="font-semibold">
                {otherUser?.name || t("overview.unknown")}
              </h4>
              <p className={`text-sm ${getSecondaryTextColor()}`}>
                {otherUser?.bio || t("overview.noBio")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className={getSecondaryTextColor()}>
                {t("overview.chatType")}
              </p>
              <p className="font-medium">
                {chat?.type || t("overview.unknown")}
              </p>
            </div>
            <div>
              <p className={getSecondaryTextColor()}>
                {t("overview.totalMessages")}
              </p>
              <p className="font-medium">{totalMessages || 0}</p>
            </div>
            <div>
              <p className={getSecondaryTextColor()}>
                {t("overview.mediaFiles")}
              </p>
              <p className="font-medium">{mediaCount || 0}</p>
            </div>
            <div>
              <p className={getSecondaryTextColor()}>{t("overview.status")}</p>
              <p className="font-medium text-green-500">
                {t("overview.active")}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-500 transition-colors">
          {t("overview.close")}
        </button>
      </div>
    </div>
  );
};

export const SharedMediaModal = ({ media, onClose, themeMode }) => {
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

  const getBgColor = () => (themeMode === "light" ? "bg-white" : "bg-gray-800");
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-500" : "text-gray-400";
  const getCardBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-gray-700";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
          {media?.length === 0 ? (
            <p className={`text-center ${getSecondaryTextColor()} py-8`}>
              {t("sharedMedia.noMedia")}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {media?.map((mediaItem, index) => (
                <div key={index} className="relative group cursor-pointer">
                  {mediaItem.type === "image" ? (
                    <img
                      src={mediaItem.url}
                      alt={t("sharedMedia.sharedImage")}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ) : mediaItem.type === "video" ? (
                    <div
                      className={`w-full h-24 ${getCardBg()} rounded-lg flex items-center justify-center`}>
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div
                      className={`w-full h-24 ${getCardBg()} rounded-lg flex items-center justify-center`}>
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg"></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`mt-4 text-sm ${getSecondaryTextColor()}`}>
          {t("sharedMedia.total")}: {media?.length || 0}{" "}
          {t("sharedMedia.files")}
        </div>
      </div>
    </div>
  );
};
