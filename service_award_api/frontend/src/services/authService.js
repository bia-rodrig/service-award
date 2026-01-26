import api from './api';

//exporta um objeto com todas as funções de autenticação
export const authService = {
	//Função de login
	login: async (email, password) => {
		const formData = new FormData();
		formData.append('username', email);
		formData.append('password', password);

		// Sobrescreve o header para FormData
		const response = await api.post('/auth/token', formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		});
		return response.data;
	},

	//função para troca de senha
	changePassword: async (email, currentPassword, newPassword) =>{
		// Aqui SIM enviamos JSON (não é OAuth2, é endpoint customizad
		const response = await api.post('/auth/change-password', {
			email: email, 
			current_password: currentPassword,
			new_password: newPassword,
		});

		//retorna a mensagem de sucesso do backend
		return response.data
	},

	// busca dados do usuário que está logado
	getMe: async() => {
		const response = await api.get('/auth/me');
		return response.data
	},

	//criar usuário
	createUser: async (userData) => {
		const response = await api.post('/auth/', userData,{
			headers: {
				'Content-Type': 'application/json'
			}
		});
		return response.data;
	}
}