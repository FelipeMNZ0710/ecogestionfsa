import React, { useEffect, useState, useRef, useMemo, forwardRef, useCallback } from 'react';
import InteractiveMap from '../components/InteractiveMap';
import type { LocationData } from '../components/InteractiveMap';
import type { User, GamificationAction, Location, Schedule, LocationStatus, ReportReason } from '../types';
import FilterMenu, { Category as FilterCategory } from '../components/FilterMenu';
import type { MapRef } from 'react--map-gl/maplibre';

const allMaterials: string[] = ['Plásticos', 'Vidrio', 'Papel/Cartón', 'Pilas'];
const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const statusInfo: Record<LocationStatus, { text: string; color: string }> = {
    ok: { text: "Operativo", color: "text-emerald-300 bg-emerald-500/20" },
    reported: { text: "Reportado", color: "text-amber-300 bg-amber-500/20" },
    maintenance: { text: "En Mantenimiento", color: "text-blue-300 bg-blue-500/20" },
    serviced: { text: "Servicio Reciente", color: "text-cyan-300 bg-cyan-500/20" }
};

// --- Helper Functions ---
const checkOpen = (schedule: Schedule[]): boolean => {
    if (!schedule || schedule.length === 0) return true; // Assume 24/7 if no schedule
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    for (const s of schedule) {
        if (s.days.includes(currentDay)) {
            if (s.open === '00:00' && s.close === '23:59') return true;
            if (currentTime >= s.open && currentTime <= s.close) return true;
        }
    }
    return false;
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
}

