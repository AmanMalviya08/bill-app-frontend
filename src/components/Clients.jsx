import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import '../pages/Companies.css';

const Clients = () => {
  const { companyId } = useParams();
  const [clients, setClients] = useState([]);
  const [company, setCompany] = useState(null);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    branch: '',
    categoryId: '',
    subcategoryId: '',
    isRegular: false,
    discountPercentage: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [clientsRes, companyRes, branchesRes] = await Promise.all([
          axios.get(`/api/companies/${companyId}/clients`),
          axios.get(`/api/companies/${companyId}`),
          axios.get(`/api/companies/${companyId}/branches`),
        ]);
        setClients(clientsRes.data);
        setCompany(companyRes.data);
        setBranches(branchesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [companyId]);

  // Fetch categories when branch changes
  useEffect(() => {
    if (formData.branch) {
      const selectedBranch = branches.find(b => b._id === formData.branch);
      if (selectedBranch) {
        const activeCategories = selectedBranch.categories?.filter(cat => !cat.deletedAt) || [];
        setCategories(activeCategories);
        setSubcategories([]);
        setFormData(prev => ({ ...prev, categoryId: '', subcategoryId: '' }));
      }
    } else {
      setCategories([]);
      setSubcategories([]);
    }
  }, [formData.branch, branches]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (formData.categoryId) {
      const selectedCategory = categories.find(cat => cat._id === formData.categoryId);
      if (selectedCategory) {
        const activeSubcategories = selectedCategory.subcategories?.filter(sub => !sub.deletedAt) || [];
        setSubcategories(activeSubcategories);
        setFormData(prev => ({ ...prev, subcategoryId: '' }));
      }
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryId, categories]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (isEditing) {
        const { data } = await axios.put(
          `/api/companies/${companyId}/clients/${formData._id}`,
          formData
        );
        setClients(clients.map((c) => (c._id === formData._id ? data : c)));
      } else {
        const { data } = await axios.post(
          `/api/companies/${companyId}/clients`,
          formData
        );
        setClients([...clients, data]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error saving client: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (client) => {
    setFormData({
      ...client,
      discountPercentage: client.discountPercentage || 0,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      branch: '',
      categoryId: '',
      subcategoryId: '',
      isRegular: false,
      discountPercentage: 0,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const markAsRegular = async (clientId) => {
    const discount = prompt(
      'Enter discount percentage for this regular customer (0-100):',
      '0'
    );
    if (discount === null) return;
    const discountValue = Math.min(100, Math.max(0, parseFloat(discount) || 0));

    try {
      setIsLoading(true);
      const { data } = await axios.patch(
        `/api/companies/${companyId}/clients/${clientId}/regular`,
        { discountPercentage: discountValue }
      );
      setClients(clients.map((c) => (c._id === clientId ? data : c)));
    } catch (error) {
      console.error('Error marking client as regular:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      setIsLoading(true);
      await axios.delete(`/api/companies/${companyId}/clients/${clientId}`);
      setClients(clients.filter((c) => c._id !== clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'regular' && client.isRegular) ||
      (filter === 'non-regular' && !client.isRegular);
    return matchesSearch && matchesFilter;
  });

  // Get branch name for display
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b._id === branchId);
    return branch ? `${branch.name} - ${branch.location}` : 'N/A';
  };

  // Get selected subcategory GST for preview
  const getSelectedSubcategoryGST = () => {
    if (formData.subcategoryId) {
      const selectedSubcategory = subcategories.find(sub => sub._id === formData.subcategoryId);
      return selectedSubcategory ? selectedSubcategory.gst || 0 : 0;
    }
    return 0;
  };

  return (
    <div className="container-fluid py-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h2 className="h4 mb-0">Client Management</h2>
          <button onClick={openCreateModal} className="btn btn-light">
            <i className="bi bi-plus-lg me-1"></i> Add Client
          </button>
        </div>

        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="btn-group float-end">
                <button
                  className={`btn ${
                    filter === 'all' ? 'btn-primary' : 'btn-outline-primary'
                  }`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={`btn ${
                    filter === 'regular' ? 'btn-success' : 'btn-outline-success'
                  }`}
                  onClick={() => setFilter('regular')}
                >
                  Regular
                </button>
                <button
                  className={`btn ${
                    filter === 'non-regular'
                      ? 'btn-warning'
                      : 'btn-outline-warning'
                  }`}
                  onClick={() => setFilter('non-regular')}
                >
                  One-Time
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people display-4 text-muted mb-3"></i>
              <p className="text-muted">No clients found</p>
              <button className="btn btn-primary" onClick={openCreateModal}>
                Add First Client
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Branch</th>
                    <th>Type</th>
                    <th>Discount</th>
                    <th>GST Rate</th>
                    <th>Company GST</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client._id}>
                      <td>
                        <Link
                          to={`/companies/${companyId}/clients/${client._id}`}
                          className="text-decoration-none"
                        >
                          {client.name}
                        </Link>
                        {client.address && (
                          <div className="text-muted small">{client.address}</div>
                        )}
                      </td>
                      <td>{client.phone}</td>
                      <td>{client.email || 'N/A'}</td>
                      <td>{getBranchName(client.branch)}</td>
                      <td>
                        <span
                          className={`badge ${client.isRegular ? 'bg-success' : 'bg-warning'}`}
                        >
                          {client.isRegular ? 'Regular' : 'One-Time'}
                        </span>
                      </td>
                      <td>{client.isRegular ? `${client.discountPercentage}%` : 'N/A'}</td>
                      <td>{client.gstFromSubcategory}%</td>
                      <td>{client.companyGSTNumber || 'N/A'}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => openEditModal(client)}
                          >
                            <i className="bi bi-pencil">Edit</i>
                          </button>
                          {!client.isRegular && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => markAsRegular(client._id)}
                            >
                              <i className="bi bi-star-fill">Regular</i>
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => deleteClient(client._id)}
                          >
                            <i className="bi bi-trash">Delete</i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">{isEditing ? 'Edit' : 'Add New'} Client</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setIsModalOpen(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Name + Phone */}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Client Name*</label>
                      <input
                        name="name"
                        required
                        className="form-control"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone*</label>
                      <input
                        name="phone"
                        required
                        className="form-control"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Email + Branch */}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        name="email"
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Branch*</label>
                      <select
                        name="branch"
                        required
                        className="form-select"
                        value={formData.branch}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Branch</option>
                        {branches.map(branch => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name} - {branch.location}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  Category + Subcategory
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Category*</label>
                      <select
                        name="categoryId"
                        required
                        className="form-select"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        disabled={!formData.branch}
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Subcategory*</label>
                      <select
                        name="subcategoryId"
                        required
                        className="form-select"
                        value={formData.subcategoryId}
                        onChange={handleInputChange}
                        disabled={!formData.categoryId}
                      >
                        <option value="">Select Subcategory</option>
                        {subcategories.map(subcategory => (
                          <option key={subcategory._id} value={subcategory._id}>
                            {subcategory.name} (₹{subcategory.price} - {subcategory.gst}% GST)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* GST Info Display */}
                  {formData.subcategoryId && (
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <div className="alert alert-info">
                          <strong>GST Rate:</strong> {getSelectedSubcategoryGST()}%
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="alert alert-info">
                          <strong>Company GST:</strong> {company?.gstNumber || 'Not Set'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Regular Client Toggle */}
                  <div className="row">
                    <div className="col-md-6 mb-3 d-flex align-items-center">
                      <div className="form-check form-switch">
                        <input
                          name="isRegular"
                          className="form-check-input"
                          type="checkbox"
                          checked={formData.isRegular}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label">Regular Client</label>
                      </div>
                    </div>
                    {formData.isRegular && (
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Discount %</label>
                        <input
                          name="discountPercentage"
                          type="number"
                          className="form-control"
                          value={formData.discountPercentage}
                          onChange={handleInputChange}
                          min={0}
                          max={100}
                        />
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      name="address"
                      className="form-control"
                      rows={3}
                      value={formData.address}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading || !formData.branch || !formData.categoryId || !formData.subcategoryId}
                  >
                    {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;