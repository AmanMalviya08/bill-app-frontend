import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  FaPrint, FaDownload, FaArrowLeft, FaEdit, FaTrash, 
  FaUser, FaReceipt, FaCheck, FaTimes, FaClock 
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const InvoiceDetail = () => {
  const { companyId, branchId, invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Updated URL structure to match your routes
        const { data } = await axios.get(
          `/api/companies/${companyId}/branches/${branchId}/invoices/${invoiceId}`,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            withCredentials: true // Include if using cookies/sessions
          }
        );
        
        if (!data) {
          throw new Error('Invoice not found');
        }
        
        setInvoice(data);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError(err.response?.data?.message || 'Failed to load invoice details. Please try again.');
        toast.error('Failed to load invoice details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [companyId, branchId, invoiceId]);

  // Add error boundary for API calls
  const apiCallWithErrorHandling = async (apiCall) => {
    try {
      return await apiCall();
    } catch (err) {
      console.error('API Error:', err);
      toast.error(err.response?.data?.message || 'An error occurred');
      throw err;
    }
  };

  const updatePaymentStatus = async (status) => {
    try {
      setIsUpdating(true);
      const { data } = await apiCallWithErrorHandling(() => 
        axios.put(
          `/api/companies/${companyId}/branches/${branchId}/invoices/${invoiceId}`,
          { paymentStatus: status },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      );
      setInvoice(data);
      toast.success(`Invoice marked as ${status.replace('_', ' ')}`);
    } catch (err) {
      console.error('Error updating invoice:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePaymentMethod = async (method) => {
    try {
      setIsUpdating(true);
      const { data } = await apiCallWithErrorHandling(() =>
        axios.put(
          `/api/companies/${companyId}/branches/${branchId}/invoices/${invoiceId}`,
          { paymentMethod: method },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      );
      setInvoice(data);
      toast.success(`Payment method updated to ${method.replace('_', ' ')}`);
    } catch (err) {
      console.error('Error updating payment method:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const printInvoice = () => {
    window.open(
      `/api/companies/${companyId}/branches/${branchId}/invoices/${invoiceId}/print`,
      '_blank'
    );
  };

  const downloadInvoice = async (format = 'pdf') => {
    try {
      setIsDownloading(true);
      
      const response = await apiCallWithErrorHandling(() =>
        axios.get(
          `/api/companies/${companyId}/branches/${branchId}/invoices/${invoiceId}/download`,
          {
            params: { format },
            responseType: 'blob'
          }
        )
      );

      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoiceNumber}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Invoice downloaded as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      if (format === 'pdf') {
        await generatePDFClientSide();
      } else {
        downloadAsJSON();
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Client-side PDF generation fallback
  const generatePDFClientSide = async () => {
    try {
      // Dynamically import jsPDF to avoid bundle size issues
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text(invoice.company?.name || 'Company Name', 20, 30);
      doc.setFontSize(12);
      doc.text(`GST: ${invoice.company?.gstNumber || 'N/A'}`, 20, 40);
      doc.text(`Location: ${invoice.branch?.location || 'N/A'}`, 20, 50);

      // Invoice details
      doc.setFontSize(16);
      doc.text('INVOICE', 150, 30);
      doc.setFontSize(12);
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 40);
      doc.text(`Date: ${format(new Date(invoice.date), 'MMM d, yyyy')}`, 150, 50);
      
      if (invoice.dueDate) {
        doc.text(`Due Date: ${format(new Date(invoice.dueDate), 'MMM d, yyyy')}`, 150, 60);
      }

      // Client details
      doc.setFontSize(14);
      doc.text('Bill To:', 20, 80);
      doc.setFontSize(12);
      doc.text(invoice.client?.name || 'N/A', 20, 90);
      if (invoice.client?.phone) doc.text(`Phone: ${invoice.client.phone}`, 20, 100);
      if (invoice.client?.email) doc.text(`Email: ${invoice.client.email}`, 20, 110);
      if (invoice.client?.address) doc.text(`Address: ${invoice.client.address}`, 20, 120);

      // Items table header
      let yPosition = 140;
      doc.setFontSize(12);
      doc.text('Item', 20, yPosition);
      doc.text('Qty', 100, yPosition);
      doc.text('Rate', 130, yPosition);
      doc.text('Amount', 160, yPosition);
      
      // Draw line under header
      doc.line(20, yPosition + 5, 190, yPosition + 5);
      yPosition += 15;

      // Items
      invoice.items?.forEach((item) => {
        doc.text(item.name, 20, yPosition);
        doc.text(item.quantity.toString(), 100, yPosition);
        doc.text(`₹${item.price.toFixed(2)}`, 130, yPosition);
        doc.text(`₹${((item.price * item.quantity) - item.discount + item.gst).toFixed(2)}`, 160, yPosition);
        yPosition += 10;
      });

      // Totals
      yPosition += 20;
      doc.line(120, yPosition, 190, yPosition);
      yPosition += 10;
      doc.text(`Subtotal: ₹${invoice.subtotal.toFixed(2)}`, 120, yPosition);
      yPosition += 10;
      doc.text(`Discount: ₹${invoice.totalDiscount.toFixed(2)}`, 120, yPosition);
      yPosition += 10;
      doc.text(`GST: ₹${invoice.totalGst.toFixed(2)}`, 120, yPosition);
      yPosition += 10;
      doc.setFontSize(14);
      doc.text(`Total: ₹${invoice.grandTotal.toFixed(2)}`, 120, yPosition);

      // Save the PDF
      doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
      toast.success('Invoice PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  // Download as JSON fallback
  const downloadAsJSON = () => {
    const dataStr = JSON.stringify(invoice, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoice.invoiceNumber}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Invoice data downloaded as JSON');
  };

  // Download with format selection
  // const handleDownloadClick = () => {
  //   const format = window.confirm('Click OK for PDF, Cancel for JSON') ? 'pdf' : 'json';
  //   downloadInvoice(format);
  // };

  const deleteInvoice = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(
        `/api/companies/${companyId}/branches/${branchId}/invoices/${invoiceId}`
      );
      toast.success('Invoice deleted successfully');
      navigate(`/companies/${companyId}/branches/${branchId}/invoices`);
    } catch (err) {
      console.error('Error deleting invoice:', err);
      toast.error('Failed to delete invoice');
    }
  };


 if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <div className="mt-2">
            <button 
              className="btn btn-outline-danger btn-sm me-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
            <Link
              to={`/companies/${companyId}/branches/${branchId}/invoices`}
              className="btn btn-outline-secondary btn-sm"
            >
              Back to Invoices
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

  if (isLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Invoice not found
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return { class: 'bg-success', icon: <FaCheck /> };
      case 'partially_paid':
        return { class: 'bg-warning', icon: <FaClock /> };
      case 'pending':
        return { class: 'bg-danger', icon: <FaTimes /> };
      default:
        return { class: 'bg-secondary', icon: null };
    }
  };

  const statusBadge = getStatusBadge(invoice.paymentStatus);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button 
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="me-1" />
            Back
          </button>
          <h2 className="d-inline-block mb-0">Invoice {invoice.invoiceNumber}</h2>
        </div>
        <div>
          <button 
            className="btn btn-outline-primary me-2"
            onClick={printInvoice}
          >
            <FaPrint className="me-1" />
            Print
          </button>
          
          {/* Enhanced Download Button with Dropdown */}
          <div className="btn-group me-2">
            <button 
              className="btn btn-success"
              onClick={() => downloadInvoice('pdf')}
              disabled={isDownloading}
            >
              <FaDownload className="me-1" />
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </button>
            <button 
              className="btn btn-success dropdown-toggle dropdown-toggle-split"
              data-bs-toggle="dropdown"
              disabled={isDownloading}
            >
              <span className="visually-hidden">Toggle Dropdown</span>
            </button>
            <ul className="dropdown-menu">
              <li>
                <button 
                  className="dropdown-item"
                  onClick={() => downloadInvoice('pdf')}
                  disabled={isDownloading}
                >
                  <FaDownload className="me-2" />
                  Download as PDF
                </button>
              </li>
              <li>
                <button 
                  className="dropdown-item"
                  onClick={() => downloadInvoice('json')}
                  disabled={isDownloading}
                >
                  <FaDownload className="me-2" />
                  Download as JSON
                </button>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button 
                  className="dropdown-item"
                  onClick={generatePDFClientSide}
                  disabled={isDownloading}
                >
                  <FaDownload className="me-2" />
                  Generate PDF (Offline)
                </button>
              </li>
            </ul>
          </div>

          <Link
            to={`/companies/${companyId}/branches/${branchId}/invoices/${invoiceId}/edit`}
            className="btn btn-primary me-2"
          >
            <FaEdit className="me-1" />
            Edit
          </Link>
          <button 
            className="btn btn-outline-danger"
            onClick={deleteInvoice}
          >
            <FaTrash className="me-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Loading overlay for download */}
      {isDownloading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="bg-white p-4 rounded shadow">
            <div className="d-flex align-items-center">
              <div className="spinner-border text-primary me-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span>Generating invoice download...</span>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {/* Main Invoice Content */}
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Invoice Details</h5>
                <div className="d-flex align-items-center">
                  <span className={`badge ${statusBadge.class} me-2`}>
                    {statusBadge.icon} {invoice.paymentStatus.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="badge bg-secondary">
                    {invoice.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div className="card-body">
              {/* Header */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <h4>{invoice.company?.name}</h4>
                  {invoice.company?.gstNumber && (
                    <p className="text-muted mb-1">GST: {invoice.company.gstNumber}</p>
                  )}
                  {invoice.branch?.location && (
                    <p className="text-muted">{invoice.branch.location}</p>
                  )}
                </div>
                <div className="col-md-6 text-end">
                  <h4>INVOICE</h4>
                  <p className="mb-1">
                    <strong>Invoice #:</strong> {invoice.invoiceNumber}
                  </p>
                  <p className="mb-1">
                    <strong>Date:</strong> {format(new Date(invoice.date), 'MMMM d, yyyy')}
                  </p>
                  {invoice.dueDate && (
                    <p className="mb-1">
                      <strong>Due Date:</strong> {format(new Date(invoice.dueDate), 'MMMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-light p-3 rounded mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <h5>Bill To:</h5>
                    <p className="mb-1"><strong>{invoice.client?.name}</strong></p>
                    {invoice.client?.phone && (
                      <p className="mb-1">
                        <FaUser className="me-1" />
                        {invoice.client.phone}
                      </p>
                    )}
                    {invoice.client?.email && (
                      <p className="mb-1">
                        <i className="bi bi-envelope me-1"></i>
                        {invoice.client.email}
                      </p>
                    )}
                  </div>
                  <div className="col-md-6">
                    {invoice.client?.address && (
                      <p className="mb-1">
                        <i className="bi bi-geo-alt me-1"></i>
                        {invoice.client.address}
                      </p>
                    )}
                    {invoice.client?.gstNumber && (
                      <p className="mb-1">
                        <strong>GST:</strong> {invoice.client.gstNumber}
                      </p>
                    )}
                    {invoice.client?.isRegular && (
                      <span className="badge bg-success">
                        Regular Client ({invoice.client.discountPercentage}% discount)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="table-responsive mb-4">
                <table className="table">
                  <thead className="table-light">
                    <tr>
                      <th>Item</th>
                      <th>Description</th>
                      <th>Qty</th>
                      <th className="text-end">Rate</th>
                      <th className="text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{item.name}</strong>
                          <div className="text-muted small">
                            {item.categoryName} / {item.subcategoryName}
                          </div>
                        </td>
                        <td>{item.description || '-'}</td>
                        <td>{item.quantity}</td>
                        <td className="text-end">₹{item.price.toFixed(2)}</td>
                        <td className="text-end">
                          ₹{((item.price * item.quantity) - item.discount + item.gst).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="row">
                <div className="col-md-6">
                  {invoice.notes && (
                    <div className="bg-light p-3 rounded">
                      <h6>Notes</h6>
                      <p className="mb-0">{invoice.notes}</p>
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td><strong>Subtotal:</strong></td>
                        <td className="text-end">₹{invoice.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td><strong>Discount:</strong></td>
                        <td className="text-end">₹{invoice.totalDiscount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td><strong>GST:</strong></td>
                        <td className="text-end">₹{invoice.totalGst.toFixed(2)}</td>
                      </tr>
                      <tr className="table-active">
                        <td><strong>Total:</strong></td>
                        <td className="text-end">
                          <strong>₹{invoice.grandTotal.toFixed(2)}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Payment Actions */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Payment Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2 mb-3">
                <button
                  className={`btn btn-success ${invoice.paymentStatus === 'paid' ? 'disabled' : ''}`}
                  onClick={() => updatePaymentStatus('paid')}
                  disabled={isUpdating || invoice.paymentStatus === 'paid'}
                >
                  <FaCheck className="me-1" />
                  Mark as Paid
                </button>
                <button
                  className={`btn btn-warning ${invoice.paymentStatus === 'partially_paid' ? 'disabled' : ''}`}
                  onClick={() => updatePaymentStatus('partially_paid')}
                  disabled={isUpdating || invoice.paymentStatus === 'partially_paid'}
                >
                  <FaClock className="me-1" />
                  Mark as Partially Paid
                </button>
                <button
                  className={`btn btn-danger ${invoice.paymentStatus === 'pending' ? 'disabled' : ''}`}
                  onClick={() => updatePaymentStatus('pending')}
                  disabled={isUpdating || invoice.paymentStatus === 'pending'}
                >
                  <FaTimes className="me-1" />
                  Mark as Pending
                </button>
              </div>

              <div className="mb-3">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={invoice.paymentMethod || ''}
                  onChange={(e) => updatePaymentMethod(e.target.value)}
                  disabled={isUpdating}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              {/* Quick Download Section */}
              <div className="border-top pt-3">
                <h6 className="mb-2">Quick Download</h6>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-outline-success btn-sm"
                    onClick={() => downloadInvoice('pdf')}
                    disabled={isDownloading}
                  >
                    <FaDownload className="me-1" />
                    {isDownloading ? 'Processing...' : 'Download PDF'}
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => downloadInvoice('json')}
                    disabled={isDownloading}
                  >
                    <FaDownload className="me-1" />
                    Download Data
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link
                  to={`/companies/${companyId}/clients/${invoice.client?._id}`}
                  className="btn btn-outline-primary"
                >
                  <FaUser className="me-1" />
                  View Client
                </Link>
                <Link
                  to={`/companies/${companyId}/clients/${invoice.client?._id}/invoices`}
                  className="btn btn-outline-secondary"
                >
                  <FaReceipt className="me-1" />
                  Client's Invoices
                </Link>
              </div>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0">Summary</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Invoice Date</span>
                  <strong>{format(new Date(invoice.date), 'MMM d, yyyy')}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Items</span>
                  <strong>{invoice.items?.length || 0}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Status</span>
                  <span className={`badge ${statusBadge.class}`}>
                    {invoice.paymentStatus.replace('_', ' ')}
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Created By</span>
                  <strong>Admin</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Last Updated</span>
                  <strong>{format(new Date(invoice.updatedAt), 'MMM d, yyyy')}</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;