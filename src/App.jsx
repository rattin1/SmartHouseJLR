import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "bootstrap-icons/font/bootstrap-icons.css";

function App() {

  const ledStatus = "desligada"; // This can be dynamically set based on your application logic
  return (
    <>
      <div className="container text-light bg-dark p-3 rounded-3 shadow border border-danger d-flex gap-3 flex-column">
        <div className="d-flex flex-row justify-content-between">
          <h1>Garagem</h1>
          <div className="d-flex flex-column">
            <span className="text-info fw-bold"> LUZ DA GARAGEM</span>
            <span className="small text-opacity-50"> Status atual: <p className={`${ ledStatus == "ligada" ? "text-success" : "text-danger"  }`}>{ledStatus}</p></span>
          </div>



        </div>
      </div>
    </>
  );
}

export default App;
