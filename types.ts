export interface APIResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
}

export interface TaskResponse {
  id: string;
  task_name: string;
  description: string;
  scheduled_time: string; // Cron expression
  job_type: string;
  job: string; // JSON string
  owner_name: string;
}

export interface ListTaskResponseData {
  tasks: TaskResponse[];
}

export interface AddShellTaskRequest {
  task_name: string;
  description: string;
  command: string;
  args?: string[];
  scheduled_time: string;
  timeout: number;
  use_shell?: boolean;
}

export interface AddShellTaskResponseData {
  task_id: string;
}

export interface DeleteTaskRequest {
  task_id: string;
  user_name: string;
}

export interface ListFilesResponseData {
  files: string[];
}

export interface DeleteFileRequest {
  file_name: string;
}

export interface UploadScriptResponseData {
  file_name: string;
}

// Internal app types
export type ViewState = 'tasks' | 'files';

export interface UserSession {
  username: string;
  token: string;
}
