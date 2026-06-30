import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  FiMessageSquare,
  FiVideo,
  FiFileText,
  FiUsers,
  FiSettings,
  FiStar,
  FiCalendar,
  FiPieChart,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { BsLightningCharge } from "react-icons/bs";
import { RiRobot2Line } from "react-icons/ri";
import { GiEntryDoor } from "react-icons/gi";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const WorkspaceSideMenu = () => {
  const location = useLocation();
  const { team } = useParams();
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
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(true);
      } else {
        const isChannelActive = location.pathname.includes("/channel/");
        if (isChannelActive) {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [location.pathname]);

  const isChannelActive = location.pathname.includes("/channel/");

  useEffect(() => {
    if (isMobile) {
      if (isChannelActive) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }
  }, [location.pathname, isMobile, isChannelActive]);

  const toggleMenu = () => {
    if (isChannelActive && isMobile) {
      return;
    }
    setIsOpen(!isOpen);
  };

  const getBgColor = () =>
    themeMode === "light" ? "bg-white" : "bg-[#222223]";
  const getBorderColor = () =>
    themeMode === "light" ? "border-blue-200" : "border-cyan-800";
  const getTextColor = () =>
    themeMode === "light" ? "text-slate-700" : "text-gray-300";
  const getActiveTextColor = () =>
    themeMode === "light" ? "text-blue-700" : "text-cyan-400";
  const getActiveBorderColor = () =>
    themeMode === "light" ? "border-blue-500" : "border-cyan-400";
  const getHoverTextColor = () =>
    themeMode === "light" ? "hover:text-blue-600" : "hover:text-cyan-300";
  const getTooltipBg = () =>
    themeMode === "light" ? "bg-black/70" : "bg-[#222223]";
  const getTooltipTextColor = () =>
    themeMode === "light" ? "text-white" : "text-white";
  const getGradientColor = () =>
    themeMode === "light"
      ? "from-blue-500 to-cyan-300"
      : "from-cyan-600 to-cyan-400";
  const getGlowColor = () =>
    themeMode === "light" ? "bg-blue-400" : "bg-cyan-500";
  const getButtonBg = () =>
    themeMode === "light" ? "bg-white/80" : "bg-[#222223]/80";

  const navItems = [
    {
      path: "channel",
      icon: <FiMessageSquare className="w-5 h-5" />,
      tooltip: "Team Chat",
      pulse: true,
    },
    {
      path: "meeting",
      icon: <FiVideo className="w-5 h-5" />,
      tooltip: "Video Calls",
    },
    {
      path: "documents",
      icon: <FiFileText className="w-5 h-5" />,
      tooltip: "Shared Docs",
    },
    {
      path: "members",
      icon: <FiUsers className="w-5 h-5" />,
      tooltip: "Team Members",
    },
  ];

  const menuContent = (
    <>
      <div className="relative ">
        <Link to={"/home"}>
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradientColor()} hover:scale-105 transition-scale duration-300 ease-in-out flex items-center justify-center shadow-lg cursor-pointer`}>
            <GiEntryDoor className="text-white w-7 h-7" />
            <div
              className={`absolute left-full ml-3 px-2 py-1 ${getTooltipBg()} ${getTooltipTextColor()} text-xs rounded-md opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none`}>
              Team Workspace
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center space-y-4 w-full animate-fade-in">
        {navItems.map((item) => {
          if (item.path === "channel") {
            return (
              <Link
                key={item.path}
                to={`/team/${team}/workspace/channel/general-chat`}
                className={`w-full flex justify-center py-2 transition-all duration-200 ${
                  isChannelActive
                    ? `${getActiveTextColor()} border-l-2 ${getActiveBorderColor()}`
                    : `${getTextColor()} ${getHoverTextColor()}`
                }`}>
                <div className="relative group">
                  <div>
                    {item.icon}
                    {item.glow && (
                      <div
                        className={`absolute inset-0 rounded-full ${getGlowColor()} opacity-20 blur-[4px]`}></div>
                    )}
                  </div>
                  <div
                    className={`absolute left-full ml-3 px-2 py-1 ${getTooltipBg()} ${getTooltipTextColor()} text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none`}>
                    {item.tooltip}
                  </div>
                </div>
              </Link>
            );
          }

          const fullPath = `/team/${team}/workspace/${item.path}`;
          const isActive = location.pathname === fullPath;
          return isActive ? (
            <div
              key={item.path}
              className={`w-full flex justify-center py-2 ${getActiveTextColor()} border-l-2 ${getActiveBorderColor()}`}>
              <div className="relative group">
                <div>
                  {item.icon}
                  {item.glow && (
                    <div
                      className={`absolute inset-0 rounded-full ${getGlowColor()} opacity-20 blur-[4px]`}></div>
                  )}
                </div>
                <div
                  className={`absolute left-full ml-3 px-2 py-1 ${getTooltipBg()} ${getTooltipTextColor()} text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none`}>
                  {item.tooltip}
                </div>
              </div>
            </div>
          ) : (
            <Link
              key={item.path}
              to={fullPath}
              className={`w-full flex justify-center py-2 ${getTextColor()} ${getHoverTextColor()} transition-all duration-200`}>
              <div className="relative group">
                <div>
                  {item.icon}
                  {item.glow && (
                    <div
                      className={`absolute inset-0 rounded-full ${getGlowColor()} opacity-20 blur-[4px]`}></div>
                  )}
                </div>
                <div
                  className={`absolute left-full ml-3 px-2 py-1 ${getTooltipBg()} ${getTooltipTextColor()} text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none`}>
                  {item.tooltip}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col items-center space-y-4 w-full">
        <div className="relative group">
          <Link to={`/team/${team}/TeamSettings`}>
            <button
              className={`p-2 ${getTextColor()} ${getHoverTextColor()} transition-colors`}>
              <FiSettings className="w-5 h-5" />
            </button>
            <div
              className={`absolute bottom-5 left-full ml-3 px-2 py-1 ${getTooltipBg()} ${getTooltipTextColor()} text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none`}>
              Settings
            </div>
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <>
      {isMobile && (
        <button
          onClick={toggleMenu}
          className={`fixed top-4 left-4 z-50 p-2.5 rounded-lg ${getButtonBg()} backdrop-blur-sm shadow-lg border ${getBorderColor()} transition-all duration-300 hover:scale-105 ${
            isChannelActive ? "hidden" : ""
          }`}>
          {isOpen ? (
            <FiX className={`w-5 h-5 ${getTextColor()}`} />
          ) : (
            <FiMenu className={`w-5 h-5 ${getTextColor()}`} />
          )}
        </button>
      )}

      {isMobile && isOpen && !isChannelActive && (
        <div
          className={`fixed inset-0 bg-gray-900/40 z-40 transition-all duration-300 ease-in-out0 `}
          onClick={toggleMenu}
        />
      )}

      <div
        className={`
          h-full w-16 fixed flex flex-col items-center py-4 
          ${getBgColor()} border-r ${getBorderColor()} space-y-6 
          transition-all duration-300 ease-in-out
          z-50 
          ${
            isMobile
              ? `transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`
              : "translate-x-0"
          }
        `}>
        {menuContent}
      </div>

      <div
        className={`${!isMobile ? "w-16" : "w-0"} flex-shrink-0 hidden md:block`}
      />
    </>
  );
};

export default WorkspaceSideMenu;
