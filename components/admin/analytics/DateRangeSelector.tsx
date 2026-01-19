import React from 'react';
import { DateRange, getDateRangeOptions } from '../../../lib/analytics';

interface DateRangeSelectorProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
};

const buttonStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: isActive ? 'var(--accent-color, #3b82f6)' : '#f3f4f6',
  color: isActive ? '#fff' : '#374151',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
}) => {
  const ranges = getDateRangeOptions();

  return (
    <div style={containerStyle}>
      {ranges.map((range) => (
        <button
          key={range.label}
          style={buttonStyle(selectedRange.label === range.label)}
          onClick={() => onRangeChange(range)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};
