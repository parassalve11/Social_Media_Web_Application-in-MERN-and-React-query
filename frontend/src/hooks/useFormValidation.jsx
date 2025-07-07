// useFormValidation.js
import { useState } from "react";

const useFormValidation = (formType, initialValues) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  // Define validation rules for both forms
  const validationRules = {
    signup: {
      name: {
        required: true,
        minLength: 2,
        errorMessage: "Name must be at least 2 characters",
      },
      username: {
        required: true,
        minLength: 3,
        pattern: /^[@a-zA-Z0-9_]+$/,
        errorMessage: "Username can only contain letters, numbers, and underscores",
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        errorMessage: "Invalid email format",
      },
      password: {
        required: true,
        minLength: 6,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/,
        errorMessage: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      },
    },
    signin: {
      username: {
        required: true,
        minLength: 3,
        pattern: /^[a-zA-Z0-9_]+$/,
        errorMessage: "Username can only contain letters, numbers, and underscores",
      },
      password: {
        required: true,
        minLength: 6,
        errorMessage: "Password must be at least 6 characters",
      },
    },
  };

  // Select rules based on formType
  const rules = validationRules[formType] || {};

  // Function to validate a single field
  const validateField = (name, value) => {
    const fieldRules = rules[name];
    if (!fieldRules) return "";

    let error = "";

    if (fieldRules.required && !value.trim()) {
      error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    } else if (fieldRules.minLength && value.length < fieldRules.minLength) {
      error = fieldRules.errorMessage || `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least ${fieldRules.minLength} characters`;
    } else if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      error = fieldRules.errorMessage || `Invalid ${name}`;
    }

    return error;
  };

  // Function to validate all fields
  const validateForm = () => {
    const newErrors = {};
    Object.keys(rules).forEach((key) => {
      const error = validateField(key, values[key] || "");
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Returns true if no errors
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    // Validate the field on change
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Reset form
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    handleChange,
    validateForm,
    resetForm,
    setValues,
  };
};

export default useFormValidation;