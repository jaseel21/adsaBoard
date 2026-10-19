import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../store/AuthContext';
import { DataOfOne } from '../../store/StudentData';

/**
 * Route guard that requires EITHER an active student session OR an authenticated committee staff session.
 * Protects surfaces (like the Token Board) that contain personal student data and attendance records.
 * Unauthenticated guests are redirected to /login with an explanatory security notice.
 */
export default function AuthenticatedRoute({ children, notice }) {
  const { user, loadingAuth } = useContext(AuthContext);
  const { stdata } = useContext(DataOfOne);
  const location = useLocation();

  // Wait for Firebase Auth initialization before deciding
  if (loadingAuth) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100dvh-8rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Verifying security credentials...
          </span>
        </div>
      </div>
    );
  }

  const isStudentAuthenticated = Boolean(stdata && stdata.tokenNo);
  const isStaffAuthenticated = Boolean(user && user.uid);

  if (!isStudentAuthenticated && !isStaffAuthenticated) {
    const defaultNotice = location.pathname.startsWith('/menu')
      ? 'Access restricted: Please authenticate with your student token or committee credentials to view the Canteen Food Menu.'
      : 'Access restricted: Please authenticate with your student token or committee credentials to view the Token Board.';

    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
          notice: notice || defaultNotice,
        }}
        replace
      />
    );
  }

  return children;
}
