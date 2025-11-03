import React from 'react';
import { Button } from './ui/button';
import { CheckCircle2, Smartphone, Users, TrendingUp, Table, Package, Truck, BarChart3 } from 'lucide-react';

export default function MarketingLandingPage() {
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const features = [
    {
      icon: <Smartphone className="w-8 h-8 text-indigo-600" />,
      title: "Digital Menu & QR Ordering",
      description: "Customers scan QR codes to browse menus and place orders directly from their phones - no app needed."
    },
    {
      icon: <Table className="w-8 h-8 text-green-600" />,
      title: "Table Management",
      description: "Track table status, reservations, and turn times with real-time updates and visual floor plans."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
      title: "Business Analytics",
      description: "Comprehensive reporting on sales, popular items, peak hours, and customer preferences."
    },
    {
      icon: <Truck className="w-8 h-8 text-orange-600" />,
      title: "Delivery Integration",
      description: "Manage delivery orders alongside dine-in and takeout with integrated tracking and notifications."
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "$49",
      period: "/month",
      description: "Perfect for cafes and quick-service restaurants",
      features: [
        "Digital menu with QR codes",
        "Unlimited orders",
        "Basic analytics",
        "Email support",
        "Mobile-optimized interface"
      ],
      modules: ['base'],
      highlighted: false
    },
    {
      name: "Professional",
      price: "$99",
      period: "/month",
      description: "Ideal for full-service restaurants and pubs",
      features: [
        "Everything in Starter",
        "Table management & reservations",
        "Advanced analytics & reporting",
        "Staff management",
        "Priority support",
        "Custom branding"
      ],
      modules: ['base', 'tableManagement', 'management'],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      description: "For multi-location restaurants with delivery",
      features: [
        "Everything in Professional",
        "Delivery management",
        "Multi-location support",
        "API access",
        "Custom integrations",
        "Dedicated account manager"
      ],
      modules: ['base', 'tableManagement', 'management', 'delivery'],
      highlighted: false
    }
  ];

  const benefits = [
    "Increase order accuracy with digital ordering",
    "Reduce staff workload and labor costs",
    "Boost table turnover with better management",
    "Gain insights into customer preferences",
    "Improve customer satisfaction",
    "Scale easily as you grow"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">RestaurantOS</span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigateTo('/login')}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigateTo('/signup')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Modern Restaurant Management
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Made Simple
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Streamline your restaurant operations with digital menus, QR ordering, table management,
            and powerful analytics. Start serving smarter today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => navigateTo('/signup')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-6 text-lg shadow-xl"
            >
              Start Your 14-Day Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg"
            >
              Watch Demo
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Run Your Restaurant
          </h2>
          <p className="text-xl text-gray-600">
            Powerful features designed for modern food service businesses
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Restaurant Owners Love RestaurantOS
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                <span className="text-white text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your business. Upgrade or downgrade anytime.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-xl p-8 relative ${
                plan.highlighted
                  ? 'ring-4 ring-indigo-600 scale-105 z-10'
                  : 'border border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigateTo('/signup')}
                className={`w-full py-6 text-lg font-semibold ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                Start Free Trial
              </Button>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600 mt-8">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join hundreds of restaurants already using RestaurantOS to streamline operations
            and delight customers.
          </p>
          <Button
            size="lg"
            onClick={() => navigateTo('/signup')}
            className="bg-white text-indigo-600 hover:bg-gray-100 font-bold px-8 py-6 text-lg shadow-xl"
          >
            Start Your Free Trial Today
          </Button>
          <p className="text-sm text-indigo-100 mt-4">
            14-day trial • No credit card required • Setup in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">R</span>
                </div>
                <span className="text-white font-bold text-lg">RestaurantOS</span>
              </div>
              <p className="text-sm">
                Modern restaurant management made simple.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            © 2025 RestaurantOS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
