"use client";

import { useState } from "react";
import { CityVoteSummary, BAHIA_CITIES_DATA } from "@/lib/tse";
import { MapPin, Search, Award, TrendingUp, Building2, ChevronRight } from "lucide-react";

interface BahiaCitiesOverviewProps {
  electionYear?: "2026" | "2022";
}

export default function BahiaCitiesOverview({ electionYear = "2026" }: BahiaCitiesOverviewProps) {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityVoteSummary>(
    BAHIA_CITIES_DATA.find((c) => c.isSatiroDias) || BAHIA_CITIES_DATA[0]
  );

  const filteredCities = BAHIA_CITIES_DATA.filter((c) =>
    c.city.toLowerCase().includes(search.toLowerCase().trim())
  );

  const jeronimoPct = ((selectedCity.governor.jeronimo / selectedCity.totalVotes) * 100).toFixed(1);
  const acmNetoPct = ((selectedCity.governor.acmNeto / selectedCity.totalVotes) * 100).toFixed(1);
  const joaoRomaPct = ((selectedCity.governor.joaoRoma / selectedCity.totalVotes) * 100).toFixed(1);

  const rcPct = ((selectedCity.deputies.robertoCarlos / selectedCity.totalVotes) * 100).toFixed(1);
  const vbPct = ((selectedCity.deputies.vitorBonfim / selectedCity.totalVotes) * 100).toFixed(1);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* City Detail Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl ${selectedCity.isSatiroDias ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"}`}>
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {selectedCity.city}
                </h2>
                {selectedCity.isSatiroDias && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                    Sua Localidade
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Votação por município • {electionYear === "2026" ? "Base de referência eleitoral para 2026" : "Total apurado 2022"} • <strong className="text-white font-mono">{selectedCity.totalVotes.toLocaleString("pt-BR")}</strong> votos consolidados
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown by Governor & Deputies in Selected City */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
          {/* Governor in City */}
          <div className="flex flex-col gap-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                Votação para Governador em {selectedCity.city}
              </span>
            </div>

            {/* Candidate 1: Jerônimo */}
            <div className="flex flex-col gap-1.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">1. Jerônimo (PT)</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {selectedCity.governor.jeronimo.toLocaleString("pt-BR")} votos ({jeronimoPct}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${jeronimoPct}%` }}
                />
              </div>
            </div>

            {/* Candidate 2: ACM Neto */}
            <div className="flex flex-col gap-1.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">2. ACM Neto (UNIÃO)</span>
                <span className="font-mono text-blue-400 font-bold">
                  {selectedCity.governor.acmNeto.toLocaleString("pt-BR")} votos ({acmNetoPct}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${acmNetoPct}%` }}
                />
              </div>
            </div>

            {/* Candidate 3: João Roma */}
            <div className="flex flex-col gap-1.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">3. João Roma (PL)</span>
                <span className="font-mono text-amber-400 font-bold">
                  {selectedCity.governor.joaoRoma.toLocaleString("pt-BR")} votos ({joaoRomaPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${joaoRomaPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Deputies in City */}
          <div className="flex flex-col gap-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Desempenho dos Deputados em {selectedCity.city}
              </span>
            </div>

            {/* Roberto Carlos (43333) */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm">
                  RC
                </div>
                <div>
                  <span className="font-extrabold text-white text-sm block">Roberto Carlos</span>
                  <span className="text-[11px] text-amber-400/90 font-semibold uppercase">
                    Estadual (43333)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-xl text-amber-400 block">
                  {selectedCity.deputies.robertoCarlos.toLocaleString("pt-BR")}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {rcPct}% dos votos
                </span>
              </div>
            </div>

            {/* Vitor Bonfim (4070) */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center font-black text-sm">
                  VB
                </div>
                <div>
                  <span className="font-extrabold text-white text-sm block">Vitor Bonfim</span>
                  <span className="text-[11px] text-emerald-400/90 font-semibold uppercase">
                    Federal (4070)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-xl text-emerald-400 block">
                  {selectedCity.deputies.vitorBonfim.toLocaleString("pt-BR")}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {vbPct}% dos votos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cities Selector & Search Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Cidades da Bahia
            </h3>
            <p className="text-xs text-slate-400">
              Selecione uma cidade para carregar os votos detalhados
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cidade baiana..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredCities.map((item) => {
            const isSelected = selectedCity.city === item.city;
            return (
              <button
                key={item.city}
                onClick={() => setSelectedCity(item)}
                className={`p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                  isSelected
                    ? "bg-blue-600/20 border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500"
                    : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold text-xs sm:text-sm block ${isSelected ? "text-blue-300" : "text-white"}`}>
                      {item.city}
                    </span>
                    {item.isSatiroDias && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                    {item.totalVotes.toLocaleString("pt-BR")} votos
                  </span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-blue-400 translate-x-1" : "text-slate-600 group-hover:text-slate-400"}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
