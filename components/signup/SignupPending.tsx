import React from 'react';
import { Button } from '../ui/button';
import { CheckCircle2, Mail, Clock } from 'lucide-react';

export default function SignupPending() {
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  // Get state from sessionStorage (passed from SignupFlow)
  const getStoredState = () => {
    const stored = sessionStorage.getItem('signupState');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  };

  const storedState = getStoredState();
  const { businessName, subdomain, email } = storedState || {
    businessName: 'Your Business',
    subdomain: 'your-business',
    email: 'your-email@example.com'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">RestaurantOS</span>
          </div>
        </div>
      </header>

      {/* Success Message */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thanks for signing up!
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Your account for <strong>{businessName}</strong> has been created successfully.
          </p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-indigo-600">1.</span>
                    <span>Our team will review your application (usually within 24 hours)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-indigo-600">2.</span>
                    <span>You'll receive an email at <strong>{email}</strong> once approved</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-indigo-600">3.</span>
                    <span>Your site will be available at <strong>{subdomain}.restaurantos.com</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-indigo-600">4.</span>
                    <span>You can start adding your menu and customizing your site</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 text-left">
                <strong>Check your email:</strong> We've sent a confirmation to <strong>{email}</strong>.
                Make sure to check your spam folder if you don't see it within a few minutes.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigateTo('/')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6"
            >
              Return to Home
            </Button>

            <p className="text-sm text-gray-500">
              Questions? Contact us at support@restaurantos.com
            </p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">While you wait, you can:</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Plan your menu structure and gather product images</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Think about your categories and pricing</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Review our getting started guide (coming to your email)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Prepare QR code placement locations in your restaurant</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
