/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import RightSideBar from "./rightSideBar";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const Settings = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const defaultSettings = {
    account: {
      email: "",
    },
    privacy: {
      messagePrivacy: "friends",
      profileVisibility: "public",
      twoFactorEnabled: false,
    },
    notifications: {
      messages: true,
      teamRequests: true,
      communityActivity: false,
      workspaceNotifications: false,
    },
    theme: {
      mode: "dark",
      language: "en",
    },
  };

  const [mode, setMode] = useState(() => {
    return localStorage.getItem("themeMode") || "dark";
  });

  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return { ...defaultSettings, ...parsed };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const [profile, setProfile] = useState(null);
  const currentUser = auth.currentUser;

  const { language, translations, loading: languageLoading } = useLanguage();

  const t = (key, params = {}) => {
    if (languageLoading) return key;

    let translation =
      key.split(".").reduce((obj, k) => obj?.[k], translations) || key;

    Object.keys(params).forEach((param) => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });

    return translation;
  };

  const applyTheme = (themeMode) => {
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      document.documentElement.style.backgroundColor = "#111827";
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      document.documentElement.style.backgroundColor = "#f3f4f6";
    }
  };

  const saveThemeToLocalStorage = (themeMode) => {
    localStorage.setItem("themeMode", themeMode);
    applyTheme(themeMode);
  };

  const saveSettingsToLocalStorage = (newSettings) => {
    localStorage.setItem("userSettings", JSON.stringify(newSettings));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const getUserSettings = async () => {
      if (!currentUser) {
        const savedTheme = localStorage.getItem("themeMode") || "dark";
        setMode(savedTheme);
        applyTheme(savedTheme);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const settingsRef = doc(
          db,
          "users",
          currentUser.uid,
          "settings",
          "data",
        );

        const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();

            const mergedSettings = { ...defaultSettings, ...data };
            setSettings(mergedSettings);

            saveSettingsToLocalStorage(mergedSettings);

            if (data.theme && data.theme.mode) {
              const themeMode = data.theme.mode;
              setMode(themeMode);
              saveThemeToLocalStorage(themeMode);
            }
          } else {
            const savedSettings = localStorage.getItem("userSettings");
            if (savedSettings) {
              try {
                const parsed = JSON.parse(savedSettings);
                setSettings({ ...defaultSettings, ...parsed });
                if (parsed.theme && parsed.theme.mode) {
                  setMode(parsed.theme.mode);
                  applyTheme(parsed.theme.mode);
                }
              } catch {
                setSettings(defaultSettings);
                applyTheme(defaultSettings.theme.mode);
              }
            } else {
              setSettings(defaultSettings);
              applyTheme(defaultSettings.theme.mode);
            }
          }
        });

        const profileRef = doc(db, "users", currentUser.uid, "profile", "data");
        const profileSnapshot = await getDoc(profileRef);
        setProfile(profileSnapshot.exists() ? profileSnapshot.data() : null);

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching settings:", error);
        setErrors({ general: "Failed to load settings" });

        const savedTheme = localStorage.getItem("themeMode") || "dark";
        setMode(savedTheme);
        applyTheme(savedTheme);
      } finally {
        setLoading(false);
      }
    };

    getUserSettings();
  }, [currentUser]);

  useEffect(() => {
    if (settings.theme && settings.theme.mode) {
      const themeMode = settings.theme.mode;
      setMode(themeMode);
      saveThemeToLocalStorage(themeMode);
      saveSettingsToLocalStorage(settings);
    }
  }, [settings.theme.mode]);

  const handleInputChange = (section, field, value) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };

      saveSettingsToLocalStorage(newSettings);

      if (section === "theme" && field === "mode") {
        saveThemeToLocalStorage(value);
      }

      return newSettings;
    });

    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleSaveSettings = async () => {
    if (!currentUser) {
      saveSettingsToLocalStorage(settings);
      setSuccessMessage(t("settings.savedLocally"));
      setTimeout(() => setSuccessMessage(""), 3000);
      return;
    }

    try {
      setSaving(true);
      setErrors({});
      setSuccessMessage("");

      const settingsRef = doc(db, "users", currentUser.uid, "settings", "data");

      await setDoc(settingsRef, settings, { merge: true });

      saveSettingsToLocalStorage(settings);

      if (settings.theme && settings.theme.mode) {
        saveThemeToLocalStorage(settings.theme.mode);
      }

      setSuccessMessage(t("settings.successMessage"));
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setErrors({ general: "Failed to save settings" });

      saveSettingsToLocalStorage(settings);
      setSuccessMessage(t("settings.savedLocally"));
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const getBgColor = () => (mode === "light" ? "bg-gray-100" : "bg-[#1e1e1f]");
  const getCardBg = () => (mode === "light" ? "bg-white" : "bg-[#222223]");
  const getTextColor = () =>
    mode === "light" ? "text-gray-900" : "text-white";
  const getSecondaryTextColor = () =>
    mode === "light" ? "text-gray-700" : "text-gray-300";
  const getMutedTextColor = () =>
    mode === "light" ? "text-gray-600" : "text-gray-500";
  const getBorderColor = () =>
    mode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getInputBg = () => (mode === "light" ? "bg-white" : "bg-[#252527]");
  const getInputBorder = () =>
    mode === "light" ? "border-gray-300" : "border-[#29292a]";
  const getHoverBg = () =>
    mode === "light" ? "hover:bg-gray-200" : "hover:bg-[#29292a]";

  const renderAllSettings = () => (
    <div className="space-y-8">
      <div className="space-y-6">
        <h2 className={`text-xl font-bold ${getTextColor()}`}>
          {t("settings.privacySecurity")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className={`block mb-2 ${getSecondaryTextColor()}`}>
              {t("privacy.messagePrivacy")}
            </label>
            <select
              value={settings.privacy.messagePrivacy}
              onChange={(e) =>
                handleInputChange("privacy", "messagePrivacy", e.target.value)
              }
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputBg()} ${getInputBorder()} ${getTextColor()}`}>
              <option value="anyone">{t("privacy.anyone")}</option>
              <option value="friends">{t("privacy.friendsOnly")}</option>
              <option value="teams">{t("privacy.teamMembersOnly")}</option>
            </select>
          </div>
          <div>
            <label className={`block mb-2 ${getSecondaryTextColor()}`}>
              {t("privacy.profileVisibility")}
            </label>
            <select
              value={settings.privacy.profileVisibility}
              onChange={(e) =>
                handleInputChange(
                  "privacy",
                  "profileVisibility",
                  e.target.value,
                )
              }
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputBg()} ${getInputBorder()} ${getTextColor()}`}>
              <option value="public">{t("privacy.public")}</option>
              <option value="private">{t("privacy.private")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className={`border-t my-6 ${getBorderColor()}`}></div>

      <div className="space-y-6">
        <h2 className={`text-xl font-bold ${getTextColor()}`}>
          {t("settings.notifications")}
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className={getSecondaryTextColor()}>
                {t("notifications.messageNotifications")}
              </h3>
              <p className={`text-sm ${getMutedTextColor()}`}>
                {t("notifications.messageDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={settings.notifications.messages}
                onChange={(e) =>
                  handleInputChange(
                    "notifications",
                    "messages",
                    e.target.checked,
                  )
                }
                className="sr-only peer"
              />
              <div
                className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${mode === "light" ? "bg-gray-300" : "bg-gray-700"}`}></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className={getSecondaryTextColor()}>
                {t("notifications.workspaceNotifications")}
              </h3>
              <p className={`text-sm ${getMutedTextColor()}`}>
                {t("notifications.workspaceNotificationsDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={settings.notifications.workspaceNotifications}
                onChange={(e) =>
                  handleInputChange(
                    "notifications",
                    "workspaceNotifications",
                    e.target.checked,
                  )
                }
                className="sr-only peer"
              />
              <div
                className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${mode === "light" ? "bg-gray-300" : "bg-gray-700"}`}></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className={getSecondaryTextColor()}>
                {t("notifications.teamRequests")}
              </h3>
              <p className={`text-sm ${getMutedTextColor()}`}>
                {t("notifications.teamDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={settings.notifications.teamRequests}
                onChange={(e) =>
                  handleInputChange(
                    "notifications",
                    "teamRequests",
                    e.target.checked,
                  )
                }
                className="sr-only peer"
              />
              <div
                className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${mode === "light" ? "bg-gray-300" : "bg-gray-700"}`}></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className={getSecondaryTextColor()}>
                {t("notifications.communityActivity")}
              </h3>
              <p className={`text-sm ${getMutedTextColor()}`}>
                {t("notifications.communityDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={settings.notifications.communityActivity}
                onChange={(e) =>
                  handleInputChange(
                    "notifications",
                    "communityActivity",
                    e.target.checked,
                  )
                }
                className="sr-only peer"
              />
              <div
                className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${mode === "light" ? "bg-gray-300" : "bg-gray-700"}`}></div>
            </label>
          </div>
        </div>
      </div>

      <div className={`border-t my-6 ${getBorderColor()}`}></div>

      <div className="space-y-6">
        <h2 className={`text-xl font-bold ${getTextColor()}`}>
          {t("settings.themeUI")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className={`block mb-2 ${getSecondaryTextColor()}`}>
              {t("theme.theme")}
            </label>
            <div className="flex space-x-4">
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  mode === "light"
                    ? "border-blue-500 bg-blue-100 dark:bg-blue-900/20"
                    : `border-gray-700 ${getCardBg()} ${getHoverBg()}`
                }`}
                onClick={() => handleInputChange("theme", "mode", "light")}>
                <div className="w-16 h-10 bg-white rounded shadow"></div>
                <p className={`mt-2 text-center ${getTextColor()}`}>
                  {t("theme.light")}
                </p>
              </div>
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  mode === "dark"
                    ? "border-blue-500 bg-blue-900/20"
                    : `border-gray-700 ${getCardBg()} ${getHoverBg()}`
                }`}
                onClick={() => handleInputChange("theme", "mode", "dark")}>
                <div className="w-16 h-10 bg-gray-900 rounded shadow"></div>
                <p className={`mt-2 text-center ${getTextColor()}`}>
                  {t("theme.dark")}
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className={`block mb-2 ${getSecondaryTextColor()}`}>
              {t("theme.interfaceLanguage")}
            </label>
            <select
              value={settings.theme.language}
              onChange={(e) =>
                handleInputChange("theme", "language", e.target.value)
              }
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputBg()} ${getInputBorder()} ${getTextColor()}`}>
              <option value="en">{t("theme.english")}</option>
              <option value="ar">{t("theme.arabic")}</option>
              <option value="fr">{t("theme.french")}</option>
              <option value="es">{t("theme.spanish")}</option>
              <option value="de">{t("theme.german")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className={`pt-4 border-t ${getBorderColor()}`}>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              {t("settings.deleteAccount")}
            </button>
            <p className={`text-sm mt-2 ${getMutedTextColor()}`}>
              {t("settings.deleteWarning")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );


  return (
    <div className={`min-h-screen max-w-screen text-base flex ${getBgColor()}`}>
      <Sidebar themeMode={mode} />
      <div
        className={`flex-1 transition-all duration-300 max-w-screen p-6 ${
          isMobile ? "mt-16" : "pl-100 pr-60"
        }`}>
        <h1 className={`text-2xl font-bold mb-6 ${getTextColor()}`}>
          {t("settings.title")}
        </h1>

        {successMessage && (
          <div
            className={`p-3 rounded-lg mb-4 flex items-center ${
              mode === "light"
                ? "bg-green-600 text-white"
                : "bg-green-800/80 text-green-200"
            }`}>
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {successMessage}
          </div>
        )}

        {errors.general && (
          <div
            className={`p-3 rounded-lg mb-4 flex items-center ${
              mode === "light"
                ? "bg-red-600 text-white"
                : "bg-red-800/80 text-red-200"
            }`}>
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.general}
          </div>
        )}

        <div className="flex h-fit flex-col md:flex-row gap-6">
          <div className={`w-full h-fit md:w-64 rounded-lg p-4 ${getCardBg()}`}>
            <nav className="space-y-2">
              <Link to={`/editProfile`} className="block">
                <button
                  className={`w-full text-left p-3 rounded-lg transition flex items-center ${getSecondaryTextColor()} ${getHoverBg()}`}>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("settings.profileManagement")}
                </button>
              </Link>
            </nav>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center">
              {saving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("settings.saving")}
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("settings.saveChanges")}
                </>
              )}
            </button>
          </div>

          <div className={`flex-1 rounded-lg p-6 h-fit ${getCardBg()}`}>
            {renderAllSettings()}
          </div>
        </div>
      </div>
      <RightSideBar themeMode={mode} />
    </div>
  );
};

export default Settings;
