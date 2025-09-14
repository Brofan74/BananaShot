import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tool, Filter } from '../types';
import { editImageWithPrompt, fileToBase64 } from '../services/geminiService';
import LoadingOverlay from './LoadingOverlay';
import { BrushIcon, FiltersIcon, MicIcon, EnhanceIcon, BackIcon, DownloadIcon, CloseIcon, FrameIcon } from './icons';

// Fix: Add types for the experimental SpeechRecognition API to avoid TypeScript errors.
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    lang: string;
    onstart: () => void;
    onend: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    start(): void;
    stop(): void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

interface EditorViewProps {
    imageFile: File;
    onReset: () => void;
}

const FILTERS: Filter[] = [
    { name: 'Искусство', prompt: 'Преврати это изображение в яркую, абстрактную картину с жирными мазками.', isPro: false },
    { name: 'Ретро VHS', prompt: 'Придай этому изображению вид ретро VHS, с линиями развертки, растеканием цвета и слегка размытым, ностальгическим ощущением.', isPro: false },
    { name: 'Киберпанк', prompt: 'Примени к этому изображению эстетику киберпанка, с неоновыми огнями, темной, мрачной атмосферой и холодными синими и розовыми тонами.', isPro: false },
    { name: 'Золотой час', prompt: 'Улучши это изображение так, чтобы оно выглядело, как будто снято в золотой час, с теплым, мягким и сияющим светом.', isPro: true },
    { name: 'Нуар', prompt: 'Преобразуй это изображение в высококонтрастный черно-белый стиль нуарного фильма, с глубокими тенями и драматическим освещением.', isPro: true },
    { name: 'Мечтательный поп-арт', prompt: 'Придай этому изображению мечтательный, пастельный вид в стиле поп-арт.', isPro: true },
];

const EditorView: React.FC<EditorViewProps> = ({ imageFile, onReset }) => {
    const [originalImagePreview, setOriginalImagePreview] = useState<string>('');
    const [editedImage, setEditedImage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingText, setLoadingText] = useState<string>('Применяем магию...');
    const [error, setError] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<Tool>(Tool.Brush);
    const [prompt, setPrompt] = useState<string>('');

    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const previewUrl = URL.createObjectURL(imageFile);
        setOriginalImagePreview(previewUrl);
        setEditedImage('');
        return () => URL.revokeObjectURL(previewUrl);
    }, [imageFile]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'ru-RU';
            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setPrompt(transcript);
                handleApplyEdit(transcript);
            };
        }
    }, []);

    const handleApplyEdit = useCallback(async (currentPrompt: string) => {
        if (!currentPrompt.trim()) return;

        setIsLoading(true);
        setLoadingText('Колдуем над пикселями...');
        setError(null);

        try {
            const { mimeType, data } = await fileToBase64(imageFile);
            const result = await editImageWithPrompt(data, mimeType, currentPrompt);
            setEditedImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка.');
        } finally {
            setIsLoading(false);
        }
    }, [imageFile]);
    
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = editedImage || originalImagePreview;
        link.download = `edited-${imageFile.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleListen = () => {
        if (!recognitionRef.current) {
            setError("Распознавание речи не поддерживается в вашем браузере.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };
    
    const renderActiveToolUI = () => {
        switch (activeTool) {
            case Tool.Brush:
                return (
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyEdit(prompt); }} className="w-full flex items-center gap-2">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="напр., 'добавь радугу в небе'"
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                        />
                        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Применить
                        </button>
                    </form>
                );
            case Tool.Filters:
                return (
                    <div className="w-full overflow-x-auto pb-2">
                        <div className="flex items-center gap-3">
                            {FILTERS.map(filter => (
                                <button key={filter.name} onClick={() => handleApplyEdit(filter.prompt)} className="relative flex-shrink-0 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-purple-600/50 hover:border-purple-500 transition-all text-sm font-semibold whitespace-nowrap">
                                    {filter.name}
                                    {filter.isPro && <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full px-1.5 py-0.5">PRO</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case Tool.Voice:
                 return (
                    <div className="w-full flex flex-col items-center justify-center gap-2">
                        <button onClick={toggleListen} className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-red-500' : 'bg-purple-600 hover:bg-purple-700'}`}>
                            <MicIcon className="w-8 h-8 text-white" />
                            {isListening && <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>}
                        </button>
                        <p className="text-gray-400 text-sm">{isListening ? 'Слушаю...' : 'Нажмите, чтобы произнести команду'}</p>
                    </div>
                 );
            case Tool.Enhance:
                return (
                    <div className="w-full flex flex-col items-center justify-center gap-2">
                         <button onClick={() => handleApplyEdit('Subtly enhance the lighting, color, and sharpness of the main subject. Keep it natural.')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2">
                            <EnhanceIcon className="w-5 h-5"/>
                            Автоулучшение
                        </button>
                        <p className="text-gray-400 text-sm">Улучшение в один клик с помощью ИИ</p>
                    </div>
                );
            case Tool.Frame:
                return (
                    <div className="w-full flex flex-col items-center justify-center gap-2">
                         <button onClick={() => handleApplyEdit('Intelligently crop this image to improve the composition and focus on the main subject. The result should be a powerful, well-balanced image.')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2">
                            <FrameIcon className="w-5 h-5"/>
                            Автокадрирование
                        </button>
                        <p className="text-gray-400 text-sm">Умное кадрирование с помощью ИИ</p>
                    </div>
                );
            default:
                return null;
        }
    };
    
    const ToolButton = ({ tool, label, icon }: { tool: Tool, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTool(tool)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[64px] ${activeTool === tool ? 'bg-purple-600/30 text-purple-300' : 'text-gray-400 hover:bg-gray-700/50'}`}
        >
            {icon}
            <span className="text-xs font-medium whitespace-nowrap">{label}</span>
        </button>
    );

    return (
        <div className="h-screen w-screen flex flex-col bg-gray-900">
            {isLoading && <LoadingOverlay loadingText={loadingText} />}
            {error && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
                    <p>{error}</p>
                    <button onClick={() => setError(null)}><CloseIcon className="w-5 h-5"/></button>
                </div>
            )}

            <header className="absolute top-0 left-0 right-0 z-10 p-4 bg-black/30 backdrop-blur-lg">
                <div className="flex justify-between items-center">
                    <button onClick={onReset} className="p-2 rounded-full hover:bg-white/10 transition-colors"><BackIcon className="w-6 h-6"/></button>
                    <h2 className="font-bold text-lg">GN Banana Редактор</h2>
                    <button onClick={handleDownload} className="p-2 rounded-full hover:bg-white/10 transition-colors" disabled={!editedImage && !originalImagePreview}>
                      <DownloadIcon className="w-6 h-6"/>
                    </button>
                </div>
            </header>

            <main className="flex-1 flex justify-center items-center p-4 pt-20 pb-56 overflow-hidden">
                <img src={editedImage || originalImagePreview} alt="Предпросмотр" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"/>
            </main>
            
            <footer className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gray-900/50 backdrop-blur-xl border-t border-white/10">
                <div className="flex justify-around items-center mb-4">
                    <ToolButton tool={Tool.Brush} label="Волшебная кисть" icon={<BrushIcon className="w-6 h-6" />} />
                    <ToolButton tool={Tool.Filters} label="Фильтры" icon={<FiltersIcon className="w-6 h-6" />} />
                    <ToolButton tool={Tool.Enhance} label="Улучшить" icon={<EnhanceIcon className="w-6 h-6" />} />
                    <ToolButton tool={Tool.Frame} label="Рамка" icon={<FrameIcon className="w-6 h-6" />} />
                    <ToolButton tool={Tool.Voice} label="Голос" icon={<MicIcon className="w-6 h-6" />} />
                </div>
                <div className="h-24 flex items-center justify-center p-2 bg-black/20 rounded-lg">
                    {renderActiveToolUI()}
                </div>
            </footer>
        </div>
    );
};

export default EditorView;