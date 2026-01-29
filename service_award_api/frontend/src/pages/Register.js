import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Register.css';
import AlertModal from '../components/AlertModal';

import Footer from '../components/Footer'; 

function Register() {
const navigate = useNavigate();

// Estados
const [email, setEmail] = useState('');
const [name, setName] = useState('');
const [surname, setSurname] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [role, setRole] = useState('USER');
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
  if (!email || !name || !surname || !password || !confirmPassword) {
    setAlert({
      isOpen: true,
      type: 'warning',
      title: 'Campos Obrigatórios',
      message: 'Todos os campos são obrigatórios!',
      onConfirm: null
    });
    return;
  }

  if (password !== confirmPassword) {
    setAlert({
      isOpen: true,
      type: 'warning',
      title: 'Senhas Diferentes',
      message: 'As senhas não coincidem!',
      onConfirm: null
    });
    return;
  }

  if (password.length < 6) {
    setAlert({
      isOpen: true,
      type: 'warning',
      title: 'Senha Muito Curta',
      message: 'A senha deve ter no mínimo 6 caracteres!',
      onConfirm: null
    });
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
    
    setAlert({
      isOpen: true,
      type: 'success',
      title: 'Conta Criada!',
      message: result.message || 'Usuário criado com sucesso!',
      onConfirm: () => {
        setAlert({ ...alert, isOpen: false });
        navigate('/');
      }
    });
    
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
    
    setAlert({
      isOpen: true,
      type: 'error',
      title: 'Erro ao Criar Conta',
      message: errorMessage,
      onConfirm: null
    });
    
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

	{/* ========== ALERT MODAL (REUTILIZÁVEL) ========== */}
    <AlertModal
      isOpen={alert.isOpen}
      type={alert.type}
      title={alert.title}
      message={alert.message}
      onClose={() => setAlert({ ...alert, isOpen: false })}
      onConfirm={alert.onConfirm}
    />
    <Footer />
</div>
);
}

export default Register;