import {
  APIResponse,
  LoginRequest,
  LoginResponseData,
  ListTaskResponseData,
  AddShellTaskRequest,
  AddShellTaskResponseData,
  DeleteTaskRequest,
  ListFilesResponseData,
  DeleteFileRequest,
  UploadScriptResponseData
} from '../types';

// Assuming the backend is running locally on port 8080 as per swagger
// In a real production build, this would likely be an environment variable
const BASE_URL = 'http://localhost:8080/api/v1';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('godo_token', token);
    } else {
      localStorage.removeItem('godo_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('godo_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Default to JSON content type unless it's FormData (file upload)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json: APIResponse<T> = await response.json();

    if (!response.ok || json.code !== 200) {
      if (response.status === 401 || json.code === 401) {
        this.setToken(null);
        window.location.reload(); // Simple redirect to login
        throw new Error('Unauthorized');
      }
      throw new Error(json.msg || 'API Error');
    }

    return json.data;
  }

  // Auth
  async login(data: LoginRequest): Promise<LoginResponseData> {
    return this.request<LoginResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Tasks
  async listTasks(): Promise<ListTaskResponseData> {
    return this.request<ListTaskResponseData>('/tasks/list', {
      method: 'GET',
    });
  }

  async addTask(data: AddShellTaskRequest): Promise<AddShellTaskResponseData> {
    return this.request<AddShellTaskResponseData>('/tasks/add_shell_task', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(data: DeleteTaskRequest): Promise<void> {
    return this.request<void>('/tasks/delete', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // Files
  async listFiles(): Promise<ListFilesResponseData> {
    return this.request<ListFilesResponseData>('/tasks/list_files', {
      method: 'GET',
    });
  }

  async uploadFile(file: File): Promise<UploadScriptResponseData> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<UploadScriptResponseData>('/tasks/upload_file', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteFile(data: DeleteFileRequest): Promise<void> {
    return this.request<void>('/tasks/delete_file', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
