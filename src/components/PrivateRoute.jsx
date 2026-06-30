/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, "users", user.uid, "profile", "data");
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          
          console.log(profileData)

          const requiredFields = {
            name: profileData.name,
            ProfileImageURL: profileData.ProfileImageURL,
            BannerImageURL: profileData.BannerImageURL
          };
          
          const allFieldsPresent = Object.values(requiredFields).every(
            value => value && value.toString().trim() !== ""
          );
          
          setIsProfileComplete(allFieldsPresent);
        } else {
          setIsProfileComplete(false);
        }
      } catch (error) {
        console.error("Error checking profile completion:", error);
        setIsProfileComplete(true);
      } finally {
        setProfileLoading(false);
      }
    };

    checkProfileCompletion();
  }, [user]);

  

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isProfileComplete) {
    return <Navigate to="/ProfileMainInfos" />;
  }

  return children;
};

export default ProtectedRoute;