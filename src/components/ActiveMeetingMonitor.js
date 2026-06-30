import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

class ActiveMeetingMonitor {
  constructor() {
    this.activeMeetings = new Map(); 
    this.unsubscribeFunctions = new Map(); 
  }

  startMonitoringTeam(teamId) {
    if (this.unsubscribeFunctions.has(teamId)) {
      return;
    }

    const meetingsRef = collection(db, "teams", teamId, "meetings");
    const q = query(
      meetingsRef,
      where("status", "==", "In Progress")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const meeting = { id: change.doc.id, ...change.doc.data() };
        
        if (change.type === "added") {
          this.handleNewActiveMeeting(teamId, meeting);
        } else if (change.type === "modified") {
          this.handleUpdatedActiveMeeting(teamId, meeting);
        } else if (change.type === "removed") {
          this.handleEndedActiveMeeting(teamId, meeting);
        }
      });
    });

    this.unsubscribeFunctions.set(teamId, unsubscribe);
  }

  stopMonitoringTeam(teamId) {
    const unsubscribe = this.unsubscribeFunctions.get(teamId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribeFunctions.delete(teamId);
    }
  }

  async handleNewActiveMeeting(teamId, meeting) {
    this.activeMeetings.set(meeting.id, { teamId, meeting });
    
    try {
      const teamDoc = await getDoc(doc(db, "teams", teamId));
      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        this.notifyTeamMembers(teamId, teamData.members || [], meeting);
      }
    } catch (error) {
      console.error("Error getting team data:", error);
    }
  }

  handleUpdatedActiveMeeting(teamId, meeting) {
    this.activeMeetings.set(meeting.id, { teamId, meeting });
  }

  handleEndedActiveMeeting(teamId, meeting) {
    this.activeMeetings.delete(meeting.id);
  }

  notifyTeamMembers(teamId, members, meeting) {
    members.forEach(userId => {
      this.sendNotificationToUser(userId, teamId, meeting);
    });
  }

  sendNotificationToUser(userId, teamId, meeting) {

    const meetingStartedEvent = new CustomEvent('activeMeetingStarted', {
      detail: {
        userId,
        teamId,
        meeting
      }
    });
    
    window.dispatchEvent(meetingStartedEvent);
    
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Meeting Started", {
        body: `Meeting "${meeting.title}" has started in ${meeting.channel} channel.`,
        icon: "/icon-192.png",
        tag: `meeting-${meeting.id}`
      });
    }
  }

  getActiveMeetings() {
    return Array.from(this.activeMeetings.values());
  }

  stopAllMonitoring() {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions.clear();
    this.activeMeetings.clear();
  }
}

export default new ActiveMeetingMonitor();