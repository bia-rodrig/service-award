import React, { useState, useEffect } from 'react';
import { employeeService } from '../services/employeeService';
import { authService } from '../services/authService';
import { MdEdit } from 'react-icons/md';
import { FaTrash } from 'react-icons/fa';
import './EmployeesTable.css';  // Reutiliza o mesmo CSS

import AlertModal from './AlertModal';

function AllEmployeesTable() {
	// ========== ESTADOS ==========
	const [data, setData] = useState([]);  // Array vazio (lista simples)
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// Estados para edição
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingEmployee, setEditingEmployee] = useState(null);
	const [formData, setFormData] = useState({
		employee_id: '',
		employee_name: '',
		employee_email: '',
		hire_date: ''
	});

	// ========== NOVOS ESTADOS PARA CRIAÇÃO ==========
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [createFormData, setCreateFormData] = useState({
		employee_id: '',
		employee_name: '',
		employee_email: '',
		hire_date: '',
		manager_name: '',
		manager_email: ''
	});
	const [currentUser, setCurrentUser] = useState(null);


	const [alert, setAlert] = useState({
		isOpen: false,
		type: 'error',
		title: '',
		message: '',
		onConfirm: null
	});

	// ========== NOVOS ESTADOS PARA BUSCA E ORDENAÇÃO ==========
	const [searchTerm, setSearchTerm] = useState('');
	const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

	// ========== BUSCAR TODOS OS EMPLOYEES ==========
	useEffect(() => {
		const fetchData = async() => {
		try{
			// Chama a função getAllEmployees (não getHierarchy)
			const result = await employeeService.getAllEmployees();
			setData(result);  // result já é array simples
		} catch(err){
			setError(err.response?.data?.detail || 'Erro ao buscar os dados');
		} finally{
			setLoading(false);
		}
		};
		fetchData();
	}, [])

	// ========== NOVO useEffect ==========
	useEffect(() => {
		const fetchCurrentUser = async() => {
			try {
				const userData = await authService.getMe();
				setCurrentUser(userData);
			} catch (err) {
				console.error('Erro ao buscar dados do usuário:', err);
			}
		};
		fetchCurrentUser();
	}, []);

	// ========== FUNÇÕES DE CÁLCULO ==========
	const calculateYearsOfService = (hireDate) => {
		const hire = new Date(hireDate);
		const today = new Date();
		let years = today.getFullYear() - hire.getFullYear();
		const monthDiff = today.getMonth() - hire.getMonth();
		const dayDiff = today.getDate() - hire.getDate();
		if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
		years--;
		}
		return years;
	};

	const calculateDaysUntilAnniversary = (hireDate) => {
		const hire = new Date(hireDate);
		const today = new Date();
		const nextAnniversary = new Date(
		today.getFullYear(),
		hire.getMonth(),
		hire.getDate()
		);
		if (nextAnniversary < today) {
		nextAnniversary.setFullYear(today.getFullYear() + 1);
		}
		const diffTime = nextAnniversary - today;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};

	// ========== FUNÇÕES DE AÇÃO ==========
	const handleDelete = async (employee) => {
		// Abre modal de confirmação
		setAlert({
			isOpen: true,
			type: 'question',
			title: 'Confirmar Exclusão',
			message: `Tem certeza que deseja remover ${employee.employee_name}?\n\nEsta ação não pode ser desfeita.`,
			onConfirm: async () => {
				setAlert({ ...alert, isOpen: false });
				
				try {
					await employeeService.deleteEmployee(employee.id);
					
					setAlert({
						isOpen: true,
						type: 'success',
						title: 'Sucesso!',
						message: `${employee.employee_name} foi removido com sucesso!`,
						onConfirm: null
					});
					
					const result = await employeeService.getAllEmployees();
					setData(result);
					
				} catch (err) {
					setAlert({
						isOpen: true,
						type: 'error',
						title: 'Erro ao Remover',
						message: err.response?.data?.detail || 'Erro ao remover funcionário',
						onConfirm: null
					});
				}
			}
		});
	};
		

	const handleEdit = (employee) => {
		setEditingEmployee(employee);
		setFormData({
		employee_id: employee.employee_id,
		employee_name: employee.employee_name,
		employee_email: employee.employee_email,
		hire_date: employee.hire_date
		});
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingEmployee(null);
		setFormData({
		employee_id: '',
		employee_name: '',
		employee_email: '',
		hire_date: ''
		});
	};

	const handleSave = async () => {
		try {
			await employeeService.updateEmployee(editingEmployee.id, {
				employee_id: parseInt(formData.employee_id),
				employee_name: formData.employee_name,
				employee_email: formData.employee_email,
				hire_date: formData.hire_date
			});
			
			setAlert({
				isOpen: true,
				type: 'success',
				title: 'Sucesso!',
				message: 'Funcionário atualizado com sucesso!',
				onConfirm: null
			});
			
			const result = await employeeService.getAllEmployees();
			setData(result);
			handleCloseModal();
			
		} catch (err) {
			setAlert({
				isOpen: true,
				type: 'error',
				title: 'Erro ao Atualizar',
				message: err.response?.data?.detail || 'Erro ao atualizar funcionário',
				onConfirm: null
			});
		}
	};

	// ========== FUNÇÕES DE CRIAÇÃO ==========
