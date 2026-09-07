import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Guard from './components/Guard'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import GalleryItem from './pages/GalleryItem'
import Upload from './pages/Upload'
import Catches from './pages/Catches'
import CatchNew from './pages/CatchNew'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import News from './pages/News'
import NewsPost from './pages/NewsPost'
import Members from './pages/Members'
import MemberProfile from './pages/MemberProfile'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Join from './pages/Join'
import Profile from './pages/Profile'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import AdminMedia from './pages/admin/Media'
import AdminCatches from './pages/admin/Catches'
import AdminEvents from './pages/admin/Events'
import AdminEventForm from './pages/admin/EventForm'
import AdminNews from './pages/admin/News'
import AdminNewsForm from './pages/admin/NewsForm'
import AdminMembers from './pages/admin/Members'
import AdminMessages from './pages/admin/Messages'

const NotFound = () => <section className="sec"><div className="wrap"><h1>We couldn't find that page.</h1><p>The link may have changed. <a href="/">Back to the home page</a>.</p></div></section>

export default function App() {
  return <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/gallery/:id" element={<GalleryItem />} />
      <Route path="/upload" element={<Guard requireActive><Upload /></Guard>} />
      <Route path="/catches" element={<Catches />} />
      <Route path="/catches/new" element={<Guard requireActive><CatchNew /></Guard>} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:slug" element={<EventDetail />} />
      <Route path="/news" element={<News />} />
      <Route path="/news/:slug" element={<NewsPost />} />
      <Route path="/members" element={<Members />} />
      <Route path="/members/:id" element={<MemberProfile />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/join" element={<Join />} />
      <Route path="/profile" element={<Guard><Profile /></Guard>} />
      <Route path="/admin" element={<Guard requireAdmin><AdminLayout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="media" element={<AdminMedia />} />
        <Route path="catches" element={<AdminCatches />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="events/:id" element={<AdminEventForm />} />
        <Route path="news" element={<AdminNews />} />
        <Route path="news/:id" element={<AdminNewsForm />} />
        <Route path="members" element={<AdminMembers />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
}
