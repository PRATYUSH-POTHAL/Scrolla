import { useCallback } from 'react';
import { postService } from '../services/postService';

export const usePostActions = (postId, onUpdate, onDelete) => {
    const handleSave = useCallback(async () => {
        if (!postId) return;
        try {
            await postService.savePost(postId);
            alert('Post saved!');
        } catch (error) {
            console.error('Error saving post:', error);
        }
    }, [postId]);

    const handleHide = useCallback(async () => {
        if (!postId) return;
        try {
            await postService.hidePost(postId);
            alert('Post hidden!');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error hiding post:', error);
        }
    }, [postId, onUpdate]);

    const handleReport = useCallback(async () => {
        if (!postId) return;
        try {
            await postService.reportPost(postId);
            alert('Post reported. Thank you for helping keep Scrolla safe!');
        } catch (error) {
            console.error('Error reporting post:', error);
        }
    }, [postId]);

    const handleDelete = useCallback(async () => {
        if (!postId) return;
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await postService.deletePost(postId);
                alert('Post deleted!');
                if (onDelete) onDelete(postId);
            } catch (error) {
                console.error('Error deleting post:', error);
            }
        }
    }, [postId, onDelete]);

    return { handleSave, handleHide, handleReport, handleDelete };
};
