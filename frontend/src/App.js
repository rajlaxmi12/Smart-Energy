import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Zap, ShieldAlert, DollarSign, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [currentStats, setCurrentStats] = useState({ 
    actual: 0, predicted: 0, voltage: 0, is_anomaly: false, cost_hour: 0 
  });
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    let socket;
    const connect = () => {
      // WSS protocol aur correct endpoint path zaroori hai
      socket = new WebSocket('wss://smart-energy-vwp2.onrender.com/ws/energy');
      
      socket.onopen = () => {
        console.log("Connected to Backend");
        setStatus('Live');
      };
      
      socket.onclose = () => {
        setStatus('Disconnected. Retrying...');
        setTimeout(connect, 3000); 
      };

      socket.onerror = (err) => {
        console.error("Socket Error:", err);
        socket.close();
      };

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        
        // Stats update
        setCurrentStats({
          actual: payload.actual,
          predicted: payload.predicted,
          voltage: payload.voltage,
          is_anomaly: payload.is_anomaly,
          cost_hour: payload.cost_hour
        });

        // Chart data update (Max 20 points)
        setData(prevData => {
          const newData = [...prevData, {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            actual: payload.actual,
            predicted: payload.predicted
          }];
          return newData.slice(-20); 
        });
      };
    };

    connect();
    return () => {
      if(socket) socket.close();
    };
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-700 ${currentStats.is_anomaly ? 'bg-red-950' : 'bg-slate-900'} text-white p-8 font-sans`}>
      
      {/* Anomaly Alert */}
      {currentStats.is_anomaly && (
        <div className="bg-red-600 text-white p-4 rounded-xl mb-6 flex items-center justify-between animate-pulse shadow-lg border-2 border-red-400">
          <div className="flex items-center gap-3">
            <ShieldAlert size={28} />
            <div>
              <p className="font-bold text-lg">Unusual Energy Spike Detected!</p>
              <p className="text-sm opacity-90">Usage has deviated significantly from predictions.</p>
            </div>
          </div>
          <button className="bg-white text-red-600 px-4 py-1 rounded-md font-bold text-sm" onClick={() => setCurrentStats(s => ({...s, is_anomaly: false}))}>DISMISS</button>
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
          <div className="text-3xl font-mono text-blue-300">{currentStats.actual?.toFixed(2)} <span className="text-sm">kW</span></div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-purple-500 transition-all">
          <div className="flex items-center gap-4 text-slate-400 mb-2"><TrendingUp size={20}/> LSTM Forecast</div>
          <div className="text-3xl font-mono text-purple-400">{currentStats.predicted?.toFixed(2)} <span className="text-sm">kW</span></div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-green-500 transition-all">
          <div className="flex items-center gap-4 text-slate-400 mb-2"><DollarSign size={20}/> Efficiency</div>
          <div className="text-3xl font-mono text-green-400">
            {currentStats.actual > 0 ? ((currentStats.predicted / currentStats.actual) * 100).toFixed(0) : 100}%
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-yellow-500 transition-all">
          <div className="flex items-center gap-4 text-slate-400 mb-2"><ShieldAlert size={20}/> Line Voltage</div>
          <div className="text-3xl font-mono text-yellow-500">{currentStats.voltage?.toFixed(1)} <span className="text-sm">V</span></div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl">
        <h2 className="text-xl font-semibold mb-6">Live Predictive Analysis</h2>
        <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px'}} />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={4} dot={currentStats.is_anomaly} isAnimationActive={false} />
                <Line type="monotone" dataKey="predicted" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
