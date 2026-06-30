import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Sidebar from "./Sidebar";
import LoadingSpinner from "./loadingSpinner";
import { Link, useNavigate } from "react-router-dom";
import RightSideBar from "./rightSideBar";
import {
  RiTeamLine,
  RiSettings3Line,
  RiArrowRightLine,
  RiCalendarLine,
  RiUserLine,
  RiAddLine,
  RiGridLine,
  RiListCheck,
  RiSearchLine,
  RiLogoutCircleLine,
} from "react-icons/ri";
import { useLanguage } from "../context/LanguageContext";

const MyOwnTeams = () => {
  const [userData, setUserData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();

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
    themeMode === "light" ? "bg-gray-50" : "bg-[#1e1e1f]";
  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-white";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getHoverColor = () =>
    themeMode === "light" ? "hover:bg-gray-100" : "hover:bg-[#29292a]";
  const getGradientBg = () =>
    themeMode === "light"
      ? "bg-gradient-to-r from-emerald-500 to-cyan-600"
      : "bg-gradient-to-r from-emerald-600 to-cyan-700";
  const getDangerBg = () =>
    themeMode === "light"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-red-600 hover:bg-red-700";

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.log("No such document!");
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "teams"));
        const teamsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTeams(teamsArray);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    if (userData && userData.teams && teams.length > 0) {
      const filtered = teams.filter((team) => userData.teams.includes(team.id));
      setUserTeams(filtered);
    }
  }, [userData, teams]);

  const leaveTeam = async (teamId, teamName) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert("You must be logged in to leave a team.");
      return;
    }

    const confirmLeave = window.confirm(
      `Are you sure you want to leave "${teamName}"? You will lose access to all team resources.`
    );
    if (!confirmLeave) return;

    setIsLeaving(true);

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        teams: arrayRemove(teamId),
      });
      console.log(`✅ Removed team ${teamId} from user's teams`);

      const teamRef = doc(db, "teams", teamId);
      await updateDoc(teamRef, {
        members: arrayRemove(userId),
      });
      console.log(`✅ Removed user ${userId} from team's members`);

      setUserTeams((prev) => prev.filter((team) => team.id !== teamId));

      alert(`✅ You have successfully left "${teamName}".`);

    } catch (error) {
      console.error("❌ Error leaving team:", error);
      alert("Failed to leave the team. Please try again.");
    } finally {
      setIsLeaving(false);
    }
  };

  const filteredTeams = userTeams.filter((team) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      team.name?.toLowerCase().includes(query) ||
      team.shortDescription?.toLowerCase().includes(query) ||
      team.category?.toLowerCase().includes(query)
    );
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`min-h-screen ${getBgColor()} ${getTextColor()} transition-colors duration-300`}>
      <div className="flex pt-12 lg:pt-0">
        <Sidebar themeMode={themeMode} />

        <div className="flex-1 flex flex-col lg:flex-row justify-center">
          <div className="flex-1 max-w-7xl w-full px-2 lg:py-6">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-3 rounded-2xl ${getGradientBg()} shadow-lg`}>
                  <RiTeamLine className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1
                    className={`text-3xl lg:text-4xl font-bold ${getTextColor()}`}>
                    {t("myTeams.title")}
                  </h1>
                  <p className={getSecondaryTextColor()}>
                    {t("myTeams.subtitle", { count: userTeams.length })}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`${getCardBg()} rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4 border ${getBorderColor()} shadow-lg`}>
              <div className="flex-1 min-w-[200px] relative">
                <input
                  type="text"
                  placeholder={t("myTeams.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 ${getInputBg()} rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${getTextColor()} transition-colors duration-300`}
                />
                <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    viewMode === "grid"
                      ? `${getGradientBg()} text-white shadow-lg`
                      : `${getInputBg()} ${getHoverColor()}`
                  }`}>
                  <RiGridLine className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    viewMode === "list"
                      ? `${getGradientBg()} text-white shadow-lg`
                      : `${getInputBg()} ${getHoverColor()}`
                  }`}>
                  <RiListCheck className="w-5 h-5" />
                </button>
              </div>

              <Link
                to="/createTeam"
                className={`px-5 py-2.5 ${getGradientBg()} text-white rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg`}>
                <RiAddLine className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {t("myTeams.createTeam")}
                </span>
              </Link>
            </div>

            {filteredTeams.length === 0 ? (
              <div
                className={`${getCardBg()} rounded-2xl p-12 text-center shadow-lg border ${getBorderColor()}`}>
                <div className="text-6xl mb-4">🏠</div>
                <h3 className={`text-2xl font-bold ${getTextColor()} mb-2`}>
                  {searchQuery
                    ? t("myTeams.noTeamsFound")
                    : t("myTeams.noTeamsJoined")}
                </h3>
                <p className={`${getSecondaryTextColor()} mb-6`}>
                  {searchQuery
                    ? t("myTeams.adjustSearch")
                    : t("myTeams.joinOrCreate")}
                </p>
                <Link
                  to="/createTeam"
                  className={`px-6 py-3 ${getGradientBg()} text-white rounded-xl font-semibold inline-flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg`}>
                  <RiAddLine className="w-5 h-5" />
                  {t("myTeams.createFirstTeam")}
                </Link>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "flex flex-col gap-4"
                }>
                {filteredTeams.map((team) => {
                  const isOwner = team.createdBy === auth.currentUser?.uid;

                  return (
                    <div
                      key={team.id}
                      className={`${getCardBg()} rounded-2xl overflow-hidden border ${getBorderColor()} shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group`}>
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={team.imageURL || "/default-team.png"}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          alt={team.name}
                          onError={(e) => {
                            e.target.src = "/default-team.png";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                        {isOwner && (
                          <button
                            onClick={() =>
                              navigate(`/Team/${team.id}/TeamSettings`)
                            }
                            className="absolute top-3 right-3 p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
                            title={t("myTeams.teamSettings")}>
                            <RiSettings3Line className="w-5 h-5" />
                          </button>
                        )}

                        {!isOwner && (
                          <button
                            onClick={() => leaveTeam(team.id, team.name)}
                            disabled={isLeaving}
                            className={`absolute top-3 right-3 p-2 rounded-xl bg-red-500/80 backdrop-blur-sm text-white hover:bg-red-600/90 transition-all duration-300 hover:scale-110 ${
                              isLeaving ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title="Leave Team">
                            <RiLogoutCircleLine className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h3
                            className={`text-lg font-bold ${getTextColor()} truncate flex-1`}>
                            {team.name}
                          </h3>
                          {isOwner && (
                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                              👑 Owner
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-sm ${getSecondaryTextColor()} line-clamp-2 mb-3 min-h-[40px]`}>
                          {team.shortDescription || t("myTeams.noDescription")}
                        </p>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <RiUserLine
                              className={`${getSecondaryTextColor()} w-4 h-4`}
                            />
                            <span className={getSecondaryTextColor()}>
                              {team.members?.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <RiCalendarLine
                              className={`${getSecondaryTextColor()} w-4 h-4`}
                            />
                            <span className={getSecondaryTextColor()}>
                              {formatDate(team.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t ${getBorderColor()} flex gap-2">
                          <Link
                            to={`/team/${team.id}/workspace/channel/general-chat`}
                            className="flex-1">
                            <button
                              className={`w-full py-2.5 ${getGradientBg()} text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-sm`}>
                              {t("myTeams.enterWorkspace")}
                              <RiArrowRightLine className="w-4 h-4" />
                            </button>
                          </Link>

                          {!isOwner && (
                            <button
                              onClick={() => leaveTeam(team.id, team.name)}
                              disabled={isLeaving}
                              className={`px-4 py-2.5 ${getDangerBg()} text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-sm ${
                                isLeaving ? "opacity-50 cursor-not-allowed" : ""
                              }`}>
                              <RiLogoutCircleLine className="w-5 h-5" />
                              <span className="hidden sm:inline">Leave</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <RightSideBar themeMode={themeMode} />
      </div>
    </div>
  );
};

export default MyOwnTeams;