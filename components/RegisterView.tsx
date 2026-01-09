import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, User, MapPin, Camera, ArrowRight, ArrowLeft, Check, Scan } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ViewState } from '../types';
import FormInput from './ui/FormInput';
import LoadingButton from './ui/LoadingButton';

interface RegisterViewProps {
  setView: (view: ViewState) => void;
}

const REGIONS = [
  'Valles Centrales',
  'Sierra Norte',
  'Sierra Sur',
  'Mixteca',
  'Costa',
  'Istmo',
  'Papaloapan',
  'Canada',
  'Fuera de Oaxaca',
];

const RegisterView: React.FC<RegisterViewProps> = ({ setView }) => {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    region: '',
  });
  const [formValid, setFormValid] = useState({
    nombre: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [faceData, setFaceData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isStep1Valid = formValid.nombre && formValid.email && formValid.password && formValid.confirmPassword;

  useEffect(() => {
    if (!showCamera) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('No se pudo acceder a la camara');
        setShowCamera(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [showCamera]);

  const handleFieldChange = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleNextStep = () => {
    if (isStep1Valid) {
      setStep(2);
      setError('');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setFaceData(imageData);
    setPhotoTaken(true);
    setShowCamera(false);

    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  const retakePhoto = () => {
    setFaceData(null);
    setPhotoTaken(false);
    setShowCamera(true);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');

    const success = await register({
      email: formData.email,
      password: formData.password,
      nombre: formData.nombre,
      apellido: formData.apellido,
      region: formData.region,
      faceData: faceData || undefined,
    });

    if (success) {
      setView(ViewState.HOME);
    } else {
      setError('Error al crear cuenta. El correo puede estar en uso.');
    }
    setIsLoading(false);
  };

  const skipFaceId = async () => {
    await handleRegister();
  };

  // Step 2: Face ID Setup
  if (step === 2) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        <div className="bg-oaxaca-purple p-4 flex items-center gap-4">
          <button onClick={() => setStep(1)} className="text-white p-2 rounded-full hover:bg-white/10">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-white font-bold text-lg">Configura Face ID</h2>
            <p className="text-white/70 text-sm">Paso 2 de 2 - Opcional</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
          {showCamera ? (
            <>
              <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-oaxaca-purple mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-56 border-4 border-white/50 rounded-[50%]" />
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />

              <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6">
                Coloca tu rostro dentro del circulo
              </p>

              <LoadingButton onClick={capturePhoto} icon={Camera}>
                Tomar Foto
              </LoadingButton>
            </>
          ) : photoTaken && faceData ? (
            <>
              <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-green-500 mb-6">
                <img src={faceData} alt="Tu foto" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-green-500 p-2 rounded-full">
                  <Check className="text-white" size={20} />
                </div>
              </div>

              <p className="text-green-600 font-medium mb-6">Foto capturada!</p>

              <div className="flex gap-3 w-full max-w-xs">
                <LoadingButton variant="outline" onClick={retakePhoto} fullWidth>
                  Repetir
                </LoadingButton>
                <LoadingButton
                  onClick={handleRegister}
                  loading={isLoading}
                  loadingText="Creando..."
                  fullWidth
                >
                  Continuar
                </LoadingButton>
              </div>
            </>
          ) : (
            <>
              <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <Scan className="w-16 h-16 text-gray-400" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Face ID</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8 max-w-xs">
                Configura Face ID para iniciar sesion mas rapido solo con tu rostro
              </p>

              <LoadingButton
                onClick={() => setShowCamera(true)}
                icon={Camera}
                fullWidth
                className="max-w-xs"
              >
                Configurar Face ID
              </LoadingButton>

              <button
                onClick={skipFaceId}
                disabled={isLoading}
                className="mt-4 text-gray-400 dark:text-gray-500 text-sm hover:text-gray-600 dark:hover:text-gray-300"
              >
                {isLoading ? 'Creando cuenta...' : 'Omitir por ahora'}
              </button>
            </>
          )}

          {error && (
            <p className="text-red-500 text-sm mt-4">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Basic Info
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="bg-oaxaca-purple p-4 flex items-center gap-4">
        <button onClick={() => setView(ViewState.LOGIN)} className="text-white p-2 rounded-full hover:bg-white/10">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-white font-bold text-lg">Crear Cuenta</h2>
          <p className="text-white/70 text-sm">Paso 1 de 2 - Informacion</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <div className="space-y-4">
          <FormInput
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleFieldChange('nombre')}
            placeholder="Tu nombre"
            icon={User}
            required
            validationRules={[
              { type: 'required', message: 'El nombre es requerido' },
              { type: 'minLength', value: 2, message: 'Minimo 2 caracteres' },
            ]}
          />

          <FormInput
            label="Apellido"
            name="apellido"
            value={formData.apellido}
            onChange={handleFieldChange('apellido')}
            placeholder="Tu apellido (opcional)"
            icon={User}
          />

          <FormInput
            label="Correo electronico"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleFieldChange('email')}
            placeholder="tu@correo.com"
            icon={Mail}
            required
            autoComplete="email"
            validationRules={[
              { type: 'required', message: 'El email es requerido' },
              { type: 'email', message: 'Ingresa un email valido' },
            ]}
          />

          <FormInput
            label="Contrasena"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleFieldChange('password')}
            placeholder="Minimo 6 caracteres"
            icon={Lock}
            required
            autoComplete="new-password"
            validationRules={[
              { type: 'required', message: 'La contrasena es requerida' },
              { type: 'minLength', value: 6, message: 'Minimo 6 caracteres' },
            ]}
          />

          <FormInput
            label="Confirmar contrasena"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleFieldChange('confirmPassword')}
            placeholder="Repite tu contrasena"
            icon={Lock}
            required
            autoComplete="new-password"
            matchValue={formData.password}
            validationRules={[
              { type: 'required', message: 'Confirma tu contrasena' },
              { type: 'match', message: 'Las contrasenas no coinciden' },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Region de origen
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                name="region"
                value={formData.region}
                onChange={(e) => handleFieldChange('region')(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-oaxaca-pink dark:focus:border-oaxaca-pink outline-none appearance-none text-gray-900 dark:text-gray-100"
              >
                <option value="">Selecciona tu region (opcional)</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <LoadingButton
          onClick={handleNextStep}
          disabled={!isStep1Valid}
          icon={ArrowRight}
          iconPosition="right"
          fullWidth
          size="lg"
        >
          Siguiente
        </LoadingButton>
      </div>
    </div>
  );
};

export default RegisterView;
