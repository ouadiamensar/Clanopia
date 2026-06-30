/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  collection,
  getDocs,
  query,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { auth, db, storage } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import {
  RiArrowLeftLine,
  RiSaveLine,
  RiImageLine,
  RiCloseLine,
  RiUploadLine,
  RiUserLine,
  RiCalendarLine,
  RiLockLine,
  RiDeleteBinLine,
  RiAlertLine,
} from "react-icons/ri";
import { onAuthStateChanged } from "firebase/auth";
import Sidebar from "./Sidebar";
import RightSideBar from "./RightSideBar";

const CommunitySettings = () => {
  const { category, communityId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [community, setCommunity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
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
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    fullDescription: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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
  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getHoverColor = () =>
    themeMode === "light" ? "hover:bg-gray-200" : "hover:bg-[#29292a]";
  const getGradientBg = () =>
    themeMode === "light"
      ? "bg-gradient-to-r from-cyan-500 to-purple-600"
      : "bg-gradient-to-r from-cyan-600 to-purple-700";
  const getDangerBg = () =>
    themeMode === "light"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-red-600 hover:bg-red-700";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) navigate("/login");
    });
    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    if (!communityId || !category) return;

    const communityRef = doc(db, "communities", category, "items", communityId);

    const unsubscribe = onSnapshot(
      communityRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCommunity(data);

          setFormData({
            name: data.name || "",
            shortDescription: data.shortDescription || "",
            fullDescription: data.fullDescription || "",
          });

          setLogoPreview(data.logoURL || null);
          setBannerPreview(data.bannerURL || null);

          if (currentUser) {
            const isCreator = data.createdBy === currentUser.uid;
            setIsAuthorized(isCreator);
            if (!isCreator) {
              setErrorMsg("You are not authorized to edit this community");
            }
          }

          setIsLoading(false);
        } else {
          setErrorMsg("Community not found");
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching community:", error);
        setErrorMsg("Error loading community");
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [communityId, category, currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Logo must be less than 5MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("Banner must be less than 10MB");
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
  };

  const handleSave = async () => {
    if (!currentUser || !isAuthorized) {
      setErrorMsg("You are not authorized to edit this community");
      return;
    }

    if (!formData.name.trim()) {
      setErrorMsg("Community name is required");
      return;
    }

    setIsSaving(true);
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const communityRef = doc(
        db,
        "communities",
        category,
        "items",
        communityId,
      );

      const updateData = {
        name: formData.name.trim(),
        shortDescription: formData.shortDescription.trim(),
        fullDescription: formData.fullDescription.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      };

      if (logoFile) {
        setUploadProgress(20);
        const logoRef = ref(
          storage,
          `community_logos/${communityId}-logo-${Date.now()}`,
        );
        await uploadBytes(logoRef, logoFile);
        const logoURL = await getDownloadURL(logoRef);
        updateData.logoURL = logoURL;
        setUploadProgress(40);
      }

      if (bannerFile) {
        setUploadProgress(60);
        const bannerRef = ref(
          storage,
          `community_banners/${communityId}-banner-${Date.now()}`,
        );
        await uploadBytes(bannerRef, bannerFile);
        const bannerURL = await getDownloadURL(bannerRef);
        updateData.bannerURL = bannerURL;
        setUploadProgress(80);
      }

      await updateDoc(communityRef, updateData);

      try {
        const userCommunityRef = doc(
          db,
          "users",
          currentUser.uid,
          "myOwnCommunities",
          communityId,
        );
        const userDoc = await getDoc(userCommunityRef);
        if (userDoc.exists()) {
          await updateDoc(userCommunityRef, {
            communityName: formData.name.trim(),
            shortDescription: formData.shortDescription.trim(),
            fullDescription: formData.fullDescription.trim(),
            ...(updateData.logoURL && { logoURL: updateData.logoURL }),
            ...(updateData.bannerURL && { bannerURL: updateData.bannerURL }),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.log("Could not update user's copy:", err);
      }

      setUploadProgress(100);
      setSuccessMsg("Community updated successfully!");

      setLogoFile(null);
      setBannerFile(null);

      setTimeout(() => {
        setSuccessMsg("");
        setUploadProgress(0);
      }, 3000);
    } catch (error) {
      console.error("Error saving community:", error);
      setErrorMsg(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !isAuthorized) return;

    setIsDeleting(true);
    setErrorMsg("");

    try {
      const communityRef = doc(
        db,
        "communities",
        category,
        "items",
        communityId,
      );

      const postsRef = collection(
        db,
        "communities",
        category,
        "items",
        communityId,
        "posts",
      );
      const postsSnapshot = await getDocs(postsRef);

      for (const postDoc of postsSnapshot.docs) {
        await deleteDoc(postDoc.ref);
      }

      await deleteDoc(communityRef);

      try {
        const userCommunityRef = doc(
          db,
          "users",
          currentUser.uid,
          "myOwnCommunities",
          communityId,
        );
        await deleteDoc(userCommunityRef);
      } catch (err) {
        console.log("Could not delete from myOwnCommunities:", err);
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const communities = userDoc.data().communities || [];
          const updatedCommunities = communities.filter(
            (id) => id !== communityId,
          );
          await updateDoc(userRef, { communities: updatedCommunities });
        }
      } catch (err) {
        console.log("Could not update user communities array:", err);
      }

      setSuccessMsg("Community deleted successfully!");
      setShowDeleteModal(false);

      setTimeout(() => {
        navigate("/Communities");
      }, 1500);
    } catch (error) {
      console.error("Error deleting community:", error);
      setErrorMsg(`Error deleting community: ${error.message}`);
      setIsDeleting(false);
    }
  };

  if (isLoading || languageLoading) {
    return (
      <div
        className={`min-h-screen ${getBgColor()} flex items-center justify-center`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <div className={getTextColor()}>Loading community settings...</div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div
        className={`min-h-screen ${getBgColor()} flex items-center justify-center p-4`}>
        <div
          className={`${getCardBg()} rounded-2xl p-8 max-w-md w-full text-center border ${getBorderColor()} shadow-xl`}>
          <div className="text-6xl mb-4">🔒</div>
          <h2 className={`text-2xl font-bold ${getTextColor()} mb-2`}>
            Access Denied
          </h2>
          <p className={getSecondaryTextColor()}>
            You are not authorized to edit this community. Only the creator can
            modify settings.
          </p>
          <button
            onClick={() => navigate(-1)}
            className={`mt-6 px-6 py-3 ${getGradientBg()} text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-300`}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${getBgColor()} ${getTextColor()} transition-colors duration-300`}>
      <Sidebar themeMode={themeMode} />

      <div className="flex pt-12 lg:pt-0">
        <div className="flex-1 flex flex-col lg:flex-row pt-10 justify-center">
          <div
            className={`flex-1 max-w-6xl  lg:ml-65 lg:mr-25 md:w-110 md:ml-65 md:mr-25 w-full px-2 lg:px-5 py-2 lg:py-6 `}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    navigate(
                      `/community/${category}/${communityId}/${community.name}`,
                    )
                  }
                  className={`p-2 rounded-xl ${getCardBg()} ${getHoverColor()} border ${getBorderColor()} transition-all duration-300`}>
                  <RiArrowLeftLine className="w-5 h-5" />
                </button>
                <div>
                  <h1
                    className={`text-2xl lg:text-3xl font-bold ${getTextColor()}`}>
                    Community Settings
                  </h1>
                  <p className={getSecondaryTextColor()}>
                    Manage your community information
                  </p>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${getGradientBg()} text-white`}>
                <RiLockLine className="inline mr-1 w-3 h-3" />
                Creator Only
              </div>
            </div>

            {successMsg && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
                {errorMsg}
              </div>
            )}

            <div
              className={`${getCardBg()} rounded-2xl p-6 border ${getBorderColor()} shadow-lg`}>
              <div className="mb-6">
                <label className={`block font-semibold mb-2 ${getTextColor()}`}>
                  Community Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter community name"
                  className={`w-full px-4 py-3 rounded-xl ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 focus:border-transparent ${getTextColor()} placeholder-gray-400`}
                  disabled={isSaving}
                />
                <p className={`text-xs ${getSecondaryTextColor()} mt-1`}>
                  This will be displayed as r/
                  {formData.name || "community-name"}
                </p>
              </div>

              <div className="mb-6">
                <label className={`block font-semibold mb-2 ${getTextColor()}`}>
                  Short Description
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Brief description of your community"
                  maxLength={150}
                  className={`w-full px-4 py-3 rounded-xl ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 focus:border-transparent ${getTextColor()} placeholder-gray-400`}
                  disabled={isSaving}
                />
                <p className={`text-xs ${getSecondaryTextColor()} mt-1`}>
                  {formData.shortDescription.length}/150 characters
                </p>
              </div>

              <div className="mb-6">
                <label className={`block font-semibold mb-2 ${getTextColor()}`}>
                  Full Description
                </label>
                <textarea
                  name="fullDescription"
                  value={formData.fullDescription}
                  onChange={handleInputChange}
                  placeholder="Detailed description of your community"
                  rows={16}
                  className={`w-full px-4 py-3 rounded-xl ${getInputBg()} border ${getBorderColor()} focus:ring-2 focus:ring-purple-500 focus:border-transparent ${getTextColor()} placeholder-gray-400 resize-none`}
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`block font-semibold mb-2 ${getTextColor()}`}>
                    Community Logo
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-4 ${getInputBg()} ${getBorderColor()} hover:border-purple-500 transition-colors`}>
                    {logoPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-32 h-32 rounded-full object-cover border-2 border-purple-500 mb-2"
                        />
                        <div className="flex gap-2">
                          <label
                            className={`px-3 py-1 ${getGradientBg()} text-white rounded-lg text-xs cursor-pointer hover:opacity-90 transition-opacity`}>
                            Change
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              disabled={isSaving}
                            />
                          </label>
                          <button
                            onClick={removeLogo}
                            className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                            disabled={isSaving}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer py-4">
                        <RiImageLine
                          className={`w-12 h-12 ${getSecondaryTextColor()} mb-2`}
                        />
                        <span className={`text-sm ${getSecondaryTextColor()}`}>
                          Click to upload logo
                        </span>
                        <span className={`text-xs ${getSecondaryTextColor()}`}>
                          PNG, JPG, GIF (max 5MB)
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={isSaving}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    className={`block font-semibold mb-2 ${getTextColor()}`}>
                    Community Banner
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-4 ${getInputBg()} ${getBorderColor()} hover:border-purple-500 transition-colors`}>
                    {bannerPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={bannerPreview}
                          alt="Banner preview"
                          className="w-full h-24 object-cover rounded-lg border-2 border-purple-500 mb-2"
                        />
                        <div className="flex gap-2">
                          <label
                            className={`px-3 py-1 ${getGradientBg()} text-white rounded-lg text-xs cursor-pointer hover:opacity-90 transition-opacity`}>
                            Change
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleBannerUpload}
                              disabled={isSaving}
                            />
                          </label>
                          <button
                            onClick={removeBanner}
                            className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                            disabled={isSaving}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer py-4">
                        <RiUploadLine
                          className={`w-12 h-12 ${getSecondaryTextColor()} mb-2`}
                        />
                        <span className={`text-sm ${getSecondaryTextColor()}`}>
                          Click to upload banner
                        </span>
                        <span className={`text-xs ${getSecondaryTextColor()}`}>
                          PNG, JPG, GIF (max 10MB)
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          disabled={isSaving}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-6">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className={`${getGradientBg()} h-2.5 rounded-full transition-all duration-300`}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className={`text-sm ${getSecondaryTextColor()} mt-1`}>
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              <div className="mt-8 pt-6 border-t ${getBorderColor()} flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !isAuthorized}
                  className={`px-8 py-3 ${getGradientBg()} text-white rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 ${
                    isSaving || !isAuthorized
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-105 hover:shadow-lg"
                  }`}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <RiSaveLine className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>

            <div
              className={`mt-6 ${getCardBg()} rounded-2xl p-6 border ${getBorderColor()} shadow-lg`}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <RiCalendarLine className={getSecondaryTextColor()} />
                  <span className={getSecondaryTextColor()}>
                    Created:{" "}
                    {community?.createdAt
                      ? new Date(
                          community.createdAt.seconds * 1000,
                        ).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-red-500/30">
                <h3
                  className={`text-lg font-semibold text-red-500 mb-3 flex items-center gap-2`}>
                  <RiAlertLine className="w-5 h-5" />
                  Danger Zone
                </h3>
                <p className={`text-sm ${getSecondaryTextColor()} mb-4`}>
                  Once you delete this community, all posts, comments, and data
                  will be permanently removed. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className={`px-6 py-3 ${getDangerBg()} text-white rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-105`}>
                  <RiDeleteBinLine className="w-5 h-5" />
                  Delete Community
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div
            className={`${getCardBg()} rounded-2xl p-6 max-w-md w-full border ${getBorderColor()} shadow-2xl`}>
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className={`text-2xl font-bold ${getTextColor()} mb-2`}>
                Are you sure?
              </h2>
              <p className={`${getSecondaryTextColor()} mb-6`}>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-red-500">
                  r/{community?.name}
                </span>
                ?<br />
                This will permanently delete all posts, comments, and data. This
                action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`px-6 py-2.5 ${getCardBg()} border ${getBorderColor()} ${getTextColor()} rounded-xl font-medium hover:${getHoverColor()} transition-all duration-300`}
                  disabled={isDeleting}>
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`px-6 py-2.5 ${getDangerBg()} text-white rounded-xl font-medium flex items-center gap-2 transition-all duration-300 ${
                    isDeleting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-105"
                  }`}>
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <RiDeleteBinLine className="w-4 h-4" />
                      Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <RightSideBar themeMode={themeMode} />
    </div>
  );
};

export default CommunitySettings;
