import React from "react";

export const SwitchContainer = (props) => {
  return (
    <div className="d-flex flex-column bg-dark text-light px-3 py-3 rounded-4 align-items-center bg-opacity-75">
       <div className="d-flex flex-row gap-3 align-items-center">
        <i className="bi bi-door-closed-fill"></i>
       <span className="text-info fw-bold fs-5">{props.ContainerName}</span>
       </div>
      <span className="small text-secondary align-self-start my-3 text-opacity-75">
        Status atual:
        <p  className={`fs-4 fw-bolder  ${props.className}`}>{props.Status}</p>
      </span>
      <button
        className={`btn btn-sm w-50 ${props.buttonClass} p-1`}
        onClick={props.OnClick}
      >
        {props.SwitchName}
      </button>
    </div>
  );
};
