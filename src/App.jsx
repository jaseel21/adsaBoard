import React from 'react'
import Home from "./components/Home"
import Login from './components/Login'
import StudentPort from './components/StudentPort'
import Navbar from './components/NavBar'
import List from "./components/List"
import Section from './components/Section'

import Fmenu from "./components/Fmenu"
import {Route,Routes,generatePath,useLocation} from 'react-router-dom'
import  PersonInfo  from './store/StudentData'
import GetTokens from './store/GetDocuments'
import SectionBF from './components/SectionBF'
import Admin from './components/Admin'
import AstudentPort from './components/AstudentPort'
import GeneratePdf from "./components/GeneratePdf"

function App() {
  const isAdmin=location.pathname === "/admin"
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
        <Route path='/admin' Component={Admin} ></Route>
        <Route path='/astudent-port' Component={AstudentPort}></Route>
        <Route path='/pdfg' Component={GeneratePdf}></Route>
      </Routes>
          </GetTokens>
        </PersonInfo>
    </div>
  )
}

export default App