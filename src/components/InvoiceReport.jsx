import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  DatePicker,
  Select,
  Button,
  Space,
  Statistic,
  Divider,
  message
} from 'antd';
import {
  DownloadOutlined,
  FilterOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useParams } from 'react-router-dom';

const { RangePicker } = DatePicker;
const { Option } = Select;

const InvoiceReport = () => {
  const { companyId } = useParams();

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [clients, setClients] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: [moment().subtract(30, 'days'), moment()],
    branchId: null,
    clientId: null,
    paymentStatus: null
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [branchesRes, clientsRes] = await Promise.all([
          axios.get(`/api/companies/${companyId}/branches`),
          axios.get(`/api/companies/${companyId}/clients`)
        ]);
        setBranches(branchesRes.data);
        setClients(clientsRes.data);
      } catch (err) {
        console.error('Failed to fetch options:', err);
      }
    };
    fetchOptions();
  }, [companyId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: filters.dateRange[0].format('YYYY-MM-DD'),
        endDate: filters.dateRange[1].format('YYYY-MM-DD'),
        branchId: filters.branchId,
        clientId: filters.clientId,
        paymentStatus: filters.paymentStatus
      };
      const res = await axios.get(
        `/api/companies/${companyId}/invoices/report`,
        { params }
      );
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to fetch report:', err);
      message.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchInvoices = async (branchId) => {
    setLoading(true);
    try {
      // First clear other filters
      setFilters(prev => ({
        ...prev,
        branchId,
        clientId: null,
        paymentStatus: null
      }));
      
      // Fetch invoices specifically for this branch
      const res = await axios.get(
        `/api/companies/${companyId}/branches/${branchId}/invoices`
      );
      
      // Transform the data to match our report format
      const transformedData = {
        summary: {
          totalInvoices: res.data.length,
          totalAmount: res.data.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
          totalItems: res.data.reduce((sum, inv) => sum + (inv.items?.length || 0), 0),
          paidInvoices: res.data.filter(inv => inv.paymentStatus === 'paid').length,
          pendingInvoices: res.data.filter(inv => inv.paymentStatus === 'pending').length
        },
        invoices: res.data.map(invoice => ({
          ...invoice,
          branch: invoice.branch?.name || 'Unknown Branch',
          client: invoice.client?.name || 'Unknown Client',
          items: invoice.items?.map(item => ({
            ...item,
            category: item.categoryName || 'Uncategorized',
            amount: (item.price || 0) * (item.quantity || 0)
          })) || []
        }))
      };
      
      setReportData(transformedData);
    } catch (err) {
      console.error('Failed to fetch branch invoices:', err);
      message.error('Failed to fetch branch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleBranchClick = (branchId) => {
    fetchBranchInvoices(branchId);
  };

  const columns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text, record) => (
        <a href={`/invoices/${record.invoiceId}`} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: date => moment(date).format('DD MMM YYYY')
    },
    {
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
      render: (text, record) => (
        <a 
          onClick={() => handleBranchClick(record.branchId)} 
          style={{ cursor: 'pointer', color: '#1890ff' }}
        >
          {text}
        </a>
      )
    },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client'
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: status => (
        <span className={`status-${status}`}>
          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
        </span>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: amount => `₹${amount.toLocaleString('en-IN')}`,
      align: 'right'
    }
  ];

  const expandedRowRender = record => {
    const itemColumns = [
      {
        title: 'Item',
        dataIndex: 'name',
        key: 'name'
      },
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category'
      },
      {
        title: 'Qty',
        dataIndex: 'quantity',
        key: 'quantity',
        align: 'right'
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        render: price => `₹${price.toLocaleString('en-IN')}`,
        align: 'right'
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: amount => `₹${amount.toLocaleString('en-IN')}`,
        align: 'right'
      }
    ];

    return (
      <Table
        columns={itemColumns}
        dataSource={record.items}
        pagination={false}
        size="small"
        bordered
      />
    );
  };

  return (
    <div className="invoice-report">
      <Card
        title="Invoice Report"
        extra={
          <Space>
            <Button icon={<PrinterOutlined />}>Print</Button>
            <Button type="primary" icon={<DownloadOutlined />}>
              Export
            </Button>
          </Space>
        }
      >
        <div className="report-filters">
          <Space size="large" wrap>
            <RangePicker
              value={filters.dateRange}
              onChange={dates => handleFilterChange('dateRange', dates)}
              disabledDate={current => current && current > moment().endOf('day')}
            />

            <Select
              placeholder="Select Branch"
              style={{ width: 200 }}
              allowClear
              value={filters.branchId}
              onChange={val => handleFilterChange('branchId', val)}
            >
              {branches.map(branch => (
                <Option key={branch._id} value={branch._id}>
                  {branch.name}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Select Client"
              style={{ width: 200 }}
              allowClear
              value={filters.clientId}
              onChange={val => handleFilterChange('clientId', val)}
            >
              {clients.map(client => (
                <Option key={client._id} value={client._id}>
                  {client.name}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Payment Status"
              style={{ width: 150 }}
              allowClear
              value={filters.paymentStatus}
              onChange={val => handleFilterChange('paymentStatus', val)}
            >
              <Option value="paid">Paid</Option>
              <Option value="pending">Pending</Option>
              <Option value="partially_paid">Partially Paid</Option>
            </Select>

            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={fetchReport}
              loading={loading}
            >
              Generate Report
            </Button>
          </Space>
        </div>

        {reportData && (
          <>
            <Divider />
            <div className="report-summary">
              <Space size="large" wrap>
                <Statistic title="Total Invoices" value={reportData.summary?.totalInvoices || 0} />
                <Statistic
                  title="Total Amount"
                  value={`₹${(reportData.summary?.totalAmount || 0).toLocaleString('en-IN')}`}
                />
                <Statistic title="Total Items" value={reportData.summary?.totalItems || 0} />
                <Statistic title="Paid Invoices" value={reportData.summary?.paidInvoices || 0} />
                <Statistic title="Pending Invoices" value={reportData.summary?.pendingInvoices || 0} />
              </Space>
            </div>

            <Divider />

            <Table
              columns={columns}
              dataSource={reportData.invoices}
              rowKey="invoiceId"
              expandable={{ expandedRowRender }}
              pagination={{ pageSize: 10 }}
              loading={loading}
              bordered
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right">
                      <strong>Grand Total:</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong>
                        ₹{(reportData.summary?.totalAmount || 0).toLocaleString('en-IN')}
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default InvoiceReport;