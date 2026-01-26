import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { MdLockReset } from 'react-icons/md';
import { FaTrash } from 'react-icons/fa';
import './UsersTable.css';

function UsersTable() {
	// ========== ESTADOS ==========
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [editingUserId, setEditingUserId] = useState(null);
	//null -> nenhum usuário em edição
	//numero -> id do usuário sendo editado

	// ========== BUSCAR USUÁRIOS ==========
	useEffect(() => {
	const fetchData = async() => {
		try{
		const result = await adminService.getAllUsers();
		setData(result);
		} catch(err){
		setError(err.response?.data?.detail || 'Erro ao buscar usuários');
		} finally{
		setLoading(false);
		}
	};
	fetchData();
	}, [])

	// ========== RESETAR SENHA ==========
	const handleResetPassword = async (user) => {
	const confirmReset = window.confirm(
		`Tem certeza que deseja resetar a senha de ${user.name} ${user.surname}?\n\nA senha será alterada para o padrão e o usuário será desativado.`
	);

	if (!confirmReset) {
		return;
	}

	try{
		const result = await adminService.resetPassword(user.id);
		alert(result.message || 'Senha resetada com sucesso!');
		
		// Recarrega os dados
		const newData = await adminService.getAllUsers();
		setData(newData);
	} catch (err){
		alert(err.response?.data?.detail || 'Erro ao resetar senha');
	}
	};

	// ========== DELETAR USUÁRIO ==========
	const handleDelete = async (user) => {
		const confirmDelete = window.confirm(
			`Tem certeza que deseja remover ${user.name} ${user.surname}?\n\nEsta ação não pode ser desfeita.`
		);

		if (!confirmDelete) {
			return;
		}

		try{
			await adminService.deleteUser(user.id);
			alert(`${user.name} ${user.surname} foi removido com sucesso!`);
			
			// Recarrega os dados
			const newData = await adminService.getAllUsers();
			setData(newData);
		} catch (err){
			alert(err.response?.data?.detail || 'Erro ao remover usuário');
		}
	};

	// ========== ATUALIZAR ROLE ==========
	const handleRoleChange = async (userId, newRole) => {
		try {
			await adminService.updateUserRole(userId, newRole);

			// Atualiza os dados localmente (sem recarregar)
			setData(data.map(user => 
				user.id === userId ? { ...user, role: newRole } : user
			));

			// Para de editar
			setEditingUserId(null);

			alert('Permissão atualizada com sucesso!');

		} catch (err) {
			alert(err.response?.data?.detail || 'Erro ao atualizar permissão');
			setEditingUserId(null);
		}
	};

	// ========== RENDERIZAÇÃO ==========
	return (
	<div className="users-table-wrapper">
		{loading && <p className="loading-text">Carregando...</p>}
		{error && <div className="error-message">{error}</div>}
		
		{data.length > 0 && (
		<div className="table-container">
			<table className="users-table">
			<thead>
				<tr>
				<th>ID</th>
				<th>Email</th>
				<th>Nome</th>
				<th>Sobrenome</th>
				<th>Permissão</th>
				<th>Status</th>
				<th>Ações</th>
				</tr>
			</thead>
			<tbody>
				{data.map((user) => (
				<tr key={user.id}>
					<td>{user.id}</td>
					<td>{user.email}</td>
					<td>{user.name}</td>
					<td>{user.surname}</td>
					<td>
						{/* Se está editando ESTE usuário, mostra select */}
						{editingUserId === user.id ? (
						<select
							className="role-select"
							value={user.role}
							onChange={(e) => handleRoleChange(user.id, e.target.value)}
							onBlur={() => setEditingUserId(null)}
							autoFocus
						>
							<option value="ADMIN">ADMIN</option>
							<option value="RH">RH</option>
							<option value="USER">USER</option>
						</select>
						) : (
						/* Se NÃO está editando, mostra badge clicável */
						<span 
							className={`badge badge-${user.role.toLowerCase()} badge-clickable`}
							onClick={() => setEditingUserId(user.id)}
							title="Clique para alterar"
						>
							{user.role}
						</span>
						)}
					</td>
					<td>
					<span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
						{user.is_active ? 'Ativo' : 'Inativo'}
					</span>
					</td>
					<td className="actions">
					{/* Botão Resetar Senha */}
					<button 
						className="btn-reset"
						onClick={() => handleResetPassword(user)}
						title="Resetar Senha"
					>
						<MdLockReset />
					</button>
					
					{/* Botão Remover */}
					<button 
						className="btn-delete"
						onClick={() => handleDelete(user)}
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
	</div>
	);
}

export default UsersTable;