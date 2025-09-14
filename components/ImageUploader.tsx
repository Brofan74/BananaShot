import React, { useRef } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
    onImageUpload: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onImageUpload(event.target.files[0]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="h-full w-full flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-2xl text-center">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
                    GN Banana Редактор
                </h1>
                <p className="text-gray-400 mb-8">Сверхбыстрое редактирование изображений с помощью ИИ, на лету.</p>

                <div
                    onClick={handleClick}
                    className="relative block w-full rounded-lg border-2 border-dashed border-gray-600 p-12 text-center hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer transition-all duration-300 ease-in-out"
                >
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                    <span className="mt-2 block text-sm font-semibold text-gray-300">
                        Нажмите, чтобы загрузить изображение
                    </span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default ImageUploader;