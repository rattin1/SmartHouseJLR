import React, { useState } from "react";
import { controlarGaragem} from "./utils/mqtt";
import { SwitchContainer } from "./SwitchContainer";
import { Container } from "../Container";

const Garagem = () => {
  const [ledStatus, setLedStatus] = useState("OFF");
  const [bascularStatus, setBascularStatus] = useState("fechar");
  const [socialStatus, setSocialStatus] = useState("Fechado");
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

const abrirSocial = () => {

    
}


  

  return (
    <div className="d-flex flex-row gap-3">
      <SwitchContainer
      className={`${ledStatus === "ON" ? "text-success" : "text-danger"}` }
      SwitchName={`${ledStatus === "ON" ? "Desligar" : "Ligar"}`}
      Status={ledStatus}
      OnClick={mudarLed}
      ContainerName="Luz da Garagem"
      buttonClass={`${ledStatus === "ON" ? "btn-danger" : "btn-success"}`}
      />

     <SwitchContainer
      className={`${bascularStatus === "abrir" ? "text-success" : "text-danger"}` }
      SwitchName={`${bascularStatus === "fechar" ? "Abrir" : "Fechar"}`}
      Status={ bascularStatus == "fechar" ? "Fechado" : "Aberto"}
      OnClick={() => toggleBascular()}
      ContainerName="Portão Bascular"
    buttonClass={`${bascularStatus === "abrir" ? "btn-danger" : "btn-success"}`}
      />

     <Container />
    </div>
  );
};

export default Garagem;

