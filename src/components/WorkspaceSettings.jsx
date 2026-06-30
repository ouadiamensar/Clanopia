/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import WorkspaceSideMenu from "./WorkspaceSideMenu";
import { AiFillProfile } from "react-icons/ai";
import { FaUserFriends } from "react-icons/fa";
import { MdChat, MdDangerous } from "react-icons/md";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { auth, db, storage } from "../firebase";
import { useParams, useNavigate } from "react-router";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useLanguage } from "../context/LanguageContext";

const WorkspaceSettings = () => {
  const navigate = useNavigate();
  const { team } = useParams();

  const [settings, setSettings] = useState({
    theme: {
      mode: "dark",
    },
    general: {
      name: "",
      fullDescription: "",
      shortDescription: "",
      category: "Programming",
      language: "English",
      timezone: "UTC+00:00",
      workStyle: "startup",
      imageURL: "",
      bannerURL: "",
      skills: [],
      createdBy: "",
      Moderators: [],
      members: [],
    },
    channels: [],
  });

  const getBgColor = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#1e1e1f]";
  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getCardHoverBg = () =>
    themeMode === "light" ? "hover:bg-gray-50" : "hover:bg-[#252527]";
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getInputBorder = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getGradientBg = () =>
    themeMode === "light"
      ? "bg-gradient-to-r from-cyan-500 to-blue-600"
      : "bg-gradient-to-r from-cyan-600 to-blue-700";

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

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [membersProfiles, setMemberProfiles] = useState([]);
  const [searchMember, setSearchMember] = useState("");
  const [filteredMembers, setFilteredMembers] = useState([]);

  const [channels, setChannels] = useState([]);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [channelError, setChannelError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!team) return;

    try {
      setLoading(true);
      const docRef = doc(db, "teams", team);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const teamData = { id: docSnap.id, ...docSnap.data() };
        const currentUserId = auth.currentUser?.uid;

        const userIsOwner = teamData.createdBy === currentUserId;
        const userIsAdmin =
          teamData.Moderators?.includes(currentUserId) || userIsOwner;

        setIsOwner(userIsOwner);
        setIsAdmin(userIsAdmin);

        setSettings({
          ...settings,
          general: {
            ...settings.general,
            name: teamData.name || "",
            fullDescription: teamData.fullDescription || "",
            shortDescription: teamData.shortDescription || "",
            bannerURL: teamData.bannerURL || "",
            imageURL: teamData.imageURL || "",
            category: teamData.category || "Programming",
            language: teamData.language || "English",
            timezone: teamData.timezone || "UTC+00:00",
            workStyle: teamData.workStyle || "startup",
            skills: teamData.skills || [],
            createdBy: teamData.createdBy || "",
            Moderators: teamData.Moderators || [],
            members: teamData.members || [],
          },
        });

        if (teamData.members && teamData.members.length > 0) {
          await fetchMemberProfiles(teamData.members);
        }
      }
    } catch (error) {
      console.error("Error fetching team data:", error);
      setErrorMessage(t("workspaceSettings.loadError"));
    } finally {
      setLoading(false);
    }
  }, [team, navigate, t]);

  useEffect(() => {
    if (team) {
      fetchSettings();
    }
  }, [team]);

  const fetchMemberProfiles = useCallback(async (memberIds) => {
    if (!memberIds || memberIds.length === 0) {
      setMemberProfiles([]);
      return;
    }

    try {
      const profiles = await Promise.all(
        memberIds.map(async (memberId) => {
          try {
            let userData = null;

            try {
              const userDocRef = doc(db, "users", memberId, "profile", "data");
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                userData = userDoc.data();
              }
            } catch (e) {
              try {
                const userDocRef = doc(db, "users", memberId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                  userData = userDoc.data();
                }
              } catch (e2) {
                console.warn(`User ${memberId} not found in any path`);
              }
            }

            if (userData) {
              return {
                id: memberId,
                name: userData.name || userData.displayName || "Unknown User",
                email: userData.email || "",
                ProfileImageURL:
                  userData.ProfileImageURL || userData.photoURL || "",
                ...userData,
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching user ${memberId}:`, error);
            return null;
          }
        }),
      );

      const validProfiles = profiles.filter(Boolean);
      setMemberProfiles(validProfiles);
      setFilteredMembers(validProfiles);
    } catch (error) {
      console.error("Error fetching member profiles:", error);
    }
  }, []);

  useEffect(() => {
    if (!team) return;

    const unsubscribe = onSnapshot(
      collection(db, "teams", team, "workspace"),
      (querySnapshot) => {
        const channelsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChannels(channelsList);
      },
      (error) => {
        console.error("Error fetching channels:", error);
      },
    );

    return () => unsubscribe();
  }, [team]);

  useEffect(() => {
    const img = settings.general.imageURL;
    if (!img) {
      setLogoPreview("");
      return;
    }
    if (typeof img === "string") {
      setLogoPreview(img);
      return;
    }
    const url = URL.createObjectURL(img);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [settings.general.imageURL]);

  useEffect(() => {
    const banner = settings.general.bannerURL;
    if (!banner) {
      setBannerPreview("");
      return;
    }
    if (typeof banner === "string") {
      setBannerPreview(banner);
      return;
    }
    const url = URL.createObjectURL(banner);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [settings.general.bannerURL]);

  useEffect(() => {
    if (!searchMember.trim()) {
      setFilteredMembers(membersProfiles);
      return;
    }
    const filtered = membersProfiles.filter(
      (member) =>
        member.name?.toLowerCase().includes(searchMember.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchMember.toLowerCase()),
    );
    setFilteredMembers(filtered);
  }, [searchMember, membersProfiles]);

  const saveSettings = async () => {
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!settings.general.name.trim()) {
        setErrorMessage(t("workspaceSettings.nameRequired"));
        setSaving(false);
        return;
      }

      if (settings.general.name.length < 3) {
        setErrorMessage(t("workspaceSettings.nameMinLength"));
        setSaving(false);
        return;
      }

      const teamDocRef = doc(db, "teams", team);
      const updateData = {
        name: settings.general.name.trim(),
        fullDescription: settings.general.fullDescription?.trim() || "",
        shortDescription: settings.general.shortDescription?.trim() || "",
        category: settings.general.category,
        language: settings.general.language,
        timezone: settings.general.timezone,
        workStyle: settings.general.workStyle,
        skills: settings.general.skills || [],
        Moderators: settings.general.Moderators || [],
        updatedAt: new Date().toISOString(),
      };

      if (
        settings.general.imageURL &&
        typeof settings.general.imageURL !== "string"
      ) {
        setUploadingImage(true);
        try {
          const imageFile = settings.general.imageURL;
          const imageRef = ref(storage, `teams/${team}/logo_${Date.now()}`);
          await uploadBytes(imageRef, imageFile);
          const imageURL = await getDownloadURL(imageRef);
          updateData.imageURL = imageURL;
        } catch (error) {
          console.error("Error uploading logo:", error);
          setErrorMessage(t("workspaceSettings.uploadLogoError"));
        } finally {
          setUploadingImage(false);
        }
      } else if (
        settings.general.imageURL &&
        typeof settings.general.imageURL === "string"
      ) {
        updateData.imageURL = settings.general.imageURL;
      }

      if (
        settings.general.bannerURL &&
        typeof settings.general.bannerURL !== "string"
      ) {
        setUploadingImage(true);
        try {
          const bannerFile = settings.general.bannerURL;
          const bannerRef = ref(storage, `teams/${team}/banner_${Date.now()}`);
          await uploadBytes(bannerRef, bannerFile);
          const bannerURL = await getDownloadURL(bannerRef);
          updateData.bannerURL = bannerURL;
        } catch (error) {
          console.error("Error uploading banner:", error);
          setErrorMessage(t("workspaceSettings.uploadBannerError"));
        } finally {
          setUploadingImage(false);
        }
      } else if (
        settings.general.bannerURL &&
        typeof settings.general.bannerURL === "string"
      ) {
        updateData.bannerURL = settings.general.bannerURL;
      }

      await updateDoc(teamDocRef, updateData);

      setSettings((prev) => ({
        ...prev,
        general: {
          ...prev.general,
          ...updateData,
        },
      }));

      setSuccessMessage(t("workspaceSettings.saveSuccess"));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setErrorMessage(error.message || t("workspaceSettings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      setChannelError(t("workspaceSettings.channelNameRequired"));
      return;
    }

    if (newChannelName.length < 3) {
      setChannelError(t("workspaceSettings.channelNameMinLength"));
      return;
    }

    const channelExists = channels.some(
      (ch) =>
        ch.name === newChannelName.trim().toLowerCase().replace(/\s+/g, "-"),
    );
    if (channelExists) {
      setChannelError(t("workspaceSettings.channelExists"));
      return;
    }

    try {
      setSaving(true);
      setChannelError("");

      const channelsCollectionRef = collection(db, "teams", team, "workspace");
      const newChannel = {
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, "-"),
        displayName: newChannelName.trim(),
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid,
        type: "text",
      };

      await addDoc(channelsCollectionRef, newChannel);
      setShowChannelModal(false);
      setNewChannelName("");
      setSuccessMessage(t("workspaceSettings.channelCreateSuccess"));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error creating channel:", error);
      setChannelError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditChannel = async () => {
    if (!newChannelName.trim()) {
      setChannelError(t("workspaceSettings.channelNameRequired"));
      return;
    }

    if (newChannelName.length < 3) {
      setChannelError(t("workspaceSettings.channelNameMinLength"));
      return;
    }

    try {
      setSaving(true);
      setChannelError("");

      const channelDocRef = doc(
        db,
        "teams",
        team,
        "workspace",
        editingChannel.id,
      );
      await updateDoc(channelDocRef, {
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, "-"),
        displayName: newChannelName.trim(),
        updatedAt: new Date().toISOString(),
      });

      setShowChannelModal(false);
      setEditingChannel(null);
      setNewChannelName("");
      setSuccessMessage(t("workspaceSettings.channelUpdateSuccess"));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating channel:", error);
      setChannelError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChannel = async (channelId, channelName) => {
    if (
      !window.confirm(
        t("workspaceSettings.confirmDeleteChannel", { name: channelName }),
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      const channelDocRef = doc(db, "teams", team, "workspace", channelId);
      await deleteDoc(channelDocRef);
      setSuccessMessage(t("workspaceSettings.channelDeleteSuccess"));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting channel:", error);
      setErrorMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!isOwner) {
      setDeleteError(t("workspaceSettings.deleteOwnerOnly"));
      return;
    }

    if (deleteConfirmText !== settings.general.name) {
      setDeleteError(t("workspaceSettings.deleteConfirmError"));
      return;
    }

    try {
      setSaving(true);
      setDeleteError("");

      const channelsSnapshot = await getDocs(
        collection(db, "teams", team, "workspace"),
      );
      const deleteChannelPromises = channelsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref),
      );
      await Promise.all(deleteChannelPromises);

      const teamDocRef = doc(db, "teams", team);
      await deleteDoc(teamDocRef);

      try {
        const logoRef = ref(storage, `teams/${team}/logo`);
        try {
          await deleteDoc(logoRef);
        } catch (e) {
          // تجاهل إذا لم يكن الملف موجوداً
        }
      } catch (e) {
        console.warn("Could not delete storage files:", e);
      }

      setSuccessMessage(t("workspaceSettings.deleteSuccess"));

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error deleting workspace:", error);
      setDeleteError(error.message || t("workspaceSettings.deleteError"));
      setSaving(false);
    }
  };

  const handleMakeAdmin = async (memberId) => {
    if (!window.confirm(t("workspaceSettings.confirmMakeAdmin"))) {
      return;
    }

    try {
      setSaving(true);
      const teamDocRef = doc(db, "teams", team);
      const currentModerators = settings.general.Moderators || [];

      if (!currentModerators.includes(memberId)) {
        await updateDoc(teamDocRef, {
          Moderators: [...currentModerators, memberId],
        });

        setSettings((prev) => ({
          ...prev,
          general: {
            ...prev.general,
            Moderators: [...currentModerators, memberId],
          },
        }));

        setSuccessMessage(t("workspaceSettings.adminAddSuccess"));
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error making admin:", error);
      setErrorMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeAdmin = async (memberId) => {
    if (!window.confirm(t("workspaceSettings.confirmRevokeAdmin"))) {
      return;
    }

    try {
      setSaving(true);
      const teamDocRef = doc(db, "teams", team);
      const currentModerators = settings.general.Moderators || [];
      const updatedModerators = currentModerators.filter(
        (id) => id !== memberId,
      );

      await updateDoc(teamDocRef, {
        Moderators: updatedModerators,
      });

      setSettings((prev) => ({
        ...prev,
        general: {
          ...prev.general,
          Moderators: updatedModerators,
        },
      }));

      setSuccessMessage(t("workspaceSettings.adminRevokeSuccess"));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error revoking admin:", error);
      setErrorMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleKickMember = async (memberId) => {
    if (!window.confirm(t("workspaceSettings.confirmKickMember"))) {
      return;
    }

    try {
      setSaving(true);
      const teamDocRef = doc(db, "teams", team);
      const currentMembers = membersProfiles
        .filter((m) => m.id !== memberId)
        .map((m) => m.id);

      await updateDoc(teamDocRef, {
        members: currentMembers,
      });

      const updatedProfiles = membersProfiles.filter((m) => m.id !== memberId);
      setMemberProfiles(updatedProfiles);
      setFilteredMembers(updatedProfiles);
      setSettings((prev) => ({
        ...prev,
        general: {
          ...prev.general,
          members: currentMembers,
        },
      }));

      setSuccessMessage(t("workspaceSettings.memberRemoveSuccess"));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error kicking member:", error);
      setErrorMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`min-h-screen text-base flex ${
        themeMode === "light" ? "bg-gray-100" : "bg-[#1e1e1f]"
      }`}>
      <WorkspaceSideMenu themeMode={themeMode} />

      <div
        className={`flex-1 transition-all duration-300 p-6 ${
          isMobile ? "mt-16" : "pl-100 pr-60"
        }`}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1
                  className={`text-3xl font-bold mb-2 ${
                    themeMode === "light" ? "text-gray-900" : "text-white"
                  }`}>
                  {t("workspaceSettings.title")}
                </h1>
                <p
                  className={
                    themeMode === "light" ? "text-gray-600" : "text-gray-400"
                  }>
                  {t("workspaceSettings.subtitle")}
                  {settings.general.name && ` - ${settings.general.name}`}
                </p>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="p-4 rounded-lg mb-4 flex items-center bg-green-600 text-white animate-fadeIn">
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

          {errorMessage && (
            <div className="p-4 rounded-lg mb-4 flex items-center bg-red-600 text-white animate-fadeIn">
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
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            <div
              className={`w-full md:w-64 rounded-lg p-4 h-fit ${
                themeMode === "light" ? "bg-white" : "bg-[#222223]"
              }`}>
              <nav className="space-y-2">
                <button
                  className={`w-full text-left p-3 rounded-lg transition flex items-center ${
                    activeTab === "general"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                      : themeMode === "light"
                        ? "text-gray-700 hover:bg-gray-200"
                        : "text-gray-300 hover:bg-[#29292a]"
                  }`}
                  onClick={() => setActiveTab("general")}>
                  <AiFillProfile className="text-2xl mr-3" />
                  {t("workspaceSettings.generalInfo")}
                </button>

                <button
                  className={`w-full text-left p-3 rounded-lg transition flex items-center ${
                    activeTab === "members"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                      : themeMode === "light"
                        ? "text-gray-700 hover:bg-gray-200"
                        : "text-gray-300 hover:bg-[#29292a]"
                  }`}
                  onClick={() => setActiveTab("members")}>
                  <FaUserFriends className="text-2xl mr-3" />
                  {t("workspaceSettings.members")} ({membersProfiles.length})
                </button>

                <button
                  className={`w-full text-left p-3 rounded-lg transition flex items-center ${
                    activeTab === "channels"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                      : themeMode === "light"
                        ? "text-gray-700 hover:bg-gray-200"
                        : "text-gray-300 hover:bg-[#29292a]"
                  }`}
                  onClick={() => setActiveTab("channels")}>
                  <MdChat className="text-2xl mr-3" />
                  {t("workspaceSettings.channels")} ({channels.length})
                </button>

                {(isOwner || isAdmin) && (
                  <button
                    className={`w-full text-left p-3 rounded-lg transition flex items-center ${
                      activeTab === "danger"
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                        : themeMode === "light"
                          ? "text-gray-700 hover:bg-gray-200"
                          : "text-gray-300 hover:bg-[#29292a]"
                    }`}
                    onClick={() => setActiveTab("danger")}>
                    <MdDangerous className="text-2xl mr-3" />
                    {t("workspaceSettings.dangerZone")}
                  </button>
                )}
              </nav>

              {(isOwner || isAdmin) && (
                <button
                  onClick={saveSettings}
                  disabled={saving || uploadingImage}
                  className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center">
                  {saving || uploadingImage ? (
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
                      {uploadingImage
                        ? t("workspaceSettings.uploading")
                        : t("workspaceSettings.saving")}
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
                      {t("workspaceSettings.saveAllChanges")}
                    </>
                  )}
                </button>
              )}
            </div>

            <div
              className={`flex-1 rounded-lg p-6 ${
                themeMode === "light" ? "bg-white" : "bg-[#222223]"
              }`}>
              {activeTab === "general" && (
                <div className="space-y-6">
                  <h2
                    className={`text-xl font-bold ${
                      themeMode === "light" ? "text-gray-900" : "text-white"
                    }`}>
                    {t("workspaceSettings.teamProfile")}
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block mb-2 ${
                            themeMode === "light"
                              ? "text-gray-700"
                              : "text-gray-300"
                          }`}>
                          {t("workspaceSettings.teamName")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={settings.general.name}
                          onChange={(e) => {
                            setSettings((prev) => ({
                              ...prev,
                              general: {
                                ...prev.general,
                                name: e.target.value,
                              },
                            }));
                          }}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            themeMode === "light"
                              ? "bg-white border-gray-300 text-gray-900"
                              : "bg-[#252527] border-[#2c2d2e] text-white"
                          }`}
                          placeholder={t(
                            "workspaceSettings.teamNamePlaceholder",
                          )}
                          disabled={!isOwner && !isAdmin}
                        />
                      </div>

                      <div>
                        <label
                          className={`block mb-2 ${
                            themeMode === "light"
                              ? "text-gray-700"
                              : "text-gray-300"
                          }`}>
                          {t("workspaceSettings.category")}
                        </label>
                        <select
                          value={settings.general.category}
                          onChange={(e) => {
                            setSettings((prev) => ({
                              ...prev,
                              general: {
                                ...prev.general,
                                category: e.target.value,
                              },
                            }));
                          }}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            themeMode === "light"
                              ? "bg-white border-gray-300 text-gray-900"
                              : "bg-[#252527] border-[#2c2d2e] text-white"
                          }`}
                          disabled={!isOwner && !isAdmin}>
                          <option value="Technology">
                            {t("workspaceSettings.categoryTech")}
                          </option>
                          <option value="Programming">
                            {t("workspaceSettings.categoryProgramming")}
                          </option>
                          <option value="Gaming">
                            {t("workspaceSettings.categoryGaming")}
                          </option>
                          <option value="Art & Design">
                            {t("workspaceSettings.categoryArt")}
                          </option>
                          <option value="Music">
                            {t("workspaceSettings.categoryMusic")}
                          </option>
                          <option value="Movies & TV">
                            {t("workspaceSettings.categoryMovies")}
                          </option>
                          <option value="Books & Literature">
                            {t("workspaceSettings.categoryBooks")}
                          </option>
                          <option value="Education">
                            {t("workspaceSettings.categoryEducation")}
                          </option>
                          <option value="Science">
                            {t("workspaceSettings.categoryScience")}
                          </option>
                          <option value="Math">
                            {t("workspaceSettings.categoryMath")}
                          </option>
                          <option value="Engineering">
                            {t("workspaceSettings.categoryEngineering")}
                          </option>
                          <option value="Photography">
                            {t("workspaceSettings.categoryPhotography")}
                          </option>
                          <option value="Business">
                            {t("workspaceSettings.categoryBusiness")}
                          </option>
                          <option value="Marketing">
                            {t("workspaceSettings.categoryMarketing")}
                          </option>
                          <option value="Finance & Investing">
                            {t("workspaceSettings.categoryFinance")}
                          </option>
                          <option value="Startups">
                            {t("workspaceSettings.categoryStartups")}
                          </option>
                          <option value="Health & Fitness">
                            {t("workspaceSettings.categoryHealth")}
                          </option>
                          <option value="Mental Health">
                            {t("workspaceSettings.categoryMentalHealth")}
                          </option>
                          <option value="Nutrition">
                            {t("workspaceSettings.categoryNutrition")}
                          </option>
                          <option value="Travel">
                            {t("workspaceSettings.categoryTravel")}
                          </option>
                          <option value="Food & Cooking">
                            {t("workspaceSettings.categoryFood")}
                          </option>
                          <option value="History">
                            {t("workspaceSettings.categoryHistory")}
                          </option>
                          <option value="Philosophy">
                            {t("workspaceSettings.categoryPhilosophy")}
                          </option>
                          <option value="Politics">
                            {t("workspaceSettings.categoryPolitics")}
                          </option>
                          <option value="News & Current Events">
                            {t("workspaceSettings.categoryNews")}
                          </option>
                          <option value="Religion & Spirituality">
                            {t("workspaceSettings.categoryReligion")}
                          </option>
                          <option value="Languages">
                            {t("workspaceSettings.categoryLanguages")}
                          </option>
                          <option value="Writing & Blogging">
                            {t("workspaceSettings.categoryWriting")}
                          </option>
                          <option value="DIY & Crafts">
                            {t("workspaceSettings.categoryDIY")}
                          </option>
                          <option value="Fashion & Style">
                            {t("workspaceSettings.categoryFashion")}
                          </option>
                          <option value="Parenting">
                            {t("workspaceSettings.categoryParenting")}
                          </option>
                          <option value="Pets & Animals">
                            {t("workspaceSettings.categoryPets")}
                          </option>
                          <option value="Relationships">
                            {t("workspaceSettings.categoryRelationships")}
                          </option>
                          <option value="Memes">
                            {t("workspaceSettings.categoryMemes")}
                          </option>
                          <option value="Productivity">
                            {t("workspaceSettings.categoryProductivity")}
                          </option>
                          <option value="Career & Jobs">
                            {t("workspaceSettings.categoryCareer")}
                          </option>
                          <option value="Self Improvement">
                            {t("workspaceSettings.categorySelfImprovement")}
                          </option>
                          <option value="Environment">
                            {t("workspaceSettings.categoryEnvironment")}
                          </option>
                          <option value="Crypto & Blockchain">
                            {t("workspaceSettings.categoryCrypto")}
                          </option>
                          <option value="AI & Machine Learning">
                            {t("workspaceSettings.categoryAI")}
                          </option>
                          <option value="Web Development">
                            {t("workspaceSettings.categoryWebDev")}
                          </option>
                          <option value="Mobile Development">
                            {t("workspaceSettings.categoryMobileDev")}
                          </option>
                          <option value="UX/UI">
                            {t("workspaceSettings.categoryUXUI")}
                          </option>
                          <option value="Anime & Manga">
                            {t("workspaceSettings.categoryAnime")}
                          </option>
                          <option value="Comics">
                            {t("workspaceSettings.categoryComics")}
                          </option>
                          <option value="Sports">
                            {t("workspaceSettings.categorySports")}
                          </option>
                          <option value="Esports">
                            {t("workspaceSettings.categoryEsports")}
                          </option>
                          <option value="Automotive">
                            {t("workspaceSettings.categoryAutomotive")}
                          </option>
                          <option value="Hobbies & Interests">
                            {t("workspaceSettings.categoryHobbies")}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        className={`block mb-2 ${
                          themeMode === "light"
                            ? "text-gray-700"
                            : "text-gray-300"
                        }`}>
                        {t("workspaceSettings.shortDescription")}
                      </label>
                      <input
                        type="text"
                        value={settings.general.shortDescription}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            general: {
                              ...prev.general,
                              shortDescription: e.target.value,
                            },
                          }));
                        }}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          themeMode === "light"
                            ? "bg-white border-gray-300 text-gray-900"
                            : "bg-[#252527] border-[#2c2d2e] text-white"
                        }`}
                        placeholder={t(
                          "workspaceSettings.shortDescriptionPlaceholder",
                        )}
                        disabled={!isOwner && !isAdmin}
                        maxLength="100"
                      />
                      <div className="text-right text-sm text-gray-400 mt-1">
                        {settings.general.shortDescription?.length || 0}/100
                      </div>
                    </div>

                    <div>
                      <label
                        className={`block mb-2 ${
                          themeMode === "light"
                            ? "text-gray-700"
                            : "text-gray-300"
                        }`}>
                        {t("workspaceSettings.fullDescription")}
                      </label>
                      <textarea
                        value={settings.general.fullDescription}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            general: {
                              ...prev.general,
                              fullDescription: e.target.value,
                            },
                          }));
                        }}
                        rows="4"
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          themeMode === "light"
                            ? "bg-white border-gray-300 text-gray-900"
                            : "bg-[#252527] border-[#2c2d2e] text-white"
                        }`}
                        placeholder={t(
                          "workspaceSettings.fullDescriptionPlaceholder",
                        )}
                        disabled={!isOwner && !isAdmin}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block mb-2 ${
                            themeMode === "light"
                              ? "text-gray-700"
                              : "text-gray-300"
                          }`}>
                          {t("workspaceSettings.language")}
                        </label>
                        <select
                          value={settings.general.language}
                          onChange={(e) => {
                            setSettings((prev) => ({
                              ...prev,
                              general: {
                                ...prev.general,
                                language: e.target.value,
                              },
                            }));
                          }}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            themeMode === "light"
                              ? "bg-white border-gray-300 text-gray-900"
                              : "bg-[#252527] border-[#2c2d2e] text-white"
                          }`}
                          disabled={!isOwner && !isAdmin}>
                          <option value="English">
                            {t("workspaceSettings.languageEnglish")}
                          </option>
                          <option value="Arabic">
                            {t("workspaceSettings.languageArabic")}
                          </option>
                          <option value="French">
                            {t("workspaceSettings.languageFrench")}
                          </option>
                          <option value="Spanish">
                            {t("workspaceSettings.languageSpanish")}
                          </option>
                          <option value="German">
                            {t("workspaceSettings.languageGerman")}
                          </option>
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block mb-2 ${
                            themeMode === "light"
                              ? "text-gray-700"
                              : "text-gray-300"
                          }`}>
                          {t("workspaceSettings.timezone")}
                        </label>
                        <select
                          value={settings.general.timezone}
                          onChange={(e) => {
                            setSettings((prev) => ({
                              ...prev,
                              general: {
                                ...prev.general,
                                timezone: e.target.value,
                              },
                            }));
                          }}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            themeMode === "light"
                              ? "bg-white border-gray-300 text-gray-900"
                              : "bg-[#252527] border-[#2c2d2e] text-white"
                          }`}
                          disabled={!isOwner && !isAdmin}>
                          <option value="UTC-12:00">UTC -12:00</option>
                          <option value="UTC-11:00">UTC -11:00</option>
                          <option value="UTC-10:00">UTC -10:00</option>
                          <option value="UTC-09:00">UTC -09:00</option>
                          <option value="UTC-08:00">UTC -08:00</option>
                          <option value="UTC-07:00">UTC -07:00</option>
                          <option value="UTC-06:00">UTC -06:00</option>
                          <option value="UTC-05:00">UTC -05:00</option>
                          <option value="UTC-04:00">UTC -04:00</option>
                          <option value="UTC-03:00">UTC -03:00</option>
                          <option value="UTC-02:00">UTC -02:00</option>
                          <option value="UTC-01:00">UTC -01:00</option>
                          <option value="UTC+00:00">UTC +00:00</option>
                          <option value="UTC+01:00">UTC +01:00</option>
                          <option value="UTC+02:00">UTC +02:00</option>
                          <option value="UTC+03:00">UTC +03:00</option>
                          <option value="UTC+03:30">UTC +03:30</option>
                          <option value="UTC+04:00">UTC +04:00</option>
                          <option value="UTC+04:30">UTC +04:30</option>
                          <option value="UTC+05:00">UTC +05:00</option>
                          <option value="UTC+05:30">UTC +05:30</option>
                          <option value="UTC+05:45">UTC +05:45</option>
                          <option value="UTC+06:00">UTC +06:00</option>
                          <option value="UTC+06:30">UTC +06:30</option>
                          <option value="UTC+07:00">UTC +07:00</option>
                          <option value="UTC+08:00">UTC +08:00</option>
                          <option value="UTC+09:00">UTC +09:00</option>
                          <option value="UTC+09:30">UTC +09:30</option>
                          <option value="UTC+10:00">UTC +10:00</option>
                          <option value="UTC+11:00">UTC +11:00</option>
                          <option value="UTC+12:00">UTC +12:00</option>
                          <option value="UTC+13:00">UTC +13:00</option>
                          <option value="UTC+14:00">UTC +14:00</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        className={`block mb-2 ${
                          themeMode === "light"
                            ? "text-gray-700"
                            : "text-gray-300"
                        }`}>
                        {t("workspaceSettings.workStyle")}
                      </label>
                      <select
                        value={settings.general.workStyle}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            general: {
                              ...prev.general,
                              workStyle: e.target.value,
                            },
                          }));
                        }}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          themeMode === "light"
                            ? "bg-white border-gray-300 text-gray-900"
                            : "bg-[#252527] border-[#2c2d2e] text-white"
                        }`}
                        disabled={!isOwner && !isAdmin}>
                        <option value="volunteer">
                          {t("workspaceSettings.workStyleVolunteer")}
                        </option>
                        <option value="paid">
                          {t("workspaceSettings.workStylePaid")}
                        </option>
                        <option value="profit">
                          {t("workspaceSettings.workStyleProfit")}
                        </option>
                        <option value="startup">
                          {t("workspaceSettings.workStyleStartup")}
                        </option>
                        <option value="hobby">
                          {t("workspaceSettings.workStyleHobby")}
                        </option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block mb-2 ${
                            themeMode === "light"
                              ? "text-gray-700"
                              : "text-gray-300"
                          }`}>
                          {t("workspaceSettings.logo")}
                        </label>
                        {!settings.general.imageURL ? (
                          <label
                            className={`block cursor-pointer py-3 px-4 rounded-lg text-center ${
                              themeMode === "light"
                                ? "bg-gray-200 hover:bg-gray-300"
                                : "bg-[#29292a] hover:bg-[#2c2d2e]"
                            } transition-colors ${
                              !isOwner && !isAdmin
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}>
                            📤 {t("workspaceSettings.uploadLogo")}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              disabled={!isOwner && !isAdmin}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && (isOwner || isAdmin)) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    setErrorMessage(
                                      t("workspaceSettings.logoSizeError"),
                                    );
                                    return;
                                  }
                                  setSettings((prev) => ({
                                    ...prev,
                                    general: {
                                      ...prev.general,
                                      imageURL: file,
                                    },
                                  }));
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="relative group w-full">
                            <img
                              src={logoPreview}
                              alt="Logo"
                              className="rounded-lg w-full max-h-32 object-contain"
                            />
                            {(isOwner || isAdmin) && (
                              <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-sm">
                                <label className="cursor-pointer px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg">
                                  {t("workspaceSettings.change")}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        if (file.size > 5 * 1024 * 1024) {
                                          setErrorMessage(
                                            t(
                                              "workspaceSettings.logoSizeError",
                                            ),
                                          );
                                          return;
                                        }
                                        setSettings((prev) => ({
                                          ...prev,
                                          general: {
                                            ...prev.general,
                                            imageURL: file,
                                          },
                                        }));
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label
                          className={`block mb-2 ${
                            themeMode === "light"
                              ? "text-gray-700"
                              : "text-gray-300"
                          }`}>
                          {t("workspaceSettings.banner")}
                        </label>
                        {!settings.general.bannerURL ? (
                          <label
                            className={`block cursor-pointer py-3 px-4 rounded-lg text-center ${
                              themeMode === "light"
                                ? "bg-gray-200 hover:bg-gray-300"
                                : "bg-[#29292a] hover:bg-[#2c2d2e]"
                            } transition-colors ${
                              !isOwner && !isAdmin
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}>
                            📤 {t("workspaceSettings.uploadBanner")}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              disabled={!isOwner && !isAdmin}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && (isOwner || isAdmin)) {
                                  if (file.size > 10 * 1024 * 1024) {
                                    setErrorMessage(
                                      t("workspaceSettings.bannerSizeError"),
                                    );
                                    return;
                                  }
                                  setSettings((prev) => ({
                                    ...prev,
                                    general: {
                                      ...prev.general,
                                      bannerURL: file,
                                    },
                                  }));
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="relative group w-full">
                            <img
                              src={bannerPreview}
                              alt="Banner"
                              className="rounded-lg w-full max-h-40 object-cover"
                            />
                            {(isOwner || isAdmin) && (
                              <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-sm">
                                <label className="cursor-pointer px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg">
                                  {t("workspaceSettings.change")}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        if (file.size > 10 * 1024 * 1024) {
                                          setErrorMessage(
                                            t(
                                              "workspaceSettings.bannerSizeError",
                                            ),
                                          );
                                          return;
                                        }
                                        setSettings((prev) => ({
                                          ...prev,
                                          general: {
                                            ...prev.general,
                                            bannerURL: file,
                                          },
                                        }));
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        className={`block mb-2 ${
                          themeMode === "light"
                            ? "text-gray-700"
                            : "text-gray-300"
                        }`}>
                        {t("workspaceSettings.skillsNeeded")}
                      </label>
                      {settings.general.skills.map((skill, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={skill.skill}
                            className={`flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                              themeMode === "light"
                                ? "bg-white border-gray-300 text-gray-900"
                                : "bg-[#252527] border-[#2c2d2e] text-white"
                            } ${!isOwner && !isAdmin ? "opacity-50" : ""}`}
                            onChange={(e) => {
                              if (!isOwner && !isAdmin) return;
                              const value = e.target.value;
                              setSettings((prev) => ({
                                ...prev,
                                general: {
                                  ...prev.general,
                                  skills: prev.general.skills.map((item, i) =>
                                    i === index
                                      ? { ...item, skill: value }
                                      : item,
                                  ),
                                },
                              }));
                            }}
                            placeholder={t(
                              "workspaceSettings.skillNamePlaceholder",
                            )}
                            disabled={!isOwner && !isAdmin}
                          />
                          <select
                            value={skill.NumSkill || "1"}
                            onChange={(e) => {
                              if (!isOwner && !isAdmin) return;
                              const value = e.target.value;
                              setSettings((prev) => ({
                                ...prev,
                                general: {
                                  ...prev.general,
                                  skills: prev.general.skills.map((item, i) =>
                                    i === index
                                      ? { ...item, NumSkill: value }
                                      : item,
                                  ),
                                },
                              }));
                            }}
                            className={`w-24 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                              themeMode === "light"
                                ? "bg-white border-gray-300 text-gray-900"
                                : "bg-[#252527] border-[#2c2d2e] text-white"
                            } ${!isOwner && !isAdmin ? "opacity-50" : ""}`}
                            disabled={!isOwner && !isAdmin}>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>
                          {(isOwner || isAdmin) && (
                            <button
                              className="px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                              onClick={() => {
                                setSettings((prev) => ({
                                  ...prev,
                                  general: {
                                    ...prev.general,
                                    skills: prev.general.skills.filter(
                                      (_, i) => i !== index,
                                    ),
                                  },
                                }));
                              }}>
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      {(isOwner || isAdmin) && (
                        <button
                          className={`mt-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                            themeMode === "light"
                              ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                              : "bg-[#29292a] hover:bg-[#2c2d2e] text-white"
                          }`}
                          onClick={() => {
                            setSettings((prev) => ({
                              ...prev,
                              general: {
                                ...prev.general,
                                skills: [
                                  ...prev.general.skills,
                                  { skill: "", NumSkill: "1" },
                                ],
                              },
                            }));
                          }}>
                          + {t("workspaceSettings.addSkill")}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#2c2d2e]">
                      <div>
                        <label className="block text-sm text-gray-400">
                          {t("workspaceSettings.createdBy")}
                        </label>
                        <p className="text-white">
                          {settings.general.createdBy || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400">
                          {t("workspaceSettings.teamId")}
                        </label>
                        <p className="text-white text-sm font-mono">{team}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "members" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h2
                      className={`text-xl font-bold ${
                        themeMode === "light" ? "text-gray-900" : "text-white"
                      }`}>
                      {t("workspaceSettings.memberManagement")}
                    </h2>
                    <div className="relative flex-1 max-w-xs">
                      <input
                        type="text"
                        placeholder={t("workspaceSettings.searchMembers")}
                        value={searchMember}
                        onChange={(e) => setSearchMember(e.target.value)}
                        className={`w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          themeMode === "light"
                            ? "bg-white border-gray-300 text-gray-900"
                            : "bg-[#252527] border-[#2c2d2e] text-white"
                        }`}
                      />
                      <span className="absolute left-3 top-3 text-gray-500">
                        🔍
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {t("workspaceSettings.total")}: {membersProfiles.length}{" "}
                      {t("workspaceSettings.members")}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead
                        className={`border-b ${
                          themeMode === "light"
                            ? "border-gray-200"
                            : "border-[#2c2d2e]"
                        }`}>
                        <tr
                          className={`text-left ${
                            themeMode === "light"
                              ? "text-gray-600"
                              : "text-gray-400"
                          }`}>
                          <th className="pb-3">
                            {t("workspaceSettings.member")}
                          </th>
                          <th className="pb-3">
                            {t("workspaceSettings.role")}
                          </th>
                          <th className="pb-3">
                            {t("workspaceSettings.actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.map((member) => {
                          const isOwnerUser =
                            member.id === settings.general.createdBy;
                          const isAdminUser =
                            settings.general.Moderators?.includes(member.id);
                          const isCurrentUser =
                            member.id === auth.currentUser?.uid;

                          return (
                            <tr
                              key={member.id}
                              className={`border-b ${
                                themeMode === "light"
                                  ? "border-gray-100"
                                  : "border-[#2c2d2e]"
                              }`}>
                              <td className="py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                                    {member.ProfileImageURL ? (
                                      <img
                                        src={member.ProfileImageURL}
                                        className="w-full h-full object-cover"
                                        alt={member.name}
                                      />
                                    ) : (
                                      member.name?.charAt(0)?.toUpperCase() ||
                                      "?"
                                    )}
                                  </div>
                                  <div>
                                    <span
                                      className={
                                        themeMode === "light"
                                          ? "text-gray-900"
                                          : "text-white"
                                      }>
                                      {member.name || "Unknown User"}
                                    </span>
                                    {isCurrentUser && (
                                      <span className="ml-2 text-xs text-purple-400">
                                        ({t("workspaceSettings.you")})
                                      </span>
                                    )}
                                    <div className="text-xs text-gray-400">
                                      {member.email || ""}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    isOwnerUser
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : isAdminUser
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-gray-500/20 text-gray-400"
                                  }`}>
                                  {isOwnerUser
                                    ? "👑 " + t("workspaceSettings.owner")
                                    : isAdminUser
                                      ? "⭐ " + t("workspaceSettings.admin")
                                      : "👤 " + t("workspaceSettings.member")}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex flex-wrap gap-2">
                                  {!isOwnerUser &&
                                    !isCurrentUser &&
                                    (isOwner || isAdmin) && (
                                      <button
                                        onClick={() =>
                                          handleKickMember(member.id)
                                        }
                                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm">
                                        {t("workspaceSettings.kick")}
                                      </button>
                                    )}

                                  {!isOwnerUser &&
                                    !isAdminUser &&
                                    !isCurrentUser &&
                                    (isOwner || isAdmin) && (
                                      <button
                                        onClick={() =>
                                          handleMakeAdmin(member.id)
                                        }
                                        className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors text-sm">
                                        {t("workspaceSettings.makeAdmin")}
                                      </button>
                                    )}

                                  {isAdminUser &&
                                    !isOwnerUser &&
                                    !isCurrentUser &&
                                    (isOwner || isAdmin) && (
                                      <button
                                        onClick={() =>
                                          handleRevokeAdmin(member.id)
                                        }
                                        className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-sm">
                                        {t("workspaceSettings.revokeAdmin")}
                                      </button>
                                    )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {filteredMembers.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      {searchMember
                        ? t("workspaceSettings.noMembersMatch")
                        : t("workspaceSettings.noMembersFound")}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "channels" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h2
                      className={`text-xl font-bold ${
                        themeMode === "light" ? "text-gray-900" : "text-white"
                      }`}>
                      {t("workspaceSettings.channelManagement")}
                    </h2>
                    {(isOwner || isAdmin) && (
                      <button
                        onClick={() => {
                          setEditingChannel(null);
                          setNewChannelName("");
                          setChannelError("");
                          setShowChannelModal(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer ">
                        <span>+</span> {t("workspaceSettings.newChannel")}
                      </button>
                    )}
                  </div>

                  <div>
                    <h3
                      className={`text-sm font-semibold mb-2 uppercase ${
                        themeMode === "light"
                          ? "text-gray-500"
                          : "text-gray-400"
                      }`}>
                      {t("workspaceSettings.textChannels")} ({channels.length})
                    </h3>
                    {channels.map((channel) => (
                      <div
                        key={channel.id}
                        className={`flex items-center justify-between p-3 rounded-lg mb-2 ${
                          themeMode === "light" ? "bg-gray-100" : "bg-[#252527]"
                        }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">#</span>
                          <span
                            className={`font-medium ${
                              themeMode === "light"
                                ? "text-gray-900"
                                : "text-white"
                            }`}>
                            {channel.displayName || channel.name}
                          </span>
                          {channel.createdAt && (
                            <span className="text-xs text-gray-400">
                              {t("workspaceSettings.created")}:{" "}
                              {new Date(channel.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {(isOwner || isAdmin) &&
                          channel.id != "general-chat" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingChannel(channel);
                                  setNewChannelName(
                                    channel.displayName || channel.name,
                                  );
                                  setChannelError("");
                                  setShowChannelModal(true);
                                }}
                                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm">
                                ✏️ {t("workspaceSettings.edit")}
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteChannel(channel.id, channel.name)
                                }
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm">
                                🗑️ {t("workspaceSettings.delete")}
                              </button>
                            </div>
                          )}
                        {channel.id == "general-chat" && (
                          <h1
                            className={`px-3 py-1 ${themeMode == "light" ? "text-gray-900" : "text-gray-300"}  rounded-lg transition-colors text-sm`}>
                            You cannot edit or delete this channel .
                          </h1>
                        )}
                      </div>
                    ))}
                  </div>

                  {channels.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      {t("workspaceSettings.noChannels")}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "danger" && (isOwner || isAdmin) && (
                <div className="space-y-6">
                  <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-red-400 mb-2">
                      ⚠️ {t("workspaceSettings.dangerZone")}
                    </h2>
                    <p className="text-gray-400 mb-4">
                      {isOwner
                        ? t("workspaceSettings.dangerZoneDescOwner")
                        : t("workspaceSettings.dangerZoneDescAdmin")}
                    </p>

                    {isOwner && (
                      <button
                        onClick={() => {
                          setDeleteConfirmText("");
                          setDeleteError("");
                          setShowDeleteModal(true);
                        }}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                        🗑️ {t("workspaceSettings.deleteWorkspace")}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showChannelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#222223] rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              {editingChannel
                ? "✏️ " + t("workspaceSettings.editChannel")
                : "➕ " + t("workspaceSettings.createNewChannel")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t("workspaceSettings.channelName")}
                </label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full bg-[#252527] border border-[#2c2d2e] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  placeholder={t("workspaceSettings.channelNamePlaceholder")}
                  autoFocus
                />
                {channelError && (
                  <p className="text-red-400 text-sm mt-1">{channelError}</p>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  {t("workspaceSettings.channelNamePreview")}: #
                  {newChannelName.trim().toLowerCase().replace(/\s+/g, "-") ||
                    "channel-name"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowChannelModal(false);
                  setEditingChannel(null);
                  setNewChannelName("");
                  setChannelError("");
                }}
                className="flex-1 px-4 py-2 bg-[#29292a] hover:bg-[#2c2d2e] text-white rounded-lg transition-colors">
                {t("workspaceSettings.cancel")}
              </button>
              <button
                onClick={
                  editingChannel ? handleEditChannel : handleCreateChannel
                }
                disabled={saving}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50">
                {saving ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t("workspaceSettings.saving")}
                  </span>
                ) : editingChannel ? (
                  t("workspaceSettings.saveChanges")
                ) : (
                  t("workspaceSettings.createChannel")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && isOwner && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#222223] rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-red-400 mb-2">
                {t("workspaceSettings.deleteWorkspaceTitle")}
              </h3>
              <p className="text-gray-400 mb-4">
                {t("workspaceSettings.deleteWorkspaceDesc")}
                <strong className="text-white">
                  {" "}
                  "{settings.general.name}"
                </strong>{" "}
                {t("workspaceSettings.deleteWorkspaceDesc2")}
              </p>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-300">
                  {t("workspaceSettings.deleteConfirmLabel")}{" "}
                  <strong className="text-red-400">
                    {settings.general.name}
                  </strong>{" "}
                  {t("workspaceSettings.deleteConfirmLabel2")}:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => {
                    setDeleteConfirmText(e.target.value);
                    setDeleteError("");
                  }}
                  className="w-full mt-2 bg-[#252527] border border-red-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                  placeholder={settings.general.name}
                  autoFocus
                />
                {deleteError && (
                  <p className="text-red-400 text-sm mt-1">{deleteError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                    setDeleteError("");
                  }}
                  className="flex-1 px-4 py-2 bg-[#29292a] hover:bg-[#2c2d2e] text-white rounded-lg transition-colors">
                  {t("workspaceSettings.cancel")}
                </button>
                <button
                  onClick={handleDeleteWorkspace}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
                  {saving ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t("workspaceSettings.deleting")}
                    </span>
                  ) : (
                    t("workspaceSettings.permanentlyDelete")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSettings;
