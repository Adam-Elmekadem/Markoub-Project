import './App.css'
import { AppProvider } from './contexts/AppContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ToastProvider } from './components/Toast'
import { AdminRoute } from './components/AdminRoute'
import { Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Contact } from './pages/Contact'
import { OfferRide } from './pages/OfferRide'
import { FindRide } from './pages/FindRide'
import { About } from './pages/About'
import { Blogs } from './pages/Blogs'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import { Users as AdminUsers } from './pages/admin/Users'
import { Rides as AdminRides } from './pages/admin/Rides'
import { Comments as AdminComments } from './pages/admin/Comments'
import { Blogs as AdminBlogs } from './pages/admin/Blogs'
import { SignIn } from './components/SignIn'
import { Login } from './components/Login'
import { Profile } from './pages/Profile'
import { MyRides } from './pages/MyRides'

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <div className="min-h-screen bg-white">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-rides" element={<MyRides />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/offer-ride" element={<OfferRide />} />
              <Route path="/find-ride" element={<FindRide />} />
              <Route path="/about" element={<About />} />
              <Route path="/blogs" element={<Blogs />} />
              {/* Admin - protected routes */}
              <Route path="/admin" element={<AdminRoute />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="rides" element={<AdminRides />} />
                <Route path="comments" element={<AdminComments />} />
                <Route path="blogs" element={<AdminBlogs />} />
              </Route>
              </Routes>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AppProvider>
  )
}

export default App
