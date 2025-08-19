import { Client, Message } from 'paho-mqtt';

const brokerUrl = "broker.hivemq.com";
const port = 8884;
const path = "/mqtt";

// 📡 Tópicos MQTT utilizados no projeto Smart House JLR



// Quarto
const movimento = "";
const topicoLuz = "smarthouseJLR/quarto/luz";
const topicoTomada = "smarthouseJLR/quarto/tomada";
const topicoCortina = "smarthouseJLR/quarto/cortina";

// Sala
const topicoSensor = "smarthouseJLR/sala/lerSensor";
const topicoLed = "smarthouseJLR/sala/led1";
const topicoArCondicionado = "smarthouseJLR/sala/arCondicionado";
const topicoUmidificador = "smarthouseJLR/sala/umidificador";
const topicoStatusSala = "smarthouseJLR/sala/status";

// Garagem
const topicoGaragem = "smarthouseJLR/garagem";
const topicoGaragemLed = "smarthouseJLR/garagem/led";
const topicoGaragemBascular = "smarthouseJLR/garagem/bascular";
const topicoGaragemSocial = "smarthouseJLR/garagem/social";

// Gera um ID único para o cliente evita conflitos de ID
let clientID = "webClient_" + Math.floor(Math.random() * 10000);

// Cria um cliente MQTT
let client = null;

// 📊 Armazenamento de dados do sensor para compartilhar com componentes
let sensorDataCallbacks = [];
let currentSensorData = { temperatura: 0, umidade: 0 };
let isConnected = false;
let reconnectInterval = null;

// 🆕 Sistema de log de mensagens MQTT
let messageLogCallbacks = [];
let messageHistory = [];

// 🆕 Sistema de status dos dispositivos
let deviceStatusCallbacks = [];
let currentDeviceStatus = {
  sala: {
    led: "OFF",
    arCondicionado: "OFF",
    umidificador: "OFF",
    autoAr: "OFF",
    autoUmidificador: "OFF"
  }
};

// 🆕 Função para componentes se inscreverem no log de mensagens
const subscribeMessageLog = (callback) => {
    messageLogCallbacks.push(callback);
    console.log("📋 Componente inscrito para receber log de mensagens");
    
    // Envia histórico existente para o novo componente
    if (messageHistory.length > 0) {
        callback(messageHistory);
    }
    
    return () => {
        messageLogCallbacks = messageLogCallbacks.filter(cb => cb !== callback);
    };
};

// 🆕 Função para obter histórico de mensagens
const getMessageHistory = () => messageHistory;

// 🆕 Função para adicionar mensagem ao log
const addToMessageLog = (topic, payload, type = 'received') => {
    const now = new Date();
    const hour = now.getHours().toString().padStart(2, "0");
    const minute = now.getMinutes().toString().padStart(2, "0");
    const time = `${hour}:${minute}`;
    
    const logEntry = {
        id: Date.now() + Math.random(), // ID único
        author: topic, // Tópico como autor
        text: payload, // Conteúdo da mensagem
        time: time,
        type: type, // 'received' ou 'sent'
        timestamp: now
    };
    
    // Adiciona ao histórico (máximo 100 mensagens)
    messageHistory.push(logEntry);
    if (messageHistory.length > 100) {
        messageHistory = messageHistory.slice(-100);
    }
    
    // Notifica todos os componentes inscritos
    messageLogCallbacks.forEach(callback => {
        try {
            callback([...messageHistory]); // Cópia do array
        } catch (error) {
            console.error("❌ Erro ao notificar log de mensagens:", error);
        }
    });
    
    console.log(`📝 Log adicionado: [${type}] ${topic}: ${payload}`);
};

// 🆕 Função para componentes se inscreverem no status dos dispositivos
const subscribeDeviceStatus = (callback) => {
    deviceStatusCallbacks.push(callback);
    console.log("📋 Componente inscrito para receber status dos dispositivos");
    
    // Envia status atual imediatamente
    callback(currentDeviceStatus);
    
    return () => {
        deviceStatusCallbacks = deviceStatusCallbacks.filter(cb => cb !== callback);
    };
};

// 🆕 Função para obter status atual dos dispositivos
const getCurrentDeviceStatus = () => currentDeviceStatus;

// 🆕 Função para atualizar status dos dispositivos
const updateDeviceStatus = (room, device, status) => {
    if (currentDeviceStatus[room]) {
        currentDeviceStatus[room][device] = status;
        
        // Notifica todos os componentes inscritos
        deviceStatusCallbacks.forEach(callback => {
            try {
                callback({ ...currentDeviceStatus });
            } catch (error) {
                console.error("❌ Erro ao notificar status de dispositivo:", error);
            }
        });
        
        console.log(`📊 Status atualizado: ${room}.${device} = ${status}`);
    }
};

