import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '../services/postService';
import toast from 'react-hot-toast';

export const usePostActions = (postId, initialSaved = false, onUpdate, onDelete) => {
    const queryClient = useQueryClient();

    const saveMutation = useMutation({
        mutationFn: () => postService.savePost(postId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['posts'] });
            const previousPages = queryClient.getQueryData(['posts']);

            queryClient.setQueriesData({ queryKey: ['posts'] }, (oldData) => {
                if (!oldData || !oldData.pages) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page) => ({
                        ...page,
                        posts: page.posts.map((post) => {
                            if (post._id === postId) {
                                return { ...post, isSaved: !post.isSaved };
                            }
                            return post;
                        }),
                    })),
                };
            });
            return { previousPages };
        },
        onError: (err, variables, context) => {
            if (context?.previousPages) {
                queryClient.setQueriesData({ queryKey: ['posts'] }, context.previousPages);
            }
            toast.error('Failed to update saved status');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
    });

    const hideMutation = useMutation({
        mutationFn: () => postService.hidePost(postId),
        onSuccess: () => {
            toast.success('Post hidden!');
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            if (onUpdate) onUpdate();
        }
    });

    const reportMutation = useMutation({
        mutationFn: () => postService.reportPost(postId),
        onSuccess: () => {
            toast.success('Post reported. Thank you!');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => postService.deletePost(postId),
        onSuccess: () => {
            toast.success('Post deleted!');
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            if (onDelete) onDelete(postId);
        }
    });

    const handleSave = useCallback(() => saveMutation.mutate(), [saveMutation]);
    const handleHide = useCallback(() => hideMutation.mutate(), [hideMutation]);
    const handleReport = useCallback(() => reportMutation.mutate(), [reportMutation]);
    
    const handleDelete = useCallback(() => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            deleteMutation.mutate();
        }
    }, [deleteMutation]);

    return {
        isSaved: initialSaved,
        handleSave,
        handleHide,
        handleReport,
        handleDelete
    };
};
