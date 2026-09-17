import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/layouts/AppLayout'

// Each page is its own chunk, fetched only when a user navigates to it,
// instead of every page shipping in the one main bundle up front.
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const HomeRoomPage = lazy(() => import('@/pages/HomeRoomPage'))
const StudyRoomPage = lazy(() => import('@/pages/StudyRoomPage'))
const TasksPage = lazy(() => import('@/pages/TasksPage'))
const DailyGoalsPage = lazy(() => import('@/pages/DailyGoalsPage'))
const FlashcardsPage = lazy(() => import('@/pages/FlashcardsPage'))
const ShopPage = lazy(() => import('@/pages/ShopPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const CommunityDiscoverPage = lazy(() => import('@/pages/CommunityDiscoverPage'))
const CommunityRoomPage = lazy(() => import('@/pages/CommunityRoomPage'))
const PostDetailPage = lazy(() => import('@/pages/PostDetailPage'))
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage'))
const BlogComposerPage = lazy(() => import('@/pages/BlogComposerPage'))
const ModerationQueuePage = lazy(() => import('@/pages/ModerationQueuePage'))
const StudyWithOthersPage = lazy(() => import('@/pages/StudyWithOthersPage'))

/**
 * Every authenticated room shares one layout: AppLayout renders the
 * Sidebar/BottomNavigation/GlobalPetLayer shell once, and each room
 * below only supplies its own content via <Outlet />. Adding a future
 * room (Bedroom, Kitchen, Garden, Community...) is one more <Route>
 * here, in src/config/navigation.ts, and nowhere else.
 */
function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<HomeRoomPage />} />
            <Route path="/study-room" element={<StudyRoomPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/daily-goals" element={<DailyGoalsPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/study-with-others" element={<StudyWithOthersPage />} />
            <Route path="/community" element={<CommunityDiscoverPage />} />
            <Route path="/community/:slug" element={<CommunityRoomPage />} />
            <Route path="/community/:slug/reports" element={<ModerationQueuePage />} />
            <Route path="/community/:slug/posts/:postId" element={<PostDetailPage />} />
            <Route path="/community/:slug/blog/new" element={<BlogComposerPage />} />
            <Route path="/community/:slug/blog/:blogId/edit" element={<BlogComposerPage />} />
            <Route path="/community/:slug/blog/:blogId" element={<BlogPostPage />} />
            <Route
                path="/shop" element={<ShopPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Sprint 4C/4D used /dashboard — keep old links and bookmarks working. */}
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default AppRouter
