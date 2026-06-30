import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import CreateCommunity from "./CreateMyCommunity.jsx";
import Sidebar from "./Sidebar";
import ExploreCommunity from "./ExploreCommunity.jsx";
import CommunitiesSidebar from "./CommunitiesSidebar.jsx";
import RightSideBar from "./rightSideBar.jsx";
import JoinedCommunities from "./JoinedCommunitiesPage";
import MyOwnCommunities from "./MyOwnCommunities";

const Communities = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-gray-100";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!themeMode) {
    return null;
  }

  return (
    <div
      className={`min-h-screen max-w-screen flex ${getBgColor()} ${getTextColor()}`}>
      <Sidebar themeMode={themeMode} />

      <div
        className={`
          flex-1 transition-all duration-300 max-w-screen 
          ${isMobile ? "mt-16" : "pl-70 pr-30 "} 
        `}>
        {location.pathname === "/Communities" && (
          <ExploreCommunity themeMode={themeMode} />
        )}
        {location.pathname === "/Communities/create-community" && (
          <CreateCommunity themeMode={themeMode} />
        )}
        {location.pathname === "/Communities/joined-communities" && (
          <JoinedCommunities themeMode={themeMode} />
        )}
        {location.pathname === "/Communities/MyOwn-Communities" && (
          <MyOwnCommunities themeMode={themeMode} />
        )}
      </div>

      <RightSideBar themeMode={themeMode} />
    </div>
  );
};

export default Communities;
