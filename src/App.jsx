import React, { useContext, useEffect } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import StudentPort from './components/StudentPort';
import Navbar from './components/NavBar';
import Footer from './components/Footer';
import List from './components/List';
import SupplySections from './components/SupplySections';
import Fmenu from './components/Fmenu';
import PersonInfo from './store/StudentData';
import Admin from './components/Admin';
import AdminLogin from './components/AdminLogin';
import StudentManagement from './components/StudentManagement';
import MenuManagement from './components/MenuManagement';
import DietaryManagement from './components/DietaryManagement';
import NotFound from './components/NotFound';
import AdminRoute from './components/guards/AdminRoute';
import StudentRoute from './components/guards/StudentRoute';
import { DialogProvider } from './components/ui/AppDialog';
import firebase from './firebase/config';
import { AuthContext } from './store/AuthContext';
import { ThemeProvider } from './store/ThemeContext';
import { LanguageProvider } from './store/LanguageContext';
import './App.css';

function AppContent() {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();

  const isAdmin =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/alogin' ||
    location.pathname.startsWith('/student-management');

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [setUser]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#080d0b] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar isAdmin={isAdmin} />
      <main className="flex-1 flex flex-col">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/menu" element={<Fmenu />} />
          <Route path="/list" element={<List />} />
          <Route path="/lunch" element={<SupplySections defaultMeal="lunch" />} />
          <Route path="/breakfast" element={<SupplySections defaultMeal="breakfast" />} />

          {/* Student Portal (Protected by Student Session) */}
          <Route
            path="/student-portal"
            element={
              <StudentRoute>
                <StudentPort />
              </StudentRoute>
            }
          />

          {/* Committee Admin Routes (Strictly Protected by AdminRoute Guard) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <AdminRoute>
                <MenuManagement />
              </AdminRoute>
            }
          />
          <Route path="/menu-management" element={<Navigate to="/admin/menu" replace />} />
          <Route
            path="/student-management"
            element={
              <AdminRoute>
                <StudentManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dietary"
            element={
              <AdminRoute>
                <DietaryManagement />
              </AdminRoute>
            }
          />
          <Route path="/admin/avoiders" element={<Navigate to="/admin/dietary" replace />} />
          <Route path="/dietary-management" element={<Navigate to="/admin/dietary" replace />} />

          {/* Legacy Redirects */}
          <Route path="/add-student" element={<Navigate to="/student-management?add=true" replace />} />
          <Route path="/add-students" element={<Navigate to="/student-management?add=true" replace />} />
          <Route path="/astudent-port" element={<Navigate to="/student-management" replace />} />
          <Route path="/m-tokens" element={<Navigate to="/student-management" replace />} />
          <Route path="/pdfg" element={<Navigate to="/lunch" replace />} />
          <Route
            path="/alogin"
            element={user ? <Navigate to="/admin" replace /> : <AdminLogin />}
          />

          {/* 404 Catch-All Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PersonInfo>
          <DialogProvider>
            <AppContent />
          </DialogProvider>
        </PersonInfo>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;