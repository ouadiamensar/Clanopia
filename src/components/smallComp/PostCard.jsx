/* eslint-disable no-unused-vars */
import { Link } from "react-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  FaRegHeart,
  FaHeart,
  FaRegCommentDots,
  FaRegShareSquare,
  FaTimes,
  FaBookmark,
  FaRegBookmark,
  FaTrash,
  FaEllipsisV,
} from "react-icons/fa";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  arrayRemove,
  arrayUnion,
  doc,
  updateDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { FcLike } from "react-icons/fc";

const PostCard = ({ post, themeMode, onPostDeleted }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const currentUser = auth.currentUser;
  const isPostOwner = currentUser && post.createdBy === currentUser.uid;

  useEffect(() => {
    console.log("Current User UID:", currentUser?.uid);
    console.log("Post User ID:", post.userId);
    console.log("Is Post Owner:", isPostOwner);
    console.log("Post Data:", post);
  }, [currentUser, post, isPostOwner]);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!currentUser || !post?.id) return;

      try {
        const saveRef = doc(
          db,
          "users",
          currentUser.uid,
          "saves",
          "NormalPosts",
          "data",
          post.id
        );
        const saveDoc = await getDoc(saveRef);
        setIsSaved(saveDoc.exists());
      } catch (error) {
        console.error("❌ Error checking save status:", error);
      }
    };

    checkIfSaved();
  }, [currentUser, post?.id]);

  const handleSavePost = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!currentUser) {
      alert("Please login to save posts");
      return;
    }

    if (!post?.id) {
      console.error("❌ Post ID is missing");
      return;
    }

    try {
      const saveRef = doc(
        db,
        "users",
        currentUser.uid,
        "saves",
        "NormalPosts",
        "data",
        post.id
      );

      const saveDoc = await getDoc(saveRef);

      if (saveDoc.exists()) {
        await deleteDoc(saveRef);
        setIsSaved(false);
        console.log("✅ Post unsaved successfully");
      } else {
        const postData = {
          id: post.id,
          userId: post.userId || post.createdBy,
          createdBy: post.createdBy,
          creatorName: post.creatorName,
          profileImage: post.profileImage || null,
          projectName: post.projectName || null,
          content: post.content || "",
          images: post.images || [],
          tags: post.tags || [],
          type: post.type || "normal",
          createdAt: post.createdAt || new Date(),
          likes: post.likes || [],
          savedAt: new Date(),
        };

        await setDoc(saveRef, postData);
        setIsSaved(true);
        console.log("✅ Post saved successfully at:", saveRef.path);
      }
    } catch (error) {
      console.error("❌ Error saving/unsaving post:", error);
      alert(`Failed to ${isSaved ? 'unsave' : 'save'} post: ${error.message}`);
    }
  };

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);

    const fetchCommentCount = async () => {
      try {
        const commentsRef = collection(
          db,
          "users",
          post.userId,
          "profile",
          "data",
          "posts",
          post.id,
          "comments",
        );
        const querySnapshot = await getDocs(commentsRef);
        setCommentCount(querySnapshot.size);
      } catch (error) {
        console.error("Error fetching comment count:", error);
        try {
          const metadataRef = doc(
            db,
            "users",
            post.userId,
            "profile",
            "data",
            "posts",
            post.id,
            "comments",
            "metadata",
          );
          const metadataDoc = await getDoc(metadataRef);
          if (metadataDoc.exists()) {
            setCommentCount(metadataDoc.data().count || 0);
          }
        } catch (fallbackError) {
          console.error("Fallback method also failed:", fallbackError);
        }
      }
    };

    fetchCommentCount();
  }, [post]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? post.images.length - 1 : prev - 1));
  }, [post.images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === post.images.length - 1 ? 0 : prev + 1));
  }, [post.images.length]);

  const openFullscreen = (mediaUrl, isVideo, index) => {
    setCurrentIndex(index);
    setFullscreenMedia({ url: mediaUrl, isVideo, index });
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  };

  const closeFullscreen = useCallback(() => {
    setFullscreenMedia(null);
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && fullscreenMedia) {
        closeFullscreen();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [fullscreenMedia, closeFullscreen]);

  function timeSince(pastDate) {
    const past = pastDate?.toDate ? pastDate.toDate() : new Date(pastDate);
    const now = new Date();
    const seconds = Math.floor((now - past) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    };
    let counter;
    for (const unit in intervals) {
      counter = Math.floor(seconds / intervals[unit]);
      if (counter > 0) {
        return `${counter} ${unit}${counter === 1 ? "" : "s"} ago`;
      }
    }
    return "Just now";
  }

  const mediaUrl = post.images?.[currentIndex];
  const isVideo = mediaUrl ? /\.(mp4|webm|ogg)(\?.*)?$/i.test(mediaUrl) : false;
  const [likes, setLikes] = useState(post.likes || []);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLikes(post.likes || []);
    setLiked(post.likes?.includes(auth.currentUser?.uid) || false);
  }, [post.likes]);

  const handleLike = async () => {
    if (!auth.currentUser || busy) return;
    setBusy(true);
    const userId = auth.currentUser.uid;
    const postRef = doc(
      db,
      "users",
      post.userId,
      "profile",
      "data",
      "posts",
      post.id,
    );
    const optimisticLikes = liked
      ? likes.filter((id) => id !== userId)
      : [...likes, userId];
    setLikes(optimisticLikes);
    setLiked(!liked);
    try {
      await updateDoc(postRef, {
        likes: liked ? arrayRemove(userId) : arrayUnion(userId),
      });
    } catch (err) {
      setLikes(likes);
      setLiked(liked);
      console.error("Error updating likes:", err);
    } finally {
      setBusy(false);
    }
  };

  const getPostUrl = () => {
    return `${window.location.origin}/post/${post.createdBy}/${post.id}`;
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      getPostUrl(),
    )}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareOnWhatsApp = () => {
    const text = `Check out this post: ${post.projectName || "Untitled"}`;
    const url = `https://wa.me/?text=${encodeURIComponent(
      text + " " + getPostUrl(),
    )}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareOnTwitter = () => {
    const text = `Check out this post: ${post.projectName || "Untitled"}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text,
    )}&url=${encodeURIComponent(getPostUrl())}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      getPostUrl(),
    )}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getPostUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      const textArea = document.createElement("textarea");
      textArea.value = getPostUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleShareOptions = () => {
    setShowShareOptions(!showShareOptions);
  };

  const handleDeletePost = async () => {
    if (!isPostOwner || isDeleting) return;

    setIsDeleting(true);
    try {
      const postRef = doc(
        db,
        "users",
        post.createdBy,
        "profile",
        "data",
        "posts",
        post.id,
      );
      await deleteDoc(postRef);

      try {
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        for (const userDoc of usersSnapshot.docs) {
          try {
            const saveRef = doc(
              db,
              "users",
              userDoc.id,
              "saves",
              "NormalPosts",
              "data",
              post.id
            );
            const saveSnap = await getDoc(saveRef);
            if (saveSnap.exists()) {
              await deleteDoc(saveRef);
              console.log(`✅ Deleted saved post for user: ${userDoc.id}`);
            }
          } catch (saveError) {
            // Ignore errors for users who don't have this post saved
          }
        }
      } catch (savesError) {
        console.warn("⚠️ Could not delete saved posts:", savesError);
      }

      closeFullscreen();
      setShowDeleteConfirm(false);
      setShowMenu(false);

      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-gray-900");
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-gray-800";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-700" : "text-gray-300";
  const getMutedTextColor = () =>
    themeMode === "light" ? "text-gray-500" : "text-gray-400";
  const getTagBg = () =>
    themeMode === "light"
      ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-cyan-700"
      : "bg-gradient-to-r from-blue-900/30 to-cyan-900/30 text-cyan-300";

  const getModalBg = () => (themeMode === "light" ? "bg-white" : "bg-gray-900");
  const getModalOverlayBg = () =>
    themeMode === "light"
      ? "bg-black/50 backdrop-blur-sm"
      : "bg-black/80 backdrop-blur-sm";

  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <>
      {fullscreenMedia && (
        <div
          className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4"
          onClick={closeFullscreen}>
          <div className="relative w-full max-w-6xl h-[90vh] flex items-center justify-center">
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl transition-colors z-10">
              <FaTimes />
            </button>

            {fullscreenMedia.isVideo ? (
              <video
                controls
                autoPlay
                className="w-full h-full object-contain"
                src={fullscreenMedia.url}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={fullscreenMedia.url}
                alt="Fullscreen content"
                className="w-full h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {post.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                    const prevIndex =
                      currentIndex === 0
                        ? post.images.length - 1
                        : currentIndex - 1;
                    setFullscreenMedia({
                      url: post.images[prevIndex],
                      isVideo: /\.(mp4|webm|ogg)(\?.*)?$/i.test(
                        post.images[prevIndex],
                      ),
                      index: prevIndex,
                    });
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all">
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                    const nextIndex =
                      currentIndex === post.images.length - 1
                        ? 0
                        : currentIndex + 1;
                    setFullscreenMedia({
                      url: post.images[nextIndex],
                      isVideo: /\.(mp4|webm|ogg)(\?.*)?$/i.test(
                        post.images[nextIndex],
                      ),
                      index: nextIndex,
                    });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all">
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              {currentIndex + 1} / {post.images.length}
            </div>
          </div>
        </div>
      )}

      {showShareOptions && (
        <div
          className={`fixed inset-0 ${getModalOverlayBg()} z-50 flex items-center justify-center p-4`}
          onClick={toggleShareOptions}>
          <div
            className={`${getModalBg()} rounded-2xl shadow-2xl max-w-md w-full p-6`}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3
                className={`text-xl font-bold ${themeMode === "light" ? "text-gray-900" : "text-white"}`}>
                Share Post
              </h3>
              <button
                onClick={toggleShareOptions}
                className={`${themeMode === "light" ? "text-gray-400 hover:text-gray-600" : "text-gray-500 hover:text-gray-300"} transition-colors`}>
                <FaTimes size={22} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                {
                  icon: "facebook",
                  label: "Facebook",
                  onClick: shareOnFacebook,
                  color: "bg-blue-600",
                },
                {
                  icon: "whatsapp",
                  label: "WhatsApp",
                  onClick: shareOnWhatsApp,
                  color: "bg-green-500",
                },
                {
                  icon: "twitter",
                  label: "Twitter",
                  onClick: shareOnTwitter,
                  color: "bg-black",
                },
                {
                  icon: "linkedin",
                  label: "LinkedIn",
                  onClick: shareOnLinkedIn,
                  color: "bg-blue-700",
                },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="flex flex-col items-center gap-2 group">
                  <div
                    className={`w-14 h-14 rounded-full ${item.color} flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}>
                    {item.icon === "facebook" && (
                      <svg
                        className="w-7 h-7 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    )}
                    {item.icon === "whatsapp" && (
                      <svg
                        className="w-7 h-7 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.864 3.488" />
                      </svg>
                    )}
                    {item.icon === "twitter" && (
                      <svg
                        className="w-7 h-7 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    )}
                    {item.icon === "linkedin" && (
                      <svg
                        className="w-7 h-7 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-xs ${themeMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={copyToClipboard}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                themeMode === "light"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              } shadow-lg hover:shadow-xl`}>
              {copied ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      )}

      <div
        className={`w-full ${getCardBg()} rounded-2xl shadow-xl overflow-hidden border ${getBorderColor()} hover:shadow-2xl transition-all duration-300 mb-6`}>
        <div className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 p-5">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={post.profileImage || "/default-user.png"}
                alt={post.creatorName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/80 shadow-lg"
              />
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">
                  {post.creatorName}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/80">
                    {timeSince(post.createdAt)}
                  </span>
                  {post.type && (
                    <span className="bg-white/20 text-white text-xs font-medium px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                      {post.type.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isPostOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-full transition-all duration-200 hover:scale-110"
                  title="Post options">
                  <FaEllipsisV className="text-lg" />
                </button>

                {showMenu && (
                  <div
                    className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg overflow-hidden border ${getBorderColor()} ${getCardBg()} z-50`}>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors">
                      <FaTrash className="text-red-500" />
                      <span>Delete Post</span>
                    </button>
                  </div>
                )}

                {showDeleteConfirm && (
                  <div
                    className={`absolute right-0 mt-2 w-60 p-3 rounded-xl shadow-lg overflow-hidden border ${getBorderColor()} ${getCardBg()} z-50`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <FaTrash className="text-red-500 dark:text-red-400 text-lg" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`font-semibold ${getTextColor()} text-sm mb-1`}>
                          Delete Post?
                        </h4>
                        <p
                          className={`${getSecondaryTextColor()} text-xs mb-3`}>
                          This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                              themeMode === "light"
                                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                            }`}
                            disabled={isDeleting}>
                            Cancel
                          </button>
                          <button
                            onClick={handleDeletePost}
                            className="px-3 py-1.5 text-xs rounded-lg font-medium transition-all bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 flex items-center gap-1.5"
                            disabled={isDeleting}>
                            <FaTrash className="w-3 h-3" />
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-5">
          {post.projectName && (
            <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {post.projectName}
            </h2>
          )}

          <p
            className={`${getSecondaryTextColor()} whitespace-pre-line mb-4 leading-relaxed`}>
            {showFullDescription || !post.content || post.content.length <= 150
              ? post.content
              : truncateText(post.content, 150)}
            {post.content && post.content.length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-blue-600 dark:text-blue-400 font-medium ml-2 hover:underline">
                {showFullDescription ? "See less" : "See more"}
              </button>
            )}
          </p>

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 5).map((tag, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getTagBg()} shadow-sm`}>
                  #{tag}
                </span>
              ))}
              {post.tags.length > 5 && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getTagBg()} shadow-sm`}>
                  +{post.tags.length - 5} more
                </span>
              )}
            </div>
          )}

          {mediaUrl && (
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-inner">
              <div
                className="relative cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  openFullscreen(mediaUrl, isVideo, currentIndex);
                }}>
                {isVideo ? (
                  <video
                    key={currentIndex}
                    controls
                    className="w-full max-h-[500px] object-contain"
                    src={mediaUrl}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <img
                    key={currentIndex}
                    src={mediaUrl}
                    alt={`media-${currentIndex}`}
                    className="w-full max-h-[500px] object-contain hover:scale-[1.02] transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default-media.png";
                    }}
                  />
                )}
              </div>
              {post.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePrev();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 backdrop-blur-sm p-2.5 rounded-full shadow-lg transition-all duration-200">
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 backdrop-blur-sm p-2.5 rounded-full shadow-lg transition-all duration-200">
                    <ChevronRight size={20} />
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium">
                    {currentIndex + 1} / {post.images.length}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className={`px-5 py-3 border-t ${getBorderColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                {liked ? (
                  <FcLike className="text-2xl animate-pop" />
                ) : (
                  <FaRegHeart className="text-2xl text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400 transition-colors" />
                )}
                <span
                  className={`font-medium ${liked ? "text-blue-600 dark:text-blue-400" : getSecondaryTextColor()}`}>
                  {likes.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <Link to={`/post/${post.createdBy}/${post.id}`}>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                  <FaRegCommentDots className="text-xl text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400 transition-colors" />
                  <span className={getSecondaryTextColor()}>
                    {commentCount}
                  </span>
                </button>
              </Link>

              <button
                onClick={toggleShareOptions}
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                <FaRegShareSquare className="text-xl text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400 transition-colors" />
                <span className={getSecondaryTextColor()}>Share</span>
              </button>

              <button
                onClick={handleSavePost}
                className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title={isSaved ? "Unsave post" : "Save post"}>
                {isSaved ? (
                  <FaBookmark className="text-2xl text-blue-600 dark:text-blue-400" />
                ) : (
                  <FaRegBookmark className="text-2xl text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostCard;