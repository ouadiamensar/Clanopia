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

const themeColors = {
  light: {
    background: "bg-gray-100",
    card: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    border: "border-gray-300",
    input: "bg-white border-gray-300",
    placeholder: "placeholder-gray-500",
    hover: "hover:border-blue-500",
    button: {
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
      danger: "bg-red-600 hover:bg-red-700 text-white",
    },
  },
  dark: {
    background: "bg-[#1e1e1f]",
    card: "bg-[#222223]",
    text: "text-white",
    textSecondary: "text-gray-400",
    border: "border-[#2c2d2e]",
    input: "bg-[#252527] border-[#2c2d2e]",
    placeholder: "placeholder-gray-400",
    hover: "hover:border-cyan-500",
    button: {
      primary:
        "bg-gradient-to-r from-cyan-600 to-emerald-400 hover:from-cyan-700 hover:to-emerald-500 text-white",
      secondary: "bg-[#29292a] hover:bg-[#2c2d2e] text-gray-300",
      danger: "bg-red-700 hover:bg-red-600 text-white",
    },
  },
};

const PostPage = () => {
  const { userId, postId } = useParams();
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const getThemeClass = (element) => {
    return themeColors[themeMode]?.[element] || themeColors.dark[element];
  };

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
        const postRef = doc(
          db,
          "users",
          userId,
          "profile",
          "data",
          "posts",
          postId
        );
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          setPost({
            id: postSnap.id,
            userId,
            ...postSnap.data(),
          });

          const commentsRef = collection(
            doc(db, "users", userId, "profile", "data", "posts", postId),
            "comments"
          );
          const commentsSnap = await getDocs(commentsRef);
          const loadedComments = commentsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setComments(loadedComments);

          const repliesPromises = loadedComments.map((comment) =>
            fetchReplies(comment.id)
          );
          await Promise.all(repliesPromises);
        } else {
          setPost(null);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [userId, postId]);

  const fetchReplies = async (commentId) => {
    if (!post || !commentId) return;

    setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));

    try {
      const repliesRef = collection(
        doc(
          db,
          "users",
          post.userId,
          "profile",
          "data",
          "posts",
          post.id,
          "comments",
          commentId
        ),
        "replies"
      );

      const repliesSnap = await getDocs(repliesRef);
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
    if (comment.content.trim() !== "") {
      const CommentRef = collection(
        doc(db, "users", post.userId, "profile", "data", "posts", post.id),
        "comments"
      );

      const newComment = {
        ...comment,
        timestamp: new Date(),
      };

      await addDoc(CommentRef, newComment);

      setComment({ ...comment, content: "" });
      setCreateComment(false);
      setUncompleted(false);

      const commentsSnap = await getDocs(CommentRef);
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
      "users",
      post.userId,
      "profile",
      "data",
      "posts",
      post.id,
      "comments",
      commentId
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
            : c
        )
      );
      setEditCommentID(null);
    } catch (error) {
      console.error("Error updating comment: ", error);
    }
  };

  const handleLikeComment = async (commentId) => {
    const commentRef = doc(
      db,
      "users",
      post.userId,
      "profile",
      "data",
      "posts",
      post.id,
      "comments",
      commentId
    );

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const alreadyLiked = comment.likes?.includes(userId);
    const updatedLikes = alreadyLiked
      ? comment.likes.filter((id) => id !== userId)
      : [...(comment.likes || []), userId];

    try {
      await updateDoc(commentRef, { likes: updatedLikes });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, likes: updatedLikes } : c
        )
      );
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleSendReply = async (commentId) => {
    if (!replyContent.trim()) {
      alert("Please write a reply");
      return;
    }

    try {
      const replyRef = collection(
        doc(
          db,
          "users",
          post.userId,
          "profile",
          "data",
          "posts",
          post.id,
          "comments",
          commentId
        ),
        "replies"
      );

      const newReply = {
        content: replyContent,
        createdBy: auth.currentUser?.uid,
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
      className={`ml-8 mt-2 pl-4 border-l-2 ${getThemeClass(
        "border"
      )} flex-col gap-3`}>
      <div className="flex items-center gap-2 mb-2 ">
        <img
          className="w-7 h-7 rounded-full border border-cyan-400"
          src={reply.userImage}
          alt={reply.creatorName}
        />
        <span
          className={`font-semibold text-xs ${getThemeClass("textSecondary")}`}>
          @{reply.creatorName}
        </span>
        <span className={`text-xs ${getThemeClass("textSecondary")}`}>
          {timeSince(reply.timestamp)}
        </span>
      </div>
      <p
        className={`mt-1 text-base font-semibold ${getThemeClass(
          "text"
        )} m-5 w-fit p-1 rounded-2xl`}>
        {reply.content}
      </p>
    </div>
  );

  return (
    <div
      className={`min-h-screen ${getThemeClass("background")} ${getThemeClass(
        "text"
      )} flex`}>
      <Sidebar themeMode={themeMode} />
      <div className={` w-full md:w-3/5 mx-auto p-4 ${isMobile ? 'mt-15' : ''}  `}>
        {loading ? (
          <div
            className={`flex justify-center items-center  ${getThemeClass("textSecondary")} py-10`}>
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
          </div>
        ) : post ? (
          <div className="space-y-6">
            <PostCard post={post} themeMode={themeMode} />

            {!createComment && (
              <div
                className={`${getThemeClass(
                  "card"
                )} rounded-full shadow-lg p-3 ${getThemeClass("border")}`}>
                <div
                  className={`w-full h-15 rounded-full ${getThemeClass(
                    "input"
                  )} border-2 p-4 ${getThemeClass(
                    "textSecondary"
                  )} font-semibold cursor-text ${getThemeClass(
                    "hover"
                  )} transition-colors duration-200`}
                  onClick={() => {
                    setCreateComment(true);
                    setTimeout(() => commentInputRef.current?.focus(), 100);
                  }}>
                  Honor us and join us and discuss the post
                </div>
              </div>
            )}

            {createComment && (
              <div
                className={`${getThemeClass(
                  "card"
                )} rounded-xl shadow-lg p-6 pb-5 ${getThemeClass("border")}`}>
                <h2
                  className={`text-lg font-semibold mb-4 ${getThemeClass(
                    "text"
                  )}`}>
                  Create a comment
                </h2>
                <textarea
                  ref={commentInputRef}
                  type="text"
                  placeholder="Write your comment here ..."
                  rows={7}
                  onChange={(e) =>
                    setComment({ ...comment, content: e.target.value })
                  }
                  value={comment.content}
                  className={`w-full px-4 py-3 rounded-lg border ${getThemeClass(
                    "input"
                  )} ${getThemeClass(
                    "text"
                  )} focus:ring-2 focus:ring-cyan-500 focus:outline-0 ${getThemeClass(
                    "placeholder"
                  )}`}
                />
                <div className="w-full flex gap-2 justify-end">
                  <div className="flex gap-2 mt-4 items-center">
                    {uncompleted && (
                      <span className="text-red-400 animate-bounce">
                        Please fill out the comment content.
                      </span>
                    )}
                    <button
                      className={`w-24 h-10 ${
                        getThemeClass("button").danger
                      } font-semibold border-2 border-red-500 transition-all duration-200 rounded-xl shadow-sm`}
                      onClick={() => setCreateComment(false)}>
                      Cancel
                    </button>

                    <button
                      className={`w-24 h-10 ${
                        getThemeClass("button").primary
                      } font-semibold transition-all duration-200 rounded-xl shadow-md`}
                      onClick={handleSendComment}>
                      Send it
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((item) => (
                  <div
                    key={item.id}
                    className={`${getThemeClass(
                      "card"
                    )} rounded-2xl p-4 shadow-lg ${getThemeClass(
                      "border"
                    )} ${getThemeClass(
                      "hover"
                    )} transition-colors duration-200`}>
                    <div className="flex items-center gap-3">
                      <img
                        className="w-9 h-9 rounded-full border-2 border-cyan-500 shadow"
                        src={item.userImage}
                        alt="user"
                      />
                      <div className="flex flex-col">
                        <span
                          className={`font-semibold text-sm ${getThemeClass(
                            "text"
                          )}`}>
                          @{item.creatorName}
                          {item.createdBy === post.createdBy && (
                            <span className="ml-1">👑</span>
                          )}
                        </span>
                        <span
                          className={`font-semibold text-xs ${getThemeClass(
                            "textSecondary"
                          )}`}>
                          {timeSince(item.timestamp)}
                          {item.updatedAt && " (edited)"}
                        </span>
                      </div>

                      {auth.currentUser?.uid === item.createdBy && (
                        <CiEdit
                          className={`ml-auto ${getThemeClass(
                            "textSecondary"
                          )} hover:text-cyan-400 text-2xl cursor-pointer transition-colors duration-200 ${
                            editCommentID === item.id ? "text-cyan-400" : ""
                          }`}
                          onClick={() => handleEditCommentId(item.id)}
                        />
                      )}
                    </div>

                    <div className="mt-3">
                      {item.id !== editCommentID ? (
                        <p
                          className={`${getThemeClass(
                            "text"
                          )} text-sm leading-relaxed`}>
                          {item.content}
                        </p>
                      ) : (
                        <div className="space-y-2 animate-fade-in">
                          <textarea
                            onChange={(e) =>
                              setNewCommentContent(e.target.value)
                            }
                            value={newCommentContent}
                            className={`w-full text-sm p-3 border border-cyan-400 ${getThemeClass(
                              "input"
                            )} ${getThemeClass(
                              "text"
                            )} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none transition`}
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              className={`px-3 py-1.5 text-sm ${
                                getThemeClass("button").secondary
                              } rounded-lg cursor-pointer font-medium shadow transition-all duration-200`}
                              onClick={() => setEditCommentID(null)}>
                              Cancel
                            </button>
                            <button
                              className={`flex items-center gap-1 px-4 py-1.5 rounded-lg ${
                                getThemeClass("button").primary
                              } text-sm font-medium shadow transition-all duration-200 cursor-pointer`}
                              onClick={() => updateComment(item.id)}>
                              <FaSave /> Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center mt-3 gap-2">
                      <button
                        className={`text-sm ${getThemeClass(
                          "textSecondary"
                        )} hover:text-cyan-400 transition-all duration-200 font-medium`}
                        onClick={() => handleLikeComment(item.id)}>
                        {item.likes?.includes(auth.currentUser?.uid) ? (
                          <div className="flex gap-1 items-center cursor-pointer">
                            <FcLike /> liked
                          </div>
                        ) : (
                          <div className="flex gap-1 items-center cursor-pointer">
                            <IoIosHeartDislike /> like
                          </div>
                        )}
                      </button>
                      <span
                        className={`text-xs ${getThemeClass(
                          "textSecondary"
                        )} transition`}>
                        {item.likes?.length || 0} likes
                      </span>
                      <span
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          setReplyToComment(
                            replyToComment === item.id ? null : item.id
                          );
                          if (replyToComment !== item.id && !replies[item.id]) {
                            fetchReplies(item.id);
                          }
                        }}>
                        {replyToComment === item.id ? "Cancel" : "Reply"}
                      </span>
                      <span
                        className={`text-xs ${getThemeClass("textSecondary")}`}>
                        ({replies[item.id]?.length || 0} replies)
                      </span>
                    </div>

                    {replyToComment === item.id && (
                      <div className="mt-3 ml-2">
                        <textarea
                          placeholder="Write your reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className={`w-full p-2 text-sm border ${getThemeClass(
                            "input"
                          )} ${getThemeClass(
                            "text"
                          )} rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none ${getThemeClass(
                            "placeholder"
                          )}`}
                          rows={2}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            className={`px-3 py-1 text-sm ${
                              getThemeClass("button").secondary
                            } rounded-lg hover:bg-gray-300`}
                            onClick={() => setReplyToComment(null)}>
                            Cancel
                          </button>
                          <button
                            className={`px-3 py-1 text-sm ${
                              getThemeClass("button").primary
                            } rounded-lg hover:bg-cyan-500`}
                            onClick={() => handleSendReply(item.id)}>
                            Send Reply
                          </button>
                        </div>
                      </div>
                    )}

                    {replies[item.id]?.length > 0 && (
                      <div className="mt-3 ml-2 space-y-2">
                        {(expandedReplies[item.id]
                          ? replies[item.id]
                          : replies[item.id].slice(0, 1)
                        ).map((reply) => (
                          <ReplyItem key={reply.id} reply={reply} />
                        ))}

                        {replies[item.id].length > 1 && (
                          <button
                            className="text-xs text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer"
                            onClick={() => toggleReplies(item.id)}>
                            {expandedReplies[item.id]
                              ? "View less"
                              : `View more (${
                                  replies[item.id].length - 1
                                } more)`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p
                  className={`${getThemeClass(
                    "textSecondary"
                  )} text-center py-4`}>
                  No comments yet.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-red-400 py-10">Post not found.</div>
        )}
      </div>
      <RightSideBar themeMode={themeMode} />
    </div>
  );
};

export default PostPage;
