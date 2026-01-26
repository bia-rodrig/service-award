import React from 'react';
import Header from '../components/Header';
import EmployeesTable from '../components/EmployeesTable';
import './Employees.css';

function Employees() {
	return (
		<div className="employees-container">
		{/* Header no topo */}
		<Header />
		
		{/* Título */}
		<h1>Funcionários</h1>
		
		{/* Tabela de employees */}
		<EmployeesTable />
		</div>
	);
}

export default Employees;