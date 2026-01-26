import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Header.css';

function Header() {
	const navigate = useNavigate();
	const [currentUser, setCurrentUser] = useState(null);

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
		const confirmLogout = window.confirm('Tem certeza que deseja sair?');
		
		if (!confirmLogout) {
		return;
		}
		
		navigate('/');
	};

	return (
		<header className="header">
		<div className="header-content">
			{/* Logo à esquerda */}
			<div className="header-logo">
			<img src="/logo512.png" alt="Logo" />
			<span>Service Award</span>
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
	);
}

export default Header;