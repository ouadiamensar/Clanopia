import React from "react";
import { useLanguage } from "../context/LanguageContext";

const OverviewModal = ({
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

  if (!chat || !otherUser) return null;

  return (
    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`rounded-xl p-6 w-96 max-w-90vw ${getBgColor()} ${getTextColor()}`}>
        <h3 className="text-lg font-bold mb-4">{t("overview.title")}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={otherUser.ProfileImageURL || "/default-avatar.png"}
              alt={otherUser.name || t("overview.unknown")}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h4 className="font-semibold">
                {otherUser.name || t("overview.unknown")}
              </h4>
              <p className={`text-sm ${getSecondaryTextColor()}`}>
                {otherUser.bio || t("overview.noBio")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className={getSecondaryTextColor()}>
                {t("overview.chatType")}
              </p>
              <p className="font-medium">
                {chat.type || t("overview.unknown")}
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

export default OverviewModal;
