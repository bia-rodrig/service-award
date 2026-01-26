import React, { useState } from 'react';
import { adminService } from '../services/adminService';
import './UploadExcel.css';

function UploadExcel() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Valida se é arquivo Excel
		if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
			alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
			e.target.value = '';
			return;
		}
		
		setSelectedFile(file);
		setResult(null); // Limpa resultado anterior
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) {
		alert('Por favor, selecione um arquivo primeiro!');
		return;
		}

		setLoading(true);
		setResult(null);

		try {
		const response = await adminService.uploadExcel(selectedFile);
		setResult(response);
		
		// Limpa o arquivo selecionado
		setSelectedFile(null);
		document.getElementById('file-input').value = '';
		
		} catch (err) {
		let errorMessage = 'Erro ao fazer upload do arquivo';
		
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
		<div className="upload-excel-container">
		{/* Instruções */}
		<div className="info-box">
			<h3>📋 Instruções</h3>
			<p>Faça upload de um arquivo Excel (.xlsx ou .xls) com as seguintes colunas:</p>
			<ul>
			<li><strong>employee_id</strong> - ID do funcionário</li>
			<li><strong>employee_name</strong> - Nome do funcionário</li>
			<li><strong>employee_email</strong> - Email do funcionário</li>
			<li><strong>hire_date</strong> - Data de contratação</li>
			<li><strong>manager_name</strong> - Nome do gestor</li>
			<li><strong>manager_email</strong> - Email do gestor</li>
			</ul>
			<p className="note">
			<strong>Nota:</strong> Se o email já existir, os dados serão atualizados.
			</p>
		</div>

		{/* Seleção de arquivo */}
		<div className="file-input-container">
			<input
			id="file-input"
			type="file"
			accept=".xlsx,.xls"
			onChange={handleFileChange}
			disabled={loading}
			/>
			
			{selectedFile && (
			<div className="file-selected">
				✅ Arquivo selecionado: <strong>{selectedFile.name}</strong>
			</div>
			)}
		</div>

		{/* Botão de upload */}
		<button 
			className="btn-upload" 
			onClick={handleUpload}
			disabled={loading || !selectedFile}
		>
			{loading ? '📤 Enviando...' : '📤 Fazer Upload'}
		</button>

		{/* Resultado */}
		{result && (
			<div className="result-box">
			<h3>✅ {result.message}</h3>
			
			<div className="result-stats">
				<div className="stat">
				<span className="stat-label">Cabeçalho encontrado na linha:</span>
				<span className="stat-value">{result.header_found_at_row}</span>
				</div>
				
				<div className="stat success">
				<span className="stat-label">✅ Funcionários adicionados:</span>
				<span className="stat-value">{result.employees_added}</span>
				</div>
				
				<div className="stat warning">
				<span className="stat-label">🔄 Funcionários atualizados:</span>
				<span className="stat-value">{result.employees_updated}</span>
				</div>
				
				<div className="stat error">
				<span className="stat-label">⚠️ Funcionários ignorados:</span>
				<span className="stat-value">{result.employees_skipped}</span>
				</div>
				
				{result.total_errors > 0 && (
				<div className="stat error">
					<span className="stat-label">❌ Total de erros:</span>
					<span className="stat-value">{result.total_errors}</span>
				</div>
				)}
			</div>

			{/* Erros detalhados */}
			{result.errors && result.errors.length > 0 && (
				<div className="errors-list">
				<h4>Detalhes dos Erros:</h4>
				<ul>
					{result.errors.map((error, index) => (
					<li key={index}>{error}</li>
					))}
				</ul>
				</div>
			)}
			</div>
		)}
		</div>
	);
}

export default UploadExcel;