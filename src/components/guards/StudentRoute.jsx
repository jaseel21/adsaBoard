import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { DataOfOne } from '../../store/StudentData';

/**
 * Route guard that requires an active student session before accessing the student portal.
 * Redirects unauthenticated students to /login.
 */
export default function StudentRoute({ children }) {
  const { stdata } = useContext(DataOfOne);
  const location = useLocation();

  if (!stdata || !stdata.tokenNo) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
          notice: 'Please enter your token number and password to access the dining portal.',
        }}
        replace
      />
    );
  }

  return children;
}
