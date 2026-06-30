import React, { useState } from "react";
import { MdBlock, MdRemoveCircle } from "react-icons/md";
import { FaUsers } from "react-icons/fa6";
import { FaPhotoVideo } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

const TopMenu = ({
  isOpen,
  onRemoveChat,
  onBlockUser,
  onViewOverview,
  onViewSharedMedia,
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

  const [showConfirm, setShowConfirm] = useState(null);

  if (!isOpen) return null;

  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getButtonBg = () =>
    themeMode === "light"
      ? "bg-indigo-500 hover:bg-indigo-600"
      : "bg-indigo-600 hover:bg-indigo-700";
  const getCancelButtonBg = () =>
    themeMode === "light"
      ? "bg-gray-300 hover:bg-gray-400"
      : "bg-[#29292a] hover:bg-[#2c2d2e]";

  const handleRemoveRequest = () => {
    setShowConfirm("remove");
  };

  const handleBlockRequest = () => {
    setShowConfirm("block");
  };

  const confirmAction = () => {
    if (showConfirm === "remove") {
      onRemoveChat();
    } else if (showConfirm === "block") {
      onBlockUser();
    }
    setShowConfirm(null);
  };

  const cancelAction = () => {
    setShowConfirm(null);
  };

  return (
    <>
      <div
        className={`absolute right-0 top-full mt-2 w-48 md:w-56 rounded-xl border-2 border-indigo-500 ${getCardBg()} shadow-2xl z-50 animate-fade-in`}>
        <div
          className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-t-xl cursor-pointer transition-colors hover:${getInputBg()}`}
          onClick={handleRemoveRequest}>
          <div
            className={`p-1 md:p-2 rounded-lg ${getInputBg()} text-indigo-400`}>
            <MdRemoveCircle className="text-xl md:text-2xl" />
          </div>
          <div className="flex-1">
            <span
              className={`block font-medium ${getTextColor()} text-xs md:text-sm`}>
              {t("topMenu.remove")}
            </span>
            <span
              className={`block text-xs ${getSecondaryTextColor()} md:block`}>
              {t("topMenu.removeDesc")}
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer transition-colors hover:${getInputBg()}`}
          onClick={handleBlockRequest}>
          <div
            className={`p-1 md:p-2 rounded-lg ${getInputBg()} text-indigo-400`}>
            <MdBlock className="text-xl md:text-2xl" />
          </div>
          <div className="flex-1">
            <span
              className={`block font-medium ${getTextColor()} text-xs md:text-sm`}>
              {t("topMenu.block")}
            </span>
            <span
              className={`block text-xs ${getSecondaryTextColor()} md:block`}>
              {t("topMenu.blockDesc")}
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer transition-colors hover:${getInputBg()}`}
          onClick={onViewOverview}>
          <div
            className={`p-1 md:p-2 rounded-lg ${getInputBg()} text-indigo-400`}>
            <FaUsers className="text-xl md:text-2xl" />
          </div>
          <div className="flex-1">
            <span
              className={`block font-medium ${getTextColor()} text-xs md:text-sm`}>
              {t("topMenu.overview")}
            </span>
            <span
              className={`block text-xs ${getSecondaryTextColor()} md:block`}>
              {t("topMenu.overviewDesc")}
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer transition-colors hover:${getInputBg()}`}
          onClick={onViewSharedMedia}>
          <div
            className={`p-1 md:p-2 rounded-lg ${getInputBg()} text-indigo-400`}>
            <FaPhotoVideo className="text-xl md:text-2xl" />
          </div>
          <div className="flex-1">
            <span
              className={`block font-medium ${getTextColor()} text-xs md:text-sm`}>
              {t("topMenu.sharedMedia")}
            </span>
            <span
              className={`block text-xs ${getSecondaryTextColor()} md:block`}>
              {t("topMenu.sharedMediaDesc")}
            </span>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 bg-opacity-50 z-50">
          <div className={`w-80 rounded-xl p-6 ${getCardBg()} shadow-2xl`}>
            <h3 className={`text-lg font-bold mb-2 ${getTextColor()}`}>
              {showConfirm === "remove"
                ? t("topMenu.removeChat")
                : t("topMenu.blockUser")}
            </h3>
            <p className={`mb-6 ${getSecondaryTextColor()}`}>
              {showConfirm === "remove"
                ? t("topMenu.removeConfirm")
                : t("topMenu.blockConfirm")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelAction}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${getCancelButtonBg()} ${getTextColor()}`}>
                {t("topMenu.cancel")}
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${getButtonBg()}`}>
                {showConfirm === "remove"
                  ? t("topMenu.remove")
                  : t("topMenu.block")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopMenu;
