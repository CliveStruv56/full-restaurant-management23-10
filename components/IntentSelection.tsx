import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface IntentSelectionProps {
    onSelectIntent: (intent: 'now' | 'later') => void;
}

/**
 * IntentSelection Component
 *
 * Customer-facing screen that allows customers to choose their ordering intent:
 * - "I'm Here Now" (for immediate ordering - dine-in or takeaway)
 * - "Book for Later" (for making a reservation)
 *
 * This is the first navigation screen after the landing page in the customer journey.
 * QR code entries skip this screen and go directly to the menu.
 */
export const IntentSelection: React.FC<IntentSelectionProps> = ({ onSelectIntent }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-5">
            <div className="max-w-2xl w-full text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10">
                    How can we serve you today?
                </h2>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* "Here Now" Button */}
                    <Card
                        className="flex-1 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 bg-green-500 border-green-600 text-white"
                        onClick={() => onSelectIntent('now')}
                    >
                        <CardContent className="flex flex-col items-center justify-center gap-4 p-8 min-h-[180px]">
                            <span className="text-6xl">🕐</span>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">I'm Here Now</h3>
                                <p className="text-base opacity-90">Order for pickup or dine-in</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* "Book Later" Button */}
                    <Card
                        className="flex-1 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 bg-blue-500 border-blue-600 text-white"
                        onClick={() => onSelectIntent('later')}
                    >
                        <CardContent className="flex flex-col items-center justify-center gap-4 p-8 min-h-[180px]">
                            <span className="text-6xl">📅</span>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Book for Later</h3>
                                <p className="text-base opacity-90">Reserve a table</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
