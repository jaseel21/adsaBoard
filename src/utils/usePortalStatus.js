import { useState, useEffect } from 'react';
import firebase from '../firebase/config';
import { useWorldTime } from './time';

export function usePortalStatus() {
  const { timeHms } = useWorldTime('Asia/Kolkata');
  const [overrideStatus, setOverrideStatus] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const startTime = '14:00:00'; // 2:00 PM IST
  const endTime = '23:00:00';   // 11:00 PM IST

  useEffect(() => {
    const unsub = firebase
      .firestore()
      .collection('tokenboard')
      .doc('g8iJVNn2RQkysjMAvX1h')
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setOverrideStatus(Boolean(doc.data().status));
          }
          setLoadingConfig(false);
        },
        (err) => {
          console.error('Error listening to tokenboard config:', err);
          setLoadingConfig(false);
        }
      );

    return () => unsub();
  }, []);

  const timeInRange = Boolean(timeHms && timeHms >= startTime && timeHms <= endTime);
  const isOpen = overrideStatus || timeInRange;

  // Compute countdown or status text
  let statusBadge = '';
  if (overrideStatus) {
    statusBadge = 'Admin Override Active';
  } else if (isOpen) {
    statusBadge = 'Open until 11:00 PM IST';
  } else {
    statusBadge = 'Opens 2:00 PM IST';
  }

  return {
    isOpen,
    isOverride: overrideStatus,
    timeInRange,
    statusBadge,
    startTime: '2:00 PM IST',
    endTime: '11:00 PM IST',
    currentTime: timeHms,
    loadingConfig,
  };
}