// --- Sub-Components ---
const LocationCard = forwardRef<HTMLDivElement, {
    location: Location & { distance?: number }; isSelected: boolean; isHovered: boolean; isFavorite: boolean;
    user: User | null; isAdminMode: boolean; onMouseEnter: () => void;
    onMouseLeave: () => void; onClick: () => void; onToggleFavorite: (locationId: string) => void;
    onEdit: () => void; onDelete: () => void;
}>(({ location, isSelected, isHovered, isFavorite, user, isAdminMode, onMouseEnter, onMouseLeave, onClick, onToggleFavorite, onEdit, onDelete }, ref) => {
    const currentStatus = statusInfo[location.status];
    return (
        <div ref={ref} className={`modern-card overflow-hidden flex flex-col transition-all duration-200 cursor-pointer relative ${isSelected || isHovered ? 'border-primary bg-surface' : 'border-white/10 bg-surface'}`} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick} role="button" tabIndex={0} aria-label={`Ver detalles de ${location.name}`}>
            <div className="relative">
                <img src={location.imageUrls[0]} alt={`Foto de ${location.name}`} className="w-full h-40 object-cover" />
                 {isAdminMode && (
                    <div className="card-admin-controls">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="admin-action-button" title="Editar punto"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="admin-action-button delete" title="Eliminar punto"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                )}
                 {user && (
                    <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(location.id); }} className={`absolute top-2 left-2 z-10 p-1.5 rounded-full transition-colors ${isFavorite ? 'text-yellow-400 bg-yellow-400/20' : 'text-slate-400 bg-surface/50 hover:text-yellow-400'}`} title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </button>
                )}
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${currentStatus.color} backdrop-blur-sm`}>{currentStatus.text}</span>
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-text-main leading-tight">{location.name}</h3>
                <p className="text-sm text-text-secondary mt-1">{location.address}</p>
                 {location.distance !== undefined && (
                    <div className="mt-3 font-semibold text-sm text-primary">
                        📍 Aprox. {location.distance < 1 ? `${Math.round(location.distance * 1000)} m` : `${location.distance.toFixed(1)} km`}
                    </div>
                )}
                <div className="flex-grow mt-4">
                    <div className="flex flex-wrap gap-2">
                        {location.materials.map(material => (<span key={material} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 font-medium rounded-md">{material}</span>))}
                    </div>
                </div>
            </div>
        </div>
    );
});
LocationCard.displayName = 'LocationCard';

const LocationDetailModal: React.FC<{location: Location | null; user: User | null; onClose: () => void; onCheckIn: () => void; onReport: () => void;}> = ({ location, user, onClose, onCheckIn, onReport }) => {
    const [mainImage, setMainImage] = useState(location?.imageUrls[0] || '');
    
    useEffect(() => {
        if(location) setMainImage(location.imageUrls[0]);
    }, [location]);

    if (!location) return null;

    const isOpenNow = checkOpen(location.schedule);
    const currentStatus = statusInfo[location.status];
    const lastServicedDate = new Date(location.lastServiced).toLocaleDateString('es-AR');
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.mapData.lat},${location.mapData.lng}`;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content !max-w-xl relative" onClick={e => e.stopPropagation()}>
                 <button onClick={onClose} className="absolute top-3 right-3 text-white bg-black/50 rounded-full p-1.5 hover:bg-black/75 transition-colors z-10" aria-label="Cerrar">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="detail-gallery p-4">
                    <img src={mainImage} alt={location.name} className="detail-gallery-main" />
                    <div className="detail-gallery-thumbs">
                        {location.imageUrls.map(url => (
                            <img key={url} src={url} onClick={() => setMainImage(url)} className={`detail-gallery-thumb ${mainImage === url ? 'active' : ''}`} alt={`Vista de ${location.name}`} />
                        ))}
                    </div>
                </div>
                <div className="p-6 pt-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className={`px-2.5 py-1 text-sm font-bold rounded-full ${currentStatus.color}`}>{currentStatus.text}</span>
                            <h2 className="text-2xl font-bold font-display text-text-main mt-3">{location.name}</h2>
                            <p className="text-text-secondary mt-1">{location.address}</p>
                        </div>
                        <div className={`status-indicator ${isOpenNow ? 'open text-emerald-400' : 'closed text-red-400'}`}>
                            <div className="status-indicator-dot"></div>
                            <span>{isOpenNow ? 'Abierto Ahora' : 'Cerrado Ahora'}</span>
                        </div>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4">
                        <p className="text-text-secondary">{location.description}</p>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4 activity-stats-grid">
                        <div className="activity-stat-item"><div className="value">{lastServicedDate}</div><div className="label">Último Servicio</div></div>
                        <div className="activity-stat-item"><div className="value">{location.reportCount ?? 0}</div><div className="label">Reportes Pend.</div></div>
                        <div className="activity-stat-item"><div className="value">{location.checkIns}</div><div className="label">Check-ins</div></div>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4">
                        <h3 className="font-semibold text-text-main mb-2">Materiales Aceptados</h3>
                        <div className="flex flex-wrap gap-2">{location.materials.map(m => (<span key={m} className="px-2 py-1 text-sm bg-slate-700 text-slate-300 font-medium rounded-md">{m}</span>))}</div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center cta-button !py-3 !text-base flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            Cómo llegar (Google Maps)
                        </a>
                        {user && (
                            <div className="flex gap-3">
                                <button onClick={onCheckIn} className="flex-1 bg-slate-700 text-slate-200 font-bold py-3 rounded-lg hover:bg-slate-600 transition-colors">Hacer Check-in (+25 pts)</button>
                                <button onClick={onReport} className="flex-1 bg-amber-500/20 text-amber-300 font-bold py-3 rounded-lg hover:bg-amber-500/30 transition-colors">Reportar Problema</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReportModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (reportData: { reason: ReportReason, comment: string, imageUrl?: string }) => void; }> = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState<ReportReason>('full');
    const [comment, setComment] = useState('');
    const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setReason('full');
            setComment('');
            setPhoto(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPhoto({ file, preview: URL.createObjectURL(file) });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (photo) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onSubmit({ reason, comment, imageUrl: reader.result as string });
                onClose();
            };
            reader.readAsDataURL(photo.file);
        } else {
            onSubmit({ reason, comment });
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-xl font-bold font-display text-text-main mb-4">Reportar un Problema</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="form-label">Motivo del reporte</label>
                            <div className="report-reason-group">
                                {(['full', 'dirty', 'damaged', 'other'] as const).map(r => (
                                    <div key={r}>
                                        <input type="radio" id={`reason-${r}`} name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="report-reason-input" />
                                        <label htmlFor={`reason-${r}`} className="report-reason-label">{ {full: 'Contenedor lleno', dirty: 'Lugar sucio', damaged: 'Dañado', other: 'Otro'}[r] }</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div><label className="form-label">Comentarios (opcional)</label><textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Añade más detalles aquí..." className="form-input"></textarea></div>
                        <div>
                            <label className="form-label">Añadir foto (opcional)</label>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" />
                            {!photo ? (
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="report-photo-upload-btn"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Subir Foto</button>
                            ) : (
                                <div className="report-photo-preview"><img src={photo.preview} alt="Vista previa" /><button type="button" onClick={() => setPhoto(null)} className="report-photo-remove-btn">×</button></div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-6"><button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 text-slate-100 rounded-md hover:bg-slate-500">Cancelar</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Enviar Reporte</button></div>
                </form>
            </div>
        </div>
    );
};

type LocationFormData = Omit<Location, 'schedule' | 'mapData' | 'lastServiced' | 'checkIns' | 'reportCount' | 'distance' | 'latestReportReason'>;

const LocationEditModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (location: LocationFormData) => void; 
    locationData: LocationFormData | null;
    isCreating: boolean;
    onDataChange: (field: keyof LocationFormData, value: any) => void;
    suggestions: any[];
    onSuggestionClick: (suggestion: any) => void;
    gmapsUrl: string;
    onGmapsUrlChange: (url: string) => void;
    onParseGmapsUrl: () => void;
}> = ({ isOpen, onClose, onSave, locationData, isCreating, onDataChange, suggestions, onSuggestionClick, gmapsUrl, onGmapsUrlChange, onParseGmapsUrl }) => {
    
    if (!isOpen || !locationData) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...locationData, imageUrls: locationData.imageUrls.filter(url => url.trim() !== '') });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onDataChange(name as keyof LocationFormData, value);
    };

    const handleMaterialChange = (material: string) => {
        const newMaterials = locationData.materials.includes(material)
            ? locationData.materials.filter(m => m !== material)
            : [...locationData.materials, material];
        onDataChange('materials', newMaterials);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content !max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 modal-form">
                    <h2 className="text-xl font-bold text-text-main mb-4">{isCreating ? 'Crear Nuevo Punto Verde' : 'Editar Punto Verde'}</h2>
                    
                    {!isCreating && <div><label htmlFor="id">ID Único</label><input type="text" name="id" id="id" value={locationData.id} readOnly className="form-input bg-slate-800" /></div>}
                    <div><label htmlFor="name">Nombre</label><input type="text" name="name" id="name" value={locationData.name} onChange={handleInputChange} required /></div>
                    
                    <div className="relative">
                        <label htmlFor="address">Dirección</label>
                        <input type="text" name="address" id="address" value={locationData.address} onChange={handleInputChange} required autoComplete="off"/>
                        {isCreating && suggestions.length > 0 && (
                            <ul className="absolute z-20 w-full bg-surface border border-slate-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                                {suggestions.map((suggestion) => (
                                    <li key={suggestion.place_id} onClick={() => onSuggestionClick(suggestion)} className="p-2 hover:bg-primary/20 cursor-pointer text-sm">
                                        {suggestion.display_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    {isCreating && (
                        <div className="pt-2">
                            <label htmlFor="gmaps_url" className="form-label text-xs">O pega un enlace de Google Maps</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    id="gmaps_url"
                                    value={gmapsUrl}
                                    onChange={(e) => onGmapsUrlChange(e.target.value)}
                                    placeholder="https://www.google.com/maps/place/..."
                                    className="form-input flex-1"
                                />
                                <button type="button" onClick={onParseGmapsUrl} className="px-3 py-2 text-sm bg-slate-600 text-slate-100 rounded-md hover:bg-slate-500 whitespace-nowrap">
                                    Importar
                                </button>
                            </div>
                        </div>
                    )}


                    <div><label htmlFor="description">Descripción</label><textarea name="description" id="description" value={locationData.description} onChange={handleInputChange} rows={3}></textarea></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label htmlFor="hours">Horario (texto)</label><input type="text" name="hours" id="hours" value={locationData.hours} onChange={handleInputChange} /></div>
                        <div><label htmlFor="status">Estado</label>
                            <select name="status" id="status" value={locationData.status} onChange={handleInputChange}>
                                <option value="ok">Operativo</option><option value="reported">Reportado</option>
                                <option value="maintenance">En Mantenimiento</option><option value="serviced">Servicio Reciente</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label>Materiales Aceptados</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {allMaterials.map(mat => (
                                <label key={mat} className="flex items-center"><input type="checkbox" checked={locationData.materials.includes(mat)} onChange={() => handleMaterialChange(mat)} className="mr-2" /> {mat}</label>
                            ))}
                        </div>
                    </div>
                    <div><label htmlFor="imageUrls">URLs de Imágenes (una por línea)</label><textarea name="imageUrls" id="imageUrls" value={locationData.imageUrls.join('\n')} onChange={e => onDataChange('imageUrls', e.target.value.split('\n'))} rows={3}></textarea></div>
                    <div className="flex justify-end space-x-3 pt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 text-slate-100 rounded-md hover:bg-slate-500">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const PuntosVerdesPage: React.FC<{
    user: User | null;
    updateUser: (user: User) => void;
    onUserAction: (action: GamificationAction, payload?: any) => void;
    isAdminMode: boolean;
}> = ({ user, updateUser, onUserAction, isAdminMode }) => {
    const [puntosVerdes, setPuntosVerdes] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterCategory>('Todos');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [isCreatingMode, setIsCreatingMode] = useState(false);
    const [newLocationCoords, setNewLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [locationFormData, setLocationFormData] = useState<LocationFormData | null>(null);
    const [gmapsUrl, setGmapsUrl] = useState('');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number; } | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [geolocationError, setGeolocationError] = useState<string | null>(null);
    const [isNearbyMode, setIsNearbyMode] = useState(false);
    
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const mapRef = useRef<MapRef>(null);
    const geocodeTimeoutRef = useRef<number | null>(null);
    const watchIdRef = useRef<number | null>(null);

    const fetchLocations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/locations');
            if (!response.ok) throw new Error('La respuesta de la red no fue exitosa');
            
            const rawData: any[] = await response.json();

            // SAFEGUARED PARSING
            const data: Location[] = rawData.map(loc => {
                const safeParse = (field: any, fallback: any) => {
                    if (typeof field === 'string') {
                        try {
                            const parsed = JSON.parse(field);
                            // Ensure arrays are returned for array fields, even if parsing results in something else
                            if (Array.isArray(fallback)) {
                                return Array.isArray(parsed) ? parsed : fallback;
                            }
                            return parsed;
                        } catch {
                            return fallback;
                        }
                    }
                    // Ensure the correct fallback type if field is null/undefined
                    return field || fallback;
                };

                return {
                    ...loc,
                    schedule: safeParse(loc.schedule, []),
                    materials: safeParse(loc.materials, []),
                    mapData: safeParse(loc.map_data, {}),
                    imageUrls: safeParse(loc.image_urls, ['https://images.unsplash.com/photo-1517009336183-50f2886216ec?q=80&w=800&auto=format&fit=crop']),
                };
            });

            setPuntosVerdes(data);
        } catch (error) {
            console.error("Falló la obtención de las ubicaciones:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);
    
    useEffect(() => {
        // Clear geolocation watch when component unmounts
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (selectedLocation && mapRef.current) {
            mapRef.current.flyTo({
                center: [selectedLocation.mapData.lng, selectedLocation.mapData.lat],
                zoom: 15,
                duration: 1500,
                essential: true
            });
        }
    }, [selectedLocation]);

    const debouncedGeocode = useCallback((query: string) => {
        if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
        
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        geocodeTimeoutRef.current = window.setTimeout(async () => {
            try {
                const searchParams = new URLSearchParams({
                    q: `${query}, Formosa, Argentina`,
                    format: 'json',
                    limit: '5',
                    countrycodes: 'ar',
                    viewbox: '-58.3,-26.3,-58.0,-26.0',
                    bounded: '1'
                });
                const response = await fetch(`https://nominatim.openstreetmap.org/search?${searchParams.toString()}`);
                if (!response.ok) throw new Error('Error en el servicio de geocodificación');
                const data = await response.json();
                setSuggestions(data);
            } catch (error) {
                console.error("Error de geocodificación:", error);
                setSuggestions([]);
            }
        }, 500);
    }, []);
    
    const handleFormChange = useCallback((field: keyof LocationFormData, value: any) => {
        setLocationFormData(prev => prev ? { ...prev, [field]: value } : null);
        if (field === 'address' && isCreatingMode) {
            debouncedGeocode(value);
        } else {
            setSuggestions([]);
        }
    }, [isCreatingMode, debouncedGeocode]);

    const handleSuggestionClick = (suggestion: any) => {
        handleFormChange('address', suggestion.display_name);
        const newCoords = { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) };
        setNewLocationCoords(newCoords);
        mapRef.current?.flyTo({ center: [newCoords.lng, newCoords.lat], zoom: 17, duration: 1500 });
        setSuggestions([]);
    };

    const handleParseGmapsUrl = () => {
        const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const match = gmapsUrl.match(regex);

        if (match && match[1] && match[2]) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            const newCoords = { lat, lng };

            if (isCreatingMode) {
                setNewLocationCoords(newCoords);
                mapRef.current?.flyTo({ center: [lng, lat], zoom: 18, duration: 1500 });
            }
            setGmapsUrl('');
        } else {
            alert("El enlace de Google Maps no parece válido o no contiene coordenadas en el formato esperado.");
        }
    };

    const toggleNearbyMode = () => {
        if (isNearbyMode) {
            setIsNearbyMode(false);
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            return;
        }

        if (watchIdRef.current !== null) return; // Already watching

        if (!navigator.geolocation) {
            setGeolocationError("La geolocalización no es compatible con tu navegador.");
            return;
        }

        setIsLocating(true);
        setGeolocationError(null);
        
        const isFirstUpdate = userLocation === null;

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const currentUserLocation = { lat: latitude, lng: longitude, accuracy };
                setUserLocation(currentUserLocation);
                
                if (isFirstUpdate) {
                    mapRef.current?.flyTo({
                        center: [currentUserLocation.lng, currentUserLocation.lat],
                        zoom: 17,
                        duration: 1500,
                    });
                }
                
                setIsNearbyMode(true);
                setIsLocating(false);
            },
            (error) => {
                let message;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = "Permiso de ubicación denegado. Debes habilitarlo en la configuración de tu navegador.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = "La información de ubicación no está disponible en este momento.";
                        break;
                    case error.TIMEOUT:
                        message = "La solicitud de ubicación tardó demasiado. Intenta de nuevo en un lugar con mejor señal.";
                        break;
                    default:
                        message = "No se pudo obtener tu ubicación. Asegúrate de haber otorgado los permisos necesarios.";
                        break;
                }
                setGeolocationError(message);
                setIsLocating(false);
                if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                    watchIdRef.current = null;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };


    const displayedLocations = useMemo(() => {
        let allLocationsWithDistance: Location[] = puntosVerdes.map(loc => {
            if (userLocation) {
                return {
                    ...loc,
                    distance: getDistance(userLocation.lat, userLocation.lng, loc.mapData.lat, loc.mapData.lng)
                };
            }
            return loc;
        });

        if (isNearbyMode && userLocation) {
            allLocationsWithDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
            return allLocationsWithDistance.slice(0, 5);
        }

        let filteredLocations = allLocationsWithDistance;
        if (activeFilter !== 'Todos') {
            if (activeFilter === 'Favoritos') {
                filteredLocations = filteredLocations.filter(p => user?.favoriteLocations?.includes(p.id));
            } else {
                filteredLocations = filteredLocations.filter(p => p.materials.includes(activeFilter));
            }
        }
        
        if (userLocation) {
            filteredLocations.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        }
        
        return filteredLocations;
    }, [puntosVerdes, activeFilter, userLocation, user, isNearbyMode]);
    
    const handlePinClick = (mapData: LocationData) => {
        const loc = puntosVerdes.find(p => p.id === mapData.id);
        if (loc) {
            setSelectedLocation(loc);
            cardRefs.current[loc.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleCardClick = (location: Location) => {
        setSelectedLocation(location);
    };

    const closeDetailModal = () => {
        setSelectedLocation(null);
    };

    const handleToggleFavorite = async (locationId: string) => {
        if (!user) {
            alert("Debes iniciar sesión para guardar favoritos.");
            return;
        }
        try {
            const response = await fetch(`http://localhost:3001/api/users/favorites`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, locationId: locationId })
            });
            if (!response.ok) throw new Error('Falló la actualización de favoritos');
            const updatedUserFromServer = await response.json();
            updateUser(updatedUserFromServer);
        } catch (error) {
            console.error("Error al cambiar favorito:", error);
            alert("No se pudo actualizar tus favoritos. Intenta de nuevo.");
        }
    };

    const handleCheckIn = () => {
        if (selectedLocation) {
            onUserAction('check_in', { locationId: selectedLocation.id });
            setPuntosVerdes(puntosVerdes.map(p => p.id === selectedLocation.id ? {...p, checkIns: p.checkIns + 1} : p));
            closeDetailModal();
        }
    };
    
    const handleReportSubmit = async (reportData: { reason: ReportReason, comment: string, imageUrl?: string }) => {
        if (!selectedLocation || !user) {
            alert("Se requiere un usuario y una ubicación para enviar un reporte.");
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/locations/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locationId: selectedLocation.id,
                    userId: user.id,
                    ...reportData
                })
            });

            if (!response.ok) throw new Error('Falló el envío del reporte');
            
            const updatedLocationFromServer = await response.json(); // This contains the new status

            // Optimistically update the UI to reflect the report immediately
            const updateLocationState = (location: Location) => ({
                ...location,
                status: updatedLocationFromServer.status as LocationStatus,
                latestReportReason: reportData.reason,
                reportCount: (location.reportCount || 0) + 1
            });

            setPuntosVerdes(puntosVerdes.map(p => p.id === updatedLocationFromServer.id ? updateLocationState(p) : p));
            
            onUserAction('report_punto_verde');
            setIsReportModalOpen(false);

            // Also update the selected location if the detail modal is open
            if(selectedLocation.id === updatedLocationFromServer.id) {
                setSelectedLocation(prev => prev ? updateLocationState(prev) : null);
            }
        } catch (error) {
            console.error("Error al enviar el reporte:", error);
            alert("No se pudo enviar el reporte. Por favor, inténtalo de nuevo.");
        }
    };

    const handleOpenEditModal = (location: Location | null = null) => {
        if (!location) { // Creating new
            setIsCreatingMode(true);
            const defaultCoords = { lat: -26.1775, lng: -58.1741 };
            setNewLocationCoords(defaultCoords);
            mapRef.current?.flyTo({ center: [defaultCoords.lng, defaultCoords.lat], zoom: 13, duration: 1500 });
            setLocationFormData({ id: `p${Date.now()}`, name: '', address: '', hours: '24hs', materials: [], status: 'ok', description: '', imageUrls: [''] });
        } else {
            setIsCreatingMode(false);
            setEditingLocation(location);
            const { schedule, mapData, lastServiced, checkIns, reportCount, distance, latestReportReason, ...formData } = location;
            setLocationFormData(formData);
        }
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingLocation(null);
        setIsCreatingMode(false);
        setNewLocationCoords(null);
        setLocationFormData(null);
        setSuggestions([]);
        setGmapsUrl('');
    };
    
    const handleSaveLocation = async (locationData: LocationFormData) => {
        const isCreating = !editingLocation;
        if (isCreating && !newLocationCoords) {
            alert("Por favor, arrastra el pin en el mapa para establecer la ubicación del nuevo punto.");
            return;
        }
        const method = isCreating ? 'POST' : 'PUT';
        const url = isCreating ? 'http://localhost:3001/api/locations' : `http://localhost:3001/api/locations/${locationData.id}`;
        
        const fullLocationData = {
            ...locationData,
            schedule: [],
            mapData: isCreating 
                ? { id: locationData.id, name: locationData.name, lat: newLocationCoords!.lat, lng: newLocationCoords!.lng, x: 0, y: 0 } 
                : editingLocation!.mapData,
            lastServiced: new Date().toISOString(),
            checkIns: isCreating ? 0 : editingLocation!.checkIns
        };
        
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullLocationData),
            });
            if (!response.ok) throw new Error('Falló al guardar la ubicación.');
            handleCloseEditModal();
            await fetchLocations();
        } catch(error) {
            console.error("Error guardando ubicación:", error);
            alert('No se pudo guardar la ubicación.');
        }
    };
    
    const handleDeleteLocation = async (locationId: string) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este Punto Verde? Esta acción no se puede deshacer.")) return;
        
        try {
            const response = await fetch(`http://localhost:3001/api/locations/${locationId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Falló al eliminar la ubicación.');
            await fetchLocations();
        } catch(error) {
            console.error("Error eliminando ubicación:", error);
            alert('No se pudo eliminar la ubicación.');
        }
    };

    const handleMarkerDragEnd = async (locationId: string, newCoords: { lng: number; lat: number }) => {
        if (!isAdminMode) return;
        
        const locationToUpdate = puntosVerdes.find(p => p.id === locationId);
        if (!locationToUpdate) return;
        
        const updatedLocation = {
            ...locationToUpdate,
            mapData: {
                ...locationToUpdate.mapData,
                lng: newCoords.lng,
                lat: newCoords.lat
            }
        };
        
        setPuntosVerdes(puntosVerdes.map(p => p.id === locationId ? updatedLocation : p));
        
        try {
            const response = await fetch(`http://localhost:3001/api/locations/${locationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLocation)
            });
            if (!response.ok) throw new Error('Failed to save new coordinates.');
        } catch (error) {
            console.error("Error saving new coordinates:", error);
            alert("No se pudieron guardar las nuevas coordenadas. Refrescando datos.");
            fetchLocations();
        }
    };


    return (
        <>
            <LocationDetailModal location={selectedLocation} user={user} onClose={closeDetailModal} onCheckIn={handleCheckIn} onReport={() => setIsReportModalOpen(true)} />
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSubmit={handleReportSubmit} />
            <LocationEditModal 
                isOpen={isEditModalOpen} 
                onClose={handleCloseEditModal} 
                onSave={handleSaveLocation} 
                locationData={locationFormData}
                isCreating={isCreatingMode}
                onDataChange={handleFormChange}
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
                gmapsUrl={gmapsUrl}
                onGmapsUrlChange={setGmapsUrl}
                onParseGmapsUrl={handleParseGmapsUrl}
            />

            <div className="pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold font-display text-text-main sm:text-5xl">Mapa Interactivo de Puntos Verdes</h1>
                        <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">Encuentra tu punto de reciclaje más cercano, filtra por material y colabora con la comunidad reportando el estado de los contenedores.</p>
                         {isAdminMode && (
                            <div className="mt-6">
                                <button onClick={() => handleOpenEditModal(null)} className="cta-button">
                                    + Crear Nuevo Punto Verde
                                </button>
                            </div>
                        )}
                    </div>

                     {isCreatingMode && (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-lg mb-6 text-center animate-fade-in-up">
                            <p className="font-bold">MODO CREACIÓN: Busca una dirección, importa un link de Google Maps, o arrastra el pin 📍 en el mapa a la ubicación exacta.</p>
                        </div>
                    )}

                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="w-full flex-grow">
                                <FilterMenu activeFilter={activeFilter} setActiveFilter={setActiveFilter} user={user} />
                            </div>
                            <div className="flex-shrink-0 w-full md:w-auto">
                                <button 
                                    onClick={toggleNearbyMode}
                                    disabled={isLocating}
                                    className={`w-full md:w-auto cta-button !py-2.5 !px-5 flex items-center justify-center gap-2 disabled:bg-slate-500 transition-all ${isNearbyMode ? 'ring-2 ring-offset-2 ring-offset-background ring-green-400' : ''}`}
                                >
                                    {isLocating ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : isNearbyMode ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                    )}
                                    <span>{isLocating ? 'Buscando...' : (isNearbyMode ? 'Mostrar Todos' : 'Buscar Cercanos')}</span>
                                </button>
                            </div>
                        </div>
                        {geolocationError && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-sm text-center animate-fade-in-up">
                                {geolocationError}
                            </div>
                        )}
                    </div>


                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 h-[60vh] lg:h-auto order-2 lg:order-1">
                            <div className="overflow-y-auto max-h-[60vh] lg:max-h-[calc(100vh-15rem)] pr-2 space-y-4">
                                {isLoading ? (
                                    <div className="text-center text-text-secondary p-8">
                                        <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Cargando Puntos Verdes...
                                    </div>
                                ) : (
                                    displayedLocations.map(location => (
                                        <LocationCard 
                                            key={location.id}
                                            ref={el => { cardRefs.current[location.id] = el; }}
                                            location={location}
                                            isSelected={selectedLocation?.id === location.id}
                                            isHovered={hoveredLocationId === location.id}
                                            isFavorite={user?.favoriteLocations?.includes(location.id) ?? false}
                                            user={user}
                                            isAdminMode={isAdminMode}
                                            onMouseEnter={() => setHoveredLocationId(location.id)}
                                            onMouseLeave={() => setHoveredLocationId(null)}
                                            onClick={() => handleCardClick(location)}
                                            onToggleFavorite={handleToggleFavorite}
                                            onEdit={() => handleOpenEditModal(location)}
                                            onDelete={() => handleDeleteLocation(location.id)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="lg:col-span-2 h-[60vh] lg:h-auto order-1 lg:order-2">
                             <InteractiveMap
                                ref={mapRef}
                                locations={displayedLocations.map(l => ({ ...l.mapData, status: l.status, latestReportReason: l.latestReportReason }))}
                                selectedLocation={selectedLocation ? { ...selectedLocation.mapData, status: selectedLocation.status, latestReportReason: selectedLocation.latestReportReason } : null}
                                hoveredLocationId={hoveredLocationId}
                                userLocation={userLocation}
                                onPinClick={handlePinClick}
                                onPinMouseEnter={setHoveredLocationId}
                                onPinMouseLeave={() => setHoveredLocationId(null)}
                                onMarkerDragEnd={handleMarkerDragEnd}
                                isAdminMode={isAdminMode}
                                isCreatingMode={isCreatingMode}
                                newLocationCoords={newLocationCoords}
                                onNewLocationCoordsChange={setNewLocationCoords}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PuntosVerdesPage;