// Função para componentes se inscreverem para receber dados
const subscribeSensorData = (callback) => {
    sensorDataCallbacks.push(callback);
    console.log("📋 Componente inscrito para receber dados do sensor");
    
    // Se já temos dados, envia imediatamente
    if (currentSensorData.temperatura !== 0 || currentSensorData.umidade !== 0) {
        callback(currentSensorData);
    }
    
    return () => {
        sensorDataCallbacks = sensorDataCallbacks.filter(cb => cb !== callback);
    };
};

// Função para obter dados atuais
const getCurrentSensorData = () => currentSensorData;

// Função para verificar se está conectado
const isClientConnected = () => {
    return client && client.isConnected && client.isConnected();
};

// Função para configurar callbacks
function setupCallbacks() {
    if (!client) return;

    // Define uma função automaticamente quando a conexão é perdida
    client.onConnectionLost = (responseObject) => {
        isConnected = false;
        console.error("❌ Conexão MQTT perdida:", responseObject.errorMessage);
        console.log("🔄 Iniciando processo de reconexão...");
        
        // Adiciona ao log
        addToMessageLog("SISTEMA", "Conexão MQTT perdida", "system");
        
        // Inicia tentativas de reconexão
        if (!reconnectInterval) {
            reconnectInterval = setInterval(attemptReconnect, 3000);
        }
    };

    // 📥 Define função chamada automaticamente quando uma mensagem chega
    client.onMessageArrived = (message) => {
        console.log("📥 Mensagem recebida:", message.destinationName, message.payloadString);

        // 🆕 Adiciona TODAS as mensagens ao log
        addToMessageLog(message.destinationName, message.payloadString, "received");

        // Processa dados do sensor especificamente
        if (message.destinationName === topicoSensor) {
            try {
                const dados = JSON.parse(message.payloadString);
                
                // Atualiza dados atuais
                currentSensorData = {
                    temperatura: parseFloat(dados.temperatura),
                    umidade: parseFloat(dados.umidade),
                    timestamp: new Date()
                };

                console.log("🔄 Dados atualizados:", currentSensorData);

                // Notifica todos os componentes inscritos
                sensorDataCallbacks.forEach(callback => {
                    try {
                        callback(currentSensorData);
                        console.log("📡 Dados enviados para componente");
                    } catch (error) {
                        console.error("❌ Erro ao notificar componente:", error);
                    }
                });

        } catch (e) {
            // Exibe erro se o JSON estiver malformado
            console.error("❌ Erro ao parsear JSON:", e);
        }
    } else if (message.destinationName === topicoGaragem){
        movimento = message.payloadString; // Atualiza a variável movimento com o valor recebido
        document.getElementById("movimento").innerText = movimento;

    }
};

// 🔗 Conecta o cliente ao broker MQTT com SSL ativado
client.connect({
    useSSL: true, // obrigatório para conexões WSS (WebSocket Secure)

    // ✅ Se conectar com sucesso, mostra mensagem e se inscreve nos tópicos
    onSuccess: () => {
        console.log("✅ Conectado ao broker MQTT");
        
        // Inscreve-se nos tópicos para receber dados
        client.subscribe(topicoSensor); // dados do sensor DHT22
        client.subscribe(topicoGaragem) // dados do sensor de movimento DIR.
        
        console.log("📡 Inscrito nos tópicos de monitoramento");
    },

    // ❌ Se falhar ao conectar, exibe mensagem de erro
    onFailure: (err) => {
        console.error("❌ Falha na conexão:", err);
    }
});
            } catch (e) {
                console.error("❌ Erro ao parsear JSON:", e);
            }
        }

        // 🆕 Processa status dos dispositivos da sala
        if (message.destinationName === topicoStatusSala) {
            try {
                const status = JSON.parse(message.payloadString);
                
                // Atualiza status dos dispositivos
                if (status.led !== undefined) {
                    updateDeviceStatus("sala", "led", status.led);
                }
                if (status.arCondicionado !== undefined) {
                    updateDeviceStatus("sala", "arCondicionado", status.arCondicionado);
                }
                if (status.umidificador !== undefined) {
                    updateDeviceStatus("sala", "umidificador", status.umidificador);
                }
                if (status.autoAr !== undefined) {
                    updateDeviceStatus("sala", "autoAr", status.autoAr);
                }
                if (status.autoUmidificador !== undefined) {
                    updateDeviceStatus("sala", "autoUmidificador", status.autoUmidificador);
                }

                console.log("📊 Status da sala atualizado:", status);

            } catch (e) {
                console.error("❌ Erro ao parsear status JSON:", e);
            }
        }
    };
}

