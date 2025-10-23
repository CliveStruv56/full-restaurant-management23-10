import React, { useState, useMemo } from 'react';
import { Product, Category } from '../../types';
import { styles } from '../../styles';
import { bulkAddProducts } from '../../firebase/api';

// Type for the preview table row
interface ParsedProductRow {
    data: Partial<Omit<Product, 'id'>>;
    errors: string[];
    isValid: boolean;
    originalIndex: number;
}

// Props for the modal
interface BulkUploadModalProps {
    categories: Category[];
    onClose: () => void;
    onSuccess: () => void;
}

// Helper to parse CSV.
const parseCSV = (csvText: string): string[][] => {
    return csvText.trim().split('\n').map(row => {
        // This simple regex handles comma-separated values, including those enclosed in quotes.
        const matches = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        return matches.map(cell => cell.replace(/^"|"$/g, '').trim());
    });
};


export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ categories, onClose, onSuccess }) => {
    const [csvUrl, setCsvUrl] = useState('');
    const [parsedData, setParsedData] = useState<ParsedProductRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
    const categoryIds = useMemo(() => new Set(categories.map(c => c.id)), [categories]);

    const handlePreview = async () => {
        if (!csvUrl) {
            setError('Please enter a CSV URL.');
            return;
        }
        setIsLoading(true);
        setError('');
        setParsedData([]);

        try {
            // Using a CORS proxy for development/demo purposes to bypass Google Sheets CORS issues.
            const response = await fetch(`https://cors-anywhere.herokuapp.com/${csvUrl}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch CSV. Status: ${response.status}. Check CORS policy and URL.`);
            }
            const csvText = await response.text();
            const rows = parseCSV(csvText);
            
            const header = rows.shift()?.map(h => h.toLowerCase().replace(/\s/g, ''));
            if (!header || !header.includes('name') || !header.includes('categoryid') || !header.includes('price')) {
                throw new Error("CSV header must contain 'name', 'categoryId', and 'price' columns.");
            }
            
            const nameIndex = header.indexOf('name');
            const categoryIdIndex = header.indexOf('categoryid');
            const priceIndex = header.indexOf('price');
            const descriptionIndex = header.indexOf('description');
            const imageUrlIndex = header.indexOf('imageurl');
            const optionsIndex = header.indexOf('availableoptionnames');

            const validatedData = rows.map((row, index): ParsedProductRow => {
                const rowErrors: string[] = [];
                const productData: Partial<Omit<Product, 'id'>> = {};

                const name = row[nameIndex];
                if (name) productData.name = name; else rowErrors.push('Name is required.');

                const categoryId = row[categoryIdIndex];
                if (categoryId) {
                    if (categoryIds.has(categoryId)) {
                        productData.categoryId = categoryId;
                    } else {
                        rowErrors.push(`Category ID "${categoryId}" not found.`);
                    }
                } else {
                    rowErrors.push('Category ID is required.');
                }
                
                const priceStr = row[priceIndex];
                if (priceStr) {
                    const price = parseFloat(priceStr);
                    if (!isNaN(price)) {
                        productData.price = price;
                    } else {
                        rowErrors.push('Price must be a number.');
                    }
                } else {
                    rowErrors.push('Price is required.');
                }

                productData.description = descriptionIndex > -1 ? row[descriptionIndex] : '';
                productData.imageUrl = imageUrlIndex > -1 ? row[imageUrlIndex] : '';
                productData.availableOptionNames = optionsIndex > -1 && row[optionsIndex] ? row[optionsIndex].split('|').map(s => s.trim()) : [];

                return {
                    data: productData,
                    errors: rowErrors,
                    isValid: rowErrors.length === 0,
                    originalIndex: index + 1
                };
            });
            
            setParsedData(validatedData);

        } catch (e: any) {
            setError(e.message || 'An unknown error occurred. A common issue is the browser blocking the request due to CORS policy. Ensure the URL is correct and publicly accessible.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleImport = async () => {
        const validProducts = parsedData
            .filter(row => row.isValid)
            .map(row => row.data as Omit<Product, 'id'>);
            
        if (validProducts.length === 0) {
            setError("No valid products to import.");
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await bulkAddProducts(validProducts);
            onSuccess();
            onClose();
        } catch (e: any) {
            setError("Failed to save products to the database.");
        } finally {
            setIsLoading(false);
        }
    };

    const summary = useMemo(() => {
        if (parsedData.length === 0) return null;
        const validCount = parsedData.filter(p => p.isValid).length;
        const errorCount = parsedData.length - validCount;
        return `Found ${parsedData.length} products. ${validCount} are valid. ${errorCount} have errors.`;
    }, [parsedData]);

    const validProductsCount = parsedData.filter(r => r.isValid).length;

    return (
        <div style={styles.adminModalOverlay}>
            <div style={{...styles.adminModalContent, maxWidth: '800px'}}>
                <header style={styles.adminModalHeader}>
                    <h3 style={styles.adminModalTitle}>Bulk Add Products via CSV</h3>
                    <button style={styles.closeButton} onClick={onClose}>&times;</button>
                </header>
                <div style={styles.adminForm}>
                    <div style={{marginBottom: '20px'}}>
                        <p><strong>Instructions:</strong></p>
                        <ol style={{fontSize: '0.9em', lineHeight: 1.6, margin: '10px 0', paddingLeft: '20px'}}>
                            <li>Create a Google Sheet with a header row. Column names must include (case-insensitive, no spaces): <code>name</code>, <code>categoryId</code>, <code>price</code>.</li>
                            <li>Optional columns: <code>description</code>, <code>imageUrl</code>, <code>availableOptionNames</code>.</li>
                            <li>For <code>availableOptionNames</code>, separate multiple options with a pipe character (e.g., <code>Oat Milk|Vanilla Syrup</code>).</li>
                            <li>In Google Sheets, go to <strong>File &gt; Share &gt; Publish to web</strong>. Select the correct sheet, choose "Comma-separated values (.csv)", and click Publish.</li>
                            <li>Copy the generated link and paste it below.</li>
                        </ol>
                    </div>
                    <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                        <input
                            style={styles.adminFormInput}
                            type="url"
                            placeholder="Paste your public Google Sheet CSV URL here"
                            value={csvUrl}
                            onChange={e => setCsvUrl(e.target.value)}
                            disabled={isLoading}
                        />
                        <button style={styles.adminButtonPrimary} onClick={handlePreview} disabled={isLoading}>
                            {isLoading ? 'Loading...' : 'Preview Data'}
                        </button>
                    </div>

                    {error && <p style={styles.adminError}>{error}</p>}
                    {summary && <p style={{fontWeight: 'bold', marginBottom: '10px'}}>{summary}</p>}

                    {parsedData.length > 0 && (
                        <div style={{maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6'}}>
                            <table style={styles.adminTable}>
                                <thead>
                                    <tr>
                                        <th style={styles.adminTh}>#</th>
                                        <th style={styles.adminTh}>Name</th>
                                        <th style={styles.adminTh}>Category</th>
                                        <th style={styles.adminTh}>Price</th>
                                        <th style={styles.adminTh}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.map(row => (
                                        <tr key={row.originalIndex} style={{backgroundColor: row.isValid ? 'transparent' : '#ffebee'}}>
                                            <td style={styles.adminTd}>{row.originalIndex}</td>
                                            <td style={styles.adminTd}>{row.data.name || '---'}</td>
                                            <td style={styles.adminTd}>{row.data.categoryId ? (categoryMap.get(row.data.categoryId) || <span style={{color: '#e63946'}}>{row.data.categoryId}</span>) : '---'}</td>
                                            <td style={styles.adminTd}>{row.data.price?.toFixed(2) || '---'}</td>
                                            <td style={styles.adminTd}>
                                                {row.isValid 
                                                    ? <span style={{color: '#2a9d8f'}}>✓ Valid</span> 
                                                    : <span style={{color: '#e63946', fontWeight: 'bold'}}>{row.errors.join(', ')}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                <footer style={{...styles.adminFormActions, padding: '20px', borderTop: '1px solid #e9ecef'}}>
                    <button type="button" style={styles.adminButtonSecondary} onClick={onClose} disabled={isLoading}>Cancel</button>
                    <button 
                        type="button" 
                        style={styles.adminButtonPrimary} 
                        onClick={handleImport}
                        disabled={isLoading || validProductsCount === 0}
                    >
                        {isLoading ? 'Importing...' : `Import ${validProductsCount} Products`}
                    </button>
                </footer>
            </div>
        </div>
    );
};
