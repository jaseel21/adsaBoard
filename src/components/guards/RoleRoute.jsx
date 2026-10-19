import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../store/AuthContext';
import AccessDenied from './AccessDenied';

/**
 * Route guard that restricts access based on authenticated staff roles.
 * - Redirects unauthenticated visitors to /alogin.
 * - Displays AccessDenied (403) if authenticated user lacks required roles.
 */
export default function RoleRoute({ allowedRoles = [], children }) {
  const { user, role, loadingAuth, hasRole } = useContext(AuthContext);
  const location = useLocation();

  if (loadingAuth) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100dvh-8rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Verifying staff permissions...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/alogin"
        state={{
          from: location.pathname,
          notice: 'Please authenticate with your designated staff credentials to access this area.',
        }}
        replace
      />
    );
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <AccessDenied allowedRoles={allowedRoles} />;
  }

  return children;
}
