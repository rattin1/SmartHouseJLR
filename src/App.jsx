import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import Garagem from "./Garagem";
import Tuchart from './components/TUchart/Tuchart';
import LogChat from './components/LogChat/LogChat';

function App() {


  return (
    <div>
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
      <Tuchart/>
      </div>
      <div className="text-dark  d-flex flex-column gap-3 py-3 align-items-center">
        <Garagem />
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
  )
}

export default App;
