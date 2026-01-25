import React, { useState, useEffect } from 'react';
//useState -> cria variáveis que atualizam a tela
//useEffect -> executa código quando a página carregar

import { MdEdit, MdDelete } from 'react-icons/md';

import { employeeService } from '../services/employeeService'
import './Employees.css'

//importa a função que busca os dados no backend
function Employees(){
	//estado para armazenar os dados que vierem do backend
	const [data, setData] = useState(null); // começa como vazio

	const [loading, setLoading] = useState(true) //começa como true

	const [error, setError] = useState(''); //erro começa vazio

	//buscar dados quando a página carregar
	useEffect(() => {
		//função para buscar os dados
		const fetchData = async() => {
			try{
				const result = await employeeService.getHierarchy();
				console.log('Result')
				console.log(result)
				//salva os dados no estado
				setData(result);
			} catch(err){
				setError(err.response?.data?.detail || 'Erro ao buscar os dados');
			} finally{
				//sempre desliga o loading no final
				setLoading(false);
			}
		};

		fetchData(); //chama a função acima
	},[]) //executa apenas uma vez quando a página carrega


	// === Função para achatar a hierarquia ===
	const flattenHierarchy = (employees) => {
		let flatList = [];

		employees.forEach(employee => {
			//adiciona o emplouyee atual na lista
			flatList.push(employee);

			//Se tiver subordinados, adiciona eles também (recursivo)
			if (employee.subordinates && employee.subordinates.length > 0){
				flatList = flatList.concat(flattenHierarchy(employee.subordinates));
			}
		})

		return flatList;
	}

	// === Calcular os anos de empresa ===
	const calculateYearsOfService = (hireDate) => {
		//converte a string "2025-03-18" em object Date
		const hire = new Date(hireDate)
		const today = new Date();

		// calcula a diferença em anos
		let years = today.getFullYear() - hire.getFullYear();

		// Ajusta se ainda não chegou no aniversário deste ano
		const monthDiff = today.getMonth() - hire.getMonth();
		const dayDiff = today.getDate() - hire.getDate();

		if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
			years--;  // Ainda não fez aniversário este ano
		}

		return years;
	}

	// === CALCULAR DIAS ATÉ PRÓXIMO ANIVERSÁRIO ===
	const calculateDaysUntilAnniversary = (hireDate) => {
		const hire = new Date(hireDate);
		const today = new Date();

		// Próximo aniversário = mesmo dia/mês do hire_date, mas ano atual
		const nextAnniversary = new Date(
			today.getFullYear(),
			hire.getMonth(),
			hire.getDate()
		);

		// Se o aniversário já passou este ano, pega o do ano que vem
		if (nextAnniversary < today) {
			nextAnniversary.setFullYear(today.getFullYear() + 1);
		}

		// Calcula diferença em milissegundos e converte para dias
		const diffTime = nextAnniversary - today;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		return diffDays;
	};

	// ========== FUNÇÃO PARA REMOVER EMPLOYEE ==========
	const handleDelete = async (employee) => {
	// Mostra confirmação
	const confirmDelete = window.confirm(
		`Tem certeza que deseja remover ${employee.employee_name}?\n\nEsta ação não pode ser desfeita.`
	);
	
	// Se o usuário cancelar, para aqui
	if (!confirmDelete) {
		return;
	}
	
	try {
		// Chama a API para deletar
		await employeeService.deleteEmployee(employee.id);
		
		// Mostra mensagem de sucesso
		alert(`${employee.employee_name} foi removido com sucesso!`);
		
		// Recarrega os dados para atualizar a tabela
		const result = await employeeService.getHierarchy();
		setData(result);
		
	} catch (err) {
		// Se der erro, mostra a mensagem
		alert(err.response?.data?.detail || 'Erro ao remover employee');
	}
	};


	return (
	<div className="employees-container">
		<h1>Employees</h1>
		
		{/* Se estiver carregando, mostra "Carregando..." */}
		{loading && <p>Carregando...</p>}
		
		{/* Se tiver erro, mostra a mensagem de erro */}
		{error && <div className="error-message">{error}</div>}
		
		{/* Se tiver dados, mostra a tabela */}
		{data && (
		<div className="table-container">
			<table className="employees-table">
			<thead>
				<tr>
				<th>ID</th>
				<th>ID Empregado</th>
				<th>Nome</th>
				<th>Email</th>
				<th>Aniversário de Empresa</th>
				<th>Anos de Empresa</th>
				<th>Dias até Aniversário</th>
				<th>Gestor</th>
				<th>Ações</th>
				</tr>
			</thead>
			<tbody>
				{/* Achata a hierarquia e mapeia cada employee para uma linha */}
				{flattenHierarchy(data.hierarchy).map((employee) => (
				<tr key={employee.id}>
					<td>{employee.id}</td>
					<td>{employee.employee_id}</td>
					<td>{employee.employee_name}</td>
					<td>{employee.employee_email}</td>
					<td>{employee.hire_date}</td>
					<td>{calculateYearsOfService(employee.hire_date)} anos</td>
					<td>{calculateDaysUntilAnniversary(employee.hire_date)} dias</td>
					<td>{employee.manager_name}</td>
					<td className="actions">
						{/* Botão de Editar */}
						<button 
							className="btn-edit"
							onClick={() => console.log('Editar:', employee.id)}
							title="Editar"
						>
							<MdEdit />
						</button>
						
						{/* Botão de Remover */}
						<button 
							className="btn-delete"
							onClick={() => handleDelete(employee)}
							title="Remover"
						>
							<MdDelete />
						</button>
					</td>
				</tr>
				))}
			</tbody>
			</table>
		</div>
		)}
	</div>
	);
}

export default Employees;

