import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Printer, Download, FileText, ChevronDown, Calendar, AlertTriangle } from 'lucide-react';

const formatDate = (date, formatStr) => {
  try {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return new Intl.DateTimeFormat('en-IN', options).format(new Date(date));
  } catch (error) {
    return 'Invalid Date';
  }
};

const BranchPerformanceReport = () => {
  const { companyId, branchId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientType, setClientType] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const clientTypeOptions = [
    { value: 'all', label: 'All Clients' },
    { value: 'regular', label: 'Regular Clients' },
    { value: 'non-regular', label: 'Non-Regular Clients' }
  ];

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Validate required parameters
        if (!companyId || !branchId) {
          throw new Error('Company ID and Branch ID are required');
        }

        const params = { clientType };
        
        if (customDateRange && startDate && endDate) {
          params.startDate = startDate;
          params.endDate = endDate;
        } else if (!customDateRange) {
          params.dateRange = dateRange;
        }

        const { data } = await axios.get(
          `/api/companies/${companyId}/branches/${branchId}/report`,
          { 
            params,
            timeout: 30000 // 30 second timeout
          }
        );
        
        setReportData(data);
      } catch (err) {
        console.error('Error fetching report data:', err);
        
        let errorMessage = 'Failed to load report data';
        
        if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout - please try again';
        } else if (err.response) {
          errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
          if (err.response.data?.error) {
            errorMessage += ` - ${err.response.data.error}`;
          }
        } else if (err.request) {
          errorMessage = 'No response from server - please check your connection';
        } else {
          errorMessage = err.message || 'An unexpected error occurred';
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [companyId, branchId, clientType, dateRange, customDateRange, startDate, endDate]);

  const handleDateRangeChange = (value) => {
    if (value === 'custom') {
      setCustomDateRange(true);
      setDateRange('custom');
    } else {
      setCustomDateRange(false);
      setDateRange(value);
      setStartDate('');
      setEndDate('');
    }
    setShowDateDropdown(false);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = document.getElementById('report-content').innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Branch Performance Report</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            
            @media print {
              .report-container {
                margin: 0;
                padding: 0;
              }
              
              .print-header {
                margin: 0 0 30px 0;
              }
              
              body {
                font-size: 12px;
              }
              
              .print-table th {
                font-size: 10px;
              }
              
              .print-table td {
                font-size: 11px;
              }
            }
            
            .print-header {
              background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            }
            
            .print-info-box {
              border-left: 4px solid #3b82f6;
            }
            
            .print-recommendation-box {
              border-left: 4px solid #f59e0b;
            }
            
            .print-rank-badge {
              width: 24px;
              height: 24px;
              font-size: 10px;
            }
            
            .print-rank-1 { background: #eab308; }
            .print-rank-2 { background: #9ca3af; }
            .print-rank-3 { background: #fb923c; }
          </style>
        </head>
        <body>
          <div class="container report-container">
            ${printContent}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleDownloadPDF = () => {
    alert('PDF download functionality would be implemented here using libraries like jsPDF or Puppeteer');
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount || 0);
    } catch (error) {
      return `₹${amount || 0}`;
    }
  };

  const getCurrentDateRangeLabel = () => {
    return dateRangeOptions.find(option => option.value === dateRange)?.label || 'Select Range';
  };

  const getCurrentClientTypeLabel = () => {
    return clientTypeOptions.find(option => option.value === clientType)?.label || 'All Clients';
  };

  const safeGet = (obj, path, defaultValue = null) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div>Generating report...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          <div className="d-flex align-items-center mb-2">
            <AlertTriangle className="me-2" size={20} />
            <strong>Error Loading Report</strong>
          </div>
          <div>{error}</div>
          <div className="mt-3">
            <button 
              className="btn btn-outline-danger"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <FileText size={48} className="text-muted mb-3" />
          <div className="h5 text-muted">No report data available</div>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => window.location.reload()}
          >
            Refresh Report
          </button>
        </div>
      </div>
    );
  }

  // Calculate derived values safely based on backend structure
  const totalRevenue = safeGet(reportData, 'summary.totalRevenue', 0);
  const totalClients = safeGet(reportData, 'clientInsights.totalClients', 0);
  const regularClients = safeGet(reportData, 'clientInsights.regularClients', 0);
  const nonRegularClients = totalClients - regularClients;
  const regularClientsRevenuePercentage = safeGet(reportData, 'clientInsights.regularClientsRevenuePercentage', 0);
  const totalInvoices = safeGet(reportData, 'summary.totalInvoices', 0);
  const avgInvoiceValue = safeGet(reportData, 'summary.avgInvoiceValue', 0);

  return (
    <div className="bg-light min-vh-100">
      {/* Action Buttons */}
      <div className="bg-white shadow-sm border-bottom">
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="d-flex gap-3 flex-wrap">
              {/* Client Type Filter */}
              <div className="dropdown">
                <button 
                  className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                >
                  {getCurrentClientTypeLabel()}
                  <ChevronDown className="ms-2" size={16} />
                </button>
                {showClientDropdown && (
                  <div className="dropdown-menu show">
                    {clientTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`dropdown-item ${clientType === option.value ? 'active' : ''}`}
                        onClick={() => {
                          setClientType(option.value);
                          setShowClientDropdown(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Range Filter */}
              <div className="dropdown">
                <button 
                  className="btn btn-outline-primary dropdown-toggle d-flex align-items-center"
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                >
                  <Calendar className="me-2" size={16} />
                  {getCurrentDateRangeLabel()}
                  <ChevronDown className="ms-2" size={16} />
                </button>
                {showDateDropdown && (
                  <div className="dropdown-menu show p-3" style={{ minWidth: '300px' }}>
                    {dateRangeOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`dropdown-item ${dateRange === option.value ? 'active' : ''}`}
                        onClick={() => handleDateRangeChange(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                    {customDateRange && (
                      <div className="mt-3">
                        <div className="mb-2">
                          <label className="form-label small">Start Date</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small">End Date</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex gap-3">
              <button
                onClick={handlePrint}
                className="btn btn-primary d-flex align-items-center"
              >
                <Printer className="me-2" size={16} />
                Print Report
              </button>
              {/* <button
                onClick={handleDownloadPDF}
                className="btn btn-success d-flex align-items-center"
              >
                <Download className="me-2" size={16} />
                Download PDF
              </button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="container py-4">
        <div className="card shadow-lg">
          <div id="report-content">
            {/* Header */}
            <div className="print-header text-white p-4 text-center mb-4">
              <h1 className="h3 fw-bold mb-2">BRANCH PERFORMANCE REPORT</h1>
              <p className="mb-0 opacity-75">BUSINESS ANALYTICS & PERFORMANCE REVIEW</p>
              <div className="mt-3 small">
                <div>Report Generated: {formatDate(new Date(), 'MMMM dd, yyyy')}</div>
                <div>Time: {formatDate(new Date(), 'hh:mm a')}</div>
                <div className="badge bg-light text-dark mt-2">
                  {getCurrentDateRangeLabel()} | {getCurrentClientTypeLabel()}
                </div>
              </div>
            </div>

            <div className="p-4">
              {/* Summary Stats */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card bg-primary text-white h-100">
                    <div className="card-body">
                      <h3 className="h5 card-title">Total Clients</h3>
                      <div className="display-4 fw-bold mb-2">{totalClients}</div>
                      <div className="small">
                        <span className="badge bg-white text-primary me-2">
                          Regular: {regularClients}
                        </span>
                        <span className="badge bg-white text-primary">
                          Non-Regular: {nonRegularClients}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-success text-white h-100">
                    <div className="card-body">
                      <h3 className="h5 card-title">Total Revenue</h3>
                      <div className="display-4 fw-bold mb-2">{formatCurrency(totalRevenue)}</div>
                      <div className="small">
                        <span className="badge bg-white text-success me-2">
                          Regular Clients: {regularClientsRevenuePercentage}%
                        </span>
                        <span className="badge bg-white text-success">
                          Non-Regular: {100 - regularClientsRevenuePercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch Information */}
              <h2 className="h4 fw-bold border-bottom pb-2 mb-3">BRANCH INFORMATION</h2>
              <div className="print-info-box bg-light p-4 mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <div className="small lh-base">
                      <div><strong>Branch Name:</strong> {safeGet(reportData, 'branch.name', 'N/A')}</div>
                      <div><strong>Manager:</strong> {safeGet(reportData, 'branch.managerName', 'Not specified')}</div>
                      <div><strong>Location:</strong> {safeGet(reportData, 'branch.location', 'Not specified')}</div>
                      <div><strong>Status:</strong> {safeGet(reportData, 'branch.isDefault', false) ? 'Primary Branch' : 'Secondary Branch'}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="small lh-base">
                      <div><strong>Report Period:</strong> {getCurrentDateRangeLabel()}</div>
                      <div><strong>Client Filter:</strong> {getCurrentClientTypeLabel()}</div>
                      <div><strong>Total Invoices:</strong> {totalInvoices}</div>
                      <div><strong>Average Transaction:</strong> {formatCurrency(avgInvoiceValue)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Analysis */}
              {safeGet(reportData, 'revenueSummary.length', 0) > 0 && (
                <>
                  <h2 className="h4 fw-bold border-bottom pb-2 mb-3">REVENUE ANALYSIS</h2>
                  <div className="table-responsive">
                    <table className="print-table table table-bordered table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>Time Period</th>
                          <th>Total Revenue</th>
                          <th>Invoice Count</th>
                          <th>Average Value</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.revenueSummary.map((period, index) => (
                          <tr key={index} className={period.isCurrent ? 'table-success' : ''}>
                            <td className="fw-bold">{period.period}</td>
                            <td className="fw-bold">{formatCurrency(period.revenue || 0)}</td>
                            <td>{period.count || 0}</td>
                            <td>{formatCurrency(period.avg || 0)}</td>
                            <td>
                              {period.isCurrent && <span className="badge bg-success">Current</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Category Performance */}
              {safeGet(reportData, 'categoryPerformance.length', 0) > 0 && (
                <>
                  <h2 className="h4 fw-bold border-bottom pb-2 mb-3 mt-4">CATEGORY PERFORMANCE</h2>
                  <div className="table-responsive">
                    <table className="print-table table table-bordered table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>Category</th>
                          <th>Total Revenue</th>
                          <th>Monthly Revenue</th>
                          <th>Weekly Revenue</th>
                          <th>Daily Revenue</th>
                          <th>Top Subcategory</th>
                          <th>Subcategory Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.categoryPerformance
                          .filter(category => (category.totalRevenue || 0) > 0)
                          .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                          .map((category, index) => (
                          <tr key={index}>
                            <td className="fw-bold">{category.name}</td>
                            <td className="fw-bold">{formatCurrency(category.totalRevenue || 0)}</td>
                            <td>{formatCurrency(category.monthlyRevenue || 0)}</td>
                            <td>{formatCurrency(category.weeklyRevenue || 0)}</td>
                            <td>{formatCurrency(category.dailyRevenue || 0)}</td>
                            <td>
                              {category.topSubcategory?.name || 'No subcategories'}
                            </td>
                            <td>
                              {formatCurrency(category.topSubcategory?.revenue || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Top Subcategories */}
              {safeGet(reportData, 'topSubcategories.length', 0) > 0 && (
                <>
                  <h2 className="h4 fw-bold border-bottom pb-2 mb-3 mt-4">TOP PERFORMING SUBCATEGORIES</h2>
                  <div className="table-responsive">
                    <table className="print-table table table-bordered table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>Rank</th>
                          <th>Subcategory</th>
                          <th>Category</th>
                          <th>Revenue</th>
                          <th>Sales Count</th>
                          <th>Avg. Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.topSubcategories.map((subcategory, index) => (
                          <tr key={index}>
                            <td>
                              <span className={`print-rank-badge rounded-circle d-inline-flex align-items-center justify-content-center text-white print-rank-${Math.min(3, index + 1)}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="fw-bold">{subcategory.name}</td>
                            <td>{subcategory.category}</td>
                            <td className="fw-bold">{formatCurrency(subcategory.revenue || 0)}</td>
                            <td>{subcategory.salesCount || 0}</td>
                            <td>{formatCurrency(subcategory.avgPrice || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Client Analytics */}
              <h2 className="h4 fw-bold border-bottom pb-2 mb-3 mt-4">CLIENT ANALYTICS</h2>
              <div className="print-info-box bg-light p-4 mb-4">
                <h3 className="h5 fw-bold">Client Portfolio Overview</h3>
                <div className="row text-center">
                  <div className="col-md-3">
                    <div className="h4 text-primary mb-1">
                      {totalClients}
                    </div>
                    <div className="small">Total Clients</div>
                  </div>
                  <div className="col-md-3">
                    <div className="h4 text-success mb-1">
                      {regularClients}
                    </div>
                    <div className="small">Regular Clients</div>
                  </div>
                  <div className="col-md-3">
                    <div className="h4 text-info mb-1">
                      {nonRegularClients}
                    </div>
                    <div className="small">Non-Regular Clients</div>
                  </div>
                  <div className="col-md-3">
                    <div className="h4 text-warning mb-1">
                      {regularClientsRevenuePercentage}%
                    </div>
                    <div className="small">Revenue from Regular</div>
                  </div>
                </div>
              </div>

              {/* Top Clients */}
              {safeGet(reportData, 'topClients.length', 0) > 0 && (
                <>
                  <h3 className="h5 fw-bold mb-3">Top Clients by Revenue</h3>
                  <div className="table-responsive">
                    <table className="print-table table table-bordered table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>Client Name</th>
                          <th>Client Type</th>
                          <th>Total Spent</th>
                          <th>Purchase Count</th>
                          <th>Avg. Purchase</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.topClients.map((client, index) => (
                          <tr key={index}>
                            <td className="fw-bold">{client.name}</td>
                            <td>
                              <span className={`badge ${client.type === 'Regular' ? 'bg-primary' : 'bg-success'}`}>
                                {client.type}
                              </span>
                            </td>
                            <td className="fw-bold">{formatCurrency(client.totalSpent || 0)}</td>
                            <td>{client.purchaseCount || 0}</td>
                            <td>{formatCurrency(client.avgPurchase || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Recommendations */}
              {safeGet(reportData, 'recommendations.length', 0) > 0 && (
                <>
                  <h2 className="h4 fw-bold border-bottom pb-2 mb-3 mt-4">STRATEGIC RECOMMENDATIONS</h2>
                  <div className="print-recommendation-box bg-warning bg-opacity-10 p-4 mb-4">
                    <h3 className="h5 fw-bold mb-3">Action Items for Performance Enhancement</h3>
                    {reportData.recommendations.map((recommendation, index) => (
                      <div key={index} className="d-flex align-items-start mb-2">
                        <span className="badge bg-warning text-dark rounded-circle me-2">{index + 1}</span>
                        <div className="small">{recommendation}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="border-top pt-4 small text-muted">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div><strong>Report Prepared By:</strong> Branch Management System</div>
                    <div><strong>Report ID:</strong> BPR-{formatDate(new Date(), 'yyyyMMdd')}-{Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
                  </div>
                  <div className="col-md-6 text-md-end">
                    <div><strong>Generated:</strong> {formatDate(new Date(), 'MMMM dd, yyyy HH:mm')}</div>
                    <div><strong>Status:</strong> <span className="text-success fw-bold">FINAL</span></div>
                  </div>
                </div>
                <div className="text-center">
                  <div>This is a computer-generated report. All financial figures are in Indian Rupees (₹).</div>
                  <div>Confidential and Proprietary - For Internal Use Only</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchPerformanceReport;