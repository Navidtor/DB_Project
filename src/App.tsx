import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Auth
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Diagrams (kept for documentation)
import ERDiagram from "./components/ERDiagram";
import EERDiagram from "./components/EERDiagram";

// Layout
import AppLayout from "./components/layout/AppLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import PostsPage from "./pages/PostsPage";
import PostDetailPage from "./pages/PostDetailPage";
import NewPostPage from "./pages/NewPostPage";
import EditPostPage from "./pages/EditPostPage";
import PlacesPage from "./pages/PlacesPage";
import CompanionsPage from "./pages/CompanionsPage";
import ProfilePage from "./pages/ProfilePage";
import UsersPage from "./pages/UsersPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TestPage from "./pages/TestPage";

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      }>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Documentation Routes */}
          <Route path="/eer-diagram" element={<EERDiagram />} />
          <Route path="/er-diagram" element={<ERDiagram />} />
          
          {/* Main App Routes - Protected */}
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="posts/new" element={<NewPostPage />} />
            <Route path="posts/:postId" element={<PostDetailPage />} />
            <Route path="posts/:postId/edit" element={<EditPostPage />} />
            <Route path="places" element={<PlacesPage />} />
            <Route path="companions" element={<CompanionsPage />} />
            <Route path="companions/:requestId" element={<CompanionsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="settings" element={<ProfilePage />} />
            <Route path="test" element={<TestPage />} />
          </Route>
          
          {/* Redirect root to app */}
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
