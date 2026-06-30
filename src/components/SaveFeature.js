// src/services/saveService.js
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

/**
 * @param {string} itemId 
 * @param {string} type 
 * @param {Object} itemData 
 * @param {string} [subCollection] 
 * @param {string} [subId] 
 */
export async function saveItem(itemId, type, itemData, subCollection = null, subId = null) {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("User not authenticated");
      return false;
    }

    let savePath = `users/${userId}/saves`;
    
    const saveRef = doc(db, savePath, type, itemId);
    
    const saveData = {
      id: itemId,
      type: type,
      savedAt: new Date(),
      data: itemData,
      ...(subCollection && { subCollection }),
      ...(subId && { subId }),
      savedBy: userId,
    };

    await setDoc(saveRef, saveData);
    console.log(`✅ ${type} saved successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Error saving ${type}:`, error);
    return false;
  }
}

/**
 * إلغاء حفظ عنصر
 * @param {string} itemId
 * @param {string} type
 */
export async function unsaveItem(itemId, type) {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("User not authenticated");
      return false;
    }

    const savePath = `users/${userId}/saves`;
    const saveRef = doc(db, savePath, type, itemId);
    
    await deleteDoc(saveRef);
    console.log(`✅ ${type} unsaved successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Error unsaving ${type}:`, error);
    return false;
  }
}

/**

 * @param {string} itemId 
 * @param {string} type 
 */
export async function isItemSaved(itemId, type) {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return false;

    const savePath = `users/${userId}/saves`;
    const saveRef = doc(db, savePath, type, itemId);
    const docSnap = await getDoc(saveRef);
    
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking save status:", error);
    return false;
  }
}

/**
 * @param {string} type
 */
export async function getSavedItems(type) {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const savePath = `users/${userId}/saves`;
    const savesRef = collection(db, savePath, type);
    const querySnapshot = await getDocs(savesRef);
    
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    return items;
  } catch (error) {
    console.error("Error fetching saved items:", error);
    return [];
  }
}

/**

 * @param {string} type 
 * @param {Function} callback
 */
export function listenToSavedItems(type, callback) {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    callback([]);
    return () => {};
  }

  const savePath = `users/${userId}/saves`;
  const savesRef = collection(db, savePath, type);
  
  return onSnapshot(savesRef, (snapshot) => {
    const items = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    callback(items);
  }, (error) => {
    console.error("Error listening to saved items:", error);
    callback([]);
  });
}