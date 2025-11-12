import React from 'react';
import type { User } from '../types';

export type Category = 'Todos' | 'Plásticos' | 'Vidrio' | 'Papel/Cartón' | 'Pilas' | 'Favoritos';

interface FilterMenuProps {
  activeFilter: Category;
  setActiveFilter: (filter: Category) => void;
  user: User | null;
}

interface FilterItem {
  id: Category;
  title: string;
  icon: React.ReactNode;
}

const filterItems: FilterItem[] = [
  { 
    id: 'Todos', 
    title: 'Todos', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"></rect><rect x="48" y="48" width="64" height="64" rx="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></rect><rect x="144" y="48" width="64" height="64" rx="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></rect><rect x="48" y="144" width="64" height="64" rx="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></rect><rect x="144" y="144" width="64" height="64" rx="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></rect></svg>
  },
  { 
    id: 'Plásticos', 
    title: 'Plástico', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"></rect><path d="M168,216H88a16,16,0,0,1-16-16V104h96v96A16,16,0,0,1,168,216Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path><path d="M144,104V57.99414a16,16,0,0,0-16-16h-16a16,16,0,0,0-16,16V104" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path><line x1="96" y1="72" x2="160" y2="72" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line></svg>
  },
  { 
    id: 'Vidrio', 
    title: 'Vidrio', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"></rect><path d="M176,40H80a40,40,0,0,0,0,80h96a40,40,0,0,0,0-80Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path><line x1="128" y1="120" x2="128" y2="216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line><line x1="88" y1="216" x2="168" y2="216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line></svg> 
  },
  { 
    id: 'Papel/Cartón', 
    title: 'Papel', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"></rect><path d="M32,216a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V48a8,8,0,0,0-8-8H40a8,8,0,0,0-8,8Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path><path d="M224,88H152a8,8,0,0,1-8-8V32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path><line x1="88" y1="136" x2="168" y2="136" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line><line x1="88" y1="168" x2="168" y2="168" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line></svg> 
  },
  { 
    id: 'Pilas', 
    title: 'Pilas', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"></rect><rect x="32" y="72" width="168" height="112" rx="16" stroke-width="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none"></rect><line x1="200" y1="104" x2="200" y2="152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line><line x1="64" y1="112" x2="64" y2="144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line><line x1="96" y1="112" x2="96" y2="144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line><line x1="128" y1="112" x2="128" y2="144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line></svg> 
  },
];

const FilterMenu: React.FC<FilterMenuProps> = ({ activeFilter, setActiveFilter, user }) => {
  return (
    <div className="filter-menu">
      {filterItems.map(({ id, title, icon }) => (
        <a
          key={id}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveFilter(id);
          }}
          className={`filter-link ${activeFilter === id ? 'active' : ''}`}
        >
          <span className="link-icon">
            {icon}
          </span>
          <span className="link-title">{title}</span>
        </a>
      ))}
      {user && (
        <a
          key="Favoritos"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveFilter('Favoritos');
          }}
          className={`filter-link ${activeFilter === 'Favoritos' ? 'active' : ''}`}
        >
          <span className="link-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"></rect><path d="M128,24,157.66,83.33,224,92.54l-50.37,45.3,14.63,65.83L128,170.13,67.74,203.67,82.37,137.84,32,92.54l66.34-9.21Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path></svg>
          </span>
          <span className="link-title">Favoritos</span>
        </a>
      )}
    </div>
  );
};

export default FilterMenu;