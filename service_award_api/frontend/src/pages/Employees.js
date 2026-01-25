import React, { useState, useEffect } from 'react';
//useState -> cria variáveis que atualizam a tela
//useEffect -> executa código quando a página carregar

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

	return (
		<div className="employees-container">
			<h1>Employees</h1>
      		{/* Se estiver carregando, mostra "Carregando..." */}
			{loading && <p>Carregando...</p>}
			{/* Se tiver erro, mostra a mensagem de erro */}
			{error && <div className="error-message">{error}</div>}
			
			{/* Se tiver dados, mostra o JSON formatado o <pre> mantem a formatação do json*/}
			{data && (
				<pre className="json-display">
				{JSON.stringify(data, null, 2)}
				</pre>
			)}
		</div>
	)
}

export default Employees;

