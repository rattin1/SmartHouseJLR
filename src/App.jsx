import React, { useState } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import './App.css';

function ToggleButton({ label, offEmoji, onEmoji, initial = false, extraClass = '' }) {
  const [on, setOn] = useState(initial);

  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={`toggle-btn btn btn-light text-black shadow-sm border-0 ${extraClass} px-4 py-3 d-flex align-items-center gap-2 ${on ? 'is-on' : 'is-off'}`}

    >
      <span>{on ? onEmoji : offEmoji}</span>
      <span className="fw-semibold">{label}</span>
    </button>
  );
}

export default function App() {

  const [curtainPos, setCurtainPos] = useState("aberto");

  // Mapeando largura do SVG para cada estado
  const widthMap = {
    aberto: 20,   // cortina encolhida no canto
    meio: 70,     // cortina no meio
    fechado: 100  // cortina totalmente fechada
  };


  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-dark text-light p-4">
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

        <button onClick={() => setCurtainPos("aberto")} className="btn btn-light rounded-4 px-4 py-3">⬅️ Abrir</button>
        <button onClick={() => setCurtainPos("meio")} className="btn btn-light rounded-4 px-4 py-3">⏸️ Parar</button>
        <button onClick={() => setCurtainPos("fechado")} className="btn btn-light rounded-4 px-4 py-3">➡️ Fechar</button>
      </div>

      <svg viewBox="0 0 100 60" width="300" height="180">
        {/* Barra da cortina */}
        <rect x="0" y="0" width="100" height="2" fill="#3a3a3ad4" rx="2" />

        {/* Cortina */}
        <rect
          className="curtain"
          x="0"
          y="2"
          width={widthMap[curtainPos]}
          height="55"
          fill="url(#curtainPattern)"
        />

        {/* Gradiente para simular pregas */}
        <defs>
          <linearGradient id="curtainPattern" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#310080" />
            <stop offset="100%" stopColor="#840196" />
            <stop offset="100%" stopColor="#840196" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
