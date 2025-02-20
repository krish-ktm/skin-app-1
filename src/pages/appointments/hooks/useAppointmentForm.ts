import { useState } from 'react';
import { appointmentService } from '../../../services/supabase';
import type { FormData } from '../../../types';

export function useAppointmentForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    caseId: '',
  });
  const [isSearchingCase, setIsSearchingCase] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'caseId') {
      setSearchError(null);
    }
  };

  const handleCaseSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caseId) return;

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
    handleInputChange,
    handleCaseSearch,
  };
}