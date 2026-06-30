/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
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
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { IoMail, IoMenu, IoClose } from "react-icons/io5";
import { MdDelete, MdDeleteSweep } from "react-icons/md";
import { useLanguage } from "../context/LanguageContext";
import NotificationBell from "./NotificationBell";
import { PiReadCvLogo } from "react-icons/pi";
import { HiRectangleGroup } from "react-icons/hi2";
import { IoBookmarks } from "react-icons/io5";

const RightSideBar = ({ themeMode = "" }) => {
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [allRequests, setAllRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const headerRef = useRef(null);

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

  const getBgColor = () =>
    themeMode === "light" ? "bg-white" : "bg-[#222223]";
  const getSidebarBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#1e1e1f]";
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-50" : "bg-[#252527]";
  const getHoverBg = () =>
    themeMode === "light" ? "hover:bg-gray-100" : "hover:bg-[#29292a]";
  const getCardBg = () =>
    themeMode === "light" ? "bg-gray-50" : "bg-[#222223]";
  const getCardBorder = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getHeaderBg = () =>
    themeMode === "light"
      ? "from-indigo-500 to-cyan-500"
      : "from-indigo-600 to-cyan-600";
  const getModalBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#1e1e1f]";
  const getOverlayBg = () =>
    themeMode === "light" ? "bg-black/10" : "bg-black/20";

  const deleteSingleRequest = async (teamId, requestId, event) => {
    event.stopPropagation();

    if (
      window.confirm(
        t("rightSidebar.deleteConfirm") ||
          "Are you sure you want to delete this request?",
      )
    ) {
      setIsDeleting(true);
      try {
        const requestRef = doc(db, "teams", teamId, "requests", requestId);
        await deleteDoc(requestRef);

        setAllRequests((prev) =>
          prev.filter((req) => req.requestId !== requestId),
        );

        console.log("✅ Request deleted successfully");
      } catch (error) {
        console.error("Error deleting request:", error);
        alert(t("rightSidebar.deleteError") || "Failed to delete request");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const deleteAllPendingRequests = async () => {
    const pendingRequests = allRequests.filter(
      (req) => req.status === "pending",
    );

    if (pendingRequests.length === 0) {
      alert(
        t("rightSidebar.noPendingRequests") || "No pending requests to delete",
      );
      return;
    }

    if (
      window.confirm(
        t("rightSidebar.deleteAllConfirm") ||
          `Are you sure you want to delete all ${pendingRequests.length} pending requests?`,
      )
    ) {
      setIsDeleting(true);
      try {
        for (const request of pendingRequests) {
          const requestRef = doc(
            db,
            "teams",
            request.teamId,
            "requests",
            request.requestId,
          );
          await deleteDoc(requestRef);
        }

        setAllRequests((prev) =>
          prev.filter((req) => req.status !== "pending"),
        );

        console.log(
          `✅ ${pendingRequests.length} pending request(s) deleted successfully`,
        );
        alert(
          t("rightSidebar.deleteSuccess") ||
            `${pendingRequests.length} request(s) deleted successfully`,
        );
      } catch (error) {
        console.error("Error deleting pending requests:", error);
        alert(t("rightSidebar.deleteError") || "Failed to delete requests");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const deleteAllRequests = async () => {
    if (allRequests.length === 0) {
      alert(t("rightSidebar.noRequestsToDelete") || "No requests to delete");
      return;
    }

    if (
      window.confirm(
        t("rightSidebar.deleteAllRequestsConfirm") ||
          `Are you sure you want to delete all ${allRequests.length} requests? This action cannot be undone.`,
      )
    ) {
      setIsDeleting(true);
      try {
        for (const request of allRequests) {
          const requestRef = doc(
            db,
            "teams",
            request.teamId,
            "requests",
            request.requestId,
          );
          await deleteDoc(requestRef);
        }

        setAllRequests([]);

        console.log(
          `✅ All ${allRequests.length} requests deleted successfully`,
        );
        alert(
          t("rightSidebar.allDeletedSuccess") ||
            "All requests deleted successfully",
        );
      } catch (error) {
        console.error("Error deleting all requests:", error);
        alert(t("rightSidebar.deleteError") || "Failed to delete requests");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const deleteProcessedRequest = async (teamId, requestId, status, event) => {
    event.stopPropagation();

    const confirmMessage =
      status === "accepted"
        ? t("rightSidebar.deleteAcceptedConfirm") ||
          "This request was accepted. Are you sure you want to delete it?"
        : t("rightSidebar.deleteRejectedConfirm") ||
          "This request was rejected. Are you sure you want to delete it?";

    if (window.confirm(confirmMessage)) {
      setIsDeleting(true);
      try {
        const requestRef = doc(db, "teams", teamId, "requests", requestId);
        await deleteDoc(requestRef);

        setAllRequests((prev) =>
          prev.filter((req) => req.requestId !== requestId),
        );

        console.log(`✅ ${status} request deleted successfully`);
      } catch (error) {
        console.error("Error deleting request:", error);
        alert(t("rightSidebar.deleteError") || "Failed to delete request");
      } finally {
        setIsDeleting(false);
      }
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
    const getUserProfile = async () => {
      if (!currentUser) return;
      const profileRef = doc(db, "users", currentUser.uid, "profile", "data");
      const snapshot = await getDoc(profileRef);
      setProfile(snapshot.exists() ? snapshot.data() : null);
    };
    getUserProfile();
  }, [currentUser]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      setUserData(docSnap.exists() ? docSnap.data() : null);
    };
    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    const fetchAllRequestsByOwner = async () => {
      if (!currentUser) return;
      const q = query(
        collection(db, "teams"),
        where("createdBy", "==", currentUser.uid),
      );
      const teamSnap = await getDocs(q);
      const requests = [];

      for (const teamDoc of teamSnap.docs) {
        const teamId = teamDoc.id;
        const teamData = teamDoc.data();
        const teamName = teamData.name || t("rightSidebar.unnamedTeam");
        const requestsSnap = await getDocs(
          collection(db, "teams", teamId, "requests"),
        );

        for (const requestDoc of requestsSnap.docs) {
          const requestData = requestDoc.data();
          let userName = t("rightSidebar.unknown");
          if (requestData.userId) {
            const profileRef = doc(
              db,
              "users",
              requestData.userId,
              "profile",
              "data",
            );
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              userName = profileSnap.data().name || t("rightSidebar.unnamed");
            }
          }

          requests.push({
            teamId,
            teamName,
            requestId: requestDoc.id,
            userName,
            ...requestData,
          });
        }
      }

      setAllRequests(requests);
    };

    fetchAllRequestsByOwner();
  }, [currentUser, language]);

  const handleStartNewChat = async (otherUserId) => {
    if (!currentUser) return;

    const currentUserId = currentUser.uid;

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
        teamId: requestDetails.teamId,
        type: "join_request",
        users: [currentUserId, otherUserId],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageTime: null,
      });
      chatId = chatDocRef.id;
    }

    navigate(`/chat/${chatId}`);
    setRequestDetails(null);
  };

  if (languageLoading) {
    return (
      <div
        className={`fixed z-40 top-0 right-0 h-screen w-30 p-5 ${getBgColor()}`}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
        </div>
      </div>
    );
  }

  const pendingCount = allRequests.filter((r) => r.status === "pending").length;

  return (
    <>
      {isMobile ? (
        <div
          className={`fixed top-0 left-0 right-0 z-40 max-w-screen ${getBgColor()} shadow-md h-16 overflow-x-auto overflow-y-hidden border-b ${getCardBorder()}`}>
          <div
            ref={headerRef}
            className={`flex items-center h-full px-2 space-x-2 min-w-max ${
              isMobile && "flex-row-reverse justify-start"
            }`}
            style={{ scrollBehavior: "smooth" }}>
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2 border-cyan-600 flex-shrink-0">
              <Link to={`/profile/${auth.currentUser?.uid}`}>
                {profile?.ProfileImageURL ? (
                  <img
                    src={profile?.ProfileImageURL || "/default-user.png"}
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover border-2 cursor-pointer"
                  />
                ) : (
                  <span
                    className={`font-medium text-sm ${themeMode === "light" ? "text-cyan-600" : "text-cyan-400"}`}>
                    {profile?.name?.charAt(0)}
                  </span>
                )}
              </Link>
            </div>

            {isMobile && (
              <span className={`font-medium text-sm ${getTextColor()}`}>
                @{profile?.name}
              </span>
            )}

            <NotificationBell themeMode={themeMode} />

            <button
              className={`p-2 rounded-full cursor-pointer transition-colors relative`}
              onClick={() => setShowRequests((prev) => !prev)}>
              <PiReadCvLogo
                className={`w-10 h-10 p-2 ml-3 rounded-xl ${
                  themeMode === "light"
                    ? "text-black hover:bg-gray-100"
                    : "text-white hover:text-white hover:bg-[#29292a]"
                }`}
              />
              {allRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {allRequests.length > 9 ? "9+" : allRequests.length}
                </span>
              )}
            </button>

            <div className="relative flex-shrink-0 ml-1">
              <Link to={`/myteams`}>
                <HiRectangleGroup
                  className={`w-10 h-10 p-2 rounded-xl ${
                    themeMode === "light"
                      ? "text-black hover:bg-gray-100"
                      : "text-white hover:text-white hover:bg-[#29292a]"
                  }`}
                />
              </Link>
            </div>
          </div>

          {showRequests && (
            <div
              className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${getOverlayBg()}`}>
              <div
                className={`${getModalBg()} rounded-xl shadow-2xl border ${getBorderColor()} w-full max-w-md max-h-[80vh] overflow-y-auto`}>
                <div
                  className={`flex justify-between items-center p-5 sticky top-0 ${getModalBg()} border-b ${getCardBorder()}`}>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                      {t("rightSidebar.teamRequests")}
                      <span
                        className={`ml-2 text-xs px-2 py-1 rounded-full ${themeMode === "light" ? "bg-indigo-100 text-indigo-700" : "bg-indigo-900 text-cyan-300"}`}>
                        {allRequests.length}
                      </span>
                    </h2>
                    {pendingCount > 0 && (
                      <button
                        onClick={deleteAllPendingRequests}
                        disabled={isDeleting}
                        className="text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors">
                        Delete Pending ({pendingCount})
                      </button>
                    )}
                  </div>
                  <button
                    className={`text-xl font-bold ${themeMode === "light" ? "text-gray-600 hover:text-gray-900" : "text-gray-400 hover:text-cyan-300"}`}
                    onClick={() => setShowRequests(false)}>
                    ✕
                  </button>
                </div>

                <div className="p-5">
                  {allRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="text-6xl mb-3">📭</div>
                      <p className={`text-lg ${getSecondaryTextColor()}`}>
                        {t("rightSidebar.noRequests")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allRequests.map((item) => (
                        <div
                          key={item.requestId}
                          className={`border-l-4 border-indigo-500 rounded-lg p-4 transition-all hover:shadow-lg group ${
                            themeMode === "light"
                              ? "bg-gray-100"
                              : "bg-gray-800"
                          }`}>
                          <div className="flex justify-between items-start">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => setRequestDetails(item)}>
                              <p
                                className={`font-medium group-hover:text-cyan-500 ${themeMode === "light" ? "text-gray-900" : "text-gray-300"}`}>
                                {item.teamName}
                                <span
                                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                    item.status === "pending"
                                      ? themeMode === "light"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-yellow-900/50 text-yellow-400"
                                      : item.status === "accepted"
                                        ? themeMode === "light"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-green-900/50 text-green-400"
                                        : themeMode === "light"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-red-900/50 text-red-400"
                                  }`}>
                                  {t(`rightSidebar.${item.status}`)}
                                </span>
                              </p>
                              <p
                                className={`text-sm mt-1 ${getSecondaryTextColor()}`}>
                                {t("rightSidebar.from")}:{" "}
                                <span className="text-cyan-500">
                                  {item.userName}
                                </span>
                              </p>
                              <div className="mt-2">
                                <span
                                  className={`text-xs px-2 py-1 rounded ${themeMode === "light" ? "bg-gray-200 text-gray-700" : "bg-gray-700 text-cyan-300"}`}>
                                  {item.skill}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) =>
                                  deleteSingleRequest(
                                    item.teamId,
                                    item.requestId,
                                    e,
                                  )
                                }
                                disabled={isDeleting}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400"
                                title="Delete request">
                                <MdDelete className="text-lg" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`fixed z-40 top-0 right-0 h-screen w-30 p-5`}>
          <div
            className={`w-full h-full ${getBgColor()} rounded-2xl shadow-sm flex flex-col justify-start items-center px-6 border ${getBorderColor()}`}>
            <div className="flex items-center justify-center p-2 flex-col">
              <div className="w-12 h-12 mb-3 rounded-full overflow-hidden flex items-center justify-center border-2 border-cyan-600">
                <Link to={`/profile/${auth.currentUser?.uid}`}>
                  {profile?.ProfileImageURL ? (
                    <img
                      src={profile?.ProfileImageURL || "/default-user.png"}
                      alt="User"
                      className="w-10 h-10 rounded-full object-cover border-2 cursor-pointer"
                    />
                  ) : (
                    <span
                      className={`font-medium text-lg ${themeMode === "light" ? "text-cyan-600" : "text-cyan-400"}`}>
                      {profile?.name?.charAt(0)}
                    </span>
                  )}
                </Link>
              </div>

              <NotificationBell themeMode={themeMode} />

              <button
                className={`p-2 rounded-full mt-2 cursor-pointer transition-colors relative`}
                onClick={() => setShowRequests((prev) => !prev)}>
                <PiReadCvLogo
                  className={`w-12 h-14 p-2.5 rounded-xl ${
                    themeMode === "light"
                      ? "text-black hover:bg-gray-100"
                      : "text-white hover:text-white hover:bg-[#29292a]"
                  }`}
                />
                <div
                    className={`absolute left-full ml-3 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none`}>
                    Requests
                  </div>
                {allRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {allRequests.length > 9 ? "9+" : allRequests.length}
                  </span>
                )}
              </button>

              <Link
                to="/saves"
                className={`p-2 rounded-xl mt-2 cursor-pointer transition-colors relative`}>
                <IoBookmarks
                  className={`w-12 h-14 p-2.5 rounded-xl ${
                    themeMode === "light"
                      ? "text-black hover:bg-gray-100"
                      : "text-white hover:text-white hover:bg-[#29292a]"
                  }`}
                />
              </Link>

              <hr
                className={`w-12 m-4 rounded-3xl ${themeMode === "light" ? "border-cyan-400" : "border-cyan-600"}`}
              />

              <div className="flex-1 min-h-0 overflow-y-auto flex flex-wrap justify-center items-start gap-2 mt-2 p-2 scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-transparent">
                <Link to={`/Myteams`}>
                  <HiRectangleGroup
                    className={`w-12 h-14 p-2.5 rounded-xl ${
                      themeMode === "light"
                        ? "text-black hover:bg-gray-100"
                        : "text-white hover:text-white hover:bg-[#29292a]"
                    }`}
                  />
                </Link>
              </div>

              <div className="mt-auto pb-4"></div>
            </div>

            {showRequests && (
              <div
                className={`fixed max-h-[80vh] p-5 rounded-xl shadow-2xl border z-50 backdrop-blur-sm right-5 top-20 w-96 overflow-y-auto ${
                  themeMode === "light"
                    ? "bg-white/95 border-indigo-300"
                    : "bg-[#222223] border-indigo-500/30"
                }`}>
                <div
                  className={`flex justify-between items-center mb-4 sticky top-0 py-2 z-10 ${themeMode === "light" ? "bg-white/95" : "bg-[#222223]"}`}>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                      {t("rightSidebar.teamRequests")}
                      <span
                        className={`ml-2 text-xs px-2 py-1 rounded-full ${themeMode === "light" ? "bg-indigo-100 text-indigo-700" : "bg-indigo-900 text-cyan-300"}`}>
                        {allRequests.length}
                      </span>
                    </h2>
                    {pendingCount > 0 && (
                      <button
                        onClick={deleteAllPendingRequests}
                        disabled={isDeleting}
                        className="text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors flex items-center gap-1">
                        <MdDeleteSweep className="text-sm" /> Delete Pending (
                        {pendingCount})
                      </button>
                    )}
                    {allRequests.length > 0 && (
                      <button
                        onClick={deleteAllRequests}
                        disabled={isDeleting}
                        className="text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors flex items-center gap-1">
                        <MdDeleteSweep className="text-sm" /> Delete All
                      </button>
                    )}
                  </div>
                  <button
                    className={`text-xl font-bold transition-transform hover:rotate-90 ${themeMode === "light" ? "text-gray-600 hover:text-gray-900" : "text-gray-400 hover:text-cyan-300"}`}
                    onClick={() => setShowRequests(false)}>
                    ✕
                  </button>
                </div>

                {allRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="text-6xl mb-3">📭</div>
                    <p className={`text-lg ${getSecondaryTextColor()}`}>
                      {t("rightSidebar.noRequests")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allRequests.map((item) => (
                      <div
                        key={item.requestId}
                        className={`border-l-4 border-indigo-500 rounded-lg p-4 transition-all hover:shadow-lg group ${
                          themeMode === "light"
                            ? "bg-gray-50 hover:bg-gray-100"
                            : "bg-gray-800 hover:bg-gray-750"
                        }`}>
                        <div className="flex justify-between items-start">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => setRequestDetails(item)}>
                            <p
                              className={`font-medium group-hover:text-cyan-500 ${themeMode === "light" ? "text-gray-900" : "text-gray-300"}`}>
                              {item.teamName}
                              <span
                                className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                  item.status === "pending"
                                    ? themeMode === "light"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-yellow-900/50 text-yellow-400"
                                    : item.status === "accepted"
                                      ? themeMode === "light"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-green-900/50 text-green-400"
                                      : themeMode === "light"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-red-900/50 text-red-400"
                                }`}>
                                {t(`rightSidebar.${item.status}`)}
                              </span>
                            </p>
                            <p
                              className={`text-sm mt-1 ${getSecondaryTextColor()}`}>
                              {t("rightSidebar.from")}:{" "}
                              <span className="text-cyan-500">
                                {item.userName}
                              </span>
                            </p>
                            <div className="mt-2">
                              <span
                                className={`text-xs px-2 py-1 rounded ${themeMode === "light" ? "bg-gray-200 text-gray-700" : "bg-gray-700 text-cyan-300"}`}>
                                {item.skill}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) =>
                                deleteSingleRequest(
                                  item.teamId,
                                  item.requestId,
                                  e,
                                )
                              }
                              disabled={isDeleting}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400"
                              title="Delete request">
                              <MdDelete className="text-lg" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {requestDetails && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 animate-fade-in ${getOverlayBg()}`}>
          <div
            className={`relative w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden animate-scale-in border flex flex-col ${
              themeMode === "light"
                ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300"
                : "bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700"
            }`}
            onClick={(e) => e.stopPropagation()}>
            <div
              className={`bg-gradient-to-r ${getHeaderBg()} p-4 flex-shrink-0`}>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white drop-shadow-md">
                  {t("rightSidebar.requestDetails")}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      deleteSingleRequest(
                        requestDetails.teamId,
                        requestDetails.requestId,
                        { stopPropagation: () => {} },
                      );
                      setRequestDetails(null);
                    }}
                    disabled={isDeleting}
                    className="text-white hover:text-red-300 transition-colors p-1"
                    title="Delete request">
                    <MdDeleteSweep className="text-2xl" />
                  </button>
                  <button
                    className="text-white hover:text-gray-200 text-2xl font-light transition duration-200"
                    onClick={() => setRequestDetails(null)}>
                    &times;
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`p-6 space-y-6 overflow-y-auto flex-grow ${themeMode === "light" ? "bg-gray-50" : ""}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className={`p-4 rounded-lg border shadow-sm ${themeMode === "light" ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`p-2 rounded-full ${themeMode === "light" ? "bg-indigo-100" : "bg-indigo-900/50"}`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-6 w-6 ${themeMode === "light" ? "text-indigo-600" : "text-indigo-400"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-medium ${themeMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
                        {t("rightSidebar.team")}
                      </h3>
                      <p
                        className={`text-lg font-semibold ${themeMode === "light" ? "text-gray-900" : "text-gray-100"}`}>
                        {requestDetails.teamName}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border shadow-sm ${themeMode === "light" ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`p-2 rounded-full ${themeMode === "light" ? "bg-cyan-100" : "bg-cyan-900/50"}`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-6 w-6 ${themeMode === "light" ? "text-cyan-600" : "text-cyan-400"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-medium ${themeMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
                        {t("rightSidebar.from")}
                      </h3>
                      <p
                        className={`text-lg font-semibold ${themeMode === "light" ? "text-gray-900" : "text-gray-100"}`}>
                        {requestDetails.userName ||
                          requestDetails.userId ||
                          t("rightSidebar.unknownUser")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className={`p-4 rounded-lg border shadow-sm ${themeMode === "light" ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700"}`}>
                  <h3
                    className={`text-sm font-medium mb-3 ${themeMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
                    {t("rightSidebar.skillsInformation")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p
                        className={`text-xs font-medium mb-1 ${getSecondaryTextColor()}`}>
                        {t("rightSidebar.skill")}
                      </p>
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${themeMode === "light" ? "bg-indigo-100 text-indigo-700" : "bg-indigo-900/50 text-indigo-300"}`}>
                        {requestDetails.skill}
                      </div>
                    </div>
                    <div>
                      <p
                        className={`text-xs font-medium mb-1 ${getSecondaryTextColor()}`}>
                        {t("rightSidebar.skillLevel")}
                      </p>
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${themeMode === "light" ? "bg-cyan-100 text-cyan-700" : "bg-cyan-900/50 text-cyan-300"}`}>
                        {requestDetails.skillLevel}
                      </div>
                    </div>
                    <div>
                      <p
                        className={`text-xs font-medium mb-1 ${getSecondaryTextColor()}`}>
                        {t("rightSidebar.timeAvailable")}
                      </p>
                      <div
                        className={`flex items-center ${themeMode === "light" ? "text-gray-700" : "text-gray-300"}`}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 mr-1 ${themeMode === "light" ? "text-indigo-600" : "text-indigo-400"}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {requestDetails.timeAvailable}{" "}
                        {t("rightSidebar.hoursWeek")}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border shadow-sm ${themeMode === "light" ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700"}`}>
                  <h3
                    className={`text-sm font-medium mb-3 ${themeMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
                    {t("rightSidebar.portfolio")}
                  </h3>
                  {requestDetails.portfolio ? (
                    <a
                      href={requestDetails.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center break-all ${themeMode === "light" ? "text-cyan-600 hover:text-cyan-700" : "text-cyan-400 hover:text-cyan-300"}`}>
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
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      {requestDetails.portfolio}
                    </a>
                  ) : (
                    <div className={`italic ${getSecondaryTextColor()}`}>
                      {t("rightSidebar.notProvided")}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border shadow-sm ${themeMode === "light" ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700"}`}>
                  <h3
                    className={`text-sm font-medium mb-2 ${themeMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
                    {t("rightSidebar.whyMe")}
                  </h3>
                  <p
                    className={`italic ${themeMode === "light" ? "text-gray-700" : "text-gray-300"}`}>
                    "{requestDetails.whyMe}"
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border shadow-sm ${themeMode === "light" ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700"}`}>
                  <h3
                    className={`text-sm font-medium mb-2 ${themeMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
                    {t("rightSidebar.aboutMe")}
                  </h3>
                  <div
                    className={`max-h-40 overflow-y-auto pr-2 custom-scrollbar ${themeMode === "light" ? "text-gray-700" : "text-gray-300"}`}>
                    {requestDetails.AboutMe}
                  </div>
                </div>
              </div>

              <div
                className={`flex flex-col sm:flex-row justify-between items-center pt-4 border-t ${themeMode === "light" ? "border-gray-300" : "border-gray-700"}`}>
                <div className="flex items-center mb-4 sm:mb-0">
                  <span
                    className={`text-sm font-medium mr-2 ${getSecondaryTextColor()}`}>
                    {t("rightSidebar.status")}:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      requestDetails.status === "pending"
                        ? themeMode === "light"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-yellow-900/50 text-yellow-300"
                        : requestDetails.status === "accepted"
                          ? themeMode === "light"
                            ? "bg-green-100 text-green-800"
                            : "bg-green-900/50 text-green-300"
                          : themeMode === "light"
                            ? "bg-red-100 text-red-800"
                            : "bg-red-900/50 text-red-300"
                    }`}>
                    {t(`rightSidebar.${requestDetails.status}`)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link
                    to={`/profile/${requestDetails.userId}`}
                    className={`flex items-center justify-center px-4 py-2 border rounded-lg shadow-sm text-sm font-medium transition-colors ${themeMode === "light" ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-100" : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"}`}
                    onClick={() => setRequestDetails(null)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {t("rightSidebar.viewProfile")}
                  </Link>
                  <Link
                    to={`/chat/${requestDetails.userId}`}
                    onClick={() => handleStartNewChat(requestDetails.userId)}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${themeMode === "light" ? "bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600" : "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700"}`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.10M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    {t("rightSidebar.startChat")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RightSideBar;
