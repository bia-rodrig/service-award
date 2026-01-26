import React, {useState} from "react";
//useState: cria variáveis que atualizam a tela quando essas variáveis mudam
import { useNavigate } from 'react-router-dom';
//useNavigate: navega entre páginas

import { authService } from '../services/authService';
//importa as funções de login que criamos

import './Login.css'

//componente Login
function Login(){
	// estados -> variáveis que atualizam a tela
	const [email, setEmail] = useState('');
	//email -> o valor atual começa como vazio ''
	//setEmail -> função chamada para mudar o valor

	//estado da senha digitada
	const [password, setPassword] = useState('');

	//estado de erro (mensagem de erro se login falhas)
	const [error, setError] = useState('');

	//estado de loading (mostra "Entrando..." enquanto faz a requisição)
	const [loading, setLoading] = useState(false);

	//função para navegar entre páginas
	const navigate = useNavigate();

	// função que executa quando o usuário clica em Entrar
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('')
		setLoading(true);

		try{
			// Chama a API de login (authService.login -> que está chamando o backend)
			const data = await authService.login(email, password);
			// data = { access_token: "xyz", token_type: "bearer", is_active: true/false, role: "ADMIN" }

			//verifica se o usuário precisa trocar de senha
			if (!data.is_active){
				navigate('/change-password', {state: { email } });
				return;
			}

			//redireciona baseado na role
			if (data.role === 'ADMIN' || data.role === 'RH'){
				navigate('/dashboard');
			} else {
				navigate('/employees')
			}
		} catch (err){
			console.log('ERRO LOGIN:', err.response?.data);
			
			let errorMessage = 'Erro ao fazer login';
			
			// Se detail é array (validação Pydantic)
			if (Array.isArray(err.response?.data?.detail)) {
				const errors = err.response.data.detail.map(e => e.msg).join(', ');
				errorMessage = errors;
			} 
			// Se detail é string
			else if (typeof err.response?.data?.detail === 'string') {
				errorMessage = err.response.data.detail;
			}
			// Se tem message
			else if (err.message) {
				errorMessage = err.message;
			}
			
			setError(errorMessage);
		} finally {
			setLoading(false);  // ← TEM QUE TER ISSO AQUI!
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

					{/* ========== MENSAGEM DE ERRO (SÓ APARECE SE TIVER ERRO) ========== */}
					{error && <div className="error-message">{error}</div>}

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
		</div>
	)
}

// Exporta o componente para poder usar em outros lugares
export default Login;