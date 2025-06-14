import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const PrintInvoice = () => {
  const { companyId, branchId, invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data } = await axios.get(
          `/api/companies/${companyId}/branches/${branchId}/invoices/${invoiceId}`
        );
        
        console.log('Invoice data:', data);
        setInvoice(data);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice details for printing: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [companyId, branchId, invoiceId]);

  // Generate HTML for printing
  const generatePrintableHTML = (invoiceData) => {
    const calculateItemTotal = (item) => {
      const baseAmount = (item.price || 0) * (item.quantity || 0);
      const discount = item.discount || 0;
      const gst = item.gst || 0;
      return baseAmount - discount + gst;
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        return format(new Date(dateString), 'dd/MM/yyyy');
      } catch (error) {
        return 'Invalid Date';
      }
    };

    const itemsHTML = invoiceData.items?.map((item, index) => `
      <tr>
        <td style="text-align: center; padding: 8px; border: 1px solid #000;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #000;">
          <strong>${item.name || 'Unknown Item'}</strong>
          ${(item.categoryName || item.subcategoryName) ? 
            `<div style="font-size: 10px; color: #666;">${[item.categoryName, item.subcategoryName].filter(Boolean).join(' / ')}</div>` : ''}
        </td>
        <td style="padding: 8px; border: 1px solid #000;">${item.description || '-'}</td>
        <td style="text-align: center; padding: 8px; border: 1px solid #000;">${item.quantity || 0}</td>
        <td style="text-align: right; padding: 8px; border: 1px solid #000;">${(item.price || 0).toFixed(2)}</td>
        <td style="text-align: right; padding: 8px; border: 1px solid #000;">${(item.discount || 0).toFixed(2)}</td>
        <td style="text-align: right; padding: 8px; border: 1px solid #000;">${(item.gst || 0).toFixed(2)}</td>
        <td style="text-align: right; padding: 8px; border: 1px solid #000;">${calculateItemTotal(item).toFixed(2)}</td>
      </tr>
    `).join('') || '<tr><td colspan="8" style="text-align: center; padding: 8px; border: 1px solid #000;">No items found</td></tr>';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceData.invoiceNumber || 'N/A'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; background: white; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; background: white; }
        .invoice-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
        .invoice-header h1 { font-size: 24px; margin-bottom: 5px; color: #000; }
        .invoice-header h2 { font-size: 18px; margin-top: 15px; color: #000; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .branch-details, .invoice-info { width: 48%; }
        .invoice-info table { width: 100%; border-collapse: collapse; }
        .invoice-info td { padding: 3px 0; border: none; }
        .invoice-info td:first-child { font-weight: bold; width: 40%; }
        .client-info { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; }
        .client-info h3 { margin-bottom: 10px; font-size: 14px; }
        .client-details { display: flex; justify-content: space-between; }
        .client-left, .client-right { width: 48%; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border: 1px solid #000; padding: 8px; text-align: left; }
        .items-table th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
        .totals-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .notes-section { width: 48%; }
        .totals-table { width: 48%; }
        .totals-table table { width: 100%; border-collapse: collapse; }
        .totals-table td { padding: 5px 10px; border-bottom: 1px solid #ddd; }
        .totals-table .grand-total { font-weight: bold; font-size: 14px; background-color: #f0f0f0; border-top: 2px solid #000; }
        .invoice-footer { border-top: 1px solid #000; padding-top: 15px; display: flex; justify-content: space-between; }
        .terms { width: 65%; }
        .terms h4 { margin-bottom: 8px; font-size: 12px; }
        .terms ul { padding-left: 20px; }
        .terms li { margin-bottom: 3px; font-size: 10px; }
        .signature { width: 30%; text-align: right; }
        .signature-line { height: 40px; border-bottom: 1px solid #000; width: 150px; margin: 20px 0 0 auto; }
        .footer-note { text-align: center; margin-top: 20px; font-size: 10px; color: #666; }
        @media print {
            body { margin: 0; padding: 0; background: white !important; }
            .container { max-width: 100%; margin: 0; padding: 15px; box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="invoice-header">
            <h1>${invoiceData.company?.name || 'Company Name'}</h1>
            ${invoiceData.company?.address ? `<p>${invoiceData.company.address}</p>` : ''}
            ${invoiceData.company?.phone ? `<p>Phone: ${invoiceData.company.phone}</p>` : ''}
            ${invoiceData.company?.email ? `<p>Email: ${invoiceData.company.email}</p>` : ''}
            ${invoiceData.company?.gstNumber ? `<p><strong>GST Number:</strong> ${invoiceData.company.gstNumber}</p>` : ''}
            <h2>TAX INVOICE</h2>
        </div>

        <div class="invoice-details">
            <div class="branch-details">
                <h3>Branch Details:</h3>
                <p><strong>${invoiceData.branch?.name || 'Branch Name'}</strong></p>
                ${invoiceData.branch?.location ? `<p>${invoiceData.branch.location}</p>` : ''}
                ${invoiceData.branch?.phone ? `<p>Phone: ${invoiceData.branch.phone}</p>` : ''}
            </div>
            <div class="invoice-info">
                <table>
                    <tr>
                        <td><strong>Invoice Number:</strong></td>
                        <td>${invoiceData.invoiceNumber || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Invoice Date:</strong></td>
                        <td>${formatDate(invoiceData.date || invoiceData.createdAt)}</td>
                    </tr>
                    ${invoiceData.dueDate ? `
                    <tr>
                        <td><strong>Due Date:</strong></td>
                        <td>${formatDate(invoiceData.dueDate)}</td>
                    </tr>` : ''}
                    <tr>
                        <td><strong>Payment Status:</strong></td>
                        <td>${(invoiceData.paymentStatus || 'pending').toUpperCase().replace('_', ' ')}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="client-info">
            <h3>Bill To:</h3>
            <div class="client-details">
                <div class="client-left">
                    <p><strong>${invoiceData.client?.name || 'Customer Name'}</strong></p>
                    ${invoiceData.client?.phone ? `<p>Phone: ${invoiceData.client.phone}</p>` : ''}
                    ${invoiceData.client?.email ? `<p>Email: ${invoiceData.client.email}</p>` : ''}
                </div>
                <div class="client-right">
                    ${invoiceData.client?.address ? `<p>Address: ${invoiceData.client.address}</p>` : ''}
                    ${invoiceData.client?.gstNumber ? `<p>GST Number: ${invoiceData.client.gstNumber}</p>` : ''}
                    ${invoiceData.client?.isRegular ? `
                    <p><strong>Regular Customer</strong>
                    ${invoiceData.client.discountPercentage ? ` (${invoiceData.client.discountPercentage}% discount)` : ''}</p>` : ''}
                </div>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 5%">#</th>
                    <th style="width: 25%">Item Name</th>
                    <th style="width: 20%">Description</th>
                    <th style="width: 8%">Qty</th>
                    <th style="width: 12%">Rate (₹)</th>
                    <th style="width: 10%">Discount (₹)</th>
                    <th style="width: 10%">GST (₹)</th>
                    <th style="width: 10%">Amount (₹)</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>

        <div class="totals-section">
            <div class="notes-section">
                ${invoiceData.notes ? `
                <div>
                    <h4>Notes:</h4>
                    <p style="border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">${invoiceData.notes}</p>
                </div>` : ''}
                
                <div style="margin-top: 15px;">
                    <h4>Payment Information:</h4>
                    <p><strong>Status:</strong> ${(invoiceData.paymentStatus || 'pending').toUpperCase().replace('_', ' ')}</p>
                    <p><strong>Method:</strong> ${(invoiceData.paymentMethod || 'cash').toUpperCase().replace('_', ' ')}</p>
                </div>
            </div>
            
            <div class="totals-table">
                <table>
                    <tr>
                        <td><strong>Subtotal:</strong></td>
                        <td style="text-align: right;">₹${(invoiceData.subtotal || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Total Discount:</strong></td>
                        <td style="text-align: right;">₹${(invoiceData.totalDiscount || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Total GST:</strong></td>
                        <td style="text-align: right;">₹${(invoiceData.totalGst || 0).toFixed(2)}</td>
                    </tr>
                    <tr class="grand-total">
                        <td><strong>Grand Total:</strong></td>
                        <td style="text-align: right;"><strong>₹${(invoiceData.grandTotal || 0).toFixed(2)}</strong></td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="invoice-footer">
            <div class="terms">
                <h4>Terms & Conditions:</h4>
                <ul>
                    <li>Payment is due within 30 days of invoice date</li>
                    <li>Late payments may incur additional charges</li>
                    <li>Goods once sold will not be taken back</li>
                </ul>
            </div>
            <div class="signature">
                <p>Authorized Signature</p>
                <div class="signature-line"></div>
            </div>
        </div>
        
        <div class="footer-note">
            <small>Invoice generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')} | Thank you for your business!</small>
        </div>
    </div>
    <script>
        setTimeout(() => {
            window.print();
        }, 500);
    </script>
</body>
</html>`;
  };

  // Function to open invoice in new window for printing
  const handlePrint = () => {
    if (!invoice) return;
    
    const printHTML = generatePrintableHTML(invoice);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      // Focus on the new window
      printWindow.focus();
    } else {
      alert('Please allow pop-ups for this site to enable printing');
    }
  };

  // Alternative: Download as HTML file
  const handleDownloadHTML = () => {
    if (!invoice) return;
    
    const printHTML = generatePrintableHTML(invoice);
    const blob = new Blob([printHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.invoiceNumber || 'unknown'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate item totals properly
  const calculateItemTotal = (item) => {
    const baseAmount = (item.price || 0) * (item.quantity || 0);
    const discount = item.discount || 0;
    const gst = item.gst || 0;
    return baseAmount - discount + gst;
  };

  // Safe date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (error) {
    return (
      <div className="container p-5 text-center">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
        <button 
          className="btn btn-primary mt-3"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading || !invoice) {
    return (
      <div className="container p-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading invoice for printing...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Print Controls */}
      <div className="text-center mb-4 p-3 bg-light rounded">
        <button 
          className="btn btn-primary me-2"
          onClick={handlePrint}
        >
          <i className="bi bi-printer me-1"></i>
          Print Invoice (New Window)
        </button>
        <button 
          className="btn btn-success me-2"
          onClick={handleDownloadHTML}
        >
          <i className="bi bi-download me-1"></i>
          Download HTML
        </button>
        <button 
          className="btn btn-secondary me-2"
          onClick={() => window.history.back()}
        >
          <i className="bi bi-arrow-left me-1"></i>
          Go Back
        </button>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => window.close()}
        >
          Close Window
        </button>
      </div>

      {/* Invoice Preview */}
      <div className="card">
        <div className="card-body">
          <div className="text-center border-bottom pb-3 mb-4">
            <h1 className="mb-2">{invoice.company?.name || 'Company Name'}</h1>
            {invoice.company?.address && (
              <p className="mb-1">{invoice.company.address}</p>
            )}
            {invoice.company?.phone && (
              <p className="mb-1">Phone: {invoice.company.phone}</p>
            )}
            {invoice.company?.email && (
              <p className="mb-1">Email: {invoice.company.email}</p>
            )}
            {invoice.company?.gstNumber && (
              <p className="mb-2"><strong>GST Number:</strong> {invoice.company.gstNumber}</p>
            )}
            <h2 className="mt-3 mb-0">TAX INVOICE</h2>
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <h5>Branch Details:</h5>
              <p className="mb-1"><strong>{invoice.branch?.name || 'Branch Name'}</strong></p>
              {invoice.branch?.location && (
                <p className="mb-1">{invoice.branch.location}</p>
              )}
              {invoice.branch?.phone && (
                <p className="mb-1">Phone: {invoice.branch.phone}</p>
              )}
            </div>
            <div className="col-md-6">
              <table className="table table-borderless table-sm">
                <tbody>
                  <tr>
                    <td><strong>Invoice Number:</strong></td>
                    <td>{invoice.invoiceNumber || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Invoice Date:</strong></td>
                    <td>{formatDate(invoice.date || invoice.createdAt)}</td>
                  </tr>
                  {invoice.dueDate && (
                    <tr>
                      <td><strong>Due Date:</strong></td>
                      <td>{formatDate(invoice.dueDate)}</td>
                    </tr>
                  )}
                  <tr>
                    <td><strong>Payment Status:</strong></td>
                    <td className="text-uppercase">{(invoice.paymentStatus || 'pending').replace('_', ' ')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="border p-3 mb-4">
            <h5 className="mb-3">Bill To:</h5>
            <div className="row">
              <div className="col-md-6">
                <p className="mb-1"><strong>{invoice.client?.name || 'Customer Name'}</strong></p>
                {invoice.client?.phone && (
                  <p className="mb-1">Phone: {invoice.client.phone}</p>
                )}
                {invoice.client?.email && (
                  <p className="mb-1">Email: {invoice.client.email}</p>
                )}
              </div>
              <div className="col-md-6">
                {invoice.client?.address && (
                  <p className="mb-1">Address: {invoice.client.address}</p>
                )}
                {invoice.client?.gstNumber && (
                  <p className="mb-1">GST Number: {invoice.client.gstNumber}</p>
                )}
                {invoice.client?.isRegular && (
                  <p className="mb-0">
                    <strong>Regular Customer</strong>
                    {invoice.client.discountPercentage && (
                      <span> ({invoice.client.discountPercentage}% discount)</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  <th style={{width: '5%'}}>#</th>
                  <th style={{width: '25%'}}>Item Name</th>
                  <th style={{width: '20%'}}>Description</th>
                  <th style={{width: '8%'}}>Qty</th>
                  <th style={{width: '12%'}} className="text-end">Rate (₹)</th>
                  <th style={{width: '10%'}} className="text-end">Discount (₹)</th>
                  <th style={{width: '10%'}} className="text-end">GST (₹)</th>
                  <th style={{width: '10%'}} className="text-end">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.length > 0 ? invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{item.name || 'Unknown Item'}</strong>
                      {(item.categoryName || item.subcategoryName) && (
                        <div className="text-muted small">
                          {[item.categoryName, item.subcategoryName].filter(Boolean).join(' / ')}
                        </div>
                      )}
                    </td>
                    <td>{item.description || '-'}</td>
                    <td>{item.quantity || 0}</td>
                    <td className="text-end">{(item.price || 0).toFixed(2)}</td>
                    <td className="text-end">{(item.discount || 0).toFixed(2)}</td>
                    <td className="text-end">{(item.gst || 0).toFixed(2)}</td>
                    <td className="text-end">{calculateItemTotal(item).toFixed(2)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="text-center">No items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="row">
            <div className="col-md-6">
              {invoice.notes && (
                <div className="mb-4">
                  <h6>Notes:</h6>
                  <p className="mb-0 border p-2 bg-light">{invoice.notes}</p>
                </div>
              )}
            </div>
            
            <div className="col-md-6">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td><strong>Subtotal:</strong></td>
                    <td className="text-end">₹{(invoice.subtotal || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Discount:</strong></td>
                    <td className="text-end">₹{(invoice.totalDiscount || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td><strong>Total GST:</strong></td>
                    <td className="text-end">₹{(invoice.totalGst || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="table-active">
                    <td><strong>Grand Total:</strong></td>
                    <td className="text-end">
                      <strong>₹{(invoice.grandTotal || 0).toFixed(2)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintInvoice;