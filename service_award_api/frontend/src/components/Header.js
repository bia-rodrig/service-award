import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import AlertModal from './AlertModal';
import './Header.css';

function Header() {
	const navigate = useNavigate();
	const [currentUser, setCurrentUser] = useState(null);

	// ========== ESTADO DO ALERT MODAL (NOVO) ==========
	const [alert, setAlert] = useState({
		isOpen: false,
		type: 'error',
		title: '',
		message: '',
		onConfirm: null
	});

	// Busca dados do usuário logado
	useEffect(() => {
		const fetchCurrentUser = async () => {
		try {
			const userData = await authService.getMe();
			setCurrentUser(userData);
		} catch (err) {
			console.error('Erro ao buscar dados do usuário:', err);
		}
		};
		fetchCurrentUser();
	}, []);

	const handleLogout = () => {
		// Abre modal de confirmação
		setAlert({
			isOpen: true,
			type: 'question',
			title: 'Confirmar Saída',
			message: 'Tem certeza que deseja sair?',
			onConfirm: () => {
			setAlert({ ...alert, isOpen: false });
			navigate('/');
			}
		});
	};

	return (
		<>
			<header className="header">
			<div className="header-content">
				{/* Logo à esquerda */}
				<div className="header-logo">
				<img src="/logo512.png" alt="Logo" />
				<span>Service Award Calendar</span>
				</div>

				{/* Email e botão de logout à direita */}
				<div className="header-right">
				{currentUser && (
					<span className="user-email">
					{currentUser.email}
					</span>
				)}
				
				<button className="btn-logout" onClick={handleLogout}>
					Sair
				</button>
				</div>
			</div>
			</header>
			{/* ========== ALERT MODAL (REUTILIZÁVEL) ========== */}
			<AlertModal
				isOpen={alert.isOpen}
				type={alert.type}
				title={alert.title}
				message={alert.message}
				onClose={() => setAlert({ ...alert, isOpen: false })}
				onConfirm={alert.onConfirm}
			/>
		</>
	);
}

export default Header;