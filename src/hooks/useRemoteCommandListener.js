import { useEffect, useState, useRef, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from '../firebase/config';
import { AuthContext } from '../store/AuthContext';
import { DataOfOne } from '../store/StudentData';
import { soundEngine } from '../utils/soundEffects';
import { hapticEngine } from '../utils/haptics';
import { dialog } from '../utils/dialog';

/**
 * useRemoteCommandListener
 * Listens for real-time remote commands dispatched by ADSA Central Committee/Admins.
 * Executes immediate client actions: Force Logout, Route Redirect, Targeted Modal Alerts, Ping.
 */
export function useRemoteCommandListener({ sessionId, identity }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const studentContext = useContext(DataOfOne);
  const logoutStudent = studentContext?.logoutStudent;

  const [activeAlert, setActiveAlert] = useState(null);
  const processedCmdsRef = useRef(new Set());

  // Acknowledge command in Firestore
  const acknowledgeCommand = useCallback(
    async (commandId) => {
      if (!commandId || !firebase.firestore) return;
      try {
        await firebase
          .firestore()
          .collection('session_commands')
          .doc(commandId)
          .update({
            acknowledgedSessions: firebase.firestore.FieldValue.arrayUnion(sessionId),
          });
      } catch (_) {}
    },
    [sessionId]
  );

  useEffect(() => {
    if (!sessionId || !firebase.firestore) return;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const unsub = firebase
      .firestore()
      .collection('session_commands')
      .where('createdAtIso', '>=', fiveMinutesAgo)
      .limit(20)
      .onSnapshot(
        (snap) => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const cmd = { id: change.doc.id, ...change.doc.data() };

              // Check if already processed
              if (processedCmdsRef.current.has(cmd.id)) return;
              if (Array.isArray(cmd.acknowledgedSessions) && cmd.acknowledgedSessions.includes(sessionId)) {
                processedCmdsRef.current.add(cmd.id);
                return;
              }

              // Verify target match
              const matchesSession = cmd.targetSessionId === sessionId || cmd.targetSessionId === 'all';
              const matchesToken =
                identity?.tokenNo && cmd.targetTokenNo && Number(cmd.targetTokenNo) === Number(identity.tokenNo);
              const matchesRole = cmd.targetRole && cmd.targetRole === identity?.role;

              if (!matchesSession && !matchesToken && !matchesRole) return;

              // Mark processed
              processedCmdsRef.current.add(cmd.id);
              acknowledgeCommand(cmd.id);

              // Execute Action
              switch (cmd.action) {
                case 'FORCE_LOGOUT': {
                  soundEngine.playCautionThud();
                  hapticEngine.errorBuzz();

                  if (logoutStudent) {
                    logoutStudent();
                  } else if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('adsa_student_session');
                  }

                  if (user && firebase.auth) {
                    firebase.auth().signOut().catch(() => {});
                  }

                  dialog.alert({
                    title: 'Session Concluded by Administration',
                    message:
                      cmd.payload?.message ||
                      cmd.payload?.reason ||
                      'Your active session has been securely concluded by ADSA Committee administration.',
                    type: 'warning',
                    confirmText: 'Return to Sign-In',
                  }).then(() => {
                    navigate('/login', { replace: true });
                  });
                  break;
                }

                case 'NAVIGATE_TO': {
                  if (cmd.payload?.targetRoute) {
                    soundEngine.playPop();
                    hapticEngine.lightTap();
                    dialog.toast.info(
                      'Navigated by Administrator',
                      `Directed to ${cmd.payload.targetRoute}`,
                      3000
                    );
                    navigate(cmd.payload.targetRoute);
                  }
                  break;
                }

                case 'ALERT_MODAL': {
                  setActiveAlert({
                    id: cmd.id,
                    title: cmd.payload?.title || 'Notice from ADSA Administration',
                    message: cmd.payload?.message || '',
                    severity: cmd.payload?.severity || 'warning',
                    issuedBy: cmd.issuedBy || null,
                    createdAt: cmd.createdAtIso || new Date().toISOString(),
                    requireAcknowledgement: cmd.payload?.requireAcknowledgement ?? true,
                  });
                  break;
                }

                case 'REQUEST_PING': {
                  soundEngine.playSoftChime();
                  hapticEngine.lightTap();
                  dialog.toast.info(
                    'Administrative Ping',
                    cmd.payload?.message || 'Administrator verified your client presence.',
                    4000
                  );
                  break;
                }

                case 'RELOAD_CLIENT': {
                  soundEngine.playSoftChime();
                  dialog.toast.info(
                    'System Update',
                    'Refreshing application for latest configuration...',
                    2000
                  );
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                  break;
                }

                default:
                  break;
              }
            }
          });
        },
        (err) => {
          console.debug('[ApexSentinel] Command subscription error:', err?.message || err);
        }
      );

    return () => unsub();
  }, [sessionId, identity, navigate, logoutStudent, user, acknowledgeCommand]);

  const handleDismissAlert = () => {
    setActiveAlert(null);
  };

  return {
    activeAlert,
    handleDismissAlert,
  };
}

export default useRemoteCommandListener;
