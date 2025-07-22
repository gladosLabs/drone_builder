import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-white/80 backdrop-blur-md shadow-md border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Branding */}
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl text-blue-700 tracking-tight">
          <span className="inline-block w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <span>DroneBuilder</span>
        </Link>
        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6 text-base font-medium">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <Link href="/build" className="hover:text-blue-600 transition-colors">Build</Link>
          <Link href="/help" className="hover:text-blue-600 transition-colors">Help</Link>
        </div>
        {/* User Profile Placeholder */}
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
} 