import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Guard from './components/Guard'
import Home from './pages/Home'

// Home ships in the main bundle so the landing page paints without a second
// round trip. Everything else loads on demand — a visitor browsing the gallery
// never downloads the admin panel. Suspense lives around the Outlet in Layout.
const Gallery = lazy(() => import('./pages/Gallery'))
const GalleryItem = lazy(() => import('./pages/GalleryItem'))
const Upload = lazy(() => import('./pages/Upload'))
const Catches = lazy(() => import('./pages/Catches'))
const CatchNew = lazy(() => import('./pages/CatchNew'))
const Events = lazy(() => import('./pages/Events'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const News = lazy(() => import('./pages/News'))
const NewsPost = lazy(() => import('./pages/NewsPost'))
const Members = lazy(() => import('./pages/Members'))
const MemberProfile = lazy(() => import('./pages/MemberProfile'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Login = lazy(() => import('./pages/Login'))
const AuthAction = lazy(() => import('./pages/AuthAction'))
const Join = lazy(() => import('./pages/Join'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminMedia = lazy(() => import('./pages/admin/Media'))
const AdminCatches = lazy(() => import('./pages/admin/Catches'))
const AdminEvents = lazy(() => import('./pages/admin/Events'))
const AdminEventForm = lazy(() => import('./pages/admin/EventForm'))
const AdminNews = lazy(() => import('./pages/admin/News'))
const AdminNewsForm = lazy(() => import('./pages/admin/NewsForm'))
const AdminMembers = lazy(() => import('./pages/admin/Members'))
const AdminMessages = lazy(() => import('./pages/admin/Messages'))

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
      <Route path="/auth/action" element={<AuthAction />} />
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
