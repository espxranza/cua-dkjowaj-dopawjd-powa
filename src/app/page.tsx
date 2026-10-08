"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// Types
interface SensorData {
  temperature: number;
  humidity: number;
  pressure: number;
  windKmh: number;
  uv: number;
  timestamp: Date;
}

interface Device {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: boolean;
  type: "toggle" | "slider";
  value?: number;
  min?: number;
  max?: number;
  unit?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

// Chart Component
function MiniChart({ data, color, min, max }: { data: number[]; color: string; min: number; max: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);
    
    ctx.clearRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    
    data.forEach((value, i) => {
      const x = (width / (data.length - 1)) * i;
      const y = height - ((value - min) / (max - min)) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color.replace(")", ", 0.15)").replace("rgb", "rgba"));
    gradient.addColorStop(1, color.replace(")", ", 0)").replace("rgb", "rgba"));
    ctx.fillStyle = gradient;
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  }, [data, color, min, max]);
  
  return <canvas ref={canvasRef} className="w-full h-24" />;
}

// Sensor Card
function SensorCard({ 
  label, 
  value, 
  unit, 
  icon, 
  color, 
  history, 
  min, 
  max,
  status = "normal"
}: { 
  label: string; 
  value: number; 
  unit: string; 
  icon: React.ReactNode; 
  color: string; 
  history: number[];
  min: number;
  max: number;
  status?: "normal" | "warning" | "danger";
}) {
  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-[${color}]/10 text-[${color}]`}>
            {icon}
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value.toFixed(1)}<span className="text-lg font-normal text-slate-500 dark:text-slate-400">{unit}</span></p>
          </div>
        </div>
        <span className={`badge ${status === "normal" ? "badge-success" : status === "warning" ? "badge-warning" : "badge-danger"}`}>
          {status === "normal" ? "Normal" : status === "warning" ? "Atenção" : "Crítico"}
        </span>
      </div>
      <MiniChart data={history} color={color} min={min} max={max} />
      <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
        <span>Mín: {min}{unit}</span>
        <span>Máx: {max}{unit}</span>
      </div>
    </div>
  );
}

// Device Control Card
function DeviceCard({ device, onToggle, onSliderChange }: { device: Device; onToggle: (id: string, status: boolean) => void; onSliderChange: (id: string, value: number) => void }) {
  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${device.status ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
            {device.icon}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{device.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{device.status ? "Ligado" : "Desligado"}</p>
          </div>
        </div>
        {device.type === "toggle" && (
          <button
            onClick={() => onToggle(device.id, !device.status)}
            className={`relative w-12 h-7 rounded-full transition-colors ${device.status ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-600"}`}
            aria-label={device.status ? "Desligar" : "Ligar"}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${device.status ? "translate-x-5" : ""}`} />
          </button>
        )}
      </div>
      {device.type === "slider" && device.value !== undefined && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>{device.min}{device.unit}</span>
            <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{device.value}{device.unit}</span>
            <span>{device.max}{device.unit}</span>
          </div>
          <input
            type="range"
            min={device.min?.toString() || "0"}
            max={device.max?.toString() || "100"}
            value={device.value.toString()}
            onChange={(e) => onSliderChange(device.id, Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none accent-sky-600"
          />
        </div>
      )}
    </div>
  );
}

// Chat Interface
function ChatInterface({ currentData, historyData }: { currentData: SensorData | null; historyData: SensorData[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", role: "assistant", content: "Olá! Sou o assistente da Estação Meteorológica. Como posso ajudar com os dados dos sensores ou controle dos dispositivos?", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    const lower = currentInput.toLowerCase();
    let response = "";

    if (!currentData) {
      response = "Ainda não recebi dados da estação. Verifique se o micro:bit central está conectado ao computador e se o programa Python está enviando as medições.";
    } else if (lower.includes("temperatura") || lower.includes("temp")) {
      response = `A temperatura atual é ${currentData.temperature.toFixed(1)} °C.`;
    } else if (lower.includes("umidade") || lower.includes("humid")) {
      response = `A umidade relativa atual é ${currentData.humidity.toFixed(1)}%.`;
    } else if (lower.includes("pressão") || lower.includes("pressao")) {
      response = `A pressão atmosférica local atual é ${currentData.pressure.toFixed(1)} hPa.`;
    } else if (lower.includes("vento") || lower.includes("velocidade")) {
      response = `A velocidade do vento registrada é ${currentData.windKmh.toFixed(1)} km/h.`;
    } else if (lower.includes("uv") || lower.includes("ultravioleta")) {
      response = `A leitura bruta do sensor UV é ${Math.round(currentData.uv)}. Essa leitura ainda é tratada como nível UV bruto, não como índice UV oficial calibrado.`;
    } else if (lower.includes("histórico") || lower.includes("historico") || lower.includes("gráfico") || lower.includes("grafico")) {
      response = `O banco possui ${historyData.length} medições carregadas para os gráficos.`;
    } else if (lower.includes("olá") || lower.includes("oi") || lower.includes("hello")) {
      response = "Olá! Estou conectado aos dados reais da estação. Pergunte sobre temperatura, umidade, pressão, vento ou UV.";
    } else {
      response = "Posso consultar os dados reais de temperatura, umidade, pressão, velocidade do vento e UV da estação.";
    }

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="card flex flex-col h-[500px] overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="p-1.5 rounded bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </span>
          Assistente IA
        </h3>
        <span className="badge badge-info">Demo Mode</span>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4" ref={chatContainerRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-sky-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-sky-600"}`}>
              {msg.role === "user" ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              )}
            </div>
            <div className={`max-w-[75%] ${msg.role === "user" ? "text-right" : ""}`}>
              <div className={`inline-block px-4 py-2 rounded-2xl ${msg.role === "user" ? "bg-sky-600 text-white rounded-tr-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm"}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              <p className={`text-xs text-slate-400 mt-1 ${msg.role === "user" ? "text-right" : ""}`}>
                {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-800 text-sky-600">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre sensores, dispositivos, históricos..."
            className="input flex-1"
            disabled={isLoading}
            aria-label="Mensagem para o assistente"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="btn-primary"
            aria-label="Enviar mensagem"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
        <p className="text-xs text-slate-400 text-center mt-2">
          O assistente consulta os dados reais armazenados no banco da estação.
        </p>
      </div>
    </div>
  );
}

// Main Dashboard
export default function WeatherDashboard() {
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [historyData, setHistoryData] = useState<SensorData[] | null>(null);
  const [devices, setDevices] = useState<Device[]>([
    { id: "led1", name: "LED Indicador", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, status: false, type: "toggle" },
    { id: "pump1", name: "Bomba Irrigação", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>, status: false, type: "toggle" },
    { id: "fan1", name: "Ventilador", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>, status: true, type: "toggle" },
    { id: "valve1", name: "Válvula Solenoide", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, status: false, type: "toggle" },
    { id: "dimmer1", name: "Dimmer LED", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, status: true, type: "slider", value: 65, min: 0, max: 100, unit: "%" },
    { id: "heater1", name: "Aquecedor", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>, status: false, type: "toggle" },
  ]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "devices" | "history" | "chat">("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [connected, setConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchSensorData = async () => {
    try {
      const response = await fetch("/api/sensors?limit=288", { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao buscar dados");
      const payload = await response.json();
      const history: SensorData[] = (payload.history || []).map((row: { created_at: string; temperature: number; humidity: number; pressure_hpa: number; wind_kmh: number; uv: number }) => ({
        temperature: Number(row.temperature),
        humidity: Number(row.humidity),
        pressure: Number(row.pressure_hpa),
        windKmh: Number(row.wind_kmh),
        uv: Number(row.uv),
        timestamp: new Date(row.created_at),
      }));

      if (history.length > 0) {
        setHistoryData(history);
        setCurrentData(history[history.length - 1]);
        setLastUpdate(new Date(history[history.length - 1].timestamp));
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Theme effect
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  const handleToggle = (id: string, status: boolean) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  };

  const handleSlider = (id: string, value: number) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, value } : d)));
  };

  // Extract history for charts
  const tempHistory = historyData?.map((d) => d.temperature) || [];
  const humHistory = historyData?.map((d) => d.humidity) || [];
  const pressHistory = historyData?.map((d) => d.pressure) || [];
  const windHistory = historyData?.map((d) => d.windKmh) || [];
  const uvHistory = historyData?.map((d) => d.uv) || [];

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id: "devices", label: "Dispositivos", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { id: "history", label: "Histórico", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { id: "chat", label: "Assistente", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
  ];

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] transition-colors duration-300">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-[rgb(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                <div className="p-2 rounded-lg bg-sky-600 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100 hidden sm:block">WeatherStation</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-1 bg-[rgb(var(--bg-tertiary))] p-1 rounded-lg">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"}`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[rgb(var(--bg-tertiary))]">
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse-soft" : "bg-rose-500"}`} />
                <span className="text-slate-700 dark:text-slate-300">{connected ? "Conectado" : "Desconectado"}</span>
              </div>

              {/* Last Update */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[rgb(var(--bg-tertiary))] text-slate-600 dark:text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{lastUpdate ? lastUpdate.toLocaleTimeString("pt-BR") : "Carregando..."}</span>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                className="p-2 rounded-lg bg-[rgb(var(--bg-tertiary))] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                aria-label={theme === "light" ? "Modo escuro" : "Modo claro"}
              >
                {theme === "light" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {activeTab === "dashboard" && "Visão geral em tempo real dos sensores da estação meteorológica"}
              {activeTab === "devices" && "Controle e monitoramento dos atuadores conectados"}
              {activeTab === "history" && "Histórico e tendências dos últimos 24 horas"}
              {activeTab === "chat" && "Assistente inteligente para análise de dados e controle por voz"}
            </p>
          </div>

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && currentData && (
            <div className="space-y-6 animate-fade-in">
              {/* Main Sensors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <SensorCard
                  label="Temperatura"
                  value={currentData.temperature}
                  unit="°C"
                  icon={<span>🌡️</span>}
                  color="rgb(239, 68, 68)"
                  history={tempHistory}
                  min={15}
                  max={35}
                  status={currentData.temperature > 35 ? "danger" : currentData.temperature > 30 ? "warning" : "normal"}
                />
                <SensorCard
                  label="Umidade Ar"
                  value={currentData.humidity}
                  unit="%"
                  icon={<span>💧</span>}
                  color="rgb(14, 165, 233)"
                  history={humHistory}
                  min={30}
                  max={90}
                  status={currentData.humidity > 80 || currentData.humidity < 30 ? "warning" : "normal"}
                />
                <SensorCard
                  label="Vento"
                  value={currentData.windKmh}
                  unit=" km/h"
                  icon={<span>💨</span>}
                  color="rgb(16, 185, 129)"
                  history={windHistory}
                  min={0}
                  max={60}
                  status={currentData.windKmh > 50 ? "danger" : currentData.windKmh > 30 ? "warning" : "normal"}
                />
                <SensorCard
                  label="Pressão"
                  value={currentData.pressure}
                  unit=" hPa"
                  icon={<span>🌬️</span>}
                  color="rgb(168, 85, 247)"
                  history={pressHistory}
                  min={850}
                  max={1050}
                  status="normal"
                />
                <SensorCard
                  label="UV bruto"
                  value={currentData.uv}
                  unit=""
                  icon={<span>☀️</span>}
                  color="rgb(234, 179, 8)"
                  history={uvHistory}
                  min={0}
                  max={1023}
                  status={currentData.uv > 700 ? "danger" : currentData.uv > 130 ? "warning" : "normal"}
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="#devices" onClick={(e) => { e.preventDefault(); setActiveTab("devices"); }} className="card p-5 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">Controlar Dispositivos</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{devices.filter(d => d.status).length} de {devices.length} ativos</p>
                    </div>
                  </div>
                </Link>
                <Link href="#history" onClick={(e) => { e.preventDefault(); setActiveTab("history"); }} className="card p-5 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">Ver Histórico Completo</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Últimas 24h em detalhes</p>
                    </div>
                  </div>
                </Link>
                <Link href="#chat" onClick={(e) => { e.preventDefault(); setActiveTab("chat"); }} className="card p-5 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">Perguntar à IA</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Análise e comandos por texto</p>
                    </div>
                  </div>
                </Link>
                <button className="card p-5 hover:shadow-lg transition-shadow flex items-center gap-4" onClick={fetchSensorData}>
                  <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Simular Novos Dados</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Gerar dados aleatórios para teste</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Devices Tab */}
          {activeTab === "devices" && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    onToggle={handleToggle}
                    onSliderChange={handleSlider}
                  />
                ))}
              </div>
              
              {/* Bulk Actions */}
              <div className="mt-6 card p-5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Ações Rápidas
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setDevices((prev) => prev.map((d) => ({ ...d, status: true })))} className="btn-success">
                    Ligar Todos
                  </button>
                  <button onClick={() => setDevices((prev) => prev.map((d) => ({ ...d, status: false })))} className="btn-danger">
                    Desligar Todos
                  </button>
                  <button onClick={() => setDevices((prev) => prev.map((d) => ({ ...d, value: 100 })))} className="btn-secondary">
                    Máxima Potência
                  </button>
                  <button onClick={() => setDevices((prev) => prev.map((d) => ({ ...d, value: 0 })))} className="btn-ghost">
                    Mínima Potência
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Large Temperature Chart */}
                <div className="card p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Temperatura - Últimas 24h</h3>
                    <div className="flex items-center gap-2">
                      <select className="input py-1.5 px-3 text-sm w-auto" defaultValue="24h">
                        <option value="1h">1 hora</option>
                        <option value="6h">6 horas</option>
                        <option value="24h" selected>24 horas</option>
                        <option value="7d">7 dias</option>
                      </select>
                      <button className="btn-secondary text-sm">Exportar CSV</button>
                    </div>
                  </div>
                  <div className="relative h-80 bg-grid rounded-lg">
                    <canvas id="tempChart" className="w-full h-full" />
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4 text-center">
                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{Math.max(...tempHistory).toFixed(1)}°C</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Máxima</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{Math.min(...tempHistory).toFixed(1)}°C</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Mínima</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{(tempHistory.reduce((a, b) => a + b, 0) / tempHistory.length).toFixed(1)}°C</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Média</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{(Math.max(...tempHistory) - Math.min(...tempHistory)).toFixed(1)}°C</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Amplitude</p>
                    </div>
                  </div>
                </div>

                {/* Multi-sensor small charts */}
                <div className="card p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Umidade do Ar</h3>
                  <MiniChart data={humHistory} color="rgb(14, 165, 233)" min={30} max={90} />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span>Mín: {Math.min(...humHistory).toFixed(0)}%</span>
                    <span>Máx: {Math.max(...humHistory).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Pressão Atmosférica</h3>
                  <MiniChart data={pressHistory} color="rgb(168, 85, 247)" min={990} max={1040} />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span>Mín: {Math.min(...pressHistory).toFixed(0)}hPa</span>
                    <span>Máx: {Math.max(...pressHistory).toFixed(0)}hPa</span>
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Velocidade do Vento</h3>
                  <MiniChart data={windHistory} color="rgb(16, 185, 129)" min={0} max={60} />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span>Mín: {Math.min(...windHistory).toFixed(1)} km/h</span>
                    <span>Máx: {Math.max(...windHistory).toFixed(1)} km/h</span>
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">UV bruto</h3>
                  <MiniChart data={uvHistory} color="rgb(234, 179, 8)" min={0} max={1023} />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span>Mín: {Math.min(...uvHistory).toFixed(0)}</span>
                    <span>Máx: {Math.max(...uvHistory).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div className="animate-fade-in">
              <ChatInterface currentData={currentData} historyData={historyData || []} />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40 glass border-t border-[rgb(var(--border))]">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${activeTab === tab.id ? "bg-white dark:bg-slate-800 text-sky-600" : "text-slate-500 dark:text-slate-400"}`}
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Chart.js initialization for large chart */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const ctx = document.getElementById('tempChart');
              if (ctx && !ctx.chartInitialized) {
                ctx.chartInitialized = true;
                const data = ${JSON.stringify(tempHistory)};
                const labels = Array.from({length: data.length}, (_, i) => {
                  const d = new Date(Date.now() - (data.length - i) * 5 * 60 * 1000);
                  return d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
                });
                
                new Chart(ctx, {
                  type: 'line',
                  data: {
                    labels: labels.filter((_, i) => i % 12 === 0),
                    datasets: [{
                      label: 'Temperatura (°C)',
                      data: data.filter((_, i) => i % 12 === 0),
                      borderColor: 'rgb(239, 68, 68)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      fill: true,
                      tension: 0.4,
                      pointRadius: 0,
                      pointHoverRadius: 4,
                      borderWidth: 2
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: 'index' },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false
                      }
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { maxTicksLimit: 8, color: '#94a3b8' } },
                      y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } }
                    }
                  }
                });
              }
            })();
          `,
        }}
      />
      
      {/* Load Chart.js from CDN */}
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" />
    </div>
  );
}
