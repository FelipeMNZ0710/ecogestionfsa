import React from 'react';

const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold font-display text-text-main mb-3">{title}</h2>
        <div className="space-y-4 text-text-secondary leading-relaxed">
            {children}
        </div>
    </div>
);

const PoliticaCookiesPage: React.FC = () => {
    return (
        <div className="bg-background pt-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in-up">
                <h1 className="text-4xl font-extrabold font-display text-text-main text-center mb-4">Política de Cookies</h1>
                <p className="text-center text-text-secondary mb-12">Última actualización: 24 de Julio de 2024</p>

                <LegalSection title="1. ¿Qué son las Cookies?">
                    <p>Las cookies son pequeños archivos de texto que los sitios web que visitas guardan en tu dispositivo (ordenador, tablet, smartphone). Se utilizan ampliamente para que los sitios web funcionen, o funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.</p>
                </LegalSection>

                <LegalSection title="2. ¿Cómo y Por Qué Usamos Cookies?">
                    <p>En EcoGestión, utilizamos cookies de forma muy limitada y principalmente para mejorar tu experiencia. No utilizamos cookies de seguimiento publicitario de terceros.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Cookies Esenciales (LocalStorage):</strong> Utilizamos el almacenamiento local del navegador (que funciona de manera similar a una cookie persistente) para funciones esenciales como mantener tu sesión iniciada. Cuando te logueas, guardamos tus datos de usuario en el almacenamiento local para que no tengas que iniciar sesión cada vez que recargas la página. También guardamos el historial de tu chat con Ecobot para tu conveniencia.</li>
                        <li><strong>Cookies de Rendimiento y Análisis (Futuro):</strong> En el futuro, podríamos utilizar cookies anónimas para recopilar información sobre cómo los visitantes utilizan nuestro sitio web (por ejemplo, qué páginas son las más populares). Esto nos ayuda a mejorar la plataforma. Nunca recopilaremos información de identificación personal para este fin.</li>
                    </ul>
                </LegalSection>

                <LegalSection title="3. Tipos de Cookies que Utilizamos">
                     <p>Actualmente, nuestro uso se centra en el Almacenamiento Local para funcionalidad:</p>
                     <ul className="list-disc pl-5 space-y-2">
                        <li><strong>ecoUser:</strong> Almacena la información de tu sesión de usuario para mantenerte conectado.</li>
                        <li><strong>ecoChatHistory:</strong> Guarda los mensajes de tu conversación con Ecobot para que puedas continuarla más tarde.</li>
                    </ul>
                </LegalSection>

                <LegalSection title="4. Cómo Gestionar tus Cookies">
                    <p>Tienes el control total sobre el almacenamiento de datos en tu navegador. Puedes ver, gestionar y eliminar los datos almacenados (incluido el Almacenamiento Local) a través de la configuración de tu navegador web.</p>
                    <p>Ten en cuenta que si eliminas los datos de nuestro sitio, se cerrará tu sesión y se borrará tu historial de chat. La mayoría de los navegadores te permiten:</p>
                     <ul className="list-disc pl-5 space-y-2">
                        <li>Ver qué cookies tienes y eliminarlas individualmente.</li>
                        <li>Bloquear cookies de terceros.</li>
                        <li>Bloquear cookies de sitios particulares.</li>
                        <li>Eliminar todas las cookies cuando cierras el navegador.</li>
                    </ul>
                </LegalSection>

                 <LegalSection title="5. Cambios en la Política de Cookies">
                    <p>Podemos actualizar esta Política de Cookies de vez en cuando. Cualquier cambio será publicado en esta página. Te recomendamos revisarla periódicamente para estar informado.</p>
                </LegalSection>
            </div>
        </div>
    );
};

export default PoliticaCookiesPage;
