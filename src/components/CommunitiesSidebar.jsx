import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiCompass,
  FiPlusCircle,
  FiUsers,
  FiTrendingUp,
  FiStar,
  FiChevronLeft,
  FiMenu,
} from "react-icons/fi";
import { useLanguage } from "../context/LanguageContext";

const CommunitiesSidebar = () => {
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

  const { translations, loading: languageLoading } = useLanguage();

  const t = (key, params = {}) => {
    if (languageLoading) return key;
    
    let translation = key.split('.').reduce((obj, k) => obj?.[k], translations) || key;
    
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
    
    return translation;
  };

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
  }, []);

  const navItems = [
    {
      path: "/community/explore",
      icon: <FiCompass className="w-5 h-5" />,
      label: t('communitiesSidebar.exploreAll'),
      color: "from-cyan-500 to-indigo-600",
    },
    {
      path: "/community/popular",
      icon: <FiTrendingUp className="w-5 h-5" />,
      label: t('communitiesSidebar.popular'),
      color: "from-purple-400 to-purple-500",
    },
    {
      path: "/community/joined-communities",
      icon: <FiStar className="w-5 h-5" />,
      label: t('communitiesSidebar.joined'),
      color: "from-purple-300 to-purple-400",
    },
    {
      path: "/community/my-communities",
      icon: <FiUsers className="w-5 h-5" />,
      label: t('communitiesSidebar.myCommunities'),
      color: "from-purple-600 to-purple-700",
    },
  ];

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  if (languageLoading) {
    return (
      <div className="h-screen max-h-230 m-3 ml-2 rounded-2xl bg-gray-800 flex items-center justify-center border-2 border-purple-500/50">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen max-h-230 m-3  ml-2 rounded-2xl bg-gray-800 flex flex-col z-30 border-2 border-purple-500/50
        transition-all duration-500 ease-in-out
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}
        ${collapsed ? "w-16 min-w-16" : "w-67"}
        shadow-lg shadow-purple-900/30`}>
      <div className="p-4 w-full border-b border-gray-700 flex items-center">
        <button
          onClick={toggleSidebar}
          className={`p-1 rounded-full hover:bg-gray-700 transition-colors duration-200 text-purple-300`}
          aria-label={collapsed ? t('communitiesSidebar.expandSidebar') : t('communitiesSidebar.collapseSidebar')}>
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
                  : "text-gray-300 hover:bg-gray-700 hover:text-white hover:scale-[1.03]"
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
                  <span className="ml-auto w-2 h-2 bg-purple-300 rounded-full transition-all duration-300"></span>
                )}
              </>
            )}
          </Link>
        ))}
      </div>

      <div className="p-3 border-t border-purple-500/50">
        <Link
          to="/community/create-community"
          className={`flex items-center justify-center transition-all duration-300
            ${collapsed ? "px-2" : "px-3"}
            py-2 rounded-lg
            ${
              location.pathname === "/community/create-community"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg scale-[1.04]"
                : "bg-gradient-to-r from-cyan-600 to-indigo-700 text-white hover:from-cyan-700 hover:to-indigo-800 shadow-md hover:shadow-lg hover:scale-[1.03]"
            }`}
          title={collapsed ? t('communitiesSidebar.createCommunity') : ""}>
          <FiPlusCircle className="w-5 h-5" />
          {!collapsed && (
            <span className="font-semibold ml-2">{t('communitiesSidebar.createCommunity')}</span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default CommunitiesSidebar;