import api from './api';

export const employeeService ={
	getHierarchy: async () =>{
		const response = await api.get('/employees/');
		
		return response.data;
	}

}