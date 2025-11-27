import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Clock, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { TaskResponse, AddShellTaskRequest } from '../types';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface TaskViewProps {
	username: string;
}

export const TaskView: React.FC<TaskViewProps> = ({ username }) => {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [newTask, setNewTask] = useState<Partial<AddShellTaskRequest>>({
    task_name: '',
    description: '',
    command: '',
    args: [],
    scheduled_time: '0 * * * * *', // Default cron
    timeout: 300,
    use_shell: true
  });
  const [argInput, setArgInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.listTasks();
      setTasks(res.tasks || []); // Handle potential null
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask({ task_id: taskId, user_name: username });
      fetchTasks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addTask({
        ...newTask as AddShellTaskRequest,
        args: argInput.length > 0 ? argInput.split(' ') : []
      });
      setIsModalOpen(false);
      setNewTask({
        task_name: '',
        description: '',
        command: '',
        args: [],
        scheduled_time: '0 * * * * *',
        timeout: 300,
        use_shell: true
      });
      setArgInput('');
      fetchTasks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };
    const getCommandDisplay = (jobJson: string) => {
        try {
            const job = JSON.parse(jobJson || '{}');
            const parts = [];
            if (job.command) parts.push(job.command);
            if (Array.isArray(job.args) && job.args.length > 0) parts.push(job.args.join(' '));
            return parts.join(' ') || 'No command specified';
        } catch (e) {
            return 'Invalid Job Data';
        }
    };
    
    
  return (
		<div>
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
					<p className="text-slate-500 mt-1">Manage your automated shell scripts and cron jobs.</p>
				</div>
				<div className="flex space-x-2">
					<Button variant="secondary" onClick={fetchTasks} title="Refresh List">
						<RefreshCw size={18} />
					</Button>
					<Button onClick={() => setIsModalOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						New Task
					</Button>
				</div>
			</div>

			{error && (
				<div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center">
					<AlertCircle className="mr-2 h-5 w-5" />
					{error}
				</div>
			)}

			{loading ? (
				<div className="flex justify-center py-12">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
				</div>
			) : tasks.length === 0 ? (
				<div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
					<div className="mx-auto h-12 w-12 text-slate-400 mb-4">
						<Clock />
					</div>
					<h3 className="text-lg font-medium text-slate-900">No tasks found</h3>
					<p className="text-slate-500 mt-1">Get started by creating a new shell task.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{tasks.map(task => (
						<div key={task.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
							<div className="flex justify-between items-start mb-4">
								<div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">{task.job_type}</div>
								<button onClick={() => handleDelete(task.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1">
									<Trash2 size={18} />
								</button>
							</div>

							<h3 className="text-lg font-bold text-slate-900 mb-1">{task.task_name}</h3>
							<p className="text-slate-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{task.description || 'No description provided'}</p>

							<div className="mt-auto space-y-3 pt-4 border-t border-slate-100">
								<div className="flex items-center text-sm text-slate-600">
									<Clock className="mr-2 h-4 w-4 text-slate-400" />
									<span className="font-mono bg-slate-100 px-1 rounded">{task.scheduled_time}</span>
								</div>
								<div className="flex items-center text-sm text-slate-600">
									<Play className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
									<code className="text-xs bg-slate-800 text-green-400 px-2 py-1 rounded w-full truncate" title={getCommandDisplay(task.job)}>
										{getCommandDisplay(task.job)}
									</code>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Create Task Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6 animate-fade-in-up">
						<h2 className="text-xl font-bold text-slate-900 mb-4">Create New Task</h2>
						<form onSubmit={handleCreateSubmit} className="space-y-4">
							<Input label="Task Name" value={newTask.task_name} onChange={e => setNewTask({ ...newTask, task_name: e.target.value })} required placeholder="e.g., daily-db-backup" />
							<Input label="Description" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} required placeholder="Brief description of the task" />
							<div className="grid grid-cols-2 gap-4">
								<Input label="Command / Script" value={newTask.command} onChange={e => setNewTask({ ...newTask, command: e.target.value })} required placeholder="./script.sh" />
								<Input label="Timeout (seconds)" type="number" value={newTask.timeout} onChange={e => setNewTask({ ...newTask, timeout: parseInt(e.target.value) })} required max={7200} />
							</div>
							<Input label="Arguments (space separated)" value={argInput} onChange={e => setArgInput(e.target.value)} placeholder="--force --verbose" />
							<div>
								<Input label="Cron Schedule (Seconds Minutes Hours Day Month Week)" value={newTask.scheduled_time} onChange={e => setNewTask({ ...newTask, scheduled_time: e.target.value })} required placeholder="0 30 2 * * *" />
								<p className="text-xs text-slate-500 mt-1">Example: "0 0 12 * * *" (Every day at 12:00:00)</p>
							</div>

							<div className="flex justify-end space-x-3 mt-6">
								<Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" isLoading={submitting}>
									Create Task
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
  );
};
