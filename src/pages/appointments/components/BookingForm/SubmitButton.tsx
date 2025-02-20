import React from 'react';
import { PulseLoader } from 'react-spinners';

interface SubmitButtonProps {
  isLoading: boolean;
}

export function SubmitButton({ isLoading }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={`
        w-full py-5 px-8 rounded-xl font-medium text-lg sm:text-xl
        transition-all duration-300
        ${isLoading 
          ? 'bg-blue-400 cursor-not-allowed' 
          : 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-1'
        }
        text-white
        flex items-center justify-center
      `}
    >
      {isLoading ? (
        <>
          <PulseLoader size={10} color="#ffffff" className="mr-3" />
          <span>Booking Appointment...</span>
        </>
      ) : (
        'Book Appointment'
      )}
    </button>
  );
}