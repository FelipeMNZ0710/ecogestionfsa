import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { User, Reward, RewardCategory, Notification } from '../types';

interface CanjearPageProps {
    user: User | null;
    onUserUpdate: (user: User) => void;
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    isAdminMode: boolean;
}

const allCategories: RewardCategory[] = ['Descuentos', 'Digital', 'Donaciones', 'Productos'];

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const optimizeImage = (base64Str: string, maxWidth = 600, maxHeight = 600, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('No se pudo obtener el contexto del canvas.'));
                
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            } catch (error) {
                 reject(error);
            }
        };
        img.onerror = (error) => reject(error);
    });
};


const RewardEditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (reward: Omit<Reward, 'id'> & { id?: string }) => void;
    reward: Reward | null;
}> = ({ isOpen, onClose, onSave, reward }) => {
    const [formData, setFormData] = useState<Omit<Reward, 'id' | 'fileData'> & { id?: string; fileData?: string | null; fileName?: string | null }>({
        title: '', description: '', cost: 0, category: 'Productos', image: '', stock: undefined, fileName: null, fileData: null
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (reward) {
                setFormData({ ...reward, stock: reward.stock ?? undefined, fileData: null, fileName: reward.fileName });
            } else {
                setFormData({ title: '', description: '', cost: 100, category: 'Productos', image: '', stock: undefined, fileName: null, fileData: null });
            }
            setSelectedFile(null);
        }
    }, [reward, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'stock' || name === 'cost') {
            const sanitizedValue = value.replace(/[^0-9]/g, ''); // Allow only digits

            if (name === 'stock') {
                if (sanitizedValue === '') {
                    setFormData(prev => ({ ...prev, stock: undefined })); // undefined for unlimited
                } else {
                    setFormData(prev => ({ ...prev, stock: parseInt(sanitizedValue, 10) }));
                }
            } else if (name === 'cost') {
                if (sanitizedValue === '') {
                    setFormData(prev => ({ ...prev, cost: 0 })); // Default to 0 if empty
                } else {
                    setFormData(prev => ({ ...prev, cost: parseInt(sanitizedValue, 10) }));
                }
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const processFile = (file: File | null | undefined) => {
        if (file) {
            setSelectedFile(file);
            setFormData(prev => ({...prev, fileName: file.name}));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFile(e.target.files?.[0]);
    };

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                const optimizedBase64 = await optimizeImage(base64);
                setFormData(prev => ({ ...prev, image: optimizedBase64 }));
            } catch (error) {
                console.error("Error processing image:", error);
                alert("No se pudo procesar la imagen. Intenta con otra imagen.");
            }
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const file = e.dataTransfer.files?.[0];
        processFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let fileData: string | null = null;
        if (selectedFile) {
            const base64String = await fileToBase64(selectedFile);
            fileData = base64String.split(',')[1];
        }
        onSave({ ...formData, fileData });
    };

    const previewReward: Reward = {
        id: formData.id || 'preview-id',
        title: formData.title || 'Título de la Recompensa',
        description: formData.description || 'Una breve descripción de lo que el usuario puede canjear.',
        cost: formData.cost || 0,
        category: formData.category,
        image: formData.image || 'https://images.unsplash.com/photo-1579308350639-65114a382104?q=80&w=400&auto=format&fit=crop',
        stock: formData.stock,
        fileName: formData.fileName || undefined,
    };

    return (
         <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content !max-w-4xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* --- FORM COLUMN --- */}
                    <div>
                        <h2 className="text-xl font-bold font-display text-text-main mb-4">{reward ? 'Editar Recompensa' : 'Crear Nueva Recompensa'}</h2>
                        <form id="reward-form" onSubmit={handleSubmit} className="space-y-4 modal-form">
                            <div><label>Título</label><input type="text" name="title" value={formData.title} onChange={handleChange} required /></div>
                            <div><label>Descripción</label><textarea name="description" value={formData.description} onChange={handleChange} rows={3} required className="break-words"></textarea></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label>Costo (EcoPuntos)</label><input type="text" inputMode="numeric" pattern="[0-9]*" name="cost" value={formData.cost} onChange={handleChange} required /></div>
                                <div><label>Categoría</label>
                                    <select name="category" value={formData.category} onChange={handleChange} required>
                                        {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label>Imagen de la Recompensa</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="text"
                                        name="image"
                                        value={formData.image.startsWith('data:') ? '[Imagen Local Cargada]' : formData.image}
                                        onChange={handleChange}
                                        className="form-input flex-1"
                                        placeholder="Pega una URL o carga un archivo"
                                        disabled={formData.image.startsWith('data:')}
                                    />
                                    <label className="px-3 py-2 text-sm bg-slate-600 rounded-md cursor-pointer hover:bg-slate-500 whitespace-nowrap">
                                        Cargar
                                        <input
                                            type="file"
                                            onChange={handleImageFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                {formData.image && (
                                    <div className="relative mt-2 w-24 h-24">
                                        <img src={formData.image} alt="Previsualización" className="rounded-md w-full h-full object-cover" />
                                        <button type="button" onClick={() => setFormData(prev => ({...prev, image: ''}))} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">X</button>
                                    </div>
                                )}
                            </div>

                            <div><label>Stock (dejar en blanco para ilimitado)</label><input type="text" inputMode="numeric" pattern="[0-9]*" name="stock" value={formData.stock === undefined ? '' : formData.stock} onChange={handleChange} /></div>
                            
                            {formData.category === 'Digital' && (
                                <div>
                                    <label>Archivo Digital</label>
                                    <div 
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isDraggingOver ? 'border-primary bg-primary/10' : 'border-slate-600'}`}>
                                        <div className="space-y-1 text-center">
                                            <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            <div className="flex text-sm text-slate-400">
                                                <label htmlFor="file-upload" className="relative cursor-pointer bg-surface rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-dark">
                                                    <span>Cargar un archivo</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                                </label>
                                                <p className="pl-1">o arrástralo aquí</p>
                                            </div>
                                            <p className="text-xs text-slate-500">{formData.fileName || 'PDF, PNG, JPG, ZIP, etc.'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* --- PREVIEW COLUMN --- */}
                    <div className="hidden md:flex flex-col items-center">
                        <h3 className="text-lg font-bold font-display text-text-main mb-4">Vista Previa</h3>
                        <div className="w-full max-w-xs">
                            <RewardCard
                                reward={previewReward}
                                userPoints={0} // Forces button to be disabled for preview
                                onRedeem={() => {}}
                                isAdminMode={false} // Hides admin controls on preview card
                                onEdit={() => {}}
                                onDelete={() => {}}
                            />
                        </div>
                    </div>
                </div>
                
                {/* --- MODAL FOOTER --- */}
                <div className="flex justify-end space-x-3 p-4 bg-surface border-t border-white/10 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 text-slate-100 rounded-md hover:bg-slate-500">Cancelar</button>
                    <button type="submit" form="reward-form" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Guardar</button>
                </div>
            </div>
        </div>
    );
};


const RewardCard: React.FC<{ 
    reward: Reward; 
    userPoints: number; 
    onRedeem: (reward: Reward) => void;
    isAdminMode: boolean;
    onEdit: (reward: Reward) => void;
    onDelete: (reward: Reward) => void;
}> = ({ reward, userPoints, onRedeem, isAdminMode, onEdit, onDelete }) => {
    const canAfford = userPoints >= reward.cost;
    const isOutOfStock = reward.stock !== null && reward.stock !== undefined && reward.stock <= 0;

    return (
        <div className={`modern-card flex flex-col relative ${!canAfford || isOutOfStock ? 'opacity-60' : ''}`}>
             <div className="relative">
                <img src={reward.image} alt={reward.title} className="w-full h-40 object-cover rounded-t-lg" />
                 {isAdminMode && (
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(reward); }} className="admin-action-button" title="Editar recompensa">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(reward); }} className="admin-action-button delete" title="Eliminar recompensa">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-primary mb-1">{reward.category}</span>
                    {reward.stock !== null && reward.stock !== undefined && (
                        <p className={`text-xs font-bold ${isOutOfStock ? 'text-red-400' : 'text-amber-400'}`}>
                            {isOutOfStock ? 'Agotado' : `Quedan: ${reward.stock}`}
                        </p>
                    )}
                </div>
                <h3 className="font-bold text-lg text-text-main flex-grow break-words">{reward.title}</h3>
                <p className="text-xs text-text-secondary my-2 break-words">{reward.description}</p>
                 
                <div className="flex justify-between items-center mt-auto pt-4">
                    <span className="font-bold text-primary text-lg">{reward.cost.toLocaleString('es-AR')} ✨</span>
                    <button 
                        onClick={() => onRedeem(reward)} 
                        disabled={!canAfford || isOutOfStock}
                        className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-md transition-colors hover:bg-primary-dark disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isOutOfStock ? 'Sin Stock' : (canAfford ? 'Canjear' : 'Insuficiente')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const CanjearPage: React.FC<CanjearPageProps> = ({ user, onUserUpdate, addNotification, isAdminMode }) => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<RewardCategory | 'Todas'>('Todas');
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);

    const fetchRewards = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/rewards');
            if (!response.ok) throw new Error('No se pudo conectar con el servidor de recompensas.');
            const data = await response.json();
            setRewards(data);
        } catch (err) {
            console.error("Error fetching rewards:", err);
            setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]);

    const handleRedeem = async () => {
        if (!user || !selectedReward) return;
        setIsConfirming(true);
        try {
            const response = await fetch('http://localhost:3001/api/redeem-reward', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, rewardId: selectedReward.id }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al canjear la recompensa.');
            }

            // Handle file download for digital rewards
            if (data.rewardWithFile) {
                const { fileName, fileData } = data.rewardWithFile;
                const byteCharacters = atob(fileData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray]); // Mime type will be inferred by browser
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            onUserUpdate(data.updatedUser);
            addNotification({
                type: 'achievement',
                title: '¡Canje Exitoso!',
                message: `Has canjeado "${selectedReward.title}".`,
                icon: '🛍️',
            });
            fetchRewards(); // Re-fetch to update stock
        } catch (error) {
             addNotification({
                type: 'achievement',
                title: 'Error en el Canje',
                message: error instanceof Error ? error.message : 'No se pudo completar la transacción.',
                icon: '⚠️',
            });
        } finally {
            setIsConfirming(false);
            setSelectedReward(null);
        }
    };
    
    const handleOpenEditModal = (reward: Reward | null) => {
        setEditingReward(reward);
        setIsEditModalOpen(true);
    };

    const handleSaveReward = async (rewardData: Omit<Reward, 'id'> & { id?: string }) => {
        if (!user) return;
        
        const isCreating = !rewardData.id;
        const finalRewardData = {
            ...rewardData,
            id: isCreating ? rewardData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now() : rewardData.id,
            stock: rewardData.stock === undefined ? null : rewardData.stock,
        };

        const method = isCreating ? 'POST' : 'PUT';
        const url = isCreating ? 'http://localhost:3001/api/rewards' : `http://localhost:3001/api/rewards/${finalRewardData.id}`;
        
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...finalRewardData, adminUserId: user.id })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al guardar la recompensa.');
            }
            
            setIsEditModalOpen(false);
            fetchRewards();
            addNotification({
                type: 'achievement',
                title: 'Éxito',
                message: `Recompensa ${isCreating ? 'creada' : 'actualizada'} correctamente.`,
                icon: '✅',
            });
        } catch (err) {
            addNotification({
                type: 'achievement',
                title: 'Error al Guardar',
                message: err instanceof Error ? err.message : 'No se pudo guardar la recompensa.',
                icon: '⚠️',
            });
        }
    };

    const handleDeleteReward = async (reward: Reward) => {
        if (!user || !window.confirm(`¿Estás seguro de que quieres eliminar la recompensa "${reward.title}"?`)) return;

        try {
            const response = await fetch(`http://localhost:3001/api/rewards/${reward.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUserId: user.id })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar la recompensa.');
            }
            
            fetchRewards();
            addNotification({
                type: 'achievement',
                title: 'Eliminada',
                message: 'La recompensa ha sido eliminada.',
                icon: '🗑️',
            });
        } catch (err) {
             addNotification({
                type: 'achievement',
                title: 'Error al Eliminar',
                message: err instanceof Error ? err.message : 'No se pudo eliminar la recompensa.',
                icon: '⚠️',
            });
        }
    };
    
    const filteredRewards = useMemo(() => {
        if (activeCategory === 'Todas') return rewards;
        return rewards.filter(r => r.category === activeCategory);
    }, [rewards, activeCategory]);

    if (!user) {
        return (
            <div className="pt-20 h-screen flex items-center justify-center text-center">
                <h1 className="text-2xl font-bold">Debes iniciar sesión para canjear recompensas.</h1>
            </div>
        );
    }
    
    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center py-20 text-text-secondary">Cargando recompensas...</div>;
        }
        if (error) {
            return (
                <div className="text-center py-20 modern-card">
                    <div className="text-6xl mb-4">🔌</div>
                    <h2 className="text-xl font-bold text-red-400">Error de Conexión</h2>
                    <p className="text-text-secondary mt-2 mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="cta-button">
                        Recargar Página
                    </button>
                </div>
            );
        }
        if (filteredRewards.length > 0) {
            return (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredRewards.map(reward => (
                        <RewardCard 
                            key={reward.id} 
                            reward={reward} 
                            userPoints={user.points} 
                            onRedeem={setSelectedReward}
                            isAdminMode={isAdminMode}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDeleteReward}
                        />
                    ))}
                </div>
            );
        }
        return (
            <div className="text-center py-20 modern-card">
                <div className="text-6xl mb-4">🙁</div>
                <h2 className="text-xl font-bold text-text-main">No Hay Recompensas Disponibles</h2>
                <p className="text-text-secondary mt-2">Parece que la tienda está vacía en este momento. Vuelve a intentarlo más tarde.</p>
            </div>
        );
    };

    return (
        <>
            <RewardEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveReward} reward={editingReward} />
            <div className="bg-background pt-20 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <header className="text-center mb-12 animate-fade-in-up">
                        <div className="inline-block bg-surface px-6 py-3 rounded-full border border-white/10 mb-4">
                            <span className="text-text-secondary">Tu Saldo: </span>
                            <span className="text-2xl font-bold text-primary">{user.points.toLocaleString('es-AR')} ✨</span>
                        </div>
                        <h1 className="text-4xl font-extrabold font-display text-text-main sm:text-5xl">Tienda de Recompensas</h1>
                        <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">¡Usa tus EcoPuntos para obtener descuentos, premios y apoyar causas locales!</p>
                        {isAdminMode && (
                            <div className="mt-6">
                                <button onClick={() => handleOpenEditModal(null)} className="cta-button">
                                    + Crear Nueva Recompensa
                                </button>
                            </div>
                        )}
                    </header>

                    <div className="mb-8 flex flex-wrap justify-center gap-2">
                        <button onClick={() => setActiveCategory('Todas')} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${activeCategory === 'Todas' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-slate-700'}`}>
                            Todas
                        </button>
                        {allCategories.map(cat => (
                             <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${activeCategory === cat ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-slate-700'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {renderContent()}

                </div>
            </div>

            {/* Confirmation Modal */}
            {selectedReward && (
                <div className="modal-backdrop" onClick={() => setSelectedReward(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <h2 className="text-xl font-bold text-text-main mb-2">Confirmar Canje</h2>
                            <p className="text-text-secondary mb-4">
                                ¿Estás seguro de que quieres canjear <strong className="text-text-main">{selectedReward.title}</strong> por <strong className="text-primary">{selectedReward.cost.toLocaleString('es-AR')}</strong> EcoPuntos?
                            </p>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => setSelectedReward(null)} className="px-6 py-2 bg-slate-600 rounded-md hover:bg-slate-500">
                                    Cancelar
                                </button>
                                <button onClick={handleRedeem} disabled={isConfirming} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-slate-500 flex items-center">
                                     {isConfirming && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                     {isConfirming ? 'Canjeando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CanjearPage;