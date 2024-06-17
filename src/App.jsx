import React from 'react'
import Home from "./components/Home"
import Login from './components/Login'
import StudentPort from './components/StudentPort'
import Navbar from './components/NavBar'
import List from "./components/List"
import Section from './components/Section'

import Fmenu from "./components/Fmenu"
import {Route,Routes,useLocation} from 'react-router-dom'
import  PersonInfo  from './store/StudentData'
import GetTokens from './store/GetDocuments'
import SectionBF from './components/SectionBF'

function App() {
  return (
    <div>
   
        <PersonInfo>
          <GetTokens>

          <Navbar/>
      <Routes>
        <Route path='/' element={<Home/>}/>

        <Route path='/login' Component={Login} />
        <Route path='/student-portal' Component={StudentPort} />
        <Route path='/list' Component={List} />
        <Route path='/lunch' Component={Section}></Route>
        <Route path='/menu' Component={Fmenu}></Route>
        <Route path='/breakfast' Component={SectionBF} />
      </Routes>
          </GetTokens>
        </PersonInfo>
    </div>
  )
}

export default App