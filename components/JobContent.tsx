export const JobDetails = ({ jobStr }: { jobStr: string }) => {
	let parsed: Record<string, any>;
	try {
		parsed = JSON.parse(jobStr);
	} catch (e) {
		return <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded break-all">{jobStr}</div>;
	}

	if (!parsed || typeof parsed !== 'object') {
		return <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded break-all">{String(parsed)}</div>;
	}

	return (
		<div className="bg-slate-50 rounded border border-slate-200 overflow-hidden text-xs w-full">
			{Object.entries(parsed).map(([key, value], index) => (
				<div key={key} className={`flex ${index !== Object.keys(parsed).length - 1 ? 'border-b border-slate-200' : ''}`}>
					<div className="bg-slate-100 w-24 shrink-0 px-3 py-2 font-medium text-slate-500 border-r border-slate-200 truncate" title={key}>
						{key}
					</div>
					<div className="px-3 py-2 font-mono text-slate-700 break-all min-w-0 flex-1">
						{Array.isArray(value) ? (
							<span>
								<span className="text-slate-400 opacity-50">[</span>
								{value.map((v, i) => (
									<span key={i}>
										{i > 0 && <span className="text-slate-400 mr-1">,</span>}
										<span className="text-blue-600">"{v}"</span>
									</span>
								))}
								<span className="text-slate-400 opacity-50">]</span>
							</span>
						) : typeof value === 'boolean' ? (
							<span className={value ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{String(value)}</span>
						) : (
							<span>{String(value)}</span>
						)}
					</div>
				</div>
			))}
		</div>
	);
};
