import React, { useContext, useEffect } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import StudentPort from './components/StudentPort';
import Navbar from './components/NavBar';
import Footer from './components/Footer';
import List from './components/List';
import Section from './components/Section';
import Mtokens from './components/Mtokens';
import Fmenu from './components/Fmenu';
import PersonInfo from './store/StudentData';
import GetTokens from './store/GetDocuments';
import SectionBF from './components/SectionBF';
import Admin from './components/Admin';
import AstudentPort from './components/AstudentPort';
import GeneratePdf from './components/GeneratePdf';
import AdminLogin from './components/AdminLogin';
import AddStudentsCSV from './components/AddStudentsCSV';
import StudentManagement from './components/StudentManagement';
import firebase from './firebase/config';
import { AuthContext } from './store/AuthContext';
import { ThemeProvider } from './store/ThemeContext';
import { LanguageProvider } from './store/LanguageContext';
import './App.css';

function AppContent() {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();

  const isAdmin =
    location.pathname === '/admin' ||
    location.pathname === '/alogin' ||
    location.pathname === '/student-management' ||
    location.pathname === '/add-students' ||
    location.pathname === '/m-tokens';

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
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student-portal" element={<StudentPort />} />
          <Route path="/list" element={<List />} />
          <Route path="/lunch" element={<Section />} />
          <Route path="/menu" element={<Fmenu />} />
          <Route path="/breakfast" element={<SectionBF />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="/student-management"
            element={<StudentManagement />}
          />
          <Route
            path="/astudent-port"
            element={user ? <AstudentPort /> : <Navigate to="/alogin" replace />}
          />
          <Route path="/pdfg" element={<GeneratePdf />} />
          <Route
            path="/alogin"
            element={user ? <Admin /> : <AdminLogin />}
          />
          <Route
            path="/m-tokens"
            element={user ? <Mtokens /> : <Navigate to="/alogin" replace />}
          />
          <Route
            path="/add-students"
            element={user ? <AddStudentsCSV /> : <Navigate to="/alogin" replace />}
          />
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
          <GetTokens>
            <AppContent />
          </GetTokens>
        </PersonInfo>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;