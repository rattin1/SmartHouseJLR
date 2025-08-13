import './App.css';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import Tuchart from './components/TUchart/Tuchart';
import LogChat from './components/LogChat/LogChat';

function App() {


  return (
    <div>
      <header className='bg-dark bg-opacity-75 p-2 w-100'>
        <h1 className='text-light text-start'>SMARTHOUSEJLR</h1>
        <button
          className="btn bg-primary text-light btn-sm text-end"
          data-bs-toggle="modal"
          data-bs-target="#LogModal"
        >
          📝 Abrir log de mensagens
        </button>
      </header>
      
      <Tuchart/>

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

export default App
