import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../pages/Companies.css';

const ClientDetail = () => {
  const { companyId, clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [company, setCompany] = useState(null);
  const [branch, setBranch] = useState(null);
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if clientId is valid
        if (!clientId || clientId === 'undefined') {
          throw new Error('Invalid client ID');
        }

        setIsLoading(true);
        setError(null);
        
        // Fetch client details first
        const clientRes = await axios.get(`/api/companies/${companyId}/clients/${clientId}`);
        const clientData = clientRes.data;
        setClient(clientData);

        // Fetch company details for GST number
        const companyRes = await axios.get(`/api/companies/${companyId}`);
        setCompany(companyRes.data);

        // Fetch all branches to get pricing across branches
        const branchesRes = await axios.get(`/api/companies/${companyId}/branches`);
        const branchesData = branchesRes.data;
        setAllBranches(branchesData);

        // Find client's specific branch, category, and subcategory
        const clientBranch = branchesData.find(b => b._id === clientData.branch);
        setBranch(clientBranch);

        if (clientBranch) {
          const clientCategory = clientBranch.categories?.find(c => c._id === clientData.categoryId);
          setCategory(clientCategory);

          if (clientCategory) {
            const clientSubcategory = clientCategory.subcategories?.find(s => s._id === clientData.subcategoryId);
            setSubcategory(clientSubcategory);
          }
        }

        // Fetch client invoices
        try {
          const invoicesRes = await axios.get(`/api/companies/${companyId}/clients/${clientId}/invoices`);
          setInvoices(invoicesRes.data);
        } catch (error) {
          console.log('Invoices endpoint not available:', error);
          setInvoices([]);
        }

      } catch (error) {
        console.error('Error fetching client data:', error);
        setError(error.message || 'Failed to load client data');
        // Redirect back if clientId is invalid
        if (error.message === 'Invalid client ID') {
          navigate(`/companies/${companyId}/clients`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId && clientId) {
      fetchData();
    }
  }, [companyId, clientId, navigate]);

  // Calculate discounted price
  const calculateDiscountedPrice = (originalPrice, isRegular, discountPercentage) => {
    if (isRegular && discountPercentage > 0) {
      return (originalPrice * (1 - discountPercentage / 100)).toFixed(2);
    }
    return originalPrice.toFixed(2);
  };

  // Calculate price breakdown
  const calculatePriceBreakdown = () => {
    if (!subcategory || !client) return null;

    const basePrice = subcategory.price;
    const discountAmount = client.isRegular ? (basePrice * (client.discountPercentage / 100)) : 0;
    const discountedPrice = basePrice - discountAmount;
    const gstAmount = discountedPrice * (subcategory.gst / 100);
    const totalPrice = discountedPrice + gstAmount;

    return {
      basePrice,
      discountAmount,
      discountedPrice,
      gstAmount,
      totalPrice,
      gstRate: subcategory.gst
    };
  };

  // Get pricing for same service across all branches
  const getPricingAcrossBranches = () => {
    if (!subcategory) return [];

    return allBranches.map(branch => {
      const matchingCategory = branch.categories?.find(cat => cat.name === category?.name);
      const matchingSubcategory = matchingCategory?.subcategories?.find(sub => sub.name === subcategory.name);

      if (matchingSubcategory) {
        const basePrice = matchingSubcategory.price;
        const discountAmount = client.isRegular ? (basePrice * (client.discountPercentage / 100)) : 0;
        const discountedPrice = basePrice - discountAmount;

        return {
          branchId: branch._id,
          branchName: branch.name,
          location: branch.location,
          basePrice,
          discountedPrice,
          gstRate: matchingSubcategory.gst,
          isClientBranch: branch._id === client.branch
        };
      }
      return null;
    }).filter(Boolean);
  };

  if (isLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <h4>Client Not Found</h4>
          <p>The requested client could not be found.</p>
          <Link to={`/companies/${companyId}/clients`} className="btn btn-primary">
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  const priceBreakdown = calculatePriceBreakdown();
  const branchPricing = getPricingAcrossBranches();

  return (
    <div className="container-fluid py-4">
      {/* Client Header Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="h4 mb-0">
              <i className="bi bi-person-circle me-2"></i>
              {client.name}
            </h2>
            <Link 
              to={`/companies/${companyId}/clients`}
              className="btn btn-light btn-sm"
            >
              <i className="bi bi-arrow-left me-1"></i> Back to Clients
            </Link>
          </div>
        </div>
        
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <h5 className="text-primary">Contact Information</h5>
                <p className="mb-2">
                  <i className="bi bi-telephone-fill text-success me-2"></i>
                  <strong>{client.phone}</strong>
                </p>
                {client.email && (
                  <p className="mb-2">
                    <i className="bi bi-envelope-fill text-info me-2"></i>
                    {client.email}
                  </p>
                )}
                {client.address && (
                  <p className="mb-2">
                    <i className="bi bi-geo-alt-fill text-warning me-2"></i>
                    {client.address}
                  </p>
                )}
              </div>

              <div className="mb-3">
                <h5 className="text-primary">Client Status</h5>
                <div className="d-flex flex-wrap gap-2">
                  <span className={`badge ${client.isRegular ? 'bg-success' : 'bg-warning'}`}>
                    <i className={`bi ${client.isRegular ? 'bi-star-fill' : 'bi-person'} me-1`}></i>
                    {client.isRegular ? 'Regular Client' : 'One-Time Client'}
                  </span>
                  {client.isRegular && client.discountPercentage > 0 && (
                    <span className="badge bg-info">
                      <i className="bi bi-percent me-1"></i>
                      {client.discountPercentage}% Discount
                    </span>
                  )}
                  <span className="badge bg-secondary">
                    <i className="bi bi-calendar-event me-1"></i>
                    Since {new Date(client.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="mb-3">
                <h5 className="text-primary">Service Details</h5>
                {branch && (
                  <p className="mb-2">
                    <i className="bi bi-building text-primary me-2"></i>
                    <strong>Branch:</strong> {branch.name} - {branch.location}
                  </p>
                )}
                {category && (
                  <p className="mb-2">
                    <i className="bi bi-tag text-secondary me-2"></i>
                    <strong>Category:</strong> {category.name}
                  </p>
                )}
                {subcategory && (
                  <p className="mb-2">
                    <i className="bi bi-gear text-info me-2"></i>
                    <strong>Service:</strong> {subcategory.name}
                  </p>
                )}
              </div>

              <div className="mb-3">
                <h5 className="text-primary">Tax Information</h5>
                <p className="mb-2">
                  <i className="bi bi-receipt text-success me-2"></i>
                  <strong>Service GST:</strong> {client.gstFromSubcategory || subcategory?.gst || 0}%
                </p>
                <p className="mb-2">
                  <i className="bi bi-building-check text-warning me-2"></i>
                  <strong>Company GST:</strong> {client.companyGSTNumber || company?.gstNumber || 'Not Set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="card shadow-sm">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                <i className="bi bi-info-circle me-1"></i>
                Service Details
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'pricing' ? 'active' : ''}`}
                onClick={() => setActiveTab('pricing')}
              >
                <i className="bi bi-currency-rupee me-1"></i>
                Pricing Analysis
              </button>
            </li>
            <li className="nav-item">
              {/* <button 
                className={`nav-link ${activeTab === 'invoices' ? 'active' : ''}`}
                onClick={() => setActiveTab('invoices')}
              >
                <i className="bi bi-receipt-cutoff me-1"></i>
                Invoices ({invoices.length})
              </button> */}
            </li>
          </ul>
        </div>
        
        <div className="card-body">
          {/* Service Details Tab */}
          {activeTab === 'details' && (
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-light">
                    <h5 className="card-title mb-0">
                      <i className="bi bi-gear-fill me-2"></i>
                      Current Service
                    </h5>
                  </div>
                  <div className="card-body">
                    {subcategory ? (
                      <div>
                        <div className="mb-3">
                          <h6 className="text-primary">Service Information</h6>
                          <p><strong>Name:</strong> {subcategory.name}</p>
                          <p><strong>Description:</strong> {subcategory.description || 'No description available'}</p>
                          <p><strong>Standard Price:</strong> ₹{subcategory.price}</p>
                          <p><strong>GST Rate:</strong> {subcategory.gst}%</p>
                        </div>
                        
                        <div className="mb-3">
                          <h6 className="text-primary">Location Details</h6>
                          <p><strong>Branch:</strong> {branch?.name}</p>
                          <p><strong>Location:</strong> {branch?.location}</p>
                          <p><strong>Category:</strong> {category?.name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Service details not available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-light">
                    <h5 className="card-title mb-0">
                      <i className="bi bi-calculator-fill me-2"></i>
                      Price Breakdown
                    </h5>
                  </div>
                  <div className="card-body">
                    {priceBreakdown ? (
                      <div>
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <tbody>
                              <tr>
                                <td><strong>Base Price:</strong></td>
                                <td className="text-end">₹{priceBreakdown.basePrice.toFixed(2)}</td>
                              </tr>
                              {client.isRegular && priceBreakdown.discountAmount > 0 && (
                                <tr className="text-success">
                                  <td><strong>Discount ({client.discountPercentage}%):</strong></td>
                                  <td className="text-end">-₹{priceBreakdown.discountAmount.toFixed(2)}</td>
                                </tr>
                              )}
                              <tr>
                                <td><strong>Discounted Price:</strong></td>
                                <td className="text-end">₹{priceBreakdown.discountedPrice.toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td><strong>GST ({priceBreakdown.gstRate}%):</strong></td>
                                <td className="text-end">₹{priceBreakdown.gstAmount.toFixed(2)}</td>
                              </tr>
                              <tr className="table-primary">
                                <td><strong>Total Amount:</strong></td>
                                <td className="text-end"><strong>₹{priceBreakdown.totalPrice.toFixed(2)}</strong></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="alert alert-info mt-3">
                          <small>
                            <i className="bi bi-info-circle me-1"></i>
                            GST Number: {client.companyGSTNumber || 'Not Available'}
                          </small>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Price breakdown not available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Analysis Tab */}
          {activeTab === 'pricing' && (
            <div>
              <h5 className="mb-4">
                <i className="bi bi-graph-up me-2"></i>
                Pricing Across All Branches
              </h5>
              {branchPricing.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Branch</th>
                        <th>Location</th>
                        <th>Base Price</th>
                        <th>Your Price</th>
                        <th>GST Rate</th>
                        <th>Total (with GST)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchPricing.map((pricing, index) => {
                        const totalWithGST = pricing.discountedPrice * (1 + pricing.gstRate / 100);
                        return (
                          <tr key={index} className={pricing.isClientBranch ? 'table-success' : ''}>
                            <td>
                              <strong>{pricing.branchName}</strong>
                              {pricing.isClientBranch && (
                                <span className="badge bg-success ms-2">Current</span>
                              )}
                            </td>
                            <td>{pricing.location}</td>
                            <td>₹{pricing.basePrice.toFixed(2)}</td>
                            <td>
                              ₹{pricing.discountedPrice.toFixed(2)}
                              {pricing.basePrice !== pricing.discountedPrice && (
                                <small className="text-success d-block">
                                  (₹{(pricing.basePrice - pricing.discountedPrice).toFixed(2)} saved)
                                </small>
                              )}
                            </td>
                            <td>{pricing.gstRate}%</td>
                            <td><strong>₹{totalWithGST.toFixed(2)}</strong></td>
                            <td>
                              {pricing.isClientBranch ? (
                                <span className="badge bg-success">
                                  <i className="bi bi-check-circle me-1"></i>
                                  Active
                                </span>
                              ) : (
                                <span className="badge bg-secondary">Available</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  This service is only available at {branch?.name || 'the current branch'}.
                </div>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">
                  <i className="bi bi-receipt-cutoff me-2"></i>
                  Invoice History
                </h5>
                <button className="btn btn-primary btn-sm">
                  <i className="bi bi-plus-lg me-1"></i>
                  Generate Invoice
                </button>
              </div>
              
              {invoices.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Invoice #</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice._id}>
                          <td><strong>{invoice.invoiceNumber}</strong></td>
                          <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                          <td>₹{invoice.totalAmount.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${
                              invoice.status === 'paid' ? 'bg-success' :
                              invoice.status === 'pending' ? 'bg-warning' : 'bg-danger'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary">
                                <i className="bi bi-eye"></i>
                              </button>
                              <button className="btn btn-outline-secondary">
                                <i className="bi bi-download"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-receipt display-4 text-muted mb-3"></i>
                  <h5 className="text-muted">No Invoices Found</h5>
                  <p className="text-muted">This client doesn't have any invoices yet.</p>
                  <button className="btn btn-primary">
                    <i className="bi bi-plus-lg me-1"></i>
                    Create First Invoice
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;