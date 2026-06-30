import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { FaTrash, FaEllipsisV } from "react-icons/fa";
import { AnimatePresence } from "framer-motion";

async function joinCommunity(communityId, category) {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("User not authenticated");
      return false;
    }

    console.log("🟢 Joining community:", communityId);
    console.log("📌 User ID:", userId);

    const communityRef = doc(db, "communities", category, "items", communityId);
    const communityDoc = await getDoc(communityRef);

    if (!communityDoc.exists()) {
      console.error("❌ Community not found!");
      return false;
    }

    const communityData = communityDoc.data();

    await updateDoc(communityRef, {
      members: arrayUnion(userId),
    });
    console.log("✅ Added to community members");

    const userCommunityRef = doc(
      db,
      "users",
      userId,
      "communities",
      communityId,
    );

    console.log("📌 User community ref path:", userCommunityRef.path);

    await setDoc(userCommunityRef, {
      communityId: communityId,
      communityName: communityData.name || "Unknown",
      category: category,
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      communityData: {
        name: communityData.name || "Unknown",
        description: communityData.description || "",
        logoURL: communityData.logoURL || null,
        bannerURL: communityData.bannerURL || null,
        membersCount: communityData.members?.length || 0,
      },
    });
    console.log("✅ Saved community data to user profile");

    return true;
  } catch (error) {
    console.error("❌ Error joining community: ", error);
    return false;
  }
}

async function leaveCommunity(communityId, category) {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("User not authenticated");
      return false;
    }

    console.log("🔴 Leaving community:", communityId);

    const communityRef = doc(db, "communities", category, "items", communityId);
    await updateDoc(communityRef, {
      members: arrayRemove(userId),
    });
    console.log("✅ Removed from community members");

    const userCommunityRef = doc(
      db,
      "users",
      userId,
      "communities",
      communityId,
    );
    await deleteDoc(userCommunityRef);
    console.log("✅ Deleted user community data");

    return true;
  } catch (error) {
    console.error("❌ Error leaving community: ", error);
    return false;
  }
}

