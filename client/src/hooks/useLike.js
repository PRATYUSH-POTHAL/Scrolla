import { useState, useCallback, useEffect } from 'react';
import { postService } from '../services/postService';

export const useLike = (initialLiked = false, initialLikeCount = 0, postId) => {
    const [liked, setLiked] = useState(initialLiked);
    const [likeCount, setLikeCount] = useState(initialLikeCount);

    useEffect(() => {
        setLiked(initialLiked);
    }, [initialLiked]);

    useEffect(() => {
        setLikeCount(initialLikeCount);
    }, [initialLikeCount]);

    const toggleLike = useCallback(async () => {
        if (!postId) return;
        try {
            const response = await postService.likePost(postId);
            setLiked(response.liked);
            setLikeCount(response.likeCount);
        } catch (error) {
            console.error('Error liking post:', error);
        }
    }, [postId]);

    return { liked, likeCount, toggleLike };
};
