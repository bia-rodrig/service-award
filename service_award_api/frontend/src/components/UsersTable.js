import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { MdLockReset } from 'react-icons/md';
import { FaTrash } from 'react-icons/fa';
import './UsersTable.css';

import AlertModal from './AlertModal'



function UsersTable() {
	// ========== ESTADOS ==========
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [editingUserId, setEditingUserId] = useState(null);
	//null -> nenhum usuário em edição
	//numero -> id do usuário sendo editado

	const [alert, setAlert] = useState({
		isOpen: false,
		type: 'error',
		title: '',
		message: '',
		onConfirm: null
	});

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
		// Abre modal de confirmação
		setAlert({
			isOpen: true,
			type: 'question',
			title: 'Resetar Senha',
			message: `Tem certeza que deseja resetar a senha de ${user.name} ${user.surname}?\n\nA senha será alterada para o padrão e o usuário será desativado.`,
			onConfirm: async () => {
				setAlert({ ...alert, isOpen: false });
				
				try {
					const result = await adminService.resetPassword(user.id);
					
					setAlert({
						isOpen: true,
						type: 'success',
						title: 'Sucesso!',
						message: result.message || 'Senha resetada com sucesso!',
						onConfirm: null
					});
					
					const newData = await adminService.getAllUsers();
					setData(newData);
					
				} catch (err) {
					setAlert({
						isOpen: true,
						type: 'error',
						title: 'Erro ao Resetar',
						message: err.response?.data?.detail || 'Erro ao resetar senha',
						onConfirm: null
					});
				}
			}
		});
	};

	// ========== DELETAR USUÁRIO ==========
	const handleDelete = async (user) => {
		setAlert({
			isOpen: true,
			type: 'question',
			title: 'Confirmar Exclusão',
			message: `Tem certeza que deseja remover ${user.name} ${user.surname}?\n\nEsta ação não pode ser desfeita.`,
			onConfirm: async () => {
				setAlert({ ...alert, isOpen: false });
				try{
					await adminService.deleteUser(user.id);
					
					setAlert({
						isOpen: true,
						type: 'success',
						title: 'Sucesso!',
						message: `${user.name} ${user.surname} foi removido com sucesso!`,
						onConfirm: null
					});
					
					// Recarrega os dados
					const newData = await adminService.getAllUsers();
					setData(newData);
				} catch (err){
					setAlert({
						isOpen: true,
						type: 'error',
						title: 'Erro ao Remover',
						message: err.response?.data?.detail || 'Erro ao remover usuário',
						onConfirm: null
					});
				}
			}			
		});
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

			setAlert({
				isOpen: true,
				type: 'success',
				title: 'Sucesso!',
				message: 'Permissão atualizada com sucesso!',
				onConfirm: null
			});

		} catch (err) {
			setAlert({
				isOpen: true,
				type: 'error',
				title: 'Erro ao Atualizar',
				message: err.response?.data?.detail || 'Erro ao atualizar permissão',
				onConfirm: null
			});
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

export default UsersTable;