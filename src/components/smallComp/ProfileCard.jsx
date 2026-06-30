import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

const ProfileCard = ({ name, image, about, skills, id, themeMode }) => {
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

  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-white";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-500" : "text-gray-400";
  const getSkillBg = () =>
    themeMode === "light"
      ? "bg-cyan-100 text-cyan-900"
      : "bg-[#29292a] text-gray-300";
  const getButtonBg = () =>
    themeMode === "light"
      ? "bg-indigo-500 hover:bg-indigo-600"
      : "bg-indigo-600 hover:bg-indigo-700";

  return (
    <div
      className={`${getCardBg()} rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border ${getBorderColor()}`}>
      <div className="p-6">
        <div className="flex flex-col items-center gap-4 mb-4">
          <img
            src={image}
            alt={name}
            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
            style={{ aspectRatio: "1/1" }}
          />
          <div>
            <h3 className={`text-xl font-semibold ${getTextColor()}`}>
              {name || t("profileCard.anonymous")}
            </h3>
          </div>
        </div>

        <p
          className={`mb-4 line-clamp-3 ${
            themeMode === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
          {about || t("profileCard.noDescription")}
        </p>

        {skills && skills.length > 0 && (
          <div className="mb-4">
            <h4
              className={`text-sm font-medium mb-2 ${getSecondaryTextColor()}`}>
              {t("profileCard.skills")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-full text-xs ${getSkillBg()}`}>
                  {skill}
                </span>
              ))}
              {skills.length > 4 && (
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getSkillBg()} ${getSecondaryTextColor()}`}>
                  {t("profileCard.more", { count: skills.length - 4 })}
                </span>
              )}
            </div>
          </div>
        )}

        <Link
          to={`/profile/${id}`}
          className={`block w-full text-white text-center py-2 rounded-lg transition-colors ${getButtonBg()}`}>
          {t("profileCard.viewProfile")}
        </Link>
      </div>
    </div>
  );
};

export default ProfileCard;