/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { Link, useParams } from "react-router";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaRegHeart,
  FaHeart,
  FaRegCommentDots,
  FaRegShareSquare,
  FaTimes,
  FaFacebook,
  FaWhatsapp,
  FaTwitter,
  FaLinkedin,
  FaLink,
  FaCheck,
  FaPlay,
  FaBookmark,
  FaRegBookmark,
  FaEllipsisH,
  FaTrash,
} from "react-icons/fa";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { motion, AnimatePresence } from "framer-motion";

const CommunityPostCard = ({ post, themeMode, onPostDeleted }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [likes, setLikes] = useState([]);
  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const timeSince = useCallback((date) => {
    const past = date?.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const seconds = Math.floor((now - past) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && post?.userId) {
      setIsOwner(currentUser.uid === post.userId);
    } else {
      setIsOwner(false);
    }
  }, [post?.userId]);

  useEffect(() => {
    const checkIfSaved = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || !post?.id) return;

      try {
        const saveRef = doc(
          db,
          "users",
          currentUser.uid,
          "saves",
          "CommunitiesPosts",
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
  }, [post?.id]);

  const mediaUrl = post.images?.[currentIndex] || null;
  const isVideo = mediaUrl
    ? /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(mediaUrl)
    : false;

  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const handleSavePost = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    const currentUser = auth.currentUser;
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
        "CommunitiesPosts",
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
          userId: post.userId,
          creatorName: post.creatorName,
          profileImage: post.profileImage || null,
          projectName: post.projectName || null,
          content: post.content || "",
          images: post.images || [],
          tags: post.tags || [],
          type: post.type || "normal",
          createdAt: post.createdAt || new Date(),
          communityData: post.communityData || null,
          communityId: post.communityId || null,
          category: post.category || null,
          communityName: post.communityName || null,
          savedAt: new Date(),
        };

        await setDoc(saveRef, postData);
        setIsSaved(true);
      }
    } catch (error) {
      console.error("❌ Error saving/unsaving post:", error);
    }
  };

  useEffect(() => {
    if (!post?.id || !post?.userId) {
      return;
    }

    const commentsRef = collection(
      db,
      "users",
      post.userId,
      "posts",
      post.id,
      "comments",
    );

    const unsubscribe = onSnapshot(
      commentsRef,
      (snapshot) => {
        const count = snapshot.size;
        setCommentCount(count);
      },
      (error) => {
        console.error("❌ Error fetching comment count:", error);
        tryAlternativeCommentPath();
      },
    );

    return () => unsubscribe();
  }, [post?.id, post?.userId]);

  const tryAlternativeCommentPath = useCallback(() => {
    const category = post?.communityData?.category || post?.category;
    const communityId = post?.communityId || post?.communityData?.id;
    const postId = post?.id;

    if (category && communityId && postId) {
      const altCommentsRef = collection(
        db,
        "communities",
        category,
        "items",
        communityId,
        "posts",
        postId,
        "comments",
      );

      const unsubscribe = onSnapshot(
        altCommentsRef,
        (snapshot) => {
          const count = snapshot.size;
          setCommentCount(count);
        },
        (error) => {
          console.error(
            "❌ Error fetching comments from alternative path:",
            error,
          );
        },
      );

      return () => unsubscribe();
    }
  }, [post]);

  const getPostRef = useCallback(() => {
    const category = post?.communityData?.category || post?.category;
    const communityId = post?.communityId || post?.communityData?.id;
    const postId = post?.id;

    if (!category || !communityId || !postId) {
      console.error("❌ Missing required fields for post reference:", {
        category,
        communityId,
        postId,
        post,
      });
      return null;
    }

    return doc(
      db,
      "communities",
      category,
      "items",
      communityId,
      "posts",
      postId,
    );
  }, [post]);

  useEffect(() => {
    const postRef = getPostRef();
    if (!postRef) return;

    const unsubscribe = onSnapshot(
      postRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const likesArray = data.likes || [];
          setLikes(likesArray);
          setLikeCount(likesArray.length);
          const currentUser = auth.currentUser;
          if (currentUser) {
            const isLiked = likesArray.includes(currentUser.uid);
            setLiked(isLiked);
          }
        } else {
          initializePostDocument(postRef);
        }
      },
      (error) => {
        console.error("❌ Error fetching likes:", error);
      },
    );

    return () => unsubscribe();
  }, [getPostRef]);

  const initializePostDocument = async (postRef) => {
    try {
      await setDoc(
        postRef,
        {
          likes: [],
          content: post.content || "",
          createdAt: new Date(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("❌ Error creating post document:", error);
    }
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!auth.currentUser || isLiking) return;

    const userId = auth.currentUser.uid;
    const postRef = getPostRef();
    if (!postRef) return;

    setIsLiking(true);

    try {
      const docSnapshot = await getDoc(postRef);
      let currentLikes = [];
      if (docSnapshot.exists()) {
        currentLikes = docSnapshot.data().likes || [];
      } else {
        await setDoc(postRef, { likes: [], createdAt: new Date() });
        currentLikes = [];
      }

      const isCurrentlyLiked = currentLikes.includes(userId);
      let newLikes;

      if (isCurrentlyLiked) {
        newLikes = currentLikes.filter((id) => id !== userId);
      } else {
        newLikes = [...currentLikes, userId];
      }

      await updateDoc(postRef, {
        likes: newLikes,
      });

      setLikes(newLikes);
      setLikeCount(newLikes.length);
      setLiked(!isCurrentlyLiked);
    } catch (err) {
      console.error("❌ Error updating likes:", err);
      try {
        const freshDoc = await getDoc(postRef);
        if (freshDoc.exists()) {
          const freshLikes = freshDoc.data().likes || [];
          setLikes(freshLikes);
          setLikeCount(freshLikes.length);
          setLiked(freshLikes.includes(auth.currentUser?.uid) || false);
        }
      } catch (rollbackError) {
        console.error("❌ Error rolling back:", rollbackError);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const forceDeletePost = async (postId) => {
    try {
      console.log("🔨 Force deleting post:", postId);

      const userId = post?.userId;
      const category = post?.communityData?.category || post?.category;
      const communityId = post?.communityId || post?.communityData?.id;

      const paths = [];

      if (category && communityId && postId) {
        paths.push(
          `communities/${category}/items/${communityId}/posts/${postId}`,
          `communities/${category}/posts/${postId}`,
        );
      }

      if (category && postId) {
        paths.push(`communities/${category}/posts/${postId}`);
      }

      if (userId && postId) {
        paths.push(`users/${userId}/posts/${postId}`);
      }

      if (postId) {
        paths.push(
          `posts/${postId}`,
          `all_posts/${postId}`,
          `community_posts/${postId}`,
        );
      }

      const results = [];

      for (const path of paths) {
        try {
          const ref = doc(db, path);
          const docSnap = await getDoc(ref);

          if (docSnap.exists()) {
            await deleteDoc(ref);
            console.log(`✅ Deleted: ${path}`);
            results.push({ path, deleted: true });
          } else {
            console.log(`ℹ️ Not found: ${path}`);
            results.push({ path, deleted: false, exists: false });
          }
        } catch (err) {
          console.warn(`⚠️ Error deleting ${path}:`, err);
          results.push({ path, deleted: false, error: err.message });
        }
      }

      console.log("📊 Delete results:", results);
      return results;
    } catch (error) {
      console.error("❌ Force delete failed:", error);
      throw error;
    }
  };

  const handleDeletePost = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!isOwner || isDeleting) return;

    setIsDeleting(true);
    try {
      
      const postId = post?.id;
      const userId = post?.userId;
      const category = post?.communityData?.category || post?.category;
      const communityId = post?.communityId || post?.communityData?.id;

      console.log("🗑️ Attempting to delete post:", {
        postId,
        userId,
        category,
        communityId,
        post: post,
      });

      if (category && communityId && postId) {
        const communityPostRef = doc(
          db,
          "communities",
          category,
          "items",
          communityId,
          "posts",
          postId,
        );

        const docSnap = await getDoc(communityPostRef);
        if (docSnap.exists()) {
          console.log("📄 Document found at:", communityPostRef.path);
          console.log("📄 Document data:", docSnap.data());

          await deleteDoc(communityPostRef);
          console.log("✅ Deleted from community path:", communityPostRef.path);
        } else {
          console.warn("⚠️ Document not found at:", communityPostRef.path);

          const altPaths = [
            `communities/${category}/posts/${postId}`,
            `communities/${category}/items/${communityId}/posts/${postId}`,
            `communities/posts/${postId}`,
            `posts/${postId}`,
          ];

          for (const altPath of altPaths) {
            try {
              const altRef = doc(db, altPath);
              const altSnap = await getDoc(altRef);
              if (altSnap.exists()) {
                await deleteDoc(altRef);
                console.log(`✅ Deleted from alternative path: ${altPath}`);
                break;
              }
            } catch (err) {
              console.warn(`⚠️ Error checking ${altPath}:`, err);
            }
          }
        }
      }

      if (userId && postId) {
        try {
          const userPostRef = doc(db, "users", userId, "posts", postId);
          const userSnap = await getDoc(userPostRef);
          if (userSnap.exists()) {
            await deleteDoc(userPostRef);
            console.log("✅ Deleted from user path:", userPostRef.path);
          } else {
            console.log("ℹ️ User post not found");
          }
        } catch (userPostError) {
          console.warn("⚠️ Could not delete from user's posts:", userPostError);
        }
      }

      // Delete saved posts for all users
      try {
        // Find all users who saved this post
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
              postId
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

      if (userId && postId) {
        try {
          const commentsRef = collection(
            db,
            "users",
            userId,
            "posts",
            postId,
            "comments",
          );

          const commentsSnapshot = await getDocs(commentsRef);
          if (!commentsSnapshot.empty) {
            const deletePromises = commentsSnapshot.docs.map((doc) =>
              deleteDoc(doc.ref),
            );
            await Promise.all(deletePromises);
            console.log(`✅ Deleted ${commentsSnapshot.docs.length} comments`);
          } else {
            console.log("ℹ️ No comments found");
          }
        } catch (commentsError) {
          console.warn("⚠️ Could not delete comments:", commentsError);
        }
      }

      if (category && communityId && postId) {
        try {
          const likesCollectionRef = collection(
            db,
            "communities",
            category,
            "items",
            communityId,
            "posts",
            postId,
            "Likes",
          );

          const likesSnapshot = await getDocs(likesCollectionRef);
          if (!likesSnapshot.empty) {
            const deletePromises = likesSnapshot.docs.map((doc) =>
              deleteDoc(doc.ref),
            );
            await Promise.all(deletePromises);
            console.log(
              `✅ Deleted ${likesSnapshot.docs.length} likes documents`,
            );
          } else {
            console.log("ℹ️ No likes found");
          }
        } catch (likesError) {
          console.warn("⚠️ Could not delete likes:", likesError);
        }
      }

      if (category && communityId && postId) {
        try {
          const finalRef = doc(
            db,
            "communities",
            category,
            "items",
            communityId,
            "posts",
            postId,
          );

          await runTransaction(db, async (transaction) => {
            const docSnapshot = await transaction.get(finalRef);
            if (docSnapshot.exists()) {
              transaction.delete(finalRef);
              console.log(
                "✅ Final deletion using transaction:",
                finalRef.path,
              );
            } else {
              console.log("ℹ️ Document already deleted or not found");
            }
          });
        } catch (transactionError) {
          console.warn("⚠️ Transaction delete error:", transactionError);
        }
      }

      setShowMenu(false);
      setShowDeleteConfirm(false);

      setShowDeleteToast(true);
      setTimeout(() => setShowDeleteToast(false), 3000);

      if (onPostDeleted) {
        onPostDeleted(post.id);
      }

      console.log("✅ Post deletion process completed");
    } catch (error) {
      console.error("❌ Error deleting post:", error);
      alert(`Failed to delete post: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const goToPrev = useCallback(
    (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      setCurrentIndex((prev) =>
        prev === 0 ? post.images.length - 1 : prev - 1,
      );
      setIsImageLoaded(false);
    },
    [post.images?.length],
  );

  const goToNext = useCallback(
    (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      setCurrentIndex((prev) =>
        prev === post.images.length - 1 ? 0 : prev + 1,
      );
      setIsImageLoaded(false);
    },
    [post.images?.length],
  );

  const openFullscreen = (index) => {
    setFullscreenIndex(index);
    setIsFullscreen(true);
    document.body.style.overflow = "hidden";
  };

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    document.body.style.overflow = "auto";
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  const getPostUrl = () => {
    return `${window.location.origin}/community/${post?.communityData?.category || post?.category}/${post?.communityId || post?.communityData?.id}/${post?.communityName || post?.communityData?.name}/${post?.creatorName}/${post?.id}`;
  };

  const sharePlatforms = [
    {
      name: "Facebook",
      icon: FaFacebook,
      color: "bg-[#1877f2]",
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            getPostUrl(),
          )}`,
          "_blank",
          "width=600,height=400",
        );
      },
    },
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      color: "bg-[#25d366]",
      action: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(
            `${post.projectName || "Check out this post"} ${getPostUrl()}`,
          )}`,
          "_blank",
          "width=600,height=400",
        );
      },
    },
    {
      name: "Twitter",
      icon: FaTwitter,
      color: "bg-[#000000]",
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            post.projectName || "Check out this post",
          )}&url=${encodeURIComponent(getPostUrl())}`,
          "_blank",
          "width=600,height=400",
        );
      },
    },
    {
      name: "LinkedIn",
      icon: FaLinkedin,
      color: "bg-[#0a66c2]",
      action: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            getPostUrl(),
          )}`,
          "_blank",
          "width=600,height=400",
        );
      },
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getPostUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFullscreen) {
        if (e.key === "Escape") closeFullscreen();
        if (e.key === "ArrowLeft") {
          const newIndex =
            fullscreenIndex === 0
              ? post.images.length - 1
              : fullscreenIndex - 1;
          setFullscreenIndex(newIndex);
          setIsImageLoaded(false);
        }
        if (e.key === "ArrowRight") {
          const newIndex =
            fullscreenIndex === post.images.length - 1
              ? 0
              : fullscreenIndex + 1;
          setFullscreenIndex(newIndex);
          setIsImageLoaded(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, fullscreenIndex, post.images?.length, closeFullscreen]);

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


      

  return (
    <>

      <AnimatePresence>
        {showDeleteToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <FaCheck className="text-xl" />
            <span className="font-medium">Post deleted successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4"
            onClick={closeFullscreen}>
            <div className="relative w-full max-w-6xl h-[90vh] flex items-center justify-center">
              <button
                onClick={closeFullscreen}
                className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl transition-colors z-10">
                <FaTimes />
              </button>

              <div className="relative w-full h-full flex items-center justify-center">
                {post.images?.[fullscreenIndex] &&
                /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(
                  post.images[fullscreenIndex],
                ) ? (
                  <video
                    ref={videoRef}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    src={post.images[fullscreenIndex]}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <img
                    src={post.images?.[fullscreenIndex]}
                    alt={`Fullscreen ${fullscreenIndex + 1}`}
                    className="w-full h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}

                {post.images?.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newIndex =
                          fullscreenIndex === 0
                            ? post.images.length - 1
                            : fullscreenIndex - 1;
                        setFullscreenIndex(newIndex);
                        setIsImageLoaded(false);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all">
                      <ChevronLeft size={32} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newIndex =
                          fullscreenIndex === post.images.length - 1
                            ? 0
                            : fullscreenIndex + 1;
                        setFullscreenIndex(newIndex);
                        setIsImageLoaded(false);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all">
                      <ChevronRight size={32} />
                    </button>
                  </>
                )}
              </div>

              {post.images?.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                  {fullscreenIndex + 1} / {post.images.length}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 ${getModalOverlayBg()} z-50 flex items-center justify-center p-4`}
            onClick={() => setShowShareModal(false)}>
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`${getModalBg()} rounded-2xl shadow-2xl max-w-md w-full p-6`}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${getTextColor()}`}>
                  Share Post
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className={`${getMutedTextColor()} hover:text-gray-700 dark:hover:text-gray-200 transition-colors`}>
                  <FaTimes size={22} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                {sharePlatforms.map((item, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      item.action();
                      setShowShareModal(false);
                    }}
                    className="flex flex-col items-center gap-2 group">
                    <div
                      className={`w-14 h-14 rounded-full ${item.color} flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className={`text-xs ${getMutedTextColor()}`}>
                      {item.name}
                    </span>
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={copyToClipboard}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  themeMode === "light"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                    : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                } shadow-lg hover:shadow-xl`}>
                {copied ? "✓ Copied!" : "Copy Link"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full ${getCardBg()} rounded-2xl shadow-xl overflow-hidden border ${getBorderColor()} hover:shadow-2xl transition-all duration-300 mb-6 relative`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <div className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 p-5">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={post.profileImage || "/default-user.png"}
                  alt={post.creatorName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/80 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">
                  @{post.creatorName}
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
            <div className="flex items-center gap-2">
              {post.communityData?.name && (
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                  C/{post.communityData.name}
                </span>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                  <FaEllipsisH size={20} />
                </button>

                {/* Menu Dropdown */}
                {showMenu && (
                  <div
                    className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg overflow-hidden border ${getBorderColor()} ${getCardBg()} z-50`}>
                    {isOwner && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors">
                        <FaTrash className="text-red-500" />
                        <span>Delete Post</span>
                      </button>
                    )}
                    {!isOwner && (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        No options available
                      </div>
                    )}
                  </div>
                )}

                {/* Delete Confirmation Popup */}
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
            </div>
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
                  if (isVideo && videoRef.current) {
                    if (videoRef.current.paused) {
                      videoRef.current.play();
                      setIsPlaying(true);
                    } else {
                      videoRef.current.pause();
                      setIsPlaying(false);
                    }
                  } else {
                    openFullscreen(currentIndex);
                  }
                }}>
                {!isImageLoaded && !isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {isVideo ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full max-h-[500px] object-contain"
                      src={mediaUrl}
                      poster="/video-poster.png"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity hover:bg-black/30">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                          <FaPlay className="w-7 h-7 text-cyan-600 ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={mediaUrl}
                    alt={`Media ${currentIndex + 1}`}
                    className={`w-full max-h-[500px] object-contain hover:scale-[1.02] transition-transform duration-300 ${
                      isImageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() => setIsImageLoaded(true)}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default-media.png";
                    }}
                  />
                )}
              </div>

              {post.images?.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goToPrev();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 backdrop-blur-sm p-2.5 rounded-full shadow-lg transition-all duration-200">
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goToNext();
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors group ${
                  liked
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}>
                {liked ? (
                  <FaHeart className="text-2xl text-red-500 animate-pulse" />
                ) : (
                  <FaRegHeart className="text-2xl text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400 transition-colors" />
                )}
                <span
                  className={`font-medium ${liked ? "text-red-500" : getSecondaryTextColor()}`}>
                  {likeCount}
                </span>
              </motion.button>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to={`/community/${post.communityData?.category || post?.category}/${post.communityData?.id || post?.communityId}/${post.communityData?.name || post?.communityName}/${post.creatorName}/${post.id}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                  <FaRegCommentDots className="text-xl text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400 transition-colors" />
                  <span className={getSecondaryTextColor()}>
                    {commentCount}
                  </span>
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowShareModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                <FaRegShareSquare className="text-xl text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400 transition-colors" />
                <span className={getSecondaryTextColor()}>Share</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSavePost}
                className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title={isSaved ? "Unsave post" : "Save post"}>
                {isSaved ? (
                  <FaBookmark className="text-2xl text-blue-600 dark:text-blue-400" />
                ) : (
                  <FaRegBookmark className="text-2xl text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default CommunityPostCard;