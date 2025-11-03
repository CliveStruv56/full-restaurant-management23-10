import React, { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AppSettings } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LandingPageProps {
    onOrderNow: (type: 'takeaway' | 'dine-in') => void;
    onMakeReservation: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOrderNow, onMakeReservation }) => {
    const { tenant } = useTenant();
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch settings from Firestore
    useEffect(() => {
        const fetchSettings = async () => {
            if (!tenant?.id) return;

            try {
                setLoading(true);
                const settingsDoc = doc(db, `tenants/${tenant.id}/settings`, 'settings');
                const settingsSnap = await getDoc(settingsDoc);

                if (settingsSnap.exists()) {
                    setSettings(settingsSnap.data() as AppSettings);
                } else {
                    // Default settings if not found
                    setSettings(null);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                setSettings(null);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [tenant?.id]);

    // Format operating hours from weekSchedule
    const formatOperatingHours = (): string => {
        if (!settings?.weekSchedule) return 'Hours not set';

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
        const openDays: { start: string; end: string; hours: string }[] = [];

        days.forEach(day => {
            const daySetting = settings.weekSchedule[day];
            if (daySetting.isOpen) {
                const hours = `${daySetting.openingHour}:00 - ${daySetting.closingHour}:00`;
                if (openDays.length === 0 || openDays[openDays.length - 1].hours !== hours) {
                    openDays.push({ start: day, end: day, hours });
                } else {
                    openDays[openDays.length - 1].end = day;
                }
            }
        });

        if (openDays.length === 0) return 'Closed';

        return openDays.map(({ start, end, hours }) => {
            const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1, 3);
            if (start === end) {
                return `${capitalize(start)}: ${hours}`;
            }
            return `${capitalize(start)}-${capitalize(end)}: ${hours}`;
        }).join(' • ');
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <div className="min-h-[35vh] flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-blue-600">
                    <div className="max-w-3xl w-full flex flex-col items-center gap-5">
                        <Skeleton className="w-48 h-20 rounded-lg" />
                        <Skeleton className="w-3/4 h-10 rounded-lg" />
                        <Skeleton className="w-2/3 h-10 rounded-lg" />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 p-5 max-w-6xl mx-auto w-full">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    // Get landing page settings with defaults
    const landingPage = settings?.landingPage;
    const logoUrl = landingPage?.logoUrl || tenant?.branding?.logo;
    const heroImageUrl = landingPage?.heroImageUrl;
    const primaryColor = landingPage?.primaryColor || tenant?.branding?.primaryColor || '#3498db';
    const tagline = landingPage?.tagline || `Welcome to ${tenant?.businessName || 'our restaurant'}!`;
    const address = landingPage?.address;
    const phone = landingPage?.phone;
    const email = landingPage?.email;
    const businessName = tenant?.businessName || 'Our Restaurant';

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Hero Section */}
            <section
                className="relative min-h-[35vh] flex items-center justify-center p-4 text-white text-center bg-cover bg-center"
                style={{
                    backgroundColor: primaryColor,
                    backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : undefined,
                }}
            >
                {/* Overlay for better text readability when hero image is present */}
                {heroImageUrl && <div className="absolute inset-0 bg-black/50 z-[1]" />}

                <div className="relative z-[2] max-w-3xl w-full">
                    {/* Logo */}
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt={`${businessName} logo`}
                            className="max-h-16 md:max-h-24 max-w-[90%] object-contain mx-auto mb-3 drop-shadow-lg"
                            loading="lazy"
                        />
                    )}

                    {/* Business Name */}
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 drop-shadow-md">
                        {businessName}
                    </h1>

                    {/* Tagline */}
                    {tagline && (
                        <p className="text-lg md:text-2xl lg:text-3xl drop-shadow-md">{tagline}</p>
                    )}
                </div>
            </section>

            {/* Info Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 max-w-6xl mx-auto w-full">
                {/* Operating Hours Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="text-center p-6">
                        <div className="text-4xl mb-2">🕐</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Hours</h3>
                        <p className="text-base text-gray-600 leading-relaxed">{formatOperatingHours()}</p>
                    </CardContent>
                </Card>

                {/* Location Card */}
                {address && (
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="text-center p-6">
                            <div className="text-4xl mb-2">📍</div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Location</h3>
                            <p className="text-base text-gray-600 leading-relaxed">{address}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Contact Card */}
                {(phone || email) && (
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="text-center p-6">
                            <div className="text-4xl mb-2">📞</div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Contact</h3>
                            <div className="text-base text-gray-600 leading-relaxed">
                                {phone && <div>{phone}</div>}
                                {email && <div>{email}</div>}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Action Options */}
            <section className="p-5 pb-10 max-w-6xl mx-auto w-full">
                <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-6">
                    How would you like to proceed?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Takeaway Card */}
                    <Card
                        className="cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2"
                        onClick={() => onOrderNow('takeaway')}
                    >
                        <CardContent className="flex flex-col items-center text-center gap-3 p-6 min-h-[200px]">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${primaryColor}15` }}
                            >
                                <span className="text-4xl">🛍️</span>
                            </div>
                            <h3 className="text-xl font-bold" style={{ color: primaryColor }}>
                                Order Takeaway
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Order now and pick up later. Perfect for on-the-go.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Dine-In Card */}
                    <Card
                        className="cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2"
                        onClick={() => onOrderNow('dine-in')}
                    >
                        <CardContent className="flex flex-col items-center text-center gap-3 p-6 min-h-[200px]">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${primaryColor}15` }}
                            >
                                <span className="text-4xl">🍽️</span>
                            </div>
                            <h3 className="text-xl font-bold" style={{ color: primaryColor }}>
                                Dine In
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Order for dining in. Select your table and we'll serve you.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Reservation Card */}
                    <Card
                        className="cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2"
                        onClick={onMakeReservation}
                    >
                        <CardContent className="flex flex-col items-center text-center gap-3 p-6 min-h-[200px]">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${primaryColor}15` }}
                            >
                                <span className="text-4xl">📅</span>
                            </div>
                            <h3 className="text-xl font-bold" style={{ color: primaryColor }}>
                                Make a Reservation
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Reserve a table for a future date and time.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
};
