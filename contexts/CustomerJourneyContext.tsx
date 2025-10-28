import React, { createContext, useState, useContext, ReactNode } from 'react';

// Customer journey state interface
export interface CustomerJourneyState {
  entryPoint: 'landing' | 'qr-code' | 'direct';
  customerIntent: 'now' | 'later' | null;
  orderType: 'dine-in' | 'takeaway' | null;
  tableNumber?: number;
}

// Context type interface
interface CustomerJourneyContextType {
  journey: CustomerJourneyState;
  setIntent: (intent: 'now' | 'later') => void;
  setOrderType: (type: 'dine-in' | 'takeaway') => void;
  setTableNumber: (number: number) => void;
  resetJourney: () => void;
}

// Create context
const CustomerJourneyContext = createContext<CustomerJourneyContextType | undefined>(undefined);

// Default state
const defaultJourneyState: CustomerJourneyState = {
  entryPoint: 'landing',
  customerIntent: null,
  orderType: null,
};

/**
 * CustomerJourneyProvider component
 * Manages customer journey state throughout the ordering flow
 *
 * Usage:
 * Wrap customer-facing routes with this provider to track:
 * - Entry point (landing page, QR code scan, direct)
 * - Customer intent (ordering now vs booking for later)
 * - Order type (dine-in vs takeaway)
 * - Table number (for QR code entries)
 */
export const CustomerJourneyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [journey, setJourney] = useState<CustomerJourneyState>(defaultJourneyState);

  /**
   * Set customer intent (now or later)
   * Updates the customerIntent field
   */
  const setIntent = (intent: 'now' | 'later') => {
    setJourney(prev => ({ ...prev, customerIntent: intent }));
  };

  /**
   * Set order type (dine-in or takeaway)
   * Updates the orderType field
   */
  const setOrderType = (type: 'dine-in' | 'takeaway') => {
    setJourney(prev => ({ ...prev, orderType: type }));
  };

  /**
   * Set table number (QR code entry)
   * Auto-sets: entryPoint='qr-code', intent='now', orderType='dine-in', tableNumber
   * This is used when a customer scans a QR code at a table
   */
  const setTableNumber = (number: number) => {
    setJourney({
      entryPoint: 'qr-code',
      customerIntent: 'now',
      orderType: 'dine-in',
      tableNumber: number,
    });
  };

  /**
   * Reset journey to default state
   * Clears all customer journey data
   */
  const resetJourney = () => {
    setJourney(defaultJourneyState);
  };

  return (
    <CustomerJourneyContext.Provider
      value={{
        journey,
        setIntent,
        setOrderType,
        setTableNumber,
        resetJourney,
      }}
    >
      {children}
    </CustomerJourneyContext.Provider>
  );
};

/**
 * Hook to access customer journey context
 *
 * Usage:
 * const { journey, setIntent, setOrderType, setTableNumber, resetJourney } = useCustomerJourney();
 *
 * @throws Error if used outside CustomerJourneyProvider
 */
export const useCustomerJourney = () => {
  const context = useContext(CustomerJourneyContext);
  if (context === undefined) {
    throw new Error('useCustomerJourney must be used within a CustomerJourneyProvider');
  }
  return context;
};
