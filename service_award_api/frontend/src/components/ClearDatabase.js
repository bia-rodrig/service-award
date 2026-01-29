import React, { useState } from 'react';
import { adminService } from '../services/adminService';
import './ClearDatabase.css';
import AlertModal from './AlertModal';

function ClearDatabase() {
	const [loading, setLoading] = useState(false);

	const [alert, setAlert] = useState({
		isOpen: false,
		type: 'error',
		title: '',
		message: '',
		onConfirm: null
	});

	const handleClearDatabase = async () => {
		// Abre modal de confirmação
		setAlert({
			isOpen: true,
			type: 'question',
			title: '⚠️ Atenção!',
			message: 'Isso apagará todo o banco de dados de funcionários.\n\nEsta ação não pode ser desfeita.\n\nDeseja prosseguir?',
			onConfirm: async () => {
			setAlert({ ...alert, isOpen: false });
			setLoading(true);

			try {
				const result = await adminService.clearAllEmployees();
				
				setAlert({
				isOpen: true,
				type: 'success',
				title: 'Banco Limpo com Sucesso!',
				message: `${result.message}\n\nTotal de funcionários removidos: ${result.total_deleted}`,
				onConfirm: null
				});
				
			} catch (err) {
				let errorMessage = 'Erro ao limpar banco de dados';
				
				if (typeof err.response?.data?.detail === 'string') {
				errorMessage = err.response.data.detail;
				} else if (err.message) {
				errorMessage = err.message;
				}
				
				setAlert({
				isOpen: true,
				type: 'error',
				title: 'Erro ao Limpar',
				message: errorMessage,
				onConfirm: null
				});
				
			} finally {
				setLoading(false);
			}
			}
		});
	};

	return (
		<div className="clear-database-container">
			<div className="warning-box">
				<h3>⚠️ Atenção!</h3>
				<p>Esta ação é irreversível e removerá <strong>todos os funcionários</strong> do banco de dados.</p>
				<p>Use esta opção apenas se tiver certeza do que está fazendo.</p>
			</div>

			<button 
			className="btn-clear-database" 
			onClick={handleClearDatabase}
			disabled={loading}
			>
				{loading ? 'Apagando...' : '🗑️ Apagar Banco de Dados'}
			</button>
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

export default ClearDatabase;