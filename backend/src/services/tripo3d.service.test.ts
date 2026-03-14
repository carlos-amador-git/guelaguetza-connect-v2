/**
 * tripo3d.service.test.ts
 * Unit tests for Tripo3DService — Sprint 3.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Tripo3DService } from './tripo3d.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createService(apiKey?: string): Tripo3DService {
  const original = process.env.TRIPO3D_API_KEY;
  process.env.TRIPO3D_API_KEY = apiKey ?? '';
  const service = new Tripo3DService();
  process.env.TRIPO3D_API_KEY = original; // restore
  return service;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Tripo3DService', () => {
  const FAKE_KEY = 'tripo-test-key-abc123';
  const MOCK_IMAGE_B64 = 'data:image/png;base64,iVBORw0KGgo=';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.TRIPO3D_API_KEY;
  });

  // ── isEnabled ──────────────────────────────────────────────────────────────

  describe('isEnabled()', () => {
    it('returns false when TRIPO3D_API_KEY is not set', () => {
      delete process.env.TRIPO3D_API_KEY;
      const service = new Tripo3DService();
      expect(service.isEnabled()).toBe(false);
    });

    it('returns false when TRIPO3D_API_KEY is an empty string', () => {
      process.env.TRIPO3D_API_KEY = '';
      const service = new Tripo3DService();
      expect(service.isEnabled()).toBe(false);
    });

    it('returns true when TRIPO3D_API_KEY is set', () => {
      process.env.TRIPO3D_API_KEY = FAKE_KEY;
      const service = new Tripo3DService();
      expect(service.isEnabled()).toBe(true);
    });
  });

  // ── generateFromImage (disabled / stub mode) ───────────────────────────────

  describe('generateFromImage() — stub mode (service disabled)', () => {
    it('returns a taskId and pending status without calling fetch', async () => {
      delete process.env.TRIPO3D_API_KEY;
      const service = new Tripo3DService();
      const fetchSpy = vi.spyOn(global, 'fetch');

      const result = await service.generateFromImage(MOCK_IMAGE_B64);

      expect(result).toMatchObject({ status: 'pending' });
      expect(result.taskId).toMatch(/^alebrije-\d+-[a-z0-9]+$/);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('stub taskId follows the timestamp-based naming convention', async () => {
      delete process.env.TRIPO3D_API_KEY;
      const service = new Tripo3DService();
      const before = Date.now();
      const result = await service.generateFromImage(MOCK_IMAGE_B64);
      const after = Date.now();

      const parts = result.taskId.split('-');
      expect(parts[0]).toBe('alebrije');
      const ts = parseInt(parts[1], 10);
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });
  });

  // ── getTaskStatus (disabled / stub mode) ──────────────────────────────────

  describe('getTaskStatus() — stub mode (service disabled)', () => {
    it('returns running/processing for a recently created taskId', async () => {
      delete process.env.TRIPO3D_API_KEY;
      const service = new Tripo3DService();

      // Newly created task (within the last 1 s)
      const taskId = `alebrije-${Date.now()}-abc123`;
      const result = await service.getTaskStatus(taskId);

      expect(result.status).toBe('running');
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThan(100);
      expect(result.output).toBeUndefined();
    });

    it('returns success with model_url after 5 seconds have elapsed', async () => {
      delete process.env.TRIPO3D_API_KEY;
      const service = new Tripo3DService();

      // Simulate an old task (created 10 s ago)
      const oldTs = Date.now() - 10_000;
      const taskId = `alebrije-${oldTs}-xyz789`;
      const result = await service.getTaskStatus(taskId);

      expect(result.status).toBe('success');
      expect(result.progress).toBe(100);
      expect(result.output).toBeDefined();
      expect(result.output!.model_url).toBeTruthy();
    });
  });

  // ── generateFromImage (enabled / real API) ────────────────────────────────

  describe('generateFromImage() — enabled mode (real API)', () => {
    it('calls upload then task endpoints and returns taskId + queued status', async () => {
      process.env.TRIPO3D_API_KEY = FAKE_KEY;
      const service = new Tripo3DService();

      const fetchMock = vi
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ code: 0, data: { image_token: 'tok_abc' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ code: 0, data: { task_id: 'real-task-999' } }),
        } as Response);

      const result = await service.generateFromImage(MOCK_IMAGE_B64, { style: 'realistic' });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.taskId).toBe('real-task-999');
      expect(result.status).toBe('queued');
    });

    it('throws when upload API returns non-zero code', async () => {
      process.env.TRIPO3D_API_KEY = FAKE_KEY;
      const service = new Tripo3DService();

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 4001, data: {} }),
      } as Response);

      await expect(service.generateFromImage(MOCK_IMAGE_B64)).rejects.toThrow(
        'Tripo3D upload API error: 4001'
      );
    });
  });

  // ── getTaskStatus (enabled / real API) ───────────────────────────────────

  describe('getTaskStatus() — enabled mode (real API)', () => {
    it('maps API success response to the correct shape', async () => {
      process.env.TRIPO3D_API_KEY = FAKE_KEY;
      const service = new Tripo3DService();

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            task_id: 'real-task-999',
            status: 'success',
            progress: 100,
            output: {
              model: 'https://cdn.tripo3d.ai/models/real-task-999.glb',
              rendered_image: 'https://cdn.tripo3d.ai/thumbs/real-task-999.png',
            },
          },
        }),
      } as Response);

      const result = await service.getTaskStatus('real-task-999');

      expect(result.status).toBe('success');
      expect(result.progress).toBe(100);
      expect(result.output?.model_url).toBe('https://cdn.tripo3d.ai/models/real-task-999.glb');
      expect(result.output?.rendered_image_url).toBe(
        'https://cdn.tripo3d.ai/thumbs/real-task-999.png'
      );
    });

    it('throws when the HTTP response is not OK', async () => {
      process.env.TRIPO3D_API_KEY = FAKE_KEY;
      const service = new Tripo3DService();

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(service.getTaskStatus('some-task')).rejects.toThrow(
        'Tripo3D status check failed: 401 Unauthorized'
      );
    });
  });
});
