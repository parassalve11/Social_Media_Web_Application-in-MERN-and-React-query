import React from 'react';
import PostEditor from '../components/posts/PostEditor';
import { Tabs } from '../components/UI/Tabs';
import RecommendedUsers from '../components/RecommandedUsers'; 
import ForYouFeed from '../components/posts/ForYouFeed';
import FollowingFeed from '../components/posts/FollowingFeed';
import TrendingBar from '../components/TrendingBar';
import { useUser } from '../store/user/useUser';

const HomePage = () => {


 const {  user:authUser } = useUser();

  const tabs = [
    {
      value: 'tab1',
      label: 'For You',
      content: <ForYouFeed />,
    },
    {
      value: 'tab2',
      label: 'Following',
      content: <FollowingFeed />,
    },
  ];

  return (
    <div className="w-full flex flex-col sm:flex-row gap-4 p-4">
      {/* Main content */}
      <div className="w-full sm:flex-1 space-y-4 sm:space-y-6">
        <PostEditor user={authUser} />
        <Tabs tabs={tabs} variant="pill" className="w-full" />
      </div>

      {/* Sidebar with sticky content */}
      <div className="hidden sm:block sm:w-80 lg:w-96 shrink-0">
        <div className="sticky top-4 space-y-4">
          <TrendingBar />
          <RecommendedUsers />
        </div>
      </div>
    </div>
  );
};


export default HomePage;