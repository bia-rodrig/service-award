import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Register.css';

function Register() {
const navigate = useNavigate();

// Estados
const [email, setEmail] = useState('');
const [name, setName] = useState('');
const [surname, setSurname] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [role, setRole] = useState('USER');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
e.preventDefault();
setError('');

// Validações
if (!email || !name || !surname || !password || !confirmPassword) {
	setError('Todos os campos são obrigatórios!');
	return;
}

if (password !== confirmPassword) {
	setError('As senhas não coincidem!');
	return;
}

if (password.length < 6) {
	setError('A senha deve ter no mínimo 6 caracteres!');
	return;
}

setLoading(true);

try {
	const result = await authService.createUser({
	email: email,
	name: name,
	surname: surname,
	password: password,
	role: role
	});
	
	alert(result.message || 'Usuário criado com sucesso!');
	navigate('/');
	
} catch (err) {
	let errorMessage = 'Erro ao criar usuário';
	
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
<div className="register-container">
	<div className="register-box">
	<img src="/logo512.png" alt="Logo" className="logo" />
	
	<h1>Criar Conta</h1>
	<p className="subtitle">Preencha os dados para criar um novo usuário</p>

	<form onSubmit={handleSubmit}>
		{/* Email */}
		<div className="form-group">
		<label>Email: *</label>
		<input
			type="email"
			value={email}
			onChange={(e) => setEmail(e.target.value)}
			placeholder="seu.email@disney.com"
		/>
		</div>

		{/* Nome */}
		<div className="form-group">
		<label>Nome: *</label>
		<input
			type="text"
			value={name}
			onChange={(e) => setName(e.target.value)}
			placeholder="João"
		/>
		</div>

		{/* Sobrenome */}
		<div className="form-group">
		<label>Sobrenome: *</label>
		<input
			type="text"
			value={surname}
			onChange={(e) => setSurname(e.target.value)}
			placeholder="Silva"
		/>
		</div>

		{/* Senha */}
		<div className="form-group">
		<label>Senha: *</label>
		<input
			type="password"
			value={password}
			onChange={(e) => setPassword(e.target.value)}
			placeholder="Mínimo 6 caracteres"
		/>
		</div>

		{/* Confirmar Senha */}
		<div className="form-group">
		<label>Confirmar Senha: *</label>
		<input
			type="password"
			value={confirmPassword}
			onChange={(e) => setConfirmPassword(e.target.value)}
			placeholder="Digite a senha novamente"
		/>
		</div>

		{/* Role */}
		<div className="form-group">
		<label>Permissão: *</label>
		<select value={role} onChange={(e) => setRole(e.target.value)}>
			<option value="USER">USER</option>
		</select>
		</div>

		{/* Mensagem de Erro */}
		{error && (
		<div className="error-message">
			{typeof error === 'string' ? error : 'Erro ao criar usuário'}
		</div>
		)}

		{/* Botão */}
		<button type="submit" disabled={loading} className="btn-submit">
		{loading ? 'Criando...' : 'Criar Usuário'}
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

export default Register;