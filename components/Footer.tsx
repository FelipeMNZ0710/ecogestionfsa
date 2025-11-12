import React from 'react';
import type { Page } from '../types';

interface FooterProps {
    setCurrentPage: (page: Page, params?: { userId?: string }) => void;
}

const Footer: React.FC<FooterProps> = ({ setCurrentPage }) => {
    const year = 2025; // Hardcoded as per user request

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, page: Page) => {
        e.preventDefault();
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    return (
        <footer className="professional-footer bg-surface text-text-secondary border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Main Content Grid */}
                <div className="footer-grid">
                    {/* Column 1: About & Newsletter */}
                    <div className="col-span-2 md:col-span-1">
                        <svg className="h-7 text-white mb-4" viewBox="0 0 162 19" xmlns="http://www.w3.org/2000/svg">
                            <text x="0" y="15" fontFamily="Oswald, sans-serif" fontSize="18" fill="currentColor" letterSpacing="1">
                                ECOGESTIÓN
                            </text>
                        </svg>
                        <p className="text-sm mb-6">Fomentando una comunidad más limpia y sostenible a través de la educación y la acción.</p>
                        <h4 className="footer-title">Suscríbete a Novedades</h4>
                        <form className="newsletter-form">
                            <input type="email" placeholder="Tu email" className="newsletter-input" />
                            <button type="submit" className="newsletter-button">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            </button>
                        </form>
                    </div>

                    {/* Column 2: Explore */}
                    <div>
                        <h4 className="footer-title">Explorar</h4>
                        <nav className="footer-links text-sm">
                            <a href="#" onClick={(e) => handleNavClick(e, 'como-reciclar')}>Cómo Reciclar</a>
                            <a href="#" onClick={(e) => handleNavClick(e, 'puntos-verdes')}>Puntos Verdes</a>
                            <a href="#" onClick={(e) => handleNavClick(e, 'juegos')}>Juegos</a>
                            <a href="#" onClick={(e) => handleNavClick(e, 'noticias')}>Noticias</a>
                            <a href="#" onClick={(e) => handleNavClick(e, 'comunidad')}>Comunidad</a>
                        </nav>
                    </div>

                    {/* Column 3: Legal */}
                    <div>
                        <h4 className="footer-title">Legal</h4>
                        <nav className="footer-links text-sm">
                            <a href="#" onClick={(e) => handleNavClick(e, 'politica-privacidad')}>Política de Privacidad</a>
                            <a href="#" onClick={(e) => handleNavClick(e, 'terminos-uso')}>Términos de Uso</a>
                            <a href="#" onClick={(e) => handleNavClick(e, 'politica-cookies')}>Política de Cookies</a>
                        </nav>
                    </div>

                    {/* Column 4: Contact */}
                    <div>
                        <h4 className="footer-title">Contacto</h4>
                        <div className="text-sm space-y-3">
                            <a href="#" onClick={(e) => handleNavClick(e, 'sobre-nosotros')} className="block text-text-secondary transition-colors duration-200 hover:text-primary">Sobre Nosotros</a>
                            <p>ecogestionfsa@gmail.com</p>
                            <p>+54 370 4123456</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col-reverse md:flex-row justify-between items-center text-sm">
                    <p className="text-text-secondary mt-4 md:mt-0">&copy; {year} EcoGestión. Todos los derechos reservados.</p>
                    <div className="flex space-x-6 footer-socials">
                       <a href="https://www.instagram.com/ecogestionfsa/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg className="w-5 h-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><title>Instagram</title><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.314.935 20.644.523 19.854.218 19.09.083 18.22.015 16.947 0 15.667 0 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.06 1.17-.249 1.805-.413 2.227a3.48 3.48 0 0 1-.896 1.382c-.42.419-.82.679-1.38.896-.423.164-1.057.36-2.227.413-1.266.057-1.646.07-4.85.07s-3.585-.015-4.85-.07c-1.17-.06-1.805-.249-2.227-.413a3.493 3.493 0 0 1-1.382-.896c-.42-.42-.679-.82-.896-1.38a3.37 3.37 0 0 1-.413-2.227c-.057-1.266-.07-1.646-.07-4.85s.015-3.585.07-4.85c.06-1.17.249 1.805.413-2.227.217-.562.477-.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.36 2.227-.413C8.415 2.18 8.797 2.16 12 2.16zm0 5.48c-3.12 0-5.64 2.52-5.64 5.64s2.52 5.64 5.64 5.64 5.64-2.52 5.64-5.64-2.52-5.64-5.64-5.64zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm6.406-11.845a1.44 1.44 0 1 1 0 2.88 1.44 1.44 0 0 1 0-2.88z"/></svg></a>
                        <a href="#" aria-label="WhatsApp"><svg className="w-5 h-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><title>WhatsApp</title><path d="M19.11 4.91A9.81 9.81 0 0 0 12.008.02C6.077.02 1.252 4.92 1.252 11.12c0 1.99.51 3.86 1.45 5.54L1.2 22.99l6.53-1.74c1.61.88 3.39 1.36 5.26 1.36 5.93 0 10.75-4.9 10.75-11.11a9.78 9.78 0 0 0-5.63-9.58zM12 20.45c-1.73 0-3.39-.45-4.83-1.25l-.35-.2-3.58.95.97-3.48-.22-.37c-.85-1.48-1.3-3.15-1.3-4.94 0-5.18 4.11-9.4 9.17-9.4s9.17 4.22 9.17 9.4c0 5.18-4.1 9.4-9.17 9.4zm5.5-7.3c-.28-.14-1.63-.8-1.88-.89-.25-.09-.43-.14-.61.14-.18.28-.71.89-.87 1.08-.16.19-.32.21-.6.07-.28-.14-1.18-.43-2.25-1.38-1.07-.95-1.79-2.13-2-2.49-.21-.36-.02-.55.12-.68.12-.12.28-.32.41-.48.14-.17.18-.28.28-.46.09-.18.05-.35-.02-.49-.07-.14-.61-1.45-.83-1.98-.23-.53-.47-.45-.65-.45h-.58c-.18 0-.47.07-.7.35-.23.28-.87.84-.87 2.05 0 1.21.89 2.37 1.01 2.55.12.18 1.75 2.63 4.24 3.73 2.49 1.1 2.49.73 2.93.7.44-.02 1.63-.67 1.86-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.2-.53-.34z"/></svg></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;