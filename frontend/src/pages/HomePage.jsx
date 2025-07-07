import PostEditor from "../components/posts/PostEditor";
import { useQuery } from "@tanstack/react-query";
import { Tabs } from "../components/UI/Tabs";
import RecommendedUsers from "../components/RecommandedUsers";
import ForYouFeed from "../components/posts/ForYouFeed";
import FollowingFeed from "../components/posts/FollowingFeed";
import TrendingBar from "../components/TrendingBar";

const HomePage = () => {
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  const tabs = [
    {
      value: "tab1",
      label: "For You",
      content: <ForYouFeed />,
    },
    {
      value: "tab2",
      label: "Following",
      content: <FollowingFeed />,
    },
  ];

  return (
    <div className="w-full flex flex-col sm:flex-row gap-4 p-4 min-h-screen">
      {/* Main content column */}
      <div className="w-full sm:w-[65%] lg:w-[60%] space-y-4 sm:space-y-6">
        <PostEditor user={authUser} />
        <Tabs tabs={tabs} variant="pill" className="w-full" />
      </div>
      {/* Right column (sticky RecommendedUsers and TrendingBar) */}
     <div className="hidden sm:block w-full sm:w-[35%] lg:w-[40%]">
  <div className="fixed top-24 right-4 w-[35%] lg:w-[30%] z-10 space-y-4">
    <TrendingBar />
    <RecommendedUsers />
  </div>
</div>
    </div>
  );
};

export default HomePage;