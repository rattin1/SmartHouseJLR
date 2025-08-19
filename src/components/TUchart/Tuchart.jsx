import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { subscribeSensorData, getCurrentSensorData, getConnectionStatus } from '../../utils/mqtt.js';
import styles from './Tuchart.module.css'; // mantém como estava

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Tuchart = ({ isDark = true }) => {
  const [sensorData, setSensorData] = useState([]);
  const [timeFilter, setTimeFilter] = useState('24h');
  const [currentData, setCurrentData] = useState({ temperatura: 0, umidade: 0 });
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false, hasData: false });

  // 💾 salvar no localStorage
  const saveDataToLocalStorage = (data) => {
    try {
      const existingData = JSON.parse(localStorage.getItem('sensorData') || '[]');
      const newData = [...existingData, data];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const filteredData = newData.filter(item => new Date(item.timestamp) >= sevenDaysAgo);
      localStorage.setItem('sensorData', JSON.stringify(filteredData));
      localStorage.setItem('lastSensorData', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
    }
  };

  const loadDataFromLocalStorage = () => {
    try {
      const storedData = localStorage.getItem('sensorData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const dataWithDates = parsedData.map(item => ({ ...item, timestamp: new Date(item.timestamp) }));
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const validData = dataWithDates.filter(item => item.timestamp >= sevenDaysAgo);
        if (validData.length !== parsedData.length) {
          localStorage.setItem('sensorData', JSON.stringify(validData));
        }
        setSensorData(validData);
        return validData.length > 0 ? validData[validData.length - 1] : null;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar do localStorage:', error);
      setSensorData([]);
    }
    return null;
  };

  const loadLastKnownValue = () => {
    try {
      const lastValue = localStorage.getItem('lastSensorData');
      if (lastValue) {
        const parsed = JSON.parse(lastValue);
        return {
          temperatura: parseFloat(parsed.temperatura),
          umidade: parseFloat(parsed.umidade),
          timestamp: new Date(parsed.timestamp)
        };
      }
      const storedData = localStorage.getItem('sensorData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.length > 0) {
          const lastItem = parsedData[parsedData.length - 1];
          return {
            temperatura: parseFloat(lastItem.temperatura),
            umidade: parseFloat(lastItem.umidade),
            timestamp: new Date(lastItem.timestamp)
          };
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar último valor:', error);
    }
    return { temperatura: 0, umidade: 0 };
  };

  const cleanupOldData = () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      setSensorData(prev => {
        const filteredData = prev.filter(item => item.timestamp >= sevenDaysAgo);
        if (filteredData.length !== prev.length) {
          localStorage.setItem('sensorData', JSON.stringify(filteredData));
        }
        return filteredData;
      });
    } catch (error) {
      console.error('❌ Erro na limpeza automática:', error);
    }
  };

  const getStorageStats = () => {
    const totalRecords = sensorData.length;
    const storageSize = new Blob([localStorage.getItem('sensorData') || '']).size;
    const oldestRecord = sensorData.length > 0 ? new Date(Math.min(...sensorData.map(d => d.timestamp))) : null;
    return {
      totalRecords,
      storageSize: `${(storageSize / 1024).toFixed(2)} KB`,
      oldestRecord: oldestRecord ? oldestRecord.toLocaleString('pt-BR') : 'Nenhum'
    };
  };

  useEffect(() => {
    loadDataFromLocalStorage();
    const lastKnownValue = loadLastKnownValue();
    setCurrentData(lastKnownValue);

    const mqttData = getCurrentSensorData();
    if (mqttData.temperatura !== 0 || mqttData.umidade !== 0) {
      setCurrentData(mqttData);
    }

    const unsubscribe = subscribeSensorData((newData) => {
      setCurrentData(newData);
      saveDataToLocalStorage(newData);
      setSensorData(prev => {
        const newDataArray = [...prev, newData];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return newDataArray.filter(item => item.timestamp >= sevenDaysAgo);
      });
    });

    const statusInterval = setInterval(() => {
      setConnectionStatus(getConnectionStatus());
    }, 2000);

    const cleanupInterval = setInterval(cleanupOldData, 60 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
      clearInterval(statusInterval);
    };
  }, []);

  const getFilteredData = () => {
    const now = new Date();
    let startTime;

    switch (timeFilter) {
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'yesterday': {
        const yesterdayStart = new Date(now);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(now);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);
        return sensorData.filter(item =>
          item.timestamp >= yesterdayStart && item.timestamp <= yesterdayEnd
        );
      }
      case '7days':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    return sensorData.filter(item => item.timestamp >= startTime);
  };

  const chartData = {
    labels: getFilteredData().map(item =>
      timeFilter === '7days'
        ? item.timestamp.toLocaleDateString('pt-BR') + ' ' + item.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : item.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    ),
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: getFilteredData().map(item => item.temperatura),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        fill: false,
      },
      {
        label: 'Umidade (%)',
        data: getFilteredData().map(item => item.umidade),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
        tension: 0.1,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: `Monitoramento de Temperatura e Umidade - ${
          timeFilter === '24h' ? 'Últimas 24 horas' :
          timeFilter === 'yesterday' ? 'Ontem' : 'Últimos 7 dias'
        }`,
      },
    },
    scales: { y: { beginAtZero: true } },
  };

  const filteredData = getFilteredData();
  const storageStats = getStorageStats();

  // classes temáticas simples
  const panel = isDark ? "glass-dark text-light" : "card-light text-dark";
  const borderState = (ok) =>
    `rounded border ${ok ? (isDark ? "border-success" : "border-success") : (isDark ? "border-warning" : "border-warning")} ${isDark ? "bg-opacity-10" : ""}`;

  return (
    <div className={`container my-4 p-2 rounded shadow-sm ${panel}`}>
      <h2 className={`container p-4 rounded-2 ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
        📊 Gráfico de Temperatura e Umidade
      </h2>

      {/* Status da conexão */}
      <div className={`mb-3 p-2 ${borderState(connectionStatus.isConnected)}`}>
        <div className="d-flex justify-content-between align-items-center">
          <span className={isDark ? "text-light" : "text-dark"}>
            {connectionStatus.isConnected ? (
              <><strong>🟢 MQTT Conectado</strong> - Recebendo dados em tempo real</>
            ) : (
              <><strong>🟡 MQTT Desconectado</strong> - Tentando reconectar... {(currentData.temperatura !== 0 || currentData.umidade !== 0) ? '(Exibindo últimos dados conhecidos)' : ''}</>
            )}
          </span>
        </div>
      </div>

      {/* Dados em tempo real */}
      <div className={`d-flex gap-4 mb-4 p-3 rounded justify-content-center ${isDark ? "bg-dark bg-opacity-75 text-light" : "bg-light text-dark border"}`}>
        <div
          className={`p-2 rounded border border-2 ${isDark ? "text-light" : "text-dark"} border-danger`}
          style={{ backgroundColor: 'rgba(255, 99, 132, 0.1)', opacity: connectionStatus.isConnected ? 1 : 0.8 }}
        >
          <h4 className='TempTxt'>🌡️ Temperatura</h4>
          <p className='m-0 fs-1 fw-bold'>{currentData.temperatura}°C</p>
          {!connectionStatus.isConnected && currentData.temperatura !== 0 && (
            <small className="text-muted">⏰ Último valor salvo</small>
          )}
        </div>

        <div
          className={`p-2 rounded border border-2 ${isDark ? "text-light" : "text-dark"} border-primary`}
          style={{ backgroundColor: 'rgba(53, 162, 235, 0.1)', opacity: connectionStatus.isConnected ? 1 : 0.8 }}
        >
          <h4 className="Humidtxt">💧 Umidade</h4>
          <p className='m-0 fs-1 fw-bold'>{currentData.umidade}%</p>
          {!connectionStatus.isConnected && currentData.umidade !== 0 && (
            <small className="text-muted">⏰ Último valor salvo</small>
          )}
        </div>
      </div>

      {/* Informações de armazenamento */}
      <div className={`mb-3 p-2 rounded ${isDark ? "bg-info bg-opacity-10 border border-info text-light" : "bg-light border text-dark"}`}>
        <h6 className="mb-2">💾 Informações de Armazenamento Local</h6>
        <div className="row">
          <div className="col-md-4">
            <small><strong>📊 Total de Registros:</strong> {storageStats.totalRecords}</small>
          </div>
          <div className="col-md-4">
            <small><strong>📦 Tamanho:</strong> {storageStats.storageSize}</small>
          </div>
          <div className="col-md-4">
            <small><strong>📅 Registro Mais Antigo:</strong> {storageStats.oldestRecord}</small>
          </div>
        </div>
      </div>

      {/* Filtro */}
      <div className="mb-3">
        <label htmlFor="timeFilter" className="me-2 fw-bold">Período:</label>
        <select
          id="timeFilter"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className={`px-3 py-2 rounded border fs-6 ${isDark ? "border-secondary bg-transparent text-light" : "border-secondary bg-white text-dark"}`}
        >
          <option className='text-dark' value="24h">Últimas 24 horas</option>
          <option className='text-dark' value="yesterday">Ontem</option>
          <option className='text-dark' value="7days">Últimos 7 dias</option>
        </select>
      </div>

      {/* Gráfico */}
      <div className={`mb-4 ${styles.tamanhoGrafico}`}>
        {filteredData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className={`h-100 d-flex align-items-center justify-content-center rounded border border-2 ${isDark ? "bg-secondary border-secondary" : "bg-light border-secondary"}`}>
            <p className='fs-5 text-muted'>📈 Aguardando dados para o período selecionado...</p>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {filteredData.length > 0 && (
        <div className={`p-3 rounded border ${isDark ? "bg-dark bg-opacity-75 text-light" : "bg-light text-dark"}`}>
          <h4 className='mt-0'>📊 Estatísticas do Período</h4>
          <div className={`d-grid gap-3 ${styles.colunasPeriodo}`}>
            <div>
              <strong>🌡️ Temperatura:</strong>
              <p>Média: {(filteredData.reduce((acc, item) => acc + item.temperatura, 0) / filteredData.length).toFixed(1)}°C</p>
              <p>Máxima: {Math.max(...filteredData.map(item => item.temperatura)).toFixed(1)}°C</p>
              <p>Mínima: {Math.min(...filteredData.map(item => item.temperatura)).toFixed(1)}°C</p>
            </div>
            <div>
              <strong>💧 Umidade:</strong>
              <p>Média: {(filteredData.reduce((acc, item) => acc + item.umidade, 0) / filteredData.length).toFixed(1)}%</p>
              <p>Máxima: {Math.max(...filteredData.map(item => item.umidade)).toFixed(1)}%</p>
              <p>Mínima: {Math.min(...filteredData.map(item => item.umidade)).toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-3">
            <strong>📈 Dados:</strong>
            <p>Total de Leituras: {filteredData.length}</p>
            <p>Período: {timeFilter === '24h' ? '24h' : timeFilter === 'yesterday' ? 'Ontem' : '7 dias'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tuchart;
