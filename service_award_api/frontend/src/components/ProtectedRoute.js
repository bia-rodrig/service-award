import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';

function ProtectedRoute({ children }) {
  // Estados
	const [isAuthenticated, setIsAuthenticated] = useState(null);
  // null = ainda não verificou
  // true = autenticado
  // false = não autenticado

	useEffect(() => {
	// Função que verifica se o usuário está autenticado
	const checkAuth = async () => {
		try {
			// Chama o endpoint /auth/verify
			// O cookie é enviado automaticamente (withCredentials: true)
			await api.get('/auth/verify'); //pergunta se o usuário está autenticado
			
			// Se chegou aqui, o cookie é válido!
			setIsAuthenticated(true);
		
		} catch (error) {
			// Se deu erro 401, o cookie é inválido ou não existe
			setIsAuthenticated(false);
		}
	};

	checkAuth();
	}, []);

  // Ainda está verificando? Mostra "Carregando..."
	if (isAuthenticated === null) {
		return (
		<div style={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			minHeight: '100vh',
			background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #000000 100%)',
			color: 'white',
			fontSize: '18px'
		}}>
			Carregando...
		</div>
	);
	}

  // Não está autenticado? Redireciona para login
	if (!isAuthenticated) {
		return <Navigate to="/" replace />;
	}

  	// Está autenticado! Mostra a página
	return children;
}

export default ProtectedRoute;