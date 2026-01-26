// Importa React e o sistema de rotas
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


import Login from './pages/Login';
import Employees from './pages/Employees';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';

import Register from './pages/Register';

import ProtectedRoute from './components/ProtectedRoute';


import './App.css';

function App() {
  return (
    // Router = habilita o sistema de navegação entre páginas
    <Router>
      <div className="App">
        {/* Routes = define as rotas (caminhos) */}
        <Routes>
          {/* Rota publica, qualquer pessoa acessa */}
          <Route path="/" element={<Login />} />

          {/* Rota pública - Trocar Senha (NOVA ROTA) */}
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Rota pública - Cadastrar usuario */}
          <Route path="/register" element={<Register />} />

          {/* Rota protegida - só quem está logado */}
          <Route path="/employees" element={
              <ProtectedRoute>
              <Employees />
              </ProtectedRoute>
            }
          />

          <Route path="/dashboard" element={
              <ProtectedRoute>
              <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;