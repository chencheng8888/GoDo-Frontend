import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Clock, Play, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { TaskResponse, AddShellTaskRequest } from '../types';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { renderJobDetails } from './showJobContent';
import CustomModal from './CustomModalProps';

import { Tabs } from 'antd';
import type { TabsProps } from 'antd';


import { Row, Col } from 'antd';

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
		use_shell: false,
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
	const [runningTasks, setRunningTasks] = useState<Record<string, boolean>>({});

	const handleRun = async (taskId: string) => {
		setRunningTasks(prev => ({ ...prev, [taskId]: true }));
		try {
			await api.runTask({ task_id: taskId });
			// 运行成功后刷新任务列表
			fetchTasks();
		} catch (err: any) {
			alert(err.message);
		} finally {
			// 恢复状态
			setRunningTasks(prev => ({ ...prev, [taskId]: false }));
		}
	};

	const handleDelete = async (taskId: string) => {
		try {
			await api.deleteTask({ task_id: taskId });
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
				...(newTask as AddShellTaskRequest),
				args: argInput.length > 0 ? argInput.split(' ') : [],
			});
			setIsModalOpen(false);
			setNewTask({
				task_name: '',
				description: '',
				command: '',
				args: [],
				scheduled_time: '0 * * * * *',
				timeout: 300,
				use_shell: true,
			});
			setArgInput('');
			fetchTasks();
		} catch (err: any) {
			alert(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	const createShellTaskTab = () => {
		return (
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
				<div className="flex items-center space-x-2 pt-2">
					<input type="checkbox" id="useShell" checked={newTask.use_shell} onChange={e => setNewTask({ ...newTask, use_shell: e.target.checked })} />
					<label htmlFor="useShell" className="text-sm text-slate-700">
						Use Shell
					</label>
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
		);
	};
	const createTaskTab: TabsProps['item'] = [
		{
			key: 'shell',
			label: 'Shell Task',
			children: createShellTaskTab(),
		},
	];

	const TaskList = ({ tasks, handleRun, runningTasks, handleDelete, renderJobDetails }) => {
		return (
			<Row gutter={[16, 16]} justify="start">
				{tasks.map(task => (
					<Col key={task.id} span={8}>
						<div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md p-6 flex flex-col">
							<div className="flex justify-between items-start mb-4">
								<div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">{task.job_type}</div>
								<div className="flex space-x-1">
									<button onClick={() => handleRun(task.id)} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Run Task">
										{runningTasks[task.id] ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
									</button>
									<CustomModal
										title="Are you sure you want to delete this task?"
										trigger={
											<button className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Delete">
												<Trash2 size={18} />
											</button>
										}
										okText="Yes"
										cancelText="No"
										onOk={() => handleDelete(task.id)}
										onCancel={() => {}}
									></CustomModal>
								</div>
							</div>

							<h3 className="text-lg font-bold text-slate-900 mb-1 break-all">{task.task_name}</h3>
							<p className="text-slate-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{task.description || 'No description provided'}</p>

							<div className="mt-auto space-y-4 pt-4 border-t border-slate-100">
								<div className="flex items-center text-sm text-slate-600">
									<Clock className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
									<span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs truncate w-full" title={task.scheduled_time}>
										{task.scheduled_time}
									</span>
								</div>
								<div className="w-full">
									<div className="flex items-center text-xs text-slate-500 mb-2">
										<Play className="mr-1 h-3 w-3" />
										<span className="font-semibold">Job Configuration</span>
									</div>
									{renderJobDetails(task.job)}
								</div>
							</div>
						</div>
					</Col>
				))}
			</Row>
		);
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
				TaskList({ tasks, handleRun, runningTasks, handleDelete, renderJobDetails })
			)}

			{/* Create Task Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto">
						<Tabs defaultActiveKey="shell" items={createTaskTab} />
					</div>
				</div>
			)}
		</div>
	);
};
