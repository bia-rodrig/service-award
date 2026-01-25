import api from './api';

//exporta um objeto com todas as funções de autenticação
export const authService = {
	//Função de login
	login: async(email, password) => {
		// OAuth2 exige FormData (não JSON!) para login
    	// É o padrão que o FastAPI OAuth2PasswordBearer espera
		const formData = new FormData();
		formData.append('username', email); //o campo se chama username, mas o backend o login está com e-mail
		formData.append('password', password)

		// Faz requisição POST para /auth/token
    	// O 'api' já sabe que é http://localhost:8000 (configurado no api.js)
		const response = await api.post('/auth/token', formData);

		// Retorna os dados da resposta:
    	// { access_token: "xyz123", token_type: "bearer", is_active: true/false }
		return response.data;
	}, //precisa da virgula

	//função para troca de senha
	changePassword: async (email, currentPassword, newPassword) =>{
		// Aqui SIM enviamos JSON (não é OAuth2, é endpoint customizad
		const response = await api.post('/auth/change-password', {
			email: email, 
			current_password: currentPassword,
			new_passeord: newPassword,
		});

		//retorna a mensagem de sucesso do backend
		return response.data
	}
}