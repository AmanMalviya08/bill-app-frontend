import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client',
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateRegisterForm = () => {
    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill all required fields');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const validateLoginForm = () => {
    const { email, password } = loginData;

    if (!email || !password) {
      setError('Please fill all required fields');
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const { name, email, password, role } = formData;
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        name,
        email,
        password,
        role,
      });
      
      const userData = {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
      };

      localStorage.setItem('token', res.data.token);
      login(userData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const { email, password } = loginData;
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        email,
        password,
      });

      const userData = {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
      };

      localStorage.setItem('token', res.data.token);
      login(userData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRegisterForm = () => (
    <form onSubmit={handleRegister} className="needs-validation" noValidate>
      <div className="mb-3">
        <label htmlFor="name" className="form-label">Full Name</label>
        <input
          type="text"
          className="form-control"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleRegisterChange}
          placeholder="Enter full name"
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="email" className="form-label">Email Address</label>
        <input
          type="email"
          className="form-control"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleRegisterChange}
          placeholder="Enter email"
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="password" className="form-label">Password (min 6 characters)</label>
        <input
          type="password"
          className="form-control"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleRegisterChange}
          placeholder="Enter password"
          minLength="6"
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
        <input
          type="password"
          className="form-control"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleRegisterChange}
          placeholder="Re-enter password"
          minLength="6"
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="role" className="form-label">Role</label>
        <select
          name="role"
          id="role"
          className="form-select"
          value={formData.role}
          onChange={handleRegisterChange}
          required
        >
          <option value="client">Client</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary w-100 py-2 mt-3"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Registering...
          </>
        ) : 'Register'}
      </button>
      <p className="mt-3 text-center text-muted">
        Already have an account?{' '}
        <button
          type="button"
          className="btn btn-link p-0 text-decoration-none"
          onClick={() => setIsRegister(false)}
        >
          Login here
        </button>
      </p>
    </form>
  );

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="needs-validation" noValidate>
      <div className="mb-3">
        <label htmlFor="loginEmail" className="form-label">Email Address</label>
        <input
          type="email"
          className="form-control"
          id="loginEmail"
          name="email"
          value={loginData.email}
          onChange={handleLoginChange}
          placeholder="Enter email"
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="loginPassword" className="form-label">Password</label>
        <input
          type="password"
          className="form-control"
          id="loginPassword"
          name="password"
          value={loginData.password}
          onChange={handleLoginChange}
          placeholder="Enter password"
          required
        />
      </div>

      <div className="d-grid gap-2">
        <button 
          type="submit" 
          className="btn btn-success w-100 py-2 mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Logging in...
            </>
          ) : 'Login'}
        </button>
      </div>
      <p className="mt-3 text-center text-muted">
        Don't have an account?{' '}
        <button
          type="button"
          className="btn btn-link p-0 text-decoration-none"
          onClick={() => setIsRegister(true)}
        >
          Register here
        </button>
      </p>
    </form>
  );

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="row w-100 justify-content-center">
        <div className="col-lg-6 col-md-8 col-sm-10">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-primary text-white">
              <h2 className="text-center mb-0 py-3">
                {isRegister ? 'Create New Account' : 'Welcome Back'}
              </h2>
            </div>
            <div className="card-body p-4 p-md-5">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setError('')}
                    aria-label="Close"
                  ></button>
                </div>
              )}

              {isRegister ? renderRegisterForm() : renderLoginForm()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;