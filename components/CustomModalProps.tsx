import React, { useState, ReactNode, isValidElement, cloneElement } from 'react';
import { Modal } from 'antd';

interface CustomModalProps {
	title: string;
	trigger?: ReactNode; // 可以传 JSX
	children?: ReactNode;
	onOk?: () => void;
	onCancel?: () => void;
	okText?: string;
	cancelText?: string;
	modalProps?: object;
}

const CustomModal: React.FC<CustomModalProps> = ({ title, trigger, children, onOk, onCancel, okText, cancelText, modalProps = {} }) => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleOpen = () => setIsModalOpen(true);
	const handleOk = () => {
		setIsModalOpen(false);
		onOk?.();
	};
	const handleCancel = () => {
		setIsModalOpen(false);
		onCancel?.();
	};

	const renderTrigger = () => {
		if (trigger && isValidElement(trigger)) {
			// 自动给传入元素加上点击事件
			return cloneElement(trigger as React.ReactElement<any>, { onClick: handleOpen });
		}
		// 默认按钮
		return <button onClick={handleOpen}>{trigger || 'Open Modal'}</button>;
	};

	return (
		<>
			{renderTrigger()}
			<Modal title={title} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} okText={okText} cancelText={cancelText} {...modalProps}>
				{children}
			</Modal>
		</>
	);
};

export default CustomModal;
