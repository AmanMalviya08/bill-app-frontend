  // Fetch invoices with improved filtering and error handling
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const ClientInvoiceList = () => {
  const { companyId, clientId, branchId } = useParams(); // Make sure route has branchId if used
  const [invoices, setInvoices] = useState([]);
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const url = `/api/companies/${companyId}/branches/${branchId}/invoices`;

        const { data } = await axios.get(url);
        setInvoices(data);

      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to load invoices. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices(); // <-- ✅ call the function
  }, [companyId, branchId]);

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

  // ... rest of your JSX unchanged ...


  return (
    <div className="container-fluid py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/companies">Companies</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/companies/${companyId}/clients`}>Clients</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {client?.name || 'Client'} Invoices
          </li>
        </ol>
      </nav>

      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h2 className="h4 mb-0">
            Invoices for {client?.name || 'Client'}
            {client?.isRegular && (
              <span className="badge bg-success ms-2">
                Regular ({client.discountPercentage}% discount)
              </span>
            )}
          </h2>
          <div>
            <Link 
              to={`/companies/${companyId}/clients/${clientId}`}
              className="btn btn-light me-2"
            >
              <i className="bi bi-person me-1"></i>
              Client Details
            </Link>
            <Link 
              to={`/companies/${companyId}/clients`}
              className="btn btn-light"
            >
              <i className="bi bi-arrow-left me-1"></i>
              Back to Clients
            </Link>
          </div>
        </div>
        
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-receipt display-4 text-muted mb-3"></i>
              <p className="text-muted">No invoices found for this client</p>
              <p className="text-muted">
                Invoices are created when orders are placed through the branch system.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="card bg-info text-white">
                    <div className="card-body text-center">
                      <h4>{invoices.length}</h4>
                      <p className="mb-0">Total Invoices</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-success text-white">
                    <div className="card-body text-center">
                      <h4>{invoices.filter(inv => inv.paymentStatus === 'paid').length}</h4>
                      <p className="mb-0">Paid</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-warning text-white">
                    <div className="card-body text-center">
                      <h4>{invoices.filter(inv => inv.paymentStatus === 'pending').length}</h4>
                      <p className="mb-0">Pending</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-primary text-white">
                    <div className="card-body text-center">
                      <h4>₹{invoices.reduce((sum, inv) => sum + inv.grandTotal, 0).toFixed(2)}</h4>
                      <p className="mb-0">Total Amount</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Branch</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Payment Status</th>
                      <th>Payment Method</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id}>
                        <td>
                          <strong>{invoice.invoiceNumber}</strong>
                        </td>
                        <td>{new Date(invoice.date).toLocaleDateString()}</td>
                        <td>
                          <span className="badge bg-secondary">
                            {invoice.branch?.name || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {invoice.items?.length || 0} items
                          </span>
                        </td>
                        <td>
                          <strong>₹{invoice.grandTotal.toFixed(2)}</strong>
                          <div className="small text-muted">
                            Subtotal: ₹{invoice.subtotal.toFixed(2)}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            invoice.paymentStatus === 'paid' ? 'bg-success' : 
                            invoice.paymentStatus === 'partially_paid' ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {invoice.paymentStatus.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className="text-capitalize">
                            {invoice.paymentMethod?.replace('_', ' ') || 'Not specified'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link
                              to={`/companies/${companyId}/branches/${invoice.branch?._id}/invoices/${invoice._id}`}
                              className="btn btn-outline-primary"
                              title="View Invoice Details"
                            >
                              <i className="bi bi-eye"></i>
                            </Link>
                            <Link
                              to={`/companies/${companyId}/branches/${invoice.branch?._id}/invoices/${invoice._id}/print`}
                              className="btn btn-outline-secondary"
                              title="Print Invoice"
                            >
                              <i className="bi bi-printer"></i>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientInvoiceList;