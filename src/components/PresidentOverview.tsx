"use client";

import { useState, useMemo } from "react";
import {
  TseElectionData,
  getBrazilStatesPresidentData,
  CANDIDATES_2026_PRESIDENT,
  CANDIDATES_2022_PRESIDENT_BR,
  CANDIDATES_2022_PRESIDENT_BA,
} from "@/lib/tse";
import {
  Flag,
  Globe2,
  Users,
  Vote,
  TrendingUp,
  Search,
  Clock,
  Building,
} from "lucide-react";

interface PresidentOverviewProps {
  electionYear: "2026" | "2022";
  tsePresidentBr?: TseElectionData | null;
  tsePresidentBa?: TseElectionData | null;
}

export default function PresidentOverview({
  electionYear,
  tsePresidentBr,
  tsePresidentBa,
}: PresidentOverviewProps) {
  const is2026 = electionYear === "2026";
  const [activeScope, setActiveScope] = useState<"brasil" | "bahia" | "estados">("brasil");
  const [searchState, setSearchState] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("todas");

  // States data
  const statesData = useMemo(() => {
    return getBrazilStatesPresidentData(electionYear);
  }, [electionYear]);

  // Candidates list depending on scope and year
  const candidates = useMemo(() => {
    if (is2026) return CANDIDATES_2026_PRESIDENT;
    if (activeScope === "bahia") {
      return tsePresidentBa?.candidates && tsePresidentBa.candidates.length > 0
        ? tsePresidentBa.candidates
        : CANDIDATES_2022_PRESIDENT_BA;
    }
    return tsePresidentBr?.candidates && tsePresidentBr.candidates.length > 0
      ? tsePresidentBr.candidates
      : CANDIDATES_2022_PRESIDENT_BR;
  }, [is2026, activeScope, tsePresidentBr, tsePresidentBa]);

  // KPIs
  const totalElectors = activeScope === "bahia" ? "11.450.000" : "156.454.011";
  const totalUrnas = activeScope === "bahia" ? "34.980" : "472.075";
  const pst = is2026
    ? "0,00"
    : activeScope === "bahia"
    ? tsePresidentBa?.pst || "100,00"
    : tsePresidentBr?.pst || "100,00";
  const totalVotes = is2026 ? 0 : activeScope === "bahia" ? 8866459 : 123682372;
  const abstencaoPct = is2026 ? "0,00%" : activeScope === "bahia" ? "21,35%" : "20,95%";

  // Filtered states for the 27 states view
  const filteredStates = useMemo(() => {
    return statesData.filter((s) => {
      const q = searchState.toLowerCase().trim();
      const matchesQuery =
        !q || s.uf.toLowerCase().includes(q) || s.stateName.toLowerCase().includes(q);
      const matchesRegion = selectedRegion === "todas" || s.region === selectedRegion;
      return matchesQuery && matchesRegion;
    });
  }, [statesData, searchState, selectedRegion]);

  const lula = candidates.find((c) => c.n === "13");
  const oposicao = candidates.find((c) => c.n === "22");

  return (
    <div className="space-y-6">
      {/* Scope Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveScope("brasil")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 whitespace-nowrap ${
              activeScope === "brasil"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>🇧🇷 Brasil Geral (Nacional)</span>
          </button>

          <button
            onClick={() => setActiveScope("bahia")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 whitespace-nowrap ${
              activeScope === "bahia"
                ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>🏛️ Votação na Bahia</span>
          </button>

          <button
            onClick={() => setActiveScope("estados")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 active:scale-95 whitespace-nowrap ${
              activeScope === "estados"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span>🗺️ Todos os 27 Estados (UFs)</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden md:inline">
          {is2026
            ? "Eleições Gerais 2026 • Apuração Oficial TSE"
            : "Resultado Consolidado • Eleições 2022"}
        </span>
      </div>

      {/* 4 Executive KPIs for President */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Seções Apuradas
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              {pst}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {is2026 ? `0 de ${totalUrnas}` : `${totalUrnas} urnas`}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${parseFloat(pst.replace(",", ".")) || 0}%` }}
            />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Eleitorado Apto
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              {totalElectors}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {activeScope === "bahia"
              ? "Eleitores aptos na Bahia"
              : "Eleitores aptos no Brasil"}
          </p>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Votos Computados
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Vote className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tabular-nums">
              {totalVotes.toLocaleString("pt-BR")}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {is2026
              ? "Aguardando início da apuração das urnas de 2026"
              : "Total apurado no 1º turno"}
          </p>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Abstenção Eleitoral
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tabular-nums">
              {abstencaoPct}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {is2026 ? "Taxa esperada de abstenção" : "Índice consolidado"}
          </p>
        </div>
      </div>

      {/* Main Scope Content */}
      {activeScope !== "estados" ? (
        <div className="space-y-6">
          {/* Candidate Placar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lula (13) */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-red-500/30 shadow-xl relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    13 • PT / COLIGAÇÃO
                  </span>
                  <span className="text-xs font-bold text-red-400">
                    {lula?.st || (is2026 ? "Aguardando apuração" : "Eleito")}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-red-500 bg-slate-800 shrink-0 shadow-lg shadow-red-500/20">
                    <img
                      src="/imagens/lula.jpg"
                      alt="Lula"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {lula?.nm || "LUIZ INÁCIO LULA DA SILVA"}
                    </h3>
                    <p className="text-xs text-red-400/80 font-medium mt-0.5">
                      Vice: {lula?.nv || "Geraldo Alckmin"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-red-400 font-mono tabular-nums">
                    {Number(lula?.vap || 0).toLocaleString("pt-BR")}
                  </span>
                  <span className="text-base font-bold text-slate-400 font-mono tabular-nums">
                    ({lula?.pvap || "0,00"}%)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Votos válidos em{" "}
                  {activeScope === "bahia"
                    ? "todo o estado da Bahia"
                    : "todo o território nacional (Brasil)"}
                </p>
              </div>
            </div>

            {/* Oposição / Flávio Bolsonaro (2026) / Jair Bolsonaro (2022) */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-500/30 shadow-xl relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    22 • PL / COLIGAÇÃO
                  </span>
                  <span className="text-xs font-bold text-blue-400">
                    {oposicao?.st || (is2026 ? "Aguardando apuração" : "2º Turno")}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500 bg-slate-800 shrink-0 shadow-lg shadow-blue-500/20">
                    <img
                      src={is2026 ? "/imagens/flavio_bolsonaro.jpg" : "/imagens/bolsonaro.jpg"}
                      alt={is2026 ? "Flávio Bolsonaro" : "Jair Bolsonaro"}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {oposicao?.nm ||
                        (is2026 ? "FLÁVIO BOLSONARO" : "JAIR BOLSONARO")}
                    </h3>
                    <p className="text-xs text-blue-400/80 font-medium mt-0.5">
                      Vice: {oposicao?.nv || (is2026 ? "A Definir" : "Braga Netto")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-blue-400 font-mono tabular-nums">
                    {Number(oposicao?.vap || 0).toLocaleString("pt-BR")}
                  </span>
                  <span className="text-base font-bold text-slate-400 font-mono tabular-nums">
                    ({oposicao?.pvap || "0,00"}%)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Votos válidos em{" "}
                  {activeScope === "bahia"
                    ? "todo o estado da Bahia"
                    : "todo o território nacional (Brasil)"}
                </p>
              </div>
            </div>
          </div>

          {/* Ranking Table of All Candidates */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-blue-400" />
                <span>
                  Ranking Presidencial Oficial (
                  {activeScope === "bahia" ? "Bahia" : "Brasil"} • {electionYear})
                </span>
              </h4>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {pst}% apurado
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Candidato a Presidente</th>
                    <th className="py-3 px-4">Número</th>
                    <th className="py-3 px-4 hidden md:table-cell">
                      Partido / Coligação
                    </th>
                    <th className="py-3 px-4 text-right">Votos</th>
                    <th className="py-3 px-4 text-right">% Válidos</th>
                    <th className="py-3 px-4 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {candidates.map((cand, idx) => {
                    const isLula = cand.n === "13";
                    const isOposicao = cand.n === "22";
                    return (
                      <tr
                        key={cand.n}
                        className={`hover:bg-slate-800/40 transition ${
                          isLula
                            ? "bg-red-500/5 font-medium"
                            : isOposicao
                            ? "bg-blue-500/5 font-medium"
                            : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-bold block ${
                              isLula
                                ? "text-red-300"
                                : isOposicao
                                ? "text-blue-300"
                                : "text-white"
                            }`}
                          >
                            {cand.nm}
                          </span>
                          {cand.nv && (
                            <span className="text-[11px] text-slate-400 block font-normal">
                              Vice: {cand.nv}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums font-bold">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-amber-300">
                            {cand.n}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 hidden md:table-cell text-xs max-w-xs truncate">
                          {cand.cc}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-white font-mono tabular-nums">
                          {Number(cand.vap).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-amber-400 font-mono tabular-nums">
                          {cand.pvap}%
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {cand.st}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Todos os 27 Estados (UFs) */
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-purple-400" />
                  Apuração Presidencial por Estado (27 UFs)
                </h3>
                <p className="text-xs text-slate-400">
                  {is2026
                    ? "Acompanhe a apuração para Presidente em cada estado brasileiro (Eleição 2026)"
                    : "Resultado oficial consolidado para Presidente em cada UF (Eleição 2022)"}
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar estado ou UF (ex: BA, SP, Minas)..."
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            {/* Region Filter Chips */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
              {["todas", "Nordeste", "Sudeste", "Sul", "Norte", "Centro-Oeste"].map(
                (r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRegion(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 active:scale-95 ${
                      selectedRegion === r
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-750"
                    }`}
                  >
                    {r === "todas" ? "Todos os Estados (27)" : r}
                  </button>
                )
              )}
            </div>

            {/* States Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">UF</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 hidden md:table-cell">Região</th>
                    <th className="py-3 px-4 text-right">Votos Totais</th>
                    <th className="py-3 px-4 text-right">Lula (13)</th>
                    <th className="py-3 px-4 text-right">
                      {is2026 ? "Oposição (22)" : "Bolsonaro (22)"}
                    </th>
                    <th className="py-3 px-4 text-center">Líder / Vencedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStates.map((st) => {
                    const isBahia = st.uf === "BA";
                    return (
                      <tr
                        key={st.uf}
                        className={`hover:bg-slate-800/40 transition ${
                          isBahia
                            ? "bg-amber-500/10 border-l-4 border-amber-400 font-medium"
                            : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center font-mono tabular-nums font-extrabold text-white">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              isBahia
                                ? "bg-amber-400 text-slate-950"
                                : "bg-slate-800 text-slate-200"
                            }`}
                          >
                            {st.uf}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {st.stateName}
                          {isBahia && (
                            <span className="text-[10px] text-amber-400 ml-1.5 font-normal">
                              (Estado em Foco)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 hidden md:table-cell text-xs">
                          {st.region}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                          {st.totalVotes.toLocaleString("pt-BR")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-red-400">
                          {is2026
                            ? "0 (0,00%)"
                            : `${st.lulaVotes.toLocaleString("pt-BR")} (${st.lulaPct}%)`}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-blue-400">
                          {is2026
                            ? "0 (0,00%)"
                            : `${st.bolsonaroVotes.toLocaleString("pt-BR")} (${st.bolsonaroPct}%)`}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {is2026 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              Aguardando
                            </span>
                          ) : st.winner === "Lula" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
                              Lula ({st.lulaPct}%)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              Bolsonaro ({st.bolsonaroPct}%)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}