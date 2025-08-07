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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#84dcc6] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative z-10 max-w-6xl mx-auto text-center py-20 px-4">
          <div className="inline-flex items-center px-6 py-3 mb-8 rounded-full bg-[#84dcc6]/20 text-[#84dcc6] text-sm font-semibold uppercase tracking-wider shadow-lg">
            <span className="w-2 h-2 bg-[#84dcc6] rounded-full mr-3 animate-pulse"></span>
            One Tool for Drone Builders
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-black mb-8 leading-tight">
            Build Your Perfect Drone <span className="text-black">with DroneBuilder</span>
          </h1>
          <p className="text-xl md:text-2xl text-black mb-6 max-w-3xl mx-auto leading-relaxed">
            DroneBuilder helps you design, customize, and optimize drones for any use case using AI recommendations and a community of drone builders.
          </p>
          <p className="text-lg text-black mb-12 max-w-2xl mx-auto">
            Think of it as <span className="font-semibold text-black">Figma for drone builders</span> - intuitive, collaborative, and powerful.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <button
              onClick={handleStartBuilding}
              className="px-10 py-5 rounded-2xl bg-[#8b95c9] text-white font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {user ? 'Go to Dashboard' : 'Start Building'}
            </button>
            <a href="#how-it-works" className="px-10 py-5 rounded-2xl bg-white text-[#8b95c9] border-2 border-[#8b95c9] font-semibold text-lg shadow-xl hover:bg-[#8b95c9] hover:text-white transform hover:scale-105 transition-all duration-300">
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How it works
            </a>
          </div>
          
          {/* Feature Highlights */}
          <div className="flex items-center justify-center space-x-12 text-sm text-black">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              AI-Powered Optimization
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Real-time Collaboration
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Enterprise Ready
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full max-w-6xl mx-auto py-20 px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black mb-4">
            How DroneBuilder Works
          </h2>
          <p className="text-xl text-black max-w-2xl mx-auto">
            From concept to completion, we've streamlined the entire drone building process
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-gray-100">
            <div className="w-16 h-16 bg-[#84dcc6] rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black mb-4 text-center">Describe Your Needs</h3>
            <p className="text-black text-center leading-relaxed">Tell us your use case, budget, and preferences. DroneBuilder supports everything from hobby to research and commercial drones.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-gray-100">
            <div className="w-16 h-16 bg-[#8b95c9] rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black mb-4 text-center">Get AI-Powered Recommendations</h3>
            <p className="text-black text-center leading-relaxed">Our AI suggests the best parts, wiring, and configuration for your needs—instantly and accurately.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-gray-100">
            <div className="w-16 h-16 bg-[#acd7ec] rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black mb-4 text-center">Start Building</h3>
            <p className="text-black text-center leading-relaxed">View your custom build, get a parts list, and start building your drone with confidence.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full max-w-2xl mx-auto text-center py-16 px-4">
        <h2 className="text-3xl font-bold text-black mb-6">Need help in building your drone? Read our docs or contact us</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/docs"
            className="px-8 py-4 rounded-xl btn-coolors-primary text-white font-bold text-lg shadow-coolors hover:shadow-coolors-hover transition-all duration-200"
          >
            Go to Docs
          </Link>
          <Link
            href="/help"
            className="px-8 py-4 rounded-xl btn-coolors-accent text-white font-bold text-lg shadow-coolors hover:shadow-coolors-hover transition-all duration-200"
          >
            Contact Us
          </Link>
        </div>
      </section>
      <div id="build" />
    </div>
  );
}
