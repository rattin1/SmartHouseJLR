import React, { useState } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Quarto.module.css";
import { controlarQuarto } from "../../utils/mqtt";

export default function Quarto({ isDark = true }) {
  const [curtainPos, setCurtainPos] = useState("aberto");

  // estados para luz e tomada (ON / OFF)
  const [ledStatus, setLedStatus] = useState("OFF");
  const [tomadaStatus, setTomadaStatus] = useState("OFF");

  const widthMap = {
    aberto: 20,
    meio: 70,
    fechado: 100
  };

  const pararCortina = () => {
    setCurtainPos("meio");
    controlarQuarto("cortina", "PARAR");
    console.log("PAROOOOU! Cortina parada!");
  };

  const abrirCortina = () => {
    setCurtainPos("aberto");
    controlarQuarto("cortina", "ABRIR");
    console.log("Abrindo cortina... 🌅");
  };

  const fecharCortina = () => {
    setCurtainPos("fechado");
    controlarQuarto("cortina", "FECHAR");
    console.log("Fechando cortina... 🌙");
  };

  // Alterna luz (led) e envia MQTT para o tópico do quarto
  const toggleLuz = (novoValorBool) => {
    const novoEstado = novoValorBool ? "ON" : "OFF";
    setLedStatus(novoEstado);
    controlarQuarto("luz", novoEstado);
    console.log(`Luz: ${novoEstado}`);
  };

  // Alterna tomada e envia MQTT para o tópico do quarto
  const toggleTomada = (novoValorBool) => {
    const novoEstado = novoValorBool ? "ON" : "OFF";
    setTomadaStatus(novoEstado);
    controlarQuarto("tomada", novoEstado);
    console.log(`Tomada: ${novoEstado}`);
  };

  // Componente botão toggle (agora aceita onToggle callback)
  function ToggleButton({
    label,
    offEmoji,
    onEmoji,
    initial = false,
    extraClass = "",
    onToggle // função (novoEstadoBool) => {}
  }) {
    const [on, setOn] = useState(initial);

    const handleClick = () => {
      const novo = !on;
      setOn(novo);
      try {
        if (typeof onToggle === "function") onToggle(novo);
      } catch (e) {
        console.error("Erro no onToggle:", e);
      }
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`toggle-btn btn btn-dark bg-opacity-75 rounded-4 px-4 py-3 text-info fw-bold fs-5 shadow-sm border-0 d-flex align-items-center gap-2 ${extraClass} ${on ? "is-on" : "is-off"}`}
        aria-pressed={on}
      >
        <span style={{ fontSize: "1.4rem" }}>{on ? onEmoji : offEmoji}</span>
        <span className="fw-semibold">{label}</span>
      </button>
    );
  }

  return (
    <div className="p-2 border rounded-end shadow-sm h-100 text-light">
      <div className="d-flex flex-column align-items-center justify-content-center p-4">
        <div className="text-center mb-4">
          <h1 className="fw-bold bg-primary w-100 rounded-2 p-3 mb-4">🛏️ Quarto</h1>
          <h4 className="fw-light">Controle de Luz e Tomada</h4>
          <hr />
        </div>

        <div className="d-flex gap-2 mb-2">
          {/* inicializa o botão com base no estado atual (ON -> true) e passa o handler */}
          <ToggleButton
            label="Luz"
            offEmoji="🌑"
            onEmoji="🔆"
            initial={ledStatus === "ON"}
            extraClass="rounded-4"
            onToggle={toggleLuz}
          />
          <ToggleButton
            label="Tomada"
            offEmoji="🔌"
            onEmoji="⚡️"
            initial={tomadaStatus === "ON"}
            extraClass="rounded-4"
            onToggle={toggleTomada}
          />
        </div>

        <div className="d-flex gap-2 mb-4">
          <button onClick={abrirCortina} className="btn btn-dark bg-opacity-75 rounded-4 px-4 py-3 text-info fw-bold fs-5">⬅️ Abrir</button>
          <button onClick={pararCortina} className="btn btn-dark bg-opacity-75 rounded-4 px-4 py-3 text-info fw-bold fs-5">⏸️ Parar</button>
          <button onClick={fecharCortina} className="btn btn-dark bg-opacity-75 rounded-4 px-4 py-3 text-info fw-bold fs-5">➡️ Fechar</button>
        </div>

        <svg viewBox="0 0 100 60" width="300" height="180">
          {/* Barra da cortina */}
          <rect x="0" y="0" width="100" height="2" fill={isDark ? "#3a3a3ad4" : "#ced4da"} rx="2" />

          {/* Cortina animada */}
          <motion.rect
            className="curtain"
            x="0"
            y="2"
            height="55"
            fill="url(#curtainPattern)"
            animate={{
              width: widthMap[curtainPos],
              skewX: curtainPos === "aberto" ? 0 : curtainPos === "meio" ? -3 : -6,
              rotate: curtainPos === "aberto" ? 0 : curtainPos === "meio" ? 0.5 : 1
            }}
            transition={{
              duration: 0.4,
              ease: "easeInOut"
            }}
          />

          {/* Gradiente para pregas */}
          <defs>
            <linearGradient id="curtainPattern" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4b0082" />
              <stop offset="20%" stopColor="#5d0096" />
              <stop offset="40%" stopColor="#4b0082" />
              <stop offset="60%" stopColor="#5d0096" />
              <stop offset="80%" stopColor="#4b0082" />
              <stop offset="100%" stopColor="#5d0096" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
