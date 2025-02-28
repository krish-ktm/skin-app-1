import { useState } from 'react';
import { appointmentService } from '../../../services/supabase';
import type { FormData, ValidationErrors } from '../../../types';

export function useAppointmentForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    caseId: '',
    gender: 'male',
    age: 0,
  });
  const [isSearchingCase, setIsSearchingCase] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle age as a number
    if (name === 'age') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear validation errors when user types
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
    
    if (name === 'caseId') {
      setSearchError(null);
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      phone: '',
      caseId: '',
      gender: 'male',
      age: 0,
    });
    setSearchError(null);
    setValidationErrors({});
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Name must be less than 50 characters';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.name.trim())) {
      errors.name = 'Name contains invalid characters';
    }
    
    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = 'Phone must be 10 digits';
    }
    
    // Case ID validation (only for returning patients)
    if (formData.caseId && formData.caseId.trim().length < 3) {
      errors.caseId = 'Case ID must be at least 3 characters';
    }
    
    // Age validation
    if (formData.age <= 0) {
      errors.age = 'Age must be greater than 0';
    } else if (formData.age > 120) {
      errors.age = 'Age must be less than 120';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCaseSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caseId) return;
    
    // Validate case ID
    if (formData.caseId.trim().length < 3) {
      setValidationErrors(prev => ({ 
        ...prev, 
        caseId: 'Case ID must be at least 3 characters' 
      }));
      return false;
    }

    setIsSearchingCase(true);
    setSearchError(null);
    try {
      const data = await appointmentService.getAppointmentsByCaseId(formData.caseId);

      if (!data) {
        throw new Error('No appointment found with this Case ID');
      }

      setFormData(prev => ({
        ...prev,
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        age: data.age || 0,
      }));
      return true;
    } catch (error: any) {
      setSearchError(error.message);
      return false;
    } finally {
      setIsSearchingCase(false);
    }
  };

  return {
    formData,
    setFormData,
    isSearchingCase,
    searchError,
    validationErrors,
    handleInputChange,
    handleCaseSearch,
    resetFormData,
    validateForm
  };
}