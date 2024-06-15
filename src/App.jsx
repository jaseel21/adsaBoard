import React from 'react'
import Home from "./components/Home"
import Login from './components/Login'
import StudentPort from './components/StudentPort'
import {Route,Routes,useLocation} from 'react-router-dom'
import  PersonInfo  from './store/StudentData'

function App() {
  return (
    <div>
   
        <PersonInfo>
      <Routes>
        <Route path='/' element={<Home/>}/>

        <Route path='/login' Component={Login} />
        <Route path='/student-portal' Component={StudentPort} />
      </Routes>
        </PersonInfo>
    </div>
  )
}

export default App