import React from 'react';
import { Toaster } from 'react-hot-toast';
import { colors } from '../theme';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>
            {children}
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: colors.background.secondary,
                        color: colors.text.primary,
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        padding: '16px',
                        fontSize: '14px',
                        fontFamily: "'Poppins', sans-serif",
                        maxWidth: '500px',
                    },
                    success: {
                        iconTheme: {
                            primary: colors.success,
                            secondary: colors.background.secondary,
                        },
                        style: {
                            border: `1px solid ${colors.success}`,
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: colors.error,
                            secondary: colors.background.secondary,
                        },
                        style: {
                            border: `1px solid ${colors.error}`,
                        },
                    },
                    loading: {
                        iconTheme: {
                            primary: colors.primary[600],
                            secondary: colors.background.secondary,
                        },
                    },
                }}
            />
        </>
    );
};
