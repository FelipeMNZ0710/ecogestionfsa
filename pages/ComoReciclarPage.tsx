import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { User, Material, MaterialContent, QuizQuestion, GamificationAction, MaterialContentItem, ProcessStep, ImpactStat } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { sabiasQueData } from '../data/sabiasQueData';
import TriviaGame from '../components/games/TriviaGame';

const materialTypes: Material[] = ['papel', 'plastico', 'vidrio', 'metales', 'organico'];
const materialNames: Record<Material, string> = {
    papel: 'Papel y Cartón',
    plastico: 'Plásticos',
    vidrio: 'Vidrio',
    metales: 'Metales',
    organico: 'Orgánicos y Compost'
};

const PulsingScanner: React.FC = () => (
    <div className="pulsing-scanner">
        <div className="icon-wrapper">
            <div className="pulse-ring"></div>
            <div className="pulse-ring"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10l.01.01" /></svg>
        </div>
        <p className="mt-4 font-semibold text-lg animate-pulse">Analizando imagen...</p>
        <p className="text-sm text-text-secondary">La IA está identificando el objeto.</p>
    </div>
);


const MaterialInfoList: React.FC<{ title: string; items: MaterialContentItem[]; colorClass: string }> = ({ title, items, colorClass }) => (
    <div className="material-content-card flex-1">
        <h3 className={`text-xl font-bold mb-4 ${colorClass}`}>{title}</h3>
        <ul className="space-y-3">
            {items.map(item => <li key={item.text} className="flex items-start"><span className="text-xl mr-3">{item.icon}</span> <span className="text-text-secondary">{item.text}</span></li>)}
        </ul>
    </div>
);

const RecyclingProcess: React.FC<{ steps: ProcessStep[], title?: string }> = ({ steps, title = "El Viaje del Reciclaje" }) => (
    <div className="material-content-card">
        <h2 className="text-2xl font-bold font-display text-center text-text-main mb-6">{title}</h2>
        <div className="process-timeline">
            {steps.map(step => (
                <div key={step.step} className="process-step">
                    <div className="flex items-center mb-2">
                        <span className="text-2xl mr-4">{step.icon}</span>
                        <h4 className="font-bold text-primary text-lg">{step.title}</h4>
                    </div>
                    <p className="text-text-secondary">{step.description}</p>
                </div>
            ))}
        </div>
    </div>
);

const ImpactStats: React.FC<{ stats: ImpactStat[] }> = ({ stats }) => (
    <div className="material-content-card">
        <h2 className="text-2xl font-bold font-display text-center text-text-main mb-6">Impacto en Números</h2>
        <div className="impact-grid">
            {stats.map(stat => (
                <div key={stat.stat} className="impact-card">
                    <div className="impact-card-icon">{stat.icon}</div>
                    <div className="impact-card-value">{stat.value}</div>
                    <div className="impact-card-stat">{stat.stat}</div>
                </div>
            ))}
        </div>
    </div>
);


