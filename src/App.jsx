import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Companies from './pages/Companies';
import Clients from './components/Clients';
import ClientDetail from './components/ClientDetail';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import InvoiceDetail from './components/InvoiceDetail';
import PrintInvoice from './components/PrintInvoice';
import BranchPerformanceReport from './components/BranchPerformanceReport'; // ✅ Added
import InvoiceReport from './components/InvoiceReport';

const Layout = ({ children }) => (
  <>
    <Header />
    <Sidebar />
    <main className="p-4">{children}</main>
    <ToastContainer position="bottom-right" autoClose={5000} />
  </>
);

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Default Landing */}
        <Route path="/" element={<Navigate to="/companies" replace />} />

        {/* Companies Routes */}
        <Route path="/companies" element={<Layout><Companies /></Layout>} />

        {/* Client Routes */}
        <Route path="/companies/:companyId/clients" element={<Layout><Clients /></Layout>} />
        <Route path="/companies/:companyId/clients/:clientId" element={<Layout><ClientDetail /></Layout>} />

        {/* Invoice Routes */}
        <Route path="/companies/:companyId/branches/:branchId/invoices" element={<Layout><InvoiceList /></Layout>} />
        <Route path="/companies/:companyId/branches/:branchId/invoices/new" element={<Layout><InvoiceForm /></Layout>} />
        <Route path="/companies/:companyId/branches/:branchId/invoices/:invoiceId" element={<Layout><InvoiceDetail /></Layout>} />
        <Route path="/companies/:companyId/branches/:branchId/invoices/:invoiceId/edit" element={<Layout><InvoiceForm isEdit /></Layout>} />
        <Route path="/companies/:companyId/branches/:branchId/invoices/:invoiceId/print" element={<PrintInvoice />} />

        {/* Branch Performance Report Route */}
        <Route path="/companies/:companyId/branches/:branchId/report" element={<Layout><BranchPerformanceReport /></Layout>} />
        <Route path="/companies/:companyId/invoice-report" element={<InvoiceReport />} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/companies" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
