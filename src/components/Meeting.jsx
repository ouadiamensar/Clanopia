/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import WorkspaceSideMenu from "./WorkspaceSideMenu";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  FaSquare,
  FaUsers,
  FaClock,
  FaCalendarCheck,
  FaVideo,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaPlay,
  FaPause,
  FaStop,
} from "react-icons/fa";
import { TbCalendarCancel, TbClock, TbUser, TbLink } from "react-icons/tb";
import { MdOutlineMeetingRoom, MdOutlineSchedule } from "react-icons/md";
import { BiTime, BiCalendar, BiUser, BiLink } from "react-icons/bi";
import { useLanguage } from "../context/LanguageContext";

const Meeting = () => {
  const { channel, team } = useParams();

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

  const [showMeetingPanel, setShowMeetingPanel] = useState(false);
  const [meetingType, setMeetingType] = useState("now");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [meetingDuration, setMeetingDuration] = useState(30);
  const [calendarView, setCalendarView] = useState("month");
  const [meetingLink, setMeetingLink] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem("themeMode");
    return savedTheme || "light";
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const meetingsPerPage = 10;
  const [profile, setProfile] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [DeleteMeetingCheck, setDeleteMeetingCheck] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getBgColor = () =>
    themeMode === "light" ? "bg-gray-50" : "bg-[#1e1e1f]";
  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-800" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getTableRowBg = () =>
    themeMode === "light" ? "hover:bg-gray-50" : "hover:bg-[#252527]/50";
  const getTableHeaderBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#222223]/80";
  const getModalBg = () =>
    themeMode === "light" ? "bg-white" : "bg-[#222223]";
  const getButtonBg = () =>
    themeMode === "light"
      ? "bg-gray-200 hover:bg-gray-300"
      : "bg-[#29292a] hover:bg-[#2c2d2e]";
  const getButtonSecondaryBg = () =>
    themeMode === "light"
      ? "bg-gray-100 hover:bg-gray-200"
      : "bg-[#252527] hover:bg-[#29292a]";

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

  useEffect(() => {
    if (!currentUser) return;
    const fetchUserProfile = async () => {
      const profileRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "profile",
        "data",
      );
      const snapshot = await getDoc(profileRef);
      setProfile(snapshot.exists() ? snapshot.data() : null);
    };

    fetchUserProfile();
  }, [currentUser]);

  useEffect(() => {
    const fetchIsAdmin = async () => {
      if (!team || !auth.currentUser) return;

      try {
        const docRef = doc(db, "teams", team);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const teamData = { id: docSnap.id, ...docSnap.data() };
          const currentUserId = auth.currentUser?.uid;

          const userIsAdmin = teamData.Moderators?.includes(currentUserId);
          setIsAdmin(userIsAdmin);
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
      }
    };

    fetchIsAdmin();
  }, [team]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!team) return;

    setLoading(true);
    const meetingsRef = collection(db, "teams", team, "meetings");
    let q;

    if (channel) {
      q = query(
        meetingsRef,
        where("channel", "==", channel),
        orderBy("start", "desc"),
        limit(meetingsPerPage),
      );
    } else {
      q = query(meetingsRef, orderBy("start", "desc"), limit(meetingsPerPage));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const meetingsData = [];
        snapshot.forEach((doc) => {
          meetingsData.push({ id: doc.id, ...doc.data() });
        });

        if (snapshot.docs.length > 0) {
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        } else {
          setLastVisible(null);
        }

        setHasMore(snapshot.docs.length === meetingsPerPage);
        setMeetings(meetingsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching meetings: ", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [team, channel]);

  const loadNextPage = async () => {
    if (!lastVisible || !team) return;

    setLoading(true);
    const meetingsRef = collection(db, "teams", team, "meetings");
    let q;

    if (channel) {
      q = query(
        meetingsRef,
        where("channel", "==", channel),
        orderBy("start", "desc"),
        startAfter(lastVisible),
        limit(meetingsPerPage),
      );
    } else {
      q = query(
        meetingsRef,
        orderBy("start", "desc"),
        startAfter(lastVisible),
        limit(meetingsPerPage),
      );
    }

    const snapshot = await getDocs(q);
    const newMeetings = [];
    snapshot.forEach((doc) => {
      newMeetings.push({ id: doc.id, ...doc.data() });
    });

    if (snapshot.docs.length > 0) {
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    } else {
      setLastVisible(null);
    }

    setHasMore(snapshot.docs.length === meetingsPerPage);
    setMeetings([...meetings, ...newMeetings]);
    setPage(page + 1);
    setLoading(false);
  };

  const loadFirstPage = () => {
    setPage(1);
  };

  useEffect(() => {
    if (meetingType === "now") {
      const now = new Date();
      setSelectedDate(now.toISOString().split("T")[0]);
      setSelectedTime(
        `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`,
      );
    }
  }, [meetingType]);

  const handleCreateMeeting = async () => {
    if (!team) {
      alert(t("meeting.teamIdMissing"));
      return;
    }

    try {
      if (meetingType === "now") {
        const newMeeting = {
          title: meetingTitle || t("meeting.quickMeeting"),
          organizer: auth.currentUser.uid,
          organizerName: profile.name || auth.currentUser.email,
          channel: channel || "general",
          date: selectedDate,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          duration: meetingDuration,
          participants: 0,
          status: "In Progress",
          start: new Date().toISOString(),
          end: new Date(Date.now() + meetingDuration * 60000).toISOString(),
          createdAt: new Date().toISOString(),
          meetingLink: meetingLink,
          createdBy: auth.currentUser.uid,
        };

        const docRef = await addDoc(
          collection(db, "teams", team, "meetings"),
          newMeeting,
        );
        console.log("Meeting started with ID: ", docRef.id);

        setShowMeetingPanel(false);
        resetMeetingForm();
        alert(`${t("meeting.meetingStarted")} ${meetingLink}`);
      } else {
        if (!meetingTitle || !selectedDate || !selectedTime) {
          alert(t("meeting.fillRequiredFields"));
          return;
        }

        const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
        const newMeeting = {
          title: meetingTitle,
          date: selectedDate,
          organizer: auth.currentUser.uid,
          organizerName: profile?.name || auth.currentUser.email,
          duration: meetingDuration,
          status: "Scheduled",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          start: startDateTime.toISOString(),
          end: new Date(
            startDateTime.getTime() + meetingDuration * 60000,
          ).toISOString(),
          createdAt: new Date().toISOString(),
          meetingLink: meetingLink,
          createdBy: auth.currentUser.uid,
        };

        const docRef = await addDoc(
          collection(db, "teams", team, "meetings"),
          newMeeting,
        );
        console.log("Meeting scheduled with ID: ", docRef.id);

        setShowMeetingPanel(false);
        resetMeetingForm();
        alert(t("meeting.meetingScheduled"));
      }
    } catch (error) {
      console.error("Error creating meeting: ", error);
      alert(t("meeting.createFailed"));
    }
  };

  const resetMeetingForm = () => {
    setMeetingTitle("");
    setSelectedDate("");
    setSelectedTime("");
    setMeetingDuration(30);
    setMeetingLink("");
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      await deleteDoc(doc(db, "teams", team, "meetings", meetingId));
      setDeleteMeetingCheck(null);
      setShowDeleteModal(false);
      setMeetingToDelete(null);
      alert(t("meeting.deleteSuccess"));
    } catch (error) {
      console.error("Error deleting meeting: ", error);
      alert(t("meeting.deleteFailed"));
    }
  };

  const handleUpdateMeetingStatus = async (meetingId, newStatus) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return;

    if (!isAdmin && meeting.organizer !== auth.currentUser?.uid) {
      alert(t("meeting.noPermission"));
      return;
    }

    try {
      await updateDoc(doc(db, "teams", team, "meetings", meetingId), {
        status: newStatus,
        ...(newStatus === "Completed" && { end: new Date().toISOString() }),
        ...(newStatus === "In Progress" && {
          start: new Date().toISOString(),
          ...(meeting.status === "Scheduled" && {
            actualStart: new Date().toISOString(),
          }),
        }),
      });
      alert(t("meeting.statusUpdated", { status: newStatus }));
    } catch (error) {
      console.error("Error updating meeting status: ", error);
      alert(t("meeting.statusUpdateFailed"));
    }
  };

  const handleEditMeeting = async (meetingId, updatedData) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return;

    if (!isAdmin && meeting.organizer !== auth.currentUser?.uid) {
      alert(t("meeting.noPermission"));
      return;
    }

    try {
      await updateDoc(
        doc(db, "teams", team, "meetings", meetingId),
        updatedData,
      );
      setEditingMeeting(null);
      alert(t("meeting.updateSuccess"));
    } catch (error) {
      console.error("Error updating meeting: ", error);
      alert(t("meeting.updateFailed"));
    }
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (calendarView === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (calendarView === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const changeView = (viewType) => {
    setCalendarView(viewType);
  };

  const filteredMeetings = channel
    ? meetings.filter((meeting) => meeting.channel === channel)
    : meetings;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const CalendarView = () => {
    if (calendarView === "month") {
      return (
        <MonthView
          currentDate={currentDate}
          meetings={filteredMeetings}
          setSelectedMeeting={setSelectedMeeting}
          themeMode={themeMode}
          getBorderColor={getBorderColor}
          getTextColor={getTextColor}
          getSecondaryTextColor={getSecondaryTextColor}
          isAdmin={isAdmin}
          t={t}
        />
      );
    } else {
      return (
        <WeekView
          currentDate={currentDate}
          meetings={filteredMeetings}
          setSelectedMeeting={setSelectedMeeting}
          themeMode={themeMode}
          getBorderColor={getBorderColor}
          getTextColor={getTextColor}
          getSecondaryTextColor={getSecondaryTextColor}
          isAdmin={isAdmin}
          t={t}
        />
      );
    }
  };

  const MonthView = ({
    currentDate,
    meetings,
    setSelectedMeeting,
    themeMode,
    getBorderColor,
    getTextColor,
    getSecondaryTextColor,
    t,
  }) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className={`h-24 p-2 border ${getBorderColor()}`}></div>,
      );
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${i
        .toString()
        .padStart(2, "0")}`;
      const dayMeetings = meetings.filter((m) => m.date === dateStr);

      const today = new Date();
      const isToday =
        today.getDate() === i &&
        today.getMonth() === month &&
        today.getFullYear() === year;

      days.push(
        <div
          key={i}
          className={`h-24 p-2 border ${getBorderColor()} overflow-y-auto ${
            isToday ? "bg-blue-500/10" : ""
          }`}>
          <div
            className={`font-bold ${isToday ? "text-blue-400" : getTextColor()}`}>
            {i}
          </div>
          {dayMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className={`text-xs p-1 mb-1 rounded cursor-pointer transition-all hover:scale-105 ${
                meeting.status === "Completed"
                  ? "bg-green-600/30 hover:bg-green-600/50 border-l-2 border-green-500"
                  : meeting.status === "In Progress"
                    ? "bg-blue-600/30 hover:bg-blue-600/50 border-l-2 border-blue-500"
                    : "bg-yellow-600/30 hover:bg-yellow-600/50 border-l-2 border-yellow-500"
              }`}
              onClick={() => setSelectedMeeting(meeting)}>
              <span className="font-medium">{meeting.time}</span> -{" "}
              {meeting.title}
            </div>
          ))}
        </div>,
      );
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div
        className={`${
          themeMode === "light" ? "bg-gray-50" : "bg-gray-800/50"
        } rounded-lg p-4`}>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className={`text-center font-bold ${getSecondaryTextColor()}`}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">{days}</div>
      </div>
    );
  };

  const WeekView = ({
    currentDate,
    meetings,
    setSelectedMeeting,
    themeMode,
    getBorderColor,
    getTextColor,
    t,
  }) => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);

      const dateStr = dayDate.toISOString().split("T")[0];
      const dayMeetings = meetings.filter((m) => m.date === dateStr);

      const today = new Date();
      const isToday =
        today.getDate() === dayDate.getDate() &&
        today.getMonth() === dayDate.getMonth() &&
        today.getFullYear() === dayDate.getFullYear();

      days.push(
        <div
          key={i}
          className={`h-40 p-2 border ${getBorderColor()} overflow-y-auto ${
            isToday ? "bg-blue-500/10" : ""
          }`}>
          <div
            className={`font-bold ${isToday ? "text-blue-400" : getTextColor()}`}>
            {dayNames[i]} {dayDate.getDate()}
          </div>
          {dayMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className={`text-xs p-1 mb-1 rounded cursor-pointer transition-all hover:scale-105 ${
                meeting.status === "Completed"
                  ? "bg-green-600/30 hover:bg-green-600/50 border-l-2 border-green-500"
                  : meeting.status === "In Progress"
                    ? "bg-blue-600/30 hover:bg-blue-600/50 border-l-2 border-blue-500"
                    : "bg-yellow-600/30 hover:bg-yellow-600/50 border-l-2 border-yellow-500"
              }`}
              onClick={() => setSelectedMeeting(meeting)}>
              <span className="font-medium">{meeting.time}</span> -{" "}
              {meeting.title}
            </div>
          ))}
        </div>,
      );
    }

    return (
      <div
        className={`${
          themeMode === "light" ? "bg-gray-50" : "bg-gray-800/50"
        } rounded-lg p-4`}>
        <div className="grid grid-cols-7 gap-2">{days}</div>
      </div>
    );
  };

  const MeetingDetailModal = () => {
    if (!selectedMeeting) return null;

    const isOrganizer =
      currentUser && currentUser.uid === selectedMeeting.organizer;
    const canManage = isAdmin || isOrganizer;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div
          className={`${getCardBg()} rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in`}>
          <div
            className={`p-6 border-b ${getBorderColor()} flex justify-between items-start`}>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className={`text-2xl font-bold ${getTextColor()}`}>
                  {selectedMeeting.title}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    selectedMeeting.status === "Scheduled"
                      ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      : selectedMeeting.status === "Completed"
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : selectedMeeting.status === "In Progress"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}>
                  {selectedMeeting.status}
                </span>
                {canManage && (
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {isAdmin ? t("meeting.admin") : t("meeting.organizer")}
                  </span>
                )}
              </div>
              <p
                className={`${getSecondaryTextColor()} text-sm flex items-center gap-2`}>
                <BiUser /> {t("meeting.organizerLabel")}:{" "}
                {selectedMeeting.organizerName || t("meeting.unknown")}
              </p>
            </div>
            <button
              onClick={() => setSelectedMeeting(null)}
              className={`p-2 rounded-lg ${getButtonBg()} transition-colors`}>
              <FaTimes />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-xl ${getInputBg()}`}>
                <div className="flex items-center gap-3">
                  <BiCalendar className="text-blue-400 text-xl" />
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>
                      {t("meeting.date")}
                    </p>
                    <p className={`font-medium ${getTextColor()}`}>
                      {selectedMeeting.date}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-xl ${getInputBg()}`}>
                <div className="flex items-center gap-3">
                  <BiTime className="text-blue-400 text-xl" />
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>
                      {t("meeting.time")}
                    </p>
                    <p className={`font-medium ${getTextColor()}`}>
                      {selectedMeeting.time}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-xl ${getInputBg()}`}>
                <div className="flex items-center gap-3">
                  <FaClock className="text-blue-400 text-xl" />
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>
                      {t("meeting.duration")}
                    </p>
                    <p className={`font-medium ${getTextColor()}`}>
                      {selectedMeeting.duration} {t("meeting.minutes")}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-xl ${getInputBg()}`}>
                <div className="flex items-center gap-3">
                  <FaUsers className="text-blue-400 text-xl" />
                  <div>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>
                      {t("meeting.participants")}
                    </p>
                    <p className={`font-medium ${getTextColor()}`}>
                      {selectedMeeting.participants || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {selectedMeeting.meetingLink && (
              <div className={`p-4 rounded-xl ${getInputBg()}`}>
                <div className="flex items-center gap-3">
                  <TbLink className="text-blue-400 text-xl" />
                  <div className="flex-1">
                    <p className={`text-sm ${getSecondaryTextColor()}`}>
                      {t("meeting.meetingLink")}
                    </p>
                    <a
                      href={selectedMeeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline break-all">
                      {selectedMeeting.meetingLink}
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs ${getSecondaryTextColor()}`}>
                  {t("meeting.createdAt")}
                </p>
                <p className={`text-sm ${getTextColor()}`}>
                  {selectedMeeting.createdAt
                    ? new Date(selectedMeeting.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className={`text-xs ${getSecondaryTextColor()}`}>
                  {t("meeting.channel")}
                </p>
                <p className={`text-sm ${getTextColor()}`}>
                  #{selectedMeeting.channel || "general"}
                </p>
              </div>
            </div>

            <div
              className={`pt-4 border-t ${getBorderColor()} flex flex-wrap gap-3`}>
              <button
                onClick={() => setSelectedMeeting(null)}
                className={`px-6 py-2.5 rounded-xl ${getButtonBg()} transition-all hover:scale-105`}>
                {t("meeting.close")}
              </button>

              {selectedMeeting.status === "Scheduled" && (
                <button
                  onClick={() => {
                    if (canManage) {
                      handleUpdateMeetingStatus(
                        selectedMeeting.id,
                        "In Progress",
                      );
                      setSelectedMeeting(null);
                    } else {
                      alert(t("meeting.noPermission"));
                    }
                  }}
                  className={`px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-105 flex items-center gap-2 ${
                    !canManage && "opacity-50 cursor-not-allowed"
                  }`}
                  disabled={!canManage}>
                  <FaPlay className="text-sm" /> {t("meeting.joinMeeting")}
                </button>
              )}

              {canManage && selectedMeeting.status === "In Progress" && (
                <button
                  onClick={() => {
                    handleUpdateMeetingStatus(selectedMeeting.id, "Completed");
                    setSelectedMeeting(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all hover:scale-105 flex items-center gap-2">
                  <FaCheck /> {t("meeting.markCompleted")}
                </button>
              )}

              {canManage && selectedMeeting.status === "Scheduled" && (
                <button
                  onClick={() => {
                    setEditingMeeting(selectedMeeting);
                    setSelectedMeeting(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white transition-all hover:scale-105 flex items-center gap-2">
                  <FaEdit /> {t("meeting.edit")}
                </button>
              )}

              {canManage && (
                <button
                  onClick={() => {
                    setMeetingToDelete(selectedMeeting.id);
                    setShowDeleteModal(true);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all hover:scale-105 flex items-center gap-2">
                  <FaTrash /> {t("meeting.delete")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EditMeetingModal = () => {
    if (!editingMeeting) return null;

    const [editTitle, setEditTitle] = useState(editingMeeting.title);
    const [editDate, setEditDate] = useState(editingMeeting.date);
    const [editTime, setEditTime] = useState(editingMeeting.time);
    const [editDuration, setEditDuration] = useState(editingMeeting.duration);
    const [editLink, setEditLink] = useState(editingMeeting.meetingLink || "");

    const handleSaveEdit = async () => {
      if (!editTitle || !editDate || !editTime) {
        alert(t("meeting.fillRequiredFields"));
        return;
      }

      const startDateTime = new Date(`${editDate}T${editTime}`);
      await handleEditMeeting(editingMeeting.id, {
        title: editTitle,
        date: editDate,
        time: editTime,
        duration: editDuration,
        meetingLink: editLink,
        start: startDateTime.toISOString(),
        end: new Date(
          startDateTime.getTime() + editDuration * 60000,
        ).toISOString(),
      });
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div
          className={`${getCardBg()} rounded-2xl shadow-2xl w-full max-w-2xl`}>
          <div
            className={`p-6 border-b ${getBorderColor()} flex justify-between items-center`}>
            <h2 className={`text-2xl font-bold ${getTextColor()}`}>
              {t("meeting.editMeeting")}
            </h2>
            <button
              onClick={() => setEditingMeeting(null)}
              className={`p-2 rounded-lg ${getButtonBg()} transition-colors`}>
              <FaTimes />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className={`block ${getSecondaryTextColor()} mb-2`}>
                {t("meeting.meetingTitle")}
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={`w-full ${getInputBg()} rounded-lg p-3 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder={t("meeting.enterTitle")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block ${getSecondaryTextColor()} mb-2`}>
                  {t("meeting.date")}
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className={`w-full ${getInputBg()} rounded-lg p-3 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <div>
                <label className={`block ${getSecondaryTextColor()} mb-2`}>
                  {t("meeting.time")}
                </label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className={`w-full ${getInputBg()} rounded-lg p-3 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div>
              <label className={`block ${getSecondaryTextColor()} mb-2`}>
                {t("meeting.durationMinutes")}
              </label>
              <select
                value={editDuration}
                onChange={(e) => setEditDuration(parseInt(e.target.value))}
                className={`w-full ${getInputBg()} rounded-lg p-3 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                <option value={15}>15 {t("meeting.minutes")}</option>
                <option value={30}>30 {t("meeting.minutes")}</option>
                <option value={45}>45 {t("meeting.minutes")}</option>
                <option value={60}>60 {t("meeting.minutes")}</option>
                <option value={90}>90 {t("meeting.minutes")}</option>
                <option value={120}>{t("meeting.moreThan120")}</option>
              </select>
            </div>

            <div>
              <label className={`block ${getSecondaryTextColor()} mb-2`}>
                {t("meeting.meetingLink")}
              </label>
              <input
                type="url"
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
                className={`w-full ${getInputBg()} rounded-lg p-3 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder={t("meeting.pasteLink")}
              />
            </div>

            <div
              className={`pt-4 border-t ${getBorderColor()} flex justify-end gap-3`}>
              <button
                onClick={() => setEditingMeeting(null)}
                className={`px-6 py-2.5 rounded-xl ${getButtonBg()} transition-all`}>
                {t("meeting.cancel")}
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-105 flex items-center gap-2">
                <FaCheck /> {t("meeting.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmationModal = () => {
    if (!showDeleteModal) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div
          className={`${getCardBg()} rounded-2xl shadow-2xl w-full max-w-md`}>
          <div className={`p-6 border-b ${getBorderColor()}`}>
            <h2 className={`text-2xl font-bold ${getTextColor()} text-center`}>
              {t("meeting.deleteMeeting")}
            </h2>
          </div>

          <div className="p-6">
            <p className={`${getTextColor()} text-center mb-2`}>
              {t("meeting.deleteConfirm")}
            </p>
            <p className={`${getSecondaryTextColor()} text-center text-sm`}>
              {t("meeting.deleteUndo")}
            </p>

            <div className={`mt-6 flex gap-3 justify-center`}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMeetingToDelete(null);
                }}
                className={`px-6 py-2.5 rounded-xl ${getButtonBg()} transition-all hover:scale-105`}>
                {t("meeting.cancel")}
              </button>
              <button
                onClick={() => {
                  if (meetingToDelete) {
                    handleDeleteMeeting(meetingToDelete);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all hover:scale-105 flex items-center gap-2">
                <FaTrash /> {t("meeting.delete")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen grid grid-cols-12 ${getBgColor()}`}>
        <WorkspaceSideMenu activeChannel={channel} />
        <div className="col-span-10 lg:col-span-11 xl:col-span-12 pl-20 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className={`mt-4 ${getSecondaryTextColor()}`}>
              {t("meeting.loadingMeetings")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen grid grid-cols-12 ${getBgColor()} ${getTextColor()}`}>
      <WorkspaceSideMenu activeChannel={channel} />

      <div className="col-span-12 lg:col-span-10 xl:col-span-12 lg:pl-20 p-4 lg:p-8">
        <header className="mb-8 flex flex-col gap-6 lg:flex-row justify-between items-start lg:items-center">
          <div>
            <h1 className={`text-3xl font-bold ${isMobile && "pl-15"}`}>
              {channel
                ? `#${channel} ${t("meeting.meetings")}`
                : t("meeting.allMeetings")}
            </h1>
            <p className={`${getSecondaryTextColor()} mt-2`}>
              {t("meeting.subtitle")}
              {isAdmin && (
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {t("meeting.admin")}
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => setShowMeetingPanel(true)}
            className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 cursor-pointer px-8 py-4 rounded-xl shadow-lg transition-all transform hover:scale-105">
            <svg
              className="w-6 h-6 mr-2 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="text-lg font-semibold text-white">
              {t("meeting.startNewMeeting")}
            </span>
          </button>
        </header>

        <div className={`${getModalBg()} rounded-xl p-6 mb-8`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div
              className={`${getCardBg()} p-6 rounded-xl border ${getBorderColor()} transition-all hover:scale-105`}>
              <h3
                className={`${getSecondaryTextColor()} text-sm flex items-center gap-2`}>
                <MdOutlineMeetingRoom /> {t("meeting.totalMeetings")}
              </h3>
              <p className="text-2xl font-bold mt-2">
                {filteredMeetings.length}
              </p>
            </div>
            <div
              className={`${getCardBg()} p-6 rounded-xl border ${getBorderColor()} transition-all hover:scale-105`}>
              <h3
                className={`${getSecondaryTextColor()} text-sm flex items-center gap-2`}>
                <MdOutlineSchedule /> {t("meeting.scheduled")}
              </h3>
              <p className="text-2xl font-bold mt-2 text-yellow-400">
                {
                  filteredMeetings.filter((m) => m.status === "Scheduled")
                    .length
                }
              </p>
            </div>
            <div
              className={`${getCardBg()} p-6 rounded-xl border ${getBorderColor()} transition-all hover:scale-105`}>
              <h3
                className={`${getSecondaryTextColor()} text-sm flex items-center gap-2`}>
                <FaVideo /> {t("meeting.inProgress")}
              </h3>
              <p className="text-2xl font-bold mt-2 text-blue-400">
                {
                  filteredMeetings.filter((m) => m.status === "In Progress")
                    .length
                }
              </p>
            </div>
            <div
              className={`${getCardBg()} p-6 rounded-xl border ${getBorderColor()} transition-all hover:scale-105`}>
              <h3
                className={`${getSecondaryTextColor()} text-sm flex items-center gap-2`}>
                <FaCalendarCheck /> {t("meeting.completed")}
              </h3>
              <p className="text-2xl font-bold mt-2 text-green-400">
                {
                  filteredMeetings.filter((m) => m.status === "Completed")
                    .length
                }
              </p>
            </div>
          </div>
        </div>

        {showMeetingPanel && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div
              className={`${getCardBg()} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
              <div
                className={`p-6 border-b ${getBorderColor()} flex justify-between items-center`}>
                <h2 className={`text-2xl font-bold ${getTextColor()}`}>
                  {t("meeting.createNewMeeting")}
                </h2>
                <button
                  onClick={() => {
                    setShowMeetingPanel(false);
                    resetMeetingForm();
                  }}
                  className={`p-2 rounded-lg ${getButtonBg()} transition-colors`}>
                  <FaTimes />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className={`block ${getSecondaryTextColor()} mb-2`}>
                    {t("meeting.meetingType")}
                  </label>
                  <div className="flex space-x-4">
                    <button
                      className={`px-4 py-2 rounded-lg transition-all ${
                        meetingType === "now"
                          ? "bg-blue-600 text-white"
                          : getButtonSecondaryBg()
                      }`}
                      onClick={() => setMeetingType("now")}>
                      <FaPlay className="inline mr-2" /> {t("meeting.startNow")}
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg transition-all ${
                        meetingType === "schedule"
                          ? "bg-blue-600 text-white"
                          : getButtonSecondaryBg()
                      }`}
                      onClick={() => setMeetingType("schedule")}>
                      <MdOutlineSchedule className="inline mr-2" />{" "}
                      {t("meeting.schedule")}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block ${getSecondaryTextColor()} mb-2`}>
                    {t("meeting.meetingTitle")}
                  </label>
                  <input
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className={`w-full ${getInputBg()} rounded-lg p-3 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder={t("meeting.enterTitle")}
                  />
                </div>

                {meetingType === "schedule" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block ${getSecondaryTextColor()} mb-2`}>
                        {t("meeting.date")}
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={`w-full ${getInputBg()} rounded-lg p-3 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block ${getSecondaryTextColor()} mb-2`}>
                        {t("meeting.time")}
                      </label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className={`w-full ${getInputBg()} rounded-lg p-3 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className={`block ${getSecondaryTextColor()} mb-2`}>
                    {t("meeting.durationMinutes")}
                  </label>
                  <select
                    value={meetingDuration}
                    onChange={(e) =>
                      setMeetingDuration(parseInt(e.target.value))
                    }
                    className={`w-full ${getInputBg()} rounded-lg p-3 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                    <option value={15}>15 {t("meeting.minutes")}</option>
                    <option value={30}>30 {t("meeting.minutes")}</option>
                    <option value={45}>45 {t("meeting.minutes")}</option>
                    <option value={60}>60 {t("meeting.minutes")}</option>
                    <option value={90}>90 {t("meeting.minutes")}</option>
                    <option value={120}>{t("meeting.moreThan120")}</option>
                  </select>
                </div>

                <div>
                  <label className={`block ${getSecondaryTextColor()} mb-2`}>
                    {t("meeting.meetingLink")}
                  </label>
                  <div className="flex gap-2">
                    <select
                      className={`${getButtonSecondaryBg()} rounded-lg px-3 py-2 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                      <option value="zoom">Zoom</option>
                      <option value="google-meet">Google Meet</option>
                      <option value="microsoft-teams">Microsoft Teams</option>
                      <option value="webex">Cisco Webex</option>
                      <option value="skype">Skype</option>
                      <option value="jitsi">Jitsi Meet</option>
                      <option value="whereby">Whereby</option>
                      <option value="others">{t("meeting.others")}</option>
                    </select>
                    <input
                      value={meetingLink}
                      type="url"
                      placeholder={t("meeting.pasteLink")}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className={`flex-grow ${getInputBg()} rounded-lg px-3 py-2 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>

                <div
                  className={`pt-4 border-t ${getBorderColor()} flex justify-end gap-3`}>
                  <button
                    onClick={() => {
                      setShowMeetingPanel(false);
                      resetMeetingForm();
                    }}
                    className={`px-6 py-2.5 rounded-xl ${getButtonBg()} transition-all`}>
                    {t("meeting.cancel")}
                  </button>
                  <button
                    onClick={handleCreateMeeting}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-105 flex items-center gap-2">
                    {meetingType === "now" ? <FaPlay /> : <MdOutlineSchedule />}
                    {meetingType === "now"
                      ? t("meeting.startMeeting")
                      : t("meeting.scheduleMeeting")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`${getModalBg()} rounded-xl overflow-hidden p-6 mb-8`}>
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h2 className={`text-xl font-bold ${getTextColor()}`}>
              {t("meeting.calendar")} - {currentMonth} {currentYear}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleToday}
                className={`px-4 py-2 rounded-lg ${getButtonBg()} transition-all hover:scale-105`}>
                {t("meeting.today")}
              </button>
              <button
                onClick={handlePrev}
                className={`px-4 py-2 rounded-lg ${getButtonBg()} transition-all hover:scale-105`}>
                &lt;
              </button>
              <button
                onClick={handleNext}
                className={`px-4 py-2 rounded-lg ${getButtonBg()} transition-all hover:scale-105`}>
                &gt;
              </button>
              <div className="flex gap-2 ml-2">
                <button
                  onClick={() => changeView("month")}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    calendarView === "month"
                      ? "bg-blue-600 text-white"
                      : getButtonSecondaryBg()
                  }`}>
                  {t("meeting.month")}
                </button>
                <button
                  onClick={() => changeView("week")}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    calendarView === "week"
                      ? "bg-blue-600 text-white"
                      : getButtonSecondaryBg()
                  }`}>
                  {t("meeting.week")}
                </button>
              </div>
            </div>
          </div>

          <div className="h-fit overflow-y-auto">
            <CalendarView />
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2">
                <FaSquare className="text-blue-500" />
                <span className={`text-sm ${getSecondaryTextColor()}`}>
                  {t("meeting.inProgress")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaSquare className="text-yellow-500" />
                <span className={`text-sm ${getSecondaryTextColor()}`}>
                  {t("meeting.scheduled")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaSquare className="text-green-500" />
                <span className={`text-sm ${getSecondaryTextColor()}`}>
                  {t("meeting.completed")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={`${getModalBg()} rounded-xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={getTableHeaderBg()}>
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    {t("meeting.meetingTitle")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    {t("meeting.date")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    {t("meeting.time")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    {t("meeting.duration")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    {t("meeting.organizerLabel")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    {t("meeting.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    {t("meeting.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${getBorderColor()}`}>
                {filteredMeetings
                  .slice(0, page * meetingsPerPage)
                  .map((meeting) => {
                    const isOrganizer =
                      currentUser && currentUser.uid === meeting.organizer;
                    const canManage = isAdmin || isOrganizer;

                    return (
                      <tr
                        key={meeting.id}
                        className={`${getTableRowBg()} transition-colors`}>
                        <td className="px-6 py-4 font-medium">
                          {meeting.title}
                        </td>
                        <td className="px-6 py-4">{meeting.date}</td>
                        <td className="px-6 py-4">{meeting.time}</td>
                        <td className="px-6 py-4">
                          {meeting.duration} {t("meeting.min")}
                        </td>
                        <td className="px-6 py-4">
                          {meeting.organizerName || t("meeting.unknown")}
                          {isAdmin && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                              {t("meeting.admin")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${
                              meeting.status === "Scheduled"
                                ? "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30"
                                : meeting.status === "Completed"
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                  : meeting.status === "In Progress"
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                            }`}>
                            {meeting.status === "Scheduled"
                              ? t("meeting.scheduled")
                              : meeting.status === "Completed"
                                ? t("meeting.completed")
                                : meeting.status === "In Progress"
                                  ? t("meeting.inProgress")
                                  : meeting.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              onClick={() => setSelectedMeeting(meeting)}>
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            {canManage && (
                              <>
                                <button
                                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                                  onClick={() => setEditingMeeting(meeting)}>
                                  <FaEdit />
                                </button>
                                <button
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  onClick={() => {
                                    setMeetingToDelete(meeting.id);
                                    setShowDeleteModal(true);
                                  }}>
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {filteredMeetings.length === 0 && !loading && (
            <div className={`p-8 text-center ${getSecondaryTextColor()}`}>
              {t("meeting.noMeetings")}
            </div>
          )}

          {(hasMore || page > 1) && (
            <div className="p-4 flex flex-wrap justify-center gap-3">
              {page > 1 && (
                <button
                  onClick={loadFirstPage}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all hover:scale-105 disabled:opacity-50">
                  {loading ? t("meeting.loading") : t("meeting.firstPage")}
                </button>
              )}
              {hasMore && (
                <button
                  onClick={loadNextPage}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all hover:scale-105 disabled:opacity-50">
                  {loading ? t("meeting.loading") : t("meeting.loadMore")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <MeetingDetailModal />
      <EditMeetingModal />
      <DeleteConfirmationModal />
    </div>
  );
};

export default Meeting;
