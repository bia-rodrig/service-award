import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import AlertModal from '../components/AlertModal';
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
	const [loading, setLoading] = useState(false);

	const [alert, setAlert] = useState({
		isOpen: false,
		type: 'error',
		title: '',
		message: '',
		onConfirm: null
	});

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		// Validações
		if (!email || !currentPassword || !newPassword || !confirmPassword) {
			setAlert({
			isOpen: true,
			type: 'warning',
			title: 'Campos Obrigatórios',
			message: 'Todos os campos são obrigatórios!',
			onConfirm: null
			});
			return;
		}

		if (newPassword !== confirmPassword) {
			setAlert({
			isOpen: true,
			type: 'warning',
			title: 'Senhas Diferentes',
			message: 'As senhas não coincidem!',
			onConfirm: null
			});
			return;
		}

		if (newPassword.length < 6) {
			setAlert({
			isOpen: true,
			type: 'warning',
			title: 'Senha Muito Curta',
			message: 'A nova senha deve ter no mínimo 6 caracteres!',
			onConfirm: null
			});
			return;
		}

		setLoading(true);

		try {
			await authService.changePassword(email, currentPassword, newPassword);
			
			setAlert({
			isOpen: true,
			type: 'success',
			title: 'Senha Alterada!',
			message: 'Senha alterada com sucesso!\n\nFaça login com a nova senha.',
			onConfirm: () => {
				setAlert({ ...alert, isOpen: false });
				navigate('/');
			}
			});
			
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
			
			setAlert({
			isOpen: true,
			type: 'error',
			title: 'Erro ao Alterar Senha',
			message: errorMessage,
			onConfirm: null
			});
			
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

		<AlertModal
			isOpen={alert.isOpen}
			type={alert.type}
			title={alert.title}
			message={alert.message}
			onClose={() => setAlert({ ...alert, isOpen: false })}
			onConfirm={alert.onConfirm}
		/>
		</div>
	);
}

export default ChangePassword;