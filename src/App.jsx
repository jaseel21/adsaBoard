import React, { useContext } from 'react'
import { useEffect } from 'react'
import Home from "./components/Home"
import Login from './components/Login'
import StudentPort from './components/StudentPort'
import Navbar from './components/NavBar'
import List from "./components/List"
import Section from './components/Section'
import Mtokens from './components/Mtokens'

import Fmenu from "./components/Fmenu"
import {Route,Routes,generatePath,useLocation,Navigate} from 'react-router-dom'
import  PersonInfo  from './store/StudentData'
import GetTokens from './store/GetDocuments'
import SectionBF from './components/SectionBF'
import Admin from './components/Admin'
import AstudentPort from './components/AstudentPort'
import GeneratePdf from "./components/GeneratePdf"
import AdminLogin from "./components/AdminLogin"
import firebase from './firebase/config'

import { AuthContext } from './store/AuthContext'
import  "./App.css"
import AddStudentsCSV from './components/AddStudentsCSV'


function App() {
  const {user,setUser}=useContext(AuthContext)
  let isAdmin=location.pathname === "/admin"
  if(!isAdmin){
    isAdmin=location.pathname === "/alogin"
  }

  

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      setUser(user);
    });
    // console.log(user);
  });

  return (
    <div>
   
        <PersonInfo>
          <GetTokens>

          <Navbar isAdmin={isAdmin}/>
      <Routes>
        <Route path='/' element={<Home/>}/>

        <Route path='/login' Component={Login} />
        <Route path='/student-portal' Component={StudentPort} />
        <Route path='/list' Component={List} />
        <Route path='/lunch' Component={Section}></Route>
        <Route path='/menu' Component={Fmenu}></Route>
        <Route path='/breakfast' Component={SectionBF} />
        <Route path='/admin'  Component={Admin} ></Route>
        <Route path='/astudent-port' element={user ? <AstudentPort /> : <Navigate to="/alogin" />}></Route>
        <Route path='/pdfg' Component={GeneratePdf}></Route>
        <Route path='/alogin' element={user ? <Admin /> : <AdminLogin />} />
        <Route path='/m-tokens' element={user ? <Mtokens/> : <Navigate to="/alogin"/>} />
        <Route path='/add-students' element={user ? <AddStudentsCSV/> : <Navigate to="/alogin"/>} />
      </Routes>
          </GetTokens>
        </PersonInfo>
    </div>
  )
}

export default App