import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Help() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    subscription: 'free'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If premium is selected, show pricing modal instead
    if (formData.subscription === 'premium') {
      setShowPricingModal(true);
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setShowSuccess(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        subscription: 'free'
      });
    }, 3000);
  };

  const handlePricingSelect = (plan) => {
    setShowPricingModal(false);
    console.log(`Selected plan: ${plan}`);
  };

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Basic email support (48h response)',
        'Access to FAQ and resources',
        'Community forum access',
        'Basic build templates'
      ],
      buttonText: 'Continue with Free',
      buttonStyle: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      features: [
        'Priority email support (24h response)',
        'One-on-one video consultations (2/month)',
        'Custom build recommendations',
        'Advanced troubleshooting',
        'Performance optimization tips',
        'Unlimited build storage',
        'Export builds to PDF'
      ],
      buttonText: 'Start Pro Trial',
      buttonStyle: 'btn-coolors-primary',
      popular: true
    },
    {
      name: 'Unlimited',
      price: '$49',
      period: 'per month',
      features: [
        'Everything in Pro',
        'Unlimited video consultations',
        'Priority phone support',
        'Custom drone design service',
        'Advanced analytics & insights',
        'Team collaboration tools',
        'API access for integrations',
        'White-label solutions'
      ],
      buttonText: 'Start Unlimited Trial',
      buttonStyle: 'btn-coolors-secondary'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help & Support</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get help with your drone builds, learn new techniques, and connect with our community of experts.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - FAQ & Resources */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-coolors p-6 border border-[#d6edff]">
                <h3 className="font-semibold text-gray-900 mb-2">How do I start building my first drone?</h3>
                <p className="text-gray-600">Begin by selecting a frame type that matches your use case. We recommend starting with an X Frame for beginners. Add motors, propellers, and other essential components step by step.</p>
              </div>

              <div className="bg-white rounded-xl shadow-coolors p-6 border border-[#d6edff]">
                <h3 className="font-semibold text-gray-900 mb-2">What's the difference between frame types?</h3>
                <p className="text-gray-600">X Frames are great for racing and freestyle, H Frames offer stability for payloads, Cinewhoops are perfect for indoor filming, and Hex/Octo frames provide maximum lift and redundancy.</p>
              </div>

              <div className="bg-white rounded-xl shadow-coolors p-6 border border-[#d6edff]">
                <h3 className="font-semibold text-gray-900 mb-2">How do I know if my parts are compatible?</h3>
                <p className="text-gray-600">Our system automatically checks compatibility and shows warnings for incompatible parts. Look for the green checkmarks and avoid red warning indicators.</p>
              </div>

              <div className="bg-white rounded-xl shadow-coolors p-6 border border-[#d6edff]">
                <h3 className="font-semibold text-gray-900 mb-2">Can I save and share my builds?</h3>
                <p className="text-gray-600">Yes! Create an account to save your builds, export them as JSON or CSV, and share them with the community. Premium users get unlimited storage.</p>
              </div>

              <div className="bg-white rounded-xl shadow-coolors p-6 border border-[#d6edff]">
                <h3 className="font-semibold text-gray-900 mb-2">What do the flight time and payload calculations mean?</h3>
                <p className="text-gray-600">These are estimates based on your selected components. Flight time depends on battery capacity and motor efficiency, while max payload considers total weight and thrust.</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-12">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Resources</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/playground" className="p-4 bg-[#e8f4ff] rounded-lg hover:bg-[#d6edff] transition-colors">
                  <div className="font-semibold text-[#8b95c9]">Start Building</div>
                  <div className="text-sm text-gray-600">Create your first drone</div>
                </Link>
                <Link href="/dashboard" className="p-4 bg-[#e8f4ff] rounded-lg hover:bg-[#d6edff] transition-colors">
                  <div className="font-semibold text-[#8b95c9]">My Dashboard</div>
                  <div className="text-sm text-gray-600">View saved builds</div>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Expert Connect Form */}
          <div>
            <div className="bg-gradient-to-br from-[#d6edff] to-[#e8f4ff] rounded-2xl p-8 border border-[#acd7ec]">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#8b95c9] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect with Experts</h2>
                <p className="text-gray-600 mb-4">
                  Get personalized help from our team of drone building experts
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#84dcc6] text-white text-sm font-semibold">
                  ⭐ Premium Feature
                </div>
              </div>

              {showSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#84dcc6] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-600">Our experts will get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-[#d6edff] rounded-lg focus:ring-2 focus:ring-[#8b95c9] focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-[#d6edff] rounded-lg focus:ring-2 focus:ring-[#8b95c9] focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-[#d6edff] rounded-lg focus:ring-2 focus:ring-[#8b95c9] focus:border-transparent"
                    >
                      <option value="">Select a topic</option>
                      <option value="build-help">Help with my drone build</option>
                      <option value="part-selection">Part selection advice</option>
                      <option value="compatibility">Compatibility issues</option>
                      <option value="performance">Performance optimization</option>
                      <option value="troubleshooting">Troubleshooting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-[#d6edff] rounded-lg focus:ring-2 focus:ring-[#8b95c9] focus:border-transparent"
                      placeholder="Describe your question or issue in detail..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Plan</label>
                    <div className="space-y-3">
                      <label className="flex items-center p-3 border border-[#d6edff] rounded-lg cursor-pointer hover:bg-[#f8fafc]">
                        <input
                          type="radio"
                          name="subscription"
                          value="free"
                          checked={formData.subscription === 'free'}
                          onChange={handleInputChange}
                          className="mr-3 text-[#8b95c9] focus:ring-[#8b95c9]"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Free Plan</div>
                          <div className="text-sm text-gray-600">Basic support via email (48h response)</div>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border-2 border-[#8b95c9] rounded-lg cursor-pointer bg-[#f8fafc]">
                        <input
                          type="radio"
                          name="subscription"
                          value="premium"
                          checked={formData.subscription === 'premium'}
                          onChange={handleInputChange}
                          className="mr-3 text-[#8b95c9] focus:ring-[#8b95c9]"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Premium Plan</div>
                          <div className="text-sm text-gray-600">Priority expert support (24h response) + Video calls</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 btn-coolors-primary text-white font-semibold rounded-lg hover:shadow-coolors transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </div>
                    ) : (
                      'Send Message to Experts'
                    )}
                  </button>
                </form>
              )}

              {/* Premium Benefits */}
              <div className="mt-8 pt-6 border-t border-[#acd7ec]">
                <h4 className="font-semibold text-gray-900 mb-3">Premium Expert Support Includes:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-[#84dcc6] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    24-hour response time guarantee
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-[#84dcc6] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    One-on-one video consultation calls
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-[#84dcc6] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Custom build recommendations
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-[#84dcc6] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Troubleshooting assistance
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-[#84dcc6] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Performance optimization tips
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Expert Support Plan</h2>
              <p className="text-gray-600">Get the level of expert support that matches your needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {pricingPlans.map((plan, index) => (
                <div key={index} className={`relative bg-white rounded-xl border-2 p-6 ${plan.popular ? 'border-[#8b95c9] shadow-coolors' : 'border-[#d6edff]'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#8b95c9] text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-1">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <svg className="w-5 h-5 text-[#84dcc6] mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePricingSelect(plan.name)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${plan.buttonStyle}`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => setShowPricingModal(false)}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 