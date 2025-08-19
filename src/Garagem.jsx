import React, { useState, useEffect } from "react";
import { controlarGaragem, client } from "./utils/mqtt";
import { SwitchContainer } from "./SwitchContainer";
import { Container } from "../Container";

const Garagem = () => {
  const [ledStatus, setLedStatus] = useState("OFF");
  const [bascularStatus, setBascularStatus] = useState("fechar");
  const [socialStatus, setSocialStatus] = useState("abrir");
  const [socialMessage, setSocialMessage] = useState("Aguardando atualização...");

  // Função para escutar mensagens do portão social
  useEffect(() => {
    // Função para processar mensagens recebidas
    const handleMessage = (message) => {
      if (message.destinationName === "smarthouseJLR/garagem/social") {
        setSocialMessage(message.payloadString);
      }
    };

    // Adiciona o listener
    const originalHandler = client.onMessageArrived;
    client.onMessageArrived = (message) => {
      // Mantém o handler original funcionando
      if (originalHandler) {
        originalHandler(message);
      }
      // Processa a mensagem para nosso componente
      handleMessage(message);
    };

    // Certifique-se que estamos inscritos no tópico
    if (client.isConnected && client.isConnected()) {
      client.subscribe("smarthouseJLR/garagem/social");
    }

    // Limpeza ao desmontar o componente
    return () => {
      client.onMessageArrived = originalHandler;
    };
  }, []);

  // Resto das funções existentes
  const mudarLed = () => {
    const novoLedStatus = ledStatus === "ON" ? "OFF" : "ON";
    setLedStatus(novoLedStatus);
    controlarGaragem("led", novoLedStatus);
  };
  
  const toggleBascular = () => {
    const novoBascStatus = bascularStatus === "fechar" ? "abrir" : "fechar";
    setBascularStatus(novoBascStatus);
    controlarGaragem("portaoBascular", novoBascStatus);
  }

  const toggleSocial = () => {
    controlarGaragem("portaoSocial", socialStatus);
  }

  return (
    
    <div className="container">
    <h1 className="bg-primary text-light mb-3">🏠 Garagem</h1>
    <div className="d-flex flex-row gap-3">
      <SwitchContainer
        className={`${ledStatus === "ON" ? "text-success" : "text-danger"}`}
        SwitchName={`${ledStatus === "ON" ? "Desligar" : "Ligar"}`}
        Status={ledStatus}
        OnClick={mudarLed}
        ContainerName="Luz da Garagem"
        buttonClass={`${ledStatus === "ON" ? "btn-danger" : "btn-success"}`}
      />

      <SwitchContainer 
        buttonClass={"w-100 btn-primary"}
        SwitchName={`Operar Portão`}
        OnClick={() => toggleSocial()}
        ContainerName="Portão Social"
        Status={socialMessage}  // Exibe a mensagem recebida do MQTT
      />

      <SwitchContainer
        className={`${bascularStatus === "abrir" ? "text-success" : "text-danger"}`}
        SwitchName={`${bascularStatus === "fechar" ? "Abrir" : "Fechar"}`}
        Status={bascularStatus == "fechar" ? "Fechado" : "Aberto"}
        OnClick={() => toggleBascular()}
        ContainerName="Portão Bascular"
        buttonClass={`${bascularStatus === "abrir" ? "btn-danger" : "btn-success"}`}
      />

      <Container />
    </div>
    </div>
  );
};

export default Garagem;