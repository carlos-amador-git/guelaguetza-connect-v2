/**
 * Tripo3D Service — Image-to-3D generation via Tripo3D API v2
 *
 * Flow:
 * 1. POST /upload  — upload image, receive file_token
 * 2. POST /task    — create task with file_token, receive task_id
 * 3. GET  /task/{task_id} — poll until status === 'success'
 * 4. Result includes a .glb model download URL
 *
 * When TRIPO3D_API_KEY is not set, all methods return safe mock responses.
 */

export interface Tripo3DGenerateResult {
  taskId: string;
  status: string;
}

export interface Tripo3DTaskStatus {
  status: 'queued' | 'running' | 'success' | 'failed';
  progress: number;
  output?: {
    model_url: string;
    rendered_image_url?: string;
  };
}

interface TripoUploadResponse {
  code: number;
  data: {
    image_token: string;
  };
}

interface TripoTaskCreateResponse {
  code: number;
  data: {
    task_id: string;
  };
}

interface TripoTaskStatusResponse {
  code: number;
  data: {
    task_id: string;
    status: 'queued' | 'running' | 'success' | 'failed';
    progress: number;
    output?: {
      model: string;
      rendered_image?: string;
    };
    message?: string;
  };
}

export class Tripo3DService {
  private apiKey: string;
  private baseUrl = 'https://api.tripo3d.ai/v2/openapi';

  constructor() {
    this.apiKey = process.env.TRIPO3D_API_KEY || '';
  }

  isEnabled(): boolean {
    return !!this.apiKey;
  }

  /**
   * Upload an image (base64) and start 3D model generation.
   * Returns taskId and initial status.
   *
   * When service is disabled, returns a mock taskId in the same format
   * as the stub in ar.ts so existing polling logic still works.
   */
  async generateFromImage(
    imageBase64: string,
    options?: { style?: 'realistic' | 'cartoon' | 'stylized' }
  ): Promise<Tripo3DGenerateResult> {
    if (!this.isEnabled()) {
      // Stub behaviour — mirror the existing timestamp-based mock
      const taskId = `alebrije-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return { taskId, status: 'pending' };
    }

    // Step 1: Upload image to get a file token
    const fileToken = await this._uploadImage(imageBase64);

    // Step 2: Create the generation task
    const taskId = await this._createTask(fileToken, options?.style);

    return { taskId, status: 'queued' };
  }

  /**
   * Check the status of a generation task.
   * When disabled, returns the same timestamp-based mock as the stub.
   */
  async getTaskStatus(taskId: string): Promise<Tripo3DTaskStatus> {
    if (!this.isEnabled()) {
      const createdMs = parseInt(taskId.split('-')[1] ?? '0', 10);
      const elapsedMs = Date.now() - createdMs;
      const isReady = elapsedMs >= 5_000;

      return {
        status: isReady ? 'success' : 'running',
        progress: isReady ? 100 : Math.min(80, Math.round((elapsedMs / 5_000) * 80)),
        output: isReady
          ? { model_url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb' }
          : undefined,
      };
    }

    const url = `${this.baseUrl}/task/${encodeURIComponent(taskId)}`;
    const response = await fetch(url, {
      headers: this._authHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Tripo3D status check failed: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as TripoTaskStatusResponse;
    if (json.code !== 0) {
      throw new Error(`Tripo3D API error: ${json.code}`);
    }

    const { status, progress, output } = json.data;
    return {
      status,
      progress: progress ?? 0,
      output: output
        ? {
            model_url: output.model,
            rendered_image_url: output.rendered_image,
          }
        : undefined,
    };
  }

  /**
   * Download the generated 3D model from its URL.
   * Returns the raw buffer (GLB binary).
   */
  async downloadModel(modelUrl: string): Promise<Buffer> {
    const response = await fetch(modelUrl, {
      headers: this.isEnabled() ? this._authHeaders() : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private _authHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private async _uploadImage(imageBase64: string): Promise<string> {
    // Remove data-URI prefix if present (e.g. "data:image/png;base64,")
    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify({
        file: {
          type: 'jpg',
          data: base64Data,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Tripo3D upload failed: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as TripoUploadResponse;
    if (json.code !== 0) {
      throw new Error(`Tripo3D upload API error: ${json.code}`);
    }

    return json.data.image_token;
  }

  private async _createTask(
    imageToken: string,
    style?: 'realistic' | 'cartoon' | 'stylized'
  ): Promise<string> {
    const body: Record<string, unknown> = {
      type: 'image_to_model',
      file: {
        type: 'jpg',
        file_token: imageToken,
      },
    };

    if (style) {
      body['model_version'] = style === 'cartoon' ? 'v2.0-20240919' : 'v2.5-20250123';
    }

    const response = await fetch(`${this.baseUrl}/task`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Tripo3D task creation failed: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as TripoTaskCreateResponse;
    if (json.code !== 0) {
      throw new Error(`Tripo3D task API error: ${json.code}`);
    }

    return json.data.task_id;
  }
}
