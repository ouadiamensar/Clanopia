/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Navigate, useParams, useNavigate } from "react-router";
import WorkspaceSideMenu from "./WorkspaceSideMenu";
import { useLanguage } from "../context/LanguageContext";

const TeamMembers = () => {
  const { team } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [membersProfiles, setMemberProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
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
  themeMode === "light" ? "bg-white" : "bg-[#222223]/40";
const getBorderColor = () =>
  themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]/30";
const getTextColor = () =>
  themeMode === "light" ? "text-gray-900" : "text-gray-100";
const getSecondaryTextColor = () =>
  themeMode === "light" ? "text-gray-600" : "text-gray-400";
const getErrorBg = () =>
  themeMode === "light"
    ? "bg-red-100 border-red-300"
    : "bg-red-900/50 border-[#2c2d2e]/30";
const getErrorText = () =>
  themeMode === "light" ? "text-red-800" : "text-red-100";
const getEmptyStateBg = () =>
  themeMode === "light"
    ? "bg-gray-100 border-gray-300"
    : "bg-[#222223]/50 border-[#2c2d2e]/30";
const getEmptyStateText = () =>
  themeMode === "light" ? "text-gray-700" : "text-gray-300";
const getEmptyStateSecondaryText = () =>
  themeMode === "light" ? "text-gray-500" : "text-gray-500";
const getBannerGradient = () =>
  themeMode === "light"
    ? "from-cyan-200/30 to-purple-200/30"
    : "from-cyan-500/10 to-purple-500/10";
const getAvatarBg = () =>
  themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
const getButtonHover = () =>
  themeMode === "light" ? "hover:bg-gray-100" : "hover:bg-cyan-600";
const getActionButtonBg = () =>
  themeMode === "light"
    ? "bg-gray-200 hover:bg-gray-300"
    : "bg-[#29292a]/50 hover:bg-[#2c2d2e]";
const getTitleGradient = () =>
  themeMode === "light"
    ? "from-cyan-600 to-purple-600"
    : "from-cyan-400 to-purple-500";
const getContactButtonGradient = () =>
  themeMode === "light"
    ? "from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
    : "from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500";

  const fetchTeamMembers = async (teamId) => {
    try {
      setLoading(true);
      setError(null);
      if (!teamId) {
        setMembers([]);
        return;
      }

      const teamDocRef = doc(db, "teams", teamId);
      const teamDoc = await getDoc(teamDocRef);

      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        const membersArray = teamData.members || [];
        setMembers(membersArray);
      } else {
        setMembers([]);
        setError(t("teamMembers.teamNotFound"));
      }
    } catch (err) {
      console.error("Error fetching team members:", err);
      setError(t("teamMembers.fetchError"));
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberProfiles = async (memberIds) => {
    if (!memberIds || memberIds.length === 0) {
      setMemberProfiles([]);
      return;
    }

    try {
      setProfilesLoading(true);

      const profiles = await Promise.all(
        memberIds.map(async (memberId) => {
          try {
            const userDocRef = doc(db, "users", memberId, "profile", "data");
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              return {
                id: memberId,
                ...userDoc.data(),
              };
            } else {
              console.warn(`User ${memberId} not found`);
              return null;
            }
          } catch (error) {
            console.error(`Error fetching user ${memberId}:`, error);
            return null;
          }
        }),
      );

      const validProfiles = profiles.filter(Boolean);
      setMemberProfiles(validProfiles);
      console.log(validProfiles);
    } catch (error) {
      console.error("Error fetching member profiles:", error);
      setError(t("teamMembers.profileFetchError"));
    } finally {
      setProfilesLoading(false);
    }
  };

  useEffect(() => {
    if (team) {
      fetchTeamMembers(team);
    }
  }, [team]);

  useEffect(() => {
    if (members.length > 0) {
      fetchMemberProfiles(members);
    } else {
      setMemberProfiles([]);
    }
  }, [members]);

  const toggleExpand = (memberId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const handleStartNewChat = async (otherUserId) => {
    const currentUserId = auth.currentUser.uid;

    const q = query(
      collection(db, "chats"),
      where("users", "in", [
        [currentUserId, otherUserId],
        [otherUserId, currentUserId],
      ]),
    );

    const querySnapshot = await getDocs(q);
    let chatId;

    if (!querySnapshot.empty) {
      chatId = querySnapshot.docs[0].id;
    } else {
      const chatDocRef = await addDoc(collection(db, "chats"), {
        teamId: team,
        type: "join_request",
        users: [currentUserId, otherUserId],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageTime: null,
      });
      chatId = chatDocRef.id;
    }

    navigate(`/chat/All`);
  };

  if (loading || profilesLoading || languageLoading) {
    return (
      <div className={`min-h-screen grid grid-cols-10 ${getBgColor()}`}>
        <WorkspaceSideMenu />
        <div className="col-start-2 col-end-11 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 border-r-sky-500 animate-spin"></div>
              <div className="absolute inset-1 rounded-full border-4 border-transparent border-b-sky-400 border-l-cyan-400 animate-spin-reverse"></div>
            </div>
            <p className={`${getSecondaryTextColor()} font-mono`}>
              {t("teamMembers.loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen grid grid-cols-15 ${getBgColor()} ${getTextColor()}`}>
      <WorkspaceSideMenu />
      <div className="col-start-2 col-span-14 p-8">
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="text-center mb-12">
              <h1
                className={`text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${getTitleGradient()} mb-4`}>
                {t("teamMembers.title")}
              </h1>
              <p className={`${getSecondaryTextColor()} max-w-2xl mx-auto`}>
                {t("teamMembers.subtitle")}
              </p>
            </div>

            {error && (
              <div
                className={`${getErrorBg()} backdrop-blur-sm ${getErrorText()} p-6 rounded-2xl mb-8 text-center border shadow-lg`}>
                <div className="flex items-center justify-center mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
                <button
                  onClick={() => fetchTeamMembers(team)}
                  className={`mt-2 px-4 py-2 ${
                    themeMode === "light"
                      ? "bg-red-200 hover:bg-red-300 text-red-800"
                      : "bg-red-700 hover:bg-red-600 text-white"
                  } rounded-lg transition-colors`}>
                  {t("teamMembers.tryAgain")}
                </button>
              </div>
            )}

            {membersProfiles.length === 0 && !error ? (
              <div
                className={`${getEmptyStateBg()} rounded-2xl backdrop-blur-sm border text-center py-16`}>
                <div
                  className={`mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full ${
                    themeMode === "light" ? "bg-gray-200" : "bg-gray-700/50"
                  }`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-8 w-8 ${
                      themeMode === "light" ? "text-gray-600" : "text-gray-500"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3
                  className={`text-xl font-semibold ${getEmptyStateText()} mb-2`}>
                  {t("teamMembers.noMembers")}
                </h3>
                <p
                  className={`${getEmptyStateSecondaryText()} max-w-md mx-auto`}>
                  {t("teamMembers.noMembersDesc")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {membersProfiles.map((member) => {
                  const isExpanded = expandedCards[member.id];
                  return (
                    <div
                      key={member.id}
                      className={`${getCardBg()} backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border ${getBorderColor()} transition-all duration-300 ${
                        themeMode === "light"
                          ? "hover:border-cyan-400/50 hover:shadow-cyan-200/50"
                          : "hover:border-cyan-500/30 hover:shadow-sky-950"
                      } hover:-translate-y-1`}>
                      {member.BannerImageURL && (
                        <div
                          className={`h-32 bg-gradient-to-r ${getBannerGradient()} overflow-hidden relative`}>
                          <img
                            src={member.BannerImageURL}
                            alt="Banner"
                            className="w-full h-full object-cover"
                          />
                          <div
                            className={`absolute inset-0 bg-gradient-to-t ${
                              themeMode === "light"
                                ? "from-white/80 to-transparent"
                                : "from-gray-900/80 to-transparent"
                            }`}></div>
                        </div>
                      )}

                      <div className="p-6 relative">
                        <div className="absolute -top-12 left-6">
                          <div className="relative">
                            {member.ProfileImageURL ? (
                              <img
                                src={member.ProfileImageURL}
                                alt={member.name || "Team Member"}
                                className={`w-24 h-24 rounded-2xl object-cover border-4 ${getAvatarBg()} shadow-lg`}
                              />
                            ) : (
                              <div
                                className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-2xl font-bold border-4 ${getAvatarBg()} shadow-lg`}>
                                {(member.name || "U").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-14">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h2
                                className={`text-xl font-bold gap-1 flex ${getTextColor()}`}>
                                {member.name || t("teamMembers.unknownUser")}
                                {member.id === auth.currentUser.uid && (
                                  <h1 className="text-l font-thin text-cyan-400">
                                    ({t("teamMembers.you")})
                                  </h1>
                                )}
                              </h2>
                              {member.location && (
                                <div
                                  className={`flex items-center ${getSecondaryTextColor()} text-sm mt-1`}>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  {member.location}
                                </div>
                              )}
                            </div>

                            <div className="flex space-x-2">
                              {member.github && (
                                <a
                                  href={member.github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-2 ${getActionButtonBg()} rounded-lg transition-colors`}>
                                  <svg
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                      fillRule="evenodd"
                                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </a>
                              )}

                              {member.linkedin && (
                                <a
                                  href={member.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-2 ${getActionButtonBg()} rounded-lg transition-colors`}>
                                  <svg
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="mb-4">
                            {member.about && (
                              <div className="mb-3">
                                <h3 className="text-cyan-400 font-medium mb-1 flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  {t("teamMembers.aboutMe")}
                                </h3>
                                <p
                                  className={`text-sm ${
                                    themeMode === "light"
                                      ? "text-gray-700"
                                      : "text-gray-300"
                                  } leading-relaxed line-clamp-2`}>
                                  {member.about}
                                </p>
                              </div>
                            )}

                            {member.skills && member.skills.length > 0 && (
                              <div>
                                <h3 className="text-cyan-400 font-medium mb-1 flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                  </svg>
                                  {t("teamMembers.skills")}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                  {member.skills
                                    .slice(0, 3)
                                    .map((skill, index) => (
                                      <span
                                        key={index}
                                        className={`px-2 py-1 rounded-full text-xs backdrop-blur-sm ${
                                          themeMode === "light"
                                            ? "bg-cyan-100 text-cyan-800"
                                            : "bg-cyan-900/40 text-cyan-100"
                                        }`}>
                                        {skill}
                                      </span>
                                    ))}
                                  {member.skills.length > 3 && (
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${
                                        themeMode === "light"
                                          ? "bg-gray-200 text-gray-700"
                                          : "bg-gray-700/50 text-gray-300"
                                      }`}>
                                      +{member.skills.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {isExpanded && (
                            <div className="mb-4 space-y-4 animate-fadeIn">
                              {member.about && member.about.length > 150 && (
                                <div>
                                  <p
                                    className={`text-sm leading-relaxed ${
                                      themeMode === "light"
                                        ? "text-gray-700"
                                        : "text-gray-300"
                                    }`}>
                                    {member.about}
                                  </p>
                                </div>
                              )}

                              {member.skills && member.skills.length > 3 && (
                                <div>
                                  <div className="flex flex-wrap gap-2">
                                    {member.skills.map((skill, index) => (
                                      <span
                                        key={index}
                                        className={`px-2 py-1 rounded-full text-xs backdrop-blur-sm ${
                                          themeMode === "light"
                                            ? "bg-cyan-100 text-cyan-800"
                                            : "bg-cyan-900/40 text-cyan-100"
                                        }`}>
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div
                                className={`grid grid-cols-2 gap-4 text-sm border-t ${
                                  themeMode === "light"
                                    ? "border-gray-300"
                                    : "border-gray-700/50"
                                } pt-4`}>
                                {member.experience && (
                                  <div>
                                    <p
                                      className={`${getSecondaryTextColor()} mb-1`}>
                                      {t("teamMembers.experience")}
                                    </p>
                                    <p className={getTextColor()}>
                                      {member.experience}
                                    </p>
                                  </div>
                                )}

                                {member.education && (
                                  <div>
                                    <p
                                      className={`${getSecondaryTextColor()} mb-1`}>
                                      {t("teamMembers.education")}
                                    </p>
                                    <p className={getTextColor()}>
                                      {member.education}
                                    </p>
                                  </div>
                                )}

                                {member.languages && (
                                  <div>
                                    <p
                                      className={`${getSecondaryTextColor()} mb-1`}>
                                      {t("teamMembers.languages")}
                                    </p>
                                    <p className={getTextColor()}>
                                      {member.languages}
                                    </p>
                                  </div>
                                )}

                                {member.interests && (
                                  <div>
                                    <p
                                      className={`${getSecondaryTextColor()} mb-1`}>
                                      {t("teamMembers.interests")}
                                    </p>
                                    <p className={getTextColor()}>
                                      {member.interests}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div
                            className={`mt-4 pt-4 border-t ${getBorderColor()} flex justify-between items-center`}>
                            <button
                              onClick={() => toggleExpand(member.id)}
                              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center transition-colors">
                              {isExpanded ? (
                                <>
                                  <span>{t("teamMembers.viewLess")}</span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 ml-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 15l7-7 7 7"
                                    />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span>{t("teamMembers.viewMore")}</span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 ml-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </>
                              )}
                            </button>
                            {member.id != auth.currentUser.uid && (
                              <button
                                onClick={() => handleStartNewChat(member.id)}
                                className={`py-2 px-4 bg-gradient-to-r ${getContactButtonGradient()} rounded-lg transition-all duration-300 text-sm font-medium text-white`}>
                                {t("teamMembers.contact")}{" "}
                                {member.name?.split(" ")[0] ||
                                  t("teamMembers.member")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMembers;
