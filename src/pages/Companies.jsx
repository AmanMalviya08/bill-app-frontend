/** @format */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import axios from "axios";
import "./Companies.css";
// import { report } from "../../../backend/routes/reportsRoutes";

const Companies = () => {
  // State for companies, branches, and products
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [companyClients, setCompanyClients] = useState([]);

  // report

  const [reportData, setReportData] = useState(null);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState(""); // 'category' or 'subcategory'
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState(""); // 'uploading', 'processing', 'success', 'error'






  // report

  useEffect(() => {
  if (selectedCompany && selectedBranch) {
    const fetchReportData = async () => {
      try {
        const { data } = await axios.get(
          `/api/companies/${selectedCompany._id}/branches/${selectedBranch._id}/report`
        );
        setReportData(data);
      } catch (error) {
        console.error("Error fetching report data:", error);
        addNotification("Failed to load report data", "danger");
      }
    };

    fetchReportData();
  }
}, [selectedCompany, selectedBranch]);






  // Form data states
  const [formData, setFormData] = useState({
    name: "",
    gstNumber: "",
    address: "",
    ownerName: "",
    phone: "",
    email: "",
    backgroundPhoto: null,
  });

  const [branchFormData, setBranchFormData] = useState({
    name: "",
    location: "",
    managerName: "",
    isDefault: false,
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
  });

  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: "",
    description: "",
    price: 0,
    discount: 0,
    gst: 0,
  });

  // Notification state
  const [notifications, setNotifications] = useState([]);

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await axios.get("/api/companies");
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
        addNotification("Failed to load companies", "danger");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch branches when a company is selected
  useEffect(() => {
    if (selectedCompany) {
      const fetchBranches = async () => {
        try {
          setIsLoading(true);
          const { data } = await axios.get(
            `/api/companies/${selectedCompany._id}/branches`
          );
          setBranches(data);
          setSelectedBranch(null);
          setSelectedCategory(null);
          setSelectedSubcategory(null);
        } catch (error) {
          console.error("Error fetching branches:", error);
          addNotification("Failed to load branches", "danger");
        } finally {
          setIsLoading(false);
        }
      };

      fetchBranches();
    }
  }, [selectedCompany]);

  // Fetch products when a branch is selected

  // Add notification function
  const addNotification = (message, type = "success") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  // Company CRUD operations
  const openCompanyModal = (company = null) => {
    if (company) {
      setFormData(company);
      setIsEditing(true);
    } else {
      setFormData({
        name: "",
        gstNumber: "",
        address: "",
        ownerName: "",
        phone: "",
        email: "",
        backgroundPhoto: null,
      });
      setIsEditing(false);
    }
    setIsCompanyModalOpen(true);
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const formDataToSend = new FormData();
      for (const key in formData) {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      }

      if (isEditing) {
        await axios.put(`/api/companies/${formData._id}`, formDataToSend);
        setCompanies(
          companies.map((c) => (c._id === formData._id ? formData : c))
        );
        addNotification("Company updated successfully!");
      } else {
        const { data } = await axios.post("/api/companies", formDataToSend);
        setCompanies([...companies, data]);
        addNotification("Company created successfully!");
      }

      setIsCompanyModalOpen(false);
    } catch (error) {
      console.error("Error saving company:", error);
      addNotification(
        `Failed to ${isEditing ? "update" : "create"} company`,
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCompany = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this company? This will delete all associated branches and products."
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await axios.delete(`/api/companies/${id}`);
      setCompanies(companies.filter((company) => company._id !== id));
      addNotification("Company deleted successfully!");

      if (selectedCompany?._id === id) {
        setSelectedCompany(null);
        setBranches([]);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      addNotification("Failed to delete company", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  // Branch CRUD operations
  const openBranchModal = (branch = null) => {
    if (branch) {
      setBranchFormData(branch);
      setIsEditing(true);
    } else {
      setBranchFormData({
        name: "",
        location: "",
        managerName: "",
        isDefault: false,
      });
      setIsEditing(false);
    }
    setIsBranchModalOpen(true);
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing) {
        const { data } = await axios.put(
          `/api/companies/${selectedCompany._id}/branches/${branchFormData._id}`,
          branchFormData
        );
        setBranches((prev) =>
          prev.map((branch) =>
            branch._id === branchFormData._id ? data : branch
          )
        );
        if (selectedBranch?._id === branchFormData._id) {
          setSelectedBranch(data);
        }
        addNotification("Branch updated successfully!");
      } else {
        const { data } = await axios.post(
          `/api/companies/${selectedCompany._id}/branches`,
          branchFormData
        );
        setBranches((prev) => [...prev, data]);
        addNotification("Branch created successfully!");
      }

      setIsBranchModalOpen(false);
    } catch (error) {
      console.error("Error saving branch:", error);
      addNotification(
        `Failed to ${isEditing ? "update" : "create"} branch`,
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBranch = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this branch? This will delete all associated categories and products."
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await axios.delete(
        `/api/companies/${selectedCompany._id}/branches/${id}`
      );
      setBranches(branches.filter((branch) => branch._id !== id));
      addNotification("Branch deleted successfully!");

      if (selectedBranch?._id === id) {
        setSelectedBranch(null);
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error("Error deleting branch:", error);
      addNotification("Failed to delete branch", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  // Category CRUD operations
  const openCategoryModal = (category = null) => {
    if (category) {
      setCategoryFormData(category);
      setIsEditing(true);
    } else {
      setCategoryFormData({
        name: "",
        description: "",
      });
      setIsEditing(false);
    }
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing) {
        const { data } = await axios.put(
          `/api/companies/${selectedCompany._id}/branches/${selectedBranch._id}/categories/${categoryFormData._id}`,
          categoryFormData
        );
        setBranches((prev) =>
          prev.map((branch) =>
            branch._id === selectedBranch._id ? data : branch
          )
        );
        setSelectedBranch(data);
        addNotification("Category updated successfully!");
      } else {
        const { data } = await axios.post(
          `/api/companies/${selectedCompany._id}/branches/${selectedBranch._id}/categories`,
          categoryFormData
        );
        setBranches((prev) =>
          prev.map((branch) =>
            branch._id === selectedBranch._id ? data : branch
          )
        );
        setSelectedBranch(data);
        addNotification("Category created successfully!");
      }

      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
      addNotification(
        `Failed to ${isEditing ? "update" : "create"} category`,
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (categoryId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category? This will delete all associated subcategories."
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await axios.delete(
        `/api/companies/${selectedCompany._id}/branches/${selectedBranch._id}/categories/${categoryId}`
      );

      // Refresh the branch data
      const { data } = await axios.get(
        `/api/companies/${selectedCompany._id}/branches`
      );
      setBranches(data);
      const updatedBranch = data.find((b) => b._id === selectedBranch._id);
      setSelectedBranch(updatedBranch);

      if (selectedCategory?._id === categoryId) {
        setSelectedCategory(null);
      }

      addNotification("Category deleted successfully!");
    } catch (error) {
      console.error("Error deleting category:", error);
      addNotification("Failed to delete category", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  // Subcategory CRUD operations
  const openSubcategoryModal = (subcategory = null) => {
    if (subcategory) {
      setSubcategoryFormData(subcategory);
      setIsEditing(true);
    } else {
      setSubcategoryFormData({
        name: "",
        description: "",
        price: 0,
        discount: 0,
        gst: 0,
      });
      setIsEditing(false);
    }
    setIsSubcategoryModalOpen(true);
  };

  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing) {
        const { data } = await axios.put(
          `/api/companies/${selectedCompany._id}/branches/${selectedBranch._id}/categories/${selectedCategory._id}/subcategories/${subcategoryFormData._id}`,
          subcategoryFormData
        );
        setBranches((prev) =>
          prev.map((branch) =>
            branch._id === selectedBranch._id ? data : branch
          )
        );
        setSelectedBranch(data);
        const updatedCategory = data.categories.find(
          (c) => c._id === selectedCategory._id
        );
        setSelectedCategory(updatedCategory);
        addNotification("Subcategory updated successfully!");
      } else {
        const { data } = await axios.post(
          `/api/companies/${selectedCompany._id}/branches/${selectedBranch._id}/categories/${selectedCategory._id}/subcategories`,
          subcategoryFormData
        );
        setBranches((prev) =>
          prev.map((branch) =>
            branch._id === selectedBranch._id ? data : branch
          )
        );
        setSelectedBranch(data);
        const updatedCategory = data.categories.find(
          (c) => c._id === selectedCategory._id
        );
        setSelectedCategory(updatedCategory);
        addNotification("Subcategory created successfully!");
      }

      setIsSubcategoryModalOpen(false);
    } catch (error) {
      console.error("Error saving subcategory:", error);
      addNotification(
        `Failed to ${isEditing ? "update" : "create"} subcategory`,
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubcategory = async (subcategoryId) => {
    if (!window.confirm("Are you sure you want to delete this subcategory?")) {
      return;
    }

    try {
      setIsLoading(true);
      await axios.delete(
        `/api/companies/${selectedCompany._id}/branches/${selectedBranch._id}/categories/${selectedCategory._id}/subcategories/${subcategoryId}`
      );

      // Refresh the branch data
      const { data } = await axios.get(
        `/api/companies/${selectedCompany._id}/branches`
      );
      setBranches(data);
      const updatedBranch = data.find((b) => b._id === selectedBranch._id);
      setSelectedBranch(updatedBranch);
      const updatedCategory = updatedBranch.categories.find(
        (c) => c._id === selectedCategory._id
      );
      setSelectedCategory(updatedCategory);

      addNotification("Subcategory deleted successfully!");
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      addNotification("Failed to delete subcategory", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  // Input change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBranchInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBranchFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubcategoryInputChange = (e) => {
    const { name, value } = e.target;
    setSubcategoryFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "discount" || name === "gst"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, backgroundPhoto: e.target.files[0] }));
  };

  // Function for handling Excel import
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile || !importType) return;

    setImportStatus("uploading");
    setImportProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", importFile);

      let endpoint = "";
      if (importType === "category") {
        endpoint = `/api/companies/${selectedCompany._id}/branches/${selectedBranch._id}/categories/import`;
      } else if (importType === "subcategory") {
        endpoint = `/api/companies/${selectedCompany._id}/branches/${selectedBranch._id}/categories/${selectedCategory._id}/subcategories/import`;
      }

      const config = {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setImportProgress(percentCompleted);
        },
      };

      setImportStatus("processing");
      const { data } = await axios.post(endpoint, formData, config);

      // Refresh the data after successful import
      const { data: branchData } = await axios.get(
        `/api/companies/${selectedCompany._id}/branches/${selectedBranch._id}`
      );
      setSelectedBranch(branchData);

      if (importType === "subcategory") {
        const updatedCategory = branchData.categories.find(
          (c) => c._id === selectedCategory._id
        );
        setSelectedCategory(updatedCategory);
      }

      setImportStatus("success");
      addNotification(
        `${
          importType === "category" ? "Categories" : "Subcategories"
        } imported successfully!`
      );
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportStatus("");
        setImportProgress(0);
      }, 1500);
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus("error");
      addNotification(
        `Failed to import ${
          importType === "category" ? "categories" : "subcategories"
        }`,
        "danger"
      );
    }
  };

  // Function to open import modal
  const openImportModal = (type) => {
    if (type === "category" && !selectedBranch) {
      addNotification("Please select a branch first", "warning");
      return;
    }
    if (type === "subcategory" && !selectedCategory) {
      addNotification("Please select a category first", "warning");
      return;
    }

    setImportType(type);
    setIsImportModalOpen(true);
    setImportFile(null);
    setImportStatus("");
    setImportProgress(0);
  };

  // Add this useEffect to fetch clients when company is selected
  useEffect(() => {
    if (selectedCompany) {
      const fetchClients = async () => {
        try {
          const { data } = await axios.get(
            `/api/companies/${selectedCompany._id}/clients`
          );
          setCompanyClients(data);
        } catch (error) {
          console.error("Error fetching clients:", error);
          addNotification("Failed to load clients", "danger");
        }
      };

      fetchClients();
    }
  }, [selectedCompany]);

  // Helper function to calculate final price
  const calculateFinalPrice = (price, discount, gst) => {
    const priceNum = parseFloat(price) || 0;
    const discountNum = parseFloat(discount) || 0;
    const gstNum = parseFloat(gst) || 0;

    const discountedPrice = priceNum - (priceNum * discountNum) / 100;
    const finalPrice = discountedPrice + (discountedPrice * gstNum) / 100;

    return finalPrice.toFixed(2);
  };

  return (
    <div className='container-fluid py-4'>
      {/* Notifications */}
      <div className='position-fixed top-0 end-0 p-3' style={{ zIndex: 1050 }}>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`alert alert-${notification.type} alert-dismissible fade show shadow-sm`}
            role='alert'>
            {notification.message}
            <button
              type='button'
              className='btn-close'
              onClick={() =>
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== notification.id)
                )
              }></button>
          </div>
        ))}
      </div>

      <div className='row g-4'>
        {/* Companies Column */}
        <div className='col-lg-3'>
          <div className='card border-0 shadow-sm h-100'>
            <div className='card-body'>
              <div className='d-flex justify-content-between align-items-center mb-4'>
                <h2 className='h3 fw-bold mb-0 text-primary'>Companies</h2>
                <button
                  onClick={() => openCompanyModal()}
                  className='btn btn-primary fw-bold d-flex align-items-center'
                  disabled={isLoading}>
                  <i className='bi bi-plus-lg me-1'></i> Add
                </button>
              </div>

              {companies.length === 0 ? (
                <div className='text-center py-5'>
                  <i className='bi bi-building display-4 text-muted mb-3'></i>
                  <p className='text-muted'>No companies found</p>
                </div>
              ) : (
                <div className='overflow-auto' style={{ maxHeight: "600px" }}>
                  {companies.map((company) => (
                    <div
                      key={company._id}
                      className={`card mb-2 cursor-pointer ${
                        selectedCompany?._id === company._id
                          ? "border-primary bg-primary bg-opacity-10"
                          : "border-light"
                      }`}
                      onClick={() => setSelectedCompany(company)}>
                      <div className='card-body p-3'>
                        <div className='d-flex justify-content-between align-items-start'>
                          <div>
                            <h6 className='fw-bold mb-1'>{company.name}</h6>
                            <small className='text-muted'>
                              {company.ownerName}
                            </small>
                            <div className='mt-2'>
                              <small className='text-muted d-block'>
                                <i className='bi bi-envelope me-1'></i>{" "}
                                {company.email}
                              </small>
                              <small className='text-muted d-block'>
                                <i className='bi bi-telephone me-1'></i>{" "}
                                {company.phone}
                              </small>
                            </div>
                          </div>
                          <div className='btn-group'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCompanyModal(company);
                              }}
                              className='btn btn-sm btn-outline-primary'>
                              <i className='bi bi-pencil'>Edit</i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCompany(company._id);
                              }}
                              className='btn btn-sm btn-outline-danger'>
                              <i className='bi bi-trash'>Delete</i>
                            </button>
                          </div>
                        </div>
                        {selectedCompany?._id === company._id && (
                          <div className='mt-2 pt-2 border-top'>
                            <small className='d-block'>
                              <strong>GST:</strong> {company.gstNumber || "N/A"}
                            </small>
                            <small className='d-block'>
                              <strong>Address:</strong>{" "}
                              {company.address || "N/A"}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Branches Column */}
        <div className='col-lg-3'>
          <div className='card border-0 shadow-sm h-100'>
            <div className='card-body'>
              <div className='d-flex justify-content-between align-items-center mb-4'>
                <h2 className='h3 fw-bold mb-0 text-primary'>
                  {selectedCompany
                    ? `${selectedCompany.name} Branches`
                    : "Branches"}
                </h2>
                {selectedCompany && (
                  <button
                    onClick={() => openBranchModal()}
                    className='btn btn-success fw-bold d-flex align-items-center'
                    disabled={isLoading}>
                    <i className='bi bi-plus-lg me-1'></i> Add
                  </button>
                )}
              </div>

              {!selectedCompany ? (
                <div className='text-center py-5'>
                  <i className='bi bi-shop display-4 text-muted mb-3'></i>
                  <p className='text-muted'>
                    Select a company to view branches
                  </p>
                </div>
              ) : branches.length === 0 ? (
                <div className='text-center py-5'>
                  <i className='bi bi-shop display-4 text-muted mb-3'></i>
                  <p className='text-muted mb-4'>No branches found</p>
                  <button
                    onClick={() => openBranchModal()}
                    className='btn btn-outline-success'>
                    <i className='bi bi-plus-lg me-1'></i> Add Branch
                  </button>
                </div>
              ) : (
                <div className='overflow-auto' style={{ maxHeight: "600px" }}>
                  {branches.map((branch) => (
                    <div
                      key={branch._id}
                      className={`card mb-2 cursor-pointer ${
                        selectedBranch?._id === branch._id
                          ? "border-success bg-success bg-opacity-10"
                          : "border-light"
                      }`}
                      onClick={() => {
                        setSelectedBranch(branch);
                        setSelectedCategory(null);
                        setSelectedSubcategory(null);
                      }}>
                      <div className='card-body p-3'>
                        <div className='d-flex justify-content-between align-items-start'>
                          <div>
                            <h6 className='fw-bold mb-1'>{branch.name}</h6>
                            <small className='text-muted'>
                              {branch.location}
                            </small>
                            {branch.isDefault && (
                              <div>
                                <small className='text-success'>
                                  <i className='bi bi-check-circle me-1'></i>
                                  Default
                                </small>
                              </div>
                            )}
                          </div>
                          <div className='btn-group'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openBranchModal(branch);
                              }}
                              className='btn btn-sm btn-outline-primary'>
                              <i className='bi bi-pencil'>Edit</i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBranch(branch._id);
                              }}
                              className='btn btn-sm btn-outline-danger'>
                              <i className='bi bi-trash'>Delete</i>
                            </button>
                          </div>
                        </div>
                        {selectedBranch?._id === branch._id && (
                          <div className='mt-2 pt-2 border-top'>
                            <small className='d-block'>
                              <strong>Manager:</strong>{" "}
                              {branch.managerName || "N/A"}
                            </small>
                            <small className='d-block'>
                              <strong>Categories:</strong>{" "}
                              {branch.categories?.filter((c) => !c.deletedAt)
                                .length || 0}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories Column */}
        {selectedBranch && (
          <div className='col-lg-3'>
            <div className='card border-0 shadow-sm h-100'>
              <div className='card-body'>
                <div className='d-flex justify-content-between align-items-center mb-4'>
                  <h2 className='h3 fw-bold mb-0 text-primary'>
                    {selectedBranch
                      ? `${selectedBranch.name} Categories`
                      : "Categories"}
                  </h2>
                  {selectedBranch && (
                    <div className='btn-group'>
                      <button
                        onClick={() => openCategoryModal()}
                        className='btn btn-warning fw-bold d-flex align-items-center'
                        disabled={isLoading}>
                        <i className='bi bi-plus-lg me-1'></i> Add
                      </button>
                      {/* <button
                        onClick={() => openImportModal("category")}
                        className='btn btn-secondary fw-bold d-flex align-items-center'
                        disabled={isLoading}>
                        <i className='bi bi-upload me-1'></i> Import
                      </button> */}
                    </div>
                  )}
                </div>

                {!selectedBranch ? (
                  <div className='text-center py-5'>
                    <i className='bi bi-tags display-4 text-muted mb-3'></i>
                    <p className='text-muted'>
                      Select a branch to view categories
                    </p>
                  </div>
                ) : !selectedBranch.categories ||
                  selectedBranch.categories.filter((c) => !c.deletedAt)
                    .length === 0 ? (
                  <div className='text-center py-5'>
                    <i className='bi bi-tags display-4 text-muted mb-3'></i>
                    <p className='text-muted mb-4'>No categories found</p>
                    <button
                      onClick={() => openCategoryModal()}
                      className='btn btn-outline-warning'>
                      <i className='bi bi-plus-lg me-1'></i> Add Category
                    </button>
                  </div>
                ) : (
                  <div className='overflow-auto' style={{ maxHeight: "600px" }}>
                    {selectedBranch.categories
                      .filter((category) => !category.deletedAt)
                      .map((category) => (
                        <div
                          key={category._id}
                          className={`card mb-2 cursor-pointer ${
                            selectedCategory?._id === category._id
                              ? "border-warning bg-warning bg-opacity-10"
                              : "border-light"
                          }`}
                          onClick={() => {
                            setSelectedCategory(category);
                            setSelectedSubcategory(null);
                          }}>
                          <div className='card-body p-3'>
                            <div className='d-flex justify-content-between align-items-start'>
                              <div>
                                <h6 className='fw-bold mb-1'>
                                  {category.name}
                                </h6>
                                {category.description && (
                                  <small className='text-muted'>
                                    {category.description}
                                  </small>
                                )}
                                <div>
                                  <small className='text-info'>
                                    {category.subcategories
                                      ? category.subcategories.filter(
                                          (s) => !s.deletedAt
                                        ).length
                                      : 0}{" "}
                                    Product
                                  </small>
                                </div>
                              </div>
                              <div className='btn-group'>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openCategoryModal(category);
                                  }}
                                  className='btn btn-sm btn-outline-primary'>
                                  <i className='bi bi-pencil'>Edit</i>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCategory(category._id);
                                  }}
                                  className='btn btn-sm btn-outline-danger'>
                                  <i className='bi bi-trash'>Delete</i>
                                </button>
                              </div>
                            </div>
                            {selectedCategory?._id === category._id && (
                              <div className='mt-2 pt-2 border-top'>
                                <small className='d-block'>
                                  <strong>Created:</strong>{" "}
                                  {new Date(
                                    category.createdAt
                                  ).toLocaleDateString()}
                                </small>
                                {category.updatedAt && (
                                  <small className='d-block'>
                                    <strong>Updated:</strong>{" "}
                                    {new Date(
                                      category.updatedAt
                                    ).toLocaleDateString()}
                                  </small>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subcategories Column */}
        {selectedCategory && (
          <div className='col-lg-3'>
            <div className='card border-0 shadow-sm h-100'>
              <div className='card-body'>
                <div className='d-flex justify-content-between align-items-center mb-4'>
                  <h2 className='h3 fw-bold mb-0 text-info'>
                    {selectedCategory
                      ? `${selectedCategory.name} Product`
                      : "Product"}
                  </h2>
                  {selectedCategory && (
                    <div className='btn-group'>
                      <button
                        onClick={() => openSubcategoryModal()}
                        className='btn btn-info fw-bold d-flex align-items-center'
                        disabled={isLoading}>
                        <i className='bi bi-plus-lg me-1'></i> Add
                      </button>
                      {/* <button
                        onClick={() => openImportModal("subcategory")}
                        className='btn btn-secondary fw-bold d-flex align-items-center'
                        disabled={isLoading}>
                        <i className='bi bi-upload me-1'></i> Import
                      </button> */}
                    </div>
                  )}
                </div>

                {!selectedCategory ? (
                  <div className='text-center py-5'>
                    <i className='bi bi-bookmark display-4 text-muted mb-3'></i>
                    <p className='text-muted'>
                      Select a category to view Product
                    </p>
                  </div>
                ) : !selectedCategory.subcategories ||
                  selectedCategory.subcategories.filter((s) => !s.deletedAt)
                    .length === 0 ? (
                  <div className='text-center py-5'>
                    <i className='bi bi-bookmark display-4 text-muted mb-3'></i>
                    <p className='text-muted mb-4'>No Product found</p>
                    <button
                      onClick={() => openSubcategoryModal()}
                      className='btn btn-outline-info'>
                      <i className='bi bi-plus-lg me-1'></i> Add Product
                    </button>
                  </div>
                ) : (
                  <div className='overflow-auto' style={{ maxHeight: "600px" }}>
                    {selectedCategory.subcategories
                      .filter((subcategory) => !subcategory.deletedAt)
                      .map((subcategory) => (
                        <div
                          key={subcategory._id}
                          className={`card mb-2 cursor-pointer ${
                            selectedSubcategory?._id === subcategory._id
                              ? "border-info bg-info bg-opacity-10"
                              : "border-light"
                          }`}
                          onClick={() => setSelectedSubcategory(subcategory)}>
                          <div className='card-body p-3'>
                            <div className='d-flex justify-content-between align-items-start'>
                              <div>
                                <h6 className='fw-bold mb-1'>
                                  {subcategory.name}
                                </h6>
                                {subcategory.description && (
                                  <small className='text-muted'>
                                    {subcategory.description}
                                  </small>
                                )}
                                <div className='mt-2'>
                                  <small className='text-success d-block'>
                                    <strong>Price:</strong> ₹{subcategory.price}
                                  </small>
                                  {subcategory.discount > 0 && (
                                    <small className='text-danger d-block'>
                                      <strong>Discount:</strong>{" "}
                                      {subcategory.discount}%
                                    </small>
                                  )}
                                  <small className='text-primary d-block'>
                                    <strong>Final Price:</strong> ₹
                                    {calculateFinalPrice(
                                      subcategory.price,
                                      subcategory.discount,
                                      subcategory.gst
                                    )}
                                  </small>
                                </div>
                              </div>
                              <div className='btn-group'>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openSubcategoryModal(subcategory);
                                  }}
                                  className='btn btn-sm btn-outline-primary'>
                                  <i className='bi bi-pencil'>Edit</i>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSubcategory(subcategory._id);
                                  }}
                                  className='btn btn-sm btn-outline-danger'>
                                  <i className='bi bi-trash'>Delete</i>
                                </button>
                              </div>
                            </div>
                            {selectedSubcategory?._id === subcategory._id && (
                              <div className='mt-2 pt-2 border-top'>
                                <small className='d-block'>
                                  <strong>GST:</strong> {subcategory.gst || 0}%
                                </small>
                                <small className='d-block'>
                                  <strong>Created:</strong>{" "}
                                  {new Date(
                                    subcategory.createdAt
                                  ).toLocaleDateString()}
                                </small>
                                {subcategory.updatedAt && (
                                  <small className='d-block'>
                                    <strong>Updated:</strong>{" "}
                                    {new Date(
                                      subcategory.updatedAt
                                    ).toLocaleDateString()}
                                  </small>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overview Section */}

        {/* Overview Section */}
        <div className='col-12 mt-4'>
          <div className='card border-0 shadow-sm hover-scale'>
            <div className='card-body'>
              <h2 className='h3 fw-bold mb-4'>Company Overview</h2>
              <div className='row g-4'>
                {/* Total Companies Card */}
                <div className='col-md-3'>
                  <div className='card bg-primary bg-opacity-10 border-primary border-opacity-25 h-100 hover-lift transition-all'>
                    <div className='card-body text-center py-4'>
                      <i className='bi bi-buildings display-5 text-primary mb-3'></i>
                      <h3 className='h5 text-primary'>Total Companies</h3>
                      <p className='display-6 fw-bold text-primary'>
                        {companies.length}
                      </p>
                      <small className='text-muted'>
                        {selectedCompany
                          ? `${selectedCompany.name} selected`
                          : "No company selected"}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Total Branches Card */}
                <div className='col-md-3'>
                  <div className='card bg-success bg-opacity-10 border-success border-opacity-25 h-100 hover-lift transition-all'>
                    <div className='card-body text-center py-4'>
                      <i className='bi bi-shop display-5 text-success mb-3'></i>
                      <h3 className='h5 text-success'>Total Branches</h3>
                      <p className='display-6 fw-bold text-success'>
                        {selectedCompany ? branches.length : "—"}
                      </p>
                      <small className='text-muted'>
                        {selectedBranch
                          ? `${selectedBranch.name} selected`
                          : "No branch selected"}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Total Categories Card */}
                <div className='col-md-3'>
                  <div className='card bg-warning bg-opacity-10 border-warning border-opacity-25 h-100 hover-lift transition-all'>
                    <div className='card-body text-center py-4'>
                      <i className='bi bi-tags display-5 text-warning mb-3'></i>
                      <h3 className='h5 text-warning'>Total Categories</h3>
                      <p className='display-6 fw-bold text-warning'>
                        {selectedBranch
                          ? selectedBranch.categories
                            ? selectedBranch.categories.filter(
                                (c) => !c.deletedAt
                              ).length
                            : 0
                          : "—"}
                      </p>
                      <small className='text-muted'>
                        {selectedCategory
                          ? `${selectedCategory.name} selected`
                          : "No category selected"}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Total Subcategories Card */}
                <div className='col-md-3'>
                  <div className='card bg-info bg-opacity-10 border-info border-opacity-25 h-100 hover-lift transition-all'>
                    <div className='card-body text-center py-4'>
                      <i className='bi bi-bookmark display-5 text-info mb-3'></i>
                      <h3 className='h5 text-info'>Total Product</h3>
                      <p className='display-6 fw-bold text-info'>
                        {selectedCategory
                          ? selectedCategory.subcategories
                            ? selectedCategory.subcategories.filter(
                                (s) => !s.deletedAt
                              ).length
                            : 0
                          : "—"}
                      </p>
                      <small className='text-muted'>
                        {selectedCategory ? "In selected category" : "—"}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Overview */}
              {selectedCompany && (
                <div className='mt-4'>
                  <h3 className='h4 fw-bold mb-3'>Detailed Overview</h3>
                  <div className='row'>
                    <div className='col-md-6'>
                      <div className='card mb-3 hover-lift transition-all'>
                        <div className='card-header bg-primary text-white'>
                          <h4 className='h5 mb-0'>Company Details</h4>
                        </div>
                        <div className='card-body'>
                          <div className='row'>
                            <div className='col-md-6'>
                              <p>
                                <strong>Name:</strong> {selectedCompany.name}
                              </p>
                              <p>
                                <strong>Owner:</strong>{" "}
                                {selectedCompany.ownerName}
                              </p>
                              <p>
                                <strong>GST:</strong>{" "}
                                {selectedCompany.gstNumber || "N/A"}
                              </p>
                            </div>
                            <div className='col-md-6'>
                              <p>
                                <strong>Email:</strong>{" "}
                                {selectedCompany.email || "N/A"}
                              </p>
                              <p>
                                <strong>Phone:</strong>{" "}
                                {selectedCompany.phone || "N/A"}
                              </p>
                              <p>
                                <strong>Branches:</strong> {branches.length}
                              </p>
                            </div>
                          </div>
                          {selectedCompany.address && (
                            <p className='mt-2'>
                              <strong>Address:</strong>{" "}
                              {selectedCompany.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedBranch && (
                      <div className='col-md-6'>
                        <div className='card mb-3 hover-lift transition-all'>
                          <div className='card-header bg-success text-white'>
                            <h4 className='h5 mb-0'>Branch Details</h4>
                          </div>
                          <div className='card-body'>
                            <div className='row'>
                              <div className='col-md-6'>
                                <p>
                                  <strong>Name:</strong> {selectedBranch.name}
                                </p>
                                <p>
                                  <strong>Location:</strong>{" "}
                                  {selectedBranch.location}
                                </p>
                                <p>
                                  <strong>Status:</strong>{" "}
                                  {selectedBranch.isDefault
                                    ? "Default"
                                    : "Regular"}
                                </p>
                              </div>
                              <div className='col-md-6'>
                                <p>
                                  <strong>Manager:</strong>{" "}
                                  {selectedBranch.managerName || "N/A"}
                                </p>
                                <p>
                                  <strong>Categories:</strong>{" "}
                                  {selectedBranch.categories?.filter(
                                    (c) => !c.deletedAt
                                  ).length || 0}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedCategory && (
                      <div className='col-md-6'>
                        <div className='card mb-3 hover-lift transition-all'>
                          <div className='card-header bg-warning text-white'>
                            <h4 className='h5 mb-0'>Category Details</h4>
                          </div>
                          <div className='card-body'>
                            <div className='row'>
                              <div className='col-md-6'>
                                <p>
                                  <strong>Name:</strong> {selectedCategory.name}
                                </p>
                                <p>
                                  <strong>Product:</strong>{" "}
                                  {selectedCategory.subcategories?.filter(
                                    (s) => !s.deletedAt
                                  ).length || 0}
                                </p>
                              </div>
                              <div className='col-md-6'>
                                <p>
                                  <strong>Created:</strong>{" "}
                                  {new Date(
                                    selectedCategory.createdAt
                                  ).toLocaleDateString()}
                                </p>
                                {selectedCategory.updatedAt && (
                                  <p>
                                    <strong>Updated:</strong>{" "}
                                    {new Date(
                                      selectedCategory.updatedAt
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            {selectedCategory.description && (
                              <p className='mt-2'>
                                <strong>Description:</strong>{" "}
                                {selectedCategory.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company Modal */}
        {isCompanyModalOpen && (
          <div
            className='modal fade show d-block'
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content border-0 shadow-lg'>
                <div className='modal-header bg-primary text-white'>
                  <h5 className='modal-title'>
                    {isEditing ? "Edit Company" : "Add Company"}
                  </h5>
                  <button
                    type='button'
                    className='btn-close btn-close-white'
                    onClick={() => setIsCompanyModalOpen(false)}></button>
                </div>
                <form onSubmit={handleCompanySubmit}>
                  <div className='modal-body'>
                    <div className='mb-3'>
                      <label className='form-label'>Company Name</label>
                      <input
                        type='text'
                        className='form-control'
                        name='name'
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>GST Number</label>
                      <input
                        type='text'
                        className='form-control'
                        name='gstNumber'
                        value={formData.gstNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>Address</label>
                      <textarea
                        className='form-control'
                        name='address'
                        value={formData.address}
                        onChange={handleInputChange}
                        rows='3'></textarea>
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>Owner Name</label>
                      <input
                        type='text'
                        className='form-control'
                        name='ownerName'
                        value={formData.ownerName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>Phone</label>
                      <input
                        type='tel'
                        className='form-control'
                        name='phone'
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>Email</label>
                      <input
                        type='email'
                        className='form-control'
                        name='email'
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>Background Photo</label>
                      <input
                        type='file'
                        className='form-control'
                        accept='image/*'
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                  <div className='modal-footer border-top-0'>
                    <button
                      type='button'
                      className='btn btn-outline-secondary hover-grow'
                      onClick={() => setIsCompanyModalOpen(false)}
                      disabled={isLoading}>
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='btn btn-primary hover-grow'
                      disabled={isLoading}>
                      {isLoading ? (
                        <span
                          className='spinner-border spinner-border-sm me-1'
                          role='status'
                          aria-hidden='true'></span>
                      ) : isEditing ? (
                        "Update"
                      ) : (
                        "Create"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Branch Modal */}
        {isBranchModalOpen && (
          <div
            className='modal fade show d-block'
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content border-0 shadow-lg'>
                <div className='modal-header bg-success text-white'>
                  <h5 className='modal-title'>
                    {isEditing ? "Edit Branch" : "Add Branch"}
                  </h5>
                  <button
                    type='button'
                    className='btn-close btn-close-white'
                    onClick={() => setIsBranchModalOpen(false)}></button>
                </div>
                <form onSubmit={handleBranchSubmit}>
                  <div className='modal-body'>
                    <div className='mb-3'>
                      <label className='form-label'>Branch Name</label>
                      <input
                        type='text'
                        className='form-control'
                        name='name'
                        value={branchFormData.name}
                        onChange={handleBranchInputChange}
                        required
                      />
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>Location</label>
                      <input
                        type='text'
                        className='form-control'
                        name='location'
                        value={branchFormData.location}
                        onChange={handleBranchInputChange}
                      />
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>Manager Name</label>
                      <input
                        type='text'
                        className='form-control'
                        name='managerName'
                        value={branchFormData.managerName}
                        onChange={handleBranchInputChange}
                      />
                    </div>
                    <div className='mb-3 form-check form-switch'>
                      <input
                        type='checkbox'
                        className='form-check-input'
                        name='isDefault'
                        checked={branchFormData.isDefault}
                        onChange={handleBranchInputChange}
                        role='switch'
                      />
                      <label className='form-check-label'>
                        Set as Default Branch
                      </label>
                    </div>
                  </div>
                  <div className='modal-footer border-top-0'>
                    <button
                      type='button'
                      className='btn btn-outline-secondary hover-grow'
                      onClick={() => setIsBranchModalOpen(false)}
                      disabled={isLoading}>
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='btn btn-success hover-grow'
                      disabled={isLoading}>
                      {isLoading ? (
                        <span
                          className='spinner-border spinner-border-sm me-1'
                          role='status'
                          aria-hidden='true'></span>
                      ) : isEditing ? (
                        "Update"
                      ) : (
                        "Create"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {isCategoryModalOpen && (
          <div
            className='modal fade show d-block'
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content border-0 shadow-lg'>
                <div className='modal-header bg-warning text-white'>
                  <h5 className='modal-title'>
                    {isEditing ? "Edit Category" : "Add Category"}
                  </h5>
                  <button
                    type='button'
                    className='btn-close btn-close-white'
                    onClick={() => setIsCategoryModalOpen(false)}></button>
                </div>
                <form onSubmit={handleCategorySubmit}>
                  <div className='modal-body'>
                    <div className='mb-3'>
                      <label className='form-label'>Category Name</label>
                      <input
                        type='text'
                        className='form-control'
                        name='name'
                        value={categoryFormData.name}
                        onChange={handleCategoryInputChange}
                        required
                      />
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>Description</label>
                      <textarea
                        className='form-control'
                        name='description'
                        value={categoryFormData.description}
                        onChange={handleCategoryInputChange}
                        rows='3'></textarea>
                    </div>
                  </div>
                  <div className='modal-footer border-top-0'>
                    <button
                      type='button'
                      className='btn btn-outline-secondary hover-grow'
                      onClick={() => setIsCategoryModalOpen(false)}
                      disabled={isLoading}>
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='btn btn-warning hover-grow'
                      disabled={isLoading}>
                      {isLoading ? (
                        <span
                          className='spinner-border spinner-border-sm me-1'
                          role='status'
                          aria-hidden='true'></span>
                      ) : isEditing ? (
                        "Update"
                      ) : (
                        "Create"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Subcategory Modal */}
        {isSubcategoryModalOpen && (
          <div
            className='modal fade show d-block'
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content border-0 shadow-lg'>
                <div className='modal-header bg-info text-white'>
                  <h5 className='modal-title'>
                    {isEditing ? "Edit Product" : "Add Product"}
                  </h5>
                  <button
                    type='button'
                    className='btn-close btn-close-white'
                    onClick={() => setIsSubcategoryModalOpen(false)}></button>
                </div>
                <form onSubmit={handleSubcategorySubmit}>
                  <div className='modal-body'>
                    <div className='mb-3'>
                      <label className='form-label'>Product Name</label>
                      <input
                        type='text'
                        className='form-control'
                        name='name'
                        value={subcategoryFormData.name}
                        onChange={handleSubcategoryInputChange}
                        required
                      />
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>Description</label>
                      <textarea
                        className='form-control'
                        name='description'
                        value={subcategoryFormData.description}
                        onChange={handleSubcategoryInputChange}
                        rows='3'></textarea>
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>Price</label>
                      <input
                        type='number'
                        className='form-control'
                        name='price'
                        value={subcategoryFormData.price || ""}
                        onChange={handleSubcategoryInputChange}
                        step='0.01'
                        min='0'
                      />
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>Discount (%)</label>
                      <input
                        type='number'
                        className='form-control'
                        name='discount'
                        value={subcategoryFormData.discount || 0}
                        onChange={handleSubcategoryInputChange}
                        step='1'
                        min='0'
                        max='100'
                      />
                    </div>
                    <div className='mb-3'>
                      <label className='form-label'>GST (%)</label>
                      <input
                        type='number'
                        className='form-control'
                        name='gst'
                        value={subcategoryFormData.gst || 0}
                        onChange={handleSubcategoryInputChange}
                        step='1'
                        min='0'
                        max='100'
                      />
                    </div>
                  </div>
                  <div className='modal-footer border-top-0'>
                    <button
                      type='button'
                      className='btn btn-outline-secondary hover-grow'
                      onClick={() => setIsSubcategoryModalOpen(false)}
                      disabled={isLoading}>
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='btn btn-info hover-grow'
                      disabled={isLoading}>
                      {isLoading ? (
                        <span
                          className='spinner-border spinner-border-sm me-1'
                          role='status'
                          aria-hidden='true'></span>
                      ) : isEditing ? (
                        "Update"
                      ) : (
                        "Create"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Clients Card */}
        <div className='col-md-3'>
          <div className='card bg-secondary bg-opacity-10 border-secondary border-opacity-25 h-100 hover-lift transition-all'>
            <div className='card-body text-center py-4'>
              <i className='bi bi-people display-5 text-secondary mb-3'></i>
              <h3 className='h5 text-secondary'>Total Clients</h3>
              <p className='display-6 fw-bold text-secondary'>
                {selectedCompany ? companyClients.length || "—" : "—"}
              </p>
              {selectedCompany && (
                <Link
                  to={`/companies/${selectedCompany._id}/clients`}
                  className='btn btn-sm btn-outline-secondary mt-2'>
                  Manage Clients
                </Link>
              )}
            </div>
          </div>
        </div>
{/* Invoice Reports Card */}{/* Invoice Reports Card */}
  
<div className='col-md-3'>
  <div className='card bg-secondary bg-opacity-10 border-secondary border-opacity-25 h-100 hover-lift transition-all'>
    <div className='card-body text-center py-4'>
      <i className='bi bi-receipt display-5 text-secondary mb-3'></i>
      <h3 className='h5 text-secondary'>Invoice Reports</h3>
      <p className='display-6 fw-bold text-secondary'>
        {selectedCompany ? "View" : "—"}
      </p>
      {selectedCompany && selectedBranch && (
        <>
          <Link
            to={`/companies/${selectedCompany._id}/branches/${selectedBranch._id}/invoices`}
            className='btn btn-sm btn-outline-secondary mt-2 me-1'>
            View Invoices
          </Link>
          <Link
            to={`/companies/${selectedCompany._id}/branches/${selectedBranch._id}/invoices/new`}
            className='btn btn-sm btn-outline-primary mt-2'>
            Create Invoice
          </Link>
        </>
      )}
    </div>
  </div>
</div>


 <div className='col-md-3'>
  <div className='card bg-info bg-opacity-10 border-info border-opacity-25 h-100 hover-lift transition-all'>
    <div className='card-body text-center py-4'>
      <i className='bi bi-bar-chart-line display-5 text-info mb-3'></i>
      <h3 className='h5 text-info'>Branch Performance</h3>
      <p className='display-6 fw-bold text-info'>
        {reportData ? `₹${reportData.revenueSummary[0]?.revenue?.toLocaleString('en-IN') || '0'}` : '—'}
      </p>
      {selectedCompany && selectedBranch && (
        <Link
          to={`/companies/${selectedCompany._id}/branches/${selectedBranch._id}/report`}
          className='btn btn-sm btn-outline-info mt-2'>
          View Report
        </Link>
      )}
    </div>
  </div>
</div>


  {/* <div className="col-md-3">
    <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25 h-100 hover-lift transition-all">
      <div className="card-body text-center py-4">
        <i className="bi bi-file-earmark-text display-5 text-primary mb-3"></i>
        <h3 className="h5 text-primary">Invoice Report</h3>
        <p className="display-6 fw-bold text-primary">
          {reportData?.summary?.totalAmount !== undefined
            ? `₹${reportData.summary.totalAmount.toLocaleString('en-IN')}`
            : '—'}
        </p>
        {selectedCompany && (
          <Link
            to={`/companies/${selectedCompany._id}/invoice-report`}
            className="btn btn-sm btn-outline-primary mt-2"
          >
            View Report
          </Link>
        )}
      </div>
    </div>
  </div> */}






        {/* Loading Overlay */}
        {isLoading && (
          <div
            className='position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center'
            style={{ backgroundColor: "rgba(255,255,255,0.8)", zIndex: 1060 }}>
            <div
              className='spinner-grow text-primary'
              role='status'
              style={{ width: "3rem", height: "3rem" }}>
              <span className='visually-hidden'>Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Companies;

// Outside the component (or move this just above the return statement inside the component)
function calculateFinalPrice(price, discount, gst) {
  const priceNum = parseFloat(price) || 0;
  const discountNum = parseFloat(discount) || 0;
  const gstNum = parseFloat(gst) || 0;

  const discountedPrice = priceNum - (priceNum * discountNum) / 100;
  const finalPrice = discountedPrice + (discountedPrice * gstNum) / 100;

  return finalPrice.toFixed(2);
}
