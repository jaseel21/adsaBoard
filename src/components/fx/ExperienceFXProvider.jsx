import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import FluidCursor from './FluidCursor';
import ClickParticleCanvas from './ClickParticleCanvas';
import ContextMenuDock from './ContextMenuDock';
import TouchPeekSheet from './TouchPeekSheet';
import CircadianAtmosphereCanvas from './CircadianAtmosphereCanvas';
import StudentDetailCalendarModal from '../ui/StudentDetailCalendarModal';
import { usePreferences } from '../../store/PreferencesContext';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';

export const ExperienceFXContext = createContext(null);

export function useExperienceFX() {
  const ctx = useContext(ExperienceFXContext);
  if (!ctx) {
    return {
      triggerParticleBurst: () => {},
      triggerRipple: () => {},
      setCursorVariant: () => {},
      setMagneticTarget: () => {},
      openContextMenu: () => {},
      closeContextMenu: () => {},
      openPeekSheet: () => {},
      closePeekSheet: () => {},
    };
  }
  return ctx;
}

export default function ExperienceFXProvider({ children, onTokenAction }) {
  const { preferences } = usePreferences();
  const { feedback } = useFeedback();

  const [cursorVariant, setCursorVariant] = useState('default');
  const [magneticTarget, setMagneticTarget] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    type: null,
    data: null,
  });

  // Mobile Peek & Pop State
  const [peekSheet, setPeekSheet] = useState({
    isOpen: false,
    tokenData: null,
    rect: null,
  });

  // Full calendar modal triggered from peek pop or context action
  const [poppedStudentDoc, setPoppedStudentDoc] = useState(null);

  // Particle canvas triggers
  const burstTriggerRef = useRef(null);

  const triggerParticleBurst = useCallback((x, y, theme = 'emerald', count = 14) => {
    if (burstTriggerRef.current) {
      burstTriggerRef.current.burst(x, y, theme, count);
    }
  }, []);

  const triggerRipple = useCallback((x, y, color = '#10b981') => {
    if (burstTriggerRef.current) {
      burstTriggerRef.current.ripple(x, y, color);
    }
  }, []);

  // Global mouse down/up tracking for cursor elasticity and left-click ripples
  useEffect(() => {
    const handleDown = (e) => {
      setIsMouseDown(true);
      // Spawn ripple on left click if click style is enabled
      if (e.button === 0 && preferences?.clickRippleStyle !== 'off') {
        triggerRipple(e.clientX, e.clientY);
      }
    };

    const handleUp = () => {
      setIsMouseDown(false);
    };

    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [preferences?.clickRippleStyle, triggerRipple]);

  // Context Menu handlers
  const openContextMenu = useCallback((e, type, data) => {
    if (preferences?.contextMenuEnabled === false) return;
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    feedback('pop');
    setContextMenu({
      isOpen: true,
      x: clientX,
      y: clientY,
      type,
      data,
    });
  }, [preferences?.contextMenuEnabled, feedback]);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Mobile Peek handlers
  const openPeekSheet = useCallback((rect, tokenData) => {
    if (preferences?.mobileLongPressPeek === false) return;
    setPeekSheet({
      isOpen: true,
      tokenData,
      rect,
    });
  }, [preferences?.mobileLongPressPeek]);

  const closePeekSheet = useCallback(() => {
    setPeekSheet((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handlePopToFullModal = useCallback((doc) => {
    setPoppedStudentDoc(doc);
  }, []);

  const handleDefaultAction = useCallback(async (action, data) => {
    const doc = data?.doc || data;
    if (action === 'openCalendar' || action === 'pop') {
      setPoppedStudentDoc(doc);
    } else if (action === 'dietaryInfo') {
      const avoided = [];
      if (doc?.obj2) {
        Object.entries(doc.obj2).forEach(([k, v]) => {
          if (v === false) avoided.push(k.charAt(0).toUpperCase() + k.slice(1));
        });
      }
      if (avoided.length > 0) {
        dialog.toast.info(`Token #${doc.tokenNo} Dietary Tags`, `Excluded foods: ${avoided.join(', ')}`);
      } else {
        dialog.toast.info(`Token #${doc?.tokenNo || ''} Dietary Status`, 'No dietary exclusions registered (Standard diet).');
      }
    } else if (action === 'toggleStatus') {
      setPoppedStudentDoc(doc);
    }

    if (onTokenAction) {
      onTokenAction(action, data);
    }
  }, [onTokenAction]);

  const value = {
    cursorVariant,
    setCursorVariant,
    magneticTarget,
    setMagneticTarget,
    triggerParticleBurst,
    triggerRipple,
    openContextMenu,
    closeContextMenu,
    openPeekSheet,
    closePeekSheet,
  };

  return (
    <ExperienceFXContext.Provider value={value}>
      <CircadianAtmosphereCanvas />
      {children}
      <FluidCursor
        cursorVariant={cursorVariant}
        magneticTarget={magneticTarget}
        isMouseDown={isMouseDown}
      />
      <ClickParticleCanvas burstTriggerRef={burstTriggerRef} />
      <ContextMenuDock
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        data={contextMenu.data}
        type={contextMenu.type}
        onClose={closeContextMenu}
        onAction={handleDefaultAction}
      />
      <TouchPeekSheet
        isOpen={peekSheet.isOpen}
        tokenData={peekSheet.tokenData}
        onClose={closePeekSheet}
        onAction={handleDefaultAction}
        onPopToFullModal={handlePopToFullModal}
      />
      {poppedStudentDoc && (
        <StudentDetailCalendarModal
          isOpen={Boolean(poppedStudentDoc)}
          student={poppedStudentDoc}
          onClose={() => setPoppedStudentDoc(null)}
        />
      )}
    </ExperienceFXContext.Provider>
  );
}
