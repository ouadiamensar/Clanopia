import React, { useState, useEffect } from 'react';
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, increment, setDoc } from "firebase/firestore";
import { FaVideo, FaTimes, FaUserPlus, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { MdOutlineMeetingRoom } from 'react-icons/md';

const ActiveMeetingNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [teamNamesCache, setTeamNamesCache] = useState({});
  const [joinedMeetings, setJoinedMeetings] = useState(new Set());
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
    });

    const handleActiveMeeting = async (event) => {
      const { userId, teamId, meeting } = event.detail;
      
      if (currentUserId && userId === currentUserId) {
        const teamName = await getTeamName(teamId);
        
        setNotifications(prev => [
          ...prev,
          {
            id: `${meeting.id}-${Date.now()}`,
            type: 'active_meeting',
            title: '🔴 Meeting Started',
            message: `"${meeting.title}" has started in ${teamName}`,
            meeting,
            teamId,
            teamName,
            timestamp: new Date(),
            isJoined: false,
            participants: meeting.participants || 0
          }
        ]);

        if (Notification.permission === "granted") {
          new Notification(`Meeting Started: ${meeting.title}`, {
            body: `Join the meeting in ${teamName} team`,
            icon: '🔴'
          });
        }
      }
    };

    const getTeamName = async (teamId) => {
      if (teamNamesCache[teamId]) {
        return teamNamesCache[teamId];
      }

      try {
        const teamDoc = await getDoc(doc(db, "teams", teamId));
        if (teamDoc.exists()) {
          const teamData = teamDoc.data();
          const teamName = teamData.name || "Unknown Team";
          
          setTeamNamesCache(prev => ({
            ...prev,
            [teamId]: teamName
          }));
          
          return teamName;
        }
        return "Unknown Team";
      } catch (error) {
        console.error("Error fetching team name:", error);
        return "Unknown Team";
      }
    };

    window.addEventListener('activeMeetingStarted', handleActiveMeeting);
    
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      unsubscribeAuth();
      window.removeEventListener('activeMeetingStarted', handleActiveMeeting);
    };
  }, [currentUserId, teamNamesCache]);

  const incrementParticipants = async (teamId, meetingId) => {
    if (!teamId || !meetingId) {
      console.error("Missing teamId or meetingId");
      return false;
    }

    try {
      const meetingRef = doc(db, "teams", teamId, "meetings", meetingId);
      
      const joinKey = `${teamId}_${meetingId}`;
      if (joinedMeetings.has(joinKey)) {
        console.log("User already joined this meeting");
        return false;
      }

      const meetingSnapshot = await getDoc(meetingRef);
      
      if (meetingSnapshot.exists()) {
        const meetingData = meetingSnapshot.data();
        
        if (meetingData.participants === undefined) {
          await setDoc(meetingRef, { participants: 1 }, { merge: true });
        } else {
          await updateDoc(meetingRef, {
            participants: increment(1)
          });
        }
        
        const joinedUsersRef = doc(db, "teams", teamId, "meetings", meetingId, "participants", currentUserId);
        await setDoc(joinedUsersRef, {
          userId: currentUserId,
          joinedAt: new Date().toISOString(),
          userEmail: auth.currentUser?.email || 'unknown'
        }, { merge: true });

        setJoinedMeetings(prev => new Set([...prev, joinKey]));
        
        const updatedSnapshot = await getDoc(meetingRef);
        const updatedData = updatedSnapshot.data();
        
        return { 
          success: true, 
          participants: updatedData?.participants || 0 
        };
      } else {
        console.error("Meeting document does not exist");
        return { success: false, error: "Meeting not found" };
      }
    } catch (error) {
      console.error("Error incrementing participants:", error);
      return { success: false, error: error.message };
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const joinMeeting = async (notification) => {
    if (isJoining) return;
    
    setIsJoining(true);
    
    try {
      const result = await incrementParticipants(
        notification.teamId,
        notification.meeting.id
      );

      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notification.id 
              ? { 
                  ...notif, 
                  isJoined: true, 
                  participants: result.participants || (notification.meeting.participants || 0) + 1 
                }
              : notif
          )
        );

        if (notification.meeting.meetingLink) {
          window.open(notification.meeting.meetingLink, '_blank');
        } else {
          alert('No meeting link available. Please check with the organizer.');
        }

        setTimeout(() => {
          removeNotification(notification.id);
        }, 5000);
      } else {
        const joinKey = `${notification.teamId}_${notification.meeting.id}`;
        if (joinedMeetings.has(joinKey)) {
          alert('You have already joined this meeting!');
          if (notification.meeting.meetingLink) {
            window.open(notification.meeting.meetingLink, '_blank');
          }
        } else {
          alert(`Failed to join meeting: ${result.error || 'Please try again.'}`);
        }
      }
    } catch (error) {
      console.error("Error joining meeting:", error);
      alert('Failed to join meeting. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-3">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className="bg-gray-900/95 backdrop-blur-sm border-l-4 border-sky-500 rounded-xl shadow-2xl p-5 animate-slide-in-right transition-all duration-300 hover:scale-105"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <h3 className="font-bold text-white text-lg flex items-center">
                  <FaVideo className="mr-2 text-sky-400" />
                  {notification.title}
                </h3>
              </div>

              <p className="text-gray-300 text-sm mb-2">{notification.message}</p>

              <div className="bg-gray-800/50 rounded-lg p-3 mb-3 space-y-1.5">
                <div className="flex items-center text-sm text-gray-300">
                  <MdOutlineMeetingRoom className="mr-2 text-sky-400" />
                  <span>Team: <span className="text-white font-medium">{notification.teamName}</span></span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <FaClock className="mr-2 text-sky-400" />
                  <span>Duration: <span className="text-white font-medium">{notification.meeting.duration} min</span></span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <FaCalendarAlt className="mr-2 text-sky-400" />
                  <span>Started: <span className="text-white font-medium">{formatTime(notification.timestamp)}</span></span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <FaUserPlus className="mr-2 text-sky-400" />
                  <span>Participants: <span className="text-white font-medium">
                    {notification.isJoined 
                      ? notification.participants 
                      : (notification.meeting.participants || 0)}
                  </span></span>
                </div>
                {notification.isJoined && (
                  <div className="flex items-center text-sm text-green-400">
                    <span className="mr-2">✓</span>
                    <span>You have joined this meeting</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => joinMeeting(notification)}
                  disabled={isJoining || notification.isJoined}
                  className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 ${
                    notification.isJoined
                      ? 'bg-green-600 hover:bg-green-700 cursor-default'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 hover:scale-105'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isJoining ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Joining...
                    </>
                  ) : notification.isJoined ? (
                    <>
                      <FaUserPlus /> Joined ✓
                    </>
                  ) : (
                    <>
                      <FaVideo /> Join Meeting
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-all hover:scale-105 flex items-center gap-2"
                >
                  <FaTimes /> Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActiveMeetingNotifications;