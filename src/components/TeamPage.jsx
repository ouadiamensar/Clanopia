import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Sidebar from "./Sidebar";
import { BsArrowUpRightSquareFill } from "react-icons/bs";
import RightSideBar from "./RightSideBar";
import { useLanguage } from "../context/LanguageContext";

const TeamPage = () => {
  const { id } = useParams();
  const [teamData, setTeamData] = useState(null);
  const [visible, setVisible] = useState(false);
  const [requestBtn, setRequestBtn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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

  const getBgColor = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#1e1e1f]";
  const getCardBg = () =>
    themeMode === "light" ? "bg-white" : "bg-[#222223]/50";
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-300" : "border-purple-500/30";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-purple-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#222223]";

  const sendTeamRequestNotification = async (
    teamId,
    teamName,
    requestData,
    applicantName,
  ) => {
    console.log("🔔 sendTeamRequestNotification STARTED");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("❌ No current user");
        return false;
      }

      const teamRef = doc(db, "teams", teamId);
      const teamDoc = await getDoc(teamRef);

      if (!teamDoc.exists()) {
        console.log("❌ Team not found");
        return false;
      }

      const teamOwnerId = teamDoc.data().createdBy;
      // eslint-disable-next-line no-unused-vars
      const teamOwnerName = teamDoc.data().creatorname || "Team Owner";

      if (teamOwnerId === currentUser.uid) {
        console.log("⚠️ User is the team owner, no notification needed");
        return false;
      }

      const settingsRef = doc(db, "users", teamOwnerId, "settings", "data");
      const settingsDoc = await getDoc(settingsRef);
      const settings = settingsDoc.exists() ? settingsDoc.data() : {};
      const teamRequestsEnabled =
        settings.notifications?.teamRequests !== false;

      if (!teamRequestsEnabled) {
        console.log("🔕 Team owner has requests notifications disabled");
        return false;
      }

      const notificationRef = doc(
        db,
        "users",
        teamOwnerId,
        "request_notifications",
        "list",
      );
      const notificationDoc = await getDoc(notificationRef);

      const applicantNameText =
        applicantName || currentUser.displayName || "Someone";
      const skillText = requestData.skill || "a position";

      const newNotification = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `👤 New Team Request - ${teamName}`,
        body: `${applicantNameText} applied for ${skillText} position`,
        timestamp: new Date(),
        read: false,
        type: "team_request",
        data: {
          teamId: teamId,
          teamName: teamName,
          applicantId: currentUser.uid,
          applicantName: applicantNameText,
          skill: requestData.skill,
          requestData: requestData,
        },
      };

      if (notificationDoc.exists()) {
        const currentNotifications = notificationDoc.data().notifications || [];
        const updatedNotifications = [
          newNotification,
          ...currentNotifications,
        ].slice(0, 100);
        await updateDoc(notificationRef, {
          notifications: updatedNotifications,
        });
        console.log(
          `✅ Request notification sent to team owner: ${teamOwnerId}`,
        );
      } else {
        await setDoc(notificationRef, { notifications: [newNotification] });
        console.log(
          `✅ New request notification document created for ${teamOwnerId}`,
        );
      }

      if (document.hidden && Notification.permission === "granted") {
        new Notification(`👤 New Request for ${teamName}`, {
          body: `${applicantNameText} wants to join as ${skillText}`,
          icon: "/vite.svg",
          data: {
            teamId: teamId,
            url: `/team/${teamId}`,
          },
        });
      }

      console.log("✅ sendTeamRequestNotification completed!");
      return true;
    } catch (error) {
      console.error("❌ Error in sendTeamRequestNotification:", error);
      return false;
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const docRef = doc(db, "teams", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTeamData(docSnap.data());
        } else {
          console.log("No such team!");
        }
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeam();
  }, [id]);

  const [formData, setFormData] = useState({
    skill: "",
    whyMe: "",
    AboutMe: "",
    portfolio: "",
    skillLevel: "",
    timeAvailable: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert(t("teamPage.pleaseLogin"));

    try {
      await addDoc(collection(db, "teams", id, "requests"), {
        userId: user.uid,
        ...formData,
        status: "pending",
        timestamp: serverTimestamp(),
      });

      await sendTeamRequestNotification(
        id,
        teamData.name,
        formData,
        user.displayName || user.email?.split("@")[0],
      );

      alert(t("teamPage.requestSubmitted"));
      setRequestBtn(false);
      setFormData({
        skill: "",
        whyMe: "",
        AboutMe: "",
        portfolio: "",
        skillLevel: "",
        timeAvailable: "",
      });
    } catch (error) {
      console.error("Error adding request:", error);
      alert(t("teamPage.requestFailed"));
    }
  };

  const loadingMessages = {
    en: "Loading team data...",
    ar: "جاري تحميل بيانات الفريق...",
    es: "Cargando datos del equipo...",
    de: "Lade Team-Daten...",
    fr: "Chargement des données de l'équipe...",
  };

  if (themeMode === null || isLoading || languageLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16 md:w-20 md:h-20">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-purple-500 animate-spin"></div>
            <div className="absolute inset-1 rounded-full border-4 border-transparent border-b-purple-400 border-l-purple-400 animate-spin-reverse"></div>
          </div>
          <p className="text-purple-300 font-mono text-sm md:text-base">
            {loadingMessages[language] || "Loading team data..."}
          </p>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className={`min-h-screen ${getBgColor()}`}>
        <div className="flex">
          <Sidebar themeMode={themeMode} />
          <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
            <div className="text-center">
              <h2
                className={`text-xl md:text-2xl font-bold mb-2 ${getTextColor()}`}>
                {t("teamPage.teamNotFound")}
              </h2>
              <p className={`text-sm md:text-base ${getSecondaryTextColor()}`}>
                {t("teamPage.teamNotFoundDesc")}
              </p>
            </div>
          </div>
          <RightSideBar themeMode={themeMode} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getBgColor()}`}>
      <div className="flex">
        <Sidebar themeMode={themeMode} />

        <div
          className={`flex-1 mt-2 md:mt-5 p-4 md:p-8 pt-20 transition-all duration-500 ease-in-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          } ${!isMobile && "ml-70 mr-30"}`}>
          <div
            className={`relative overflow-hidden rounded-xl ${getCardBg()} ${getBorderColor()} shadow-lg md:shadow-2xl border`}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-grid-purple-500/20"></div>
            </div>
            <div className="relative h-40 md:h-64">
              <img
                src={
                  teamData.bannerURL ||
                  "https://source.unsplash.com/random/1600x400/?tech,abstract"
                }
                className="w-full h-full object-cover"
                alt={t("teamPage.teamBanner")}
                style={{ objectPosition: "center" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
            <div className="relative px-4 md:px-8 pb-4 md:pb-8 pt-12 md:pt-16">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
                <div className="relative -mt-16 md:-mt-24">
                  <div
                    className={`w-24 h-24 md:w-40 md:h-40 rounded-xl md:rounded-2xl border-4 border-purple-400/50 ${getCardBg()} p-1 shadow-lg md:shadow-xl overflow-hidden backdrop-blur-sm`}>
                    <img
                      src={
                        teamData.imageURL ||
                        "https://source.unsplash.com/random/300x300/?logo"
                      }
                      className="w-full h-full object-cover rounded-md md:rounded-lg"
                      alt={t("teamPage.teamLogo")}
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <h1
                    className={`text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-purple-100 tracking-tight`}>
                    {teamData.name}
                  </h1>
                  <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-4">
                    <span className="text-purple-300 font-medium flex items-center text-sm md:text-base">
                      <span className="text-gray-400 mr-2">
                        {t("teamPage.ledBy")}:
                      </span>
                      <Link
                        to={`/profile/${teamData.createdBy}`}
                        className="hover:text-purple-200 transition-colors flex items-center gap-1">
                        {teamData.creatorname}
                        <BsArrowUpRightSquareFill className="text-xs md:text-sm ml-1" />
                      </Link>
                    </span>
                    <span className="hidden md:inline text-gray-500">|</span>
                    <span className="text-gray-400 text-xs md:text-sm">
                      {t("teamPage.created")}{" "}
                      {teamData.createdAt
                        ? new Date(
                            teamData.createdAt.seconds * 1000,
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mt-4 md:mt-8">
            <div className="lg:col-span-2 space-y-4 md:space-y-8">
              <div
                className={`${getCardBg()} backdrop-blur-sm rounded-xl ${getBorderColor()} p-4 md:p-6 shadow-lg`}>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div
                    className={`p-2 md:p-4 rounded-lg ${getInputBg()} ${getBorderColor()}`}>
                    <span className="text-xs text-purple-300 uppercase tracking-wider">
                      {t("teamPage.language")}
                    </span>
                    <p
                      className={`text-base md:text-lg font-semibold ${getTextColor()} mt-1`}>
                      {teamData.language || t("teamPage.global")}
                    </p>
                  </div>
                  <div
                    className={`p-2 md:p-4 rounded-lg ${getInputBg()} ${getBorderColor()}`}>
                    <span className="text-xs text-purple-300 uppercase tracking-wider">
                      {t("teamPage.timezone")}
                    </span>
                    <p
                      className={`text-base md:text-lg font-semibold ${getTextColor()} mt-1`}>
                      {teamData.timezone || t("teamPage.flexible")}
                    </p>
                  </div>
                  <div
                    className={`p-2 md:p-4 rounded-lg ${getInputBg()} ${getBorderColor()}`}>
                    <span className="text-xs text-purple-300 uppercase tracking-wider">
                      {t("teamPage.workStyle")}
                    </span>
                    <p
                      className={`text-base md:text-lg font-semibold ${getTextColor()} mt-1 capitalize`}>
                      {teamData.workStyle || t("teamPage.collaborative")}
                    </p>
                  </div>
                  <div
                    className={`p-2 md:p-4 rounded-lg ${getInputBg()} ${getBorderColor()}`}>
                    <span className="text-xs text-purple-300 uppercase tracking-wider">
                      {t("teamPage.status")}
                    </span>
                    <p className="text-base md:text-lg font-semibold text-green-400 mt-1">
                      {t("teamPage.active")}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`${getCardBg()} backdrop-blur-sm rounded-xl ${getBorderColor()} p-4 md:p-6 shadow-lg`}>
                <h3 className="text-lg md:text-xl font-bold text-purple-300 mb-3 md:mb-4 flex items-center">
                  <span className="w-2 h-2 md:w-3 md:h-3 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
                  {t("teamPage.availablePositions")}
                </h3>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {Array.isArray(teamData.skills) &&
                  teamData.skills.length > 0 ? (
                    teamData.skills.map((skillObj, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1 md:px-4 md:py-2 bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-lg md:rounded-xl border border-purple-700/30 text-purple-200 text-xs md:text-sm font-medium flex items-center">
                        <span className="text-purple-400 mr-1">
                          {skillObj.skill}
                        </span>
                        <span className="text-white ml-1">
                          ({skillObj.NumSkill})
                        </span>
                      </div>
                    ))
                  ) : (
                    <p
                      className={`${getSecondaryTextColor()} italic text-sm md:text-base`}>
                      {t("teamPage.noPositions")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                <div
                  className={`${getCardBg()} backdrop-blur-sm rounded-xl ${getBorderColor()} p-4 md:p-6 shadow-lg`}>
                  <h3 className="text-lg md:text-xl font-bold text-purple-300 mb-3">
                    {t("teamPage.aboutTeam")}
                  </h3>
                  <p
                    className={`${getSecondaryTextColor()} whitespace-pre-line w-full leading-relaxed text-sm md:text-base break-words overflow-wrap-anywhere`}>
                    {teamData.shortDescription}
                  </p>
                </div>

                <div
                  className={`${getCardBg()} backdrop-blur-sm rounded-xl ${getBorderColor()} p-4 md:p-6 shadow-lg`}>
                  <h3 className="text-lg md:text-xl font-bold text-purple-300 mb-3">
                    {t("teamPage.detailedInfo")}
                  </h3>
                  <p
                    className={`${getSecondaryTextColor()} whitespace-pre-line w-full leading-relaxed text-sm md:text-base break-words overflow-wrap-anywhere`}>
                    {teamData.fullDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:space-y-8">
              {teamData.createdBy !== auth.currentUser?.uid && !requestBtn && (
                <div
                  className={`${getCardBg()} backdrop-blur-sm rounded-xl ${getBorderColor()} p-4 md:p-6 shadow-lg`}>
                  <h3 className="text-lg md:text-xl font-bold text-purple-300 mb-3 md:mb-4 flex items-center">
                    <span className="w-2 h-2 md:w-3 md:h-3 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
                    {t("teamPage.joinTeam")}
                  </h3>
                  <p
                    className={`${getSecondaryTextColor()} mb-4 md:mb-6 text-sm md:text-base`}>
                    {t("teamPage.joinTeamDesc")}
                  </p>
                  <button
                    onClick={() => setRequestBtn(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-2 md:py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-900 transition-all shadow-lg hover:shadow-purple-500/20 text-sm md:text-base">
                    {t("teamPage.applyNow")}
                  </button>
                </div>
              )}

              {requestBtn && (
                <div
                  className={`${getCardBg()} backdrop-blur-sm rounded-xl ${getBorderColor()} p-4 md:p-6 shadow-lg`}>
                  <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h3 className="text-lg md:text-xl font-bold text-purple-300">
                      {t("teamPage.applicationForm")}
                    </h3>
                    <button
                      onClick={() => setRequestBtn(false)}
                      className="text-gray-400 hover:text-white transition-colors text-lg">
                      ✕
                    </button>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 md:space-y-5">
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-medium text-purple-300">
                        {t("teamPage.selectPosition")}
                      </label>
                      <select
                        name="skill"
                        value={formData.skill}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-xl ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm md:text-base`}
                        required>
                        <option value="">{t("teamPage.choosePosition")}</option>
                        {Array.isArray(teamData.skills) &&
                          teamData.skills.map((skillObj, idx) => (
                            <option
                              key={idx}
                              value={skillObj.skill}
                              className={getInputBg()}>
                              {skillObj.skill} ({skillObj.NumSkill})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-medium text-purple-300">
                        {t("teamPage.whyAccept")}
                      </label>
                      <input
                        type="text"
                        name="whyMe"
                        value={formData.whyMe}
                        onChange={handleChange}
                        placeholder={t("teamPage.whyAcceptPlaceholder")}
                        className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-xl ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm md:text-base`}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-medium text-purple-300">
                        {t("teamPage.aboutYou")}
                      </label>
                      <textarea
                        name="AboutMe"
                        value={formData.AboutMe}
                        onChange={handleChange}
                        rows={4}
                        minLength={250}
                        placeholder={t("teamPage.aboutYouPlaceholder")}
                        className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-xl ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm md:text-base`}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-medium text-purple-300">
                        {t("teamPage.portfolio")}
                      </label>
                      <input
                        type="url"
                        name="portfolio"
                        value={formData.portfolio}
                        onChange={handleChange}
                        placeholder="https://yourportfolio.com"
                        className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-xl ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm md:text-base`}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs md:text-sm font-medium text-purple-300">
                          {t("teamPage.skillLevel")}
                        </label>
                        <select
                          name="skillLevel"
                          value={formData.skillLevel}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-xl ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm md:text-base`}
                          required>
                          <option value="">{t("teamPage.selectLevel")}</option>
                          <option value="Beginner">
                            {t("teamPage.beginner")}
                          </option>
                          <option value="Intermediate">
                            {t("teamPage.intermediate")}
                          </option>
                          <option value="Professional">
                            {t("teamPage.professional")}
                          </option>
                          <option value="Expert">{t("teamPage.expert")}</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs md:text-sm font-medium text-purple-300">
                          {t("teamPage.weeklyHours")}
                        </label>
                        <input
                          type="number"
                          name="timeAvailable"
                          value={formData.timeAvailable}
                          onChange={handleChange}
                          min={1}
                          placeholder={t("teamPage.availability")}
                          className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-xl ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm md:text-base`}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2 md:space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setRequestBtn(false)}
                        className={`px-4 py-2 md:px-6 md:py-3 border ${getBorderColor()} rounded-xl ${getSecondaryTextColor()} hover:bg-gray-700/50 transition-colors text-sm md:text-base`}>
                        {t("teamPage.cancel")}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white py-2 md:py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-900 transition-all shadow-lg hover:shadow-purple-500/20 text-sm md:text-base">
                        {t("teamPage.submitApplication")}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
        <RightSideBar themeMode={themeMode} />
      </div>
    </div>
  );
};

export default TeamPage;
