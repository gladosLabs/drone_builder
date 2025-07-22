import React from "react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-start pt-16">
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
          <a href="#build" className="px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg hover:bg-blue-700 transition">Start Building</a>
          <a href="#how-it-works" className="px-8 py-4 rounded-xl bg-white border border-blue-200 text-blue-700 font-semibold text-lg shadow hover:bg-blue-50 transition">How it works</a>
        </div>
        {/* Product Screenshot/Illustration */}
        {/* <div className="flex justify-center mb-12">
          <div className="rounded-2xl shadow-2xl overflow-hidden border border-gray-100 bg-white">
            <Image src="/drone-landing-hero.png" alt="DroneBuilder Screenshot" width={700} height={350} className="object-cover" />
          </div>
        </div> */}
        {/* Social Proof */}
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
        <a href="#build" className="px-10 py-4 rounded-xl bg-blue-600 text-white font-bold text-xl shadow-lg hover:bg-blue-700 transition">Start Building Now</a>
      </section>

      {/* Testimonials */}
      {/* <section className="w-full max-w-4xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What our users say</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-700 mb-4">“DroneBuilder made it so easy to design my first FPV drone. The AI recommendations were spot on!”</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700">A</div>
              <div>
                <div className="font-semibold text-gray-900">Alex P.</div>
                <div className="text-xs text-gray-500">FPV Enthusiast</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-700 mb-4">“I saved hours of research and avoided costly mistakes. Highly recommend for anyone building drones!”</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700">S</div>
              <div>
                <div className="font-semibold text-gray-900">Sara K.</div>
                <div className="text-xs text-gray-500">STEM Teacher</div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Anchor for Build Form (keep your existing form here) */}
      <div id="build" />
    </div>
  );
}
