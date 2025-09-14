import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import EditorView from './components/EditorView';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
  };
  
  const handleReset = () => {
    setImageFile(null);
  }

  return (
    <div className="h-screen w-screen bg-gray-900">
      {!imageFile ? (
        <ImageUploader onImageUpload={handleImageUpload} />
      ) : (
        <EditorView imageFile={imageFile} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;