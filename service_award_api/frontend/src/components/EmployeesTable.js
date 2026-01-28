import React, { useState, useEffect } from 'react';
import { employeeService } from '../services/employeeService';
import { authService } from '../services/authService';
import { MdEdit } from 'react-icons/md';
import { FaTrash } from 'react-icons/fa';
import './EmployeesTable.css';

function EmployeesTable() {
	// ========== ESTADOS ==========
	const [data, setData] = useState(null);
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

	//estados para criação
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [createFormData, setCreateFormData] = useState({
		employee_id: '',
		employee_name: '',
		employee_email: '',
		hire_date: ''
	});

	const [currentUser, setCurrentUser] = useState(null); //dados do usuário logado


	// ========== NOVOS ESTADOS PARA EMAIL ==========
	const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
	const [emailDestination, setEmailDestination] = useState('');
	const [sendingEmail, setSendingEmail] = useState(false);

	// ========== NOVOS ESTADOS PARA BUSCA E ORDENAÇÃO ==========
	const [searchTerm, setSearchTerm] = useState('');
	const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
	

	// ========== BUSCAR DADOS ==========
	useEffect(() => {
		const fetchData = async() => {
		try{
			const result = await employeeService.getHierarchy();
			setData(result);
		} catch(err){
			setError(err.response?.data?.detail || 'Erro ao buscar os dados');
		} finally{
			setLoading(false);
		}
		};
		fetchData();
	}, [])

	//useEffect para buscar dados do usuario
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

	// ========== FUNÇÕES ==========
	const flattenHierarchy = (employees) => {
		let flatList = [];
		employees.forEach(employee => {
		flatList.push(employee);
		if (employee.subordinates && employee.subordinates.length > 0) {
			flatList = flatList.concat(flattenHierarchy(employee.subordinates));
		}
		});
		return flatList;
	};

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

	const handleDelete = async (employee) => {
		const confirmDelete = window.confirm(
		`Tem certeza que deseja remover ${employee.employee_name}?\n\nEsta ação não pode ser desfeita.`
		);
		if (!confirmDelete) {
		return;
		}
		try{
		await employeeService.deleteEmployee(employee.id);
		alert(`${employee.employee_name} foi removido com sucesso!`);
		const result = await employeeService.getHierarchy();
		setData(result);
		} catch (err){
		alert(err.response?.data?.detail || 'Erro ao remover employee');
		}
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
		alert('Employee atualizado com sucesso!');
		const result = await employeeService.getHierarchy();
		setData(result);
		handleCloseModal();
		} catch (err) {
		alert(err.response?.data?.detail || 'Erro ao atualizar employee');
		}
	};

	// ========== FUNÇÕES DE CRIAÇÃO ==========
	const handleOpenCreateModal = () => {
		setCreateFormData({
			employee_id: '',
			employee_name: '',
			employee_email: '',
			hire_date: ''
		});
		setIsCreateModalOpen(true);
	};

	const handleCloseCreateModal = () => {
		setIsCreateModalOpen(false);
			setCreateFormData({
			employee_id: '',
			employee_name: '',
			employee_email: '',
			hire_date: ''
		});
	};

	const handleCreate = async () => {
		try {
			// Valida campos obrigatórios
			if (!createFormData.employee_id || !createFormData.employee_name || 
				!createFormData.employee_email || !createFormData.hire_date) {
				alert('Todos os campos são obrigatórios!');
				return;
			}

			// ========== ADICIONA ESSES LOGS ==========
			const dataToSend = {
				employee_id: parseInt(createFormData.employee_id),
				employee_name: createFormData.employee_name,
				employee_email: createFormData.employee_email,
				hire_date: createFormData.hire_date
			};

			// console.log('====== DADOS QUE VÃO SER ENVIADOS ======');
			// console.log('createFormData:', createFormData);
			// console.log('dataToSend:', dataToSend);
			// console.log('employee_id (int):', dataToSend.employee_id);
			// console.log('employee_name:', dataToSend.employee_name);
			// console.log('employee_email:', dataToSend.employee_email);
			// console.log('hire_date:', dataToSend.hire_date);
			// console.log('========================================');

			// Cria o employee
			await employeeService.createEmployee(dataToSend);

			alert('Funcionário criado com sucesso!');

			// Recarrega os dados
			const result = await employeeService.getHierarchy();
			setData(result);

			// Fecha o modal
			handleCloseCreateModal();

		} catch (err) {
			alert(err.response?.data?.detail || 'Erro ao criar funcionário');
		}
	};

	// ========== FUNÇÕES DE EMAIL ==========
	const handleOpenEmailModal = () => {
		// Preenche com o email do usuário logado por padrão
		if (currentUser) {
			setEmailDestination(currentUser.email);
		}
		setIsEmailModalOpen(true);
	};

	const handleCloseEmailModal = () => {
		setIsEmailModalOpen(false);
		setEmailDestination('');
	};

	const handleSendEmail = async () => {
		if (!emailDestination) {
			alert('Por favor, informe o email de destino!');
			return;
		}

		// Valida formato de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(emailDestination)) {
			alert('Por favor, informe um email válido!');
			return;
		}

		setSendingEmail(true);

		try {
			const result = await employeeService.sendCalendarEmail(emailDestination);
			
			alert(
			`${result.message}\n\nTotal de funcionários incluídos: ${result.total_employees}`
			);
			
			handleCloseEmailModal();
			
		} catch (err) {
			let errorMessage = 'Erro ao enviar email';
			
			if (typeof err.response?.data?.detail === 'string') {
			errorMessage = err.response.data.detail;
			} else if (err.message) {
			errorMessage = err.message;
			} else {
			errorMessage = 'Erro desconhecido ao enviar email. Por favor, entre em contato com bianca.rodrigues@disney.com';
			}
			
			// Mostra alert com quebra de linha para melhor leitura
			alert(`❌ ${errorMessage}`);
			
		} finally {
			setSendingEmail(false);
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
		if (!data || !data.hierarchy) return [];
		
		// 1. Achata a hierarquia
		let employees = flattenHierarchy(data.hierarchy);
		
		// 2. Filtra por termo de busca
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			employees = employees.filter(emp => 
			emp.employee_name?.toLowerCase().includes(term) ||
			emp.employee_email?.toLowerCase().includes(term) ||
			emp.employee_id?.toString().includes(term) ||
			emp.manager_name?.toLowerCase().includes(term)
			);
	}
	
	// 3. Ordena
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
		return ' ↕️';  // Sem ordenação
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
		{data && (
			<div className="table-header">
				<button className="btn-add" onClick={handleOpenCreateModal}>
					+ Adicionar Funcionário
				</button>
				<button className="btn-send-email" onClick={handleOpenEmailModal}>
					📧 Enviar Calendário
				</button>
			</div>
		)}

		{/* Campo de busca */}
		{data && (
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
		
		{data && (
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

				{/* Info sobre manager */}
				{currentUser && (
					<div className="info-box">
					<strong>Gestor:</strong> {currentUser.name} {currentUser.surname} ({currentUser.email})
					</div>
				)}

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

		{/* ========== MODAL DE ENVIO DE EMAIL (NOVO) ========== */}
		{isEmailModalOpen && (
			<div className="modal-overlay" onClick={handleCloseEmailModal}>
			<div className="modal-content email-modal" onClick={(e) => e.stopPropagation()}>
				<h2>📧 Enviar Calendário de Aniversários</h2>
				
				<p className="modal-description">
				Será enviado um e-mail com um arquivo para adicionar ao Outlook, contendo todos os aniversários de empresa dos seus funcionários.
				</p>

				<form>
				<div className="form-group">
					<label>Email de Destino: *</label>
					<input
					type="email"
					value={emailDestination}
					onChange={(e) => setEmailDestination(e.target.value)}
					placeholder="seu.email@empresa.com"
					/>
				</div>

				<div className="modal-buttons">
					<button 
					type="button" 
					className="btn-cancel" 
					onClick={handleCloseEmailModal}
					disabled={sendingEmail}
					>
					Cancelar
					</button>
					
					<button 
					type="button" 
					className="btn-save" 
					onClick={handleSendEmail}
					disabled={sendingEmail}
					>
					{sendingEmail ? 'Enviando...' : '📧 Enviar'}
					</button>
				</div>
				</form>
			</div>
			</div>
		)}
		</div>
	);
}

export default EmployeesTable;