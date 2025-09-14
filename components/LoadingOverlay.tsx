import React from 'react';

const LoadingSpinner: React.FC = () => (
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
);

const LoadingOverlay: React.FC<{ loadingText?: string }> = ({ loadingText = "Применяем магию..." }) => {
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col justify-center items-center z-50 transition-opacity duration-300">
            <LoadingSpinner />
            <p className="mt-4 text-lg font-medium text-white animate-pulse">{loadingText}</p>
        </div>
    );
};

export default LoadingOverlay;