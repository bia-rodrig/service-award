import api from './api';

export const employeeService ={
	//busca a hierarquia de funcionarios
	getHierarchy: async () =>{
		const response = await api.get('/employees/');
		
		return response.data;
	},

	// ========== REMOVER EMPLOYEE (NOVA FUNÇÃO) ==========
	deleteEmployee: async (employeeId) => {
		// Faz requisição DELETE para /employees/{id}
		// O cookie com token é enviado automaticamente
		const response = await api.delete(`/employees/${employeeId}`);
		return response.data;
	},


	
}