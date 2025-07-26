import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleStartBuilding = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-start">
      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto text-center py-16 px-4">
        <div className="inline-flex items-center px-3 py-1 mb-4 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider shadow-sm">
          🚀 Launching on Product Hunt soon
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          Build Your Perfect Drone <span className="text-blue-600">with AI</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
          DroneBuilder helps you design, customize, and optimize drones for any use case—powered by advanced AI recommendations.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <button
            onClick={handleStartBuilding}
            className="px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg hover:bg-blue-700 transition"
          >
            {user ? 'Go to Dashboard' : 'Start Building'}
          </button>
          <a href="#how-it-works" className="px-8 py-4 rounded-xl bg-white border border-blue-200 text-blue-700 font-semibold text-lg shadow hover:bg-blue-50 transition">How it works</a>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full max-w-4xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How DroneBuilder Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Describe Your Needs</h3>
            <p className="text-gray-600">Tell us your use case, budget, and preferences. DroneBuilder supports everything from hobby to research and commercial drones.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Get AI-Powered Recommendations</h3>
            <p className="text-gray-600">Our AI suggests the best parts, wiring, and configuration for your needs—instantly and accurately.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Start Building</h3>
            <p className="text-gray-600">View your custom build, get a parts list, and start building your drone with confidence.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full max-w-2xl mx-auto text-center py-16 px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to build your dream drone?</h2>
        <button
          onClick={handleStartBuilding}
          className="px-10 py-4 rounded-xl bg-blue-600 text-white font-bold text-xl shadow-lg hover:bg-blue-700 transition"
        >
          {user ? 'Go to Dashboard' : 'Start Building Now'}
        </button>
      </section>
      <div id="build" />
    </div>
  );
}
