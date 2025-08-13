import React, { useState, useEffect, useRef } from 'react'

export const Container = (props) => {
  const [movimento, setMovimento] = useState("Nenhum movimento");
  const timeoutRef = useRef(null);

  // Function to monitor and update the movimento element
  useEffect(() => {
    // Create a MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          const newValue = mutation.target.textContent || mutation.target.innerText;
          
          if (newValue && newValue !== "Nenhum movimento") {
            setMovimento(newValue);
            
            // Clear any existing timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            
            // Set new timeout to reset the message after 5 seconds
            timeoutRef.current = setTimeout(() => {
              setMovimento("Nenhum movimento");
              document.getElementById("movimento").innerText = "Nenhum movimento";
            }, 5000);
          }
        }
      });
    });

    // Start observing the movimento element
    const movimentoElement = document.getElementById("movimento");
    if (movimentoElement) {
      observer.observe(movimentoElement, { 
        characterData: true, 
        childList: true,
        subtree: true 
      });
    }

    // Clean up function
    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="d-flex flex-column bg-dark text-light px-3 py-3 rounded-4 align-items-center bg-opacity-75 h-auto">
      <div className="d-flex flex-row gap-3 align-items-center">
        <i className="bi bi-person-walking fs-3"></i>
        <span className="text-info fw-bold fs-5">Detecção de Movimento</span>
      </div>
      <span className="small text-secondary align-self-start my-3 text-opacity-75">
        Status atual:
        <p id='movimento' className={`fs-4 fw-bolder ${props.className}`}>
          {movimento}
        </p>
        Ultima movimentação: 15:45
      </span>
    </div>
  )
}