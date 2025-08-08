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



function App() {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        if (!res) return null;
        return res.data;
      } catch (error) {
        if (error.response || error.response.status === 401) return null;
        console.log("Error while locating authUser", error.message);
      }
    },
  });

  if (isLoading) return null;

  return (
   
      <Layout>
        <Routes>
         
          <Route
            path="/signup"
            element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />}
          />
          <Route
            path="/signin"
            element={!authUser ? <SignInPage /> : <Navigate to={"/"} />}
          />

         
             <Route
            path="/"
            element={authUser ? <HomePage /> : <Navigate to={"/signin"} />}
          />
            
             <Route
            path="/notifications"
            element={authUser ? <NotificationPage /> : <Navigate to={"/signin"} />}
          />
             <Route
            path="/profile/:username"
            element={authUser ? <ProfilePage /> : <Navigate to={"/signin"} />}
          />
            <Route
            path="/bookmarks"
            element={authUser ? <BookmarkPage /> : <Navigate to={"/signin"} />}
          />
            <Route
            path="/profile/:username/followers"
            element={authUser ? <FollowersPage /> : <Navigate to={"/signin"} />}
          />
            <Route
            path="/profile/:username/following"
            element={authUser ? <FollowingPage /> : <Navigate to={"/signin"} />}
          />

          <Route path="/hashtag/:hashtag" element={ authUser ? <HashtagPosts /> : <Navigate to={"/signin"} />} 
          />
          <Route path="/search" element={ authUser ?<SearchPage /> : <Navigate to={"/signin"} />} 
          />

          <Route path="/post/:postId" element={authUser ? <PostPage />: <Navigate to={"/signin"}/>} />
        
        </Routes>

      </Layout>
  
  );
}

export default App;
