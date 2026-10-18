import { createContext, useState, useEffect, useCallback } from "react";

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