import { Navigate, Route, Routes } from 'react-router-dom'
import App from '../App'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Home from '../pages/Home'
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
