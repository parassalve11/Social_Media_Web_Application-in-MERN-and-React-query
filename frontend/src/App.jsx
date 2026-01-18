import { useQuery } from "@tanstack/react-query";
import axiosInstance from "./lib/axiosIntance.js";
import Layout from "./components/layout/Layout.jsx";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/auth/SignUpPage.jsx";
import SignInPage from "./pages/auth/SignInPage.jsx";
import NotificationPage from "./pages/NotificationPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import BookmarkPage from "./pages/BookmarkPage.jsx";
import FollowersPage from "./pages/FollowersPage.jsx";
import FollowingPage from "./pages/FollowingPage.jsx";
import HashtagPosts from "./components/HashtagPosts.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import PostPage from "./pages/PostPage.jsx";
import ConfromEmailPage from "./pages/forget-password/ConfromEmailPage.jsx";
import VerifyPage from "./pages/forget-password/VerifyPage.jsx";
import ResetPasswordPage from "./pages/forget-password/ResetPasswordPage.jsx";
import { useUser } from "./store/user/useUser.js";

import MessagePage from "./pages/MessagePage.jsx";

function App() {
  const { setUser } = useUser();
  const { data: user, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        if (!res) return null;
        setUser(res?.data);
        
        return res.data;
      } catch (error) {
        if (error.response || error.response.status === 401) return null;
        console.log("Error while locating authUser", error.message);
      }
    },
    // ✅ IMPORTANT OPTIONS
    staleTime: Infinity, // never refetch automatically
    cacheTime: Infinity, // keep cached forever
    refetchOnWindowFocus: false, // 🔥 STOP tab switch refetch
    refetchOnReconnect: false, // stop network refetch
    refetchOnMount: false, // stop remount refetch
  });

  if (isLoading) return null;

  return (
    <Layout>
      
      <Routes>
        <Route
          path="/signup"
          element={!user ? <SignUpPage /> : <Navigate to={"/"} />}
        />
        <Route
          path="/signin"
          element={!user ? <SignInPage /> : <Navigate to={"/"} />}
        />

        <Route
          path="/forget-password/check"
          element={!user ? <ConfromEmailPage /> : <Navigate to={"/"} />}
        />
        <Route
          path="/verify/:email"
          element={!user ? <VerifyPage /> : <Navigate to={"/"} />}
        />

        <Route
          path="/forget-password/:email/reset"
          element={!user ? <ResetPasswordPage /> : <Navigate to={"/"} />}
        />

        <Route
          path="/"
          element={user ? <HomePage /> : <Navigate to={"/signin"} />}
        />

        <Route
          path="/notifications"
          element={
            user ? <NotificationPage /> : <Navigate to={"/signin"} />
          }
        />
        <Route
          path="/profile/:username"
          element={user ? <ProfilePage /> : <Navigate to={"/signin"} />}
        />
        <Route
          path="/bookmarks"
          element={user ? <BookmarkPage /> : <Navigate to={"/signin"} />}
        />
        <Route
          path="/profile/:username/followers"
          element={user ? <FollowersPage /> : <Navigate to={"/signin"} />}
        />
        <Route
          path="/profile/:username/following"
          element={user ? <FollowingPage /> : <Navigate to={"/signin"} />}
        />

        <Route
          path="/hashtag/:hashtag"
          element={user ? <HashtagPosts /> : <Navigate to={"/signin"} />}
        />
        <Route
          path="/search"
          element={user ? <SearchPage /> : <Navigate to={"/signin"} />}
        />

        <Route
          path="/post/:postId"
          element={user ? <PostPage /> : <Navigate to={"/signin"} />}
        />
        <Route
          path="/messages"
          element={user ? <MessagePage /> : <Navigate to={"/signin"} />}
        />
      </Routes>
    </Layout>
  );
}

export default App;
