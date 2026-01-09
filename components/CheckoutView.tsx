import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  MapPin,
  CreditCard,
  CheckCircle,
  Package,
  Truck,
  AlertCircle,
} from 'lucide-react';
import {
  getCart,
  clearCart,
  Cart,
  ShippingAddress,
  formatPrice,
} from '../services/marketplace';
import LoadingSpinner from './ui/LoadingSpinner';
import { ViewState } from '../types';

interface CheckoutViewProps {
  onNavigate: (view: ViewState, data?: unknown) => void;
  onBack: () => void;
}

type CheckoutStep = 'shipping' | 'payment' | 'confirmation';

export default function CheckoutView({ onNavigate, onBack }: CheckoutViewProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const [shipping, setShipping] = useState<ShippingAddress>({
    name: '',
    street: '',
    city: '',
    state: 'Oaxaca',
    postalCode: '',
    phone: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'oxxo' | 'transfer'>('card');

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await getCart();
      setCart(data);

      // Pre-fill demo data
      setShipping(prev => ({
        ...prev,
        name: 'Usuario Demo',
        phone: '951 123 4567',
      }));
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentSubmit = async () => {
    setProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clear cart after successful order
    await clearCart();

    setProcessing(false);
    setStep('confirmation');
    setOrderComplete(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Preparando checkout..." />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col h-full bg-gray-50 items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg mb-4">No hay productos en el carrito</p>
        <button
          onClick={() => onNavigate(ViewState.TIENDA)}
          className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium"
        >
          Ir a la tienda
        </button>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="flex flex-col h-full bg-white items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Pedido Confirmado!
        </h1>
        <p className="text-gray-500 mb-2">
          Orden #GC-{Math.random().toString(36).substring(2, 8).toUpperCase()}
        </p>
        <p className="text-gray-600 mb-8 max-w-sm">
          Recibirás un correo con los detalles de tu pedido. Los artesanos se pondrán en contacto contigo pronto.
        </p>

        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
            <Truck className="w-6 h-6 text-amber-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Tiempo estimado</p>
              <p className="text-sm text-gray-500">5-10 días hábiles</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate(ViewState.TIENDA)}
            className="w-full py-4 bg-amber-500 text-white rounded-lg font-medium"
          >
            Seguir comprando
          </button>

          <button
            onClick={() => onNavigate(ViewState.HOME)}
            className="w-full py-4 border border-gray-300 text-gray-700 rounded-lg font-medium"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const shippingCost = cart.subtotal >= 1500 ? 0 : 150;
  const total = cart.subtotal + shippingCost;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 pt-12">
        <div className="flex items-center gap-3">
          <button
            onClick={() => step === 'shipping' ? onBack() : setStep('shipping')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Checkout</h1>
            <p className="text-sm text-gray-500">
              {step === 'shipping' && 'Datos de envío'}
              {step === 'payment' && 'Método de pago'}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mt-4">
          <div className={`flex-1 h-1 rounded ${step === 'shipping' || step === 'payment' ? 'bg-amber-500' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1 rounded ${step === 'payment' ? 'bg-amber-500' : 'bg-gray-200'}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {step === 'shipping' && (
          <form onSubmit={handleShippingSubmit} className="space-y-4">
            <div className="bg-white rounded-xl p-4">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                Dirección de envío
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nombre completo</label>
                  <input
                    type="text"
                    required
                    value={shipping.name}
                    onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Dirección</label>
                  <input
                    type="text"
                    required
                    value={shipping.street}
                    onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Calle, número, colonia"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Ciudad</label>
                    <input
                      type="text"
                      required
                      value={shipping.city}
                      onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Ciudad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">C.P.</label>
                    <input
                      type="text"
                      required
                      value={shipping.postalCode}
                      onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="68000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    required
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="951 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Notas (opcional)</label>
                  <textarea
                    value={shipping.notes}
                    onChange={(e) => setShipping({ ...shipping, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Instrucciones especiales de entrega"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl p-4">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                Resumen del pedido
              </h2>

              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatPrice(parseFloat(item.product.price) * item.quantity)}
                    </span>
                  </div>
                ))}

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatPrice(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                      {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  {cart.subtotal < 1500 && (
                    <p className="text-xs text-gray-500">
                      Envío gratis en compras mayores a $1,500
                    </p>
                  )}
                </div>

                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-amber-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-amber-500 text-white rounded-lg font-medium"
            >
              Continuar al pago
            </button>
          </form>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                Método de pago
              </h2>

              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                  paymentMethod === 'card' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="w-4 h-4 text-amber-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Tarjeta de crédito/débito</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard, AMEX</p>
                  </div>
                  <CreditCard className="w-6 h-6 text-gray-400" />
                </label>

                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                  paymentMethod === 'oxxo' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'oxxo'}
                    onChange={() => setPaymentMethod('oxxo')}
                    className="w-4 h-4 text-amber-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium">OXXO Pay</p>
                    <p className="text-sm text-gray-500">Pago en efectivo en tiendas OXXO</p>
                  </div>
                  <span className="text-xs font-bold text-red-600">OXXO</span>
                </label>

                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                  paymentMethod === 'transfer' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'transfer'}
                    onChange={() => setPaymentMethod('transfer')}
                    className="w-4 h-4 text-amber-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Transferencia bancaria</p>
                    <p className="text-sm text-gray-500">SPEI - Recibe instrucciones por correo</p>
                  </div>
                </label>
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div className="bg-white rounded-xl p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Número de tarjeta</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Fecha de vencimiento</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total a pagar</span>
                <span className="text-2xl font-bold text-amber-600">{formatPrice(total)}</span>
              </div>
            </div>

            <p className="text-xs text-center text-gray-500 px-4">
              Este es un modo de demostración. No se procesarán pagos reales.
            </p>

            <button
              onClick={handlePaymentSubmit}
              disabled={processing}
              className="w-full py-4 bg-amber-500 text-white rounded-lg font-medium disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                `Pagar ${formatPrice(total)}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
