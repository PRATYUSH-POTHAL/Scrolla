import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '../services/postService';

export const useLike = (initialLiked = false, initialLikeCount = 0, postId) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => postService.likePost(postId),
        onMutate: async () => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['posts'] });

            // Snapshot the previous value
            const previousPages = queryClient.getQueryData(['posts']);

            // Optimistically update to the new value
            queryClient.setQueriesData({ queryKey: ['posts'] }, (oldData) => {
                if (!oldData || !oldData.pages) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page) => ({
                        ...page,
                        posts: page.posts.map((post) => {
                            if (post._id === postId) {
                                return {
                                    ...post,
                                    isLiked: !post.isLiked,
                                    likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
                                };
                            }
                            return post;
                        }),
                    })),
                };
            });

            // Return a context object with the snapshotted value
            return { previousPages };
        },
        onError: (err, variables, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousPages) {
                queryClient.setQueriesData({ queryKey: ['posts'] }, context.previousPages);
            }
        },
        onSettled: () => {
            // Always refetch after error or success:
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });

    return { 
        liked: initialLiked, // PostCard passes down the latest from cache
        likeCount: initialLikeCount, 
        toggleLike: () => mutation.mutate() 
    };
};
