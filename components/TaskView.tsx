import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Clock, Play, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { TaskResponse, AddShellTaskRequest } from '../types';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { JobDetails } from './JobContent';
import CustomModal from './CustomModalProps';

import { Tabs, TabsProps, Row, Col, Drawer } from 'antd';

import { Card, Tag, Typography, Descriptions, Divider, Flex } from 'antd';
import { ClockCircleOutlined, SettingOutlined, ProjectOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface TaskViewProps {
	username: string;
}

export const TaskView: React.FC<TaskViewProps> = ({ username }) => {
	const [tasks, setTasks] = useState<TaskResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDrawOpen, setIsDrawOpen] = useState(false);
	// const [size, setSize] = useState(745);

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
	const createTaskTab: TabsProps['items'] = [
		{
			key: 'shell',
			label: 'Shell Task',
			children: createShellTaskTab(),
		},
	];

	const TaskList = ({ tasks, handleRun, runningTasks, handleDelete }) => {
		return (
			<Row gutter={[16, 16]} justify="start">
				{tasks.map(task => (
					<Col key={task.id} span={8}>
						<div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md p-6 flex flex-col">
							<div className="flex justify-between items-start mb-4">
								<div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">{task.job_type}</div>
								<div className="flex space-x-1">
									<Button variant="ghost" size="sm" onClick={() => setIsDrawOpen(true)}>
										<Eye className="h-4 w-4 mr-1" /> Details
									</Button>
									<Drawer title="Task Detail" placement="right" onClose={() => setIsDrawOpen(false)} open={isDrawOpen} size={745}>
										<Card
											hoverable
											className="task-card"
											style={{ width: '100%', minHeight: 300 }}
											// Card Title for Task Name and ID
											title={
												<Flex align="center" justify="space-between">
													<Title level={4} style={{ margin: 0, color: '#1890ff' }}>
														<ProjectOutlined style={{ marginRight: 8 }} />
														Task Name: {task.task_name}
													</Title>
													{/* Tag for TaskID */}
													<Tag color="default">TaskID: {task.id}</Tag>
												</Flex>
											}
											styles={{ body: { padding: '16px 24px' } }}
										>
											{/* Task Description Area */}
											<div style={{ marginBottom: 16 }}>
												<Text strong style={{ display: 'block', marginBottom: 8, color: '#595959' }}>
													Description
												</Text>
												{/* Description Content Styling */}
												<pre
													style={{
														backgroundColor: '#f9f9f9',
														padding: 12,
														borderRadius: 4,
														border: '1px solid #e8e8e8',
														fontSize: '12px',
														fontFamily: 'Consolas, monospace',
														whiteSpace: 'pre-wrap',
														overflowX: 'auto',
														minHeight: 100,
														color: '#262626',
													}}
												>
													{task.description || 'No description provided'}
												</pre>
											</div>

											<Divider style={{ margin: '12px 0' }} />

											{/* Footer Information */}
											<Flex vertical gap={12}>
												{/* Scheduled Time */}
												<Flex align="center">
													<ClockCircleOutlined style={{ color: '#faad14', marginRight: 8, fontSize: 16 }} />
													<Text strong style={{ color: '#595959' }}>
														Scheduled Time:
													</Text>
													<Tag color="default" style={{ marginLeft: 8 }} title={task.scheduled_time}>
														{task.scheduled_time}
													</Tag>
												</Flex>

												{/* Job Configuration */}
												<div>
													<Flex align="center" style={{ marginBottom: 8 }}>
														<SettingOutlined style={{ color: '#52c41a', marginRight: 8, fontSize: 16 }} />
														<Text strong style={{ color: '#595959', textTransform: 'uppercase' }}>
															Job Configuration
														</Text>
													</Flex>
													<JobDetails jobStr={task.job} />
												</div>
											</Flex>
										</Card>
									</Drawer>
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
									<Tag color="default" style={{ marginLeft: 8 }} title={task.scheduled_time}>
										{task.scheduled_time}
									</Tag>
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
				TaskList({ tasks, handleRun, runningTasks, handleDelete })
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
