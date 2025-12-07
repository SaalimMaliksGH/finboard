'use client';
import { useState } from 'react';
import AddWidgetModal from './AddWidgetModal';

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 bg-emerald-700 text-white p-4 shadow-lg z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">FinBoard Dashboard</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-emerald-700 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-50 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Widget
          </button>
        </div>
      </header>
      
      <AddWidgetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
