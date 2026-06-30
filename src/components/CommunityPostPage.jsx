/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./Sidebar";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useParams } from "react-router";
import PostCard from "./smallComp/PostCard";
import { CiEdit } from "react-icons/ci";
import { FaSave } from "react-icons/fa";
import { FcLike } from "react-icons/fc";
import { IoIosHeartDislike } from "react-icons/io";
import RightSideBar from "./rightSideBar";
import CommunityPostCard from "./smallComp/CommunityPostCard";

const PostPage = () => {
  const { communityId, PostId, category } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [editCommentID, setEditCommentID] = useState(null);
  const [comment, setComment] = useState({
    createdBy: auth.currentUser?.uid,
    creatorName: "",
    userImage: "",
    content: "",
  });
  const [createComment, setCreateComment] = useState(false);
  const [uncompleted, setUncompleted] = useState(false);
  const commentInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const currentUser = auth.currentUser;

  const [replies, setReplies] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [replyToComment, setReplyToComment] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [newCommentContent, setNewCommentContent] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMedium, setIsMedium] = useState(
    window.innerWidth < 1528 && window.innerWidth > 768,
  );

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
    themeMode === "light" ? "bg-gray-50" : "bg-[#252527]";
  const getHoverColor = () =>
    themeMode === "light" ? "hover:bg-gray-100" : "hover:bg-[#29292a]";
  const getCommentBg = () =>
    themeMode === "light" ? "bg-gray-50" : "bg-[#222223]";
  const getReplyBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getButtonBg = () =>
    themeMode === "light" ? "bg-gray-200" : "bg-[#29292a]";
  const getButtonText = () =>
    themeMode === "light" ? "text-gray-700" : "text-gray-300";
  useEffect(() => {
    const handleResize = () => {
      setIsMedium(window.innerWidth < 1528 && window.innerWidth > 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const getUserProfile = async () => {
      if (!currentUser) return;

      const profileRef = doc(db, "users", currentUser.uid, "profile", "data");
      const snapshot = await getDoc(profileRef);

      if (snapshot.exists()) {
        const profileData = snapshot.data();
        setProfile(profileData);
        setComment((prev) => ({
          ...prev,
          creatorName: profileData.name || "Anonymous",
          userImage: profileData.ProfileImageURL || "",
        }));
      } else {
        setProfile(null);
      }
    };

    getUserProfile();
  }, [currentUser]);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        if (!communityId || !category || !PostId) {
          console.error("Missing required params:", {
            communityId,
            category,
            PostId,
          });
          setLoading(false);
          return;
        }

        console.log("🔍 Fetching post with:", {
          communityId,
          category,
          PostId,
        });

        const postRef = doc(
          db,
          "communities",
          category,
          "items",
          communityId,
          "posts",
          PostId,
        );

        console.log("📌 Post Reference Path:", postRef.path);

        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const postData = postSnap.data();
          console.log("✅ Post data fetched:", postData);

          const postObject = {
            id: postSnap.id,
            communityId: communityId,
            category: category,
            communityData: {
              id: communityId,
              category: category,
              name:
                postData.communityName ||
                postData.communityData?.name ||
                "Community",
            },
            content: postData.content || "",
            projectName: postData.title || postData.projectName || "",
            tags: postData.tags || [],
            type: postData.type || "",
            images: postData.images || [],
            createdAt: postData.createdAt || new Date(),
            creatorName:
              postData.authorName || postData.creatorName || "Anonymous",
            profileImage: postData.authorAvatar || postData.profileImage || "",
            userId: postData.authorId || postData.userId || "",
            likes: postData.likes || [],
            communityName:
              postData.communityName || postData.communityData?.name || "",
          };

          console.log("📦 Post object prepared:", postObject);
          setPost(postObject);

          const commentsRef = collection(
            doc(
              db,
              "communities",
              category,
              "items",
              communityId,
              "posts",
              PostId,
            ),
            "comments",
          );
          const commentsQuery = query(commentsRef, orderBy("timestamp", "asc"));
          const commentsSnap = await getDocs(commentsQuery);
          const loadedComments = commentsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setComments(loadedComments);

          const repliesPromises = loadedComments.map((comment) =>
            fetchReplies(comment.id),
          );
          await Promise.all(repliesPromises);
        } else {
          console.warn("⚠️ Post not found!");
          setPost(null);
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [communityId, PostId, category]);

  const fetchReplies = async (commentId) => {
    if (!post || !commentId) return;

    setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));

    try {
      const repliesRef = collection(
        doc(
          db,
          "communities",
          category,
          "items",
          communityId,
          "posts",
          post.id,
          "comments",
          commentId,
        ),
        "replies",
      );
      const repliesQuery = query(repliesRef, orderBy("timestamp", "asc"));
      const repliesSnap = await getDocs(repliesQuery);
      const loadedReplies = repliesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReplies((prev) => ({ ...prev, [commentId]: loadedReplies }));
    } catch (error) {
      console.error("Error fetching replies:", error);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleSendComment = async () => {
    if (!currentUser) {
      alert("Please log in to comment");
      return;
    }

    if (comment.content.trim() !== "") {
      const CommentRef = collection(
        doc(
          db,
          "communities",
          category,
          "items",
          communityId,
          "posts",
          post.id,
        ),
        "comments",
      );

      const newComment = {
        ...comment,
        timestamp: new Date(),
      };

      await addDoc(CommentRef, newComment);

      setComment({ ...comment, content: "" });
      setCreateComment(false);
      setUncompleted(false);

      const commentsQuery = query(CommentRef, orderBy("timestamp", "asc"));
      const commentsSnap = await getDocs(commentsQuery);
      const loadedComments = commentsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(loadedComments);
    } else {
      handleUncompletedComment();
    }
  };

  const handleUncompletedComment = () => {
    setUncompleted(true);
    setTimeout(() => {
      setUncompleted(false);
    }, 4500);
  };

  const handleEditCommentId = (id) => {
    setEditCommentID(editCommentID === id ? null : id);
    setNewCommentContent(comments.find((c) => c.id === id)?.content || "");
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

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

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
      }
    }
    return "Just now";
  }

  const updateComment = async (commentId) => {
    const commentRef = doc(
      db,
      "communities",
      category,
      "items",
      communityId,
      "posts",
      post.id,
      "comments",
      commentId,
    );

    try {
      await updateDoc(commentRef, {
        content: newCommentContent,
        updatedAt: new Date(),
      });

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content: newCommentContent, updatedAt: new Date() }
            : c,
        ),
      );
      setEditCommentID(null);
    } catch (error) {
      console.error("Error updating comment: ", error);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentUser) {
      alert("Please log in to like comments");
      return;
    }

    const commentRef = doc(
      db,
      "communities",
      category,
      "items",
      communityId,
      "posts",
      post.id,
      "comments",
      commentId,
    );

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const userId = currentUser.uid;
    const alreadyLiked = comment.likes?.includes(userId);
    const updatedLikes = alreadyLiked
      ? comment.likes.filter((id) => id !== userId)
      : [...(comment.likes || []), userId];

    try {
      await updateDoc(commentRef, { likes: updatedLikes });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, likes: updatedLikes } : c,
        ),
      );
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleSendReply = async (commentId) => {
    if (!currentUser) {
      alert("Please log in to reply");
      return;
    }

    if (!replyContent.trim()) {
      alert("Please write a reply");
      return;
    }

    try {
      const replyRef = collection(
        doc(
          db,
          "communities",
          category,
          "items",
          communityId,
          "posts",
          post.id,
          "comments",
          commentId,
        ),
        "replies",
      );

      const newReply = {
        content: replyContent,
        createdBy: currentUser.uid,
        creatorName: profile?.name || "Anonymous",
        userImage: profile?.ProfileImageURL || "",
        timestamp: new Date(),
      };

      await addDoc(replyRef, newReply);
      await fetchReplies(commentId);
      setReplyContent("");
      setReplyToComment(null);
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply");
    }
  };

  const ReplyItem = ({ reply }) => (
    <div
      className={`ml-4 md:ml-8 mt-2 pl-2 md:pl-4 border-l-2 ${
        themeMode === "light" ? "border-gray-300" : "border-gray-600"
      } flex-col gap-3`}>
      <div className="flex items-center gap-2 mb-1">
        <img
          className="w-5 h-5 md:w-7 md:h-7 rounded-full border border-cyan-400"
          src={reply.userImage || "/default-avatar.png"}
          alt={reply.creatorName}
          onError={(e) => {
            e.target.src = "/default-avatar.png";
          }}
        />
        <span className={`font-semibold text-xs ${getTextColor()}`}>
          @{reply.creatorName}
        </span>
        <span className={`text-xs ${getSecondaryTextColor()}`}>
          {timeSince(reply.timestamp)}
        </span>
      </div>
      <p
        className={`mt-1 text-xs md:text-base ${getTextColor()} ml-3 md:ml-5 p-2 rounded-lg ${getReplyBg()} w-fit`}>
        {reply.content}
      </p>
    </div>
  );

  return (
    <div
      className={`min-h-screen ${getBgColor()} ${getTextColor()} grid grid-cols-1 md:grid-cols-[auto_1fr_auto]`}>
      <Sidebar themeMode={themeMode} />

      <div className="p-3 md:p-4 pt-4 md:pt-5 md:col-start-2 z-0 md:col-end-3 overflow-auto">
        {loading ? (
          <div className={`flex justify-center items-center py-10`}>
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
          </div>
        ) : post ? (
          <div
            className={`space-y-4 md:space-y-6 max-w-6xl mx-auto w-full mt-5 ${
              isMedium && "pl-70 pr-40"
            } ${!isMobile && !isMedium && "pl-30"}`}>
            <CommunityPostCard
              post={{
                id: post.id,
                content: post.content,
                projectName: post.projectName,
                tags: post.tags || [],
                type: post.type || "",
                images: post.images || [],
                createdAt: post.createdAt,
                creatorName: post.creatorName,
                profileImage: post.profileImage,
                userId: post.userId,
                likes: post.likes || [],
                communityId: post.communityId,
                category: post.category,
                communityData: post.communityData,
                communityName: post.communityName,
                commentsCount: comments.length,
              }}
              themeMode={themeMode}
            />

            {!createComment && (
              <div
                className={`${getCardBg()} rounded-lg md:rounded-xl shadow p-3 md:p-4 ${getBorderColor()} border`}>
                <div
                  className={`w-full h-12 md:h-15 rounded-lg md:rounded-xl ${getInputBg()} ${getBorderColor()} border p-3 md:p-4 text-xs md:text-sm ${getSecondaryTextColor()} font-medium md:font-semibold cursor-text hover:border-cyan-500 transition-colors`}
                  onClick={() => {
                    if (!currentUser) {
                      alert("Please log in to comment");
                      return;
                    }
                    setCreateComment(true);
                    setTimeout(() => commentInputRef.current?.focus(), 100);
                  }}>
                  Join the discussion and share your thoughts...
                </div>
              </div>
            )}

            {createComment && (
              <div
                className={`${getCardBg()} rounded-lg md:rounded-xl shadow p-4 md:p-6 ${getBorderColor()} border`}>
                <h2
                  className={`text-base md:text-lg font-semibold mb-3 md:mb-4 ${getTextColor()}`}>
                  Create a comment
                </h2>
                <textarea
                  ref={commentInputRef}
                  placeholder="Write your comment here..."
                  rows={3}
                  onChange={(e) =>
                    setComment({ ...comment, content: e.target.value })
                  }
                  value={comment.content}
                  className={`w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base rounded-lg border ${getBorderColor()} ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-cyan-500 focus:outline-none focus:border-transparent`}
                />
                <div className="w-full flex gap-2 justify-end mt-3 md:mt-4">
                  <div className="flex gap-2 items-center flex-wrap">
                    {uncompleted && (
                      <span className="text-red-400 animate-pulse text-xs md:text-sm">
                        Please fill out the comment content.
                      </span>
                    )}
                    <button
                      className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-transparent text-red-400 font-medium border border-red-400 hover:bg-red-400 hover:text-white transition-all duration-200 rounded-lg"
                      onClick={() => setCreateComment(false)}>
                      Cancel
                    </button>

                    <button
                      className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-gradient-to-r from-cyan-600 to-teal-500 text-white font-medium hover:from-cyan-700 hover:to-teal-600 transition-all duration-200 rounded-lg shadow-md"
                      onClick={handleSendComment}>
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 md:space-y-4">
              <h3
                className={`text-lg md:text-xl font-semibold ${getTextColor()} border-b ${
                  themeMode === "light" ? "border-gray-300" : "border-gray-700"
                } pb-2`}>
                Comments ({comments.length})
              </h3>

              {comments.length > 0 ? (
                comments.map((item) => (
                  <div
                    key={item.id}
                    className={`${getCommentBg()} rounded-lg md:rounded-xl p-3 md:p-4 shadow hover:shadow-lg transition-all duration-200 ${getBorderColor()} border`}>
                    <div className="flex items-center gap-2 md:gap-3">
                      <img
                        className="w-7 h-7 md:w-9 md:h-9 rounded-full border-2 border-cyan-500 shadow"
                        src={item.userImage || "/default-avatar.png"}
                        alt="user"
                        onError={(e) => {
                          e.target.src = "/default-avatar.png";
                        }}
                      />
                      <div className="flex flex-col">
                        <span
                          className={`font-semibold text-xs md:text-sm ${getTextColor()}`}>
                          @{item.creatorName}
                          {item.createdBy === post.authorId && (
                            <span className="ml-1 text-yellow-400">👑</span>
                          )}
                        </span>
                        <span
                          className={`font-medium text-xs ${getSecondaryTextColor()}`}>
                          {timeSince(item.timestamp)}
                          {item.updatedAt && " (edited)"}
                        </span>
                      </div>

                      {currentUser?.uid === item.createdBy && (
                        <CiEdit
                          className={`ml-auto ${getSecondaryTextColor()} hover:text-cyan-400 text-lg md:text-2xl cursor-pointer transition-colors duration-200 ${
                            editCommentID === item.id ? "text-cyan-400" : ""
                          }`}
                          onClick={() => handleEditCommentId(item.id)}
                        />
                      )}
                    </div>

                    <div className="mt-2 md:mt-3">
                      {item.id !== editCommentID ? (
                        <p
                          className={`${getTextColor()} text-xs md:text-base leading-relaxed`}>
                          {item.content}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            onChange={(e) =>
                              setNewCommentContent(e.target.value)
                            }
                            value={newCommentContent}
                            className={`w-full text-xs md:text-sm p-2 md:p-3 border border-cyan-400 rounded-lg ${getInputBg()} ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none`}
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              className={`px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm ${getButtonBg()} ${getButtonText()} rounded-lg cursor-pointer font-medium transition-all duration-200`}
                              onClick={() => setEditCommentID(null)}>
                              Cancel
                            </button>
                            <button
                              className="flex items-center gap-1 px-3 py-1 md:px-4 md:py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer"
                              onClick={() => updateComment(item.id)}>
                              <FaSave className="text-xs md:text-sm" /> Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center mt-2 md:mt-3 gap-2 md:gap-3 flex-wrap">
                      <button
                        className={`text-xs md:text-sm ${getSecondaryTextColor()} hover:text-cyan-400 transition-all duration-200 font-medium flex items-center gap-1`}
                        onClick={() => handleLikeComment(item.id)}>
                        {item.likes?.includes(currentUser?.uid) ? (
                          <>
                            <FcLike className="text-base md:text-lg" /> Liked
                          </>
                        ) : (
                          <>
                            <IoIosHeartDislike className="text-base md:text-lg" />{" "}
                            Like
                          </>
                        )}
                      </button>
                      <span className={`text-xs ${getSecondaryTextColor()}`}>
                        {item.likes?.length || 0} likes
                      </span>

                      <button
                        className={`text-xs ${getSecondaryTextColor()} hover:text-cyan-400 transition-all duration-200 cursor-pointer`}
                        onClick={() => {
                          setReplyToComment(
                            replyToComment === item.id ? null : item.id,
                          );
                          if (replyToComment !== item.id && !replies[item.id]) {
                            fetchReplies(item.id);
                          }
                        }}>
                        {replyToComment === item.id ? "Cancel Reply" : "Reply"}
                      </button>

                      <span className={`text-xs ${getSecondaryTextColor()}`}>
                        ({replies[item.id]?.length || 0} replies)
                      </span>

                      {replies[item.id]?.length > 0 && (
                        <button
                          className="text-xs text-cyan-500 hover:underline focus:outline-none cursor-pointer ml-auto"
                          onClick={() => toggleReplies(item.id)}>
                          {expandedReplies[item.id]
                            ? "Collapse replies"
                            : "Expand replies"}
                        </button>
                      )}
                    </div>

                    {replyToComment === item.id && (
                      <div className="mt-2 md:mt-3 ml-1 md:ml-2">
                        <textarea
                          placeholder="Write your reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className={`w-full p-2 text-xs md:text-sm border ${getBorderColor()} rounded-lg ${getInputBg()} ${getTextColor()} focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                          rows={2}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            className={`px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm ${getButtonBg()} ${getButtonText()} rounded-lg hover:${getHoverColor()}`}
                            onClick={() => setReplyToComment(null)}>
                            Cancel
                          </button>
                          <button
                            className="px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                            onClick={() => handleSendReply(item.id)}>
                            Send Reply
                          </button>
                        </div>
                      </div>
                    )}

                    {replies[item.id]?.length > 0 && (
                      <div className="mt-2 md:mt-3 ml-1 md:ml-2 space-y-1 md:space-y-2">
                        {(expandedReplies[item.id]
                          ? replies[item.id]
                          : replies[item.id].slice(0, 1)
                        ).map((reply) => (
                          <ReplyItem key={reply.id} reply={reply} />
                        ))}

                        {replies[item.id].length > 1 && (
                          <button
                            className="text-xs text-cyan-500 hover:underline focus:outline-none cursor-pointer mt-1 md:mt-2"
                            onClick={() => toggleReplies(item.id)}>
                            {expandedReplies[item.id]
                              ? "View less replies"
                              : `View ${
                                  replies[item.id].length - 1
                                } more replies`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p
                  className={`${getSecondaryTextColor()} text-center py-4 md:py-6 text-sm md:text-base`}>
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-red-400 py-8 md:py-10 text-sm md:text-base">
            Post not found.
          </div>
        )}
      </div>
      <RightSideBar themeMode={themeMode} />
    </div>
  );
};

export default PostPage;
