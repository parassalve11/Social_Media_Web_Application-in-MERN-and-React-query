import { Bell, Bookmark, Home, MessageSquare, Search, Settings, User, Shield } from "lucide-react";
import Navbar from "./Navbar";
import SidebarLayout from "../UI/sidebar/SidebarLayout";
import { FaGithub, FaTwitter } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../lib/axiosIntance";
import { useLocation } from "react-router-dom"; // Import useLocation

function Layout({ children }) {
  const location = useLocation(); // Get current route

  const {
    data: unreadCount,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const response = await axiosInstance.get('/notifications/unread-count');
      return response.data.count; // Expecting { count: number }
    },
  });

  const menuItems = [
    { label: "Home", href: "/", icon: <Home className="h-5 w-5" /> },
    { label: "Messages", href: "/messages", icon: <MessageSquare className="h-5 w-5" /> },
    {
      label: "Notifications",
      href: "/notifications",
      icon: <Bell className="h-5 w-5" />,
      count: isLoading || error ? 0 : unreadCount || 0,
    },
    { label: "Bookmarks", href: "/bookmarks", icon: <Bookmark className="h-5 w-5" /> },
    { label: "Search", href: "/search", icon: <Search className="h-5 w-5" /> },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      subItems: [
        { label: "Profile", href: "/settings/profile", icon: <User className="h-4 w-4" /> },
        { label: "Account", href: "/settings/account", icon: <Settings className="h-4 w-4" /> },
        { label: "Privacy", href: "/settings/privacy", icon: <Settings className="h-4 w-4" /> },
        { label: "Security", href: "/settings/security", icon: <Shield className="h-4 w-4" /> },
      ],
    },
  ];

  // Define routes where the sidebar should be hidden
  const hideSidebarRoutes = ["/signup", "/signin",'/messages'];

  // Check if the current route is one where the sidebar should be hidden
  const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-white overflow-visible">
      
      {shouldHideSidebar ? (
        <main className="h-screen">{children}</main>
      ) : (
        <>
        <Navbar />
        <SidebarLayout
          menuItems={menuItems}
          logo={<div className="text-2xl font-bold text-blue-600">MyApp</div>}
          footer={
            <div className="flex flex-col gap-3 p-4 bg-gradient-to-t from-gray-100 to-white rounded-lg shadow-sm">
              <div className="flex gap-3">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-600 transition-colors duration-200"
                  aria-label="Twitter"
                >
                  <FaTwitter className="h-5 w-5" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-600 transition-colors duration-200"
                  aria-label="GitHub"
                >
                  <FaGithub className="h-5 w-5" />
                </a>
              </div>
              <div className="text-xs text-gray-500 text-center">
                © 2025 MyApp. All rights reserved.
              </div>
            </div>
          }
        >
          <main className="h-screen">{children}</main>
        </SidebarLayout>
        </>
      )}
    </div>
  );
}

export default Layout;