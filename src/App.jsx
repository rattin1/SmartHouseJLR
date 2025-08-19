import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import Garagem from "./Garagem";


function App() {

  

  return (
    <div>
      <div className="menu-container container">
      </div>
    
    <div className="text-dark d-flex flex-column gap-3 py-3">
        <Garagem />
      </div>
      
    </div>
  );
  }

export default App;
