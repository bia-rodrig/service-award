import React, { useState } from 'react';
import Header from '../components/Header';
import EmployeesTable from '../components/EmployeesTable';
import AllEmployeesTable from '../components/AllEmployeesTable';
import UsersTable from '../components/UsersTable';
import ClearDatabase from '../components/ClearDatabase';
import UploadExcel from '../components/UploadExcel';
import './Dashboard.css'

function Dashboard(){
	//estado para controlar qual seção está ativa
	const [activeSection, setActiveSection] = useState('meus-funcionarios');
	//Opções: 'meus-funcionarios', 'todos-funcionarios', 'gerenciar-usuarios'

	return(
		<div className="dashboard-container">
			{/* Header no topo */}
			<Header />
		
			<div className="dashboard-content">
				{/* ========== SIDEBAR ESQUERDA ========== */}
				<aside className="dashboard-sidebar">
				<nav>
					<button
					className={activeSection === 'meus-funcionarios' ? 'active' : ''}
					onClick={() => setActiveSection('meus-funcionarios')}
					>
					Funcionários
					</button>
					
					<button
					className={activeSection === 'todos-funcionarios' ? 'active' : ''}
					onClick={() => setActiveSection('todos-funcionarios')}
					>
					Todos Funcionários
					</button>
					
					<button
					className={activeSection === 'gerenciar-usuarios' ? 'active' : ''}
					onClick={() => setActiveSection('gerenciar-usuarios')}
					>
					Gerenciar Usuários
					</button>
					<button
					className={activeSection === 'carregar-banco' ? 'active' : ''}
					onClick={() => setActiveSection('carregar-banco')}
					>
					Carregar Banco de Dados
					</button>
					<button
					className={activeSection === 'limpar-banco' ? 'active' : ''}
					onClick={() => setActiveSection('limpar-banco')}
					>
					Limpar Banco de Dados
					</button>
				</nav>
				</aside>

				{/* ========== CONTEÚDO DIREITA ========== */}
				<main className="dashboard-main">
				{/* Meus Funcionários */}
				{activeSection === 'meus-funcionarios' && (
					<div>
						<h2>Meus Funcionários</h2>
						<EmployeesTable />
					</div>
				)}

				{/* Todos Funcionários */}
				{activeSection === 'todos-funcionarios' && (
					<div>
					<h2>Todos Funcionários</h2>
					<AllEmployeesTable />
					</div>
				)}

				{/* Gerenciar Usuários */}
				{activeSection === 'gerenciar-usuarios' && (
					<div>
					<h2>Gerenciar Usuários</h2>
					<UsersTable />
					</div>
				)}
				
				{/* ========== CARREGAR BANCO DE DADOS (NOVO) ========== */}
				{activeSection === 'carregar-banco' && (
				<div>
					<h2>Carregar Banco de Dados</h2>
					<UploadExcel />
				</div>
				)}

				{/* ========== LIMPAR BANCO DE DADOS (NOVO) ========== */}
				{activeSection === 'limpar-banco' && (
				<div>
					<h2>Limpar Banco de Dados</h2>
					<ClearDatabase />
				</div>
				)}
				</main>
			</div>
		</div>
	)
}

export default Dashboard;