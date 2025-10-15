import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseStyles = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors';
  const normalStyles = 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  const errorStyles = 'border-red-300 focus:ring-red-500 focus:border-red-500';
  
  const inputStyles = error ? errorStyles : normalStyles;
  
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        className={`${baseStyles} ${inputStyles} ${className}`}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseStyles = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors resize-none';
  const normalStyles = 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  const errorStyles = 'border-red-300 focus:ring-red-500 focus:border-red-500';
  
  const inputStyles = error ? errorStyles : normalStyles;
  
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        {...props}
        id={inputId}
        className={`${baseStyles} ${inputStyles} ${className}`}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};