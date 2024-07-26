import React, { useState } from 'react'
import firebase from '../firebase/config'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'

function AdminLogin() {
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("adsacanteen@gmail.com")
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    firebase.auth().signInWithEmailAndPassword(email, password).then(() => {

      Swal.fire({
        title: 'Welcome back!',
        text: "You are an Admin",
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      })
      navigate("/admin")

    }).catch((error) => {
      Swal.fire({
        icon: 'error',
        title: 'Error...',
        text: 'Something went wrong!',
      })
    })
  }

  return (
    <div className="flex items-center justify-center pt-32  ">
    <div className="w-full max-w-md bg-white p-10 rounded-lg shadow-lg space-y-8">
      <h1 className="text-2xl font-semibold text-gray-700 text-center">Login to Admin</h1>
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="relative">
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            id="email"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder=" "
          />
          <label htmlFor="email" className="absolute top-2 left-4 text-gray-500 text-sm transition-transform transform -translate-y-2 scale-75 origin-top-left peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-2 peer-focus:scale-75 peer-focus:text-blue-500 peer-placeholder:text-blue-500">
            Email
          </label>
        </div>
        <div className="relative">
          <input
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            id="password"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder=" "
          />
          <label htmlFor="password" className="absolute top-2 left-4 text-gray-500 text-sm transition-transform transform -translate-y-2 scale-75 origin-top-left peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-2 peer-focus:scale-75 peer-focus:text-blue-500 peer-placeholder:text-blue-500">
            Password
          </label>
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ease-in-out duration-300"
        >
          Login
        </button>
      </form>
      <p className="text-center text-gray-600 text-sm">
        Don't have an account?{' '}
        <a href="/alogin" className="text-blue-500 hover:underline">Sign up</a>
      </p>
    </div>
  </div>
  )
}

export default AdminLogin
