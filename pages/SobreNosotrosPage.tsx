
import React from 'react';

// Social Media Icons
const LinkedInIcon = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6"><title>LinkedIn</title><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"></path></svg>;
const InstagramIcon = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6"><title>Instagram</title><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.314.935 20.644.523 19.854.218 19.09.083 18.22.015 16.947 0 15.667 0 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.06 1.17-.249 1.805-.413 2.227a3.48 3.48 0 0 1-.896 1.382c-.42.419-.82.679-1.38.896-.423.164-1.057.36-2.227.413-1.266.057-1.646.07-4.85.07s-3.585-.015-4.85-.07c-1.17-.06-1.805-.249-2.227-.413a3.493 3.493 0 0 1-1.382-.896c-.42-.42-.679-.82-.896-1.38a3.37 3.37 0 0 1-.413-2.227c-.057-1.266-.07-1.646-.07-4.85s.015-3.585.07-4.85c.06-1.17.249 1.805.413-2.227.217-.562.477-.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.36 2.227-.413C8.415 2.18 8.797 2.16 12 2.16zm0 5.48c-3.12 0-5.64 2.52-5.64 5.64s2.52 5.64 5.64 5.64 5.64-2.52 5.64-5.64-2.52-5.64-5.64-5.64zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm6.406-11.845a1.44 1.44 0 1 1 0 2.88 1.44 1.44 0 0 1 0-2.88z"></path></svg>;

interface OwnerCardProps {
    name: string;
    role: string;
    description: string;
    imageUrl: string;
    socials: {
        linkedin?: string;
        instagram?: string;
    };
    animationDelay: string;
}

const OwnerCard: React.FC<OwnerCardProps> = ({ name, role, description, imageUrl, socials, animationDelay }) => {
  return (
    <div className="modern-card p-6 text-center flex flex-col items-center animate-fade-in-up" style={{ animationDelay }}>
      <img src={imageUrl} alt={`Foto de ${name}`} className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-surface shadow-lg" />
      <h3 className="text-2xl font-display text-text-main">{name}</h3>
      <p className="text-primary font-semibold mb-3">{role}</p>
      <p className="text-text-secondary flex-grow text-sm">{description}</p>
      <div className="flex space-x-4 mt-6 pt-4 border-t border-white/10 w-full justify-center">
        {socials.linkedin && <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors" aria-label="LinkedIn"><LinkedInIcon /></a>}
        {socials.instagram && <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors" aria-label="Instagram"><InstagramIcon /></a>}
      </div>
    </div>
  );
};

const SobreNosotrosPage: React.FC = () => {
    const owners = [
        {
            name: "Felipe Monzón",
            role: "Co-Fundador y Director de Tecnología",
            description: "Apasionado por la tecnología y la sostenibilidad, Felipe lidera el desarrollo técnico de EcoGestión. Es el arquitecto detrás de la plataforma, el mapa interactivo y la integración de la IA para hacer del reciclaje una experiencia simple y accesible para todos.",
            imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop",
            socials: {
                linkedin: "https://www.linkedin.com/in/felipe-monzón-324349395",
                instagram: "https://www.instagram.com/felipe._.071005/"
            }
        },
        {
            name: "Rolón Agustín",
            role: "Co-Fundador y Director de Comunidad",
            description: "Con un fuerte compromiso social y ambiental, Agustín es el corazón de la comunidad EcoGestión. Se encarga de la creación de contenido, la organización de eventos y la comunicación en redes sociales, fomentando un movimiento positivo y participativo en Formosa.",
            imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
            socials: {
                linkedin: "#",
                instagram: "https://www.instagram.com/agustin.r64?igsh=MTZhdDllMTk5amp4aA=="
            }
        }
    ];

    return (
        <div className="bg-background pt-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12 animate-fade-in-up">
                    <h1 className="text-4xl font-extrabold font-display text-text-main">Nuestro Equipo</h1>
                    <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">Las personas detrás de la misión de EcoGestión, comprometidas con una Formosa más limpia.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {owners.map((owner, index) => (
                        <OwnerCard
                            key={index}
                            name={owner.name}
                            role={owner.role}
                            description={owner.description}
                            imageUrl={owner.imageUrl}
                            socials={owner.socials}
                            animationDelay={`${200 * (index + 1)}ms`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SobreNosotrosPage;
