import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
	const navigate = useNavigate();

	const handleLogout = () => {
		// Confirma se quer sair
		const confirmLogout = window.confirm('Tem certeza que deseja sair?');
		
		if (!confirmLogout) {
		return;
		}
		
		// Redireciona para login (o cookie expira automaticamente)
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

			{/* Botão de logout à direita */}
			<button className="btn-logout" onClick={handleLogout}>
			Sair
			</button>
		</div>
		</header>
	);
}

export default Header;