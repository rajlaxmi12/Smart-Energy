import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Activity, Zap, ShieldAlert, Clock, DollarSign, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [currentStats, setCurrentStats] = useState({ 
    actual: 0, predicted: 0, voltage: 0, is_anomaly: false, cost_hour: 0 
  });
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/energy');
    socket.onopen = () => setStatus('Live');
    
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      
      setCurrentStats({
        actual: payload.actual.toFixed(2),
        predicted: payload.predicted.toFixed(2),
        voltage: payload.voltage.toFixed(1),
        is_anomaly: payload.is_anomaly,
        cost_hour: payload.cost_hour
      });

      setData(prevData => {
        const newData = [...prevData, {
          time: payload.timestamp.split(' ')[1], 
          actual: payload.actual,
          predicted: payload.predicted
        }];
        return newData.slice(-20);
      });
    };

    socket.onclose = () => setStatus('Disconnected');
    return () => socket.close();
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-700 ${currentStats.is_anomaly ? 'bg-red-950' : 'bg-slate-900'} text-white p-8 font-sans`}>
      
      {/* Anomaly Alert Banner */}
      {currentStats.is_anomaly && (
        <div className="bg-red-600 text-white p-4 rounded-xl mb-6 flex items-center justify-between animate-pulse shadow-lg border-2 border-red-400">
          <div className="flex items-center gap-3">
            <ShieldAlert size={28} />
            <div>
              <p className="font-bold text-lg">Unusual Energy Spike Detected!</p>
              <p className="text-sm opacity-90">Usage has deviated significantly from LSTM predictions.</p>
            </div>
          </div>
          <button className="bg-white text-red-600 px-4 py-1 rounded-md font-bold text-sm">DISMISS</button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-400 tracking-tight">Smart Energy EMS <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded ml-2">PRO v2.0</span></h1>
          <p className="text-slate-400 flex items-center gap-2 mt-1">
            <span className={`h-3 w-3 rounded-full ${status === 'Live' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
            System Status: {status}
          </p>
        </div>
        <div className="flex items-center gap-6">
            <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold">Est. Hourly Cost</p>
                <p className="text-2xl font-mono text-green-400">${currentStats.cost_hour}</p>
            </div>
            <Zap size={40} className={currentStats.is_anomaly ? "text-red-500" : "text-yellow-400"} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-all">
          <div className="flex items-center gap-4 text-slate-400 mb-2"><Activity size={20}/> Current Usage</div>
          <div className="text-3xl font-mono text-blue-300">{currentStats.actual} <span className="text-sm">kW</span></div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-purple-500 transition-all">
          <div className="flex items-center gap-4 text-slate-400 mb-2"><TrendingUp size={20}/> LSTM Forecast</div>
          <div className="text-3xl font-mono text-purple-400">{currentStats.predicted} <span className="text-sm">kW</span></div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-green-500 transition-all">
          <div className="flex items-center gap-4 text-slate-400 mb-2"><DollarSign size={20}/> Efficiency Index</div>
          <div className="text-3xl font-mono text-green-400">{currentStats.predicted > 0 ? ((currentStats.predicted / currentStats.actual) * 100).toFixed(0) : 100}%</div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-yellow-500 transition-all">
          <div className="flex items-center gap-4 text-slate-400 mb-2"><ShieldAlert size={20}/> Line Voltage</div>
          <div className="text-3xl font-mono text-yellow-500">{currentStats.voltage} <span className="text-sm">V</span></div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-[450px] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Live Predictive Analysis</h2>
            <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> Actual</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-full border-dashed border-2"></span> Forecast</span>
            </div>
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={10} />
            <Tooltip 
              contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px'}}
            />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#3b82f6" 
              strokeWidth={4} 
              dot={currentStats.is_anomaly} 
              name="Actual (kW)" 
              animationDuration={300}
            />
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke="#a855f7" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              dot={false} 
              name="Predicted (kW)" 
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;