import React, { useState, FormEvent } from 'react';
import { navigationData } from '../data/navigationData';

const ContactoPage: React.FC = () => {
    const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formState.name || !formState.email || !formState.subject || !formState.message) {
            setStatus('error');
            return;
        }
        setStatus('sending');
        try {
            const response = await fetch('http://localhost:3001/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formState)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al enviar el mensaje');
            }

            setStatus('success');
            setFormState({ name: '', email: '', subject: '', message: '' });

        } catch (error) {
            console.error("Contact form error:", error);
            setStatus('error');
        }
    };

    return (
        <div className="bg-background pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12 animate-fade-in-up">
                    <h1 className="text-4xl font-extrabold font-display text-text-main">Ponete en Contacto</h1>
                    <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">¿Tenés preguntas, sugerencias o querés colaborar? Nos encantaría saber de vos.</p>
                </div>

                <div className="modern-card overflow-hidden grid md:grid-cols-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    {/* Left Column (Info) */}
                    <aside className="md:col-span-2 bg-slate-800 text-white p-8">
                        <h2 className="text-2xl font-bold mb-6">Información de Contacto</h2>
                        <div className="space-y-6">
                            {/* Email, Teléfono, Dirección... */}
                             <div className="flex items-start space-x-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mt-1 flex-shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                <div><h3 className="font-semibold text-slate-200">Email</h3><a href="mailto:ecogestionfsa@gmail.com" className="hover:underline text-secondary">ecogestionfsa@gmail.com</a></div>
                            </div>
                            <div className="flex items-start space-x-3">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mt-1 flex-shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                <div><h3 className="font-semibold text-slate-200">Teléfono</h3><p className="text-slate-300">+54 370 4123456</p></div>
                            </div>
                             <div className="flex items-start space-x-3">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mt-1 flex-shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <div><h3 className="font-semibold text-slate-200">Dirección</h3><p className="text-slate-300">Av. 25 de Mayo 555, Formosa, Argentina</p></div>
                            </div>
                             <div className="flex items-start space-x-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mt-1 flex-shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div><h3 className="font-semibold text-slate-200">Horarios de Atención</h3><p className="text-slate-300">Lunes a Viernes<br/>08:00 - 16:00 hs</p></div>
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/20">
                             <h3 className="font-semibold text-slate-200 mb-3">Seguinos en Redes</h3>
                             <div className="flex space-x-4">
                                <a href="https://www.instagram.com/ecogestionfsa/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-secondary"><svg className="w-6 h-6" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><title>Instagram</title><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.314.935 20.644.523 19.854.218 19.09.083 18.22.015 16.947 0 15.667 0 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.06 1.17-.249 1.805-.413 2.227a3.48 3.48 0 0 1-.896 1.382c-.42.419-.82.679-1.38.896-.423.164-1.057.36-2.227.413-1.266.057-1.646.07-4.85.07s-3.585-.015-4.85-.07c-1.17-.06-1.805-.249-2.227-.413a3.493 3.493 0 0 1-1.382-.896c-.42-.42-.679-.82-.896-1.38a3.37 3.37 0 0 1-.413-2.227c-.057-1.266-.07-1.646-.07-4.85s.015-3.585.07-4.85c.06-1.17.249 1.805.413-2.227.217-.562.477-.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.36 2.227-.413C8.415 2.18 8.797 2.16 12 2.16zm0 5.48c-3.12 0-5.64 2.52-5.64 5.64s2.52 5.64 5.64 5.64 5.64-2.52 5.64-5.64-2.52-5.64-5.64-5.64zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm6.406-11.845a1.44 1.44 0 1 1 0 2.88 1.44 1.44 0 0 1 0-2.88z"/></svg></a>
                                <a href="#" className="text-slate-300 hover:text-secondary"><svg className="w-6 h-6" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><title>WhatsApp</title><path d="M19.11 4.91A9.81 9.81 0 0 0 12.008.02C6.077.02 1.252 4.92 1.252 11.12c0 1.99.51 3.86 1.45 5.54L1.2 22.99l6.53-1.74c1.61.88 3.39 1.36 5.26 1.36 5.93 0 10.75-4.9 10.75-11.11a9.78 9.78 0 0 0-5.63-9.58zM12 20.45c-1.73 0-3.39-.45-4.83-1.25l-.35-.2-3.58.95.97-3.48-.22-.37c-.85-1.48-1.3-3.15-1.3-4.94 0-5.18 4.11-9.4 9.17-9.4s9.17 4.22 9.17 9.4c0 5.18-4.1 9.4-9.17 9.4zm5.5-7.3c-.28-.14-1.63-.8-1.88-.89-.25-.09-.43-.14-.61.14-.18.28-.71.89-.87 1.08-.16.19-.32.21-.6.07-.28-.14-1.18-.43-2.25-1.38-1.07-.95-1.79-2.13-2-2.49-.21-.36-.02-.55.12-.68.12-.12.28-.32.41-.48.14-.17.18-.28.28-.46.09-.18.05-.35-.02-.49-.07-.14-.61-1.45-.83-1.98-.23-.53-.47-.45-.65-.45h-.58c-.18 0-.47.07-.7.35-.23.28-.87.84-.87 2.05 0 1.21.89 2.37 1.01 2.55.12.18 1.75 2.63 4.24 3.73 2.49 1.1 2.49.73 2.93.7.44-.02 1.63-.67 1.86-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.2-.53-.34z"/></svg></a>
                             </div>
                        </div>
                    </aside>

                    {/* Right Column (Form) */}
                    <section className="md:col-span-3 p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div><label htmlFor="name" className="form-label">Nombre Completo</label><input type="text" id="name" name="name" value={formState.name} onChange={handleInputChange} className="form-input" required /></div>
                            <div><label htmlFor="email" className="form-label">Email</label><input type="email" id="email" name="email" value={formState.email} onChange={handleInputChange} className="form-input" required /></div>
                            <div>
                                <label htmlFor="subject" className="form-label">Asunto</label>
                                <select
                                    id="subject"
                                    name="subject"
                                    value={formState.subject}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                >
                                    <option value="" disabled>Selecciona una categoría...</option>
                                    {navigationData.map(nav => (
                                        <option key={nav.page} value={nav.title}>{nav.title}</option>
                                    ))}
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div><label htmlFor="message" className="form-label">Mensaje</label><textarea id="message" name="message" rows={5} value={formState.message} onChange={handleInputChange} className="form-input" required></textarea></div>
                            <div>
                                <button type="submit" disabled={status === 'sending'} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 disabled:bg-slate-500 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center">
                                    {status === 'sending' ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Enviando...
                                        </>
                                    ) : 'Enviar Mensaje'}
                                </button>
                            </div>
                            <div aria-live="polite">
                                {status === 'success' && <p className="text-center text-emerald-400">¡Gracias! Tu mensaje ha sido enviado.</p>}
                                {status === 'error' && <p className="text-center text-red-400">Hubo un error. Por favor, completa todos los campos y vuelve a intentarlo.</p>}
                            </div>
                        </form>
                    </section>
                </div>

                {/* FAQ and Map sections */}
                <div className="mt-16 grid lg:grid-cols-2 gap-8">
                    <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <h2 className="text-3xl font-bold font-display text-text-main mb-6">Preguntas Frecuentes</h2>
                        <div className="space-y-4">
                            <details className="bg-surface p-4 rounded-lg cursor-pointer"><summary className="font-semibold">¿Dónde encuentro el Punto Verde más cercano?</summary><p className="mt-2 text-text-secondary">Visita nuestra sección de <a href="#" className="text-primary underline">Puntos Verdes</a> para ver un mapa interactivo y un listado completo.</p></details>
                            <details className="bg-surface p-4 rounded-lg cursor-pointer"><summary className="font-semibold">¿Cómo puedo ser voluntario en un evento?</summary><p className="mt-2 text-text-secondary">¡Genial que quieras sumarte! Publicamos todas nuestras convocatorias en la página de <a href="#" className="text-primary underline">Noticias</a> y en nuestras redes sociales.</p></details>
                            <details className="bg-surface p-4 rounded-lg cursor-pointer"><summary className="font-semibold">¿Ofrecen charlas para escuelas o empresas?</summary><p className="mt-2 text-text-secondary">Sí, nos encanta difundir el mensaje. Envíanos un mensaje a través del formulario con el asunto "Solicitud de Charla" y nos pondremos en contacto.</p></details>
                        </div>
                    </div>
                     <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                        <h2 className="text-3xl font-bold font-display text-text-main mb-6">Nuestra Ubicación</h2>
                        <div className="map-container rounded-lg border border-white/10 shadow-inner h-64 md:h-full">
                            <svg className="map-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet"><g id="map-background"><path className="map-water" d="M0 550 C 50 500, 150 600, 250 550 S 400 450, 500 550 S 650 600, 800 500 V 600 H 0 Z" /><path className="map-block" d="M100 50 H 700 V 500 H 100 Z" /><line className="map-avenue" x1="100" y1="280" x2="700" y2="280" /><line className="map-avenue" x1="100" y1="320" x2="700" y2="320" /><line className="map-avenue" x1="380" y1="50" x2="380" y2="500" /><line className="map-avenue" x1="420" y1="50" x2="420" y2="500" /><rect className="map-plaza" x="385" y="285" width="30" height="30" rx="5" /></g><g transform="translate(400, 300)"><circle className="map-pin-halo" cx="0" cy="-14" r="15" fill="#10B981" opacity="0.3" /><path className="map-pin-body status-ok" d="M0,0 C-8.836,0 -16,-7.164 -16,-16 C-16,-24.836 -8.836,-32 0,-32 C8.836,-32 16,-24.836 16,-16 C16,-7.164 8.836,0 0,0 Z" transform="translate(0, -18) scale(0.8)" /></g></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactoPage;