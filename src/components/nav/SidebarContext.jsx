import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { safeLocalStorage } from '../../utils/storage';

const SidebarContext = createContext({
  sidebarOpen: true,
  toggleSidebar: () => {},
  setSidebarOpen: () => {},
  closeSidebar: () => {},
  isDesktop: true,
});

const STORAGE_KEY = 'adsa_sidebar_desktop_open';

export function SidebarProvider({ children }) {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const [sidebarOpen, setSidebarOpenState] = useState(() => {
    if (typeof window !== 'undefined') {
      const isLargeScreen = window.innerWidth >= 1024;
      // On mobile viewports (< 1024px), sidebar MUST NEVER be open by default
      if (!isLargeScreen) return false;
      const saved = safeLocalStorage.getItem(STORAGE_KEY);
      // By default open on desktop unless explicitly set to 'false'
      return saved !== 'false';
    }
    return false;
  });

  // Track window resize to update isDesktop mode and close on mobile transition
  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      setIsDesktop(isLargeScreen);
      // Immediately close mobile drawer if resized down below desktop breakpoint
      if (!isLargeScreen) {
        setSidebarOpenState(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setSidebarOpen = useCallback((open) => {
    setSidebarOpenState((prev) => {
      const resolved = typeof open === 'function' ? open(prev) : open;
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        safeLocalStorage.setItem(STORAGE_KEY, resolved ? 'true' : 'false');
      }
      return resolved;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, [setSidebarOpen]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  // Global keyboard shortcut: Cmd+B / Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        closeSidebar,
        isDesktop,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
