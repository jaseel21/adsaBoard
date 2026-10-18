import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../store/AuthContext';
import { ShieldAlert } from 'lucide-react';

/**
 * Route guard that restricts access exclusively to authenticated ADSA Committee administrators.
 * Redirects unauthenticated visitors to /alogin with a redirect return state.
 */
export default function AdminRoute({ children }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/alogin"
        state={{
          from: location.pathname,
          notice: 'Please log in with committee credentials to access this administrative area.',
        }}
        replace
      />
    );
  }

  return children;
}
