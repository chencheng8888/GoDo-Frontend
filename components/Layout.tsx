import React, { useState } from 'react';
import { Terminal, FolderOpen, LogOut, ClipboardList } from 'lucide-react';
import type { MenuProps } from 'antd';
import { Layout, Menu, theme, Button } from 'antd';
import { ViewState } from '../types';

const { Header, Content, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface LayoutProps {
	children: React.ReactNode;
	currentView: ViewState;
	username: string;
	onViewChange: (view: ViewState) => void;
	onLogout: () => void;
}

const siderItems: MenuProps['items'] = [
	{ key: 'tasks', icon: <Terminal size={16} />, label: 'Tasks' },
	{ key: 'files', icon: <FolderOpen size={16} />, label: 'File Manager' },
	{ key: 'logs', icon: <ClipboardList size={16} />, label: 'Execution Logs' },
];

export const AppLayout: React.FC<LayoutProps> = ({ children, currentView, username, onViewChange, onLogout }) => {
	const [collapsed, setCollapsed] = useState(false);
	const {
		token: { colorBgContainer, borderRadiusLG },
	} = theme.useToken();

	const handleMenuClick: MenuProps['onClick'] = e => {
		onViewChange(e.key as ViewState);
	};

	const menuItems: MenuItem[] = siderItems.map(item => ({
		...item,
		onClick: handleMenuClick,
	}));

	// Sider Footer 组件
	const SiderFooter: React.FC<{ collapsed: boolean; username: string; onLogout: () => void }> = ({ collapsed, username, onLogout }) => (
		<div
			style={{
				padding: collapsed ? '16px 8px' : '16px',
				borderTop: '1px solid #1f1f1f',
				color: 'white',
				textAlign: collapsed ? 'center' : 'left',
				// Flex 子项属性：禁止压缩
				flexShrink: 0,
			}}
		>
			{collapsed ? (
				<Button onClick={onLogout} icon={<LogOut size={16} />} type="text" style={{ color: 'rgba(255, 255, 255, 0.65)', padding: 0 }} title={`Logged in as: ${username} - Sign Out`} />
			) : (
				<>
					<div style={{ marginBottom: '12px' }}>
						<div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', lineHeight: 1.5 }}>LOGGED IN AS</div>
						<div style={{ fontSize: '14px', fontWeight: '500', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', lineHeight: 1.5 }}>{username}</div>
					</div>
					<Button
						onClick={onLogout}
						type="default"
						block
						icon={<LogOut size={16} />}
						style={{
							backgroundColor: '#1e293b',
							borderColor: '#1e293b',
							color: '#cbd5e1',
						}}
						onMouseEnter={e => {
							e.currentTarget.style.backgroundColor = 'red';
							e.currentTarget.style.borderColor = 'red';
							e.currentTarget.style.color = 'white'; // 按钮文字通常要变亮，否则看不清
						}}
						onMouseLeave={e => {
							e.currentTarget.style.backgroundColor = '#1e293b';
							e.currentTarget.style.borderColor = '#1e293b';
							e.currentTarget.style.color = '#cbd5e1';
						}}
					>
						Sign Out
					</Button>
				</>
			)}
		</div>
	);

	return (
		<Layout style={{ minHeight: '100vh' }}>
			<Sider
				collapsible
				collapsed={collapsed}
				onCollapse={setCollapsed}
				width={224}
				theme="dark"
				style={{
					height: '100vh',
					position: 'fixed',
					left: 0,
					top: 0,
					bottom: 0,
					zIndex: 10,
					// 注意：这里去掉了 display: flex，因为 Sider 内部会自动生成 wrapper
				}}
			>
				{/* 🔥 关键修复 🔥 
                    我们在 Sider 内部手动创建一个 Flex 容器，让它占满高度。
                    这样不管 Antd 内部怎么包裹，我们都能控制内容的分布。
                */}
				<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
					{/* 1. 顶部 Logo - 固定高度 (flexShrink: 0) */}
					<div
						style={{
							padding: '24px 20px',
							borderBottom: '1px solid #1f1f1f',
							display: 'flex',
							alignItems: 'center',
							justifyContent: collapsed ? 'center' : 'flex-start',
							gap: '8px',
							flexShrink: 0,
						}}
					>
						<div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px', backgroundColor: '#3b82f6', color: 'white', flexShrink: 0 }}>G</div>
						{!collapsed && <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.025em', color: 'white', whiteSpace: 'nowrap' }}>GoDo Scheduler</span>}
					</div>

					{/* 2. 中间菜单 - 占据剩余空间 (flex: 1) */}
					<div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
						<Menu theme="dark" selectedKeys={[currentView]} mode="inline" items={menuItems} style={{ borderRight: 0 }} />
					</div>

					{/* 3. 底部 Footer - 被上面的 flex: 1 推到底部 */}
					<SiderFooter collapsed={collapsed} username={username} onLogout={onLogout} />
				</div>
			</Sider>

			<Layout style={{ marginLeft: collapsed ? 80 : 224, transition: 'all 0.2s' }}>
				<Content style={{ margin: '5px', overflow: 'initial' }}>
					<div
						style={{
							padding: 24,
							minHeight: '100vh',
							background: colorBgContainer,
							borderRadius: borderRadiusLG,
						}}
					>
						{children}
					</div>
				</Content>
			</Layout>
		</Layout>
	);
};
