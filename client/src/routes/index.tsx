import { Navigate, Route, Routes } from 'react-router-dom'
import App from '../App'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Home from '../pages/Home'
import Chat from '../pages/Chat'
import Chats from '../pages/Chats'
import Profile from '../pages/Profile'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Home />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chat/:id_sala" element={<Chat />} />
        <Route path="/:username" element={<Profile />} />
      </Route>
    </Routes>
  )
}
