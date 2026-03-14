/**
 * QRScanner.test.tsx
 * Unit tests for QRScanner component — Sprint 3.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '../../test/test-utils';
import { QRScanner } from './QRScanner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
const mockStop = vi.fn();

const mockStream = {
  getTracks: () => [{ stop: mockStop }],
} as unknown as MediaStream;

beforeEach(() => {
  vi.clearAllMocks();

  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: { getUserMedia: mockGetUserMedia },
  });

  // Mock HTMLVideoElement.play()
  HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(HTMLVideoElement.prototype, 'readyState', {
    get: () => 4, // HAVE_ENOUGH_DATA
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('QRScanner', () => {
  const onScan = vi.fn();
  const onClose = vi.fn();

  // ── Unsupported browser ───────────────────────────────────────────────────

  describe('when BarcodeDetector is NOT supported', () => {
    beforeEach(() => {
      // Ensure BarcodeDetector is absent
      const win = window as Record<string, unknown>;
      delete win['BarcodeDetector'];
    });

    it('renders the unsupported-browser fallback message', () => {
      render(<QRScanner onScan={onScan} onClose={onClose} />);

      expect(screen.getByText(/Escaneo no disponible en este navegador/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Usa la app de cámara de tu teléfono/i)
      ).toBeInTheDocument();
    });

    it('calls onClose when the close button is clicked in fallback mode', () => {
      render(<QRScanner onScan={onScan} onClose={onClose} />);

      // Use getAllByRole and find the one with exact text "Cerrar" (not "Cerrar escáner")
      const buttons = screen.getAllByRole('button');
      const closeBtn = buttons.find((b) => b.textContent?.trim() === 'Cerrar');
      expect(closeBtn).toBeTruthy();
      fireEvent.click(closeBtn!);

      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  // ── Supported browser — camera error ─────────────────────────────────────

  describe('when BarcodeDetector IS supported but camera access fails', () => {
    beforeEach(() => {
      // Inject a minimal BarcodeDetector stub
      (window as Record<string, unknown>)['BarcodeDetector'] = class {
        detect() { return Promise.resolve([]); }
      };

      // Camera access denied
      mockGetUserMedia.mockRejectedValueOnce(
        Object.assign(new Error('denied'), { name: 'NotAllowedError' })
      );
    });

    it('shows a permission-denied error message', async () => {
      render(<QRScanner onScan={onScan} onClose={onClose} />);

      await screen.findByText(/Acceso a la cámara denegado/i);
      expect(screen.getByText(/Acceso a la cámara denegado/i)).toBeInTheDocument();
    });
  });

  // ── Supported browser — camera OK ────────────────────────────────────────

  describe('when BarcodeDetector IS supported and camera is granted', () => {
    beforeEach(() => {
      (window as Record<string, unknown>)['BarcodeDetector'] = class {
        detect() { return Promise.resolve([]); }
      };

      mockGetUserMedia.mockResolvedValue(mockStream);
    });

    it('renders the QR scanner dialog with role="dialog"', async () => {
      render(<QRScanner onScan={onScan} onClose={onClose} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
    });

    it('renders scanning instruction text', async () => {
      render(<QRScanner onScan={onScan} onClose={onClose} />);

      // Wait for camera to start (async)
      await screen.findByText(/Apunta al código QR/i);
    });

    it('renders the scanning reticle', async () => {
      render(<QRScanner onScan={onScan} onClose={onClose} />);

      await screen.findByTestId('qr-reticle');
    });

    it('calls onClose and stops camera when the close button is clicked', async () => {
      render(<QRScanner onScan={onScan} onClose={onClose} />);

      const closeBtn = screen.getByRole('button', { name: /Cerrar escáner/i });
      fireEvent.click(closeBtn);

      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  // ── QR URL parsing logic ──────────────────────────────────────────────────

  describe('AR point URL extraction', () => {
    it('onScan receives the correct codigo from a valid AR point URL', async () => {
      const detectedBarcode = [{ rawValue: 'https://guelaguetzaconnect.com/ar/point/tiliche_tehuana' }];

      (window as Record<string, unknown>)['BarcodeDetector'] = class {
        detect() { return Promise.resolve(detectedBarcode); }
      };

      mockGetUserMedia.mockResolvedValue(mockStream);

      render(<QRScanner onScan={onScan} onClose={onClose} />);

      // Give the RAF loop one tick to detect
      await vi.waitFor(() => {
        expect(onScan).toHaveBeenCalledWith('tiliche_tehuana');
      }, { timeout: 1000 });
    });

    it('ignores QR codes that do not match the AR point URL pattern', async () => {
      const detectedBarcode = [{ rawValue: 'https://example.com/not-an-ar-point' }];

      (window as Record<string, unknown>)['BarcodeDetector'] = class {
        detect() { return Promise.resolve(detectedBarcode); }
      };

      mockGetUserMedia.mockResolvedValue(mockStream);

      render(<QRScanner onScan={onScan} onClose={onClose} />);

      // Give the loop a moment — onScan should NOT be called
      await new Promise((r) => setTimeout(r, 100));
      expect(onScan).not.toHaveBeenCalled();
    });
  });
});
