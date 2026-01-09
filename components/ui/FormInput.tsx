import React, { useState, useEffect, useCallback } from 'react';
import { LucideIcon, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

// Validation rules
export type ValidationRule = {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'match' | 'custom';
  value?: number | string | RegExp;
  message: string;
  validator?: (value: string) => boolean;
};

interface FormInputProps {
  label?: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  validationRules?: ValidationRule[];
  matchValue?: string; // For password confirmation
  showValidation?: boolean; // Show validation status
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  helperText?: string;
  className?: string;
  inputClassName?: string;
  rows?: number; // For textarea
}

interface ValidationState {
  isValid: boolean;
  isTouched: boolean;
  errors: string[];
}

const validateValue = (
  value: string,
  rules: ValidationRule[],
  matchValue?: string
): string[] => {
  const errors: string[] = [];

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value.trim()) {
          errors.push(rule.message);
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errors.push(rule.message);
        }
        break;
      case 'minLength':
        if (value && value.length < (rule.value as number)) {
          errors.push(rule.message);
        }
        break;
      case 'maxLength':
        if (value && value.length > (rule.value as number)) {
          errors.push(rule.message);
        }
        break;
      case 'pattern':
        const regex = rule.value instanceof RegExp ? rule.value : new RegExp(rule.value as string);
        if (value && !regex.test(value)) {
          errors.push(rule.message);
        }
        break;
      case 'match':
        if (value && matchValue && value !== matchValue) {
          errors.push(rule.message);
        }
        break;
      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          errors.push(rule.message);
        }
        break;
    }
  }

  return errors;
};

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  icon: Icon,
  disabled = false,
  readOnly = false,
  required = false,
  autoComplete,
  autoFocus = false,
  validationRules = [],
  matchValue,
  showValidation = true,
  validateOnChange = true,
  validateOnBlur = true,
  helperText,
  className = '',
  inputClassName = '',
  rows = 3,
}) => {
  const [validation, setValidation] = useState<ValidationState>({
    isValid: true,
    isTouched: false,
    errors: [],
  });
  const [showPassword, setShowPassword] = useState(false);

  // Add required rule if not present
  const allRules = required && !validationRules.some(r => r.type === 'required')
    ? [{ type: 'required' as const, message: 'Este campo es requerido' }, ...validationRules]
    : validationRules;

  const validate = useCallback((val: string) => {
    if (allRules.length === 0) return;
    const errors = validateValue(val, allRules, matchValue);
    setValidation(prev => ({
      ...prev,
      isValid: errors.length === 0,
      errors,
    }));
  }, [allRules, matchValue]);

  // Re-validate when matchValue changes (for password confirmation)
  useEffect(() => {
    if (validation.isTouched && matchValue !== undefined) {
      validate(value);
    }
  }, [matchValue, validate, validation.isTouched, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (validateOnChange && validation.isTouched) {
      validate(newValue);
    }
  };

  const handleBlur = () => {
    setValidation(prev => ({ ...prev, isTouched: true }));

    if (validateOnBlur) {
      validate(value);
    }

    onBlur?.();
  };

  const showError = showValidation && validation.isTouched && !validation.isValid;
  const showSuccess = showValidation && validation.isTouched && validation.isValid && value.length > 0;

  const inputId = `input-${name}`;
  const errorId = `error-${name}`;

  const baseInputClasses = `
    w-full px-4 py-3 rounded-xl
    bg-gray-50 dark:bg-gray-800
    border-2 transition-all duration-200
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    focus:outline-none focus:ring-0
    disabled:opacity-50 disabled:cursor-not-allowed
    ${Icon ? 'pl-11' : ''}
    ${type === 'password' ? 'pr-11' : ''}
    ${showError
      ? 'border-red-500 dark:border-red-500 focus:border-red-500'
      : showSuccess
      ? 'border-green-500 dark:border-green-500 focus:border-green-500'
      : 'border-gray-200 dark:border-gray-700 focus:border-oaxaca-pink dark:focus:border-oaxaca-pink'
    }
    text-gray-900 dark:text-gray-100
  `;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              showError ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
            }`}
          />
        )}

        {type === 'textarea' ? (
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            autoFocus={autoFocus}
            rows={rows}
            aria-invalid={showError}
            aria-describedby={showError ? errorId : undefined}
            className={`${baseInputClasses} resize-none ${inputClassName}`}
          />
        ) : (
          <input
            id={inputId}
            name={name}
            type={type === 'password' && showPassword ? 'text' : type}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            aria-invalid={showError}
            aria-describedby={showError ? errorId : undefined}
            className={`${baseInputClasses} ${inputClassName}`}
          />
        )}

        {/* Password toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {/* Validation icon */}
        {showValidation && validation.isTouched && type !== 'password' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {showSuccess && <Check className="w-5 h-5 text-green-500" />}
            {showError && <AlertCircle className="w-5 h-5 text-red-500" />}
          </div>
        )}
      </div>

      {/* Helper text or error messages */}
      {(helperText || (showError && validation.errors.length > 0)) && (
        <div
          id={errorId}
          className={`text-sm ${showError ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {showError ? validation.errors[0] : helperText}
        </div>
      )}
    </div>
  );
};

// Pre-configured common inputs
export const EmailInput: React.FC<Omit<FormInputProps, 'type' | 'validationRules'>> = (props) => (
  <FormInput
    type="email"
    autoComplete="email"
    validationRules={[
      { type: 'required', message: 'El email es requerido' },
      { type: 'email', message: 'Ingresa un email valido' },
    ]}
    {...props}
  />
);

export const PasswordInput: React.FC<Omit<FormInputProps, 'type' | 'validationRules'> & { minLength?: number }> = ({
  minLength = 6,
  ...props
}) => (
  <FormInput
    type="password"
    autoComplete="current-password"
    validationRules={[
      { type: 'required', message: 'La contrasena es requerida' },
      { type: 'minLength', value: minLength, message: `Minimo ${minLength} caracteres` },
    ]}
    {...props}
  />
);

export const PhoneInput: React.FC<Omit<FormInputProps, 'type' | 'validationRules'>> = (props) => (
  <FormInput
    type="tel"
    autoComplete="tel"
    validationRules={[
      { type: 'required', message: 'El telefono es requerido' },
      { type: 'pattern', value: /^[0-9]{10}$/, message: 'Ingresa 10 digitos' },
    ]}
    {...props}
  />
);

// Hook for form state management
export interface FormField {
  value: string;
  isValid: boolean;
  isTouched: boolean;
}

export type FormState<T extends string> = Record<T, FormField>;

export function useFormValidation<T extends string>(initialFields: T[]) {
  const [fields, setFields] = useState<FormState<T>>(() => {
    const initial = {} as FormState<T>;
    initialFields.forEach(field => {
      initial[field] = { value: '', isValid: false, isTouched: false };
    });
    return initial;
  });

  const setValue = (field: T, value: string) => {
    setFields(prev => ({
      ...prev,
      [field]: { ...prev[field], value },
    }));
  };

  const setValidity = (field: T, isValid: boolean) => {
    setFields(prev => ({
      ...prev,
      [field]: { ...prev[field], isValid, isTouched: true },
    }));
  };

  const isFormValid = Object.values(fields).every(
    (field) => (field as FormField).isValid
  );

  const resetForm = () => {
    setFields(prev => {
      const reset = {} as FormState<T>;
      Object.keys(prev).forEach(key => {
        reset[key as T] = { value: '', isValid: false, isTouched: false };
      });
      return reset;
    });
  };

  return { fields, setValue, setValidity, isFormValid, resetForm };
}

export default FormInput;
