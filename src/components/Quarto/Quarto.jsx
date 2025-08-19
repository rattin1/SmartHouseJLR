import React, { useState } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Quarto.module.css";

function ToggleButton({ label, offEmoji, onEmoji, initial = false, extraClass = "" }) {
  const [on, setOn] = useState(initial);

  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={`toggle-btn btn btn-light text-black shadow-sm border-0 ${extraClass} px-4 py-3 d-flex align-items-center gap-2 ${on ? "is-on" : "is-off"}`}
    >
      <span>{on ? onEmoji : offEmoji}</span>
      <span className="fw-semibold">{label}</span>
    </button>
  );
}

export default function Quarto({ isDark = true }) {
  const [curtainPos, setCurtainPos] = useState("aberto");

  const widthMap = {
    aberto: 20,
    meio: 70,
    fechado: 100
  };

  const wrapperSkin = isDark ? "bg-dark text-light" : "bg-white text-dark border";

  return (
    <div className={`d-flex flex-column align-items-center justify-content-center min-vh-100 p-4 rounded ${wrapperSkin}`}>
      <div className="text-center mb-4">
        <h1 className="fw-bold">🛏️ Quarto</h1>
        <h4 className="fw-light">Controle de Luz e Tomada</h4>
        <hr />
      </div>

      <div className="d-flex gap-2 mb-2">
        <ToggleButton label="Luz" offEmoji="🌑" onEmoji="🔆" extraClass="rounded-4" />
        <ToggleButton label="Tomada" offEmoji="🔌" onEmoji="⚡️" extraClass="rounded-4" />
      </div>

      <div className="d-flex gap-2 mb-4">
        <button onClick={() => setCurtainPos("aberto")} className={`btn ${isDark ? "btn-light" : "btn-outline-dark"} rounded-4 px-4 py-3`}>⬅️ Abrir</button>
        <button onClick={() => setCurtainPos("meio")} className={`btn ${isDark ? "btn-light" : "btn-outline-dark"} rounded-4 px-4 py-3`}>⏸️ Parar</button>
        <button onClick={() => setCurtainPos("fechado")} className={`btn ${isDark ? "btn-light" : "btn-outline-dark"} rounded-4 px-4 py-3`}>➡️ Fechar</button>
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
          transition={{ duration: 0.4, ease: "easeInOut" }}
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
  );
}
