import { useState, useRef, useEffect } from 'react';

const FILTERS = [
    { id: 'none', label: 'None', css: 'none', cloudinary: '' },
    { id: 'sepia', label: 'Sepia', css: 'sepia(0.8)', cloudinary: 'e_sepia' },
    { id: 'grayscale', label: 'B&W', css: 'grayscale(1)', cloudinary: 'e_grayscale' },
    { id: 'contrast', label: 'Contrast', css: 'contrast(1.4)', cloudinary: 'e_contrast:50' },
    { id: 'brightness', label: 'Bright', css: 'brightness(1.3)', cloudinary: 'e_brightness:30' },
    { id: 'warmth', label: 'Warm', css: 'sepia(0.3) saturate(1.5)', cloudinary: 'e_tint:40:red:yellow' },
    { id: 'cool', label: 'Cool', css: 'saturate(0.8) hue-rotate(20deg)', cloudinary: 'e_tint:40:blue:cyan' },
    { id: 'blur', label: 'Blur', css: 'blur(2px)', cloudinary: 'e_blur:200' },
    { id: 'vignette', label: 'Vignette', css: 'none', cloudinary: 'e_vignette:50' },
];

const ASPECT_RATIOS = [
    { id: 'original', label: 'Original', icon: '⊡' },
    { id: '1:1', label: '1:1', icon: '◼' },
    { id: '16:9', label: '16:9', icon: '▬' },
    { id: '4:3', label: '4:3', icon: '▭' },
    { id: '9:16', label: '9:16', icon: '▮' },
];

const ImageEditor = ({ file, existingUrl, onSave, onCancel }) => {
    const [imageUrl, setImageUrl] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [aspectRatio, setAspectRatio] = useState('original');

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (existingUrl) {
            setImageUrl(existingUrl);
        }
    }, [file, existingUrl]);

    const getCssFilter = () => {
        const filter = FILTERS.find(f => f.id === selectedFilter);
        return filter?.css || 'none';
    };

    const getAspectRatioStyle = () => {
        const map = { 'original': 'auto', '1:1': '1/1', '16:9': '16/9', '4:3': '4/3', '9:16': '9/16' };
        return map[aspectRatio] || 'auto';
    };

    const handleSave = () => {
        onSave({
            filter: selectedFilter,
            aspectRatio,
        });
    };

    return (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
            {/* Image Preview */}
            <div className="relative flex items-center justify-center bg-black p-4">
                <div
                    className="relative overflow-hidden rounded-lg max-h-96 w-full flex items-center justify-center"
                    style={{ aspectRatio: getAspectRatioStyle() !== 'auto' ? getAspectRatioStyle() : undefined }}
                >
                    <img
                        src={imageUrl}
                        alt="Edit preview"
                        className="max-w-full max-h-96 object-cover rounded-lg transition-all duration-200"
                        style={{
                            filter: getCssFilter() !== 'none' ? getCssFilter() : undefined,
                            aspectRatio: getAspectRatioStyle() !== 'auto' ? getAspectRatioStyle() : undefined,
                            objectFit: aspectRatio !== 'original' ? 'cover' : 'contain',
                            width: aspectRatio !== 'original' ? '100%' : undefined,
                        }}
                    />
                </div>
            </div>

            {/* Aspect Ratio */}
            <div className="px-4 py-3 border-t border-gray-700">
                <p className="text-white/60 text-xs mb-2 font-medium uppercase tracking-wide">Aspect Ratio</p>
                <div className="flex gap-2">
                    {ASPECT_RATIOS.map(ar => (
                        <button
                            type="button"
                            key={ar.id}
                            onClick={() => setAspectRatio(ar.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                aspectRatio === ar.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-700 text-white/60 hover:text-white'
                            }`}
                        >
                            <span className="mr-1">{ar.icon}</span> {ar.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 border-t border-gray-700">
                <p className="text-white/60 text-xs mb-2 font-medium uppercase tracking-wide">Filters</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {FILTERS.map(filter => (
                        <button
                            type="button"
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`relative rounded-lg overflow-hidden transition-all ${
                                selectedFilter === filter.id
                                    ? 'ring-2 ring-blue-500 scale-105'
                                    : 'hover:ring-1 hover:ring-white/30'
                            }`}
                        >
                            <img
                                src={imageUrl}
                                alt={filter.label}
                                className="w-full h-16 object-cover"
                                style={{ filter: filter.css !== 'none' ? filter.css : undefined }}
                            />
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white/80 text-xs py-1 text-center">
                                {filter.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 py-3 border-t border-gray-700 flex gap-3">
                <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                    Apply & Upload
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export { FILTERS as IMAGE_FILTERS };
export default ImageEditor;
