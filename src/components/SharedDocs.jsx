/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import WorkspaceSideMenu from "./WorkspaceSideMenu";
import {
  FaTimes,
  FaCloudUploadAlt,
  FaPlus,
  FaDownload,
  FaEye,
} from "react-icons/fa";
import { auth, db, storage } from "../firebase";
import { useParams } from "react-router";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Select from "react-select";
import { v4 as uuidv4 } from "uuid";
import { MdDeleteSweep } from "react-icons/md";
import { useLanguage } from "../context/LanguageContext";

const SharedDocs = () => {
  const [sharedDocs, setSharedDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [showNewDocumentPanel, setShowNewDocumentPanel] = useState(null);
  const { team } = useParams();
  const [members, setMembers] = useState([]);
  const [membersProfiles, setMemberProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
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

  const getDocumentIcon = (type) => {
    const icons = {
      report: "📊",
      proposal: "📝",
      contract: "📄",
      agreement: "🤝",
      invoice: "🧾",
      receipt: "🧾",
      memo: "📋",
      presentation: "📊",
      spreadsheet: "📈",
      manual: "📖",
      guideline: "📘",
      policy: "📑",
      form: "📝",
      certificate: "🏆",
      other: "📁",
    };
    return icons[type] || "📁";
  };

  const [newDocument, setNewDocument] = useState({
    title: "",
    description: "",
    type: "",
    file: null,
    sharedWith: [],
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    themeMode === "light" ? "bg-gray-100" : "bg-[#222223]";
  const getInputBorder = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getButtonBg = () =>
    themeMode === "light"
      ? "bg-gray-200 hover:bg-gray-300"
      : "bg-[#29292a] hover:bg-[#2c2d2e]";
  const getFilterButtonActive = () =>
    themeMode === "light" ? "bg-blue-600 text-white" : "bg-blue-600 text-white";
  const getFilterButtonInactive = () =>
    themeMode === "light"
      ? "bg-gray-200 hover:bg-gray-300 text-gray-900"
      : "bg-[#222223] hover:bg-[#29292a] text-gray-100";
  const getModalBg = () =>
    themeMode === "light" ? "bg-white" : "bg-[#1e1e1f]";
  const getModalBorder = () =>
    themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getEmptyStateBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#222223]";
  const getEmptyStateText = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDocs(sharedDocs);
    } else {
      const filtered = sharedDocs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.createdBy?.displayName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
      setFilteredDocs(filtered);
    }
  }, [searchTerm, sharedDocs]);

  const fetchTeamMembers = async (teamId) => {
    try {
      setLoading(true);
      setError(null);
      const currentUserId = auth.currentUser?.uid;
      if (!teamId) {
        setMembers([]);
        return;
      }

      const teamDocRef = doc(db, "teams", teamId);
      const teamDoc = await getDoc(teamDocRef);

      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        const membersArray = teamData.members || [];
        const filteredMembers = membersArray.filter(
          (memberId) => memberId !== currentUserId,
        );

        setMembers(filteredMembers);
      } else {
        setMembers([]);
        setError(t("sharedDocs.teamNotFound"));
      }
    } catch (err) {
      console.error("Error fetching team members:", err);
      setError(t("sharedDocs.fetchMembersError"));
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
            const userDocRef = doc(db, "users", memberId);
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
    } catch (error) {
      console.error("Error fetching member profiles:", error);
      setError(t("sharedDocs.fetchProfilesError"));
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

  const [options, setOptions] = useState([
    {
      value: "Everyone",
      label: t("sharedDocs.everyone"),
    },
  ]);

  useEffect(() => {
    const newOptions = membersProfiles.map((item) => ({
      value: item.id,
      label: item.displayName || item.name || item.email,
      raw: item,
    }));

    setOptions([
      {
        value: "Everyone",
        label: t("sharedDocs.everyone"),
      },
      ...newOptions,
    ]);
  }, [membersProfiles]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDocument((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert(t("sharedDocs.fileSizeError"));
        return;
      }
      setNewDocument((prev) => ({
        ...prev,
        file,
      }));
    }
  };

  const handleShareChange = (selectedOptions) => {
    const sharedWith = selectedOptions
      ? selectedOptions.map((option) => ({
          id: option.value,
          name: option.label,
          type: option.value === "Everyone" ? "everyone" : "member",
        }))
      : [];

    setNewDocument((prev) => ({
      ...prev,
      sharedWith,
    }));
  };

  const uploadFileToStorage = async (file) => {
    try {
      const fileExtension = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, `teams/${team}/documents/${fileName}`);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        url: downloadURL,
        name: file.name,
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error(t("sharedDocs.uploadError"));
    }
  };

  const saveDocumentToFirestore = async (documentData) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      const documentsRef = collection(db, "teams", team, "documents");

      const docRef = await addDoc(documentsRef, {
        ...documentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email,
          email: currentUser.email,
        },
        teamId: team,
        status: "active",
      });

      return docRef.id;
    } catch (error) {
      console.error("Error saving document:", error);
      throw new Error(t("sharedDocs.saveError"));
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();

    if (!newDocument.title.trim()) {
      alert(t("sharedDocs.titleRequired"));
      return;
    }

    if (!newDocument.file) {
      alert(t("sharedDocs.fileRequired"));
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(30);
      const fileData = await uploadFileToStorage(newDocument.file);

      setUploadProgress(70);
      const documentData = {
        title: newDocument.title.trim(),
        description: newDocument.description.trim(),
        type: newDocument.type,
        file: fileData,
        sharedWith: newDocument.sharedWith,
        accessList: newDocument.sharedWith.flatMap((user) => {
          if (user.type === "everyone") {
            return members.length > 0 ? members : ["everyone"];
          }
          return user.id;
        }),
        isSharedWithEveryone: newDocument.sharedWith.some(
          (user) => user.type === "everyone",
        ),
      };

      const docId = await saveDocumentToFirestore(documentData);
      setUploadProgress(100);

      if (filter === "all") {
        await fetchSharedDocuments();
      } else if (filter === "mine") {
        await fetchMyDocuments();
      } else if (filter === "shared") {
        await fetchDocumentsSharedWithMe();
      } else {
        await fetchSharedDocuments();
      }

      setNewDocument({
        title: "",
        description: "",
        type: "",
        file: null,
        sharedWith: [],
      });
      setShowNewDocumentPanel(false);
    } catch (error) {
      console.error("Error creating document:", error);
      setError(t("sharedDocs.createError"));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClosePanel = () => {
    setNewDocument({
      title: "",
      description: "",
      type: "",
      file: null,
      sharedWith: [],
    });
    setShowNewDocumentPanel(false);
  };

  const fetchSharedDocuments = async () => {
    try {
      setLoading(true);

      if (!team) return;

      const documentsRef = collection(db, "teams", team, "documents");
      const querySnapshot = await getDocs(
        query(documentsRef, orderBy("createdAt", "desc")),
      );

      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
          createdAt:
            doc.data().createdAt?.toDate()?.toLocaleDateString() || "Unknown",
          updatedAt:
            doc.data().updatedAt?.toDate()?.toLocaleDateString() || "Unknown",
        });
      });

      setSharedDocs(documents);
      setFilteredDocs(documents);
      setError(null);
    } catch (error) {
      console.error("Error fetching shared documents:", error);
      setError(t("sharedDocs.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentsSharedWithMe = async () => {
    try {
      setLoading(true);
      const currentUserId = auth.currentUser?.uid;

      if (!team || !currentUserId) return;

      const documentsRef = collection(db, "teams", team, "documents");

      const sharedDocsQuery = query(
        documentsRef,
        where("accessList", "array-contains", currentUserId),
      );

      const querySnapshot = await getDocs(sharedDocsQuery);
      const documents = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt?.toDate()?.toLocaleDateString() || "Unknown",
          updatedAt:
            data.updatedAt?.toDate()?.toLocaleDateString() || "Unknown",
        });
      });

      documents.sort((a, b) => {
        const dateA =
          a.createdAt === "Unknown" ? new Date(0) : new Date(a.createdAt);
        const dateB =
          b.createdAt === "Unknown" ? new Date(0) : new Date(b.createdAt);
        return dateB - dateA;
      });

      setSharedDocs(documents);
      setFilteredDocs(documents);
      setError(null);
    } catch (error) {
      console.error("Error fetching documents shared with me:", error);
      setError(t("sharedDocs.fetchSharedError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDocuments = async () => {
    try {
      setLoading(true);
      const currentUserId = auth.currentUser?.uid;

      if (!team || !currentUserId) return;

      const documentsRef = collection(db, "teams", team, "documents");

      const userDocsQuery = query(
        documentsRef,
        where("createdBy.uid", "==", currentUserId),
      );

      const querySnapshot = await getDocs(userDocsQuery);
      const documents = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt?.toDate()?.toLocaleDateString() || "Unknown",
          updatedAt:
            data.updatedAt?.toDate()?.toLocaleDateString() || "Unknown",
        });
      });

      documents.sort((a, b) => {
        const dateA =
          a.createdAt === "Unknown" ? new Date(0) : new Date(a.createdAt);
        const dateB =
          b.createdAt === "Unknown" ? new Date(0) : new Date(b.createdAt);
        return dateB - dateA;
      });

      setSharedDocs(documents);
      setFilteredDocs(documents);
      setError(null);
    } catch (error) {
      console.error("Error fetching my documents:", error);
      setError(t("sharedDocs.fetchMyError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (team) {
      switch (filter) {
        case "all":
          fetchSharedDocuments();
          break;
        case "recent":
          fetchSharedDocuments();
          break;
        case "mine":
          fetchMyDocuments();
          break;
        case "shared":
          fetchDocumentsSharedWithMe();
          break;
        default:
          fetchSharedDocuments();
      }
    }
  }, [team, filter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDownload = (e, doc, openInNewTab = false) => {
    e.stopPropagation();
    if (openInNewTab) {
      window.open(doc.file.url, "_blank");
    } else {
      const link = document.createElement("a");
      link.href = doc.file.url;
      link.download = doc.file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      const docRef = doc(db, "teams", team, "documents", documentId);
      await deleteDoc(docRef);
      (fetchMyDocuments(), fetchDocumentsSharedWithMe());
      console.log("Document successfully deleted!");
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (languageLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${getBgColor()}`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <div className={getTextColor()}>{t("sharedDocs.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen grid grid-cols-1 lg:grid-cols-12 ${getBgColor()} ${getTextColor()}`}>
      <WorkspaceSideMenu />

      <div className="col-span-1 lg:col-span-11 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8">
          <h1 className={`text-3xl ${isMobile && "pl-15"} font-bold`}>
            {t("sharedDocs.title")}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder={t("sharedDocs.searchPlaceholder")}
                className={`${getInputBg()} ${getTextColor()} rounded-lg py-2 px-4 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 border ${getInputBorder()}`}
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <svg
                className={`w-5 h-5 absolute left-3 top-2.5 ${getSecondaryTextColor()}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>

            <button
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
              onClick={() => {
                setShowNewDocumentPanel(true);
              }}>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              {t("sharedDocs.newDocument")}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 mb-6">
          <button
            className={`font-medium py-2 px-4 rounded-lg transition-colors ${
              filter === "all"
                ? getFilterButtonActive()
                : getFilterButtonInactive()
            }`}
            onClick={() => setFilter("all")}>
            {t("sharedDocs.allDocuments")}
          </button>

          <button
            className={`font-medium py-2 px-4 rounded-lg transition-colors ${
              filter === "mine"
                ? getFilterButtonActive()
                : getFilterButtonInactive()
            }`}
            onClick={() => setFilter("mine")}>
            {t("sharedDocs.createdByMe")}
          </button>
          <button
            className={`font-medium py-2 px-4 rounded-lg transition-colors ${
              filter === "shared"
                ? getFilterButtonActive()
                : getFilterButtonInactive()
            }`}
            onClick={() => setFilter("shared")}>
            {t("sharedDocs.sharedWithMe")}
          </button>
        </div>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 border-t ${getBorderColor()} pt-5`}>
          {loading ? (
            <div className="col-span-3 text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className={`${getSecondaryTextColor()} mt-2`}>
                {t("sharedDocs.loadingDocs")}
              </p>
            </div>
          ) : error ? (
            <div
              className={`col-span-3 text-center py-8 ${themeMode === "light" ? "text-red-600" : "text-red-400"}`}>
              {error}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div
              className={`col-span-3 text-center py-8 ${getEmptyStateText()}`}>
              {searchTerm
                ? t("sharedDocs.noSearchResults")
                : t("sharedDocs.noDocuments")}
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className={`${getCardBg()} rounded-lg p-4 ${getCardHoverBg()} transition-colors cursor-pointer group relative border ${getBorderColor()}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`text-xl flex gap-2 ${getTextColor()}`}>
                    {getDocumentIcon(doc.type)} {doc.type}
                  </div>
                  <div
                    className={`flex items-center ${getSecondaryTextColor()}`}>
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    {doc.sharedWith?.type === "everyone" ? (
                      <span>
                        {doc.sharedWith.length} {t("sharedDocs.members")}
                      </span>
                    ) : (
                      <span>{t("sharedDocs.everyone")}</span>
                    )}
                  </div>
                </div>
                <h3
                  className={`text-2xl font-semibold mb-2 truncate ${getTextColor()}`}>
                  {doc.title}
                </h3>
                <p
                  className={`text-sm ${getSecondaryTextColor()} mb-3 truncate`}>
                  {doc.description}
                </p>
                <div
                  className={`flex justify-between items-center text-sm ${getSecondaryTextColor()}`}>
                  <span>
                    {t("sharedDocs.by")}{" "}
                    {doc.createdBy?.displayName || "Unknown"}
                  </span>
                  <span>{doc.createdAt}</span>
                </div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                  <button
                    onClick={(e) => handleDownload(e, doc, true)}
                    className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white p-2 rounded-lg transition-colors"
                    title={t("sharedDocs.open")}>
                    <FaEye size={14} />
                  </button>
                  <button
                    onClick={(e) => deleteDocument(doc.id)}
                    className="bg-red-500 hover:bg-red-600 cursor-pointer text-white p-2 rounded-lg transition-colors"
                    title={t("sharedDocs.delete")}>
                    <MdDeleteSweep size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showNewDocumentPanel && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
          <div
            className={`${getModalBg()} rounded-xl p-8 w-full max-w-2xl border ${getModalBorder()}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold ${getTextColor()}`}>
                {t("sharedDocs.createDocument")}
              </h2>
              <button
                onClick={handleClosePanel}
                className={`${getSecondaryTextColor()} hover:${getTextColor()} transition-colors`}>
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDocument}>
              <div className="space-y-5">
                <div>
                  <label className={`block ${getSecondaryTextColor()} mb-2`}>
                    {t("sharedDocs.documentTitle")} *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newDocument.title}
                    onChange={handleInputChange}
                    className={`w-full ${getInputBg()} rounded-lg p-3 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500 border ${getInputBorder()}`}
                    placeholder={t("sharedDocs.titlePlaceholder")}
                    required
                  />
                </div>

                <div>
                  <label className={`block ${getSecondaryTextColor()} mb-2`}>
                    {t("sharedDocs.documentDescription")}
                  </label>
                  <textarea
                    name="description"
                    value={newDocument.description}
                    onChange={handleInputChange}
                    rows={5}
                    className={`w-full ${getInputBg()} rounded-lg p-3 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500 border ${getInputBorder()}`}
                    placeholder={t("sharedDocs.descriptionPlaceholder")}
                  />
                </div>

                <div>
                  <label className={`block ${getSecondaryTextColor()} mb-2`}>
                    {t("sharedDocs.documentType")}
                  </label>
                  <select
                    name="type"
                    value={newDocument.type}
                    onChange={handleInputChange}
                    className={`w-full ${getInputBg()} rounded-lg p-3 ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500 border ${getInputBorder()}`}>
                    <option value="" disabled>
                      {t("sharedDocs.selectType")}
                    </option>
                    <option value="report">
                      {t("sharedDocs.types.report")}
                    </option>
                    <option value="proposal">
                      {t("sharedDocs.types.proposal")}
                    </option>
                    <option value="contract">
                      {t("sharedDocs.types.contract")}
                    </option>
                    <option value="agreement">
                      {t("sharedDocs.types.agreement")}
                    </option>
                    <option value="invoice">
                      {t("sharedDocs.types.invoice")}
                    </option>
                    <option value="receipt">
                      {t("sharedDocs.types.receipt")}
                    </option>
                    <option value="memo">{t("sharedDocs.types.memo")}</option>
                    <option value="presentation">
                      {t("sharedDocs.types.presentation")}
                    </option>
                    <option value="spreadsheet">
                      {t("sharedDocs.types.spreadsheet")}
                    </option>
                    <option value="manual">
                      {t("sharedDocs.types.manual")}
                    </option>
                    <option value="guideline">
                      {t("sharedDocs.types.guideline")}
                    </option>
                    <option value="policy">
                      {t("sharedDocs.types.policy")}
                    </option>
                    <option value="form">{t("sharedDocs.types.form")}</option>
                    <option value="certificate">
                      {t("sharedDocs.types.certificate")}
                    </option>
                    <option value="other">{t("sharedDocs.types.other")}</option>
                  </select>
                </div>

                <div>
                  <label className={`block ${getSecondaryTextColor()} mb-2`}>
                    {t("sharedDocs.uploadFile")} *
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${getBorderColor()} rounded-lg cursor-pointer ${getInputBg()} hover:opacity-80`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaCloudUploadAlt
                          className={`w-8 h-8 mb-3 ${getSecondaryTextColor()}`}
                        />
                        <p
                          className={`mb-2 text-sm ${getSecondaryTextColor()}`}>
                          {newDocument.file
                            ? newDocument.file.name
                            : t("sharedDocs.clickToUpload")}
                        </p>
                        <p
                          className={`text-xs ${
                            themeMode === "light"
                              ? "text-gray-500"
                              : "text-gray-500"
                          }`}>
                          {t("sharedDocs.fileRequirements")}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                        required
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className={`block ${getSecondaryTextColor()} mb-2`}>
                    {t("sharedDocs.shareWith")}
                  </label>
                  <Select
                    options={options}
                    onChange={handleShareChange}
                    isMulti
                    className={`react-select-container`}
                    classNamePrefix="react-select"
                    placeholder={t("sharedDocs.selectMembers")}
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor:
                          themeMode === "light" ? "#f3f4f6" : "#1f2937",
                        borderColor:
                          themeMode === "light" ? "#d1d5db" : "#374151",
                        color: themeMode === "light" ? "#111827" : "#f3f4f6",
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor:
                          themeMode === "light" ? "#ffffff" : "#1f2937",
                      }),
                      option: (base, { isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected
                          ? "#2563eb"
                          : themeMode === "light"
                            ? "#ffffff"
                            : "#111827",
                        color: isSelected
                          ? "#ffffff"
                          : themeMode === "light"
                            ? "#111827"
                            : "#f3f4f6",
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: themeMode === "light" ? "#111827" : "#f3f4f6",
                      }),
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor:
                          themeMode === "light" ? "#dbeafe" : "#1e3a8a",
                      }),
                      multiValueLabel: (base) => ({
                        ...base,
                        color: themeMode === "light" ? "#1e40af" : "#93c5fd",
                      }),
                    }}
                  />
                </div>

                {uploading && (
                  <div className="w-full">
                    <div className={`${getInputBg()} rounded-full h-2`}>
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className={`text-sm ${getSecondaryTextColor()} mt-2`}>
                      {t("sharedDocs.uploading")} {uploadProgress}%
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClosePanel}
                    disabled={uploading}
                    className={`px-5 py-2 rounded-lg ${getButtonBg()} transition-colors disabled:opacity-50`}>
                    {t("sharedDocs.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex gap-3 items-center disabled:opacity-50">
                    {uploading ? (
                      t("sharedDocs.uploading")
                    ) : (
                      <>
                        <FaPlus />
                        {t("sharedDocs.create")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedDocs;
