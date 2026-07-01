/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/Clanopia.png";
import {
  FiUsers,
  FiMessageSquare,
  FiTrendingUp,
  FiAward,
  FiChevronRight,
  FiStar,
  FiZap,
  FiGlobe,
  FiCode,
  FiBriefcase,
  FiPlay,
  FiArrowRight,
  FiCheckCircle,
  FiCalendar,
  FiClock,
  FiUserPlus,
  FiLayers,
  FiX,
  FiInfo,
  FiVideo,
  FiExternalLink,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import {
  FaDiscord,
  FaGithub,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaRocket,
} from "react-icons/fa";
import MainPage1 from "../assets/ImagePage1.jpeg";
import MainPage2 from "../assets/ImagePage2.png";
import MainPage3 from "../assets/ImagePage3.png";
import MainPage4 from "../assets/ImagePage4.png";
import MainPage5 from "../assets/ImagePage5.png";

import SeeUsCooking from "../assets/SeeUsCooking.mp4";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem("themeMode");
    return savedTheme || "light";
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = themeMode === "light" ? "dark" : "light";
    setThemeMode(newTheme);
    localStorage.setItem("themeMode", newTheme);
  };

  const getBgColor = () =>
    themeMode === "light" ? "bg-gray-50" : "bg-[#1e1e1f]";
  const getCardBg = () => (themeMode === "light" ? "bg-white" : "bg-[#222223]");
  const getCardBgAlt = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getBorderColor = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () =>
    themeMode === "light" ? "text-gray-900" : "text-white";
  const getSecondaryTextColor = () =>
    themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getGradientBg = () =>
    themeMode === "light"
      ? "bg-gradient-to-r from-gray-700 to-gray-900"
      : "bg-gradient-to-r from-cyan-600 to-blue-700";
  const getGradientText = () =>
    themeMode === "light"
      ? "from-gray-700 to-gray-900"
      : "from-cyan-400 to-purple-400";
  const getHeaderBg = () =>
    themeMode === "light"
      ? "bg-white/90 backdrop-blur-xl"
      : "bg-[#1e1e1f]/90 backdrop-blur-xl";
  const getButtonPrimary = () =>
    themeMode === "light"
      ? "bg-gray-800 hover:bg-gray-900 text-white"
      : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:shadow-lg hover:shadow-cyan-500/30";
  const getButtonSecondary = () =>
    themeMode === "light"
      ? "border-gray-300 text-gray-700 hover:bg-gray-100"
      : "border-gray-600 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 hover:bg-cyan-500/10";
  const getButtonOutline = () =>
    themeMode === "light"
      ? "border-gray-300 text-gray-700 hover:bg-gray-100"
      : "border-gray-600 text-gray-300 hover:border-cyan-400 hover:text-cyan-400";
  const getFeatureBg = () =>
    themeMode === "light"
      ? "bg-gray-100/80 backdrop-blur-xl"
      : "bg-[#222223]/80 backdrop-blur-xl";
  const getFeatureBorder = () =>
    themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getFooterBg = () =>
    themeMode === "light" ? "bg-gray-100" : "bg-[#1e1e1f]/50";

  const siteImages = [
    {
      url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
      title: "Team Collaboration",
      description: "Work together seamlessly",
    },
    {
      url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800",
      title: "Community Building",
      description: "Connect with like-minded people",
    },
    {
      url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
      title: "Project Management",
      description: "Organize and track progress",
    },
    {
      url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
      title: "Learning Together",
      description: "Grow your skills as a team",
    },
  ];

  const MainPages = [
    {
      url: MainPage3,
      title: "Team Building",
      description: "Work together seamlessly",
    },
    {
      url: MainPage2,
      title: "Community Building",
      description: "Connect with like-minded people",
    },
    {
      url: MainPage4,
      title: "Project Management",
      description: "Organize and track progress",
    },
    {
      url: MainPage5,
      title: "Learning Together",
      description: "Grow your skills as a team",
    },
  ];

  const features = [
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: "Communities",
      description:
        "Create or join communities around specific topics and interests.",
      color:
        themeMode === "light"
          ? "from-gray-600 to-gray-800"
          : "from-cyan-500 to-blue-500",
      details:
        "Communities are the heart of Clanopia. Create your own community around any topic - from programming to photography, from gaming to business. Invite members, share resources, and build a thriving space where ideas flourish.",
    },
    {
      icon: <FiLayers className="w-8 h-8" />,
      title: "Team Workspaces",
      description:
        "Complete workspaces with tasks, files, members, and meetings.",
      color:
        themeMode === "light"
          ? "from-gray-600 to-gray-800"
          : "from-purple-500 to-pink-500",
      details:
        "Team Workspaces are your all-in-one collaboration hub. Manage projects with , share files seamlessly, schedule meetings, and track progress . Every workspace includes integrated chat, to keep your team aligned.",
    },
    {
      icon: <FiUserPlus className="w-8 h-8" />,
      title: "Smart Profiles",
      description: "Showcase your skills, experience, ...",
      color:
        themeMode === "light"
          ? "from-gray-600 to-gray-800"
          : "from-orange-500 to-red-500",
      details:
        "Your profile is your digital identity on Clanopia. Showcase your skills, work experience, educational background, and portfolio. Connect with other professionals, display your projects, and get discovered by teams looking for your expertise.",
    },
    {
      icon: <FiMessageSquare className="w-8 h-8" />,
      title: "Real-time Chat",
      description: "Instant messaging with file sharing and notifications.",
      color:
        themeMode === "light"
          ? "from-gray-600 to-gray-800"
          : "from-green-500 to-emerald-500",
      details:
        "Stay connected with your team and friends through real-time messaging. Send direct messages, share files instantly, and receive notifications. Features include message threading, reactions, voice messages, and end-to-end encryption for secure communication.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Create Profile",
      description:
        "Build your profile with skills, experiences, and interests.",
      icon: <FiUserPlus />,
    },
    {
      number: "02",
      title: "Join Communities",
      description: "Discover and join communities that match your interests.",
      icon: <FiGlobe />,
    },
    {
      number: "03",
      title: "Form Teams",
      description: "Create teams or join existing ones to work on projects.",
      icon: <FiUsers />,
    },
    {
      number: "04",
      title: "Collaborate",
      description: "Use our tools to chat, share files, and manage tasks.",
      icon: <FaRocket />,
    },
  ];

  return (
    <div
      className={`min-h-screen ${getBgColor()} ${getTextColor()} transition-colors duration-300 overflow-x-hidden`}>
      {selectedFeature && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedFeature(null)}>
          <div
            className={`relative max-w-2xl w-full ${getCardBg()} rounded-3xl p-8 border ${getBorderColor()} shadow-2xl shadow-cyan-500/20 transform transition-all duration-500 scale-100`}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-6">
              <div
                className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-r ${selectedFeature.color} p-4 flex items-center justify-center shadow-lg shadow-cyan-500/20`}>
                <div className="text-white text-3xl">
                  {selectedFeature.icon}
                </div>
              </div>
              <div className="flex-1">
                <h3 className={`text-3xl font-bold mb-3 ${getTextColor()}`}>
                  {selectedFeature.title}
                </h3>
                <p
                  className={`${getSecondaryTextColor()} text-lg leading-relaxed mb-4`}>
                  {selectedFeature.details}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">
                    ✨ Available Now
                  </span>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <Link to="/signup">
                    <button className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
                      Try Now
                    </button>
                  </Link>
                  <button
                    onClick={() => setSelectedFeature(null)}
                    className={`px-6 py-2 rounded-full border ${getBorderColor()} ${getSecondaryTextColor()} text-sm font-medium hover:border-cyan-400 hover:text-cyan-400 transition-all`}>
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-2 -left-2 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>
            <div className="absolute -top-2 -right-2 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      )}

      {showVideoModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn"
          onClick={() => setShowVideoModal(false)}>
          <div
            className={`relative max-w-4xl w-full ${getCardBg()} rounded-3xl p-4 border ${getBorderColor()} shadow-2xl shadow-cyan-500/20`}
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-4 -right-4 p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-lg z-10">
              <FiX className="w-6 h-6 text-white" />
            </button>
            <div className="aspect-video w-full rounded-2xl overflow-hidden">
              <video
                src={SeeUsCooking}
                controls
                className="w-full h-full"
                autoPlay={false}
                loop={false}>
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h4 className={`text-xl font-bold ${getTextColor()}`}>
                  Clanopia
                </h4>
                <p className={`${getSecondaryTextColor()} text-sm`}>
                  Watch how Clanopia can transform your team collaboration
                </p>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className={`px-6 py-2 rounded-full ${getCardBgAlt()} ${getTextColor()} hover:${getCardBg()} transition-colors`}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <header
        className={`fixed w-full ${getHeaderBg()} border-b ${getBorderColor()} z-50 transition-colors duration-300`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Clanopia"
              className="w-40 h-auto object-contain transition-opacity duration-500"
            />
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className={`${getSecondaryTextColor()} hover:text-cyan-400 transition-colors duration-300 text-sm font-medium`}>
              Features
            </a>
            <a
              href="#goals"
              className={`${getSecondaryTextColor()} hover:text-cyan-400 transition-colors duration-300 text-sm font-medium`}>
              Goals
            </a>
            <a
              href="#Tour"
              className={`${getSecondaryTextColor()} hover:text-cyan-400 transition-colors duration-300 text-sm font-medium`}>
              Tour
            </a>
            <a
              href="#how-it-works"
              className={`${getSecondaryTextColor()} hover:text-cyan-400 transition-colors duration-300 text-sm font-medium`}>
              How It Works
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full transition-all duration-300 ${
                themeMode === "light"
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-[#252527] text-yellow-400 hover:bg-[#2c2d2e]"
              }`}
              aria-label="Toggle theme">
              {themeMode === "light" ? (
                <FiMoon className="w-5 h-5" />
              ) : (
                <FiSun className="w-5 h-5" />
              )}
            </button>

            <Link to="/Login">
              <button
                className={`px-6 py-2 rounded-full border ${getButtonOutline()} transition-all duration-300 text-sm font-medium`}>
                Login
              </button>
            </Link>
            <Link to="/signup">
              <button
                className={`px-6 py-2 rounded-full ${getButtonPrimary()} transition-all duration-300 text-sm font-medium`}>
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <div
                className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  Build Your
                  <span
                    className={`bg-gradient-to-r ${getGradientText()} bg-clip-text text-transparent`}>
                    {" "}
                    Dream Team
                  </span>
                  <br />
                  <span className="text-4xl md:text-5xl text-gray-400">
                    for Learning & Working
                  </span>
                </h1>

                <p
                  className={`text-xl ${getSecondaryTextColor()} mb-8 max-w-2xl mx-auto lg:mx-0`}>
                  The ultimate platform to form collaborative teams, join
                  communities, and work on projects together. Connect with
                  like-minded individuals and bring your ideas to life.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link to="/signup">
                    <button className="group px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 flex items-center gap-2">
                      Get Started
                      <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <button
                    onClick={() => setShowVideoModal(true)}
                    className={`px-8 py-4 rounded-full border ${getButtonSecondary()} transition-all duration-300 flex items-center gap-2`}>
                    <FiPlay className="text-cyan-400" />
                    See us cooking
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div
                className={`relative ${getCardBg()} backdrop-blur-xl rounded-3xl p-6 border ${getBorderColor()} shadow-2xl`}>
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-cyan-500/20 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-purple-500/20 rounded-full blur-xl"></div>

                <div className="flex justify-between items-center mb-6">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-sm text-cyan-400 font-mono">
                    Clanopia.com/Workspace
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div
                    className={`col-span-3 ${getCardBgAlt()} rounded-xl p-3`}>
                    <div className="text-xs text-cyan-400 mb-3 font-medium">
                      Text Channels
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-cyan-500/10">
                        <div className="w-1 h-4 bg-cyan-400 rounded-full"></div>
                        <span className="text-sm text-cyan-400"># general</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-600/20 transition-colors">
                        <div className="w-1 h-4 bg-purple-400 rounded-full"></div>
                        <span className={`text-sm ${getSecondaryTextColor()}`}>
                          # projects
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-600/20 transition-colors">
                        <div className="w-1 h-4 bg-green-400 rounded-full"></div>
                        <span className={`text-sm ${getSecondaryTextColor()}`}>
                          # resources
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`col-span-9 ${getCardBgAlt()} rounded-xl p-3`}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-xs text-purple-400 font-medium">
                        # general
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-cyan-500/30 border-2 border-gray-800"></div>
                          <div className="w-6 h-6 rounded-full bg-purple-500/30 border-2 border-gray-800"></div>
                          <div className="w-6 h-6 rounded-full bg-pink-500/30 border-2 border-gray-800"></div>
                        </div>
                        <div className={`text-xs ${getSecondaryTextColor()}`}>
                          +12 online
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400">
                          M
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-cyan-400">
                              Mohamed
                            </span>
                            <span
                              className={`text-xs ${getSecondaryTextColor()}`}>
                              2:30 PM
                            </span>
                          </div>
                          <div
                            className={`${getCardBg()} rounded-xl p-2 max-w-xs`}>
                            <p className={`text-sm ${getTextColor()}`}>
                              When's our next meeting?
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 justify-end">
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span
                              className={`text-xs ${getSecondaryTextColor()}`}>
                              2:31 PM
                            </span>
                            <span className="text-sm font-medium text-purple-400">
                              You
                            </span>
                          </div>
                          <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl p-2 max-w-xs">
                            <p className={`text-sm ${getTextColor()}`}>
                              How about tomorrow at 3PM?
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-400">
                          Y
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"></div>
        <div className="container mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Powerful{" "}
              <span
                className={`bg-gradient-to-r ${getGradientText()} bg-clip-text text-transparent`}>
                Features
              </span>
            </h2>
            <p
              className={`text-xl ${getSecondaryTextColor()} max-w-3xl mx-auto`}>
              Everything you need to build, manage, and grow your teams and
              communities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                onClick={() => setSelectedFeature(feature)}
                className={`group ${getFeatureBg()} rounded-2xl p-6 border ${getFeatureBorder()} hover:border-cyan-500/50 transition-all duration-500 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer`}>
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${getTextColor()}`}>
                  {feature.title}
                </h3>
                <p
                  className={`${getSecondaryTextColor()} text-sm leading-relaxed`}>
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center text-cyan-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Learn more{" "}
                  <FiChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="goals" className={`py-20 px-4 ${getCardBgAlt()}`}>
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span
                className={`bg-gradient-to-r ${getGradientText()} bg-clip-text text-transparent`}>
                Goals
              </span>
            </h2>
            <p
              className={`text-xl ${getSecondaryTextColor()} max-w-3xl mx-auto`}>
              Learn about what our platform is looking for to benefit its users.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {siteImages.map((image, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl cursor-pointer"
                onMouseEnter={() => setActiveImage(index)}>
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-xl font-bold text-white">
                      {image.title}
                    </h3>
                    <p className="text-gray-300 text-sm">{image.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="Tour" className={`py-20 px-4 ${getCardBgAlt()}`}>
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span
                className={`bg-gradient-to-r ${getGradientText()} bg-clip-text text-transparent`}>
                Platform Tour
              </span>
            </h2>
            <p
              className={`text-xl ${getSecondaryTextColor()} max-w-3xl mx-auto`}>
              A sneak peek into your future collaborative ecosystem. Beautiful,
              modern, and built for ultimate productivity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {MainPages.map((image, index) => (
              <div
                key={index}
                className="group relative overflow-hidden h-fit rounded-2xl cursor-pointer"
                onMouseEnter={() => setActiveImage(index)}>
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-fit object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-xl font-bold text-white">
                      {image.title}
                    </h3>
                    <p className="text-gray-300 text-sm">{image.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center ">
            <p
              className={`text-xl mt-15 ${getSecondaryTextColor()} max-w-3xl mx-auto`}>
              If this has impressed you, then this is just a small part of our
              advantages.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How{" "}
              <span
                className={`bg-gradient-to-r ${getGradientText()} bg-clip-text text-transparent`}>
                Clanopia
              </span>{" "}
              Works
            </h2>
            <p
              className={`text-xl ${getSecondaryTextColor()} max-w-3xl mx-auto`}>
              Simple steps to create your team or join existing communities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 left-[70%] w-[30%] h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
                )}
                <div className="text-center group">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                    <div
                      className={`relative w-20 h-20 rounded-full ${getCardBg()} border ${getBorderColor()} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                      <span className="text-2xl text-cyan-400">
                        {step.icon}
                      </span>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                        {step.number}
                      </div>
                    </div>
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${getTextColor()}`}>
                    {step.title}
                  </h3>
                  <p className={`${getSecondaryTextColor()} text-sm`}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto text-center relative">
          <div
            className={`${getCardBg()} rounded-3xl p-12 md:p-16 border ${getBorderColor()} shadow-2xl`}>
            <h2
              className={`text-4xl md:text-5xl font-bold mb-6 ${getTextColor()}`}>
              Ready to Build Your <br />
              <span
                className={`bg-gradient-to-r ${getGradientText()} bg-clip-text text-transparent`}>
                Dream Team
              </span>
              ?
            </h2>
            <p
              className={`text-xl ${getSecondaryTextColor()} max-w-2xl mx-auto mb-10`}>
              Join thousands of people who share the same ambition and cooperate
              together to succeed on Clanopia
            </p>
            <Link to="/signup">
              <button className="group px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 text-lg flex items-center gap-3 mx-auto">
                Get Started for Free
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <div
              className={`flex items-center justify-center gap-4 mt-6 text-sm ${getSecondaryTextColor()}`}>
              <FiCheckCircle className="text-cyan-400" />
              <span>No credit card required</span>
              <span className="w-px h-4 bg-gray-600"></span>
              <FiCheckCircle className="text-cyan-400" />
              <span>Free forever plan</span>
            </div>
          </div>
        </div>
      </section>

      <footer
        className={`${getFooterBg()} border-t ${getBorderColor()} py-12 px-4 transition-colors duration-300`}>
        <div className="container mx-auto">
          <div className="w-full flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src={logo} alt="Clanopia" className="w-32 h-auto" />
            </div>
            <p
              className={`${getSecondaryTextColor()} text-sm max-w-xs mx-auto`}>
              Build your dream team for learning and working together.
            </p>
          </div>

          <div
            className={`border-t ${getBorderColor()} mt-8 pt-8 text-center ${getSecondaryTextColor()} text-sm`}>
            <p>
              © {new Date().getFullYear()} Clanopia
              <span className="hidden md:inline mx-2">•</span>
              <span className="hidden md:inline">Built with ❤️</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
