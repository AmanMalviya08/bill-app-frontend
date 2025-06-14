import React, { useState, useEffect } from 'react';
import { Button, Table, Form, Modal, Alert, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';

const ProductForm = ({ 
  show, 
  handleClose, 
  product, 
  onChange, 
  onSubmit, 
  categories, 
  isLoading 
}) => (
  <Modal show={show} onHide={handleClose} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>{product._id ? 'Edit Product' : 'Add Product'}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}>
        <Form.Group className="mb-3">
          <Form.Label>Name <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={product.name}
            onChange={(e) => onChange('name', e.target.value)}
            required
            placeholder="Enter product name"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="description"
            value={product.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Enter product description"
          />
        </Form.Group>

        <div className="row">
          <div className="col-md-6">
            <Form.Group className="mb-3">
              <Form.Label>Price <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                name="price"
                value={product.price}
                onChange={(e) => onChange('price', parseFloat(e.target.value) || 0)}
                required
                placeholder="Enter price"
              />
            </Form.Group>
          </div>
          <div className="col-md-6">
            <Form.Group className="mb-3">
              <Form.Label>Stock Quantity</Form.Label>
              <Form.Control
                type="number"
                min="0"
                name="stockQuantity"
                value={product.stockQuantity}
                onChange={(e) => onChange('stockQuantity', parseInt(e.target.value) || 0)}
                placeholder="Enter stock quantity"
              />
            </Form.Group>
          </div>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>Category <span className="text-danger">*</span></Form.Label>
          <Form.Select
            name="category"
            value={product.category}
            onChange={(e) => onChange('category', e.target.value)}
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner as="span" size="sm" animation="border" role="status" />
                {' Saving...'}
              </>
            ) : product._id ? 'Update' : 'Save'}
          </Button>
        </div>
      </Form>
    </Modal.Body>
  </Modal>
);

const ProductList = ({ products, onEdit, onDelete, isLoading }) => {
  if (isLoading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (products.length === 0) {
    return <Alert variant="info">No products found. Add your first product!</Alert>;
  }

  return (
    <div className="table-responsive">
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Stock Quantity</th>
            <th>Branch</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>{product.name}</td>
              <td>{product.description || '-'}</td>
              <td>${product.price.toFixed(2)}</td>
              <td>
                <Badge bg={product.stockQuantity > 0 ? 'success' : 'warning'}>
                  {product.stockQuantity}
                </Badge>
              </td>
              <td>{product.branch?.name || 'N/A'}</td>
              <td>
                <Badge bg="info">{product.category?.name || 'N/A'}</Badge>
              </td>
              <td>
                <Button 
                  variant="outline-info" 
                  size="sm" 
                  onClick={() => onEdit(product)}
                  className="me-2"
                >
                  Edit
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => onDelete(product._id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

const ExcelUploadModal = ({ show, handleClose, onUpload, isLoading }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    if (selectedFile) {
      previewExcelFile(selectedFile);
    }
  };

  const previewExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet);
        
        // Show only first 5 rows for preview
        setPreviewData(parsedData.slice(0, 5));
        setShowPreview(true);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Error reading Excel file. Please check the file format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = () => {
    if (file) {
      onUpload(file);
      setFile(null);
      setPreviewData([]);
      setShowPreview(false);
    }
  };

  const handleModalClose = () => {
    setFile(null);
    setPreviewData([]);
    setShowPreview(false);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleModalClose} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Import Products from Excel</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info">
          <strong>Excel Format Requirements:</strong>
          <br />
          Your Excel file should contain the following columns:
          <ul className="mb-0 mt-2">
            <li><strong>name</strong> - Product name (required)</li>
            <li><strong>description</strong> - Product description (optional)</li>
            <li><strong>price</strong> - Product price (required)</li>
            <li><strong>stockQuantity</strong> - Stock quantity (optional, defaults to 0)</li>
            <li><strong>category</strong> - Category ID (required)</li>
          </ul>
        </Alert>

        <Form.Group className="mb-3">
          <Form.Label>Select Excel File</Form.Label>
          <Form.Control
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </Form.Group>

        {showPreview && previewData.length > 0 && (
          <div className="mt-3">
            <h6>Preview (First 5 rows):</h6>
            <div className="table-responsive">
              <Table striped bordered size="sm">
                <thead>
                  <tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, idx) => (
                        <td key={idx}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleModalClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleUpload} 
          disabled={!file || isLoading}
        >
          {isLoading ? (
            <>
              <Spinner as="span" size="sm" animation="border" role="status" />
              {' Uploading...'}
            </>
          ) : (
            'Upload Products'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const Products = () => {
  const defaultBranchId = '6826f1c01b290d45d8fca392';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    description: '',
    price: 0,
    stockQuantity: 0,
    branch: defaultBranchId,
    category: ''
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/products', {
        params: { branch: defaultBranchId },
      });
      setProducts(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (currentProduct._id) {
        await axios.put(`/api/products/${currentProduct._id}`, currentProduct);
        setSuccess('Product updated successfully!');
      } else {
        await axios.post('/api/products', currentProduct);
        setSuccess('Product added successfully!');
      }
      setShowModal(false);
      resetProduct();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetProduct = () => {
    setCurrentProduct({
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      branch: defaultBranchId,
      category: ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`/api/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
      setSuccess('Product deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleChange = (field, value) => {
    setCurrentProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet);

        // Format data to match backend requirements
        const formatted = parsedData.map((item) => ({
          name: item.name,
          description: item.description || '',
          price: parseFloat(item.price) || 0,
          stockQuantity: parseInt(item.stockQuantity) || 0,
          branch: defaultBranchId,
          category: item.category
        }));

        await axios.post('/api/products/bulk', formatted);
        fetchProducts();
        setSuccess(`${formatted.length} products imported successfully!`);
        setShowUploadModal(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to import products');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-3">
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <div className="d-flex justify-content-between mb-3 align-items-center">
        <h2>Product Management</h2>
        <div className="d-flex gap-2">
          <Button
            variant="success"
            onClick={() => setShowUploadModal(true)}
            disabled={isLoading}
          >
            <i className="bi bi-upload me-2"></i>
            Import Excel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              resetProduct();
              setShowModal(true);
            }}
            disabled={isLoading}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add Product
          </Button>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-8">
          <Form.Control
            type="text"
            placeholder="Search products by name, description, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-4 d-flex justify-content-end">
          <Button 
            variant="outline-secondary" 
            onClick={fetchProducts}
            disabled={isLoading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </Button>
        </div>
      </div>

      <ProductList
        products={filteredProducts}
        onEdit={(product) => {
          setCurrentProduct(product);
          setShowModal(true);
        }}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      <ProductForm
        show={showModal}
        handleClose={() => setShowModal(false)}
        product={currentProduct}
        onChange={handleChange}
        onSubmit={handleSubmit}
        categories={categories}
        isLoading={isSubmitting}
      />

      <ExcelUploadModal
        show={showUploadModal}
        handleClose={() => setShowUploadModal(false)}
        onUpload={handleFileUpload}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Products;