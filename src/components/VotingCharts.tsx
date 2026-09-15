"use client";

import { useState } from "react";
import { Candidate, Community, VoteRecord } from "@/lib/supabase";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface VotingChartsProps {
  candidates: Candidate[];
  communities: Community[];
  votes: VoteRecord[];
  selectedCommunityId?: string | null;
  onSelectCommunity?: (communityId: string) => void;
}

export default function VotingCharts({
  candidates,
  communities,
  votes,
  selectedCommunityId,
  onSelectCommunity,
}: VotingChartsProps) {
  const [activeTab, setActiveTab] = useState<"bars" | "donut">("bars");

  // Compute votes data per community for Recharts
  const chartData = communities.map((comm) => {
    const commVotes = votes.filter((v) => v.community_id === comm.id);
    const total = commVotes.reduce((acc, curr) => acc + (Number(curr.votes) || 0), 0);

    const cand1 = candidates[0];
    const cand2 = candidates[1];

    const v1 = commVotes.find((cv) => cv.candidate_id === cand1?.id);
    const v2 = commVotes.find((cv) => cv.candidate_id === cand2?.id);

    const votes1 = v1 ? Number(v1.votes) : 0;
    const votes2 = v2 ? Number(v2.votes) : 0;

    return {
      communityId: comm.id,
      name: comm.name,
      total,
      [cand1?.name || "Candidato 1"]: votes1,
      [cand2?.name || "Candidato 2"]: votes2,
    };
  }).sort((a, b) => b.total - a.total); // Sort by total votes descending for better visualization

  // Calculate global totals
  const totalVotesGlobal = votes.reduce((acc, curr) => acc + (Number(curr.votes) || 0), 0);
  const cand1Total = votes
    .filter((v) => v.candidate_id === candidates[0]?.id)
    .reduce((acc, curr) => acc + (Number(curr.votes) || 0), 0);
  const cand2Total = votes
    .filter((v) => v.candidate_id === candidates[1]?.id)
    .reduce((acc, curr) => acc + (Number(curr.votes) || 0), 0);

  const cand1Pct = totalVotesGlobal > 0 ? ((cand1Total / totalVotesGlobal) * 100).toFixed(1) : "50.0";
  const cand2Pct = totalVotesGlobal > 0 ? ((cand2Total / totalVotesGlobal) * 100).toFixed(1) : "50.0";

  // Pie chart data
  const pieData = [
    { name: candidates[0]?.name || "Candidato 1", value: cand1Total, color: "#fbbf24" }, // amber-400
    { name: candidates[1]?.name || "Candidato 2", value: cand2Total, color: "#34d399" }, // emerald-400
  ];

  // Helper for images
  const getCandidateImage = (name: string) => {
    if (name.toLowerCase().includes("roberto")) return "/imagens/roberto carlos .jpeg";
    if (name.toLowerCase().includes("vitor")) return "/imagens/vitor bomfim.17.jpeg";
    return undefined; // fallback
  };

  const cand1Name = candidates[0]?.name || "Roberto Carlos";
  const cand2Name = candidates[1]?.name || "Vitor Bomfim";

  // Custom Tooltip for Bar Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/95 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-bold mb-2 pb-2 border-b border-slate-700">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2 text-xs mb-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300">{entry.name}:</span>
              <span className="text-white font-bold">{entry.value}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400">
            Total: {payload[0].payload.total} votos
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden flex flex-col">
      {/* Chart Header Toolbar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">
              Análise de Votação
            </h3>
            <p className="text-[11px] text-slate-400">
              Desempenho eleitoral detalhado
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => setActiveTab("bars")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium ${
              activeTab === "bars"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Desempenho Local</span>
          </button>
          <button
            onClick={() => setActiveTab("donut")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium ${
              activeTab === "donut"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Panorama Geral</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-900 to-slate-950">
        {/* Persistent Legend */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 mb-8 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-4 bg-slate-800/40 pr-6 rounded-full border border-slate-700/50 shadow-md transition-transform hover:scale-105 cursor-default">
            <img 
              src={getCandidateImage(cand1Name) || ""} 
              alt={cand1Name} 
              className="w-14 h-14 rounded-full object-cover border-[3px] border-amber-400 shadow-lg shadow-amber-500/20 bg-slate-800"
            />
            <div>
              <span className="font-bold text-slate-100 text-sm sm:text-base block">{cand1Name}</span>
              <span className="font-bold text-amber-400/90 text-[11px] uppercase tracking-wider">Estadual</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-800/40 pr-6 rounded-full border border-slate-700/50 shadow-md transition-transform hover:scale-105 cursor-default">
            <img 
              src={getCandidateImage(cand2Name) || ""} 
              alt={cand2Name} 
              className="w-14 h-14 rounded-full object-cover border-[3px] border-emerald-400 shadow-lg shadow-emerald-500/20 bg-slate-800"
            />
            <div>
              <span className="font-bold text-slate-100 text-sm sm:text-base block">{cand2Name}</span>
              <span className="font-bold text-emerald-400/90 text-[11px] uppercase tracking-wider">Federal</span>
            </div>
          </div>
        </div>

        {activeTab === "bars" ? (
          <div className="w-full h-[350px]">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500 italic">
                Nenhuma comunidade cadastrada.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 40 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    dy={10}
                    angle={chartData.length > 6 ? -45 : 0}
                    textAnchor={chartData.length > 6 ? "end" : "middle"}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                  
                  <Bar 
                    dataKey={cand1Name} 
                    fill="#fbbf24" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40}
                  />
                  <Bar 
                    dataKey={cand2Name} 
                    fill="#34d399" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-around gap-8 py-4">
            {/* Recharts Donut */}
            <div className="relative w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={8}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value ?? 0} votos`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Total
                </span>
                <span className="text-3xl font-black text-white drop-shadow-md my-1">
                  {totalVotesGlobal.toLocaleString("pt-BR")}
                </span>
                <span className="text-xs text-slate-500 font-medium">votos</span>
              </div>
            </div>

            {/* Candidate Breakdown Cards */}
            <div className="flex flex-col gap-6 w-full max-w-md">
              <div className="p-5 rounded-3xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between hover:bg-slate-800/60 transition-colors shadow-lg">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-[4px] border-amber-400 p-0.5 relative group shadow-lg shadow-amber-500/20">
                     <img 
                      src={getCandidateImage(cand1Name) || ""} 
                      alt={cand1Name} 
                      className="w-full h-full rounded-full object-cover bg-slate-800" 
                    />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-100 block text-lg sm:text-xl">
                      {cand1Name}
                    </span>
                    <span className="text-amber-400/90 text-sm font-bold uppercase tracking-widest mt-1 block">
                      Estadual
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-3xl text-amber-400 block drop-shadow-md">
                    {cand1Total.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-sm text-slate-300 font-bold bg-amber-500/10 px-3 py-1 rounded-lg text-amber-300/90 inline-block mt-2">
                    {cand1Pct}%
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between hover:bg-slate-800/60 transition-colors shadow-lg">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-[4px] border-emerald-400 p-0.5 relative group shadow-lg shadow-emerald-500/20">
                     <img 
                      src={getCandidateImage(cand2Name) || ""} 
                      alt={cand2Name} 
                      className="w-full h-full rounded-full object-cover bg-slate-800" 
                    />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-100 block text-lg sm:text-xl">
                      {cand2Name}
                    </span>
                    <span className="text-emerald-400/90 text-sm font-bold uppercase tracking-widest mt-1 block">
                      Federal
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-3xl text-emerald-400 block drop-shadow-md">
                    {cand2Total.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-sm text-slate-300 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg text-emerald-300/90 inline-block mt-2">
                    {cand2Pct}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