const CommunityCard = ({
  id,
  category,
  logo,
  name,
  MembersNum,
  shortDescription,
  themeMode = "dark",
  isOwner = false,
  onPostDeleted,
}) => {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-200";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-500" : "text-gray-400";
  const getCategoryBg = () =>
    themeMode === "light"
      ? "bg-gray-100 text-gray-600"
      : "bg-[#29292a] text-gray-400";
  const getMembersBg = () =>
    themeMode === "light"
      ? "bg-cyan-100 text-cyan-700"
      : "bg-cyan-900/70 text-cyan-200";
  const getLogoBg = () =>
    themeMode === "light" ? "bg-gray-200" : "bg-[#29292a]";
  const getButtonLoadingBg = () =>
    themeMode === "light"
      ? "bg-gray-100 text-gray-400"
      : "bg-[#252527] text-gray-400";
  const getMenuBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;

    const userCommunityRef = doc(db, "users", userId, "communities", id);

    console.log("📌 Checking membership at:", userCommunityRef.path);

    const unsubscribe = onSnapshot(
      userCommunityRef,
      (docSnapshot) => {
        setIsMember(docSnapshot.exists());
        setLoading(false);
        console.log("📌 Membership status:", docSnapshot.exists());
      },
      (error) => {
        console.error("Error listening to membership:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [id]);

  const handleActionClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!auth.currentUser) {
      alert(t("communityCard.loginRequired"));
      return;
    }

    setActionLoading(true);
    try {
      if (isMember) {
        const success = await leaveCommunity(id, category);
        if (success) {
          setIsMember(false);
        } else {
          alert(t("communityCard.leaveError"));
        }
      } else {
        const success = await joinCommunity(id, category);
        if (success) {
          setIsMember(true);
        } else {
          alert(t("communityCard.joinError"));
        }
      }
    } catch (error) {
      console.error("Error in community action:", error);
      alert(t("communityCard.actionError"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!isOwner || isDeleting) return;

    setIsDeleting(true);
    try {
      const postRef = doc(db, "communities", category, "items", id);
      await deleteDoc(postRef);

      if (auth.currentUser) {
        try {
          const userCommunityRef = doc(
            db,
            "users",
            auth.currentUser.uid,
            "communities",
            id,
          );
          await deleteDoc(userCommunityRef);
        } catch (userError) {
          console.warn(
            "⚠️ Could not delete from user's communities:",
            userError,
          );
        }
      }

      setShowMenu(false);
      setShowDeleteConfirm(false);

      if (onPostDeleted) {
        onPostDeleted(id);
      }

      console.log("✅ Community card deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting community card:", error);
      alert("Failed to delete community. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const docRef = doc(db, "communities", category, "items", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          if (auth.currentUser) {
            const isCreator = docSnap.data().createdBy === auth.currentUser.uid;
            setIsCreator(isCreator);
          }
        }
      } catch (error) {
        console.error("Error fetching Community:", error);
      }
    };

    if (id) {
      fetchCommunity();
    }
  }, [id, category]);

  if (languageLoading) {
    return (
      <div
        className={`w-full max-w-md mx-auto ${getCardBg()} rounded-xl border ${getBorderColor()} p-3 animate-pulse`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full ${getLogoBg()}`}></div>
          <div className="flex-1 space-y-2">
            <div className={`h-4 ${getLogoBg()} rounded w-3/4`}></div>
            <div className={`h-3 ${getLogoBg()} rounded w-1/2`}></div>
          </div>
          <div className={`w-12 h-6 ${getLogoBg()} rounded-full`}></div>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num;
  };

  return (
    <>
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}>
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`${getCardBg()} rounded-2xl shadow-2xl max-w-sm w-full p-6 border ${getBorderColor()}`}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <FaTrash className="text-red-500 dark:text-red-400 text-xl" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold ${getTextColor()} text-lg mb-1`}>
                    Delete Community?
                  </h4>
                  <p className={`${getSecondaryTextColor()} text-sm mb-4`}>
                    Are you sure you want to delete this community? This action
                    cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                        themeMode === "light"
                          ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      }`}
                      disabled={isDeleting}>
                      Cancel
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="flex-1 px-4 py-2 rounded-xl font-medium transition-all bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 flex items-center justify-center gap-2"
                      disabled={isDeleting}>
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FaTrash className="w-4 h-4" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link
        to={`/community/${category}/${id}/${name}`}
        className="block w-full max-w-md mx-auto">
        <div
          className={`w-full max-w-md ${getCardBg()} rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border ${getBorderColor()} flex items-center gap-3 cursor-pointer group p-3 animate-fade-in relative`}>
          <div className="flex-shrink-0">
            <img
              src={logo || "/default-community.png"}
              alt={name}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-cyan-500 object-cover ${getLogoBg()} group-hover:scale-105 transition-transform duration-200`}
              onError={(e) => {
                e.target.src = "/default-community.png";
              }}
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h2
              className={`text-sm md:text-base font-bold truncate ${getTextColor()}`}>
              {name}
            </h2>

            <div className="flex items-center mt-1 flex-wrap gap-1">
              <span
                className={`text-xs rounded-full px-2 py-0.5 font-semibold inline-block ${getMembersBg()}`}>
                {formatNumber(MembersNum || 0)} {t("communityCard.members")}
              </span>
              <span
                className={`text-xs rounded-full px-2 py-0.5 font-semibold hidden sm:inline-block ${getCategoryBg()}`}>
                {category}
              </span>
            </div>

            <p
              className={`text-xs mt-1 line-clamp-2 leading-tight ${getSecondaryTextColor()}`}>
              {shortDescription}
            </p>
          </div>
          {!isCreator && (
            <div className="flex-shrink-0 ml-auto flex items-center gap-1">
              {loading ? (
                <div
                  className={`px-3 py-1.5 rounded-full font-semibold text-xs ${getButtonLoadingBg()}`}>
                  ...
                </div>
              ) : actionLoading ? (
                <div
                  className={`px-3 py-1.5 rounded-full font-semibold text-xs animate-pulse ${getButtonLoadingBg()}`}>
                  ...
                </div>
              ) : isMember ? (
                <button
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold text-xs shadow transition-colors duration-200 transform hover:scale-105"
                  onClick={handleActionClick}
                  disabled={actionLoading}>
                  {t("communityCard.leave")}
                </button>
              ) : (
                <button
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full font-semibold text-xs shadow transition-colors duration-200 transform hover:scale-105"
                  onClick={handleActionClick}
                  disabled={actionLoading}>
                  {t("communityCard.join")}
                </button>
              )}

              {/* Menu Button - Only show if user is owner */}
              {isOwner && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <FaEllipsisV className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg overflow-hidden border ${getBorderColor()} ${getMenuBg()} z-50`}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMenu(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors">
                          <FaTrash className="text-red-500" />
                          <span>Delete Community</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </>
  );
};

export default CommunityCard;
