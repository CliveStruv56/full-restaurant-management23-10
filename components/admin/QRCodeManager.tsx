import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import JSZip from 'jszip';
import { AppSettings, Table } from '../../types';
import { styles } from '../../styles';
import { useTenant } from '../../contexts/TenantContext';
import toast from 'react-hot-toast';

interface QRCodeManagerProps {
    settings: AppSettings;
    tables: Table[];
}

/**
 * Generate QR code URL for a table
 * Uses subdomain from tenant context for production URLs
 * Falls back to localhost for development
 */
export const generateQRCodeURL = (subdomain: string, tableNumber: number): string => {
    const hostname = window.location.hostname;

    // Development: use localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const port = window.location.port ? `:${window.location.port}` : '';
        return `http://localhost${port}/order?table=${tableNumber}`;
    }

    // Production: use subdomain
    return `https://${subdomain}.orderflow.app/order?table=${tableNumber}`;
};

/**
 * Download a single QR code as PNG
 */
const downloadQRCode = (tableNumber: number) => {
    const canvas = document.getElementById(`qr-${tableNumber}`) as HTMLCanvasElement;
    if (!canvas) {
        toast.error('QR code not found');
        return;
    }

    try {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `table-${tableNumber}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Table ${tableNumber} QR code downloaded!`);
    } catch (error) {
        console.error('Error downloading QR code:', error);
        toast.error('Failed to download QR code');
    }
};

/**
 * Download all QR codes as a ZIP file
 */
const downloadAllQRCodes = async (availableTables: number[]) => {
    if (availableTables.length === 0) {
        toast.error('No tables configured');
        return;
    }

    try {
        toast.loading('Generating ZIP file...', { id: 'zip-download' });
        const zip = new JSZip();

        // Add each QR code to the ZIP
        for (const tableNumber of availableTables) {
            const canvas = document.getElementById(`qr-${tableNumber}`) as HTMLCanvasElement;
            if (!canvas) continue;

            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1];
            zip.file(`table-${tableNumber}-qr.png`, base64, { base64: true });
        }

        // Generate and download ZIP
        const blob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'qr-codes.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Downloaded ${availableTables.length} QR codes!`, { id: 'zip-download' });
    } catch (error) {
        console.error('Error creating ZIP file:', error);
        toast.error('Failed to create ZIP file', { id: 'zip-download' });
    }
};

export const QRCodeManager: React.FC<QRCodeManagerProps> = ({ settings, tables }) => {
    const { tenant } = useTenant();
    const subdomain = tenant?.subdomain || 'demo-tenant';

    // Extract table numbers from Table objects and sort them
    const availableTables = tables
        .map(table => table.number)
        .sort((a, b) => a - b);

    const [selectedTable, setSelectedTable] = useState<number | null>(null);

    if (availableTables.length === 0) {
        return (
            <div style={styles.adminSection}>
                <h2 style={styles.adminHeader}>QR Code Generator</h2>
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    color: '#856404',
                }}>
                    <p style={{ fontSize: '16px', marginBottom: '10px' }}>
                        No tables configured yet.
                    </p>
                    <p style={{ fontSize: '14px' }}>
                        Please add tables in the Tables page to generate QR codes.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.adminSection}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                flexWrap: 'wrap',
                gap: '15px',
            }}>
                <h2 style={{ ...styles.adminHeader, margin: 0 }}>QR Code Generator</h2>
                <button
                    style={{
                        ...styles.adminButton,
                        backgroundColor: '#2ecc71',
                        color: 'white',
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 600,
                    }}
                    onClick={() => downloadAllQRCodes(availableTables)}
                >
                    📦 Download All as ZIP
                </button>
            </div>

            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '30px',
            }}>
                <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '10px' }}>
                    <strong>Instructions:</strong>
                </p>
                <ul style={{ fontSize: '14px', color: '#6c757d', marginLeft: '20px' }}>
                    <li>Print individual QR codes and place them on tables</li>
                    <li>Customers scan the QR code to order from their table</li>
                    <li>Each QR code encodes a unique URL with the table number</li>
                    <li>Download all codes at once as a ZIP file for easy printing</li>
                </ul>
            </div>

            {/* QR Code Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '30px',
                padding: '20px 0',
            }}>
                {availableTables.map(tableNumber => {
                    const qrCodeURL = generateQRCodeURL(subdomain, tableNumber);

                    return (
                        <div
                            key={tableNumber}
                            style={{
                                backgroundColor: 'white',
                                border: '2px solid #dee2e6',
                                borderRadius: '12px',
                                padding: '24px',
                                textAlign: 'center',
                                boxShadow: selectedTable === tableNumber
                                    ? '0 4px 12px rgba(0,0,0,0.15)'
                                    : '0 2px 8px rgba(0,0,0,0.08)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                            }}
                            onClick={() => setSelectedTable(tableNumber)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                if (selectedTable !== tableNumber) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                }
                            }}
                        >
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#343a40',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}>
                                <span style={{ fontSize: '24px' }}>🪑</span>
                                Table {tableNumber}
                            </h3>

                            {/* QR Code Canvas */}
                            <div style={{
                                backgroundColor: 'white',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                display: 'inline-block',
                            }}>
                                <QRCodeCanvas
                                    id={`qr-${tableNumber}`}
                                    value={qrCodeURL}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                    imageSettings={{
                                        src: '',
                                        height: 0,
                                        width: 0,
                                        excavate: false,
                                    }}
                                />
                            </div>

                            {/* URL Display */}
                            <div style={{
                                fontSize: '11px',
                                color: '#6c757d',
                                backgroundColor: '#f8f9fa',
                                padding: '8px',
                                borderRadius: '4px',
                                marginBottom: '16px',
                                wordBreak: 'break-all',
                                fontFamily: 'monospace',
                            }}>
                                {qrCodeURL}
                            </div>

                            {/* Download Button */}
                            <button
                                style={{
                                    ...styles.adminButton,
                                    backgroundColor: '#3498db',
                                    color: 'white',
                                    width: '100%',
                                    padding: '10px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    downloadQRCode(tableNumber);
                                }}
                            >
                                ⬇️ Download PNG
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Mobile Instructions */}
            <div style={{
                marginTop: '40px',
                padding: '20px',
                backgroundColor: '#e7f3ff',
                border: '1px solid #3498db',
                borderRadius: '8px',
            }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#2c3e50', marginBottom: '10px' }}>
                    💡 Tips for Printing
                </h4>
                <ul style={{ fontSize: '14px', color: '#34495e', marginLeft: '20px', lineHeight: '1.6' }}>
                    <li>Print on high-quality paper or cardstock for durability</li>
                    <li>Recommended size: 4" x 6" (10cm x 15cm) or larger</li>
                    <li>Laminate QR codes for water resistance</li>
                    <li>Test scanning each QR code after printing to ensure readability</li>
                    <li>Consider using table tents or acrylic holders for easy visibility</li>
                </ul>
            </div>
        </div>
    );
};
