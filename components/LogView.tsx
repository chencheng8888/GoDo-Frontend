import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, Terminal, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { api } from '../services/api';
import { TaskLog } from '../types';
import { Button } from './ui/Button';
import { JobDetails } from './JobContent';

interface LogViewProps {
	username: string;
}

export const LogView: React.FC<LogViewProps> = ({ username }) => {
	const [logs, setLogs] = useState<TaskLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10);
	const [total, setTotal] = useState(0);

	// Modal for details
	const [selectedLog, setSelectedLog] = useState<TaskLog | null>(null);

	const fetchLogs = async () => {
		setLoading(true);
		try {
			const res = await api.getTaskLogs({
				page,
				page_size: pageSize,
				user_name: username,
			});
			setLogs(res.list || []);
			setTotal(res.total || 0);
			setError('');
		} catch (err: any) {
			setError(err.message || 'Failed to fetch logs');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLogs();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, pageSize]);

	const totalPages = Math.ceil(total / pageSize);

	const formatDate = (dateStr: string) => {
		if (!dateStr || dateStr.startsWith('0001-01-01')) return '-';
		return new Date(dateStr).toLocaleString();
	};

	const getStatus = (log: TaskLog) => {
		// Logic: If there is ErrOutput, it's considered an error.
		if (log.ErrOutput && log.ErrOutput.length > 0) return 'error';
		// If we have an end time but no error output, it's a success
		if (log.EndTime && !log.EndTime.startsWith('0001-01-01')) return 'success';
		// Otherwise it is running
		return 'running';
	};

	const parseContent = (contentStr: string) => {
		try {
			const parsed = JSON.parse(contentStr);
			// Try to construct a readable command string
			if (parsed.command) {
				const args = Array.isArray(parsed.args) ? parsed.args.join(' ') : '';
				return `${parsed.command} ${args}`.trim();
			}
			return contentStr;
		} catch (e) {
			return contentStr;
		}
	};

	return (
		<div>
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Execution Logs</h1>
					<p className="text-slate-500 mt-1">View history of task executions and their outputs.</p>
				</div>
				<div className="flex space-x-2">
					<Button variant="secondary" onClick={fetchLogs} title="Refresh Logs">
						<RefreshCw size={18} />
					</Button>
				</div>
			</div>

			{error && (
				<div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center">
					<AlertCircle className="mr-2 h-5 w-5" />
					{error}
				</div>
			)}

			<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
				<div className="overflow-x-auto">
					<table className="w-full text-sm text-left text-slate-500">
						<thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
							<tr>
								<th className="px-6 py-3 w-16">Status</th>
								<th className="px-6 py-3">Task Name</th>
								<th className="px-6 py-3">Start Time</th>
								<th className="px-6 py-3">End Time</th>
								<th className="px-6 py-3 text-right">Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={5} className="px-6 py-12 text-center">
										<div className="flex justify-center">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
										</div>
									</td>
								</tr>
							) : logs.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-6 py-12 text-center text-slate-400">
										<div className="flex flex-col items-center">
											<Terminal className="h-10 w-10 mb-2 opacity-20" />
											<p>No execution logs found</p>
										</div>
									</td>
								</tr>
							) : (
								logs.map(log => {
									const status = getStatus(log);
									const parsedCommand = parseContent(log.Content);
									const statusTitle = status === 'success' ? 'Success' : status === 'error' ? 'Failed' : 'Running';

									return (
										<tr key={log.ID} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
											<td className="px-6 py-4">
												<div className="flex items-center justify-center" title={statusTitle}>
													{status === 'success' && <CheckCircle2 className="text-green-500 h-5 w-5" />}
													{status === 'error' && <XCircle className="text-red-500 h-5 w-5" />}
													{status === 'running' && <Clock className="text-blue-500 h-5 w-5 animate-pulse" />}
												</div>
											</td>
											<td className="px-6 py-4 font-medium text-slate-900">
												{log.Name}
												<div className="text-xs text-slate-400 font-mono mt-0.5 max-w-md truncate" title={parsedCommand}>
													{parsedCommand}
												</div>
											</td>
											<td className="px-6 py-4 font-mono text-xs">{formatDate(log.StartTime)}</td>
											<td className="px-6 py-4 font-mono text-xs">{formatDate(log.EndTime)}</td>
											<td className="px-6 py-4 text-right">
												<Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
													<Eye className="h-4 w-4 mr-1" /> Details
												</Button>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{!loading && total > 0 && (
					<div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
						<span className="text-sm text-slate-500">
							Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, total)}</span> of <span className="font-medium">{total}</span> results
						</span>
						<div className="flex space-x-2">
							<Button variant="secondary" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 h-8">
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 h-8">
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Detail Modal */}
			{selectedLog && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}></div>
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl z-10 flex flex-col max-h-[90vh] animate-fade-in-up">
						<div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
							<div>
								<h2 className="text-lg font-bold text-slate-900">Log Details: {selectedLog.Name}</h2>
								<span className="text-xs font-mono text-slate-500">
									ID: {selectedLog.ID} • TaskID: {selectedLog.TaskId}
								</span>
							</div>
							<button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
								<XCircle className="h-6 w-6" />
							</button>
						</div>

						<div className="p-6 overflow-y-auto flex-1 space-y-6">
							<div>
								<h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
									<Terminal className="h-4 w-4 mr-1" /> Command / Configuration
								</h3>
                                {/* {renderJobDetails(selectedLog.Content)} */}
                                <JobDetails jobStr={selectedLog.Content}></JobDetails>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<span className="text-xs font-semibold text-slate-500 uppercase">Start Time</span>
									<p className="font-mono text-sm">{formatDate(selectedLog.StartTime)}</p>
								</div>
								<div>
									<span className="text-xs font-semibold text-slate-500 uppercase">End Time</span>
									<p className="font-mono text-sm">{formatDate(selectedLog.EndTime)}</p>
								</div>
							</div>

							{selectedLog.ErrOutput && selectedLog.ErrOutput.length > 0 && (
								<div>
									<h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center">
										<AlertCircle className="h-4 w-4 mr-1" /> Error Output
									</h3>
									<pre className="bg-red-50 text-red-800 p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-red-100">{selectedLog.ErrOutput}</pre>
								</div>
							)}

							<div>
								<h3 className="text-sm font-semibold text-slate-700 mb-2">Standard Output</h3>
								<pre className="bg-slate-50 text-slate-700 p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-slate-200 min-h-[100px]">{selectedLog.Output || <span className="text-slate-400 italic">No output</span>}</pre>
							</div>
						</div>

						<div className="p-4 border-t border-slate-100 flex justify-end">
							<Button onClick={() => setSelectedLog(null)}>Close</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
