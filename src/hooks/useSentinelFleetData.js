import { useState, useEffect, useMemo } from 'react';
import firebase from '../firebase/config';

/**
 * useSentinelFleetData
 * Real-time presence aggregator and telemetry suite for Apex Sentinel Admin Cockpit.
 * Provides live connection count, zone distribution, role metrics, and multi-filter searching.
 */
export function useSentinelFleetData() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all'); // 'all' | 'student' | 'kitchen' | 'staff' | 'guest'
  const [selectedZone, setSelectedZone] = useState('all'); // 'all' | 'dars_hostel' | 'canteen_hall' | 'kitchen_ops' | 'admin_office'
  const [selectedDevice, setSelectedDevice] = useState('all'); // 'all' | 'mobile' | 'tablet' | 'desktop'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'idle' | 'token' | 'route'

  useEffect(() => {
    if (!firebase.firestore) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to presence_sessions ordered by clientTimestamp desc
    const unsub = firebase
      .firestore()
      .collection('presence_sessions')
      .limit(200)
      .onSnapshot(
        (snap) => {
          const now = Date.now();
          const list = snap.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((sess) => {
              // Exclude sessions explicitly marked offline
              if (sess.status === 'offline') return false;

              // Exclude ghost sessions with no heartbeat in the last 120 seconds
              const clientTime = sess.clientTimestamp ? new Date(sess.clientTimestamp).getTime() : 0;
              if (clientTime && now - clientTime > 120000) return false;

              return true;
            });

          setSessions(list);
          setLoading(false);
        },
        (err) => {
          console.warn('[useSentinelFleetData] Presence subscription warning:', err);
          setLoading(false);
        }
      );

    return () => unsub();
  }, []);

  // Fleet Telemetry Metrics
  const telemetry = useMemo(() => {
    let studentCount = 0;
    let kitchenCount = 0;
    let staffCount = 0;
    let guestCount = 0;

    let activeCount = 0;
    let idleCount = 0;
    let awayCount = 0;

    const byZone = {
      dars_hostel: 0,
      canteen_hall: 0,
      kitchen_ops: 0,
      admin_office: 0,
      campus_wide: 0,
    };

    const byDevice = {
      mobile: 0,
      tablet: 0,
      desktop: 0,
    };

    sessions.forEach((s) => {
      // Role
      if (s.userType === 'student') studentCount++;
      else if (s.role === 'cook' || s.route?.startsWith('/kitchen') || s.route === '/kds') kitchenCount++;
      else if (s.userType === 'staff') staffCount++;
      else guestCount++;

      // Activity
      if (s.status === 'active') activeCount++;
      else if (s.status === 'idle') idleCount++;
      else awayCount++;

      // Zone
      if (s.zone && byZone[s.zone] !== undefined) {
        byZone[s.zone]++;
      } else {
        byZone.campus_wide++;
      }

      // Device
      const devType = s.device?.type || 'desktop';
      if (byDevice[devType] !== undefined) {
        byDevice[devType]++;
      } else {
        byDevice.desktop++;
      }
    });

    return {
      totalOnline: sessions.length,
      studentCount,
      kitchenCount,
      staffCount,
      guestCount,
      activeCount,
      idleCount,
      awayCount,
      byZone,
      byDevice,
    };
  }, [sessions]);

  // Filtered & Sorted Sessions
  const filteredSessions = useMemo(() => {
    let result = sessions.filter((s) => {
      // Role filter
      if (selectedRole !== 'all') {
        if (selectedRole === 'kitchen') {
          if (s.role !== 'cook' && !s.route?.startsWith('/kitchen') && s.route !== '/kds') return false;
        } else if (selectedRole === 'student') {
          if (s.userType !== 'student') return false;
        } else if (selectedRole === 'staff') {
          if (s.userType !== 'staff' && s.role !== 'admin' && s.role !== 'central_committee' && s.role !== 'canteen_committee') {
            return false;
          }
        } else if (selectedRole === 'guest') {
          if (s.userType !== 'guest') return false;
        }
      }

      // Zone filter
      if (selectedZone !== 'all') {
        if (s.zone !== selectedZone) return false;
      }

      // Device filter
      if (selectedDevice !== 'all') {
        if (s.device?.type !== selectedDevice) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchableText = [
          s.identifier,
          s.tokenNo,
          s.studentName,
          s.batch,
          s.email,
          s.route,
          s.routeTitle,
          s.device?.os,
          s.device?.browser,
          s.sessionId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(q)) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'token') {
        return (Number(a.tokenNo) || 9999) - (Number(b.tokenNo) || 9999);
      }
      if (sortBy === 'idle') {
        return (b.idleDurationSeconds || 0) - (a.idleDurationSeconds || 0);
      }
      if (sortBy === 'route') {
        return (a.route || '').localeCompare(b.route || '');
      }
      // Default: 'recent'
      const timeA = a.clientTimestamp ? new Date(a.clientTimestamp).getTime() : 0;
      const timeB = b.clientTimestamp ? new Date(b.clientTimestamp).getTime() : 0;
      return timeB - timeA;
    });

    return result;
  }, [sessions, selectedRole, selectedZone, selectedDevice, searchQuery, sortBy]);

  return {
    sessions,
    filteredSessions,
    telemetry,
    loading,
    searchQuery,
    setSearchQuery,
    selectedRole,
    setSelectedRole,
    selectedZone,
    setSelectedZone,
    selectedDevice,
    setSelectedDevice,
    sortBy,
    setSortBy,
  };
}

export default useSentinelFleetData;
