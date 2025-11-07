import React from 'react';

const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold font-display text-text-main mb-3">{title}</h2>
        <div className="space-y-4 text-text-secondary leading-relaxed">
            {children}
        </div>
    </div>
);

const TerminosUsoPage: React.FC = () => {
    return (
        <div className="bg-background pt-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in-up">
                <h1 className="text-4xl font-extrabold font-display text-text-main text-center mb-4">Términos y Condiciones de Uso</h1>
                <p className="text-center text-text-secondary mb-12">Última actualización: 24 de Julio de 2024</p>

                <LegalSection title="1. Aceptación de los Términos">
                    <p>Al acceder y utilizar la plataforma web de EcoGestión ("la Plataforma"), aceptas cumplir con estos Términos y Condiciones de Uso. Si no estás de acuerdo con alguno de estos términos, no debes utilizar la Plataforma.</p>
                </LegalSection>

                <LegalSection title="2. Uso de la Plataforma">
                    <p>Te comprometes a utilizar la Plataforma de manera responsable y para los fines previstos, que son la educación y promoción del reciclaje y la sostenibilidad.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>No utilizarás la Plataforma para ninguna actividad ilegal o no autorizada.</li>
                        <li>No interferirás con el funcionamiento de la Plataforma ni intentarás acceder a áreas restringidas.</li>
                        <li>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.</li>
                    </ul>
                </LegalSection>

                <LegalSection title="3. Contenido del Usuario">
                    <p>En las áreas interactivas como la sección "Comunidad", eres el único responsable del contenido que publicas (mensajes, imágenes, etc.). Al publicar contenido, nos concedes una licencia no exclusiva y mundial para mostrarlo en la Plataforma.</p>
                     <p>Nos reservamos el derecho de eliminar cualquier contenido que consideremos inapropiado, ofensivo, o que viole estos términos, sin previo aviso.</p>
                </LegalSection>

                <LegalSection title="4. Propiedad Intelectual">
                    <p>Todo el contenido de la Plataforma, incluyendo textos, gráficos, logos, y software, es propiedad de EcoGestión o sus licenciantes y está protegido por las leyes de propiedad intelectual. No puedes reproducir, distribuir o crear trabajos derivados sin nuestro permiso expreso.</p>
                </LegalSection>

                 <LegalSection title="5. Limitación de Responsabilidad">
                    <p>La Plataforma se proporciona "tal cual". No garantizamos que el servicio sea ininterrumpido o libre de errores. La información proporcionada tiene fines educativos y no debe considerarse como asesoramiento profesional. EcoGestión no será responsable de ningún daño directo o indirecto que surja del uso de la Plataforma.</p>
                </LegalSection>

                 <LegalSection title="6. Modificaciones de los Términos">
                    <p>Nos reservamos el derecho de modificar estos Términos en cualquier momento. Te notificaremos de los cambios importantes. El uso continuado de la Plataforma después de dichas modificaciones constituirá tu aceptación de los nuevos términos.</p>
                </LegalSection>
            </div>
        </div>
    );
};

export default TerminosUsoPage;
