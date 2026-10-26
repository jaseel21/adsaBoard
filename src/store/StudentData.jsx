import { createContext, useState, useEffect, useCallback, useRef } from "react";
import firebase from "../firebase/config";

export const DataOfOne = createContext(null);

const STORAGE_KEY = 'adsa_student_session';

export function PersonInfo({ children }) {
  const [stdata, setStdataState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse student session:', e);
      }
    }
    return null;
  });

  const activeListenerRef = useRef(null);

  // Live real-time student document subscriber
  useEffect(() => {
    // If no student is logged in, cleanly tear down any existing listener
    if (!stdata?.id && !stdata?.documentId && !stdata?.tokenNo) {
      if (activeListenerRef.current) {
        activeListenerRef.current();
        activeListenerRef.current = null;
      }
      return;
    }

    const docId = stdata.id || stdata.documentId;
    const db = firebase.firestore();

    let unsub = null;

    if (docId) {
      // Direct doc listener
      unsub = db.collection('students').doc(docId).onSnapshot(
        (docSnap) => {
          if (docSnap.exists) {
            const fresh = {
              id: docSnap.id,
              documentId: docSnap.id,
              ...docSnap.data(),
            };
            setStdataState((prev) => {
              // Deep compare key fields to avoid redundant re-renders
              if (JSON.stringify(prev) === JSON.stringify(fresh)) return prev;
              return fresh;
            });
            try {
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            } catch (_) {}
          }
        },
        (error) => {
          console.warn('Live student session subscription error:', error);
        }
      );
    } else if (stdata.tokenNo) {
      // Query by tokenNo fallback
      unsub = db.collection('students').where('tokenNo', '==', Number(stdata.tokenNo)).limit(1).onSnapshot(
        (snap) => {
          if (!snap.empty) {
            const doc = snap.docs[0];
            const fresh = {
              id: doc.id,
              documentId: doc.id,
              ...doc.data(),
            };
            setStdataState((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(fresh)) return prev;
              return fresh;
            });
            try {
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            } catch (_) {}
          }
        },
        (error) => {
          console.warn('Live student token subscription error:', error);
        }
      );
    }

    activeListenerRef.current = unsub;

    return () => {
      if (activeListenerRef.current) {
        activeListenerRef.current();
        activeListenerRef.current = null;
      }
    };
  }, [stdata?.id, stdata?.documentId, stdata?.tokenNo]);

  // Listen for inter-tab session purge event from LiveSyncManager
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSessionPurge = () => {
      if (activeListenerRef.current) {
        activeListenerRef.current();
        activeListenerRef.current = null;
      }
      setStdataState(null);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    };

    window.addEventListener('adsa:session_purged', handleSessionPurge);
    return () => window.removeEventListener('adsa:session_purged', handleSessionPurge);
  }, []);

  const setStdata = useCallback((data) => {
    setStdataState(data);
    if (typeof window !== 'undefined') {
      try {
        if (data) {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.warn('Failed to update student session storage:', e);
      }
    }
  }, []);

  const logoutStudent = useCallback(() => {
    if (activeListenerRef.current) {
      activeListenerRef.current();
      activeListenerRef.current = null;
    }
    setStdata(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [setStdata]);

  return (
    <DataOfOne.Provider value={{ stdata, setStdata, logoutStudent }}>
      {children}
    </DataOfOne.Provider>
  );
}

export default PersonInfo;