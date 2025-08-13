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
import styles from './Tuchart.module.css'; // 🆕 ADICIONE ESTA LINHA

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Tuchart = () => {
  const [sensorData, setSensorData] = useState([]);
  const [timeFilter, setTimeFilter] = useState('24h');
  const [currentData, setCurrentData] = useState({ temperatura: 0, umidade: 0 });
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false, hasData: false });

  // 💾 Função para salvar dados no localStorage
  const saveDataToLocalStorage = (data) => {
    try {
      const existingData = JSON.parse(localStorage.getItem('sensorData') || '[]');
      const newData = [...existingData, data];
      
      // Remove dados mais antigos que 7 dias
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const filteredData = newData.filter(item => new Date(item.timestamp) >= sevenDaysAgo);
      
      localStorage.setItem('sensorData', JSON.stringify(filteredData));
      
      // 🆕 SALVA TAMBÉM O ÚLTIMO VALOR PARA ACESSO RÁPIDO
      localStorage.setItem('lastSensorData', JSON.stringify(data));
      
      console.log('💾 Dados salvos no localStorage:', data);
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
    }
  };

  // 📖 Função para carregar dados do localStorage
  const loadDataFromLocalStorage = () => {
    try {
      const storedData = localStorage.getItem('sensorData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // Converte timestamps de string para Date
        const dataWithDates = parsedData.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));

        // Remove dados mais antigos que 7 dias na inicialização
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const validData = dataWithDates.filter(item => item.timestamp >= sevenDaysAgo);
        
        // Atualiza localStorage se alguns dados foram removidos
        if (validData.length !== parsedData.length) {
          localStorage.setItem('sensorData', JSON.stringify(validData));
          console.log(`🗑️ Removidos ${parsedData.length - validData.length} registros antigos`);
        }

        setSensorData(validData);
        console.log(`📖 Carregados ${validData.length} registros do localStorage`);

        // 🆕 CARREGA O ÚLTIMO VALOR SALVO PARA OS DISPLAYS
        return validData.length > 0 ? validData[validData.length - 1] : null;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar do localStorage:', error);
      setSensorData([]);
    }
    return null;
  };

  // 🆕 Função para carregar último valor conhecido
  const loadLastKnownValue = () => {
    try {
      // Primeiro tenta pegar do localStorage direto
      const lastValue = localStorage.getItem('lastSensorData');
      if (lastValue) {
        const parsed = JSON.parse(lastValue);
        console.log('📊 Último valor carregado do localStorage:', parsed);
        return {
          temperatura: parseFloat(parsed.temperatura),
          umidade: parseFloat(parsed.umidade),
          timestamp: new Date(parsed.timestamp)
        };
      }

      // Se não tem, pega do array de dados
      const storedData = localStorage.getItem('sensorData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.length > 0) {
          const lastItem = parsedData[parsedData.length - 1];
          console.log('📊 Último valor carregado do array:', lastItem);
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

  // 🧹 Função para limpeza automática de dados antigos
  const cleanupOldData = () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      setSensorData(prev => {
        const filteredData = prev.filter(item => item.timestamp >= sevenDaysAgo);
        
        // Atualiza localStorage se houve mudanças
        if (filteredData.length !== prev.length) {
          localStorage.setItem('sensorData', JSON.stringify(filteredData));
          console.log(`🗑️ Limpeza automática: removidos ${prev.length - filteredData.length} registros antigos`);
        }
        
        return filteredData;
      });
    } catch (error) {
      console.error('❌ Erro na limpeza automática:', error);
    }
  };

  // 📊 Função para obter estatísticas dos dados salvos
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
    // Carrega dados do localStorage na inicialização
    loadDataFromLocalStorage();

    // 🆕 CARREGA O ÚLTIMO VALOR CONHECIDO PRIMEIRO
    const lastKnownValue = loadLastKnownValue();
    setCurrentData(lastKnownValue);
    console.log('🔄 Valores iniciais definidos:', lastKnownValue);

    // Tenta obter dados atuais do sensor MQTT (pode estar vazio)
    const mqttData = getCurrentSensorData();
    if (mqttData.temperatura !== 0 || mqttData.umidade !== 0) {
      setCurrentData(mqttData);
      console.log("📡 Dados MQTT disponíveis:", mqttData);
    }

    // Se inscreve para receber novos dados do sensor
    const unsubscribe = subscribeSensorData((newData) => {
      console.log('🆕 Novos dados recebidos:', newData);
      setCurrentData(newData);
      saveDataToLocalStorage(newData);
      
      setSensorData(prev => {
        const newDataArray = [...prev, newData];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return newDataArray.filter(item => item.timestamp >= sevenDaysAgo);
      });
    });

    // Verifica status da conexão a cada 2 segundos
    const statusInterval = setInterval(() => {
      setConnectionStatus(getConnectionStatus());
    }, 2000);

    // Configura limpeza automática a cada hora
    const cleanupInterval = setInterval(cleanupOldData, 60 * 60 * 1000);

    // Cleanup
    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
      clearInterval(statusInterval);
    };
  }, []);

  // Filtrar dados baseado no período selecionado
  const getFilteredData = () => {
    const now = new Date();
    let startTime;
  
    switch (timeFilter) {
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'yesterday': {
        // Início do dia anterior (00:00:00)
        const yesterdayStart = new Date(now);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        
        // Fim do dia anterior (23:59:59)
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

  // Preparar dados para o gráfico
  const chartData = {
    labels: getFilteredData().map(item => 
      timeFilter === '7days' 
        ? item.timestamp.toLocaleDateString('pt-BR') + ' ' + item.timestamp.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
        : item.timestamp.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
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
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Monitoramento de Temperatura e Umidade - ${
          timeFilter === '24h' ? 'Últimas 24 horas' :
          timeFilter === 'yesterday' ? 'Ontem' :
          'Últimos 7 dias'
        }`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const filteredData = getFilteredData();
  const storageStats = getStorageStats();

  return (
    <div className="container ms-1 p-4 border rounded shadow-sm">
      <h2 className='text-light container bg-dark p-4 rounded rounded-2'>📊 Gráfico de Temperatura e Umidade</h2>
      
      {/* Status da conexão */}
      <div className={`mb-3 p-2 rounded border ${connectionStatus.isConnected ? 'bg-success bg-opacity-10 border-success' : 'bg-warning bg-opacity-10 border-warning'}`}>
        <div className="d-flex justify-content-between align-items-center">
          <span>
            {connectionStatus.isConnected ? (
              <><strong>🟢 MQTT Conectado</strong> - Recebendo dados em tempo real</>
            ) : (
              <><strong>🟡 MQTT Desconectado</strong> - Tentando reconectar... {(currentData.temperatura !== 0 || currentData.umidade !== 0) ? '(Exibindo últimos dados conhecidos)' : ''}</>
            )}
          </span>
        </div>
      </div>
      
      {/* Dados em tempo real */}
      <div className="d-flex gap-4 mb-4 p-3 bg-light rounded justify-content-center">
        <div className='p-2 rounded border border-2 border-danger ' style={{  
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          opacity: connectionStatus.isConnected ? 1 : 0.8
        }}>
          <h4 className='TempTxt'>🌡️ Temperatura</h4>
          <p className='m-0 fs-1 fw-bold'>
            {currentData.temperatura}°C
          </p>
          {!connectionStatus.isConnected && currentData.temperatura !== 0 && (
            <small className="text-muted">⏰ Último valor salvo</small>
          )}
        </div>
        
        <div className='p-2 rounded border border-2 border-primary' style={{ 
          backgroundColor: 'rgba(53, 162, 235, 0.1)',
          opacity: connectionStatus.isConnected ? 1 : 0.8
        }}>
          <h4 className="Humidtxt" >💧 Umidade</h4>
          <p className='m-0 fs-1 fw-bold'>
            {currentData.umidade}%
          </p>
          {!connectionStatus.isConnected && currentData.umidade !== 0 && (
            <small className="text-muted">⏰ Último valor salvo</small>
          )}
        </div>
      </div>

      {/* Informações de armazenamento */}
      <div className="mb-3 p-2 bg-info bg-opacity-10 rounded border border-info">
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

      {/* Filtro de período */}
      <div className="mb-3">
        <label htmlFor="timeFilter" className="me-2 fw-bold">
          Período:
        </label>
        <select 
          id="timeFilter"
          value={timeFilter} 
          onChange={(e) => setTimeFilter(e.target.value)}
          className="px-3 py-2 rounded border fs-6 border-secondary"
          
        >
          <option value="24h">Últimas 24 horas</option>
          <option value="yesterday">Ontem</option>
          <option value="7days">Últimos 7 dias</option>
        </select>
      </div>

      {/* Gráfico */}
      <div className={`mb-4 ${styles.tamanhoGrafico}`}>
        {filteredData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="h-100 d-flex align-items-center justify-content-center bg-light rounded border border-2 border-secondary">
            <p className='fs-5 text-muted'>
              📈 Aguardando dados para o período selecionado...
            </p>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {filteredData.length > 0 && (
        <div className="p-3 bg-light rounded border">
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