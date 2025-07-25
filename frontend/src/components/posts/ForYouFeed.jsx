import { useInfiniteQuery } from '@tanstack/react-query';
import axiosInstance from '../../lib/axiosIntance'; 
import InfiniteScrollContainer from './InfiniteScrollContainer'; 
import {  Loader2, Users2 } from 'lucide-react';
import Post from './Post';
import PostSkeleton from './PostSkeleton';

const ForYouFeed = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['for-you'],
    queryFn: async ({ pageParam }) => {
      const response = await axiosInstance.get('/posts/for-you', {
        params: pageParam ? { cursor: pageParam } : {},
      });
      return response.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    keepPreviousData: true, // Prevents flickering during page transitions
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  if (isLoading) {
    return <PostSkeleton />
  }

  if (isError) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  if (!posts.length && !hasNextPage) {
    return <div className="text-center py-6 text-gray-500">
              <Users2 className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No Posts at the moment.</p>
            </div>
  }

  return (
    <InfiniteScrollContainer className="space-y-6 max-w-4xl mx-auto" onBottomReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}>
      {posts.map((post) => (
        <Post key={post._id} post={post} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" size={24} />}
    </InfiniteScrollContainer>
  );
};

export default ForYouFeed;