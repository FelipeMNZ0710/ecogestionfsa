import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, ContactMessage, Report, ReportStatus, UserRole, Achievement, ReportReason } from '../types';
import AchievementsModal from '../components/AchievementsModal';

const messageStatusStyles: Record<ContactMessage['status'], string> = {
    unread: 'bg-blue-500/20 text-blue-300 border-blue-500',
    read: 'bg-slate-700 text-slate-400 border-slate-600',
    archived: 'bg-slate-800 text-slate-500 border-slate-700 line-through',
};

const reportStatusStyles: Record<ReportStatus, string> = {
    pending: 'bg-amber-500/20 text-amber-300 border-amber-500',
    resolved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500',
    dismissed: 'bg-slate-700 text-slate-400 border-slate-600 line-through',
};

const reasonLabels: Record<Report['reason'], string> = {
    full: 'Contenedor Lleno',
    dirty: 'Lugar Sucio',
    damaged: 'Dañado',
    other: 'Otro Motivo',
};

const reasonColors: Record<ReportReason, string> = {
    damaged: 'bg-red-500',
    dirty: 'bg-blue-500',
    full: 'bg-amber-500',
    other: 'bg-slate-500',
};

const contactCategoryColors: Record<string, string> = {
    'Inicio': '#3b82f6', // blue-500
    'Cómo Reciclar': '#10b981', // primary
    'Puntos Verdes': '#f59e0b', // amber-500
    'Juegos': '#8b5cf6', // violet-500
    'Noticias': '#ec4899', // pink-500
    'Comunidad': '#6366f1', // indigo-500
    'Contacto': '#ef4444', // red-500
    'Otro': '#6b7280', // slate-500
};


type AdminTab = 'statistics' | 'messages' | 'reports' | 'users';

const ReplyModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    recipientEmail: string;
    defaultSubject: string;
    onSend: (body: string) => Promise<void>;
}> = ({ isOpen, onClose, recipientEmail, defaultSubject, onSend }) => {
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setBody(`\n\n---\nEquipo de EcoGestión`);
            setError('');
            setIsSending(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim()) {
            setError('El cuerpo del mensaje no puede estar vacío.');
            return;
        }
        setError('');
        setIsSending(true);
        try {
            await onSend(body);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content !max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-xl font-bold font-display text-text-main mb-4">Responder por Email</h2>
                    <div className="space-y-4 modal-form">
                        <div>
                            <label className="form-label">Para:</label>
                            <input type="text" value={recipientEmail} readOnly className="form-input bg-slate-800 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="form-label">Asunto:</label>
                            <input type="text" value={defaultSubject} readOnly className="form-input bg-slate-800 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="form-label">Respuesta:</label>
                            <textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                rows={8}
                                placeholder="Escribe tu respuesta aquí..."
                                className="form-input"
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                    <div className="flex justify-end space-x-3 pt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 text-slate-100 rounded-md hover:bg-slate-500">Cancelar</button>
                        <button type="submit" disabled={isSending} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-slate-500 flex items-center">
                            {isSending && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {isSending ? 'Enviando...' : 'Enviar Respuesta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSave: (updatedUser: Partial<User>) => void;
}> = ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState<Partial<User>>({});

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name, role: user.role, points: user.points });
        }
    }, [user, isOpen]);

    if (!isOpen || !user) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'points' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 modal-form">
                    <h2 className="text-xl font-bold font-display text-text-main mb-4">Editar Usuario: {user.name}</h2>
                    <div className="space-y-4">
                        <div><label>Nombre</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} /></div>
                        <div><label>Rol</label>
                            <select name="role" value={formData.role} onChange={handleChange}>
                                <option value="usuario">Usuario</option>
                                <option value="moderador">Moderador</option>
                                <option value="dueño">Dueño</option>
                            </select>
                        </div>
                        <div><label>EcoPuntos</label><input type="number" name="points" value={formData.points || 0} onChange={handleChange} /></div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary rounded-md text-white">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const MessagesPanel: React.FC<{ messages: ContactMessage[], onUpdateStatus: (id: number, status: ContactMessage['status']) => void, onReply: (message: ContactMessage) => void, onDelete: (id: number) => void }> = ({ messages, onUpdateStatus, onReply, onDelete }) => {
    const [statusFilter, setStatusFilter] = useState<ContactMessage['status'] | 'all'>('all');
    const [subjectFilter, setSubjectFilter] = useState<string | 'all'>('all');

    const subjects = useMemo(() => ['all', ...Array.from(new Set(messages.map(m => m.subject)))], [messages]);

    const filteredMessages = useMemo(() => {
        return messages.filter(message => {
            const statusMatch = statusFilter === 'all' || message.status === statusFilter;
            const subjectMatch = subjectFilter === 'all' || message.subject === subjectFilter;
            return statusMatch && subjectMatch;
        });
    }, [messages, statusFilter, subjectFilter]);
    
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 mb-4 p-4 bg-surface rounded-lg border border-white/10">
                <div className="flex items-center">
                    <label htmlFor="msg-status-filter" className="text-sm text-text-secondary mr-2">Estado:</label>
                    <select id="msg-status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="form-input !w-auto !py-1">
                        <option value="all">Todos</option>
                        <option value="unread">Sin Leer</option>
                        <option value="read">Leídos</option>
                        <option value="archived">Archivados</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <label htmlFor="msg-subject-filter" className="text-sm text-text-secondary mr-2">Asunto:</label>
                    <select id="msg-subject-filter" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="form-input !w-auto !py-1">
                        {subjects.map(s => <option key={s} value={s}>{s === 'all' ? 'Todos' : s}</option>)}
                    </select>
                </div>
            </div>

            {filteredMessages.map(msg => (
                <div key={msg.id} className="relative modern-card overflow-hidden">
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-1.5"
                        style={{ backgroundColor: contactCategoryColors[msg.subject] || contactCategoryColors['Otro'] }}
                    ></div>
                    <details className="p-4 pl-6">
                        <summary className="flex justify-between items-center cursor-pointer">
                            <div className="flex-1">
                                <p className="font-bold text-text-main">{msg.subject}</p>
                                <p className="text-sm text-text-secondary">{msg.name} ({msg.email})</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${messageStatusStyles[msg.status]}`}>{msg.status}</span>
                                <span className="text-sm text-text-secondary">{new Date(msg.submitted_at).toLocaleDateString()}</span>
                            </div>
                        </summary>
                        <div className="mt-4 pt-4 border-t border-white/10 text-text-secondary">
                            <p>{msg.message}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button onClick={() => onReply(msg)} className="px-3 py-1 text-sm bg-primary rounded-md text-white">Responder</button>
                                {msg.status !== 'read' && <button onClick={() => onUpdateStatus(msg.id, 'read')} className="px-3 py-1 text-sm bg-slate-600 rounded-md">Marcar como Leído</button>}
                                {msg.status !== 'archived' && <button onClick={() => onUpdateStatus(msg.id, 'archived')} className="px-3 py-1 text-sm bg-slate-700 rounded-md">Archivar</button>}
                                <button onClick={() => onDelete(msg.id)} className="px-3 py-1 text-sm bg-red-500/20 text-red-300 rounded-md">Eliminar</button>
                            </div>
                        </div>
                    </details>
                </div>
            ))}
        </div>
    );
};

const ReportsPanel: React.FC<{ reports: Report[], onUpdateStatus: (id: number, status: ReportStatus) => void, onDelete: (id: number) => void, onImageClick: (src: string) => void }> = ({ reports, onUpdateStatus, onDelete, onImageClick }) => {
    const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
    const [reasonFilter, setReasonFilter] = useState<Report['reason'] | 'all'>('all');

    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            const statusMatch = statusFilter === 'all' || report.status === statusFilter;
            const reasonMatch = reasonFilter === 'all' || report.reason === reasonFilter;
            return statusMatch && reasonMatch;
        });
    }, [reports, statusFilter, reasonFilter]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 mb-4 p-4 bg-surface rounded-lg border border-white/10">
                <div className="flex items-center">
                    <label htmlFor="status-filter" className="text-sm text-text-secondary mr-2">Estado:</label>
                    <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="form-input !w-auto !py-1">
                        <option value="all">Todos</option>
                        <option value="pending">Pendientes</option>
                        <option value="resolved">Resueltos</option>
                        <option value="dismissed">Desestimados</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <label htmlFor="reason-filter" className="text-sm text-text-secondary mr-2">Motivo:</label>
                    <select id="reason-filter" value={reasonFilter} onChange={e => setReasonFilter(e.target.value as any)} className="form-input !w-auto !py-1">
                        <option value="all">Todos</option>
                        <option value="damaged">Dañado</option>
                        <option value="dirty">Sucio</option>
                        <option value="full">Lleno</option>
                        <option value="other">Otro</option>
                    </select>
                </div>
            </div>

            {filteredReports.map(rep => (
                <div key={rep.id} className="relative modern-card overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${reasonColors[rep.reason]}`}></div>
                    <details className="p-4 pl-6">
                        <summary className="flex justify-between items-center cursor-pointer">
                            <div>
                                <p className="font-bold text-text-main">{reasonLabels[rep.reason]} en <span className="text-primary">{rep.locationName}</span></p>
                                <p className="text-sm text-text-secondary">Reportado por: {rep.userName}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${reportStatusStyles[rep.status]}`}>{rep.status}</span>
                        </summary>
                        <div className="mt-4 pt-4 border-t border-white/10 text-text-secondary space-y-3">
                            {rep.comment && <p><strong>Comentario:</strong> {rep.comment}</p>}
                            {rep.imageUrl && (
                                <div>
                                    <p><strong>Imagen Adjunta:</strong></p>
                                    <img 
                                        src={rep.imageUrl} 
                                        alt="Evidencia del reporte" 
                                        className="max-w-xs rounded-lg mt-2 cursor-pointer transition-transform hover:scale-105"
                                        onClick={() => onImageClick(rep.imageUrl)}
                                    />
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {rep.status !== 'resolved' && <button onClick={() => onUpdateStatus(rep.id, 'resolved')} className="px-3 py-1 text-sm bg-emerald-500/20 text-emerald-300 rounded-md">Marcar como Resuelto</button>}
                                {rep.status !== 'dismissed' && <button onClick={() => onUpdateStatus(rep.id, 'dismissed')} className="px-3 py-1 text-sm bg-slate-600 rounded-md">Desestimar</button>}
                                <button onClick={() => onDelete(rep.id)} className="px-3 py-1 text-sm bg-red-500/20 text-red-300 rounded-md">Eliminar</button>
                            </div>
                        </div>
                    </details>
                </div>
            ))}
        </div>
    );
};

const UsersPanel: React.FC<{ users: User[], onEdit: (user: User) => void, onDelete: (id: string) => void, onManageAchievements: (user: User) => void }> = ({ users, onEdit, onDelete, onManageAchievements }) => (
    <div className="modern-card overflow-x-auto">
        <table className="w-full text-left">
            <thead className="bg-surface text-xs text-text-secondary uppercase">
                <tr>
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">EcoPuntos</th>
                    <th className="p-4">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {users.map(u => (
                    <tr key={u.id} className="border-b border-white/10 hover:bg-surface">
                        <td className="p-4 font-medium text-text-main">{u.name}</td>
                        <td className="p-4">{u.email}</td>
                        <td className="p-4">{u.role}</td>
                        <td className="p-4">{u.points}</td>
                        <td className="p-4 flex flex-wrap gap-2">
                            <button onClick={() => onEdit(u)} className="text-sm text-blue-400 hover:underline">Editar</button>
                            <button onClick={() => onManageAchievements(u)} className="text-sm text-amber-400 hover:underline">Logros</button>
                            <button onClick={() => onDelete(u.id)} className="text-sm text-red-400 hover:underline">Eliminar</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const BarChart: React.FC<{ 
    data: { label: string; value: number; color: string }[];
    title: string;
}> = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="modern-card p-6">
            <h3 className="font-bold text-lg text-text-main mb-4">{title}</h3>
            {data.length > 0 ? (
                <div className="space-y-3">
                    {data.map(item => (
                        <div key={item.label} className="grid grid-cols-3 items-center gap-4 text-sm">
                            <span className="text-text-secondary truncate text-right">{item.label}</span>
                            <div className="col-span-2 flex items-center gap-2">
                                <div className="w-full bg-slate-700 rounded-full h-4">
                                    <div
                                        className="h-4 rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${(item.value / maxValue) * 100}%`,
                                            backgroundColor: item.color,
                                        }}
                                    ></div>
                                </div>
                                <span className="font-bold text-text-main w-8 text-right">{item.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-sm text-text-secondary text-center py-4">No hay datos para mostrar.</p>
            )}
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string | number; }> = ({ label, value }) => (
    <div className="modern-card p-4 text-center">
        <div className="text-3xl font-bold font-display text-primary">{value}</div>
        <div className="text-sm text-text-secondary mt-1">{label}</div>
    </div>
);


