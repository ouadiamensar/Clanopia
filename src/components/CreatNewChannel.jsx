import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useParams } from "react-router-dom";
import { FiHash, FiX } from "react-icons/fi";

const CreateChannel = ({ onClose }) => {
  const { team } = useParams();
  const [channelName, setChannelName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
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
    themeMode === "light" ? "bg-slate-50" : "bg-[#1e1e1f]";
  const getCardBg = () =>
    themeMode === "light"
      ? "bg-white border-gray-200"
      : "bg-[#222223] border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-slate-900" : "text-slate-100";
  const getLabelColor = () =>
    themeMode === "light" ? "text-slate-600" : "text-slate-300";
  const getInputStyle = () =>
    themeMode === "light"
      ? "bg-white border-gray-300 text-slate-900 placeholder-slate-400 focus:ring-cyan-500"
      : "bg-[#252527] border-[#2c2d2e] text-slate-100 placeholder-slate-500 focus:ring-cyan-400";
  const getButtonPrimary = () =>
    themeMode === "light"
      ? "bg-cyan-600 hover:bg-cyan-700 text-white"
      : "bg-cyan-500 hover:bg-cyan-400 text-slate-950";
  const getButtonSecondary = () =>
    themeMode === "light"
      ? "bg-slate-100 hover:bg-slate-200 text-slate-900"
      : "bg-[#29292a] hover:bg-[#2c2d2e] text-slate-100";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) {
      setError("Channel name is required");
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, "teams", team, "workspace"), {
        name: channelName.trim(),
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid,
        members: [auth.currentUser.uid],
      });
      onClose();
    } catch (err) {
      setError("Failed to create channel: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 ${themeMode === "light" ? "bg-slate-900/20" : "bg-black/80"}`}>
      <div
        className={`w-full max-w-md rounded-xl border shadow-xl ${getCardBg()} ${getTextColor()}`}>
        <div
          className={`flex justify-between items-center p-4 border-b ${themeMode === "light" ? "border-gray-200" : "border-slate-700"}`}>
          <h3 className="text-lg font-semibold">Create Channel</h3>
          <button
            onClick={onClose}
            className={`text-sm ${getTextColor()} p-2 rounded-full hover:bg-slate-200/50 ${themeMode === "light" ? "hover:text-slate-900" : "hover:bg-slate-700"}`}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={`p-4 ${getBgColor()}`}>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-900/90 text-red-100 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className={`block text-sm mb-2 ${getLabelColor()}`}>
              Channel Name
            </label>
            <div className="relative">
              <FiHash className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="e.g. announcements"
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${getInputStyle()}`}
                autoFocus
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition ${getButtonSecondary()}`}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !channelName.trim()}
              className={`px-4 py-2 rounded-lg transition ${getButtonPrimary()} disabled:opacity-50 disabled:cursor-not-allowed`}>
              {isLoading ? "Creating..." : "Create Channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannel;
