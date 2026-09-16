"use client";

import { useState, useMemo } from "react";
import { TseCandidate } from "@/lib/tse";
import { Search, Trophy, CheckCircle, Clock, User, Filter, ChevronLeft, ChevronRight } from "lucide-react";

interface TseCandidateRankingProps {
  candidates: TseCandidate[];
  title: string;
  cargoType: "governador" | "estadual" | "federal";
  highlightNumbers?: string[];
  totalVotosApurados?: string;
  secoesApuradasPct?: string;
}

export default function TseCandidateRanking({
  candidates,
  title,
  cargoType,
  highlightNumbers = ["43333", "4070"],
  totalVotosApurados,
  secoesApuradasPct,
}: TseCandidateRankingProps) {
  const [search, setSearch] = useState("");
  const [onlyElected, setOnlyElected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter and sort candidates by votes descending
  const filteredCandidates = useMemo(() => {
    let list = [...candidates];

    if (onlyElected) {
      list = list.filter((c) => c.e === "s" || c.st.toLowerCase().includes("eleito") || c.st.toLowerCase().includes("2º"));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) => c.nm.toLowerCase().includes(q) || c.n.includes(q) || c.cc.toLowerCase().includes(q)
      );
    }

    // Sort by votes descending so #1 is the most voted candidate
    return list.sort((a, b) => (Number(b.vap) || 0) - (Number(a.vap) || 0));
  }, [candidates, search, onlyElected]);

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage) || 1;
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCandidates.slice(start, start + itemsPerPage);
  }, [filteredCandidates, currentPage]);

  const getStatusBadge = (cand: TseCandidate) => {
    const st = cand.st.toLowerCase();
    if (cand.e === "s" || st.includes("eleito")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle className="w-3 h-3" />
          {cand.st}
        </span>
      );
    }
    if (st.includes("2º turno")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Clock className="w-3 h-3" />
          {cand.st}
        </span>
      );
    }
    if (st.includes("suplente")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Suplente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs text-slate-400 bg-slate-800/80 border border-slate-700/50">
        Não eleito
      </span>
    );
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              {title}
              <span className="text-xs font-normal text-slate-400 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                {candidates.length} candidatos
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Apuração oficial do TSE na Bahia {secoesApuradasPct ? `(${secoesApuradasPct}% apurado)` : ""}
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou número..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
            />
          </div>

          <button
            onClick={() => {
              setOnlyElected(!onlyElected);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition ${
              onlyElected
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{onlyElected ? "Apenas Eleitos" : "Todos"}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Candidato</th>
              <th className="py-3 px-4">Número</th>
              <th className="py-3 px-4 hidden md:table-cell">Partido / Coligação</th>
              <th className="py-3 px-4 text-right">Votos</th>
              <th className="py-3 px-4 text-right">% Válidos</th>
              <th className="py-3 px-4 text-center">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedCandidates.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                  Nenhum candidato encontrado com os filtros aplicados.
                </td>
              </tr>
            ) : (
              paginatedCandidates.map((cand, idx) => {
                const isHighlighted = highlightNumbers.includes(cand.n);
                const rankNumber = (currentPage - 1) * itemsPerPage + idx + 1;

                return (
                  <tr
                    key={cand.sqcand || `${cand.n}-${idx}`}
                    className={`transition-colors ${
                      isHighlighted
                        ? "bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-amber-400 font-medium"
                        : "hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs">
                      {isHighlighted ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-bold text-xs">
                          {rankNumber}
                        </span>
                      ) : (
                        rankNumber
                      )}
                    </td>

                    {/* Candidate Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isHighlighted
                              ? "bg-amber-400 text-slate-950 ring-2 ring-amber-400/40"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span
                            className={`font-bold block leading-tight ${
                              isHighlighted ? "text-amber-300 text-sm sm:text-base" : "text-slate-100"
                            }`}
                          >
                            {cand.nm}
                          </span>
                          {cand.nv && (
                            <span className="text-[11px] text-slate-400 block">
                              Vice: {cand.nv}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 md:hidden block mt-0.5">
                            {cand.cc}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                      <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-amber-300/90">
                        {cand.n}
                      </span>
                    </td>

                    {/* Party */}
                    <td className="py-3.5 px-4 text-slate-300 hidden md:table-cell text-xs max-w-xs truncate">
                      {cand.cc}
                    </td>

                    {/* Votes */}
                    <td className="py-3.5 px-4 text-right font-bold text-white font-mono tabular-nums">
                      {Number(cand.vap).toLocaleString("pt-BR")}
                    </td>

                    {/* Percentage */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-amber-400 font-mono tabular-nums">
                      {cand.pvap}%
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(cand)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
            {Math.min(currentPage * itemsPerPage, filteredCandidates.length)} de{" "}
            {filteredCandidates.length} candidatos
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