const StatisticsPanel: React.FC<{ messages: ContactMessage[], reports: Report[] }> = ({ messages, reports }) => {
    const totalMessages = messages.length;
    const unreadMessages = messages.filter(m => m.status === 'unread').length;
    
    const contactCountsBySubject = messages.reduce((acc, message) => {
        acc[message.subject] = (acc[message.subject] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const contactBarChartData = Object.entries(contactCountsBySubject).map(([subject, count]) => ({
        label: subject,
        value: count,
        color: contactCategoryColors[subject] || '#6b7280',
    })).sort((a,b) => Number(b.value) - Number(a.value));


    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === 'pending').length;

    const reportChartColors: Record<Report['reason'], string> = {
        damaged: '#ef4444',
        dirty: '#3b82f6',
        full: '#f59e0b',
        other: '#6b7280',
    };
    
    const reportCountsByReason = reports.reduce((acc, report) => {
        acc[report.reason] = (acc[report.reason] || 0) + 1;
        return acc;
    }, {} as Record<Report['reason'], number>);
    
    const reportBarChartData = (Object.keys(reasonLabels) as Array<keyof typeof reasonLabels>).map(reason => ({
        label: reasonLabels[reason],
        value: reportCountsByReason[reason] || 0,
        color: reportChartColors[reason],
    })).sort((a,b) => Number(b.value) - Number(a.value));

    const topReportedLocations = reports
        .filter(report => report.status === 'pending')
        .reduce((acc, report) => {
            acc[report.locationName] = (acc[report.locationName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
    const sortedTopLocations = Object.entries(topReportedLocations)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 3);

    const topContactSubjects = messages
        .filter(message => message.status === 'unread')
        .reduce((acc, message) => {
            acc[message.subject] = (acc[message.subject] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

    const sortedTopSubjects = Object.entries(topContactSubjects)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 3);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total de Mensajes" value={totalMessages} />
                <StatCard label="Mensajes Sin Leer" value={unreadMessages} />
                <StatCard label="Total de Reportes" value={totalReports} />
                <StatCard label="Reportes Pendientes" value={pendingReports} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <BarChart data={reportBarChartData} title="Desglose de Reportes de Puntos Verdes" />
                    <BarChart data={contactBarChartData} title="Mensajes de Contacto por Categoría" />
                </div>
                
                <div className="space-y-8">
                    <div className="modern-card p-6 h-fit">
                        <h3 className="font-bold text-lg text-text-main mb-4">Top Puntos Reportados (Pend.)</h3>
                        {sortedTopLocations.length > 0 ? (
                            <ul className="space-y-3">
                                {sortedTopLocations.map(([name, count]) => (
                                    <li key={name as string} className="flex justify-between items-center text-sm">
                                        <span className="text-text-secondary truncate pr-2" title={name as string}>{name}</span>
                                        <span className="font-bold text-primary bg-primary/20 px-2.5 py-1 rounded-full flex-shrink-0">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-secondary text-center mt-8">No hay reportes pendientes.</p>
                        )}
                    </div>
                     <div className="modern-card p-6 h-fit">
                        <h3 className="font-bold text-lg text-text-main mb-4">Top Asuntos de Contacto (Sin Leer)</h3>
                        {sortedTopSubjects.length > 0 ? (
                            <ul className="space-y-3">
                                {sortedTopSubjects.map(([subject, count]) => (
                                    <li key={subject as string} className="flex justify-between items-center text-sm">
                                        <span className="text-text-secondary truncate pr-2" title={subject as string}>{subject}</span>
                                        <span className="font-bold text-blue-400 bg-blue-500/20 px-2.5 py-1 rounded-full flex-shrink-0">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-secondary text-center mt-8">No hay mensajes sin leer.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface AdminPageProps {
  user: User | null;
  updateUser: (user: User) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ user, updateUser }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('statistics');
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [replyingTo, setReplyingTo] = useState<ContactMessage | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
    const [imageViewSrc, setImageViewSrc] = useState<string | null>(null);


    const fetchAllData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const [messagesRes, reportsRes, usersRes] = await Promise.all([
                fetch(`http://localhost:3001/api/admin/messages?adminUserId=${user.id}`),
                fetch(`http://localhost:3001/api/admin/reports?adminUserId=${user.id}`),
                user.role === 'dueño' ? fetch(`http://localhost:3001/api/admin/users?adminUserId=${user.id}`) : Promise.resolve(null),
            ]);

            if (!messagesRes.ok || !reportsRes.ok) {
                 throw new Error('No se pudieron obtener los datos de mensajes y reportes.');
            }
            if(usersRes && !usersRes.ok){
                 throw new Error('No se pudieron obtener los datos de usuarios.');
            }

            const messagesData = await messagesRes.json();
            const reportsData = await reportsRes.json();
            
            const formattedReports = reportsData.map((rep: any) => ({
                ...rep,
                imageUrl: rep.image_url,
            }));

            setMessages(messagesData);
            setReports(formattedReports);

            if(usersRes){
                const usersData = await usersRes.json();
                setUsers(usersData);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleUpdateStatus = async (type: 'messages' | 'reports', id: number, status: string) => {
        try {
            const response = await fetch(`http://localhost:3001/api/admin/${type}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminUserId: user?.id }),
            });
            if (!response.ok) throw new Error('Failed to update status');
            const updatedItem = await response.json();
            
            if (type === 'messages') {
                setMessages(prev => prev.map(msg => msg.id === id ? updatedItem : msg));
            } else if (type === 'reports') {
                const formattedReport = {...updatedItem, imageUrl: updatedItem.image_url };
                setReports(prev => prev.map(rep => rep.id === id ? formattedReport : rep));
            }
        } catch (err) { console.error(`Error actualizando estado para ${type}:`, err); }
    };
    
    const handleDelete = async (type: 'messages' | 'reports' | 'users', id: number | string) => {
        const typeName = type === 'messages' ? 'mensaje' : type === 'reports' ? 'reporte' : 'usuario';
        if (!window.confirm(`¿Seguro que quieres eliminar este ${typeName}? Esta acción no se puede deshacer.`)) return;
        try {
            const response = await fetch(`http://localhost:3001/api/admin/${type}/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUserId: user?.id }),
            });
            if (!response.ok) throw new Error(`Failed to delete ${typeName}`);

            if (type === 'messages') {
                setMessages(prev => prev.filter(msg => msg.id !== id));
            } else if (type === 'reports') {
                setReports(prev => prev.filter(rep => rep.id !== id));
            } else if (type === 'users') {
                setUsers(prev => prev.filter(u => u.id !== id));
            }
        } catch (err) { console.error(`Error eliminando ${type}:`, err); }
    };
    
    const handleSendReply = async (body: string) => {
        if (!replyingTo || !user) return;
        await fetch('http://localhost:3001/api/admin/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: replyingTo.email, subject: `Re: ${replyingTo.subject}`, body, adminUserId: user.id })
        });
        await handleUpdateStatus('messages', replyingTo.id, 'read');
    };

    const handleUpdateUser = async (updatedFields: Partial<User>) => {
        if (!editingUser || !user) return;
        try {
            const response = await fetch(`http://localhost:3001/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...updatedFields, adminUserId: user.id })
            });
            if (!response.ok) throw new Error('Failed to update user');
            const updatedUserFromServer = await response.json();
            setUsers(prev => prev.map(u => u.id === updatedUserFromServer.id ? updatedUserFromServer : u));
            if(updatedUserFromServer.id === user.id) {
                updateUser(updatedUserFromServer);
            }
        } catch (err) { 
            console.error('Error al actualizar usuario:', err); 
            alert('No se pudo actualizar el usuario.');
        }
    };
    
    const handleToggleAchievement = async (achievementId: string, unlocked: boolean) => {
        if (!editingUser || !user) return;
        const targetUserId = editingUser.id;
    
        try {
            const response = await fetch(`http://localhost:3001/api/admin/users/${targetUserId}/achievements`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ achievementId, unlocked, adminUserId: user.id }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error: No se pudo guardar el cambio en el servidor.');
            }
    
            const updatedUserFromServer = await response.json();
    
            setUsers(prevUsers => prevUsers.map(u => 
                u.id === updatedUserFromServer.id ? updatedUserFromServer : u
            ));
    
            setEditingUser(updatedUserFromServer);
    
            if (updatedUserFromServer.id === user.id) {
                updateUser(updatedUserFromServer);
            }
    
        } catch (error) {
            console.error("Error al actualizar el logro:", error);
            alert((error as Error).message);
            fetchAllData();
        }
    };


    const renderContent = () => {
        if (isLoading) return <div className="text-center p-8 text-text-secondary">Cargando datos del panel...</div>;
        if (error) return <div className="text-center p-8 text-red-400">{error}</div>;

        switch (activeTab) {
            case 'statistics': return <StatisticsPanel messages={messages} reports={reports} />;
            case 'messages': return <MessagesPanel messages={messages} onUpdateStatus={(id, status) => handleUpdateStatus('messages', id, status)} onReply={setReplyingTo} onDelete={(id) => handleDelete('messages', id)} />;
            case 'reports': return <ReportsPanel reports={reports} onUpdateStatus={(id, status) => handleUpdateStatus('reports', id, status)} onDelete={(id) => handleDelete('reports', id)} onImageClick={setImageViewSrc} />;
            case 'users': return <UsersPanel users={users} onEdit={setEditingUser} onDelete={(id) => handleDelete('users', id)} onManageAchievements={(u) => { setEditingUser(u); setIsAchievementsModalOpen(true); }} />;
            default: return null;
        }
    };

    return (
        <>
            <ReplyModal isOpen={!!replyingTo} onClose={() => setReplyingTo(null)} recipientEmail={replyingTo?.email || ''} defaultSubject={`Re: ${replyingTo?.subject}`} onSend={handleSendReply} />
            <EditUserModal isOpen={!!editingUser && !isAchievementsModalOpen} onClose={() => setEditingUser(null)} user={editingUser} onSave={handleUpdateUser} />
            <AchievementsModal isOpen={isAchievementsModalOpen} onClose={() => { setIsAchievementsModalOpen(false); setEditingUser(null); }} user={editingUser} isAdminMode={user?.role === 'dueño'} onToggleAchievement={handleToggleAchievement} />
            
            {imageViewSrc && (
                <div className="modal-backdrop" onClick={() => setImageViewSrc(null)}>
                    <div className="max-w-4xl max-h-[90vh] p-4 flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        <img src={imageViewSrc} alt="Vista ampliada del reporte" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                    </div>
                </div>
            )}

            <div className="bg-background pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold font-display text-text-main">Panel de Administración</h1>
                        <p className="mt-2 text-text-secondary">Bienvenido, {user?.name}.</p>
                    </div>

                    <div className="flex justify-center border-b border-white/10 mb-8">
                        {(['statistics', 'messages', 'reports', 'users'] as AdminTab[]).map(tab => {
                            if (tab === 'users' && user?.role !== 'dueño') return null;
                            const tabLabels: Record<AdminTab, string> = {
                                statistics: 'Estadísticas',
                                messages: 'Contacto',
                                reports: 'Puntos Verdes',
                                users: 'Usuarios',
                            };
                            return (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 font-semibold transition-colors ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-main'}`}>
                                    {tabLabels[tab]}
                                </button>
                            );
                        })}
                    </div>

                    {renderContent()}
                </div>
            </div>
        </>
    );
};

export default AdminPage;