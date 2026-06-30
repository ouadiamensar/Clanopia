import "./App.css";
import { Routes, Route } from "react-router-dom";
import Reception from "./components/LandingPage";
import Login from "./components/Login";
import Signup from "./components/signup";
import Hone from "./components/Home";
import PrivateRoute from "./components/PrivateRoute";
import CreateTeam from "./components/createTeam";
import Explore from "./components/ExploreTeams";
import TeamPage from "./components/TeamPage";
import MyOwnTeams from "./components/MyOwnTeams";
import Communities from "./components/Communities";
import ProfileManage from "./components/ProfileManage";
import Profile from "./components/profile";
import PostPage from "./components/PostPage";
import ExploreProfiles from "./components/ExploreProfiles";
import ChatsMenu from "./components/ChatsMenu";
import WorkspaceChat from "./components/WorkspaceChat";
import Meeting from "./components/Meeting";
import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import ActiveMeetingMonitor from "./components/ActiveMeetingMonitor";
import ActiveMeetingNotifications from "./components/ActiveMeetingNotifications";
import SharedDocs from "./components/SharedDocs";
import TeamMembers from "./components/TeamMembers";
import CommunityPage from "./components/CommunityPage";
import CommunityPostPage from "./components/CommunityPostPage";
import Settings from "./components/Settings";
import WorkspaceSettings from "./components/WorkspaceSettings";
import CommunitySettings from "./components/CommunitySettings";
import MainProfileInfos from "./components/MainProfileInfos";
import SavesPage from "./components/SavesPage";
import PrivacyAndPolicy from "./components/PrivacyAndPolicy";


function App() {
  // eslint-disable-next-line no-unused-vars
  const [userTeams, setUserTeams] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            const teams = userData.teams || [];
            setUserTeams(teams);

            teams.forEach((teamId) => {
              ActiveMeetingMonitor.startMonitoringTeam(teamId);
            });
          }
        });

        return () => {
          unsubscribeUser();
          ActiveMeetingMonitor.stopAllMonitoring();
        };
      } else {
        ActiveMeetingMonitor.stopAllMonitoring();
        setUserTeams([]);
      }
    });

    return () => {
      unsubscribeAuth();
      ActiveMeetingMonitor.stopAllMonitoring();
    };
  }, []);
  return (
    <>
      <ActiveMeetingNotifications />
      <Routes>
        <Route path="/" element={<Reception />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/ProfileMainInfos" element={<MainProfileInfos />} />
        <Route path="/Privacy&Policy" element={<PrivacyAndPolicy />} />

        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Hone />
            </PrivateRoute>
          }
        />
        <Route
          path="/createTeam"
          element={
            <PrivateRoute>
              <CreateTeam />
            </PrivateRoute>
          }
        />
        <Route
          path="/exploreteam"
          element={
            <PrivateRoute>
              <Explore />
            </PrivateRoute>
          }
        />
        <Route
          path="/teams/:id"
          element={
            <PrivateRoute>
              <TeamPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/myteams"
          element={
            <PrivateRoute>
              <MyOwnTeams />
            </PrivateRoute>
          }
        />
        <Route
          path="/Communities"
          element={
            <PrivateRoute>
              <Communities />
            </PrivateRoute>
          }
        />
        <Route
          path="/Communities/create-community"
          element={
            <PrivateRoute>
              <Communities />
            </PrivateRoute>
          }
        />
        <Route
          path="/Communities/joined-communities"
          element={
            <PrivateRoute>
              <Communities />
            </PrivateRoute>
          }
        />
        <Route
          path="/Communities/MyOwn-Communities"
          element={
            <PrivateRoute>
              <Communities />
            </PrivateRoute>
          }
        />
        <Route
          path="/communitySettings/:category/:communityId"
          element={
            <PrivateRoute>
              <CommunitySettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/editProfile"
          element={
            <PrivateRoute>
              <ProfileManage />
            </PrivateRoute>
          }
        />
        <Route
          path="/post/:userId/:postId"
          element={
            <PrivateRoute>
              <PostPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/exploreProfiles"
          element={
            <PrivateRoute>
              <ExploreProfiles />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <PrivateRoute>
              <ChatsMenu />
            </PrivateRoute>
          }
        />

        <Route
          path="/team/:team/workspace/channel/:channel"
          element={
            <PrivateRoute>
              <WorkspaceChat />
            </PrivateRoute>
          }
        />
        <Route
          path="/team/:team/workspace/meeting"
          element={
            <PrivateRoute>
              <Meeting />
            </PrivateRoute>
          }
        />
        <Route
          path="/team/:team/workspace/documents"
          element={
            <PrivateRoute>
              <SharedDocs />
            </PrivateRoute>
          }
        />
        <Route
          path="/team/:team/workspace/members"
          element={
            <PrivateRoute>
              <TeamMembers />
            </PrivateRoute>
          }
        />
        <Route
          path="/community/:category/:id/:communityName"
          element={
            <PrivateRoute>
              <CommunityPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/community/:category/:communityId/:communityName/:authorName/:PostId"
          element={
            <PrivateRoute>
              <CommunityPostPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/Settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/team/:team/teamSettings"
          element={
            <PrivateRoute>
              <WorkspaceSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/Saves"
          element={
            <PrivateRoute>
              <SavesPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
