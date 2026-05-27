import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import ActiveJob from "./pages/ActiveJob"
import MyJobs from "./pages/MyJobs"
import Earnings from "./pages/Earnings"
import Profile from "./pages/Profile"
import Wallet from "./pages/Wallet"
import BottomNav from "./components/BottomNav"
import JobAlertPopup from "./components/JobAlertPopup"
import { useLocation } from "react-router-dom"

function PrivateRoute({ children }) {
  const token = localStorage.getItem('mechanic_token')
  return token ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const token = localStorage.getItem('mechanic_token')
  return !token ? children : <Navigate to="/" replace />
}

function Layout({ children }) {
  const location = useLocation()
  const hideNav = ["/login", "/register"].includes(location.pathname)
  return (
    <div className="bg-[#F5F5F7] min-h-screen">
      <main className="max-w-md mx-auto min-h-screen relative overflow-hidden bg-[#F5F5F7]">
        {children}
        {!hideNav && <BottomNav />}
        {!hideNav && <JobAlertPopup />}
      </main>
    </div>
  )
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/"         element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/job/:id"  element={<PrivateRoute><ActiveJob /></PrivateRoute>} />
        <Route path="/my-jobs"  element={<PrivateRoute><MyJobs /></PrivateRoute>} />
        <Route path="/earnings" element={<PrivateRoute><Earnings /></PrivateRoute>} />
        <Route path="/profile"  element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/wallet"   element={<PrivateRoute><Wallet /></PrivateRoute>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
