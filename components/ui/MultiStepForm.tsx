import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { ChevronLeft, ChevronRight, Check, AlertCircle, Save, Loader2 } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Types
// ============================================

interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  validate?: () => boolean | Promise<boolean>;
  optional?: boolean;
}

interface FormData {
  [key: string]: unknown;
}

interface MultiStepFormContextType<T extends FormData> {
  currentStep: number;
  totalSteps: number;
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  goToStep: (step: number) => void;
  goNext: () => Promise<boolean>;
  goBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  errors: Record<string, string>;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  isDirty: boolean;
  isSaving: boolean;
}

// ============================================
// Context
// ============================================

const MultiStepFormContext = createContext<MultiStepFormContextType<FormData> | null>(null);

export function useMultiStepForm<T extends FormData>() {
  const context = useContext(MultiStepFormContext) as MultiStepFormContextType<T> | null;
  if (!context) {
    throw new Error('useMultiStepForm must be used within MultiStepFormProvider');
  }
  return context;
}

// ============================================
// Auto-save Hook
// ============================================

const AUTOSAVE_DELAY = 2000;

function useAutoSave<T>(
  key: string,
  data: T,
  onSave?: (data: T) => Promise<void>
): { isSaving: boolean; lastSaved: Date | null } {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<T>(data);

  // Save to localStorage immediately
  useEffect(() => {
    try {
      localStorage.setItem(`form_${key}`, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }, [key, data]);

  // Debounced save to server
  useEffect(() => {
    if (!onSave) return;

    // Check if data actually changed
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    previousDataRef.current = data;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave(data);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave]);

  return { isSaving, lastSaved };
}

// ============================================
// MultiStepForm Component
// ============================================

interface MultiStepFormProps<T extends FormData> {
  steps: Step[];
  initialData?: T;
  storageKey?: string;
  onSubmit: (data: T) => Promise<void>;
  onAutoSave?: (data: T) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  showProgress?: boolean;
  showStepIndicator?: boolean;
  allowSkip?: boolean;
}

export function MultiStepForm<T extends FormData>({
  steps,
  initialData = {} as T,
  storageKey = 'multistep_form',
  onSubmit,
  onAutoSave,
  children,
  className = '',
  showProgress = true,
  showStepIndicator = true,
  allowSkip = false,
}: MultiStepFormProps<T>) {
  // Load saved data from localStorage
  const loadSavedData = (): T => {
    try {
      const saved = localStorage.getItem(`form_${storageKey}`);
      return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
    } catch {
      return initialData;
    }
  };

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<T>(loadSavedData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { isSaving, lastSaved } = useAutoSave(storageKey, data, onAutoSave);

  // Track changes
  useEffect(() => {
    setIsDirty(true);
  }, [data]);

  // Update single field
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  // Error handling
  const setError = useCallback((field: string, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Navigate to step
  const goToStep = useCallback((step: number) => {
    const newStep = Math.max(0, Math.min(steps.length - 1, step));
    setCurrentStep(newStep);
    triggerHaptic('selection');
  }, [steps.length]);

  // Go to next step
  const goNext = useCallback(async (): Promise<boolean> => {
    const step = steps[currentStep];

    // Validate current step
    if (step.validate) {
      const isValid = await step.validate();
      if (!isValid) {
        triggerHaptic('error');
        return false;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      triggerHaptic('selection');
      return true;
    } else {
      // Submit form
      setIsSubmitting(true);
      try {
        await onSubmit(data);
        triggerHaptic('success');

        // Clear saved data
        localStorage.removeItem(`form_${storageKey}`);

        return true;
      } catch (error) {
        console.error('Submit failed:', error);
        triggerHaptic('error');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [currentStep, steps, data, onSubmit, storageKey]);

  // Go to previous step
  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      triggerHaptic('selection');
    }
  }, [currentStep]);

  const contextValue: MultiStepFormContextType<T> = {
    currentStep,
    totalSteps: steps.length,
    data,
    setData,
    updateField,
    goToStep,
    goNext,
    goBack,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    isSubmitting,
    errors,
    setError,
    clearError,
    isDirty,
    isSaving,
  };

  return (
    <MultiStepFormContext.Provider value={contextValue as MultiStepFormContextType<FormData>}>
      <div className={className}>
        {/* Progress bar */}
        {showProgress && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Paso {currentStep + 1} de {steps.length}
              </span>
              {isSaving && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Loader2 size={12} className="animate-spin" />
                  Guardando...
                </span>
              )}
              {!isSaving && lastSaved && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Save size={12} />
                  Guardado
                </span>
              )}
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-oaxaca-pink transition-all duration-300 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step indicator */}
        {showStepIndicator && (
          <div className="flex items-center justify-center mb-8 overflow-x-auto py-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {index > 0 && (
                  <div
                    className={`flex-shrink-0 w-12 h-0.5 mx-1 ${
                      index <= currentStep ? 'bg-oaxaca-pink' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
                <button
                  onClick={() => allowSkip && goToStep(index)}
                  disabled={!allowSkip}
                  className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    index < currentStep
                      ? 'bg-oaxaca-pink border-oaxaca-pink text-white'
                      : index === currentStep
                      ? 'border-oaxaca-pink text-oaxaca-pink'
                      : 'border-gray-300 dark:border-gray-600 text-gray-400'
                  } ${allowSkip ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                >
                  {index < currentStep ? (
                    <Check size={18} />
                  ) : step.icon ? (
                    step.icon
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Current step info */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {steps[currentStep].title}
          </h2>
          {steps[currentStep].description && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {steps[currentStep].description}
            </p>
          )}
        </div>

        {/* Form content */}
        {children}
      </div>
    </MultiStepFormContext.Provider>
  );
}

// ============================================
// FormStep Component
// ============================================

interface FormStepProps {
  step: number;
  children: React.ReactNode;
  className?: string;
}

export const FormStep: React.FC<FormStepProps> = ({
  step,
  children,
  className = '',
}) => {
  const { currentStep } = useMultiStepForm();

  if (currentStep !== step) return null;

  return (
    <div className={`animate-in fade-in slide-in-from-right-4 duration-300 ${className}`}>
      {children}
    </div>
  );
};

// ============================================
// FormNavigation Component
// ============================================

interface FormNavigationProps {
  nextLabel?: string;
  backLabel?: string;
  submitLabel?: string;
  className?: string;
  showBack?: boolean;
}

export const FormNavigation: React.FC<FormNavigationProps> = ({
  nextLabel = 'Siguiente',
  backLabel = 'Atrás',
  submitLabel = 'Enviar',
  className = '',
  showBack = true,
}) => {
  const { goBack, goNext, isFirstStep, isLastStep, isSubmitting } = useMultiStepForm();

  return (
    <div className={`flex items-center justify-between mt-8 ${className}`}>
      {showBack && !isFirstStep ? (
        <button
          type="button"
          onClick={goBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
        >
          <ChevronLeft size={18} />
          {backLabel}
        </button>
      ) : (
        <div />
      )}

      <button
        type="button"
        onClick={goNext}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-6 py-3 bg-oaxaca-pink text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Enviando...
          </>
        ) : isLastStep ? (
          <>
            <Check size={18} />
            {submitLabel}
          </>
        ) : (
          <>
            {nextLabel}
            <ChevronRight size={18} />
          </>
        )}
      </button>
    </div>
  );
};

// ============================================
// FormField Component
// ============================================

interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  required = false,
  hint,
  children,
  className = '',
}) => {
  const { errors } = useMultiStepForm();
  const error = errors[name];

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="flex items-center gap-1 text-sm text-red-500 mt-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{hint}</p>
      )}
    </div>
  );
};

// ============================================
// FormInput Component
// ============================================

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  name: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  name,
  className = '',
  ...props
}) => {
  const { data, updateField, errors } = useMultiStepForm();
  const hasError = !!errors[name];

  return (
    <input
      value={(data[name] as string) || ''}
      onChange={(e) => updateField(name, e.target.value)}
      className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-oaxaca-pink ${
        hasError
          ? 'border-red-500 focus:ring-red-500'
          : 'border-gray-200 dark:border-gray-700'
      } ${className}`}
      {...props}
    />
  );
};

// ============================================
// FormTextarea Component
// ============================================

interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  name: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  name,
  className = '',
  ...props
}) => {
  const { data, updateField, errors } = useMultiStepForm();
  const hasError = !!errors[name];

  return (
    <textarea
      value={(data[name] as string) || ''}
      onChange={(e) => updateField(name, e.target.value)}
      className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-oaxaca-pink resize-none ${
        hasError
          ? 'border-red-500 focus:ring-red-500'
          : 'border-gray-200 dark:border-gray-700'
      } ${className}`}
      {...props}
    />
  );
};

// ============================================
// FormSelect Component
// ============================================

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  name: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  name,
  options,
  placeholder = 'Seleccionar...',
  className = '',
  ...props
}) => {
  const { data, updateField, errors } = useMultiStepForm();
  const hasError = !!errors[name];

  return (
    <select
      value={(data[name] as string) || ''}
      onChange={(e) => updateField(name, e.target.value)}
      className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oaxaca-pink ${
        hasError
          ? 'border-red-500 focus:ring-red-500'
          : 'border-gray-200 dark:border-gray-700'
      } ${className}`}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// ============================================
// FormCheckbox Component
// ============================================

interface FormCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  name: string;
  label: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  name,
  label,
  className = '',
  ...props
}) => {
  const { data, updateField } = useMultiStepForm();

  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={!!data[name]}
        onChange={(e) => updateField(name, e.target.checked)}
        className="w-5 h-5 rounded border-gray-300 text-oaxaca-pink focus:ring-oaxaca-pink"
        {...props}
      />
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
};

export default MultiStepForm;
