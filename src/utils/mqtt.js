import { Client } from 'paho-mqtt';
const brokerUrl = "wss://broker.hivemq.com:8884/mqtt";

// 📡 Tópicos MQTT utilizados no projeto Smart House JLR

// Quarto
const topicoLuz = "smarthouseJLR/quarto/luz";
const topicoTomada = "smarthouseJLR/quarto/tomada";
const topicoCortina = "smarthouseJLR/quarto/cortina";

// Sala
const topicoSensor = "smarthouseJLR/sala/lerSensor";
const topicoLed = "smarthouseJLR/sala/led1";
const topicoArCondicionado = "smarthouseJLR/sala/arCondicionado";
const topicoUmidificador = "smarthouseJLR/sala/umidificador";

// Garagem
const topicoGaragemLed = "smarthouseJLR/garagem/led";
const topicoGaragemBascular = "smarthouseJLR/garagem/bascular";
const topicoGaragemSocial = "smarthouseJLR/garagem/social";

// Gera um ID único para o cliente evita conflitos de ID
const clientID = "webClient_" + Math.floor(Math.random() * 10000);

// Cria um cliente MQTT
const client = new Client(brokerUrl, clientID);

// Define uma função automaticamente quando a conexão é perdida
client.onConnectionLost = (responseObject) => {
    console.error("Conexão perdida:", responseObject.errorMessage);
}

// 📥 Define função chamada automaticamente quando uma mensagem chega
client.onMessageArrived = (message) => {
    console.log("📥 Mensagem recebida:", message.destinationName, message.payloadString);

    // Verifica se a mensagem recebida é do tópico de leitura do sensor
    if (message.destinationName === topicoSensor) {
        try {
            // Converte a string JSON recebida em um objeto JavaScript
            const dados = JSON.parse(message.payloadString);

            // Atualiza elementos HTML com os valores de temperatura e umidade
            document.getElementById("temperatura").innerText = dados.temperatura;
            document.getElementById("umidade").innerText = dados.umidade;

        } catch (e) {
            // Exibe erro se o JSON estiver malformado
            console.error("❌ Erro ao parsear JSON:", e);
        }
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
        
        console.log("📡 Inscrito nos tópicos de monitoramento");
    },

    // ❌ Se falhar ao conectar, exibe mensagem de erro
    onFailure: (err) => {
        console.error("❌ Falha na conexão:", err);
    }
});

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
    const message = new Client.Message(estado);

    // Define para qual tópico essa mensagem será enviada
    message.destinationName = topico;

    // Envia a mensagem ao broker
    client.send(message);

    // Log no console indicando que a mensagem foi enviada
    console.log(`📤 Enviado para ${topico}: ${estado}`);
}

export {
    controlarQuarto,
    controlarSala,
    controlarGaragem,
    enviarComando
};