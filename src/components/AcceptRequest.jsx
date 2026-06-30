/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState } from "react";
import { db } from "../firebase";
import { arrayUnion, deleteDoc, doc, updateDoc } from "firebase/firestore";

const AcceptRequest = ({
  showModalIsClicked,
  setShowModalIsClicked,
  OtherUserId,
  teamId,
  onReject,
  chatId,
  themeMode,
}) => {
  if (!showModalIsClicked) return null;

  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    console.log(teamId, OtherUserId);
    if (!teamId || !OtherUserId) return alert("Missing team or user ID");
    setLoading(true);
    try {
      const teamRef = doc(db, "teams", teamId);
      await updateDoc(teamRef, {
        members: arrayUnion(OtherUserId),
      });

      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        type: "teammate",
      });

      const userRef = doc(db, "users", OtherUserId);
      await updateDoc(userRef, {
        teams: arrayUnion(teamId),
      });

      setShowModalIsClicked(false);
    } catch (error) {
      console.error("Failed to accept user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (onReject) onReject();
    setShowModalIsClicked(false);

    try {
      await deleteDoc(doc(db, "chats", chatId));
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleClose = () => {
    setShowModalIsClicked(false);
  };

  const getBorderColor = () => {
    return themeMode === "light" ? "border-cyan-400/40" : "border-[#2c2d2e]";
  };

  const getShadowColor = () => {
    return themeMode === "light" ? "shadow-cyan-700/20" : "shadow-cyan-700/10";
  };

  const getTextColor = () => {
    return themeMode === "light" ? "text-gray-800" : "text-gray-100";
  };

  const getTitleGradient = () => {
    return themeMode === "light"
      ? "from-cyan-600 to-blue-600"
      : "from-cyan-400 to-blue-400";
  };

  const getGlowColor = () => {
    return themeMode === "light" ? "bg-cyan-400/20" : "bg-cyan-500/10";
  };

  const getCloseButtonColor = () => {
    return themeMode === "light"
      ? "text-gray-500 hover:text-cyan-600"
      : "text-gray-400 hover:text-cyan-400";
  };

  const getCardBg = () => {
    return themeMode === "light" ? "bg-white/95" : "bg-[#222223]/95";
  };

  return (
    <div className="fixed inset-0 z-[9999] h-screen flex items-center justify-center p-4 backdrop-blur-sm">
      <div
        className={`${getCardBg()} border ${getBorderColor()} rounded-2xl p-8 w-full max-w-md shadow-2xl ${getShadowColor()} animate-fade-in relative overflow-hidden`}>
        <div className="relative mb-6">
          <div
            className={`absolute -inset-3 ${getGlowColor()} rounded-xl blur-md opacity-50`}></div>
          <h2
            className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${getTitleGradient()} text-center relative`}>
            Accepting membership request
          </h2>
        </div>

        <p className={`${getTextColor()} text-center mb-8 text-lg`}>
          Would you like to accept this member into the team?
        </p>

        <div className="flex flex-col gap-4 relative">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="relative overflow-hidden group bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-xl border-b-4 border-cyan-800/50 hover:border-cyan-700/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  Adding...
                </>
              ) : (
                "I accept him into the team"
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <button
            onClick={handleReject}
            className="relative overflow-hidden group bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-600 hover:to-rose-700 text-white font-semibold py-3 px-6 rounded-xl border-b-4 border-red-900/50 hover:border-red-800/50 transition-all duration-300">
            <span className="relative z-10">I refuse his request</span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-rose-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        <div className="mt-8 text-center relative">
          <button
            onClick={handleClose}
            className={`text-sm ${getCloseButtonColor()} transition-all duration-300 hover:underline`}>
            Choose later
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptRequest;
