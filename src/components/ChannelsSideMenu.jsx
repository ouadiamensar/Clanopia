import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiPlusCircle,
  FiStar,
  FiChevronLeft,
  FiMenu,
} from "react-icons/fi";
import { BsChatLeftHeartFill } from "react-icons/bs";
import { PiCallBell } from "react-icons/pi";
import { LucideFileSpreadsheet } from "lucide-react";

const ChannelsSideMenu = () => {
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
  }, []);

  const navItems = [
    {
      label: "General-chat",
      color: "from-indigo-500 to-blue-500",
    },
    {
      label: "announcement",
      color: "from-pink-500 to-rose-500",
    },
    {
      label: "tools",
      color: "from-amber-500 to-yellow-500",
    },
    
  ];

  const toggleSidebar = () => setCollapsed((prev) => !prev);
  return (
    <div
      className={`h-full w-15 rounded-2xl bg-gradient-to-b from-gray-50 to-white flex flex-col z-30  border-2 border-purple-400
        transition-all duration-500 ease-in-out
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}
        ${collapsed ? "w-16 min-w-16" : "w-67"}
        shadow-lg`}>
      <div className="p-4 w-full border-b border-gray-200 flex items-center">
        <button
          onClick={toggleSidebar}
          className={` p-1 rounded-full hover:bg-gray-200 transition-colors duration-200`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? (
            <FiMenu className="w-5 h-5" />
          ) : (
            <FiChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto py-4 px-2 space-y-1`}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center transition-all duration-300 group
              ${collapsed ? "justify-center px-2" : "px-4"}
              py-3 rounded-lg
              ${
                location.pathname === item.path
                  ? `bg-gradient-to-r ${item.color} text-white shadow-md scale-[1.04]`
                  : "text-gray-600 hover:bg-gray-200 hover:scale-[1.03]"
              }`}
            title={collapsed ? item.label : ""}>
            <span
              className={`transition-colors duration-300 ${
                collapsed ? "" : "mr-3"
              } ${
                location.pathname === item.path
                  ? "text-white"
                  : `text-${item.color.split(" ")[1]}`
              }`}>
              {item.icon}
            </span>
            {!collapsed && (
              <>
                <span className="font-medium">{item.label}</span>
                {location.pathname === item.path && (
                  <span className="ml-auto w-2 h-2 bg-white rounded-full transition-all duration-300"></span>
                )}
              </>
            )}
          </Link>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200">
        <Link
          to="/Communities/create-community"
          className={`flex items-center justify-center transition-all duration-300
            ${collapsed ? "px-2" : "px-3"}
            py-2 rounded-lg
            ${
              location.pathname === "/Communities/create-community"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg scale-[1.04]"
                : "bg-gradient-to-r from-orange-600 to-yellow-600 text-white hover:from-orange-700 hover:to-yellow-700 shadow-md hover:shadow-lg hover:scale-[1.03]"
            }`}
          title={collapsed ? "Create Community" : ""}>
          <FiPlusCircle className="w-5 h-5" />
          {!collapsed && (
            <span className="font-semibold ml-2">Create new channel</span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default ChannelsSideMenu;
