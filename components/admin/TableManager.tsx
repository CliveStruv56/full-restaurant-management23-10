import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Table, AppSettings } from '../../types';
import { styles } from '../../styles';
import { useTenant } from '../../contexts/TenantContext';
import { addTable, updateTable, deleteTable, streamSettings } from '../../firebase/api-multitenant';
import { FloorPlanEditor } from './FloorPlanEditor';

interface TableManagerProps {
    tables: Table[];
}

export const TableManager: React.FC<TableManagerProps> = ({ tables }) => {
    const { tenant } = useTenant();
    const tenantId = tenant?.id;
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [currentView, setCurrentView] = useState<'list' | 'floorPlan'>('list');

    // Load settings to check if floor plan is enabled
    useEffect(() => {
        if (!tenantId) return;

        const unsubscribe = streamSettings(tenantId, (settingsData) => {
            setSettings(settingsData);

            // Load view preference from localStorage
            const savedView = localStorage.getItem('tableManagerView') as 'list' | 'floorPlan' | null;

            // If floor plan is enabled and user has floor plan preference (or no preference), show floor plan
            if (settingsData.floorPlanEnabled) {
                if (savedView === 'floorPlan' || savedView === null) {
                    setCurrentView('floorPlan');
                } else {
                    setCurrentView('list');
                }
            } else {
                // If floor plan disabled, force list view
                setCurrentView('list');
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [tenantId]);

    const handleAddClick = () => {
        setSelectedTable(null);
        setIsFormVisible(true);
    };

    const handleEditClick = (table: Table) => {
        setSelectedTable(table);
        setIsFormVisible(true);
    };

    const handleDelete = async (tableId: string) => {
        if (!tenantId) {
            toast.error('Unable to delete: Tenant not loaded');
            return;
        }
        if (window.confirm('Are you sure you want to delete this table?')) {
            const deleteToast = toast.loading('Deleting table...');
            try {
                await deleteTable(tenantId, tableId);
                toast.success('Table deleted successfully!', { id: deleteToast });
            } catch (error) {
                console.error("Error deleting table:", error);
                toast.error('Failed to delete table.', { id: deleteToast });
            }
        }
    };

    const handleSave = async (tableData: Table | Omit<Table, 'id'>) => {
        if (!tenantId) {
            toast.error('Unable to save: Tenant not loaded');
            throw new Error('Tenant not loaded');
        }
        try {
            if ('id' in tableData) {
                await updateTable(tenantId, tableData);
                toast.success('Table updated successfully!');
            } else {
                await addTable(tenantId, tableData);
                toast.success('Table added successfully!');
            }
        } catch (error) {
            console.error("Error saving table:", error);
            toast.error('Failed to save table.');
            throw error;
        } finally {
            setIsFormVisible(false);
            setSelectedTable(null);
        }
    };

    const handleViewToggle = (view: 'list' | 'floorPlan') => {
        setCurrentView(view);
        localStorage.setItem('tableManagerView', view);
    };

    const getStatusBadge = (status: Table['status']) => {
        const colors = {
            available: { bg: '#10b981', text: 'white' },
            occupied: { bg: '#ef4444', text: 'white' },
            reserved: { bg: '#f59e0b', text: 'white' }
        };
        const color = colors[status];
        return (
            <span style={{
                background: color.bg,
                color: color.text,
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase'
            }}>
                {status}
            </span>
        );
    };

    const sortedTables = [...tables].sort((a, b) => a.number - b.number);

    // Loading state while settings load
    if (!settings) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                Loading...
            </div>
        );
    }

    const floorPlanEnabled = settings.floorPlanEnabled || false;

    return (
        <>
            <div style={styles.adminSubHeader}>
                <h2 style={styles.adminHeader}>Manage Tables</h2>
                <button style={styles.adminButtonPrimary} onClick={handleAddClick}>+ Add Table</button>
            </div>

            {/* View Toggle Tabs */}
            {floorPlanEnabled && (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px',
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '0'
                }}>
                    <button
                        onClick={() => handleViewToggle('floorPlan')}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            borderBottom: currentView === 'floorPlan' ? '2px solid #2563eb' : '2px solid transparent',
                            backgroundColor: 'transparent',
                            color: currentView === 'floorPlan' ? '#2563eb' : '#6b7280',
                            fontWeight: currentView === 'floorPlan' ? 600 : 400,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Floor Plan View
                    </button>
                    <button
                        onClick={() => handleViewToggle('list')}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            borderBottom: currentView === 'list' ? '2px solid #2563eb' : '2px solid transparent',
                            backgroundColor: 'transparent',
                            color: currentView === 'list' ? '#2563eb' : '#6b7280',
                            fontWeight: currentView === 'list' ? 600 : 400,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        List View
                    </button>
                </div>
            )}

            {/* Render current view */}
            {currentView === 'floorPlan' && floorPlanEnabled ? (
                <FloorPlanEditor settings={settings} onEditTable={handleEditClick} />
            ) : (
                <div style={styles.adminTableContainer}>
                    {sortedTables.length > 0 ? (
                        <table style={styles.adminTable}>
                            <thead>
                                <tr>
                                    <th style={styles.adminTh}>Table #</th>
                                    <th style={styles.adminTh}>Capacity</th>
                                    <th style={styles.adminTh}>Shape</th>
                                    <th style={styles.adminTh}>Status</th>
                                    <th style={styles.adminTh}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTables.map(table => (
                                    <tr key={table.id}>
                                        <td style={styles.adminTd}>
                                            <strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>
                                                Table {table.number}
                                            </strong>
                                        </td>
                                        <td style={styles.adminTd}>
                                            {table.capacity} guests
                                        </td>
                                        <td style={styles.adminTd}>
                                            <span style={{ textTransform: 'capitalize' }}>
                                                {table.shape}
                                            </span>
                                        </td>
                                        <td style={styles.adminTd}>
                                            {getStatusBadge(table.status)}
                                        </td>
                                        <td style={styles.adminTd}>
                                            <div style={styles.adminActionsCell}>
                                                <button style={styles.adminButtonSecondary} onClick={() => handleEditClick(table)}>Edit</button>
                                                <button style={styles.adminButtonDanger} onClick={() => handleDelete(table.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--light-text-color)'}}>
                            No tables found. Add one to get started.
                        </div>
                    )}
                </div>
            )}

            {isFormVisible && (
                <TableForm
                    table={selectedTable}
                    onSave={handleSave}
                    onClose={() => setIsFormVisible(false)}
                    allTables={tables}
                />
            )}
        </>
    );
};

interface TableFormProps {
    table: Table | null;
    onSave: (tableData: Table | Omit<Table, 'id'>) => Promise<void>;
    onClose: () => void;
    allTables: Table[]; // For validation (duplicate number check)
}

export const TableForm: React.FC<TableFormProps> = ({ table, onSave, onClose, allTables }) => {
    const [formData, setFormData] = useState<Omit<Table, 'id'>>(() => {
        if (table) {
            const { id, ...rest } = table;
            return rest;
        }
        return {
            number: 1,
            capacity: 2,
            shape: 'square',
            position: { x: 0, y: 0 },
            mergeable: [],
            status: 'available',
            description: ''
        };
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (name === 'positionX' || name === 'positionY') {
            setFormData(prev => ({
                ...prev,
                position: {
                    ...prev.position,
                    [name === 'positionX' ? 'x' : 'y']: parseInt(value) || 0
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'number' ? parseInt(value) : value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate: Check for duplicate table numbers
        const isDuplicate = allTables.some(t => {
            // Exclude the current table being edited
            if (table && t.id === table.id) return false;
            return t.number === formData.number;
        });

        if (isDuplicate) {
            toast.error(`Table number ${formData.number} already exists. Please choose a different number.`, {
                duration: 4000,
                icon: '⚠️'
            });
            return;
        }

        setIsSaving(true);

        try {
            if (table) {
                await onSave({ id: table.id, ...formData });
            } else {
                await onSave(formData);
            }
        } catch (error) {
            // Error already handled in parent
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={styles.adminModalOverlay}>
            <div style={styles.adminModalContent}>
                <header style={styles.adminModalHeader}>
                    <h3 style={styles.adminModalTitle}>
                        {table ? 'Edit Table' : 'Add New Table'}
                    </h3>
                    <button style={styles.closeButton} onClick={onClose} disabled={isSaving}>&times;</button>
                </header>
                <form onSubmit={handleSubmit} style={styles.adminForm}>
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="number">Table Number</label>
                        <input
                            style={styles.adminFormInput}
                            type="number"
                            name="number"
                            id="number"
                            value={formData.number}
                            onChange={handleChange}
                            required
                            min="1"
                            disabled={isSaving}
                        />
                    </div>
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="capacity">Capacity (guests)</label>
                        <input
                            style={styles.adminFormInput}
                            type="number"
                            name="capacity"
                            id="capacity"
                            value={formData.capacity}
                            onChange={handleChange}
                            required
                            min="1"
                            max="20"
                            disabled={isSaving}
                        />
                    </div>
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="shape">Table Shape</label>
                        <select
                            style={styles.adminFormInput}
                            name="shape"
                            id="shape"
                            value={formData.shape}
                            onChange={handleChange}
                            required
                            disabled={isSaving}
                        >
                            <option value="square">Square</option>
                            <option value="rectangle">Rectangle</option>
                            <option value="circle">Circle</option>
                        </select>
                    </div>
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="status">Status</label>
                        <select
                            style={styles.adminFormInput}
                            name="status"
                            id="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                            disabled={isSaving}
                        >
                            <option value="available">Available</option>
                            <option value="occupied">Occupied</option>
                            <option value="reserved">Reserved</option>
                        </select>
                    </div>

                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="description">Description (optional)</label>
                        <input
                            style={styles.adminFormInput}
                            type="text"
                            name="description"
                            id="description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            placeholder="e.g., by the window, sea view, corner table"
                            disabled={isSaving}
                            maxLength={100}
                        />
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                            Add a description to help identify this table's location or features
                        </p>
                    </div>

                    <div style={{
                        marginTop: '20px',
                        padding: '16px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                            Floor Plan Position
                        </h4>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{...styles.adminLabel, fontSize: '13px'}} htmlFor="positionX">X Coordinate</label>
                                <input
                                    style={styles.adminFormInput}
                                    type="number"
                                    name="positionX"
                                    id="positionX"
                                    value={formData.position.x}
                                    onChange={handleChange}
                                    disabled={isSaving}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{...styles.adminLabel, fontSize: '13px'}} htmlFor="positionY">Y Coordinate</label>
                                <input
                                    style={styles.adminFormInput}
                                    type="number"
                                    name="positionY"
                                    id="positionY"
                                    value={formData.position.y}
                                    onChange={handleChange}
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', marginBottom: 0 }}>
                            Set position for floor plan layout. You can also drag tables directly in Floor Plan View.
                        </p>
                    </div>

                    <div style={styles.adminFormActions}>
                        <button type="button" style={styles.adminButtonSecondary} onClick={onClose} disabled={isSaving}>
                            Cancel
                        </button>
                        <button type="submit" style={styles.adminButtonPrimary} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Table'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
