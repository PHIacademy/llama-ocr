import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

export default function OCRInterface() {
  const [image, setImage] = useState(null);
  const [markdown, setMarkdown] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setIsProcessing(true);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(file);

    // Create form data
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const data = await response.json();
      setMarkdown(data.markdown);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">OCR: Document to Markdown</h1>
        <p className="text-center text-gray-600 mb-8">
          Upload an image to turn it into structured markdown 
          <span className="text-gray-500 italic">(PDF support soon!)</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column - Image upload */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Image:</h2>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {image ? (
                <img 
                  src={image} 
                  alt="Uploaded document" 
                  className="max-w-full h-auto mx-auto"
                />
              ) : (
                <div className="space-y-4">
                  <Upload className="w-16 h-16 mx-auto text-gray-400" />
                  <div>
                    <p className="text-xl font-semibold">Upload an image</p>
                    <p className="text-gray-500">or drag and drop</p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Select File
                  </button>
                </div>
              )}
            </div>
            <p className="text-center text-blue-500 hover:underline cursor-pointer">
              Need an example image? Try ours.
            </p>
          </div>

          {/* Right column - Markdown output */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Markdown:</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[400px]">
              {isProcessing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : markdown ? (
                <pre className="whitespace-pre-wrap">{markdown}</pre>
              ) : (
                <div className="text-gray-400 text-center">
                  Results will appear here...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}