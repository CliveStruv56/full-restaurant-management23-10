import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useTenant } from '../contexts/TenantContext';
import { AppSettings, Reservation } from '../types';
import { FloorPlanDisplay } from './customer/FloorPlanDisplay';
import toast from 'react-hot-toast';

interface ReservationFormProps {
  onSubmit: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'status'>) => Promise<void>;
  onCancel: () => void;
  availableTables: number[];
  settings: AppSettings;
}

interface FormData {
  date: string;
  time: string;
  partySize: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  tablePreference?: number;
  specialRequests?: string;
}

interface FormErrors {
  date?: string;
  time?: string;
  partySize?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  specialRequests?: string;
}

const ReservationForm: React.FC<ReservationFormProps> = ({
  onSubmit,
  onCancel,
  availableTables,
  settings
}) => {
  const { tenant } = useTenant();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    date: '',
    time: '',
    partySize: 2,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    tablePreference: undefined,
    specialRequests: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  // Generate time slots when date changes
  useEffect(() => {
    if (formData.date) {
      const slots = generateTimeSlots(formData.date, settings);
      setAvailableTimeSlots(slots);
    }
  }, [formData.date, settings]);

  // Generate time slots based on operating hours
  const generateTimeSlots = (dateString: string, settings: AppSettings): string[] => {
    const slots: string[] = [];
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof settings.weekSchedule;

    const daySettings = settings.weekSchedule[dayOfWeek];

    if (!daySettings || !daySettings.isOpen) {
      return [];
    }

    const { openingHour, closingHour } = daySettings;

    // Generate 15-minute intervals
    for (let hour = openingHour; hour < closingHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }

    // Add closing hour as last slot
    slots.push(`${closingHour.toString().padStart(2, '0')}:00`);

    return slots;
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Date validation
    if (!formData.date) {
      errors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errors.date = 'Date must be today or in the future';
      }

      // Check if date is beyond max days in advance
      const maxDate = new Date(today.getTime() + (settings.maxDaysInAdvance || 30) * 24 * 60 * 60 * 1000);
      if (selectedDate > maxDate) {
        errors.date = `Date cannot be more than ${settings.maxDaysInAdvance || 30} days in advance`;
      }
    }

    // Time validation
    if (!formData.time) {
      errors.time = 'Time is required';
    }

    // Party size validation
    if (!formData.partySize || formData.partySize < 1) {
      errors.partySize = 'Party size must be at least 1';
    }
    if (formData.partySize > 20) {
      errors.partySize = 'Party size cannot exceed 20';
    }

    // Contact name validation
    if (!formData.contactName.trim()) {
      errors.contactName = 'Name is required';
    }
    if (formData.contactName.trim().length > 100) {
      errors.contactName = 'Name cannot exceed 100 characters';
    }

    // Phone validation (E.164 format using libphonenumber-js)
    if (!formData.contactPhone.trim()) {
      errors.contactPhone = 'Phone number is required';
    } else {
      const phoneNumber = parsePhoneNumberFromString(formData.contactPhone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        errors.contactPhone = 'Invalid phone number format. Use international format (e.g., +12345678901)';
      }
    }

    // Email validation
    if (!formData.contactEmail.trim()) {
      errors.contactEmail = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail)) {
        errors.contactEmail = 'Invalid email address';
      }
    }

    // Special requests length validation
    if (formData.specialRequests && formData.specialRequests.length > 500) {
      errors.specialRequests = 'Special requests cannot exceed 500 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Format phone number to E.164
      const phoneNumber = parsePhoneNumberFromString(formData.contactPhone);
      const formattedPhone = phoneNumber?.format('E.164') || formData.contactPhone;

      await onSubmit({
        date: formData.date,
        time: formData.time,
        partySize: formData.partySize,
        contactName: formData.contactName.trim(),
        contactPhone: formattedPhone,
        contactEmail: formData.contactEmail.trim().toLowerCase(),
        tablePreference: formData.tablePreference || undefined,
        specialRequests: formData.specialRequests?.trim() || undefined,
      });

      toast.success('Reservation submitted successfully!');
    } catch (error) {
      console.error('Reservation submission error:', error);
      toast.error('Failed to create reservation. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle table selection from floor plan
  const handleTableSelectFromFloorPlan = (tableNumber: number) => {
    handleChange('tablePreference', tableNumber);
    setShowFloorPlan(false);
    toast.success(`Table ${tableNumber} selected`);
  };

  // Check if floor plan can be shown (date, time, and party size are filled)
  const canShowFloorPlan = formData.date && formData.time && formData.partySize > 0;

  // Calculate duration for floor plan filtering (default 90 minutes)
  const reservationDuration = 90; // TODO: Calculate from settings.tableOccupation if available

  // Get min and max dates for date picker
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today.getTime() + (settings.maxDaysInAdvance || 30) * 24 * 60 * 60 * 1000);

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.heading}>Make a Reservation</h2>
        <p style={styles.subtitle}>Fill out the form below to reserve your table</p>

        {/* Date Picker */}
        <div style={styles.formGroup}>
          <label htmlFor="date" style={styles.label}>
            Reservation Date <span style={styles.required}>*</span>
          </label>
          <DatePicker
            id="date"
            selected={selectedDate}
            onChange={(date: Date | null) => {
              setSelectedDate(date);
              if (date) {
                const dateString = date.toISOString().split('T')[0];
                handleChange('date', dateString);
              }
            }}
            minDate={today}
            maxDate={maxDate}
            dateFormat="MMMM d, yyyy"
            placeholderText="Select a date"
            customInput={<input style={styles.input} />}
            required
          />
          {formErrors.date && <p style={styles.error}>{formErrors.date}</p>}
        </div>

        {/* Time Picker */}
        <div style={styles.formGroup}>
          <label htmlFor="time" style={styles.label}>
            Reservation Time <span style={styles.required}>*</span>
          </label>
          <select
            id="time"
            value={formData.time}
            onChange={(e) => handleChange('time', e.target.value)}
            style={styles.select}
            required
            disabled={!formData.date}
          >
            <option value="">Select a time</option>
            {availableTimeSlots.map(slot => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          {formErrors.time && <p style={styles.error}>{formErrors.time}</p>}
          {formData.date && availableTimeSlots.length === 0 && (
            <p style={styles.warning}>No available times for selected date (restaurant closed)</p>
          )}
        </div>

        {/* Party Size */}
        <div style={styles.formGroup}>
          <label htmlFor="partySize" style={styles.label}>
            Party Size <span style={styles.required}>*</span>
          </label>
          <input
            id="partySize"
            type="number"
            value={formData.partySize}
            onChange={(e) => handleChange('partySize', parseInt(e.target.value) || 0)}
            min={1}
            max={20}
            step={1}
            style={styles.input}
            required
          />
          {formErrors.partySize && <p style={styles.error}>{formErrors.partySize}</p>}
        </div>

        {/* Contact Name */}
        <div style={styles.formGroup}>
          <label htmlFor="contactName" style={styles.label}>
            Your Name <span style={styles.required}>*</span>
          </label>
          <input
            id="contactName"
            type="text"
            value={formData.contactName}
            onChange={(e) => handleChange('contactName', e.target.value)}
            maxLength={100}
            placeholder="John Doe"
            style={styles.input}
            required
          />
          {formErrors.contactName && <p style={styles.error}>{formErrors.contactName}</p>}
        </div>

        {/* Phone Number */}
        <div style={styles.formGroup}>
          <label htmlFor="contactPhone" style={styles.label}>
            Phone Number <span style={styles.required}>*</span>
          </label>
          <input
            id="contactPhone"
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => handleChange('contactPhone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            style={styles.input}
            required
          />
          {formErrors.contactPhone && <p style={styles.error}>{formErrors.contactPhone}</p>}
          <p style={styles.hint}>Please use international format (e.g., +12345678901)</p>
        </div>

        {/* Email */}
        <div style={styles.formGroup}>
          <label htmlFor="contactEmail" style={styles.label}>
            Email Address <span style={styles.required}>*</span>
          </label>
          <input
            id="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
            placeholder="john@example.com"
            style={styles.input}
            required
          />
          {formErrors.contactEmail && <p style={styles.error}>{formErrors.contactEmail}</p>}
        </div>

        {/* Table Preference */}
        <div style={styles.formGroup}>
          <label htmlFor="tablePreference" style={styles.label}>
            Table Preference (Optional)
          </label>

          {/* Floor Plan Button (only if enabled and can show) */}
          {settings.floorPlanEnabled && (
            <button
              type="button"
              onClick={() => {
                if (!canShowFloorPlan) {
                  toast.error('Please select date, time, and party size first', {
                    icon: 'ℹ️',
                    duration: 3000
                  });
                  return;
                }
                setShowFloorPlan(true);
              }}
              style={{
                ...styles.floorPlanButton,
                ...(canShowFloorPlan ? {} : styles.floorPlanButtonDisabled)
              }}
              disabled={!canShowFloorPlan}
            >
              <span style={styles.floorPlanIcon}>🗺️</span>
              Choose from Floor Plan
              {!canShowFloorPlan && <span style={styles.disabledNote}> (select date/time first)</span>}
            </button>
          )}

          {/* Traditional dropdown (fallback) */}
          <select
            id="tablePreference"
            value={formData.tablePreference || ''}
            onChange={(e) => handleChange('tablePreference', e.target.value ? parseInt(e.target.value) : undefined)}
            style={styles.select}
          >
            <option value="">No Preference</option>
            {availableTables.map(tableNum => (
              <option key={tableNum} value={tableNum}>
                Table {tableNum}
              </option>
            ))}
          </select>
          <p style={styles.hint}>We'll do our best to accommodate your preference</p>
        </div>

        {/* Special Requests */}
        <div style={styles.formGroup}>
          <label htmlFor="specialRequests" style={styles.label}>
            Special Requests (Optional)
          </label>
          <textarea
            id="specialRequests"
            value={formData.specialRequests}
            onChange={(e) => handleChange('specialRequests', e.target.value)}
            maxLength={500}
            placeholder="High chair needed, window seat preferred, celebrating anniversary, etc."
            style={styles.textarea}
            rows={3}
          />
          {formErrors.specialRequests && <p style={styles.error}>{formErrors.specialRequests}</p>}
          <p style={styles.characterCount}>
            {formData.specialRequests?.length || 0} / 500 characters
          </p>
        </div>

        {/* Buttons */}
        <div style={styles.buttonGroup}>
          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(isSubmitting ? styles.submitButtonDisabled : {}),
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Reservation'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Floor Plan Modal */}
      {showFloorPlan && settings.floorPlanEnabled && canShowFloorPlan && (
        <div style={styles.modalOverlay} onClick={() => setShowFloorPlan(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Select Your Table</h3>
              <button
                onClick={() => setShowFloorPlan(false)}
                style={styles.closeButton}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <FloorPlanDisplay
              onTableSelect={handleTableSelectFromFloorPlan}
              settings={settings}
              showAllStatuses={false}
              filterByDateTime={{
                date: formData.date,
                time: formData.time,
                duration: reservationDuration,
                partySize: formData.partySize
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '12px',
    minHeight: 'auto',
    maxHeight: '100vh',
    overflow: 'auto',
    backgroundColor: '#f5f5f5',
  },
  form: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '6px',
    color: '#333',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#333',
  },
  required: {
    color: '#dc3545',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  select: {
    width: '100%',
    padding: '10px',
    fontSize: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    fontSize: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  error: {
    fontSize: '12px',
    color: '#dc3545',
    marginTop: '3px',
    marginBottom: '0',
  },
  warning: {
    fontSize: '12px',
    color: '#ffc107',
    marginTop: '3px',
    marginBottom: '0',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '3px',
    marginBottom: '0',
  },
  characterCount: {
    fontSize: '12px',
    color: '#666',
    marginTop: '3px',
    marginBottom: '0',
    textAlign: 'right',
  },
  floorPlanButton: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  floorPlanButtonDisabled: {
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    cursor: 'not-allowed',
  },
  floorPlanIcon: {
    fontSize: '18px',
  },
  disabledNote: {
    fontSize: '13px',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3498db',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#666',
    backgroundColor: 'white',
    border: '2px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, color 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '12px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    maxWidth: '1200px',
    maxHeight: '92vh',
    width: '100%',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
};

// Media queries for mobile responsiveness
const mediaQueryStyles = `
  @media (max-width: 768px) {
    .reservation-form-button-group {
      flex-direction: column;
    }
  }
`;

export default ReservationForm;
