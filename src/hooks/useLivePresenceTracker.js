import { useEffect, useRef, useState, useContext, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import firebase from '../firebase/config';
import { AuthContext } from '../store/AuthContext';
import { DataOfOne } from '../store/StudentData';
import { liveSyncManager } from '../utils/liveSyncManager';

/**
 * Helper to generate or restore persistent session ID
 */
function getOrCreateSessionId() {
  if (typeof window === 'undefined') return 'sess_ssr_placeholder';
  try {
    let sessId = sessionStorage.getItem('adsa_sentinel_session_id');
    if (!sessId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        sessId = 'sess_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      } else {
        sessId = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      }
      sessionStorage.setItem('adsa_sentinel_session_id', sessId);
    }
    return sessId;
  } catch (_) {
    return 'sess_temp_' + Math.random().toString(36).substring(2, 10);
  }
}

/**
 * Detect Client OS and Browser
 */
function getClientEnvironment() {
  if (typeof window === 'undefined') {
    return { type: 'desktop', os: 'Unknown', browser: 'Unknown', viewport: '1920x1080' };
  }

  const ua = navigator.userAgent || '';
  const width = window.innerWidth;
  const height = window.innerHeight;

  let type = 'desktop';
  if (width < 768) type = 'mobile';
  else if (width < 1024) type = 'tablet';

  let os = 'Unknown';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS';
  else if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = 'Unknown';
  if (/Chrome|CriOS/.test(ua) && !/Edg|OPR/.test(ua)) browser = 'Chrome';
  else if (/Safari/.test(ua) && !/Chrome|CriOS/.test(ua)) browser = 'Safari';
  else if (/Firefox|FxiOS/.test(ua)) browser = 'Firefox';
  else if (/Edg/.test(ua)) browser = 'Edge';
  else if (/OPR|Opera/.test(ua)) browser = 'Opera';

  return {
    type,
    os,
    browser,
    viewport: `${width}x${height}`,
  };
}

/**
 * Route & Zone friendly name mapping
 */
function resolveRouteInfo(pathname) {
  let title = 'Institutional Portal';
  let zone = 'campus_wide';

  if (pathname === '/') {
    title = 'Unified Student Dashboard';
    zone = 'canteen_hall';
  } else if (pathname.startsWith('/student')) {
    title = 'Student Dining Portal';
    zone = 'dars_hostel';
  } else if (pathname.startsWith('/kitchen') || pathname === '/kds') {
    title = 'Kitchen Display System (KDS)';
    zone = 'kitchen_ops';
  } else if (pathname.startsWith('/admin/audit')) {
    title = 'Audit Intelligence Trail';
    zone = 'admin_office';
  } else if (pathname.startsWith('/admin/analytics')) {
    title = 'Dining Analytics Suite';
    zone = 'admin_office';
  } else if (pathname.startsWith('/admin/sentinel')) {
    title = 'Apex Sentinel Live Radar';
    zone = 'admin_office';
  } else if (pathname.startsWith('/admin') || pathname === '/student-management') {
    title = 'Admin Master Board';
    zone = 'admin_office';
  } else if (pathname.startsWith('/menu')) {
    title = 'Canteen Food Menu';
    zone = 'canteen_hall';
  } else if (pathname.startsWith('/supply')) {
    title = 'Supply & Ration Manifest';
    zone = 'canteen_hall';
  } else if (pathname.startsWith('/avoiders') || pathname === '/list') {
    title = 'Dietary Avoiders Matrix';
    zone = 'canteen_hall';
  } else if (pathname.startsWith('/guide')) {
    title = 'Documentation & Guide';
    zone = 'campus_wide';
  } else if (pathname.startsWith('/adab')) {
    title = 'Sacred Dining Ethics';
    zone = 'dars_hostel';
  } else if (pathname.startsWith('/support')) {
    title = 'Care Hub & Inquiries';
    zone = 'campus_wide';
  } else if (pathname.startsWith('/settings')) {
    title = 'Preferences & Settings';
    zone = 'campus_wide';
  } else if (pathname.startsWith('/login') || pathname.startsWith('/alogin')) {
    title = 'Authentication Gateway';
    zone = 'campus_wide';
  }

  return { title, zone };
}

/**
 * Apex Sentinel Live User Presence Tracker Hook
 * Provides continuous, high-efficiency heartbeat telemetry to Firestore presence_sessions
 */
