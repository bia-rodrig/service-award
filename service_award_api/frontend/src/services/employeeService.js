import api from './api';

export const employeeService ={
	//busca a hierarquia de funcionarios
	getHierarchy: async () =>{
		const response = await api.get('/employees/');
		
		return response.data;
	},

	// === busca todos os funcionarios ===
	getAllEmployees: async () => {
		const response = await api.get('/employees/all');
		return response.data;
	},

	// cadastra um employee
	createEmployee: async(employeeData) =>{
		const response = await api.post('/employees/employee', employeeData

		)
		return response.data
	},

	// ========== CRIAR EMPLOYEE COM GESTOR CUSTOMIZADO (NOVA FUNÇÃO) ==========
	createEmployeeWithManager: async (employeeData) => {
		// Chama POST /employees/employee-with-manager
		// employeeData = { employee_id, employee_name, employee_email, hire_date, manager_name, manager_email }
		const response = await api.post('/employees/employee-with-manager', employeeData);
		return response.data;
	},

	// ========== REMOVER EMPLOYEE (NOVA FUNÇÃO) ==========
	deleteEmployee: async (employeeId) => {
		// Faz requisição DELETE para /employees/{id}
		// O cookie com token é enviado automaticamente
		const response = await api.delete(`/employees/${employeeId}`);
		return response.data;
	},

	updateEmployee: async (employeeId, employeeData) => {
		const response = await api.put(`/employees/${employeeId}`, employeeData);
		return response.data;
	},

	// ========== ENVIAR EMAIL COM CALENDÁRIO (NOVA FUNÇÃO) ==========
	sendCalendarEmail: async (destinatario) => {
		// Chama POST /email/send-calendar
		const response = await api.post('/email/send-calendar', {
			destinatario: destinatario
		}, {
			headers: {
			'Content-Type': 'application/json'
			}
		});
		return response.data;
	},
}