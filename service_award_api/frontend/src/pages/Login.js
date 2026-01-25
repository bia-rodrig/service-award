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
		//previne o comportamento padrão do formulário (recarregar a página)\
		e.preventDefault();

		//limpa qualquer erro anterior
		setError('')

		//ativa o loading (botão fica "Entrando..." e desabilitado)
		setLoading(true);

		try{
			// Chama a API de login (authService.login -> que está chamando o backend)
			const data = await authService.login(email, password);
			// data = { access_token: "xyz", token_type: "bearer", is_active: true/false }

			//verifica se o usuário precisa trocar de senha
			if (!data.is_active){
				//se for falso, redireciona para trocar de senha, passando o e-mai junto pra preencher automaticamente na pagina
				navigate('/change-password', {state: { email } });
				return; // para aqui, não executa o resto
			}

			//redireciona para o employees
			navigate('/employees');
		} catch (err){
			// Se deu erro (email/senha errados, servidor fora, etc)
	  		// Pega a mensagem de erro do backend ou usa uma mensagem padrão
			setError(err.response?.data?.detail || 'Erro ao fazer login');
		} finally {
			// Sempre executa (deu erro ou não)
			// Desativa o loading
			setLoading(false);
		}
	};

	// = = = = Renderização - o que aparece na tela //Pa
	return(
		<div className="login-container">
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
			</div>
		</div>
	)
}

// Exporta o componente para poder usar em outros lugares
export default Login;