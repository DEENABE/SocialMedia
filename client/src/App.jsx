import React, { useRef, useEffect } from 'react'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Feed from './pages/Feed'
import Messages from './pages/Messages'
import ChatBox from './pages/ChatBox'
import Connections from './pages/Connections'
import Discover from './pages/Discover'
import Profile from './pages/Profile'
import CreatePost from './pages/CreatePost'
import { useUser, useAuth } from '@clerk/clerk-react'
import Layout from './pages/Layout'
import toast, { Toaster } from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { fetchUser } from './features/user/userSlice'
import { fetchConnections } from './features/connections/connectionsSlice'
import { addMessage } from './features/messages/messagesSlice'
import Notification from './components/Notification'

const App = () => {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { pathname } = useLocation()
  const pathnameRef = useRef(pathname)
  const dispatch = useDispatch()

  // ✅ effects always run
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const token = await getToken()
          await dispatch(fetchUser(token))
          await dispatch(fetchConnections(token))
        } catch (error) {
          console.error('Failed to bootstrap app data', error)
        }
      }
    }
    fetchData()
  }, [user, getToken, dispatch])

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    if (user) {
      const eventSource = new EventSource(
        import.meta.env.VITE_BASEURL + '/api/message/' + user.id
      )

      eventSource.onmessage = (event) => {
        const message = JSON.parse(event.data)

        if (pathnameRef.current === '/messages/' + message.from_user_id._id) {
          dispatch(addMessage(message))
        } else {
          toast.custom((t) => (
            <Notification t={t} message={message} />
          ))
        }
      }

      return () => eventSource.close()
    }
  }, [user])

  return (
    <>
      <Toaster />

      {/* ✅ wait for clerk */}
      {!isLoaded ? (
        <div>Loading...</div>
      ) : (
       <Routes>

  {/* 🔓 Login Route */}
  <Route 
    path="/login" 
    element={!user ? <Login /> : <Navigate to="/feed" />} 
  />

  {/* 🔐 Protected Layout */}
  <Route 
    path="/" 
    element={user ? <Layout /> : <Navigate to="/login" />}
  >
    <Route index element={<Navigate to="feed" />} />
    <Route path="feed" element={<Feed />} />
    <Route path="messages" element={<Messages />} />
    <Route path="messages/:userId" element={<ChatBox />} />
    <Route path="connections" element={<Connections />} />
    <Route path="discover" element={<Discover />} />
    <Route path="profile" element={<Profile />} />
    <Route path="profile/:profileId" element={<Profile />} />
    <Route path="create-post" element={<CreatePost />} />
  </Route>

  {/* ❌ fallback */}
  <Route path="*" element={<div>Page Not Found</div>} />

</Routes>
      )}
    </>
  )
}

export default App