export function useLivePresenceTracker() {
  const location = useLocation();
  const { user, role, staffProfile } = useContext(AuthContext);
  const studentContext = useContext(DataOfOne);
  const stdata = studentContext?.stdata;

  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeReason, setFreezeReason] = useState(null);

  const lastActivityRef = useRef(Date.now());
  const idleTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const prevPayloadRef = useRef('');

  // 1. Resolve User Identity
  const identity = useMemo(() => {
    // Check authenticated student
    let studentObj = stdata;
    if (!studentObj && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('adsa_student_session');
        if (stored) studentObj = JSON.parse(stored);
      } catch (_) {}
    }

    if (studentObj && (studentObj.tokenNo || studentObj.token)) {
      const tokenNum = Number(studentObj.tokenNo || studentObj.token);
      const studentName = studentObj.name || studentObj.uname || `Token #${tokenNum}`;
      return {
        userType: 'student',
        role: 'student',
        tokenNo: tokenNum,
        studentName,
        batch: studentObj.batch || 'General',
        identifier: studentObj.name ? `${studentObj.name} (#${tokenNum})` : `Token #${tokenNum}`,
        userId: `student_${tokenNum}`,
        email: studentObj.email || null,
        photoUrl: studentObj.photoUrl || null,
      };
    }

    // Check staff / admin user
    if (user) {
      const displayName =
        staffProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'Staff User';
      return {
        userType: 'staff',
        role: role || 'admin',
        tokenNo: null,
        studentName: null,
        batch: null,
        identifier: displayName,
        userId: user.uid,
        email: user.email || null,
        photoUrl: user.photoURL || null,
      };
    }

    // Anonymous visitor
    return {
      userType: 'guest',
      role: 'guest',
      tokenNo: null,
      studentName: null,
      batch: null,
      identifier: `Guest (${sessionId.slice(5, 9)})`,
      userId: `anon_${sessionId.slice(5, 12)}`,
      email: null,
      photoUrl: null,
    };
  }, [stdata, user, role, staffProfile, sessionId]);

  // 2. Listen to User Activity to calculate Idle seconds
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserInteraction = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, handleUserInteraction, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserInteraction));
    };
  }, []);

  // 3. Heartbeat Dispatch Routine
  const sendHeartbeat = useCallback(
    async (forced = false) => {
      if (typeof window === 'undefined') return;
      if (!firebase.firestore) return;

      try {
        const now = Date.now();
        const idleSec = Math.floor((now - lastActivityRef.current) / 1000);
        const isVisible = document.visibilityState === 'visible';

        let status = 'active';
        if (!isVisible) {
          status = 'away';
        } else if (idleSec >= 300) {
          status = 'away';
        } else if (idleSec >= 60) {
          status = 'idle';
        }

        const env = getClientEnvironment();
        const routeInfo = resolveRouteInfo(location.pathname);
        const syncState = liveSyncManager.getState();

        const payload = {
          sessionId,
          ...identity,
          route: location.pathname,
          routeTitle: routeInfo.title,
          zone: routeInfo.zone,
          device: env,
          network: {
            online: syncState.isOnline,
            effectiveType:
              (typeof navigator !== 'undefined' && navigator.connection?.effectiveType) || 'broadband',
            latencyMs: syncState.latencyMs || 0,
          },
          status,
          isTabFocused: isVisible,
          idleDurationSeconds: idleSec,
          clientTimestamp: new Date().toISOString(),
          lastHeartbeat: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // De-duplicate unnecessary high-frequency identical writes
        const signature = `${payload.status}_${payload.route}_${payload.userId}_${Math.floor(idleSec / 60)}`;
        if (!forced && signature === prevPayloadRef.current) {
          return;
        }
        prevPayloadRef.current = signature;

        await firebase
          .firestore()
          .collection('presence_sessions')
          .doc(sessionId)
          .set(payload, { merge: true });
      } catch (err) {
        // Gracefully suppress network/permission hiccups in background telemetry
        console.debug('[ApexSentinel] Presence heartbeat skipped:', err?.message || err);
      }
    },
    [sessionId, identity, location.pathname]
  );

  // 4. Lifecycle management: Immediate heartbeat, periodic timer, and clean teardown
  useEffect(() => {
    // Send immediate heartbeat on mount or route change
    sendHeartbeat(true);

    // Dynamic interval: 30s when tab is active, 60s when hidden
    const intervalMs = document.visibilityState === 'visible' ? 30000 : 60000;
    heartbeatTimerRef.current = setInterval(() => {
      sendHeartbeat();
    }, intervalMs);

    const handleVisibility = () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      sendHeartbeat(true);
      const nextInterval = document.visibilityState === 'visible' ? 30000 : 60000;
      heartbeatTimerRef.current = setInterval(() => {
        sendHeartbeat();
      }, nextInterval);
    };

    document.addEventListener('visibilitychange', handleVisibility);

    // Teardown when tab closes
    const handleUnload = () => {
      try {
        if (firebase.firestore) {
          firebase
            .firestore()
            .collection('presence_sessions')
            .doc(sessionId)
            .update({
              status: 'offline',
              disconnectedAt: new Date().toISOString(),
            })
            .catch(() => {});
        }
      } catch (_) {}
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [sendHeartbeat, sessionId]);

  // 5. Watchdog for Remote Freeze state on own session
  useEffect(() => {
    if (!sessionId || !firebase.firestore) return;

    const unsub = firebase
      .firestore()
      .collection('presence_sessions')
      .doc(sessionId)
      .onSnapshot(
        (snap) => {
          if (snap.exists) {
            const data = snap.data();
            setIsFrozen(Boolean(data.isFrozen));
            setFreezeReason(data.freezeReason || null);
          }
        },
        () => {}
      );

    return () => unsub();
  }, [sessionId]);

  return {
    sessionId,
    identity,
    isFrozen,
    freezeReason,
    sendHeartbeat,
  };
}

export default useLivePresenceTracker;
