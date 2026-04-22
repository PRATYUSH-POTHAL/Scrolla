import { useInfiniteQuery } from '@tanstack/react-query';
import { postService } from '../services/postService';

export const usePosts = (filters = {}) => {
    return useInfiniteQuery({
        queryKey: ['posts', filters],
        queryFn: async ({ pageParam = 1 }) => {
            const data = await postService.getPosts({ ...filters, page: pageParam, limit: 10 });
            return data;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.pages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
    });
};
