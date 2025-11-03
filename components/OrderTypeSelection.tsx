import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface OrderTypeSelectionProps {
    onSelectType: (type: 'dine-in' | 'takeaway') => void;
}

/**
 * OrderTypeSelection Component
 *
 * Customer-facing screen that allows customers to choose their order type:
 * - "Eat In" (dine-in service)
 * - "Take Away" (takeaway/pickup service)
 *
 * This screen is shown after a customer selects "I'm Here Now" intent.
 * QR code entries skip this screen and auto-select "Eat In".
 */
export const OrderTypeSelection: React.FC<OrderTypeSelectionProps> = ({ onSelectType }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-5">
            <div className="max-w-2xl w-full text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10">
                    Will you be dining with us or taking away?
                </h2>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* "Eat In" Button */}
                    <Card
                        className="flex-1 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 bg-blue-500 border-blue-600 text-white"
                        onClick={() => onSelectType('dine-in')}
                    >
                        <CardContent className="flex flex-col items-center justify-center gap-4 p-8 min-h-[180px]">
                            <span className="text-6xl">🍽️</span>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Eat In</h3>
                                <p className="text-base opacity-90">Dine at our restaurant</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* "Take Away" Button */}
                    <Card
                        className="flex-1 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 bg-orange-500 border-orange-600 text-white"
                        onClick={() => onSelectType('takeaway')}
                    >
                        <CardContent className="flex flex-col items-center justify-center gap-4 p-8 min-h-[180px]">
                            <span className="text-6xl">📦</span>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Take Away</h3>
                                <p className="text-base opacity-90">Order for pickup</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
