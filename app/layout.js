// This file is a Next.js Server Component (by default)
import { Inter } from 'next/font/google';
import './globals.css';
import DndProviderWrapper from './DndProviderWrapper';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'FinBoard - Next.js Internship Assignment',
  description: 'Customizable Finance Dashboard built with Next.js, Zustand, and Tailwind CSS.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* The DndProvider must wrap all components that use drag-and-drop. 
            It needs the 'use client' directive, so we move it to a wrapper component. 
        */}
        <DndProviderWrapper>
          <Navbar />
          {children}
        </DndProviderWrapper>
      </body>
    </html>
  );
}