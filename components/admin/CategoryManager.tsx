import React, { useState } from 'react';
import { Category, ProductOption, AppSettings } from '../../types';
import { styles } from '../../styles';
import { formatCurrency } from '../../utils';
import { addCategory, updateCategory, deleteCategory } from '../../firebase/api';

interface CategoryManagerProps {
    categories: Category[];
    settings: AppSettings;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, settings }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newOption, setNewOption] = useState<{ categoryId: string, name: string, price: string }>({ categoryId: '', name: '', price: '' });
    const [editingSizePrice, setEditingSizePrice] = useState<{ categoryId: string, sizeName: string, price: string } | null>(null);
    const [editingOptionPrice, setEditingOptionPrice] = useState<{ categoryId: string, optionName: string, price: string } | null>(null);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim() === '') return;
        const newCatData: Omit<Category, 'id'> = {
            name: newCategoryName.trim(),
            options: [],
        };
        await addCategory(newCatData);
        setNewCategoryName('');
    };
    
    const handleDeleteCategory = async (categoryId: string) => {
        // A robust implementation would first check if any products are using this category.
        if(window.confirm('Are you sure you want to delete this category? This cannot be undone.')) {
            await deleteCategory(categoryId);
        }
    };

    const handleAddOption = async (categoryId: string) => {
        if (newOption.name.trim() === '' || isNaN(parseFloat(newOption.price))) return;
        
        const categoryToUpdate = categories.find(c => c.id === categoryId);
        if (!categoryToUpdate) return;

        // Prevent adding duplicate option names
        if (categoryToUpdate.options.some(opt => opt.name.toLowerCase() === newOption.name.trim().toLowerCase())) {
            alert(`Option "${newOption.name.trim()}" already exists for this category.`);
            return;
        }

        const optionToAdd: ProductOption = {
            name: newOption.name.trim(),
            price: parseFloat(newOption.price),
        };

        const updatedCategory = {
            ...categoryToUpdate,
            options: [...categoryToUpdate.options, optionToAdd]
        };
        
        await updateCategory(updatedCategory);
        setNewOption({ categoryId: '', name: '', price: '' });
    };

    const handleDeleteOption = async (categoryId: string, optionName: string) => {
        const categoryToUpdate = categories.find(c => c.id === categoryId);
        if (!categoryToUpdate) return;

        const updatedCategory = {
            ...categoryToUpdate,
            options: categoryToUpdate.options.filter(opt => opt.name !== optionName)
        };

        await updateCategory(updatedCategory);
    };

    const handleUpdateSizePrice = async (categoryId: string, sizeName: string, newPrice: number) => {
        const categoryToUpdate = categories.find(c => c.id === categoryId);
        if (!categoryToUpdate || !categoryToUpdate.sizeOptions) return;

        const updatedSizeOptions = categoryToUpdate.sizeOptions.map(size =>
            size.name === sizeName ? { ...size, price: newPrice } : size
        );

        const updatedCategory = {
            ...categoryToUpdate,
            sizeOptions: updatedSizeOptions
        };

        await updateCategory(updatedCategory);
        setEditingSizePrice(null);
    };

    const handleUpdateOptionPrice = async (categoryId: string, optionName: string, newPrice: number) => {
        const categoryToUpdate = categories.find(c => c.id === categoryId);
        if (!categoryToUpdate) return;

        const updatedOptions = categoryToUpdate.options.map(option =>
            option.name === optionName ? { ...option, price: newPrice } : option
        );

        const updatedCategory = {
            ...categoryToUpdate,
            options: updatedOptions
        };

        await updateCategory(updatedCategory);
        setEditingOptionPrice(null);
    };

    return (
        <>
            <h2 style={styles.adminHeader}>Manage Categories</h2>
            
            <div style={styles.adminFormCard}>
                 <h3 style={styles.adminModalTitle}>Add New Category</h3>
                 <form onSubmit={handleAddCategory} style={{...styles.addOptionForm, marginBottom: '20px'}}>
                    <input 
                        style={{...styles.adminFormInput, flexGrow: 1}}
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name (e.g., 'Iced Teas')"
                    />
                    <button type="submit" style={styles.adminButtonPrimary}>+ Add Category</button>
                 </form>
            </div>

            <div style={{marginTop: '30px'}}>
                {categories.length === 0 && (
                    <p style={styles.adminContentPlaceholder}>No categories created yet. Add one above to get started.</p>
                )}
                {categories.map(category => (
                    <div key={category.id} style={styles.categoryCard}>
                        <div style={styles.categoryCardHeader}>
                            <h3 style={styles.categoryCardTitle}>{category.name}</h3>
                            <button onClick={() => handleDeleteCategory(category.id)} style={{...styles.adminButtonDanger, padding: '5px 10px'}}>Delete Category</button>
                        </div>
                        
                        {/* Cup Sizes Section (if category has sizes) */}
                        {category.hasSizes && category.sizeOptions && (
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{...styles.adminLabel, margin: '0 0 10px 0', color: '#2a9d8f'}}>☕ Cup Sizes</h4>
                                <div style={styles.optionsContainer}>
                                    {category.sizeOptions.map(size => {
                                        const isEditing = editingSizePrice?.categoryId === category.id &&
                                                         editingSizePrice?.sizeName === size.name;

                                        return (
                                            <div key={size.name} style={{...styles.optionChip, borderColor: '#2a9d8f', position: 'relative'}}>
                                                {size.name} ({size.volume})
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editingSizePrice.price}
                                                            onChange={(e) => setEditingSizePrice({
                                                                ...editingSizePrice,
                                                                price: e.target.value
                                                            })}
                                                            style={{
                                                                width: '60px',
                                                                padding: '2px 5px',
                                                                border: '1px solid #2a9d8f',
                                                                borderRadius: '4px',
                                                                fontSize: '12px'
                                                            }}
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateSizePrice(
                                                                category.id,
                                                                size.name,
                                                                parseFloat(editingSizePrice.price)
                                                            )}
                                                            style={{
                                                                padding: '2px 8px',
                                                                fontSize: '11px',
                                                                backgroundColor: '#2a9d8f',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingSizePrice(null)}
                                                            style={{
                                                                padding: '2px 8px',
                                                                fontSize: '11px',
                                                                backgroundColor: '#dc3545',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span
                                                            style={{
                                                                ...styles.optionChipPrice,
                                                                cursor: 'pointer',
                                                                textDecoration: 'underline dotted'
                                                            }}
                                                            onClick={() => setEditingSizePrice({
                                                                categoryId: category.id,
                                                                sizeName: size.name,
                                                                price: size.price.toString()
                                                            })}
                                                            title="Click to edit price"
                                                        >
                                                            {size.price === 0
                                                                ? 'Base'
                                                                : `+${formatCurrency(size.price, settings.currency)}`
                                                            }
                                                        </span>
                                                        <span
                                                            style={{
                                                                marginLeft: '5px',
                                                                cursor: 'pointer',
                                                                opacity: 0.5,
                                                                fontSize: '12px'
                                                            }}
                                                            onClick={() => setEditingSizePrice({
                                                                categoryId: category.id,
                                                                sizeName: size.name,
                                                                price: size.price.toString()
                                                            })}
                                                            title="Edit size price"
                                                        >
                                                            ✏️
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <p style={{color: '#2a9d8f', fontSize: '0.85em', marginTop: '8px', fontStyle: 'italic'}}>
                                    💡 Tip: Click on a price or the ✏️ icon to edit size pricing.
                                </p>
                            </div>
                        )}

                        <div>
                            <h4 style={{...styles.adminLabel, margin: '0 0 10px 0'}}>
                                {category.hasSizes ? 'Add-on Options' : 'Master Options'}
                            </h4>
                            {category.options.length > 0 ? (
                                <div style={styles.optionsContainer}>
                                {category.options.map(option => {
                                    const isEditing = editingOptionPrice?.categoryId === category.id &&
                                                     editingOptionPrice?.optionName === option.name;

                                    return (
                                        <div key={option.name} style={styles.optionChip}>
                                            {option.name}
                                            {isEditing ? (
                                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginLeft: '10px' }}>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editingOptionPrice.price}
                                                        onChange={(e) => setEditingOptionPrice({
                                                            ...editingOptionPrice,
                                                            price: e.target.value
                                                        })}
                                                        style={{
                                                            width: '60px',
                                                            padding: '2px 5px',
                                                            border: '1px solid #6c757d',
                                                            borderRadius: '4px',
                                                            fontSize: '12px'
                                                        }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateOptionPrice(
                                                            category.id,
                                                            option.name,
                                                            parseFloat(editingOptionPrice.price)
                                                        )}
                                                        style={{
                                                            padding: '2px 8px',
                                                            fontSize: '11px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingOptionPrice(null)}
                                                        style={{
                                                            padding: '2px 8px',
                                                            fontSize: '11px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span
                                                        style={{
                                                            ...styles.optionChipPrice,
                                                            cursor: 'pointer',
                                                            textDecoration: 'underline dotted'
                                                        }}
                                                        onClick={() => setEditingOptionPrice({
                                                            categoryId: category.id,
                                                            optionName: option.name,
                                                            price: option.price.toString()
                                                        })}
                                                        title="Click to edit price"
                                                    >
                                                        {formatCurrency(option.price, settings.currency)}
                                                    </span>
                                                    <span
                                                        style={{
                                                            marginLeft: '5px',
                                                            cursor: 'pointer',
                                                            opacity: 0.5,
                                                            fontSize: '12px'
                                                        }}
                                                        onClick={() => setEditingOptionPrice({
                                                            categoryId: category.id,
                                                            optionName: option.name,
                                                            price: option.price.toString()
                                                        })}
                                                        title="Edit option price"
                                                    >
                                                        ✏️
                                                    </span>
                                                    <span style={styles.optionChipActions} onClick={() => handleDeleteOption(category.id, option.name)}>&times;</span>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                                </div>
                            ) : (
                                <p style={{color: 'var(--light-text-color)', fontSize: '0.9em'}}>
                                    {category.hasSizes
                                        ? 'No add-on options defined for this category yet.'
                                        : 'No options defined for this category yet.'
                                    }
                                </p>
                            )}

                            {/* Tip text for editing add-on option prices */}
                            {category.options.length > 0 && (
                                <p style={{color: '#6c757d', fontSize: '0.85em', marginTop: '8px', fontStyle: 'italic'}}>
                                    💡 Tip: Click on a price or the ✏️ icon to edit option pricing.
                                </p>
                            )}
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleAddOption(category.id); }} style={styles.addOptionForm}>
                            <input
                                style={styles.adminFormInput}
                                type="text"
                                placeholder="Option Name"
                                value={newOption.categoryId === category.id ? newOption.name : ''}
                                onChange={e => setNewOption({ categoryId: category.id, name: e.target.value, price: newOption.price })}
                            />
                            <input
                                style={{...styles.adminFormInput, width: '100px'}}
                                type="number"
                                step="0.01"
                                placeholder="Price"
                                value={newOption.categoryId === category.id ? newOption.price : ''}
                                onChange={e => setNewOption({ categoryId: category.id, name: newOption.name, price: e.target.value })}
                            />
                            <button type="submit" style={styles.adminButtonSecondary}>Add Option</button>
                        </form>
                    </div>
                ))}
            </div>
        </>
    );
};