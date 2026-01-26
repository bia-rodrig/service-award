import React, { useState } from 'react';
import { adminService } from '../services/adminService';
import './ClearDatabase.css';

function ClearDatabase() {
	const [loading, setLoading] = useState(false);

	const handleClearDatabase = async () => {
		// Confirmação
		const confirmClear = window.confirm(
			'Isso apagará todo o banco de dados de funcionários. Deseja prosseguir?'
		);

		if (!confirmClear) {
			return;
		}

		setLoading(true);

		try {
			const result = await adminService.clearAllEmployees();
			
			alert(
			`${result.message}\n\nTotal de funcionários removidos: ${result.total_deleted}`
			);
			
		} catch (err) {
			let errorMessage = 'Erro ao limpar banco de dados';
			
			if (typeof err.response?.data?.detail === 'string') {
			errorMessage = err.response.data.detail;
			} else if (err.message) {
			errorMessage = err.message;
			}
			
			alert(errorMessage);
			
		} finally {
			setLoading(false);
		}
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
		</div>
	);
}

export default ClearDatabase;