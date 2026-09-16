"use client";

import { useState } from "react";
import { CityVoteSummary, BAHIA_CITIES_DATA } from "@/lib/tse";
import { MapPin, Search, Award, TrendingUp, Building2, ChevronRight, Clock } from "lucide-react";

interface BahiaCitiesOverviewProps {
  electionYear?: "2026" | "2022";
}

export default function BahiaCitiesOverview({ electionYear = "2026" }: BahiaCitiesOverviewProps) {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityVoteSummary>(
    BAHIA_CITIES_DATA.find((c) => c.isSatiroDias) || BAHIA_CITIES_DATA[0]
  );

  const [selectedRegion, setSelectedRegion] = useState<
    "todas" | "Sátiro Dias & Região" | "Polos Regionais"
  >("todas");

  const is2026 = electionYear === "2026";

  const filteredCities = BAHIA_CITIES_DATA.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || c.city.toLowerCase().includes(q);
    const matchesRegion =
      selectedRegion === "todas" || c.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  // For 2026, the election has not happened yet: zero out votes
  const totalVotesDisplay = is2026 ? 0 : selectedCity.totalVotes;

  const jeronimoVotes = is2026 ? 0 : selectedCity.governor.jeronimo;
  const jeronimoPct = is2026
    ? "0,0"
    : ((selectedCity.governor.jeronimo / selectedCity.totalVotes) * 100).toFixed(1);

  const acmNetoVotes = is2026 ? 0 : selectedCity.governor.acmNeto;
  const acmNetoPct = is2026
    ? "0,0"
    : ((selectedCity.governor.acmNeto / selectedCity.totalVotes) * 100).toFixed(1);

  const joaoRomaVotes = is2026 ? 0 : selectedCity.governor.joaoRoma;
  const joaoRomaPct = is2026
    ? "0,0"
    : ((selectedCity.governor.joaoRoma / selectedCity.totalVotes) * 100).toFixed(1);

  const rcVotes = is2026 ? 0 : selectedCity.deputies.robertoCarlos;
  const rcPct = is2026
    ? "0,0"
    : ((selectedCity.deputies.robertoCarlos / selectedCity.totalVotes) * 100).toFixed(1);

  const vbVotes = is2026 ? 0 : selectedCity.deputies.vitorBonfim;
  const vbPct = is2026
    ? "0,0"
    : ((selectedCity.deputies.vitorBonfim / selectedCity.totalVotes) * 100).toFixed(1);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* City Detail Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-2xl ${
                selectedCity.isSatiroDias
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              }`}
            >
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {selectedCity.city}
                </h2>
                {selectedCity.isSatiroDias && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                    Sua Localidade
                  </span>
                )}
                {is2026 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Clock className="w-3 h-3" />
                    Aguardando Apuração 2026 (0,00%)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Eleição 2022 (Consolidada)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {is2026 ? (
                  <>
                    Votação municipal • Eleições Gerais 2026 •{" "}
                    <strong className="text-amber-400 font-mono">0</strong> votos apurados
                    (Aguardando abertura das urnas pelo TSE)
                  </>
                ) : (
                  <>
                    Votação por município • Total apurado em 2022 •{" "}
                    <strong className="text-white font-mono">
                      {selectedCity.totalVotes.toLocaleString("pt-BR")}
                    </strong>{" "}
                    votos consolidados
                  </>
                )}
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
              {is2026 && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  0,00% apurado
                </span>
              )}
            </div>

            {/* Candidate 1: Jerônimo */}
            <div className="flex flex-col gap-1.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white">1. Jerônimo Rodrigues (PT)</span>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Vice: Geraldo Júnior
                  </span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">
                  {jeronimoVotes.toLocaleString("pt-BR")} votos ({jeronimoPct}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${is2026 ? 0 : jeronimoPct}%` }}
                />
              </div>
            </div>

            {/* Candidate 2: ACM Neto */}
            <div className="flex flex-col gap-1.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white">2. ACM Neto (UNIÃO)</span>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Vice: {is2026 ? "Zé Cocá" : "Ana Coelho"}
                  </span>
                </div>
                <span className="font-mono text-blue-400 font-bold">
                  {acmNetoVotes.toLocaleString("pt-BR")} votos ({acmNetoPct}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${is2026 ? 0 : acmNetoPct}%` }}
                />
              </div>
            </div>

            {/* Candidate 3: João Roma - Apenas em 2022 */}
            {!is2026 && (
              <div className="flex flex-col gap-1.5 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-300">3. João Roma (PL)</span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Vice: Leonidia Umbelina
                    </span>
                  </div>
                  <span className="font-mono text-amber-400 font-bold">
                    {joaoRomaVotes.toLocaleString("pt-BR")} votos ({joaoRomaPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${joaoRomaPct}%` }}
                  />
                </div>
              </div>
            )}

            {is2026 && (
              <p className="text-[11px] text-slate-400 mt-2 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                ⏳ As urnas de 2026 ainda não foram abertas. A contagem de votos será iniciada automaticamente no dia da votação pelo TSE.
              </p>
            )}
          </div>

          {/* Deputies in City */}
          <div className="flex flex-col gap-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Desempenho dos Deputados em {selectedCity.city}
              </span>
              {is2026 && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  0,00% apurado
                </span>
              )}
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
                  {rcVotes.toLocaleString("pt-BR")}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {is2026 ? "Aguardando apuração" : `${rcPct}% dos votos`}
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
                  {vbVotes.toLocaleString("pt-BR")}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {is2026 ? "Aguardando apuração" : `${vbPct}% dos votos`}
                </span>
              </div>
            </div>

            {is2026 && (
              <p className="text-[11px] text-slate-400 mt-2 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                ⏳ Roberto Carlos (43333) e Vitor Bonfim (4070) registrados. Votos começarão a ser totalizados assim que as primeiras urnas forem computadas.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Cities Selector & Search Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Cidades da Bahia {is2026 ? "(Eleição 2026)" : "(Histórico 2022)"}
            </h3>
            <p className="text-xs text-slate-400">
              {is2026
                ? "Selecione uma cidade baiana para acompanhar a apuração em tempo real"
                : "Selecione uma cidade baiana para visualizar os dados oficiais consolidados de 2022"}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar entre 75 cidades da Bahia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Region Filter Pills */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            onClick={() => setSelectedRegion("todas")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 ${
              selectedRegion === "todas"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            Todas as Cidades ({BAHIA_CITIES_DATA.length})
          </button>

          <button
            onClick={() => setSelectedRegion("Sátiro Dias & Região")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
              selectedRegion === "Sátiro Dias & Região"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 font-black"
                : "bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            📍 Sátiro Dias & Região (
            {
              BAHIA_CITIES_DATA.filter(
                (c) => c.region === "Sátiro Dias & Região"
              ).length
            }
            )
          </button>

          <button
            onClick={() => setSelectedRegion("Polos Regionais")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 active:scale-95 ${
              selectedRegion === "Polos Regionais"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black"
                : "bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            🌆 Polos Regionais (
            {
              BAHIA_CITIES_DATA.filter((c) => c.region === "Polos Regionais")
                .length
            }
            )
          </button>
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 px-1">
          <span>
            Exibindo <strong className="text-white font-mono tabular-nums">{filteredCities.length}</strong> cidades disponíveis
          </span>
          {search && (
            <span>
              Filtrado por: &ldquo;<strong className="text-amber-400">{search}</strong>&rdquo;
            </span>
          )}
        </div>

        {/* Cities Grid */}
        {filteredCities.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
            <p className="text-sm text-slate-400">
              Nenhuma cidade encontrada com o termo &ldquo;{search}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedRegion("todas");
              }}
              className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredCities.map((item) => {
              const isSelected = selectedCity.city === item.city;
              return (
                <button
                  key={item.city}
                  onClick={() => setSelectedCity(item)}
                  className={`p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] ${
                    isSelected
                      ? "bg-blue-600/20 border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500"
                      : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-bold text-xs sm:text-sm block truncate ${
                          isSelected ? "text-blue-300" : "text-white"
                        }`}
                      >
                        {item.city}
                      </span>
                      {item.isSatiroDias ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-slate-950 uppercase shrink-0">
                          Sua Localidade
                        </span>
                      ) : item.region === "Sátiro Dias & Região" ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                          Região
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums block mt-0.5">
                      {is2026
                        ? "0 votos apurados"
                        : `${item.totalVotes.toLocaleString("pt-BR")} votos`}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected
                        ? "text-blue-400 translate-x-1"
                        : "text-slate-600 group-hover:text-slate-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