const handleOpenCreateModal = () => {
  setCreateFormData({
    employee_id: '',
    employee_name: '',
    employee_email: '',
    hire_date: '',
    manager_name: '',
    manager_email: ''
  });
  setIsCreateModalOpen(true);
};

const handleCloseCreateModal = () => {
  setIsCreateModalOpen(false);
  setCreateFormData({
    employee_id: '',
    employee_name: '',
    employee_email: '',
    hire_date: '',
    manager_name: '',
    manager_email: ''
  });
};

	const handleCreate = async () => {
		try {
			// Valida campos obrigatórios
			if (!createFormData.employee_id || !createFormData.employee_name || 
				!createFormData.employee_email || !createFormData.hire_date ||
				!createFormData.manager_name || !createFormData.manager_email) {
				
				setAlert({
					isOpen: true,
					type: 'warning',
					title: 'Campos Obrigatórios',
					message: 'Por favor, preencha todos os campos!',
					onConfirm: null
				});
				return;
			}

			// Cria o employee COM gestor customizado
			await employeeService.createEmployeeWithManager({
				employee_id: parseInt(createFormData.employee_id),
				employee_name: createFormData.employee_name,
				employee_email: createFormData.employee_email,
				hire_date: createFormData.hire_date,
				manager_name: createFormData.manager_name,
				manager_email: createFormData.manager_email
			});

			setAlert({
				isOpen: true,
				type: 'success',
				title: 'Sucesso!',
				message: 'Funcionário criado com sucesso!',
				onConfirm: null
			});

			// Recarrega TODOS os employees
			const result = await employeeService.getAllEmployees();
			setData(result);

			handleCloseCreateModal();

		} catch (err) {
			setAlert({
				isOpen: true,
				type: 'error',
				title: 'Erro ao Criar',
				message: err.response?.data?.detail || 'Erro ao criar funcionário',
				onConfirm: null
			});
		}
	};

	// ========== FUNÇÕES DE BUSCA E ORDENAÇÃO ==========
	const handleSort = (key) => {
	let direction = 'asc';
	if (sortConfig.key === key && sortConfig.direction === 'asc') {
		direction = 'desc';
	}
	setSortConfig({ key, direction });
	};

	const getFilteredAndSortedData = () => {
	if (!data || data.length === 0) return [];
	
	let employees = [...data];  // Cópia do array
	
	// 1. Filtra por termo de busca
	if (searchTerm) {
		const term = searchTerm.toLowerCase();
		employees = employees.filter(emp => 
		emp.employee_name?.toLowerCase().includes(term) ||
		emp.employee_email?.toLowerCase().includes(term) ||
		emp.employee_id?.toString().includes(term) ||
		emp.manager_name?.toLowerCase().includes(term)
		);
	}
	
	// 2. Ordena
	if (sortConfig.key) {
		employees.sort((a, b) => {
		let aValue = a[sortConfig.key];
		let bValue = b[sortConfig.key];
		
		// Tratamento especial para datas
		if (sortConfig.key === 'hire_date') {
			aValue = new Date(aValue);
			bValue = new Date(bValue);
		}
		
		// Tratamento especial para números
		if (sortConfig.key === 'employee_id' || sortConfig.key === 'id') {
			aValue = Number(aValue);
			bValue = Number(bValue);
		}
		
		if (aValue < bValue) {
			return sortConfig.direction === 'asc' ? -1 : 1;
		}
		if (aValue > bValue) {
			return sortConfig.direction === 'asc' ? 1 : -1;
		}
		return 0;
		});
	}
	
	return employees;
	};

	const getSortIcon = (key) => {
	if (sortConfig.key !== key) {
		return ' ↕️';
	}
	return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
	};

	// ========== RENDERIZAÇÃO ==========
	return (
		<div className="employees-table-wrapper">
		{loading && <p className="loading-text">Carregando...</p>}
		{error && (
			<div className="error-message">
				{typeof error === 'string' ? error : JSON.stringify(error)}
			</div>
		)}

		{/* ========== BOTÃO ADICIONAR (NOVO) ========== */}
		{data.length > 0 && (
			<div className="table-header">
			<button className="btn-add" onClick={handleOpenCreateModal}>
				+ Adicionar Funcionário
			</button>
			</div>
		)}

		{/* Campo de busca */}
		{data.length > 0 && (
		<div className="search-container">
			<input
			type="text"
			className="search-input"
			placeholder="🔍 Buscar por nome, email, ID..."
			value={searchTerm}
			onChange={(e) => setSearchTerm(e.target.value)}
			/>
			{searchTerm && (
			<button className="btn-clear-search" onClick={() => setSearchTerm('')}>
				✕
			</button>
			)}
		</div>
		)}
		
		{data.length > 0 && (
			<div className="table-container">
			<table className="employees-table">
				<thead>
					<tr>
						<th onClick={() => handleSort('id')} style={{cursor: 'pointer'}}>
						ID{getSortIcon('id')}
						</th>
						<th onClick={() => handleSort('employee_id')} style={{cursor: 'pointer'}}>
						ID Empregado{getSortIcon('employee_id')}
						</th>
						<th onClick={() => handleSort('employee_name')} style={{cursor: 'pointer'}}>
						Nome{getSortIcon('employee_name')}
						</th>
						<th onClick={() => handleSort('employee_email')} style={{cursor: 'pointer'}}>
						Email{getSortIcon('employee_email')}
						</th>
						<th onClick={() => handleSort('hire_date')} style={{cursor: 'pointer'}}>
						Aniversário de Empresa{getSortIcon('hire_date')}
						</th>
						<th>Anos de Empresa</th>
						<th>Dias até Aniversário</th>
						<th onClick={() => handleSort('manager_name')} style={{cursor: 'pointer'}}>
						Gestor{getSortIcon('manager_name')}
						</th>
						<th>Ações</th>
					</tr>
				</thead>
				<tbody>
				{/* Não precisa de flattenHierarchy - data já é array simples */}
				{getFilteredAndSortedData().map((employee) => (
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
						<button 
						className="btn-edit"
						onClick={() => handleEdit(employee)}
						title="Editar"
						>
						<MdEdit />
						</button>
						<button 
						className="btn-delete"
						onClick={() => handleDelete(employee)}
						title="Remover"
						>
						<FaTrash />
						</button>
					</td>
					</tr>
				))}
				</tbody>
			</table>
			</div>
		)}

		{/* MODAL DE EDIÇÃO */}
		{isModalOpen && (
			<div className="modal-overlay" onClick={handleCloseModal}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<h2>Editar Employee</h2>
				<form>
				<div className="form-group">
					<label>ID Empregado:</label>
					<input
					type="number"
					value={formData.employee_id}
					onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
					/>
				</div>
				<div className="form-group">
					<label>Nome:</label>
					<input
					type="text"
					value={formData.employee_name}
					onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
					/>
				</div>
				<div className="form-group">
					<label>Email:</label>
					<input
					type="email"
					value={formData.employee_email}
					onChange={(e) => setFormData({...formData, employee_email: e.target.value})}
					/>
				</div>
				<div className="form-group">
					<label>Data de Contratação:</label>
					<input
					type="date"
					value={formData.hire_date}
					onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
					/>
				</div>
				<div className="modal-buttons">
					<button type="button" className="btn-cancel" onClick={handleCloseModal}>
					Cancelar
					</button>
					<button type="button" className="btn-save" onClick={handleSave}>
					Salvar
					</button>
				</div>
				</form>
			</div>
			</div>
		)}

		{/* ========== MODAL DE CRIAÇÃO (NOVO) ========== */}
      	{isCreateModalOpen && (
			<div className="modal-overlay" onClick={handleCloseCreateModal}>
				<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<h2>Adicionar Funcionário</h2>
				<form>
					<div className="form-group">
					<label>ID Empregado: *</label>
					<input
						type="number"
						value={createFormData.employee_id}
						onChange={(e) => setCreateFormData({...createFormData, employee_id: e.target.value})}
						placeholder="Ex: 123456"
					/>
					</div>
					
					<div className="form-group">
					<label>Nome: *</label>
					<input
						type="text"
						value={createFormData.employee_name}
						onChange={(e) => setCreateFormData({...createFormData, employee_name: e.target.value})}
						placeholder="Ex: João Silva"
					/>
					</div>
					
					<div className="form-group">
					<label>Email: *</label>
					<input
						type="email"
						value={createFormData.employee_email}
						onChange={(e) => setCreateFormData({...createFormData, employee_email: e.target.value})}
						placeholder="Ex: joao.silva@email.com"
					/>
					</div>
					
					<div className="form-group">
					<label>Data de Contratação: *</label>
					<input
						type="date"
						value={createFormData.hire_date}
						onChange={(e) => setCreateFormData({...createFormData, hire_date: e.target.value})}
					/>
					</div>

					{/* ========== CAMPOS DE GESTOR (NOVOS) ========== */}
					<div className="form-group">
					<label>Nome do Gestor: *</label>
					<input
						type="text"
						value={createFormData.manager_name}
						onChange={(e) => setCreateFormData({...createFormData, manager_name: e.target.value})}
						placeholder="Ex: Maria Santos"
					/>
					</div>

					<div className="form-group">
					<label>Email do Gestor: *</label>
					<input
						type="email"
						value={createFormData.manager_email}
						onChange={(e) => setCreateFormData({...createFormData, manager_email: e.target.value})}
						placeholder="Ex: maria.santos@email.com"
					/>
					</div>

					<div className="modal-buttons">
					<button type="button" className="btn-cancel" onClick={handleCloseCreateModal}>
						Cancelar
					</button>
					<button type="button" className="btn-save" onClick={handleCreate}>
						Adicionar
					</button>
					</div>
				</form>
				</div>
			</div>
			)}

		{/* ========== ALERT MODAL (REUTILIZÁVEL) ========== */}
		<AlertModal
			isOpen={alert.isOpen}
			type={alert.type}
			title={alert.title}
			message={alert.message}
			onClose={() => setAlert({ ...alert, isOpen: false })}
			onConfirm={alert.onConfirm}
		/>
		</div>
	);
}

export default AllEmployeesTable;