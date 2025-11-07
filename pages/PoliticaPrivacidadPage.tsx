import React from 'react';

const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold font-display text-text-main mb-3">{title}</h2>
        <div className="space-y-4 text-text-secondary leading-relaxed">
            {children}
        </div>
    </div>
);

const PoliticaPrivacidadPage: React.FC = () => {
    return (
        <div className="bg-background pt-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in-up">
                <h1 className="text-4xl font-extrabold font-display text-text-main text-center mb-4">Política de Privacidad</h1>
                <p className="text-center text-text-secondary mb-12">Última actualización: 24 de Julio de 2024</p>

                <LegalSection title="1. Introducción">
                    <p>Bienvenido a EcoGestión. Nos comprometemos a proteger tu privacidad y a ser transparentes sobre cómo recopilamos, usamos y compartimos tu información. Esta Política de Privacidad se aplica a nuestra plataforma web y a todos los servicios que ofrecemos.</p>
                </LegalSection>

                <LegalSection title="2. Información que Recopilamos">
                    <p>Recopilamos información de varias maneras para proporcionar y mejorar nuestros servicios:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Información que nos proporcionas directamente:</strong> Cuando te registras, recopilamos tu nombre, dirección de correo electrónico y contraseña. También puedes optar por proporcionar información adicional en tu perfil, como una foto, biografía o título.</li>
                        <li><strong>Información de uso:</strong> Recopilamos datos sobre cómo interactúas con nuestra plataforma, como las páginas que visitas, las acciones que realizas (check-ins, juegos completados), y los logros que desbloqueas.</li>
                        <li><strong>Información del dispositivo:</strong> Podemos recopilar información sobre el dispositivo que utilizas para acceder a nuestro sitio, como el tipo de dispositivo, sistema operativo y navegador.</li>
                    </ul>
                </LegalSection>

                <LegalSection title="3. Cómo Usamos tu Información">
                    <p>Utilizamos la información que recopilamos para los siguientes propósitos:</p>
                     <ul className="list-disc pl-5 space-y-2">
                        <li>Para proporcionar, mantener y mejorar nuestros servicios, incluyendo el sistema de gamificación (EcoPuntos y logros).</li>
                        <li>Para personalizar tu experiencia en la plataforma.</li>
                        <li>Para comunicarnos contigo sobre tu cuenta, actualizaciones del servicio y noticias de la comunidad.</li>
                        <li>Para analizar el uso de la plataforma y entender cómo podemos mejorarla.</li>
                        <li>Para garantizar la seguridad y la integridad de nuestra comunidad.</li>
                    </ul>
                </LegalSection>

                <LegalSection title="4. Cómo Compartimos tu Información">
                    <p>No vendemos ni alquilamos tu información personal a terceros. Podemos compartir tu información en las siguientes circunstancias limitadas:</p>
                     <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Información pública:</strong> Tu nombre de usuario y foto de perfil son visibles para otros usuarios en la sección de la Comunidad.</li>
                        <li><strong>Con tu consentimiento:</strong> Podemos compartir información para un propósito específico si nos das tu consentimiento explícito.</li>
                        <li><strong>Requisitos legales:</strong> Podemos divulgar tu información si así lo exige la ley o en respuesta a una solicitud legal válida.</li>
                    </ul>
                </LegalSection>

                 <LegalSection title="5. Tus Derechos y Opciones">
                    <p>Tienes control sobre tu información personal. Puedes:</p>
                     <ul className="list-disc pl-5 space-y-2">
                        <li>Acceder y actualizar la información de tu perfil en cualquier momento.</li>
                        <li>Solicitar la eliminación de tu cuenta y tus datos personales contactándonos a través de nuestro formulario.</li>
                    </ul>
                </LegalSection>
                
                 <LegalSection title="6. Contacto">
                    <p>Si tienes alguna pregunta o inquietud sobre esta Política de Privacidad, no dudes en ponerte en contacto con nosotros a través de la sección de Contacto de nuestra web.</p>
                </LegalSection>
            </div>
        </div>
    );
};

export default PoliticaPrivacidadPage;
