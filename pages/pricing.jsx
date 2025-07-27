import Link from 'next/link';

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with drone building",
      features: [
        "Access to basic documentation",
        "Community forum support",
        "Basic build templates",
        "Email support (48h response)"
      ],
      buttonText: "Get Started Free",
      buttonColor: "bg-gray-500 hover:bg-gray-600",
      popular: false
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      description: "For serious builders who need expert guidance",
      features: [
        "Everything in Free",
        "Priority expert consultation",
        "Custom build analysis",
        "Video call support (24h response)",
        "Advanced build templates",
        "Parts compatibility checker",
        "Performance optimization tips"
      ],
      buttonText: "Start Pro Plan",
      buttonColor: "btn-coolors-primary",
      popular: true
    },
    {
      name: "Unlimited",
      price: "$99",
      period: "per month",
      description: "For professionals and businesses",
      features: [
        "Everything in Pro",
        "Unlimited expert consultations",
        "Custom drone design services",
        "Priority video calls (4h response)",
        "Bulk parts sourcing assistance",
        "Custom firmware support",
        "Integration consulting",
        "Dedicated account manager"
      ],
      buttonText: "Start Unlimited",
      buttonColor: "bg-[#84dcc6] hover:bg-[#6bc4b0]",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Expert Support Plans</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get expert guidance from professional drone builders and engineers. 
              Whether you're a beginner or a professional, we have the right plan for you.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
                plan.popular ? 'border-[#8b95c9] ring-2 ring-[#8b95c9]/20' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#8b95c9] text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">/{plan.period}</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <svg className="w-5 h-5 text-[#84dcc6] mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                <button 
                  className={`w-full py-3 px-6 rounded-xl text-white font-semibold transition-all duration-200 ${plan.buttonColor}`}
                  onClick={() => {
                    // Handle plan selection - could open contact form or redirect
                    alert(`Thank you for choosing ${plan.name}! Our team will contact you soon.`);
                  }}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How quickly will I get a response?</h3>
              <p className="text-gray-600">
                Free plan: 48 hours, Pro plan: 24 hours, Unlimited plan: 4 hours for urgent requests.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Can I change plans anytime?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What if I'm not satisfied?</h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you're not happy, we'll refund your subscription.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Do you offer team plans?</h3>
              <p className="text-gray-600">
                Yes! Contact us for custom enterprise plans with team collaboration features.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#8b95c9] to-[#84dcc6] rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Build Your Dream Drone?</h3>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of successful builders who've created amazing drones with our expert guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/docs"
                className="px-8 py-3 bg-white text-[#8b95c9] rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Read Our Docs
              </Link>
              <Link
                href="/help"
                className="px-8 py-3 border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-[#8b95c9] transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 