// Função para tentar reconectar
function attemptReconnect() {
    if (isConnected) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
        return;
    }

    console.log("🔄 Tentando reconectar...");
    
    // Cria novo cliente
    clientID = "webClient_" + Math.floor(Math.random() * 10000);
    client = new Client(brokerUrl, port, path, clientID);
    
    setupCallbacks();
    
    client.connect({
        useSSL: true,
        timeout: 10,
        keepAliveInterval: 30,
        onSuccess: () => {
            isConnected = true;
            console.log("✅ Reconectado ao MQTT");
            
            // Adiciona ao log
            addToMessageLog("SISTEMA", "Reconectado ao MQTT", "system");
            
            // Para o intervalo de reconexão
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
            
            // Reinscreve nos tópicos
            client.subscribe(topicoSensor, {
                onSuccess: () => console.log("📡 Reinscrito no tópico sensor"),
                onFailure: (err) => console.error("❌ Falha ao se reinscrever no sensor:", err)
            });

            // 🆕 Se inscreve no tópico de status da sala
            client.subscribe(topicoStatusSala, {
                onSuccess: () => console.log("📡 Inscrito no tópico de status da sala"),
                onFailure: (err) => console.error("❌ Falha ao se inscrever no status:", err)
            });
        },
        onFailure: (err) => {
            isConnected = false;
            console.error("❌ Falha na reconexão:", err);
        }
    });
}

// 🔗 Função de inicialização
function initMQTT() {
    console.log("🚀 Inicializando MQTT...");
    
    client = new Client(brokerUrl, port, path, clientID);
    setupCallbacks();
    
    client.connect({
        useSSL: true,
        timeout: 10,
        keepAliveInterval: 30,
        onSuccess: () => {
            isConnected = true;
            console.log("✅ Conectado ao broker MQTT");
            
            // Adiciona ao log
            addToMessageLog("SISTEMA", "Conectado ao broker MQTT", "system");
            
            // Se inscreve no tópico do sensor
            client.subscribe(topicoSensor, {
                onSuccess: () => console.log("📡 Inscrito no tópico sensor"),
                onFailure: (err) => console.error("❌ Falha ao se inscrever no sensor:", err)
            });

            // 🆕 Se inscreve no tópico de status da sala
            client.subscribe(topicoStatusSala, {
                onSuccess: () => console.log("📡 Inscrito no tópico de status da sala"),
                onFailure: (err) => console.error("❌ Falha ao se inscrever no status:", err)
            });
        },
        onFailure: (err) => {
            isConnected = false;
            console.error("❌ Falha na conexão inicial:", err);
            // Inicia tentativas de reconexão
            if (!reconnectInterval) {
                reconnectInterval = setInterval(attemptReconnect, 3000);
            }
        }
    });
}

// 💡 Função para controlar dispositivos do quarto
function controlarQuarto(dispositivo, estado) {
    let topico;
    
    switch(dispositivo) {
        case "luz":
            topico = topicoLuz;
            break;
        case "tomada":
            topico = topicoTomada;
            break;
        case "cortina":
            topico = topicoCortina;
            break;
        default:
            console.error("Dispositivo do quarto inválido");
            return;
    }

    enviarComando(topico, estado);
}

// 🏠 Função para controlar dispositivos da sala
function controlarSala(dispositivo, estado) {
    let topico;
    
    switch(dispositivo) {
        case "led":
            topico = topicoLed;
            break;
        case "arCondicionado":
            topico = topicoArCondicionado;
            break;
        case "umidificador":
            topico = topicoUmidificador;
            break;
        default:
            console.error("Dispositivo da sala inválido");
            return;
    }

    enviarComando(topico, estado);
}

// 🚗 Função para controlar dispositivos da garagem
function controlarGaragem(dispositivo, estado) {
    let topico;
    
    switch(dispositivo) {
        case "led":
            topico = topicoGaragemLed;
            break;
        case "portaoBascular":
            topico = topicoGaragemBascular;
            break;
        case "portaoSocial":
            topico = topicoGaragemSocial;
            break;
        default:
            console.error("Dispositivo da garagem inválido");
            return;
    }

    enviarComando(topico, estado);
}

// 📤 Função genérica para enviar comandos via MQTT
function enviarComando(topico, estado) {
    // Cria a mensagem MQTT com o estado desejado
    if (!isClientConnected()) {
        console.warn("⚠️ Cliente não conectado. Comando será perdido:", topico, estado);
        addToMessageLog("SISTEMA", `Comando perdido - desconectado: ${topico} -> ${estado}`, "error");
        return;
    }

    try {
        const message = new Message(estado);
        message.destinationName = topico;
        client.send(message);
        
        // 🆕 Adiciona comando enviado ao log
        addToMessageLog(topico, estado, "sent");
        
        console.log(`📤 Enviado para ${topico}: ${estado}`);
    } catch (error) {
        console.error("❌ Erro ao enviar comando:", error);
        addToMessageLog("SISTEMA", `Erro ao enviar: ${topico} -> ${estado}`, "error");
    }
}

// Função para obter status da conexão
const getConnectionStatus = () => ({
    isConnected,
    hasData: currentSensorData.temperatura !== 0 || currentSensorData.umidade !== 0
});

// 🚀 Inicializa automaticamente quando o módulo é carregado
initMQTT();

// Exporta todas as funções
export {
    controlarQuarto,
    controlarSala,
    controlarGaragem,
    enviarComando,
    client
    enviarComando,
    subscribeSensorData,
    getCurrentSensorData,
    getConnectionStatus,
    subscribeMessageLog,
    getMessageHistory,
    subscribeDeviceStatus,
    getCurrentDeviceStatus
};

