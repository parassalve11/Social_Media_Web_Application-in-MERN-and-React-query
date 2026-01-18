// components/Layout/Layout.jsx
import {
  Bell,
  Bookmark,
  Home,
  MessageSquare,
  Search,
  Settings,
  User,
  Shield,
  Zap,
} from "lucide-react";
import SidebarLayout from "../UI/sidebar/SidebarLayout";
import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../lib/axiosIntance";
import { useLocation } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";

function Layout({ children }) {
  const location = useLocation();

  const {
    data: unreadCount,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: async () => {
      const response = await axiosInstance.get("/notifications/unread-count");
      return response.data.count;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const menuItems = [
    {
      label: "Home",
      href: "/",
      icon: <Home className="h-5 w-5" />,
      activeColor: "text-blue-600",
    },
    {
      label: "Messages",
      href: "/messages",
      icon: <MessageSquare className="h-5 w-5" />,
      activeColor: "text-green-600",
    },
    {
      label: "Notifications",
      href: "/notifications",
      icon: <Bell className="h-5 w-5" />,
      count: isLoading || error ? 0 : unreadCount || 0,
      activeColor: "text-red-600",
    },
    {
      label: "Bookmarks",
      href: "/bookmarks",
      icon: <Bookmark className="h-5 w-5" />,
      activeColor: "text-amber-600",
    },
    {
      label: "Search",
      href: "/search",
      icon: <Search className="h-5 w-5" />,
      activeColor: "text-purple-600",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      activeColor: "text-gray-600",
      subItems: [
        {
          label: "Profile",
          href: "/settings/profile",
          icon: <User className="h-4 w-4" />,
        },
        {
          label: "Account",
          href: "/settings/account",
          icon: <Settings className="h-4 w-4" />,
        },
        {
          label: "Privacy",
          href: "/settings/privacy",
          icon: <Shield className="h-4 w-4" />,
        },
        {
          label: "Security",
          href: "/settings/security",
          icon: <Shield className="h-4 w-4" />,
        },
      ],
    },
  ];

  // Define routes where the sidebar should be hidden
  const hideSidebarRoutes = ["/signup", "/signin", "/messages"];

  // Check if the current route is one where the sidebar should be hidden
  const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-visible">
      <AnimatePresence mode="wait">
        {shouldHideSidebar ? (
          <Motion.main
            key="no-sidebar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen"
          >
            {children}
          </Motion.main>
        ) : (
          <Motion.div
            key="with-sidebar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SidebarLayout
              menuItems={menuItems}
              logo={
                <Motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap size={24} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      MyApp
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      Connect & Share
                    </span>
                  </div>
                </Motion.div>
              }
              footer={
                <div className="p-4 space-y-4">
                  {/* Social Links */}
                  <div className="flex items-center justify-center gap-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <Motion.a
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-500 transition-colors duration-200"
                      aria-label="Twitter"
                    >
                      <FaTwitter className="h-5 w-5" />
                    </Motion.a>
                    <Motion.a
                      whileHover={{ scale: 1.2, rotate: -5 }}
                      whileTap={{ scale: 0.9 }}
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                      aria-label="GitHub"
                    >
                      <FaGithub className="h-5 w-5" />
                    </Motion.a>
                    <Motion.a
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-700 transition-colors duration-200"
                      aria-label="LinkedIn"
                    >
                      <FaLinkedin className="h-5 w-5" />
                    </Motion.a>
                  </div>

                  {/* Copyright */}
                  <div className="text-center space-y-1">
                    <p className="text-xs text-gray-500 font-medium">
                      © 2025 MyApp
                    </p>
                    <p className="text-xs text-gray-400">
                      Made with ❤️ for the community
                    </p>
                  </div>

                  {/* Links */}
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <a
                      href="/privacy"
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      Privacy
                    </a>
                    <span className="text-gray-300">·</span>
                    <a
                      href="/terms"
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      Terms
                    </a>
                    <span className="text-gray-300">·</span>
                    <a
                      href="/help"
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      Help
                    </a>
                  </div>
                </div>
              }
            >
              <main className="h-screen overflow-y-auto">
                <Motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {children}
                </Motion.div>
              </main>
            </SidebarLayout>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Layout;