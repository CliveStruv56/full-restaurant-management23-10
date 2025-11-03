import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Product, Category, AppSettings } from '../../types';
import { styles } from '../../styles';
import { formatCurrency } from '../../utils';
import { ProductForm } from './ProductForm';
import { BulkUploadModal } from './BulkUploadModal';
import { useTenant } from '../../contexts/TenantContext';
import { addProduct, updateProduct, deleteProduct } from '../../firebase/api-multitenant';

interface ProductManagerProps {
    products: Product[];
    categories: Category[];
    settings: AppSettings;
}

export const ProductManager: React.FC<ProductManagerProps> = ({ products, categories, settings }) => {
    const { tenant } = useTenant();
    const tenantId = tenant?.id;
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const categoryMap = useMemo(() => {
        return new Map(categories.map(cat => [cat.id, cat.name]));
    }, [categories]);

    const handleAddClick = () => {
        setSelectedProduct(null);
        setIsFormVisible(true);
    };

    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setIsFormVisible(true);
    };

    const handleDelete = async (productId: string) => {
        if (!tenantId) {
            toast.error('Unable to delete: Tenant not loaded');
            return;
        }
        if (window.confirm('Are you sure you want to delete this product?')) {
            const deleteToast = toast.loading('Deleting product...');
            try {
                await deleteProduct(tenantId, productId);
                toast.success('Product deleted successfully!', { id: deleteToast });
            } catch (error) {
                console.error("Error deleting product:", error);
                toast.error('Failed to delete product.', { id: deleteToast });
            }
        }
    };

    const handleSave = async (productData: Product | Omit<Product, 'id'>) => {
        if (!tenantId) {
            toast.error('Unable to save: Tenant not loaded');
            throw new Error('Tenant not loaded');
        }
        try {
            if ('id' in productData) {
                await updateProduct(tenantId, productData);
            } else {
                await addProduct(tenantId, productData);
            }
            // Success toast is handled in ProductForm
        } catch (error) {
            console.error("Error saving product:", error);
            // Error is already handled in ProductForm, but throw it to prevent closing
            throw error;
        } finally {
            setIsFormVisible(false);
            setSelectedProduct(null);
        }
    };

    const handleExport = () => {
        const headers = ['id', 'name', 'categoryId', 'price', 'description', 'imageUrl', 'availableOptionNames', 'availableFor'];
        const csvRows = [headers.join(',')];

        for (const product of products) {
            const values = headers.map(header => {
                let value = product[header as keyof Product];
                if (header === 'availableOptionNames' && Array.isArray(value)) {
                    // Join array with a pipe, which is our import format
                    value = value.join('|');
                }
                // Enclose in quotes to handle commas within values
                return `"${String(value ?? '').replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `products-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <>
            <div style={styles.adminSubHeader}>
                <h2 style={styles.adminHeader}>Manage Products</h2>
                <div style={{display: 'flex', gap: '10px'}}>
                    <button style={styles.adminButtonSecondary} onClick={() => setIsBulkUploadModalOpen(true)}>Bulk Add</button>
                    <button style={styles.adminButtonSecondary} onClick={handleExport}>Export Products</button>
                    <button style={styles.adminButtonPrimary} onClick={handleAddClick}>+ Add Product</button>
                </div>
            </div>

            <div style={styles.adminTableContainer}>
                {sortedProducts.length > 0 ? (
                    <table style={styles.adminTable}>
                        <thead>
                            <tr>
                                <th style={styles.adminTh}>Image</th>
                                <th style={styles.adminTh}>Name</th>
                                <th style={styles.adminTh}>Category</th>
                                <th style={styles.adminTh}>Price</th>
                                <th style={styles.adminTh}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedProducts.map(product => (
                                <tr key={product.id}>
                                    <td style={styles.adminTd}><img src={product.imageUrl} alt={product.name} style={styles.adminProductImage} /></td>
                                    <td style={styles.adminTd}>{product.name}</td>
                                    <td style={styles.adminTd}>{categoryMap.get(product.categoryId) || 'N/A'}</td>
                                    <td style={styles.adminTd}>{formatCurrency(product.price, settings.currency)}</td>
                                    <td style={styles.adminTd}>
                                        <div style={styles.adminActionsCell}>
                                            <button style={styles.adminButtonSecondary} onClick={() => handleEditClick(product)}>Edit</button>
                                            <button style={styles.adminButtonDanger} onClick={() => handleDelete(product.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--light-text-color)'}}>
                        No products found. Add one to get started.
                    </div>
                )}
            </div>

            {isFormVisible && (
                <ProductForm 
                    product={selectedProduct} 
                    categories={categories} 
                    onSave={handleSave} 
                    onClose={() => setIsFormVisible(false)} 
                />
            )}
            
            {isBulkUploadModalOpen && (
                <BulkUploadModal 
                    categories={categories}
                    onClose={() => setIsBulkUploadModalOpen(false)}
                    onSuccess={() => { /* Could show a success message here */ }}
                />
            )}
        </>
    );
};