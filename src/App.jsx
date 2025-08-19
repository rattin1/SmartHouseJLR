import React, { useEffect, useState } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "bootstrap-icons/font/bootstrap-icons.css";

import Garagem from "./Garagem";
import Tuchart from "./components/TUchart/Tuchart";
import LogChat from "./components/LogChat/LogChat";
import Quarto from "./components/Quarto/Quarto";
import SalaDeEstar from "./components/SalaDeEstar/SalaDeEstar";

function App() {
  // tema escuro por padrão (como já estava)
  const [isDark, setIsDark] = useState(true);

  // aplica o tema no <html> e no <body> pra conseguirmos usar variáveis do Bootstrap
  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-bs-theme", theme);
    document.body.classList.toggle("dark-mode", isDark);
    document.body.classList.toggle("light-mode", !isDark);
  }, [isDark]);

  const headerClasses = isDark
    ? "bg-dark bg-opacity-75"
    : "bg-light border-bottom";

  const titleClasses = isDark ? "text-light" : "text-dark";

  return (
    <div>
      <header className={`${headerClasses} p-4 vw-100`}>
        <div className="d-flex justify-content-between align-items-center">
          <h1 className={`${titleClasses} m-0`}>SMARTHOUSEJLR</h1>

          <div className="d-flex align-items-center">
            {/* Botão de alternância de tema */}
            <button
              type="button"
              onClick={() => setIsDark((v) => !v)}
              className={`btn btn-sm me-3 ${isDark ? "btn-outline-light" : "btn-outline-dark"}`}
              aria-label="Alternar tema claro/escuro"
              title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              {isDark ? <i className="bi bi-brightness-high-fill" /> : <i className="bi bi-moon-stars-fill" />}
            </button>

            {/* Botão existente de abrir log */}
            <button
              className="btn bg-primary text-light btn-sm"
              data-bs-toggle="modal"
              data-bs-target="#LogModal"
            >
              📝 Abrir log de mensagens
            </button>
          </div>
        </div>
      </header>
    <header className='bg-dark bg-opacity-75 p-4 vw-100'>
  <div className='d-flex justify-content-between align-items-center'>
    <h1 className='text-light m-0'>SMARTHOUSEJLR</h1>
    <button
      className="btn bg-primary text-light btn-sm me-3"
      data-bs-toggle="modal"
      data-bs-target="#LogModal"
    >
      📝 Abrir log de mensagens
    </button>
  </div>
</header>
<div className="d-flex flex-column gap-3 py-3 align-items-center">
      <Tuchart  isDark={isDark}/>
      </div>
      <div className="container-fluid px-4">
  <div className="d-flex flex-column flex-md-row gap-0"> {/* Adicione gap-0 */}
    {/* Sala de Estar - largura específica */}
    <div className="col-12 col-md-8">
      <SalaDeEstar  isDark={isDark} />
    </div>
    
    {/* Quarto - ocupa espaço restante */}
    <div className="col-12 col-md-4">
      <Quarto  isDark={isDark} />
    </div>
  </div>
</div>
      <div className="text-dark  d-flex flex-column gap-3 py-3 align-items-center">
        <Garagem   isDark={isDark}/>
      </div>
      {/* Modal do LogChat */}
      <div
        className="modal fade"
        id="LogModal"
        tabIndex="-1"
        aria-labelledby="LogModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <LogChat />
          </div>
        </div>
      </div>
    </div>
  );
  }

export default App;
