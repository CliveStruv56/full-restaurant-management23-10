import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Reservation, Table } from '../../types';
import { streamReservations, updateReservationStatus, streamTables, assignTableToReservation, checkTableAvailability } from '../../firebase/api-multitenant';
import { useTenant } from '../../contexts/TenantContext';
import { styles } from '../../styles';

export const ReservationManager: React.FC = () => {
    const { tenant } = useTenant();
    const tenantId = tenant?.id;

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
    const [dateFilter, setDateFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [adminNotes, setAdminNotes] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // New state for table assignment
    const [tables, setTables] = useState<Table[]>([]);
    const [availableTables, setAvailableTables] = useState<Map<string, Table[]>>(new Map());
    const [loadingTables, setLoadingTables] = useState<string | null>(null);
    const [assigningTable, setAssigningTable] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState<string | null>(null);

    // Stream reservations from Firestore
    useEffect(() => {
        if (!tenantId) return;

        const filters: { date?: string; status?: string } = {};
        if (dateFilter) filters.date = dateFilter;
        if (statusFilter !== 'all') filters.status = statusFilter;

        const unsubscribe = streamReservations(tenantId, filters, (data) => {
            setReservations(data);
            setFilteredReservations(data);
        });

        return () => unsubscribe();
    }, [tenantId, dateFilter, statusFilter]);

    // Stream tables from Firestore
    useEffect(() => {
        if (!tenantId) return;

        const unsubscribe = streamTables(tenantId, (data) => {
            setTables(data);
        });

        return () => unsubscribe();
    }, [tenantId]);

    // Clear filters
    const handleClearFilters = () => {
        setDateFilter('');
        setStatusFilter('all');
    };

    // View reservation details
    const handleViewDetails = (reservation: Reservation) => {
        setSelectedReservation(reservation);
        setAdminNotes(reservation.adminNotes || '');
        setShowDetailsModal(true);
    };

    // Update reservation status
    const handleStatusUpdate = async (reservationId: string, status: Reservation['status']) => {
        if (!tenantId) return;

        try {
            setIsUpdating(reservationId);
            await updateReservationStatus(tenantId, reservationId, status);
            toast.success(`Reservation ${status}`);
        } catch (error) {
            console.error('Error updating reservation status:', error);
            toast.error('Failed to update reservation');
        } finally {
            setIsUpdating(null);
        }
    };

    // Save admin notes
    const handleSaveNotes = async () => {
        if (!tenantId || !selectedReservation) return;

        try {
            await updateReservationStatus(
                tenantId,
                selectedReservation.id,
                selectedReservation.status,
                adminNotes
            );
            toast.success('Notes saved');
            setShowDetailsModal(false);
        } catch (error) {
            console.error('Error saving admin notes:', error);
            toast.error('Failed to save notes');
        }
    };

    // Fetch available tables for a reservation
    const handleDropdownOpen = async (reservation: Reservation) => {
        if (!tenantId) return;

        // Check if already loaded
        if (availableTables.has(reservation.id)) {
            setShowDropdown(reservation.id);
            return;
        }

        setLoadingTables(reservation.id);
        setShowDropdown(reservation.id);

        try {
            // Filter tables by capacity
            const suitableTables = tables.filter(table => table.capacity >= reservation.partySize);

            // Check availability for each table
            const availableTablesList: Table[] = [];
            for (const table of suitableTables) {
                const isAvailable = await checkTableAvailability(
                    tenantId,
                    table.id,
                    reservation.date,
                    reservation.time,
                    reservation.duration || 90,
                    reservation.id // Exclude current reservation from conflict check
                );

                if (isAvailable) {
                    availableTablesList.push(table);
                }
            }

            // Sort by table number
            availableTablesList.sort((a, b) => a.number - b.number);

            // Cache results
            setAvailableTables(prev => new Map(prev).set(reservation.id, availableTablesList));
        } catch (error) {
            console.error('Error loading available tables:', error);
            toast.error('Failed to load available tables');
        } finally {
            setLoadingTables(null);
        }
    };

    // Handle table assignment
    const handleAssignTable = async (reservationId: string, tableId: string, tableNumber: number) => {
        if (!tenantId) return;

        setAssigningTable(reservationId);

        try {
            await assignTableToReservation(tenantId, reservationId, tableId);
            toast.success(`Table ${tableNumber} assigned to reservation`);
            setShowDropdown(null);
            // Clear cache so it reloads next time
            setAvailableTables(prev => {
                const newMap = new Map(prev);
                newMap.delete(reservationId);
                return newMap;
            });
        } catch (error: any) {
            console.error('Error assigning table:', error);
            const errorMessage = error?.message || 'Failed to assign table';
            toast.error(errorMessage);
        } finally {
            setAssigningTable(null);
        }
    };

    // Get status badge style
    const getStatusBadgeStyle = (status: Reservation['status']): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            padding: '6px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            color: 'white',
            display: 'inline-block',
        };

        const colors: { [key in Reservation['status']]: string } = {
            pending: '#ffc107',
            confirmed: '#28a745',
            seated: '#007bff',
            completed: '#6c757d',
            cancelled: '#dc3545',
            'no-show': '#bd2130',
        };

        return {
            ...baseStyle,
            backgroundColor: colors[status] || '#6c757d',
        };
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Format time for display
    const formatTime = (timeString: string): string => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.assign-table-dropdown')) {
                setShowDropdown(null);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2 style={titleStyle}>Reservation Management</h2>
                <p style={subtitleStyle}>
                    Showing {filteredReservations.length} reservation{filteredReservations.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Filters */}
            <div style={filtersContainerStyle}>
                <div style={filterGroupStyle}>
                    <label style={filterLabelStyle}>Date:</label>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={filterInputStyle}
                    />
                </div>

                <div style={filterGroupStyle}>
                    <label style={filterLabelStyle}>Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={filterInputStyle}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="seated">Seated</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no-show">No-Show</option>
                    </select>
                </div>

                {(dateFilter || statusFilter !== 'all') && (
                    <button onClick={handleClearFilters} style={clearButtonStyle}>
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Reservations Table */}
            <div style={tableContainerStyle}>
                {filteredReservations.length === 0 ? (
                    <div style={emptyStateStyle}>
                        <p>No reservations found</p>
                        {(dateFilter || statusFilter !== 'all') && (
                            <p style={{ fontSize: '14px', color: '#636e72', marginTop: '8px' }}>
                                Try adjusting your filters
                            </p>
                        )}
                    </div>
                ) : (
                    <table style={tableStyle}>
                        <thead>
                            <tr style={tableHeaderRowStyle}>
                                <th style={tableHeaderStyle}>Date</th>
                                <th style={tableHeaderStyle}>Time</th>
                                <th style={tableHeaderStyle}>Party</th>
                                <th style={tableHeaderStyle}>Name</th>
                                <th style={tableHeaderStyle}>Phone</th>
                                <th style={tableHeaderStyle}>Assigned Table</th>
                                <th style={tableHeaderStyle}>Status</th>
                                <th style={tableHeaderStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReservations.map((reservation) => (
                                <tr key={reservation.id} style={tableRowStyle}>
                                    <td style={tableCellStyle}>{formatDate(reservation.date)}</td>
                                    <td style={tableCellStyle}>{formatTime(reservation.time)}</td>
                                    <td style={tableCellStyle}>{reservation.partySize}</td>
                                    <td style={tableCellStyle}>{reservation.contactName}</td>
                                    <td style={tableCellStyle}>{reservation.contactPhone}</td>
                                    <td style={tableCellStyle}>
                                        {reservation.assignedTableNumber ? (
                                            <span style={{ fontWeight: '600', color: '#2d3436' }}>
                                                Table {reservation.assignedTableNumber}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#6c757d', fontStyle: 'italic' }}>
                                                Unassigned
                                            </span>
                                        )}
                                    </td>
                                    <td style={tableCellStyle}>
                                        <span style={getStatusBadgeStyle(reservation.status)}>
                                            {reservation.status}
                                        </span>
                                    </td>
                                    <td style={tableCellStyle}>
                                        <div style={actionsContainerStyle}>
                                            <button
                                                onClick={() => handleViewDetails(reservation)}
                                                style={actionButtonStyle}
                                                title="View Details"
                                            >
                                                👁️
                                            </button>

                                            {/* Assign Table Dropdown - Show for pending/confirmed reservations without assigned table */}
                                            {['pending', 'confirmed'].includes(reservation.status) && !reservation.assignedTableId && (
                                                <div className="assign-table-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
                                                    <button
                                                        onClick={() => handleDropdownOpen(reservation)}
                                                        style={{
                                                            ...actionButtonStyle,
                                                            backgroundColor: '#3498db',
                                                            color: 'white',
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            fontSize: '14px',
                                                        }}
                                                        disabled={assigningTable === reservation.id}
                                                        title="Assign Table"
                                                    >
                                                        {assigningTable === reservation.id ? '⏳' : '🪑 Assign'}
                                                    </button>

                                                    {showDropdown === reservation.id && (
                                                        <div style={dropdownMenuStyle}>
                                                            {loadingTables === reservation.id ? (
                                                                <div style={dropdownItemStyle}>
                                                                    Loading tables...
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {availableTables.get(reservation.id)?.length === 0 ? (
                                                                        <div style={{ ...dropdownItemStyle, color: '#6c757d', cursor: 'not-allowed' }}>
                                                                            No tables available
                                                                        </div>
                                                                    ) : (
                                                                        availableTables.get(reservation.id)?.map((table) => (
                                                                            <button
                                                                                key={table.id}
                                                                                onClick={() => handleAssignTable(reservation.id, table.id, table.number)}
                                                                                style={dropdownItemButtonStyle}
                                                                                disabled={assigningTable === reservation.id}
                                                                            >
                                                                                Table {table.number} (Capacity: {table.capacity})
                                                                            </button>
                                                                        ))
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {reservation.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(reservation.id, 'confirmed')}
                                                    style={actionButtonStyle}
                                                    disabled={isUpdating === reservation.id}
                                                    title="Confirm"
                                                >
                                                    {isUpdating === reservation.id ? '⏳' : '✅'}
                                                </button>
                                            )}

                                            {reservation.status === 'confirmed' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(reservation.id, 'seated')}
                                                    style={actionButtonStyle}
                                                    disabled={isUpdating === reservation.id}
                                                    title="Mark Seated"
                                                >
                                                    {isUpdating === reservation.id ? '⏳' : '🪑'}
                                                </button>
                                            )}

                                            {reservation.status === 'seated' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(reservation.id, 'completed')}
                                                    style={actionButtonStyle}
                                                    disabled={isUpdating === reservation.id}
                                                    title="Mark Completed"
                                                >
                                                    {isUpdating === reservation.id ? '⏳' : '✔️'}
                                                </button>
                                            )}

                                            {['pending', 'confirmed'].includes(reservation.status) && (
                                                <button
                                                    onClick={() => handleStatusUpdate(reservation.id, 'cancelled')}
                                                    style={actionButtonStyle}
                                                    disabled={isUpdating === reservation.id}
                                                    title="Cancel"
                                                >
                                                    {isUpdating === reservation.id ? '⏳' : '❌'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedReservation && (
                <div style={modalOverlayStyle} onClick={() => setShowDetailsModal(false)}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={modalHeaderStyle}>
                            <h3 style={{ margin: 0 }}>Reservation Details</h3>
                            <button onClick={() => setShowDetailsModal(false)} style={closeButtonStyle}>
                                ✕
                            </button>
                        </div>

                        <div style={modalBodyStyle}>
                            <div style={detailSectionStyle}>
                                <h4 style={sectionTitleStyle}>Booking Information</h4>
                                <div style={detailRowStyle}>
                                    <span style={detailLabelStyle}>Date:</span>
                                    <span>{formatDate(selectedReservation.date)}</span>
                                </div>
                                <div style={detailRowStyle}>
                                    <span style={detailLabelStyle}>Time:</span>
                                    <span>{formatTime(selectedReservation.time)}</span>
                                </div>
                                <div style={detailRowStyle}>
                                    <span style={detailLabelStyle}>Party Size:</span>
                                    <span>{selectedReservation.partySize} guests</span>
                                </div>
                                <div style={detailRowStyle}>
                                    <span style={detailLabelStyle}>Status:</span>
                                    <span style={getStatusBadgeStyle(selectedReservation.status)}>
                                        {selectedReservation.status}
                                    </span>
                                </div>
                                {selectedReservation.assignedTableNumber && (
                                    <div style={detailRowStyle}>
                                        <span style={detailLabelStyle}>Assigned Table:</span>
                                        <span style={{ fontWeight: '600' }}>
                                            Table {selectedReservation.assignedTableNumber}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div style={detailSectionStyle}>
                                <h4 style={sectionTitleStyle}>Contact Information</h4>
                                <div style={detailRowStyle}>
                                    <span style={detailLabelStyle}>Name:</span>
                                    <span>{selectedReservation.contactName}</span>
                                </div>
                                <div style={detailRowStyle}>
                                    <span style={detailLabelStyle}>Phone:</span>
                                    <span>{selectedReservation.contactPhone}</span>
                                </div>
                                <div style={detailRowStyle}>
                                    <span style={detailLabelStyle}>Email:</span>
                                    <span>{selectedReservation.contactEmail}</span>
                                </div>
                            </div>

                            {(selectedReservation.tablePreference || selectedReservation.specialRequests) && (
                                <div style={detailSectionStyle}>
                                    <h4 style={sectionTitleStyle}>Preferences</h4>
                                    {selectedReservation.tablePreference && (
                                        <div style={detailRowStyle}>
                                            <span style={detailLabelStyle}>Table Preference:</span>
                                            <span>Table {selectedReservation.tablePreference}</span>
                                        </div>
                                    )}
                                    {selectedReservation.specialRequests && (
                                        <div style={{ marginTop: '12px' }}>
                                            <div style={detailLabelStyle}>Special Requests:</div>
                                            <div style={specialRequestsBoxStyle}>
                                                {selectedReservation.specialRequests}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={detailSectionStyle}>
                                <h4 style={sectionTitleStyle}>Admin Notes</h4>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add internal notes about this reservation..."
                                    style={textareaStyle}
                                    rows={4}
                                />
                            </div>

                            <div style={detailSectionStyle}>
                                <h4 style={sectionTitleStyle}>Timestamps</h4>
                                <div style={detailRowStyle}>
                                    <span style={detailLabelStyle}>Created:</span>
                                    <span>{new Date(selectedReservation.createdAt).toLocaleString()}</span>
                                </div>
                                <div style={detailRowStyle}>
                                    <span style={detailLabelStyle}>Last Updated:</span>
                                    <span>{new Date(selectedReservation.updatedAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div style={modalFooterStyle}>
                            <button onClick={() => setShowDetailsModal(false)} style={cancelButtonStyle}>
                                Close
                            </button>
                            <button onClick={handleSaveNotes} style={saveButtonStyle}>
                                Save Notes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const containerStyle: React.CSSProperties = {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
    marginBottom: '24px',
};

const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#636e72',
};

const filtersContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
};

const filterGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
};

const filterLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3436',
};

const filterInputStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #dfe6e9',
    fontSize: '14px',
    minWidth: '180px',
};

const clearButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
};

const tableContainerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflowX: 'auto',
};

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
};

const tableHeaderRowStyle: React.CSSProperties = {
    backgroundColor: '#f8f9fa',
};

const tableHeaderStyle: React.CSSProperties = {
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3436',
    borderBottom: '2px solid #dfe6e9',
};

const tableRowStyle: React.CSSProperties = {
    borderBottom: '1px solid #f1f3f5',
};

const tableCellStyle: React.CSSProperties = {
    padding: '16px',
    fontSize: '14px',
    color: '#2d3436',
};

const actionsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
};

const actionButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '4px',
    transition: 'transform 0.2s ease',
};

const dropdownMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: '0',
    marginTop: '4px',
    backgroundColor: 'white',
    border: '1px solid #dfe6e9',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    minWidth: '200px',
    zIndex: 1000,
    maxHeight: '300px',
    overflowY: 'auto',
};

const dropdownItemStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#2d3436',
};

const dropdownItemButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#2d3436',
    backgroundColor: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
};

const emptyStateStyle: React.CSSProperties = {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#636e72',
    fontSize: '16px',
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
};

const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
};

const modalHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #e9ecef',
};

const closeButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#636e72',
};

const modalBodyStyle: React.CSSProperties = {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
};

const detailSectionStyle: React.CSSProperties = {
    marginBottom: '24px',
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: '12px',
};

const detailRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f1f3f5',
};

const detailLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#636e72',
};

const specialRequestsBoxStyle: React.CSSProperties = {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#2d3436',
};

const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #dfe6e9',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
};

const modalFooterStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '24px',
    borderTop: '1px solid #e9ecef',
};

const cancelButtonStyle: React.CSSProperties = {
    padding: '12px 24px',
    backgroundColor: 'white',
    color: '#636e72',
    border: '1px solid #dfe6e9',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
};

const saveButtonStyle: React.CSSProperties = {
    padding: '12px 24px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
};
