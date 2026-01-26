import api from './api';

export const adminService = {
	// ========== LISTAR TODOS OS USUÁRIOS ==========
	getAllUsers: async () => {
		// Chama GET /admin/
		const response = await api.get('/admin/');
		return response.data;
	},

	// ========== RESETAR SENHA DO USUÁRIO ==========
	resetPassword: async (userId) => {
		// Chama PUT /admin/reset_password/{user_id}
		const response = await api.put(`/admin/reset_password/${userId}`);
		return response.data;
	},

	// ========== DELETAR USUÁRIO ==========
	deleteUser: async (userId) => {
		// Chama DELETE /admin/{user_id}
		const response = await api.delete(`/admin/${userId}`);
		return response.data;
	},

	// ========== ATUALIZAR ROLE DO USUÁRIO (NOVA FUNÇÃO) ==========
	updateUserRole: async (userId, role) => {
		// Chama PUT /admin/{user_id}
		// Envia { role: "ADMIN" } no body
		const response = await api.put(`/admin/${userId}`, { role });
		return response.data;
	},

	// ========== LIMPAR BANCO DE DADOS (NOVA FUNÇÃO) ==========
	clearAllEmployees: async () => {
		// Chama DELETE /admin/clear_all
		const response = await api.delete('/admin/clear_all');
		return response.data;
	},

	// ========== UPLOAD DE EXCEL (NOVA FUNÇÃO) ==========
	uploadExcel: async (file) => {
		// Cria FormData para enviar o arquivo
		const formData = new FormData();
		formData.append('file', file);

		// Chama POST /admin/upload-excel
		const response = await api.post('/admin/upload-excel', formData, {
			headers: {
			'Content-Type': 'multipart/form-data'
			}
		});
		return response.data;
	},

};