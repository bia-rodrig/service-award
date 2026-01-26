import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import './ChangePassword.css';

function ChangePassword() {
	const navigate = useNavigate();
	const location = useLocation();

	// Pega o email que veio do Login (via state)
	const emailFromLogin = location.state?.email || '';

	// Estados
	const [email, setEmail] = useState(emailFromLogin);
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		
		// Validações
		if (!email || !currentPassword || !newPassword || !confirmPassword) {
		setError('Todos os campos são obrigatórios!');
		return;
		}

		if (newPassword !== confirmPassword) {
		setError('As senhas não coincidem!');
		return;
		}

		if (newPassword.length < 6) {
		setError('A nova senha deve ter no mínimo 6 caracteres!');
		return;
		}

		setLoading(true);

		try {
		await authService.changePassword(email, currentPassword, newPassword);
		
		alert('Senha alterada com sucesso! Faça login com a nova senha.');
		navigate('/');
		
		} catch (err) {
		let errorMessage = 'Erro ao alterar senha';
		
		if (Array.isArray(err.response?.data?.detail)) {
			const errors = err.response.data.detail.map(e => e.msg).join(', ');
			errorMessage = errors;
		} 
		else if (typeof err.response?.data?.detail === 'string') {
			errorMessage = err.response.data.detail;
		}
		else if (err.message) {
			errorMessage = err.message;
		}
		
		setError(errorMessage);
		
		} finally {
		setLoading(false);
		}
	};

	return (
		<div className="change-password-container">
		<div className="change-password-box">
			<img src="/logo512.png" alt="Logo" className="logo" />
			
			<h1>Alterar Senha</h1>
			<p className="subtitle">Sua conta está inativa. Crie uma nova senha para continuar.</p>

			<form onSubmit={handleSubmit}>
			{/* Email */}
			<div className="form-group">
				<label>Email:</label>
				<input
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="seu.email@empresa.com"
				disabled={emailFromLogin !== ''}
				/>
			</div>

			{/* Senha Temporária */}
			<div className="form-group">
				<label>Senha Temporária:</label>
				<input
				type="password"
				value={currentPassword}
				onChange={(e) => setCurrentPassword(e.target.value)}
				placeholder="Digite a senha temporária"
				/>
			</div>

			{/* Nova Senha */}
			<div className="form-group">
				<label>Nova Senha:</label>
				<input
				type="password"
				value={newPassword}
				onChange={(e) => setNewPassword(e.target.value)}
				placeholder="Digite a nova senha (mín. 6 caracteres)"
				/>
			</div>

			{/* Confirmar Senha */}
			<div className="form-group">
				<label>Confirmar Nova Senha:</label>
				<input
				type="password"
				value={confirmPassword}
				onChange={(e) => setConfirmPassword(e.target.value)}
				placeholder="Digite a nova senha novamente"
				/>
			</div>

			{/* Mensagem de Erro */}
			{error && (
				<div className="error-message">
				{typeof error === 'string' ? error : 'Erro ao alterar senha'}
				</div>
			)}

			{/* Botão */}
			<button type="submit" disabled={loading} className="btn-submit">
				{loading ? 'Alterando...' : 'Alterar Senha'}
			</button>
			</form>

			{/* Link para voltar */}
			<button className="btn-back" onClick={() => navigate('/')}>
			← Voltar para o login
			</button>
		</div>
		</div>
	);
}

export default ChangePassword;