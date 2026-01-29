import React from 'react';
import './AlertModal.css';

function AlertModal({ 
  isOpen, 
  type = 'info',  // 'success', 'error', 'warning', 'question'
  title, 
  message, 
  onClose,
  onConfirm  // Só usado quando type='question'
}) {
  if (!isOpen) return null;

  // Configurações para cada tipo
  const configs = {
    success: {
      icon: '✅',
      color: '#4CAF50',
      buttonText: 'OK'
    },
    error: {
      icon: '❌',
      color: '#d32f2f',
      buttonText: 'Fechar'
    },
    warning: {
      icon: '⚠️',
      color: '#FF9800',
      buttonText: 'Entendi'
    },
    question: {
      icon: '❓',
      color: '#2196F3',
      buttonText: 'Confirmar'
    }
  };

  const config = configs[type] || configs.error;

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div 
        className="alert-modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ borderTop: `5px solid ${config.color}` }}
      >
        {/* Ícone */}
        <div className="alert-modal-icon">
          {config.icon}
        </div>

        {/* Título */}
        <h2 className="alert-modal-title" style={{ color: config.color }}>
          {title}
        </h2>

        {/* Mensagem */}
        <p className="alert-modal-message">{message}</p>

        {/* Botões */}
        <div className="alert-modal-buttons">
          {type === 'question' ? (
            <>
              <button 
                className="alert-modal-btn alert-modal-btn-cancel" 
                onClick={onClose}
              >
                Cancelar
              </button>
              <button 
                className="alert-modal-btn alert-modal-btn-confirm" 
                onClick={onConfirm}
                style={{ backgroundColor: config.color }}
              >
                {config.buttonText}
              </button>
            </>
          ) : (
            <button 
              className="alert-modal-btn alert-modal-btn-single" 
              onClick={onClose}
              style={{ backgroundColor: config.color }}
            >
              {config.buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlertModal;