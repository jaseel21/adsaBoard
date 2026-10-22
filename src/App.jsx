import React, { useContext } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Home from './components/Home';
import StudentDashboard from './components/StudentDashboard';
import LandingPage from './components/LandingPage';
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
import AuditTrail from './components/audit/AuditTrail';
import KitchenDisplay from './components/KitchenDisplay';
import GuidePage from './components/guide/GuidePage';
import NotFound from './components/NotFound';
import AdminRoute from './components/guards/AdminRoute';
import RoleRoute from './components/guards/RoleRoute';
import StudentRoute from './components/guards/StudentRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { DialogProvider } from './components/ui/AppDialog';
import { NotificationProvider } from './store/NotificationContext';
import NotificationDrawer from './components/notifications/NotificationDrawer';
import EmergencyNotificationDialog from './components/notifications/EmergencyNotificationDialog';
import ApexNotificationManager from './components/notifications/admin/ApexNotificationManager';
import CareHubPage from './components/support/CareHubPage';
import ApexCareFloatingButton from './components/support/ApexCareFloatingButton';
import SupportCommandCenter from './components/admin/support/SupportCommandCenter';
import { AuthContext } from './store/AuthContext';
import { ThemeProvider } from './store/ThemeContext';
import { LanguageProvider } from './store/LanguageContext';
import { ROLES } from './utils/rbac';
import './App.css';

function AppContent() {
  const { user, homeRoute } = useContext(AuthContext);
  const isAdmin = Boolean(user);
  const location = useLocation();

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-[#f8faf8] dark:bg-[#080d0b] text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-x-hidden">
      <Navbar isAdmin={isAdmin} />
      <main className="flex-1 w-full max-w-full min-w-0 flex flex-col overflow-x-hidden">
        <ErrorBoundary>
          <Routes>
            {/* Unified Public Student Dashboard / Home */}
            <Route path="/" element={<StudentDashboard />} />

            {/* Public Interactive Token Board */}
            <Route path="/board" element={<Home />} />

            {/* Public Canteen Food Menu */}
            <Route path="/menu" element={<Fmenu />} />

            {/* Public Document Downloads & Information */}
            <Route path="/login" element={<Login />} />
            <Route path="/list" element={<List />} />
            <Route path="/lunch" element={<SupplySections defaultMeal="lunch" />} />
            <Route path="/breakfast" element={<SupplySections defaultMeal="breakfast" />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/support" element={<CareHubPage />} />
            <Route path="/feedback" element={<CareHubPage />} />
            <Route path="/contact" element={<CareHubPage />} />

            {/* Student Portal (Protected by Student Session) */}
            <Route
              path="/student-portal"
              element={
                <StudentRoute>
                  <StudentPort />
                </StudentRoute>
              }
            />

            {/* Dedicated Kitchen Display System (Cooks, Canteen Committee, Central, Devs) */}
            <Route
              path="/kitchen"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.COOK,
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.DEVELOPER,
                  ]}
                >
                  <KitchenDisplay />
                </RoleRoute>
              }
            />
            <Route path="/kds" element={<Navigate to="/kitchen" replace />} />
            <Route path="/cook-portal" element={<Navigate to="/kitchen" replace />} />

            {/* Master Board & Student Management (Central Committee, Canteen Sub-Committee, Devs) */}
            <Route
              path="/admin"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.DEVELOPER,
                  ]}
                >
                  <Admin />
                </RoleRoute>
              }
            />
            <Route
              path="/student-management"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.DEVELOPER,
                  ]}
                >
                  <StudentManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <RoleRoute allowedRoles={[ROLES.CENTRAL_COMMITTEE, ROLES.DEVELOPER]}>
                  <AuditTrail />
                </RoleRoute>
              }
            />
            <Route path="/admin/audit" element={<Navigate to="/admin/audit-logs" replace />} />
            <Route path="/audit-logs" element={<Navigate to="/admin/audit-logs" replace />} />

            {/* Broadcast Notifications & Announcements (Canteen Sub-Committee, Central, Devs) */}
            <Route
              path="/admin/notifications"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.DEVELOPER,
                  ]}
                >
                  <ApexNotificationManager />
                </RoleRoute>
              }
            />
            <Route path="/notifications" element={<Navigate to="/admin/notifications" replace />} />

            {/* Support, Inquiries & Care Center (Canteen Committee, Central, Devs, Cooks) */}
            <Route
              path="/admin/support"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.DEVELOPER,
                    ROLES.COOK,
                  ]}
                >
                  <SupportCommandCenter />
                </RoleRoute>
              }
            />
            <Route path="/admin/feedback" element={<Navigate to="/admin/support" replace />} />

            {/* Menu & Dietary Consoles (Canteen Sub-Committee, Central, Devs) */}
            <Route
              path="/admin/menu"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.DEVELOPER,
                  ]}
                >
                  <MenuManagement />
                </RoleRoute>
              }
            />
            <Route path="/menu-management" element={<Navigate to="/admin/menu" replace />} />
            <Route
              path="/admin/dietary"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.DEVELOPER,
                  ]}
                >
                  <DietaryManagement />
                </RoleRoute>
              }
            />
            <Route path="/admin/avoiders" element={<Navigate to="/admin/dietary" replace />} />
            <Route path="/dietary-management" element={<Navigate to="/admin/dietary" replace />} />

            {/* Legacy Redirects */}
            <Route path="/add-student" element={<Navigate to="/student-management?add=true" replace />} />
            <Route path="/add-students" element={<Navigate to="/student-management?add=true" replace />} />
            <Route path="/astudent-port" element={<Navigate to="/student-management" replace />} />
            <Route path="/m-tokens" element={<Navigate to="/student-management" replace />} />
            <Route path="/pdfg" element={<Navigate to="/breakfast" replace />} />
            <Route
              path="/alogin"
              element={user ? <Navigate to={homeRoute || '/admin'} replace /> : <AdminLogin />}
            />

            {/* 404 Catch-All Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
      {!location.pathname.startsWith('/kitchen') && <ApexCareFloatingButton />}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PersonInfo>
          <NotificationProvider>
            <DialogProvider>
              <AppContent />
              <NotificationDrawer />
              <EmergencyNotificationDialog />
            </DialogProvider>
          </NotificationProvider>
        </PersonInfo>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;