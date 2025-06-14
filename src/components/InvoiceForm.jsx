/** @format */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaMinus, FaSave, FaTimes, FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";

const InvoiceForm = ({ isEdit = false }) => {
  const { companyId, branchId, invoiceId } = useParams();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    client: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    items: [
      {
        categoryId: "",
        subcategoryId: "",
        name: "",
        description: "",
        quantity: 1,
        price: 0,
        discount: 0,
        gst: 0,
        finalAmount: 0,
        categoryName: "",
        subcategoryName: "",
      },
    ],
    paymentStatus: "pending",
    paymentMethod: "cash",
    notes: "",
  });

  // Data for dropdowns
  const [clients, setClients] = useState([]);
  const [branch, setBranch] = useState(null);
  const [company, setCompany] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch company first
        const companyRes = await axios.get(`/api/companies/${companyId}`);
        setCompany(companyRes.data);

        // Try to fetch branch data
        let branchData = null;
        try {
          const branchRes = await axios.get(
            `/api/companies/${companyId}/branches/${branchId}`
          );
          branchData = branchRes.data;
          setBranch(branchData);
          setCategories(branchData.categories || []);
        } catch (branchError) {
          console.warn(
            "Branch endpoint not found, trying alternative approach"
          );

          // Alternative: fetch all branches and find the specific one
          try {
            const branchesRes = await axios.get(
              `/api/companies/${companyId}/branches`
            );
            const targetBranch = branchesRes.data.find(
              (branch) => branch._id === branchId
            );

            if (targetBranch) {
              setBranch(targetBranch);
              setCategories(targetBranch.categories || []);
            } else {
              throw new Error("Branch not found in company branches");
            }
          } catch (alternativeError) {
            throw new Error(
              "Could not fetch branch data: " + alternativeError.message
            );
          }
        }

        // Fetch clients
        const clientsRes = await axios.get(
          `/api/companies/${companyId}/clients`
        );
        setClients(clientsRes.data);
        setFilteredClients(clientsRes.data);

        // If editing, fetch the invoice data
        if (isEdit && invoiceId) {
          const { data: invoice } = await axios.get(
            `/api/companies/${companyId}/branches/${branchId}/invoices/${invoiceId}`
          );

          // Format the invoice data for the form
          setFormData({
            client: invoice.client._id,
            date: new Date(invoice.date).toISOString().split("T")[0],
            dueDate: invoice.dueDate
              ? new Date(invoice.dueDate).toISOString().split("T")[0]
              : "",
            items: invoice.items.map((item) => ({
              categoryId: item.categoryId,
              subcategoryId: item.subcategoryId,
              name: item.name,
              description: item.description || "",
              quantity: item.quantity,
              price: item.price,
              discount: item.discount || 0,
              gst: item.gst || 0,
              finalAmount: item.finalAmount,
              categoryName: item.categoryName || "",
              subcategoryName: item.subcategoryName || "",
            })),
            paymentStatus: invoice.paymentStatus,
            paymentMethod: invoice.paymentMethod,
            notes: invoice.notes || "",
          });

          // Set the selected client if editing
          const client = clientsRes.data.find(
            (c) => c._id === invoice.client._id
          );
          if (client) {
            setSelectedClient(client);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          "Failed to load required data. Please check if the branch exists and try again."
        );
        toast.error("Failed to load form data: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [companyId, branchId, invoiceId, isEdit]);

  // Filter clients based on search
  useEffect(() => {
    if (clientSearch) {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          client.phone.includes(clientSearch) ||
          (client.email &&
            client.email.toLowerCase().includes(clientSearch.toLowerCase()))
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [clientSearch, clients]);

  const handleClientChange = (e) => {
    const clientId = e.target.value;
    const client = clients.find((c) => c._id === clientId);

    setSelectedClient(client);
    setFormData((prev) => ({
      ...prev,
      client: clientId,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const numericFields = ["quantity", "price", "discount", "gst"];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: numericFields.includes(field) ? parseFloat(value) || 0 : value,
    };

    // If category changes, reset subcategory and clear other fields
    if (field === "categoryId") {
      updatedItems[index] = {
        ...updatedItems[index],
        subcategoryId: "",
        name: "",
        description: "",
        price: 0,
        discount: 0,
        gst: 0,
        finalAmount: 0,
      };
    }

    // If subcategory changes, auto-fill details
    if (field === "subcategoryId" && value) {
      const category = categories.find(
        (cat) => cat._id === updatedItems[index].categoryId
      );
      if (category) {
        const subcategory = category.subcategories.find(
          (sub) => sub._id === value
        );
        if (subcategory) {
          // Calculate price with client discount if regular client
          let price = subcategory.price;
          let discount = 0;

          if (selectedClient?.isRegular) {
            discount =
              subcategory.price * (selectedClient.discountPercentage / 100);
            price = subcategory.price - discount;
          }

          updatedItems[index] = {
            ...updatedItems[index],
            name: subcategory.name,
            description: subcategory.description || "",
            price: price,
            discount: discount,
            gst: subcategory.gst || 0,
            categoryName: category.name,
            subcategoryName: subcategory.name,
          };
        }
      }
    }

    // Calculate final amount when relevant fields change
    if (["quantity", "price", "discount", "gst"].includes(field)) {
      const { quantity, price, discount, gst } = updatedItems[index];
      updatedItems[index].finalAmount = price * quantity - discount + gst;
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          categoryId: "",
          subcategoryId: "",
          name: "",
          description: "",
          quantity: 1,
          price: 0,
          discount: 0,
          gst: 0,
          finalAmount: 0,
          categoryName: "",
          subcategoryName: "",
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const getSubcategories = (categoryId) => {
    const category = categories.find((cat) => cat._id === categoryId);
    return category
      ? category.subcategories.filter((sub) => !sub.deletedAt)
      : [];
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );
    const totalDiscount = formData.items.reduce(
      (sum, item) => sum + (item.discount || 0),
      0
    );
    const totalGst = formData.items.reduce(
      (sum, item) => sum + (item.gst || 0),
      0
    );
    const grandTotal = subtotal - totalDiscount + totalGst;

    return {
      subtotal: subtotal || 0,
      totalDiscount: totalDiscount || 0,
      totalGst: totalGst || 0,
      grandTotal: grandTotal || 0,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.client) {
      toast.error("Please select a client");
      return;
    }

    try {
      setIsSubmitting(true);

      const totals = calculateTotals();
      const payload = {
        client: formData.client, // Just send client ID
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        dueDate: formData.dueDate,
        items: formData.items.map((item) => ({
          categoryId: item.categoryId,
          subcategoryId: item.subcategoryId,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          gst: item.gst,
        })),
      };

      let response;
      if (isEdit) {
        response = await axios.put(
          `/api/companies/${companyId}/branches/${branchId}/invoices/${invoiceId}`,
          payload
        );
        toast.success("Invoice updated successfully!");
      } else {
        response = await axios.post(
          `/api/companies/${companyId}/branches/${branchId}/invoices`,
          payload
        );
        toast.success("Invoice created successfully!");
      }

      // Navigate to invoice detail page
      setTimeout(() => {
        navigate(
          `/companies/${companyId}/branches/${branchId}/invoices/${response.data._id}`
        );
      }, 1500);
    } catch (err) {
      console.error("Error saving invoice:", err);
      toast.error(
        err.response?.data?.message ||
          `Failed to ${isEdit ? "update" : "create"} invoice`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();

  if (error) {
    return (
      <div className='container-fluid py-4'>
        <div className='alert alert-danger'>
          <i className='bi bi-exclamation-triangle me-2'></i>
          {error}
          <button
            className='btn btn-outline-danger btn-sm ms-3'
            onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='container-fluid py-4'>
        <div className='text-center py-5'>
          <div className='spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
          <p className='mt-3 text-muted'>Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container-fluid py-4'>
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h2>{isEdit ? "Edit Invoice" : "Create New Invoice"}</h2>
        <Link
          to={`/companies/${companyId}/branches/${branchId}/invoices`}
          className='btn btn-outline-secondary'>
          <FaTimes className='me-1' />
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className='row'>
          {/* Main Form */}
          <div className='col-lg-8'>
            <div className='card mb-4'>
              <div className='card-header bg-light'>
                <h5 className='mb-0'>Basic Information</h5>
              </div>
              <div className='card-body'>
                <div className='row'>
                  <div className='col-md-6 mb-3'>
                    <label className='form-label'>Client *</label>
                    <div className='input-group'>
                      <span className='input-group-text'>
                        <FaSearch />
                      </span>
                      <input
                        type='text'
                        className='form-control'
                        placeholder='Search clients...'
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                      />
                    </div>
                    <select
                      name='client'
                      className='form-select mt-2'
                      value={formData.client}
                      onChange={handleClientChange}
                      required>
                      <option value=''>Select a client</option>
                      {filteredClients.map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.name} - {client.phone}
                          {client.isRegular &&
                            ` (Regular - ${client.discountPercentage}% discount)`}
                        </option>
                      ))}
                    </select>
                    {selectedClient && (
                      <div className='mt-2'>
                        <small className='text-muted'>
                          Client Type:{" "}
                          {selectedClient.isRegular ? "Regular" : "Non-regular"}{" "}
                          | GST: {selectedClient.gstFromSubcategory}% | Address:{" "}
                          {selectedClient.address}
                        </small>
                      </div>
                    )}
                  </div>
                  <div className='col-md-3 mb-3'>
                    <label className='form-label'>Invoice Date *</label>
                    <input
                      type='date'
                      name='date'
                      className='form-control'
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className='col-md-3 mb-3'>
                    <label className='form-label'>Due Date</label>
                    <input
                      type='date'
                      name='dueDate'
                      className='form-control'
                      value={formData.dueDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className='card mb-4'>
              <div className='card-header bg-light'>
                <div className='d-flex justify-content-between align-items-center'>
                  <h5 className='mb-0'>Invoice Items</h5>
                  <button
                    type='button'
                    className='btn btn-sm btn-success'
                    onClick={addItem}>
                    <FaPlus className='me-1' />
                    Add Item
                  </button>
                </div>
              </div>
              <div className='card-body'>
                {formData.items.map((item, index) => (
                  <div key={index} className='mb-4 border-bottom pb-3'>
                    <div className='d-flex justify-content-between align-items-center mb-3'>
                      <h6 className='mb-0'>Item #{index + 1}</h6>
                      {formData.items.length > 1 && (
                        <button
                          type='button'
                          className='btn btn-sm btn-outline-danger'
                          onClick={() => removeItem(index)}>
                          <FaMinus />
                        </button>
                      )}
                    </div>

                    <div className='row g-3'>
                      <div className='col-md-6'>
                        <label className='form-label'>Category</label>
                        <select
                          className='form-select'
                          value={item.categoryId}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "categoryId",
                              e.target.value
                            )
                          }
                          required>
                          <option value=''>Select category</option>
                          {categories
                            .filter((cat) => !cat.deletedAt)
                            .map((category) => (
                              <option key={category._id} value={category._id}>
                                {category.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label'>Subcategory</label>
                        <select
                          className='form-select'
                          value={item.subcategoryId}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "subcategoryId",
                              e.target.value
                            )
                          }
                          disabled={!item.categoryId}
                          required>
                          <option value=''>Select subcategory</option>
                          {getSubcategories(item.categoryId).map((subcat) => (
                            <option key={subcat._id} value={subcat._id}>
                              {subcat.name} (₹{subcat.price})
                              {selectedClient?.isRegular &&
                                ` → ₹${(
                                  subcat.price *
                                  (1 - selectedClient.discountPercentage / 100)
                                ).toFixed(2)} after discount`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label'>Item Name *</label>
                        <input
                          type='text'
                          className='form-control'
                          value={item.name}
                          onChange={(e) =>
                            handleItemChange(index, "name", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label'>Description</label>
                        <input
                          type='text'
                          className='form-control'
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className='col-md-3'>
                        <label className='form-label'>Quantity *</label>
                        <input
                          type='number'
                          className='form-control'
                          min='1'
                          step='1'
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className='col-md-3'>
                        <label className='form-label'>Price *</label>
                        <input
                          type='number'
                          className='form-control'
                          min='0'
                          step='0.01'
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(index, "price", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className='col-md-3'>
                        <label className='form-label'>Discount</label>
                        <input
                          type='number'
                          className='form-control'
                          min='0'
                          step='0.01'
                          value={item.discount}
                          onChange={(e) =>
                            handleItemChange(index, "discount", e.target.value)
                          }
                        />
                      </div>
                      <div className='col-md-3'>
                        <label className='form-label'>GST</label>
                        <input
                          type='number'
                          className='form-control'
                          min='0'
                          step='0.01'
                          value={item.gst}
                          onChange={(e) =>
                            handleItemChange(index, "gst", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className='text-end mt-2'>
                      <strong>
                        Item Total: ₹{(item.finalAmount || 0).toFixed(2)}
                        {(item.gst || 0) > 0 &&
                          ` (includes ₹${(item.gst || 0).toFixed(2)} GST)`}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Notes */}
            <div className='card'>
              <div className='card-header bg-light'>
                <h5 className='mb-0'>Additional Information</h5>
              </div>
              <div className='card-body'>
                <div className='row g-3'>
                  <div className='col-md-6'>
                    <label className='form-label'>Payment Status</label>
                    <select
                      name='paymentStatus'
                      className='form-select'
                      value={formData.paymentStatus}
                      onChange={handleInputChange}>
                      <option value='pending'>Pending</option>
                      <option value='paid'>Paid</option>
                      <option value='partially_paid'>Partially Paid</option>
                    </select>
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label'>Payment Method</label>
                    <select
                      name='paymentMethod'
                      className='form-select'
                      value={formData.paymentMethod}
                      onChange={handleInputChange}>
                      <option value='cash'>Cash</option>
                      <option value='card'>Card</option>
                      <option value='upi'>UPI</option>
                      <option value='bank_transfer'>Bank Transfer</option>
                      <option value='credit'>Credit</option>
                    </select>
                  </div>
                  <div className='col-12'>
                    <label className='form-label'>Notes</label>
                    <textarea
                      name='notes'
                      className='form-control'
                      rows='3'
                      value={formData.notes}
                      onChange={handleInputChange}></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Totals & Actions */}
          <div className='col-lg-4'>
            <div className='card mb-4'>
              <div className='card-header bg-light'>
                <h5 className='mb-0'>Invoice Summary</h5>
              </div>
              <div className='card-body'>
                <table className='table table-borderless'>
                  <tbody>
                    <tr>
                      <td>Subtotal:</td>
                      <td className='text-end'>
                        ₹{totals.subtotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td>Total Discount:</td>
                      <td className='text-end'>
                        ₹{totals.totalDiscount.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td>Total GST:</td>
                      <td className='text-end'>
                        ₹{totals.totalGst.toFixed(2)}
                      </td>
                    </tr>
                    <tr className='table-active'>
                      <td>
                        <strong>Grand Total:</strong>
                      </td>
                      <td className='text-end'>
                        <strong>₹{totals.grandTotal.toFixed(2)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className='card'>
              <div className='card-body'>
                <div className='d-grid gap-2'>
                  <button
                    type='submit'
                    className='btn btn-primary'
                    disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span
                          className='spinner-border spinner-border-sm me-2'
                          role='status'></span>
                        {isEdit ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <FaSave className='me-1' />
                        {isEdit ? "Update Invoice" : "Create Invoice"}
                      </>
                    )}
                  </button>
                  <Link
                    to={`/companies/${companyId}/branches/${branchId}/invoices`}
                    className='btn btn-outline-secondary'>
                    <FaTimes className='me-1' />
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
