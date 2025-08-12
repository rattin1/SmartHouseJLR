# 🏠 Projeto de Automação Residencial – Wokwi & MQTT

## 📌 1. Introdução
Este projeto implementa uma **automação residencial simulada** no ambiente **Wokwi**, utilizando um **ESP32** como unidade de controle.  
O sistema gerencia **três ambientes distintos**:

- **Quarto** – iluminação, tomada e cortina com motor de passo.  
- **Sala** – sensor de temperatura e umidade (DHT22), LED, ar-condicionado e umidificador.  
- **Garagem** – iluminação, portão basculante e portão social (servos), e sensor de movimento PIR.

A comunicação entre dispositivos e interface de controle é realizada via **protocolo MQTT**, utilizando o **broker público**: broker.hivemq.com


---

## 📡 2. Endpoints MQTT

| Ambiente | Tópico MQTT | Operação | Função | Payload Aceito | Exemplo |
|----------|-------------|----------|--------|----------------|---------|
| Quarto | `smarthouseJLR/quarto/luz` | Subscrição | Liga/desliga luz do quarto | `"ON"`, `"OFF"` | `ON` |
| Quarto | `smarthouseJLR/quarto/tomada` | Subscrição | Liga/desliga tomada do quarto | `"ON"`, `"OFF"` | `OFF` |
| Quarto | `smarthouseJLR/quarto/cortina` | Subscrição | Controla motor da cortina | `"ABRIR"`, `"FECHAR"`, `"PARAR"` | `ABRIR` |
| Sala | `smarthouseJLR/sala/lerSensor` | Publicação | Envia dados de temperatura e umidade em JSON | JSON `{ "temperatura": x.x, "umidade": y.y }` | `{ "temperatura": 27.5, "umidade": 65.0 }` |
| Sala | `smarthouseJLR/sala/led1` | Subscrição | Liga/desliga LED vermelho | `"ON"`, `"OFF"` | `ON` |
| Sala | `smarthouseJLR/sala/arCondicionado` | Subscrição | Controle e automação do ar-condicionado | `"AUTO_ON"`, `"AUTO_OFF"`, `"ON"`, `"OFF"` | `AUTO_ON` |
| Sala | `smarthouseJLR/sala/umidificador` | Subscrição | Controle e automação do umidificador | `"AUTO_ON"`, `"AUTO_OFF"`, `"ON"`, `"OFF"` | `OFF` |
| Garagem | `smarthouseJLR/garagem/led` | Subscrição | Liga/desliga luz da garagem | `"ON"`, `"OFF"` | `ON` |
| Garagem | `smarthouseJLR/garagem/bascular` | Subscrição | Controle do portão basculante | `"abrir"`, `"fechar"` | `abrir` |
| Garagem | `smarthouseJLR/garagem/social` | Subscrição | Abre portão social e fecha automaticamente | `"abrir"` | `abrir` |
| Garagem | `garagemJLR/garagem` | Publicação | Envia alerta de movimento detectado | Texto livre | `Movimento detectado!` |

---

## 🛠 3. Guia de Uso dos Endpoints

### 🔹 Quarto
- **Ligar luz**: `"ON"` → `smarthouseJLR/quarto/luz`
- **Desligar luz**: `"OFF"` → `smarthouseJLR/quarto/luz`
- **Ligar tomada**: `"ON"` → `smarthouseJLR/quarto/tomada`
- **Desligar tomada**: `"OFF"` → `smarthouseJLR/quarto/tomada`
- **Abrir cortina**: `"ABRIR"` → `smarthouseJLR/quarto/cortina`
- **Fechar cortina**: `"FECHAR"` → `smarthouseJLR/quarto/cortina`
- **Parar cortina**: `"PARAR"` → `smarthouseJLR/quarto/cortina`

### 🔹 Sala
- **Ligar LED vermelho**: `"ON"` → `smarthouseJLR/sala/led1`
- **Desligar LED vermelho**: `"OFF"` → `smarthouseJLR/sala/led1`
- **Ativar automação AC**: `"AUTO_ON"` → `smarthouseJLR/sala/arCondicionado`
- **Desativar automação AC**: `"AUTO_OFF"` → `smarthouseJLR/sala/arCondicionado`
- **Controle manual AC** (quando automação OFF): `"ON"` / `"OFF"`
- **Ativar automação umidificador**: `"AUTO_ON"` → `smarthouseJLR/sala/umidificador`
- **Desativar automação umidificador**: `"AUTO_OFF"` → `smarthouseJLR/sala/umidificador`
- **Controle manual umidificador** (quando automação OFF): `"ON"` / `"OFF"`
- **Ler sensores**: assinar `smarthouseJLR/sala/lerSensor`

### 🔹 Garagem
- **Ligar luz**: `"ON"` → `smarthouseJLR/garagem/led`
- **Desligar luz**: `"OFF"` → `smarthouseJLR/garagem/led`
- **Abrir portão basculante**: `"abrir"` → `smarthouseJLR/garagem/bascular`
- **Fechar portão basculante**: `"fechar"` → `smarthouseJLR/garagem/bascular`
- **Abrir portão social**: `"abrir"` → `smarthouseJLR/garagem/social` (fecha após 5s)
- **Movimento detectado**: assinar `garagemJLR/garagem`

---

## 🔌 4. Esquema de Ligação Elétrica

| Componente | Pino ESP32 | Observação |
|------------|-----------|------------|
| DHT22 | GPIO 18 | Sensor de temperatura/umidade |
| PIR (sensorMov) | GPIO 23 | Sensor de movimento |
| LED garagem | GPIO 16 | Saída digital |
| Luz quarto | GPIO 13 | Saída digital |
| Tomada quarto | GPIO 12 | Saída digital |
| LED sala (vermelho) | GPIO 2 | Saída digital |
| Ar-condicionado | GPIO 4 | Saída digital |
| Umidificador | GPIO 5 | Saída digital |
| Motor de passo – Step | GPIO 26 | Pulso |
| Motor de passo – Dir | GPIO 27 | Direção |
| Servo portão basculante | GPIO 17 | Servo motor |
| Servo portão social | GPIO 22 | Servo motor |

> 💡 **Notas:**
> - Alimentação simulada no Wokwi (5V virtual).
> - Em um protótipo real, motores e servos devem ter fonte dedicada.
> - Pode ser necessário resistor de pull-up/down em entradas digitais.

---

## 🏗 5. Funcionalidades por Ambiente

### 🛏 Quarto
- Controle MQTT de luz e tomada.
- Motor de passo para cortina (não-bloqueante).
- Comandos: `"ABRIR"`, `"FECHAR"`, `"PARAR"`.

### 🛋 Sala
- Publica temperatura/umidade em JSON a cada 2s.
- LED vermelho controlado via MQTT.
- **Automação**:
  - **AC**: Liga ≥ 28°C, desliga ≤ 20°C.
  - **Umidificador**: Liga ≤ 20% UR, desliga ≥ 80% UR.
- Modo manual disponível.

### 🚗 Garagem
- Luz via MQTT ou PIR.
- Portão basculante com servo.
- Portão social abre e fecha automaticamente após 5s.
- Alerta MQTT em movimento detectado.

---

## 🔗 6. Link Público Wokwi
[🔗 Projeto no Wokwi](https://wokwi.com/projects/438565034123503617)

