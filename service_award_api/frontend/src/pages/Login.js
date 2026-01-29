import React, {useState} from "react";
//useState: cria variáveis que atualizam a tela quando essas variáveis mudam
import { useNavigate } from 'react-router-dom';
//useNavigate: navega entre páginas

import { authService } from '../services/authService';
//importa as funções de login que criamos

import AlertModal from '../components/AlertModal';
import Footer from '../components/Footer'; 

import './Login.css'

//componente Login
function Login(){
	// estados -> variáveis que atualizam a tela
	const [email, setEmail] = useState('');
	//email -> o valor atual começa como vazio ''
	//setEmail -> função chamada para mudar o valor

	//estado da senha digitada
	const [password, setPassword] = useState('');

	//estado de loading (mostra "Entrando..." enquanto faz a requisição)
	const [loading, setLoading] = useState(false);

	const [alert, setAlert] = useState({
		isOpen: false,
		type: 'error',
		title: '',
		message: '',
		onConfirm: null
	});

	//função para navegar entre páginas
	const navigate = useNavigate();

	// função que executa quando o usuário clica em Entrar
	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try{
			const data = await authService.login(email, password);
			
			if (!data.is_active){
			navigate('/change-password', {state: { email } });
			return;
			}

			if (data.role === 'ADMIN' || data.role === 'RH') {
			navigate('/dashboard');
			} else {
			navigate('/employees');
			}
			
		} catch (err){
			console.log('ERRO LOGIN:', err.response?.data);
			
			let errorMessage = 'Erro ao fazer login';
			
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
			title: 'Erro no Login',
			message: errorMessage,
			onConfirm: null
			});
			
		} finally {
			setLoading(false);
		}
	};

	// = = = = Renderização - o que aparece na tela //Pa
	return(
		<div className="login-container">
			<h1>Service Award Calendar</h1>
			{/*container principal centralizado */}
			<div className="login-box">
				{/*caixa branca do formulário*/}
				<h2>Login</h2>

				{/* Formulário - quando enviar, chama handleSubmit */}
				<form onSubmit={handleSubmit}>
					{/* ========== CAMPO DE EMAIL ========== */}
					<div className="form-group">
						<label>E-mail:</label>
						<input
							type="email"
							value={email}
							// Quando o usuário digita, atualiza o estado
							onChange={(e) => setEmail(e.target.value)}
							required
							// Desabilita o campo se estiver carregando
							disabled={loading}
						/>
					</div>

					{/* ========== CAMPO DE SENHA ========== */}
					<div className="form-group">
						<label>Senha:</label>
						<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						disabled={loading}
						/>
					</div>

					{/* ========== BOTÃO DE ENVIAR ========== */}
					<button type="submit" disabled={loading}>
						{/* Se loading = true, mostra "Entrando...", senão mostra "Entrar" */}
						{loading ? 'Entrando...' : 'Entrar'}
					</button>
				</form>
				{/* ========== LINK PARA CRIAR CONTA (NOVO) ========== */}
				<div className="register-link">
					<button onClick={() => navigate('/register')}>
						Não tem uma conta? Criar conta aqui
					</button>
				</div>
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
	)
}

// Exporta o componente para poder usar em outros lugares
export default Login;