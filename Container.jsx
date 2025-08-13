import React from 'react'

export const Container = (props) => {
  return (
    <div className="d-flex flex-column bg-dark text-light px-3 py-3 rounded-4 align-items-center bg-opacity-75 h-auto">
    <div className="d-flex flex-row gap-3 align-items-center">
     <i className="bi bi-person-walking fs-3"></i>
    <span className="text-info fw-bold fs-5">Detecção de Movimento</span>
    </div>
   <span className="small text-secondary align-self-start my-3 text-opacity-75">
     Status atual:
     <p  className={`fs-4 fw-bolder  ${props.className}`}>Nenhum movimento</p>
     Ultima movimentação: 15:45
   </span>
 </div>
  )
}
