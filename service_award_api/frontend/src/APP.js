// Importa React e o sistema de rotas
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importa a página de Login que criamos
import Login from './pages/Login';

// Importa os estilos globais
import './App.css';
import Employees from './pages/Employees';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    // Router = habilita o sistema de navegação entre páginas
    <Router>
      <div className="App">
        {/* Routes = define as rotas (caminhos) */}
        <Routes>
          {/* Rota publica, qualquer pessoa acessa */}
          <Route path="/" element={<Login />} />

          {/* Rota protegida - só quem está logado */}
          <Route path="/employees" element={
            <ProtectedRoute>
            <Employees />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;