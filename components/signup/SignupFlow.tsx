import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../firebase/config';
import toast from 'react-hot-toast';

type BusinessType = 'cafe' | 'restaurant' | 'pub' | 'quick-service';

interface SignupData {
  // Step 1: Business Info
  businessName: string;
  businessType: BusinessType;
  contactEmail: string;
  contactPhone: string;

  // Step 2: Subdomain
  subdomain: string;

  // Step 3: Modules
  enabledModules: {
    base: boolean;
    tableManagement: boolean;
    management: boolean;
    delivery: boolean;
  };

  // Step 4: Plan
  selectedPlan: 'trial' | 'starter' | 'professional' | 'enterprise';

  // Step 5: Account
  ownerEmail: string;
  ownerPassword: string;
  ownerName: string;
}

export default function SignupFlow() {
  const navigateTo = (path: string, state?: any) => {
    if (state) {
      // Store state in sessionStorage for the next page to access
      sessionStorage.setItem('signupState', JSON.stringify(state));
    }
    window.location.href = path;
  };

  // Get any state from sessionStorage
  const getStoredState = () => {
    const stored = sessionStorage.getItem('signupState');
    if (stored) {
      sessionStorage.removeItem('signupState');
      return JSON.parse(stored);
    }
    return null;
  };

  const storedState = getStoredState();
  const initialPlan = storedState?.selectedPlan;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  const [signupData, setSignupData] = useState<SignupData>({
    businessName: '',
    businessType: 'cafe',
    contactEmail: '',
    contactPhone: '',
    subdomain: '',
    enabledModules: {
      base: true,
      tableManagement: initialPlan === 'Professional' || initialPlan === 'Enterprise',
      management: initialPlan === 'Professional' || initialPlan === 'Enterprise',
      delivery: initialPlan === 'Enterprise'
    },
    selectedPlan: initialPlan === 'Professional' ? 'professional' :
                   initialPlan === 'Enterprise' ? 'enterprise' : 'trial',
    ownerEmail: '',
    ownerPassword: '',
    ownerName: ''
  });

  const totalSteps = 5;

  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setSubdomainChecking(true);
    try {
      const tenantsRef = collection(db, 'tenants');
      const q = query(tenantsRef, where('subdomain', '==', subdomain.toLowerCase()));
      const querySnapshot = await getDocs(q);

      setSubdomainAvailable(querySnapshot.empty);
    } catch (error) {
      console.error('Error checking subdomain:', error);
      toast.error('Failed to check subdomain availability');
    } finally {
      setSubdomainChecking(false);
    }
  };

  const handleSubdomainChange = (value: string) => {
    // Only allow alphanumeric and hyphens
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSignupData({ ...signupData, subdomain: cleaned });

    // Debounce check
    if (cleaned.length >= 3) {
      const timer = setTimeout(() => checkSubdomainAvailability(cleaned), 500);
      return () => clearTimeout(timer);
    } else {
      setSubdomainAvailable(null);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          signupData.businessName &&
          signupData.businessType &&
          signupData.contactEmail &&
          signupData.contactPhone
        );
      case 2:
        return !!(
          signupData.subdomain &&
          signupData.subdomain.length >= 3 &&
          subdomainAvailable === true
        );
      case 3:
        return signupData.enabledModules.base; // Base module always required
      case 4:
        return !!signupData.selectedPlan;
      case 5:
        return !!(
          signupData.ownerEmail &&
          signupData.ownerPassword &&
          signupData.ownerPassword.length >= 6 &&
          signupData.ownerName
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupData.ownerEmail,
        signupData.ownerPassword
      );

      // Calculate trial end date (14 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      // Create tenant document
      const tenantData = {
        businessName: signupData.businessName,
        businessType: signupData.businessType,
        subdomain: signupData.subdomain,
        contactEmail: signupData.contactEmail,
        contactPhone: signupData.contactPhone,
        enabledModules: signupData.enabledModules,
        subscription: {
          plan: signupData.selectedPlan === 'trial' ? 'trial' : 'active',
          trialEndsAt: signupData.selectedPlan === 'trial' ? trialEndsAt.toISOString() : null,
          modules: Object.entries(signupData.enabledModules)
            .filter(([_, enabled]) => enabled)
            .map(([module]) => module)
        },
        paymentGateway: {
          provider: 'none' as const
        },
        tenantStatus: {
          status: 'pending-approval' as const,
          statusChangedAt: new Date().toISOString(),
          statusChangedBy: 'system',
          statusReason: 'New signup awaiting super admin review'
        },
        createdBy: userCredential.user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'tenants'), tenantData);

      // Create user profile
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        email: signupData.ownerEmail,
        displayName: signupData.ownerName,
        role: 'owner',
        tenantId: signupData.subdomain,
        createdAt: new Date().toISOString()
      });

      toast.success('Account created successfully!');

      // Navigate to a pending approval page
      navigateTo('/signup/pending', {
        businessName: signupData.businessName,
        subdomain: signupData.subdomain,
        email: signupData.ownerEmail
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered');
      } else {
        toast.error('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your business</h2>
              <p className="text-gray-600">We'll use this information to set up your account</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-gray-700 font-medium">Business Name *</Label>
              <Input
                id="businessName"
                value={signupData.businessName}
                onChange={(e) => setSignupData({ ...signupData, businessName: e.target.value })}
                placeholder="e.g., Joe's Coffee Shop"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType" className="text-gray-700 font-medium">Business Type *</Label>
              <Select
                value={signupData.businessType}
                onValueChange={(value: BusinessType) => setSignupData({ ...signupData, businessType: value })}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cafe">Cafe / Coffee Shop</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="pub">Pub / Bar</SelectItem>
                  <SelectItem value="quick-service">Quick Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="text-gray-700 font-medium">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={signupData.contactEmail}
                onChange={(e) => setSignupData({ ...signupData, contactEmail: e.target.value })}
                placeholder="owner@example.com"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="text-gray-700 font-medium">Contact Phone *</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={signupData.contactPhone}
                onChange={(e) => setSignupData({ ...signupData, contactPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose your subdomain</h2>
              <p className="text-gray-600">This will be your unique URL for customers to access your menu</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain" className="text-gray-700 font-medium">Subdomain *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="subdomain"
                  value={signupData.subdomain}
                  onChange={(e) => handleSubdomainChange(e.target.value)}
                  placeholder="your-business"
                  className="bg-white border-gray-300 text-gray-900 flex-1"
                />
                <span className="text-gray-600 font-medium">.restaurantos.com</span>
              </div>

              {subdomainChecking && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking availability...</span>
                </div>
              )}

              {!subdomainChecking && subdomainAvailable === true && signupData.subdomain.length >= 3 && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{signupData.subdomain}.restaurantos.com is available!</span>
                </div>
              )}

              {!subdomainChecking && subdomainAvailable === false && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>This subdomain is already taken. Please try another.</span>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Use lowercase letters, numbers, and hyphens only (minimum 3 characters)
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-700">
                <strong>Preview:</strong> Your customers will visit{' '}
                <span className="text-indigo-600 font-semibold">
                  {signupData.subdomain || 'your-business'}.restaurantos.com
                </span>{' '}
                to view your menu and place orders.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select your modules</h2>
              <p className="text-gray-600">Choose the features you need (you can change this later)</p>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="module-base" className="font-semibold text-gray-900 cursor-pointer text-base">
                      Base Module (Required)
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Digital menu, QR codes, order management, basic analytics
                    </p>
                  </div>
                  <Switch
                    id="module-base"
                    checked={true}
                    disabled={true}
                    className="opacity-50"
                  />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 hover:border-green-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="module-table" className="font-semibold text-gray-900 cursor-pointer text-base">
                      Table Management
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Table tracking, reservations, floor plans, turn time analytics
                    </p>
                  </div>
                  <Switch
                    id="module-table"
                    checked={signupData.enabledModules.tableManagement}
                    onCheckedChange={(checked) => setSignupData({
                      ...signupData,
                      enabledModules: { ...signupData.enabledModules, tableManagement: checked }
                    })}
                  />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="module-mgmt" className="font-semibold text-gray-900 cursor-pointer text-base">
                      Management Module
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Staff management, advanced reporting, inventory tracking
                    </p>
                  </div>
                  <Switch
                    id="module-mgmt"
                    checked={signupData.enabledModules.management}
                    onCheckedChange={(checked) => setSignupData({
                      ...signupData,
                      enabledModules: { ...signupData.enabledModules, management: checked }
                    })}
                  />
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200 hover:border-orange-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="module-delivery" className="font-semibold text-gray-900 cursor-pointer text-base">
                      Delivery Module
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Delivery management, driver tracking, route optimization
                    </p>
                  </div>
                  <Switch
                    id="module-delivery"
                    checked={signupData.enabledModules.delivery}
                    onCheckedChange={(checked) => setSignupData({
                      ...signupData,
                      enabledModules: { ...signupData.enabledModules, delivery: checked }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        const plans = [
          {
            id: 'trial',
            name: '14-Day Free Trial',
            price: 'Free',
            description: 'Try all features risk-free',
            features: ['All selected modules', 'Full feature access', 'No credit card required', 'Cancel anytime']
          },
          {
            id: 'starter',
            name: 'Starter',
            price: '$49/mo',
            description: 'Perfect for small cafes',
            features: ['Base module only', 'Unlimited orders', 'Email support', 'Mobile-optimized']
          },
          {
            id: 'professional',
            name: 'Professional',
            price: '$99/mo',
            description: 'For full-service restaurants',
            features: ['All modules available', 'Priority support', 'Custom branding', 'Advanced analytics']
          },
          {
            id: 'enterprise',
            name: 'Enterprise',
            price: '$199/mo',
            description: 'Multi-location & delivery',
            features: ['All modules', 'Dedicated support', 'API access', 'Custom integrations']
          }
        ];

        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose your plan</h2>
              <p className="text-gray-600">Start with a free trial or select a paid plan</p>
            </div>

            <div className="grid gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSignupData({ ...signupData, selectedPlan: plan.id as any })}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    signupData.selectedPlan === plan.id
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                        <span className="text-xl font-bold text-indigo-600">{plan.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                      <ul className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      signupData.selectedPlan === plan.id
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-gray-300'
                    }`}>
                      {signupData.selectedPlan === plan.id && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
              <p className="text-gray-600">You'll use this to log in and manage your restaurant</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName" className="text-gray-700 font-medium">Your Name *</Label>
              <Input
                id="ownerName"
                value={signupData.ownerName}
                onChange={(e) => setSignupData({ ...signupData, ownerName: e.target.value })}
                placeholder="John Doe"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerEmail" className="text-gray-700 font-medium">Email *</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={signupData.ownerEmail}
                onChange={(e) => setSignupData({ ...signupData, ownerEmail: e.target.value })}
                placeholder="you@example.com"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerPassword" className="text-gray-700 font-medium">Password *</Label>
              <Input
                id="ownerPassword"
                type="password"
                value={signupData.ownerPassword}
                onChange={(e) => setSignupData({ ...signupData, ownerPassword: e.target.value })}
                placeholder="Minimum 6 characters"
                className="bg-white border-gray-300 text-gray-900"
              />
              <p className="text-xs text-gray-500">Must be at least 6 characters long</p>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Ready to go!</h4>
              <p className="text-sm text-gray-700">
                When you click "Complete Signup", we'll create your account and submit it for approval.
                You'll receive an email once your account is activated.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
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
          <Button
            variant="outline"
            onClick={() => navigateTo('/')}
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Back to Home
          </Button>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step < currentStep
                    ? 'bg-green-600 text-white'
                    : step === currentStep
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step < currentStep ? <CheckCircle2 className="w-6 h-6" /> : step}
              </div>
              {step < totalSteps && (
                <div
                  className={`w-12 sm:w-20 h-1 mx-2 ${
                    step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t-2 border-gray-200">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateStep(5) || loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Complete Signup
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
