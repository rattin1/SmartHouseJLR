import React, { useState, useEffect } from 'react';
import { SwitchContainer } from '../../SwitchContainer';
import { controlarSala, getConnectionStatus, subscribeDeviceStatus } from '../../utils/mqtt';

const SalaDeEstar = () => {
  // Estados dos dispositivos (agora sincronizados com ESP32)
  const [ledStatus, setLedStatus] = useState("OFF");
  const [arCondicionadoStatus, setArCondicionadoStatus] = useState("OFF");
  const [umidificadorStatus, setUmidificadorStatus] = useState("OFF");
  const [autoArStatus, setAutoArStatus] = useState("OFF");
  const [autoUmidificadorStatus, setAutoUmidificadorStatus] = useState("OFF");
  const [isConnected, setIsConnected] = useState(false);

  // 🆕 Escuta feedback do ESP32 sobre status dos dispositivos
  useEffect(() => {
    const unsubscribeStatus = subscribeDeviceStatus((deviceStatus) => {
      if (deviceStatus.sala) {
        console.log("📊 Status da sala recebido:", deviceStatus.sala);
        
        setLedStatus(deviceStatus.sala.led || "OFF");
        setArCondicionadoStatus(deviceStatus.sala.arCondicionado || "OFF");
        setUmidificadorStatus(deviceStatus.sala.umidificador || "OFF");
        setAutoArStatus(deviceStatus.sala.autoAr || "OFF");
        setAutoUmidificadorStatus(deviceStatus.sala.autoUmidificador || "OFF");
      }
    });

    return () => unsubscribeStatus();
  }, []);

  // Verifica status da conexão periodicamente
  useEffect(() => {
    const checkConnection = () => {
      const status = getConnectionStatus();
      setIsConnected(status.isConnected);
    };

    // Verifica imediatamente
    checkConnection();

    // Verifica a cada 2 segundos
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  // 💡 Função para controlar LED da sala
  const mudarLed = () => {
    if (!isConnected) {
      console.warn("⚠️ Sem conexão MQTT - LED não pode ser controlado");
      return;
    }

    const novoLedStatus = ledStatus === "ON" ? "OFF" : "ON";
    // Não atualiza o estado local - espera feedback do ESP32
    controlarSala("led", novoLedStatus);
    console.log(`🔴 Comando LED enviado: ${novoLedStatus}`);
  };

  // ❄️ Função para controlar Ar-condicionado manualmente
  const mudarArCondicionado = () => {
    if (!isConnected) {
      console.warn("⚠️ Sem conexão MQTT - Ar-condicionado não pode ser controlado");
      return;
    }

    if (autoArStatus === "ON") {
      console.warn("⚠️ Modo automático ativo - desative primeiro para controle manual");
      return;
    }

    const novoArStatus = arCondicionadoStatus === "ON" ? "OFF" : "ON";
    // Não atualiza o estado local - espera feedback do ESP32
    controlarSala("arCondicionado", novoArStatus);
    console.log(`❄️ Comando Ar-condicionado enviado: ${novoArStatus}`);
  };

  // 💧 Função para controlar Umidificador manualmente
  const mudarUmidificador = () => {
    if (!isConnected) {
      console.warn("⚠️ Sem conexão MQTT - Umidificador não pode ser controlado");
      return;
    }

    if (autoUmidificadorStatus === "ON") {
      console.warn("⚠️ Modo automático ativo - desative primeiro para controle manual");
      return;
    }

    const novoUmidificadorStatus = umidificadorStatus === "ON" ? "OFF" : "ON";
    // Não atualiza o estado local - espera feedback do ESP32
    controlarSala("umidificador", novoUmidificadorStatus);
    console.log(`💧 Comando Umidificador enviado: ${novoUmidificadorStatus}`);
  };

  // 🤖 Função para ativar/desativar automação do Ar-condicionado
  const mudarAutoAr = () => {
    if (!isConnected) {
      console.warn("⚠️ Sem conexão MQTT - Automação não pode ser controlada");
      return;
    }

    const novoAutoArStatus = autoArStatus === "ON" ? "OFF" : "ON";
    
    if (novoAutoArStatus === "ON") {
      // Ativa automação - ESP32 vai verificar temperatura atual
      controlarSala("arCondicionado", "AUTO_ON");
      console.log("🤖 Comando Automação Ar-condicionado: ATIVAR");
    } else {
      // Desativa automação
      controlarSala("arCondicionado", "AUTO_OFF");
      console.log("🤖 Comando Automação Ar-condicionado: DESATIVAR");
    }
    // Não atualiza estado local - espera feedback do ESP32
  };

  // 🤖 Função para ativar/desativar automação do Umidificador
  const mudarAutoUmidificador = () => {
    if (!isConnected) {
      console.warn("⚠️ Sem conexão MQTT - Automação não pode ser controlada");
      return;
    }

    const novoAutoUmidificadorStatus = autoUmidificadorStatus === "ON" ? "OFF" : "ON";
    
    if (novoAutoUmidificadorStatus === "ON") {
      // Ativa automação - ESP32 vai verificar umidade atual
      controlarSala("umidificador", "AUTO_ON");
      console.log("🤖 Comando Automação Umidificador: ATIVAR");
    } else {
      // Desativa automação
      controlarSala("umidificador", "AUTO_OFF");
      console.log("🤖 Comando Automação Umidificador: DESATIVAR");
    }
    // Não atualiza estado local - espera feedback do ESP32
  };

  return (
    <div className="p-2 border rounded-start shadow-sm h-100 w-md-auto">
      <h3 className="text-center mb-4 text-light p-3 rounded bg-primary">
        🏠 Sala de Estar
      </h3>
  
      {/* Status da conexão */}
      <div className={`mb-4 p-2 rounded border ${isConnected ? 'bg-success bg-opacity-10 border-success' : 'bg-danger bg-opacity-10 border-danger'}`}>
        <div className="d-flex justify-content-center align-items-center">
          <span>
            {isConnected ? (
              <><strong>🟢 MQTT Conectado</strong> - Controles ativos</>
            ) : (
              <><strong>🔴 MQTT Desconectado</strong> - Controles desabilitados</>
            )}
          </span>
        </div>
      </div>
  
      <div className="row g-4">
        {/* LED da Sala */}
        <div className="col-md-4 col-sm-6 col-12">
          <SwitchContainer
            className={`${ledStatus === "ON" ? "text-success" : "text-danger"}`}
            SwitchName={`${ledStatus === "ON" ? "Desligar" : "Ligar"}`}
            Status={ledStatus}
            OnClick={mudarLed}
            ContainerName="🔴 LED da Sala"
            buttonClass={`${ledStatus === "ON" ? "btn-danger" : "btn-success"} ${!isConnected ? "disabled" : ""}`}
          />
        </div>
  
        {/* Ar-condicionado Manual */}
        <div className="col-md-4 col-sm-6 col-12">
          <SwitchContainer
            className={`${arCondicionadoStatus === "ON" ? "text-success" : "text-danger"}`}
            SwitchName={
              autoArStatus === "ON" ? "Modo AUTO Ativo" :
              arCondicionadoStatus === "ON" ? "Desligar" : "Ligar"
            }
            Status={arCondicionadoStatus}
            OnClick={mudarArCondicionado}
            ContainerName="❄️ Ar-condicionado (Manual)"
            buttonClass={`${
              autoArStatus === "ON" ? "btn-warning disabled" :
              arCondicionadoStatus === "ON" ? "btn-danger" : "btn-success"
            } ${!isConnected ? "disabled" : ""}`}
          />
        </div>
  
        {/* Umidificador Manual */}
        <div className="col-md-4 col-sm-6 col-12">
          <SwitchContainer
            className={`${umidificadorStatus === "ON" ? "text-success" : "text-danger"}`}
            SwitchName={
              autoUmidificadorStatus === "ON" ? "Modo AUTO Ativo" :
              umidificadorStatus === "ON" ? "Desligar" : "Ligar"
            }
            Status={umidificadorStatus}
            OnClick={mudarUmidificador}
            ContainerName="💧 Umidificador (Manual)"
            buttonClass={`${
              autoUmidificadorStatus === "ON" ? "btn-warning disabled" :
              umidificadorStatus === "ON" ? "btn-danger" : "btn-success"
            } ${!isConnected ? "disabled" : ""}`}
          />
        </div>
  
        {/* Automação Ar-condicionado */}
        <div className="col-md-4 col-sm-6 col-12">
          <SwitchContainer
            className={`${autoArStatus === "ON" ? "text-warning" : "text-secondary"}`}
            SwitchName={`${autoArStatus === "ON" ? "Desativar AUTO" : "Ativar AUTO"}`}
            Status={autoArStatus}
            OnClick={mudarAutoAr}
            ContainerName="🤖 Automação Ar-condicionado"
            buttonClass={`${autoArStatus === "ON" ? "btn-warning" : "btn-outline-warning"} ${!isConnected ? "disabled" : ""}`}
          />
        </div>
  
        {/* Automação Umidificador */}
        <div className="col-md-4 col-sm-6 col-12">
          <SwitchContainer
            className={`${autoUmidificadorStatus === "ON" ? "text-info" : "text-secondary"}`}
            SwitchName={`${autoUmidificadorStatus === "ON" ? "Desativar AUTO" : "Ativar AUTO"}`}
            Status={autoUmidificadorStatus}
            OnClick={mudarAutoUmidificador}
            ContainerName="🤖 Automação Umidificador"
            buttonClass={`${autoUmidificadorStatus === "ON" ? "btn-info" : "btn-outline-info"} ${!isConnected ? "disabled" : ""}`}
          />
        </div>
      </div>
  
      {/* Status em tempo real */}
      <div className="mt-4 p-3 rounded bg-dark bg-opacity-75 text-light">
        <h6 className="mb-2">📊 Status Atual (ESP32):</h6>
        <div className="row">
          <div className="col-md-4 col-sm-6 col-12">
            <small>
              🔴 LED: <strong className={ledStatus === "ON" ? "text-success" : "text-danger"}>{ledStatus}</strong><br/>
              ❄️ Ar-cond: <strong className={arCondicionadoStatus === "ON" ? "text-success" : "text-danger"}>{arCondicionadoStatus}</strong><br/>
              💧 Umidificador: <strong className={umidificadorStatus === "ON" ? "text-success" : "text-danger"}>{umidificadorStatus}</strong>
            </small>
          </div>
          <div className="col-md-4 col-sm-6 col-12">
            <small>
              🤖 Auto AC: <strong className={autoArStatus === "ON" ? "text-warning" : "text-secondary"}>{autoArStatus}</strong><br/>
              🤖 Auto Umid: <strong className={autoUmidificadorStatus === "ON" ? "text-info" : "text-secondary"}>{autoUmidificadorStatus}</strong>
            </small>
          </div>
        </div>
      </div>
  
      {/* Legenda */}
      <div className="mt-4 p-3 rounded bg-dark text-light">
        <h6 className="mb-2">📋 Informações:</h6>
        <ul className="mb-0 small">
          <li><strong>🔄 Sincronização:</strong> Status sincronizado com ESP32 em tempo real</li>
          <li><strong>❄️ Ar-condicionado AUTO:</strong> Liga se T≥28°C, desliga se T≤20°C</li>
          <li><strong>💧 Umidificador AUTO:</strong> Liga se H≤20%, desliga se H≥80%</li>
          <li><strong>⚠️ Controle manual:</strong> Desabilitado quando modo AUTO está ativo</li>
        </ul>
      </div>
    </div>
  );
};

export default SalaDeEstar;