const ComoReciclarPage: React.FC<{ user: User | null, onUserAction: (action: GamificationAction, payload?: any) => void, isAdminMode: boolean }> = ({ user, onUserAction, isAdminMode }) => {
    const [activeTab, setActiveTab] = useState<Material>('papel');
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [guidesContent, setGuidesContent] = useState<Record<Material, MaterialContent> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isIdentifierActive, setIsIdentifierActive] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{name: string, isRecyclable: boolean, recyclingInstructions: string, reuseTips: string[]} | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY || '' }), []);

    useEffect(() => {
        const fetchGuides = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('http://localhost:3001/api/recycling-guides');
                if (!response.ok) throw new Error('Failed to fetch recycling guides');
                const data = await response.json();
                setGuidesContent(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGuides();
    }, []);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 1080, height: 1080 } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("No se pudo acceder a la cámara. Asegúrate de haber dado permiso en la configuración de tu navegador.");
            setIsIdentifierActive(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }, []);

    useEffect(() => {
        if (isIdentifierActive) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isIdentifierActive, startCamera, stopCamera]);

    const handleIdentify = async () => {
        if (!videoRef.current || !videoRef.current.srcObject) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsAnalyzing(false);
            return;
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = dataUrl.split(',')[1];
        
        const model = 'gemini-2.5-flash';
        const prompt = `Analiza la imagen e identifica el objeto principal. Tu tarea es proporcionar información útil sobre reciclaje y reutilización para este objeto, específicamente para un usuario en Formosa, Argentina. Responde SIEMPRE en formato JSON, adhiriéndote estrictamente al siguiente esquema:
- name: string (El nombre del objeto identificado, ej: "Botella de plástico PET")
- isRecyclable: boolean (Indica si es comúnmente reciclable en un sistema municipal estándar)
- recyclingInstructions: string (Instrucciones claras y concisas sobre CÓMO reciclarlo. Ej: "Enjuagar, aplastar y depositar en el contenedor de plásticos.")
- reuseTips: string[] (Un array con 2 o 3 ideas creativas y prácticas para REUTILIZAR el objeto. Ej: ["Convertirla en un macetero para plantas pequeñas.", "Usarla como un embudo cortando la base."])`;
        
        try {
            const response = await ai.models.generateContent({
                model,
                contents: { parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt }
                ]},
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            isRecyclable: { type: Type.BOOLEAN },
                            recyclingInstructions: { type: Type.STRING },
                            reuseTips: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["name", "isRecyclable", "recyclingInstructions", "reuseTips"]
                    }
                }
            });
            const resultText = response.text;
            const result = JSON.parse(resultText);
            onUserAction('identify_object');
            setAnalysisResult(result);
        } catch (error) {
            console.error("Gemini API error:", error);
            setAnalysisResult({
                name: 'Error',
                isRecyclable: false,
                recyclingInstructions: 'No se pudo analizar la imagen. Asegúrate de que el objeto esté bien iluminado y vuelve a intentarlo.',
                reuseTips: []
            });
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleQuizComplete = () => {
        if (!guidesContent) return;
        onUserAction('complete_quiz', { material: activeTab, points: guidesContent[activeTab].quiz.points });
        setIsQuizModalOpen(false);
    };

    const startQuiz = () => {
        if (user && guidesContent) {
            setQuizQuestions(guidesContent[activeTab].quiz.questions);
            setIsQuizModalOpen(true);
        } else {
            alert("Debes iniciar sesión para realizar el cuestionario.");
        }
    };
    
    const content = guidesContent ? guidesContent[activeTab] : null;
    const facts = sabiasQueData[activeTab] || [];

    if (isLoading || !content) {
        return (
            <div className="pt-20 h-screen flex items-center justify-center">
                <div className="text-center text-text-secondary p-8">
                    <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Cargando Guía de Reciclaje...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold font-display text-text-main sm:text-5xl">Guía Interactiva de Reciclaje</h1>
                    <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">Aprende a separar correctamente, pon a prueba tus conocimientos y usa nuestra IA para resolver cualquier duda.</p>
                </div>

                <section className="mb-16">
                    <h2 className="text-2xl font-bold font-display text-center text-text-main mb-8">Identificador de Residuos con IA</h2>
                    <div className="max-w-xl mx-auto">
                        {!isIdentifierActive ? (
                             <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-2xl">
                                <p className="text-5xl mb-4">📸</p>
                                <p className="text-text-secondary mb-6">¿Dudas sobre un objeto? Usa tu cámara para que nuestra IA te diga si es reciclable y qué hacer con él.</p>
                                <button onClick={() => setIsIdentifierActive(true)} className="cta-button text-lg">
                                    Activar Escáner IA
                                </button>
                            </div>
                        ) : (
                            <div className="scanner-container">
                                <video ref={videoRef} autoPlay playsInline muted className="scanner-video"></video>
                                <div className="scanner-guide scanner-guide-tl"></div>
                                <div className="scanner-guide scanner-guide-tr"></div>
                                <div className="scanner-guide scanner-guide-bl"></div>
                                <div className="scanner-guide scanner-guide-br"></div>
                                <div className="scanline"></div>
                                
                                {!isAnalyzing && !analysisResult && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-6 animate-fade-in-up">
                                        <button onClick={() => setIsIdentifierActive(false)} className="w-14 h-14 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                        <button onClick={handleIdentify} disabled={isAnalyzing} className="shutter-button disabled:opacity-50">
                                            <div className="inner-circle"></div>
                                        </button>
                                        <div className="w-14 h-14"></div>
                                    </div>
                                )}

                                {(isAnalyzing || analysisResult) && (
                                    <div className="scanner-overlay">
                                        {isAnalyzing ? (
                                             <PulsingScanner />
                                        ) : analysisResult && (
                                            <div className="w-full max-w-md text-center text-white bg-background/50 rounded-2xl p-6 animate-scale-in">
                                                <div className="animate-fade-in-up">
                                                    <div className={`text-6xl mb-3 ${analysisResult.isRecyclable ? 'text-emerald-400' : 'text-red-400'}`}>{analysisResult.isRecyclable ? '✅' : '❌'}</div>
                                                    <h3 className="text-2xl font-bold">{analysisResult.name}</h3>
                                                    <p className={`font-semibold ${analysisResult.isRecyclable ? 'text-emerald-400' : 'text-red-400'}`}>{analysisResult.isRecyclable ? 'Es Reciclable' : 'No es Reciclable'}</p>
                                                </div>
                                                
                                                <div className="space-y-4 mt-6 text-left">
                                                    <div className="result-card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                                        <h4 className="font-bold mb-2 flex items-center gap-2">♻️ Instrucciones de Reciclaje</h4>
                                                        <p className="text-sm text-slate-300">{analysisResult.recyclingInstructions}</p>
                                                    </div>
                                                    
                                                    {analysisResult.reuseTips && analysisResult.reuseTips.length > 0 && (
                                                        <div className="result-card animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                                                            <h4 className="font-bold mb-3 flex items-center gap-2">💡 Ideas para Reutilizar</h4>
                                                            <ul className="space-y-2 text-sm text-slate-300">
                                                                {analysisResult.reuseTips.map((tip, index) => (
                                                                    <li key={index} className="result-tip-item">
                                                                        <span className="icon mt-1">✨</span>
                                                                        <span>{tip}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>

                                                <button onClick={() => setAnalysisResult(null)} className="mt-6 px-5 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors animate-fade-in-up" style={{ animationDelay: '600ms' }}>Analizar otro objeto</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <div className="recycling-tabs">
                    {materialTypes.map(mat => <div key={mat} className={`recycling-tab ${activeTab === mat ? 'active' : ''}`} onClick={() => setActiveTab(mat)}>{materialNames[mat]}</div>)}
                </div>

                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        <MaterialInfoList title={activeTab === 'organico' ? "Qué SÍ compostar" : "Qué SÍ reciclar"} items={content.yes} colorClass="text-emerald-400" />
                        <MaterialInfoList title={activeTab === 'organico' ? "Qué NO compostar" : "Qué NO reciclar"} items={content.no} colorClass="text-red-400" />
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="material-content-card lg:col-span-1"><h3 className="text-xl font-bold text-primary mb-3">💡 Consejo Clave</h3><p className="text-text-secondary">{content.tip}</p></div>
                        <div className="material-content-card lg:col-span-1"><h3 className="text-xl font-bold text-amber-400 mb-3">🤔 Errores Comunes</h3><ul className="space-y-2 list-disc pl-5 text-text-secondary">{content.commonMistakes.map(m => <li key={m}>{m}</li>)}</ul></div>
                        <div className="material-content-card lg:col-span-1"><h3 className="text-xl font-bold text-cyan-400 mb-3">🧐 ¿Sabías que...?</h3><ul className="space-y-2 list-disc pl-5 text-text-secondary">{facts.map(f => <li key={f}>{f}</li>)}</ul></div>
                    </div>
                    
                    <div className="grid lg:grid-cols-2 gap-8">
                        <RecyclingProcess steps={content.recyclingProcess} title={activeTab === 'organico' ? 'El Proceso del Compostaje' : 'El Viaje del Reciclaje'} />
                        <ImpactStats stats={content.impactStats} />
                    </div>

                     <div className="text-center pt-8">
                        <button onClick={startQuiz} className={`cta-button text-lg ${user?.stats.completedQuizzes.includes(activeTab) ? '!bg-slate-600' : ''}`} disabled={user?.stats.completedQuizzes.includes(activeTab)}>
                            {user?.stats.completedQuizzes.includes(activeTab) ? 'Cuestionario Completado ✓' : 'Pon a Prueba tus Conocimientos'}
                        </button>
                    </div>
                </div>
            </div>
            
            {isQuizModalOpen && (
                 <div className="modal-backdrop">
                    <div className="modal-content !max-w-2xl !max-h-[600px] !bg-surface !text-text-main">
                       {/* FIX: Add missing userHighScore prop to TriviaGame. */}
                       <TriviaGame 
                            questions={quizQuestions} 
                            onComplete={handleQuizComplete} 
                            onClose={() => setIsQuizModalOpen(false)}
                            userHighScore={0}
                       />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComoReciclarPage;