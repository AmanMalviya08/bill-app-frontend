import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const SubcategoryModal = ({
  isOpen,
  onClose,
  onSubmit,
  subcategory,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount: '',
    gst: '',
  });

  useEffect(() => {
    if (subcategory) {
      setFormData({
        name: subcategory.name || '',
        description: subcategory.description || '',
        price: subcategory.price || '',
        discount: subcategory.discount || '',
        gst: subcategory.gst || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        discount: '',
        gst: '',
      });
    }
  }, [subcategory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: parseFloat(formData.price),
      discount: parseFloat(formData.discount),
      gst: parseFloat(formData.gst),
    });
  };

  return (
    <Modal show={isOpen} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          {subcategory ? 'Edit Product' : 'Add New Product'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Product Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Price</Form.Label>
            <Form.Control
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Discount (%)</Form.Label>
            <Form.Control
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>GST (%)</Form.Label>
            <Form.Control
              type="number"
              name="gst"
              value={formData.gst}
              onChange={handleChange}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Subcategory'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SubcategoryModal;
