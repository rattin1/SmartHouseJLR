import React, { useState, useEffect } from 'react';
import { subscribeMessageLog, getMessageHistory } from '../../utils/mqtt.js';

const LogChat = () => {
  const [messageList, setMessageList] = useState([]);

  useEffect(() => {
    // Carrega histórico existente
    const history = getMessageHistory();
    setMessageList(history);

    // Se inscreve para receber novas mensagens
    const unsubscribe = subscribeMessageLog((newMessageList) => {
      setMessageList(newMessageList);
    });

    // Cleanup ao desmontar componente
    return () => {
      unsubscribe();
    };
  }, []);

  // Função para obter cor do badge baseado no tipo de mensagem
  const getMessageTypeColor = (type) => {
    switch(type) {
      case 'sent': return 'bg-primary';
      case 'received': return 'bg-success';
      case 'system': return 'bg-warning';
      case 'error': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  // Função para obter ícone baseado no tipo
  const getMessageIcon = (type) => {
    switch(type) {
      case 'sent': return '📤';
      case 'received': return '📥';
      case 'system': return '⚙️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  // Função para limpar histórico local e no mqtt.js
  const clearHistory = () => {
    setMessageList([]);
    // Limpa também o histórico global
    const messageHistory = getMessageHistory();
    messageHistory.length = 0;
  };

  return (
    <>
      {/* Cabeçalho do modal */}
      <div className="modal-header bg-primary text-light">
        <h5 className="modal-title" id="LogModalLabel">
          📝 Registro de Mensagens MQTT
        </h5>
        <button 
          type="button" 
          className="btn-close btn-close-white" 
          data-bs-dismiss="modal" 
          aria-label="Close"
        ></button>
      </div>

      {/* Contador de mensagens */}
      <div className="bg-light p-2 border-bottom">
        <small className="text-muted">
          📊 Total de mensagens: <strong>{messageList.length}</strong>
          {messageList.length > 0 && (
            <span className="ms-3">
              🕐 Última: {messageList[messageList.length - 1]?.time}
            </span>
          )}
        </small>
      </div>

      {/* Corpo do modal */}
      <div className="modal-body p-0">
        <div className="p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {messageList.length === 0 ? (
            <div className="text-center text-muted p-4">
              <i className="bi bi-chat-dots fs-1"></i>
              <p className="mt-2">Nenhuma mensagem ainda...</p>
              <small>As mensagens MQTT aparecerão aqui em tempo real</small>
            </div>
          ) : (
            messageList.map((message) => (
              <div
                className="mb-3 p-3 border rounded"
                key={message.id}
              >
                {/* Cabeçalho da mensagem */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${getMessageTypeColor(message.type)} px-2 py-1`}>
                      {getMessageIcon(message.type)} {message.type.toUpperCase()}
                    </span>
                    <strong className="text-primary" title="Tópico MQTT">
                      {message.author}
                    </strong>
                  </div>
                  <small className="text-muted" title="Horário">
                    🕐 {message.time}
                  </small>
                </div>

                {/* Conteúdo da mensagem */}
                <div className="bg-light p-2 rounded">
                  <code className="text-dark" style={{ wordBreak: 'break-all' }}>
                    {message.text}
                  </code>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rodapé do modal */}
      <div className="modal-footer bg-light d-flex justify-content-between">
        <button 
          className="btn btn-outline-danger btn-sm"
          onClick={clearHistory}
          disabled={messageList.length === 0}
        >
          🗑️ Limpar Histórico
        </button>
        <div className="d-flex gap-2">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            data-bs-dismiss="modal"
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
};

export default LogChat;