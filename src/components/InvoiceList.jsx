import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaPlus, FaFilter, FaFileExport, FaPrint, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

const InvoiceList = () => {
  const { companyId, branchId } = useParams();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 10;

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let url = `/api/companies/${companyId}/branches/${branchId}/invoices`;
        const params = new URLSearchParams();
        
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (dateRange.start) params.append('startDate', dateRange.start);
        if (dateRange.end) params.append('endDate', dateRange.end);
        
        if (params.toString()) url += `?${params.toString()}`;
        
        const { data } = await axios.get(url);
        setInvoices(data);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to load invoices. Please try again.');
        toast.error('Failed to load invoices: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [companyId, branchId, searchTerm, statusFilter, dateRange]);

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId) 
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedInvoices(invoices.map(inv => inv._id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedInvoices.length) return;
    
    if (!window.confirm('Are you sure you want to delete the selected invoices?')) {
      return;
    }

    try {
      await axios.post(`/api/companies/${companyId}/branches/${branchId}/invoices/bulk-delete`, {
        invoiceIds: selectedInvoices
      });
      
      setInvoices(prev => prev.filter(inv => !selectedInvoices.includes(inv._id)));
      setSelectedInvoices([]);
      toast.success('Selected invoices deleted successfully!');
    } catch (err) {
      console.error('Error deleting invoices:', err);
      setError('Failed to delete invoices. Please try again.');
      toast.error('Failed to delete invoices: ' + err.message);
    }
  };

  const handleExport = () => {
    // Implement export functionality (CSV, Excel, etc.)
    toast.info('Export functionality will be implemented soon');
    console.log('Exporting selected invoices:', selectedInvoices);
  };

  // Pagination logic
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = invoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(invoices.length / invoicesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-success';
      case 'partially_paid':
        return 'bg-warning';
      case 'pending':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button 
            className="btn btn-outline-danger btn-sm ms-3"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Total Invoices</h2>
        <Link 
          to={`/companies/${companyId}/branches/${branchId}/invoices/new`}
          className="btn btn-primary"
        >
          <FaPlus className="me-2" />
          Create Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by invoice number, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partially_paid">Partially Paid</option>
              </select>
            </div>
            <div className="col-md-3">
              <input
                type="date"
                className="form-control"
                placeholder="From Date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                placeholder="To Date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <div className="card mb-4 bg-light">
          <div className="card-body py-2">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="me-3">{selectedInvoices.length} selected</span>
                <button 
                  className="btn btn-sm btn-outline-danger me-2"
                  onClick={handleBulkDelete}
                >
                  <FaTrash className="me-1" />
                  Delete
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleExport}
                >
                  <FaFileExport className="me-1" />
                  Export
                </button>
              </div>
              <button 
                className="btn btn-sm btn-link text-danger"
                onClick={() => setSelectedInvoices([])}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Table */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-5">
              <div className="text-muted mb-3">
                <FaSearch size={48} />
              </div>
              <h5>No invoices found</h5>
              <p className="text-muted">
                {searchTerm || statusFilter !== 'all' || dateRange.start || dateRange.end 
                  ? 'Try adjusting your search criteria' 
                  : 'No invoices have been created yet'}
              </p>
              <Link 
                to={`/companies/${companyId}/branches/${branchId}/invoices/new`}
                className="btn btn-primary mt-3"
              >
                Create First Invoice
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th width="40">
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                        onChange={handleSelectAll}
                        disabled={invoices.length === 0}
                      />
                    </th>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th className="text-end">Amount</th>
                    <th>Status</th>
                    <th>Payment Method</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoices.map((invoice) => (
                    <tr key={invoice._id}>
                      <td>
                        <input 
                          type="checkbox" 
                          className="form-check-input"
                          checked={selectedInvoices.includes(invoice._id)}
                          onChange={() => handleSelectInvoice(invoice._id)}
                        />
                      </td>
                      <td>
                        <strong>{invoice.invoiceNumber}</strong>
                      </td>
                      <td>
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td>
                        {invoice.client?.name || 'N/A'}
                        {invoice.client?.isRegular && (
                          <span className="badge bg-success ms-2">Regular</span>
                        )}
                      </td>
                      <td className="text-end">
                        ₹{invoice.grandTotal?.toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(invoice.paymentStatus)}`}>
                          {invoice.paymentStatus?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {invoice.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/companies/${companyId}/branches/${branchId}/invoices/${invoice._id}`}
                            className="btn btn-outline-primary"
                            title="View"
                          >
                            <FaEye />
                          </Link>
                          <Link
                            to={`/companies/${companyId}/branches/${branchId}/invoices/${invoice._id}/edit`}
                            className="btn btn-outline-secondary"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <Link
                            to={`/companies/${companyId}/branches/${branchId}/invoices/${invoice._id}/print`}
                            className="btn btn-outline-dark"
                            title="Print"
                          >
                            <FaPrint />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="d-flex justify-content-center mt-4">
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                      <li 
                        key={number} 
                        className={`page-item ${currentPage === number ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link" 
                          onClick={() => paginate(number)}
                        >
                          {number}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6 className="card-title">Total Invoices</h6>
              <h3 className="mb-0">{invoices.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Paid Invoices</h6>
              <h3 className="mb-0">
                {invoices.filter(i => i.paymentStatus === 'paid').length}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <h6 className="card-title">Pending Invoices</h6>
              <h3 className="mb-0">
                {invoices.filter(i => i.paymentStatus === 'pending').length}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h6 className="card-title">Total Revenue</h6>
              <h3 className="mb-0">
                ₹{invoices.reduce((sum, inv) => sum + inv.grandTotal, 0).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;