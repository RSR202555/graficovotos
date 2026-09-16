"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  VoteRecord,
  Candidate,
  Community,
  supabase,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { TseElectionData, CityVoteSummary, BAHIA_CITIES_DATA } from "@/lib/tse";
import {
  Users,
  MapPin,
  Vote,
  TrendingUp,
  Award,
  Database,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  LogOut,
  Trash2,
  Building2,
  Globe,
  Radio,
  Trophy,
  Crown,
  CheckCircle,
  Flag,
} from "lucide-react";
import MunicipalityMap from "@/components/MunicipalityMap";
import VotingCharts from "@/components/VotingCharts";
import LocationPickerMap from "@/components/LocationPickerMap";
import TseCandidateRanking from "@/components/TseCandidateRanking";
import BahiaCitiesOverview from "@/components/BahiaCitiesOverview";
import PresidentOverview from "@/components/PresidentOverview";

// No mock initial data
const INITIAL_CANDIDATES: Candidate[] = [];
const INITIAL_COMMUNITIES: Community[] = [];
const INITIAL_VOTES: VoteRecord[] = [];

export default function Home() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [communities, setCommunities] = useState<Community[]>(INITIAL_COMMUNITIES);
  const [votes, setVotes] = useState<VoteRecord[]>(INITIAL_VOTES);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);

  // Form states for new vote
  const [formCommunity, setFormCommunity] = useState("");
  const [formCandidate, setFormCandidate] = useState("");
  const [formVotes, setFormVotes] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form states for new community
  const [showAddCommunityModal, setShowAddCommunityModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityLat, setNewCommunityLat] = useState("");
  const [newCommunityLng, setNewCommunityLng] = useState("");

  // TSE Live Data States
  const [electionYear, setElectionYear] = useState<"2026" | "2022">("2026");
  const [activeMainTab, setActiveMainTab] = useState<"bahia" | "cidades" | "satiro-dias">("bahia");
  const [selectedCargo, setSelectedCargo] = useState<"presidente" | "governador" | "estadual" | "federal">("presidente");
  const [tseLoading, setTseLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastTseUpdate, setLastTseUpdate] = useState<string>("");
  const [tseData, setTseData] = useState<{
    presidenteBr?: TseElectionData | null;
    presidenteBa?: TseElectionData | null;
    governador?: TseElectionData | null;
    federal?: TseElectionData | null;
    estadual?: TseElectionData | null;
    focusCandidates?: any;
    cities?: CityVoteSummary[];
    states?: any[];
  }>({
    cities: BAHIA_CITIES_DATA,
  });

  useEffect(() => {
    const checkAuth = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (localStorage.getItem("mock_auth") !== "true") {
          router.push("/login");
        } else {
          setIsAuthChecking(false);
        }
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  // Fetch real data from Supabase if configured
  const loadData = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    try {
      const [candRes, commRes, voteRes] = await Promise.all([
        supabase.from("candidates").select("*"),
        supabase.from("communities").select("*"),
        supabase.from("vote_records").select("*"),
      ]);

      if (candRes.data && candRes.data.length > 0) setCandidates(candRes.data);
      if (commRes.data && commRes.data.length > 0) setCommunities(commRes.data);
      if (voteRes.data && voteRes.data.length > 0) setVotes(voteRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados do Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch TSE official results
  const loadTseData = useCallback(async (ano?: "2026" | "2022") => {
    const anoToFetch = ano || electionYear;
    try {
      setTseLoading(true);
      const res = await fetch(`/api/tse?ano=${anoToFetch}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTseData({
            presidenteBr: json.presidenteBr,
            presidenteBa: json.presidenteBa,
            governador: json.governador,
            federal: json.federal,
            estadual: json.estadual,
            focusCandidates: json.focusCandidates,
            cities: json.cities || BAHIA_CITIES_DATA,
            states: json.states,
          });
          setLastTseUpdate(new Date().toLocaleTimeString("pt-BR"));
        }
      }
    } catch (err) {
      console.error("Erro ao carregar TSE:", err);
    } finally {
      setTseLoading(false);
    }
  }, [electionYear]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      loadData();
    }
    loadTseData(electionYear);
  }, [electionYear, loadTseData]);

  // Polling for TSE real-time
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadTseData(electionYear);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, electionYear, loadTseData]);

  // Compute metrics for local Sátiro Dias
  const totalVotes = useMemo(() => {
    return votes.reduce((acc, curr) => acc + (Number(curr.votes) || 0), 0);
  }, [votes]);

  const candidateStats = useMemo(() => {
    return candidates.map((c) => {
      const cVotes = votes
        .filter((v) => v.candidate_id === c.id)
        .reduce((acc, curr) => acc + (Number(curr.votes) || 0), 0);
      const percentage = totalVotes > 0 ? ((cVotes / totalVotes) * 100).toFixed(1) : "0";
      return {
        ...c,
        totalVotes: cVotes,
        percentage,
      };
    });
  }, [candidates, votes, totalVotes]);

  // Votes by Community
  const communityStats = useMemo(() => {
    return communities
      .map((comm) => {
        const commVotes = votes.filter((v) => v.community_id === comm.id);
        const total = commVotes.reduce((acc, curr) => acc + (Number(curr.votes) || 0), 0);
        const perCandidate = candidates.map((c) => {
          const v = commVotes.find((cv) => cv.candidate_id === c.id);
          return {
            candidateId: c.id,
            name: c.name,
            votes: v ? Number(v.votes) : 0,
          };
        });
        return {
          ...comm,
          total,
          perCandidate,
        };
      })
      .filter((c) =>
        c.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
      );
  }, [communities, votes, candidates, searchFilter]);

  const handleLogout = async () => {
    localStorage.removeItem("mock_auth");
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  const handleAddCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName) return;

    const lat = newCommunityLat ? parseFloat(newCommunityLat) : null;
    const lng = newCommunityLng ? parseFloat(newCommunityLng) : null;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("communities")
        .insert([{ name: newCommunityName, latitude: lat, longitude: lng }])
        .select();

      if (error) {
        alert("Erro ao criar comunidade: " + error.message);
        return;
      }

      if (data && data[0]) {
        setCommunities([...communities, data[0]]);
      }
    } else {
      const newComm: Community = {
        id: "comm-" + Date.now(),
        name: newCommunityName,
        latitude: lat,
        longitude: lng,
      };
      setCommunities([...communities, newComm]);
    }

    setNewCommunityName("");
    setNewCommunityLat("");
    setNewCommunityLng("");
    setShowAddCommunityModal(false);
  };

  const handleAddVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCommunity || !formCandidate || !formVotes) return;

    const vCount = parseInt(formVotes);
    if (isNaN(vCount) || vCount < 0) return;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("vote_records")
        .insert([
          {
            community_id: formCommunity,
            candidate_id: formCandidate,
            votes: vCount,
          },
        ])
        .select();

      if (error) {
        alert("Erro ao registrar votos: " + error.message);
        return;
      }

      if (data && data[0]) {
        setVotes([...votes, data[0]]);
      }
    } else {
      const newRec: VoteRecord = {
        id: "vote-" + Date.now(),
        community_id: formCommunity,
        candidate_id: formCandidate,
        votes: vCount,
        recorded_at: new Date().toISOString(),
      };
      setVotes([...votes, newRec]);
    }

    setFormCommunity("");
    setFormCandidate("");
    setFormVotes("");
    setShowModal(false);
  };

  const handleDeleteVote = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("vote_records")
        .delete()
        .eq("id", id);
      if (error) {
        alert("Erro ao excluir: " + error.message);
        return;
      }
    }
    setVotes(votes.filter((v) => v.id !== id));
  };

  const handleUpdateCoordinates = (
    communityId: string,
    lat: number,
    lng: number
  ) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId ? { ...c, latitude: lat, longitude: lng } : c
      )
    );
    if (isSupabaseConfigured && supabase) {
      supabase
        .from("communities")
        .update({ latitude: lat, longitude: lng })
        .eq("id", communityId)
        .then(() => {});
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col animate-pulse">
        <header className="border-b border-slate-800 bg-slate-900/80 h-16 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800" />
            <div className="space-y-1.5">
              <div className="w-36 h-4 rounded bg-slate-800" />
              <div className="w-24 h-2.5 rounded bg-slate-800/60" />
            </div>
          </div>
          <div className="w-32 h-8 rounded-xl bg-slate-800" />
        </header>
        <div className="h-10 bg-slate-900/50 border-b border-slate-800" />
        <main className="max-w-7xl w-full mx-auto px-4 py-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-900/70 border border-slate-800" />
            ))}
          </div>
          <div className="h-72 rounded-3xl bg-slate-900/70 border border-slate-800" />
        </main>
      </div>
    );
  }

  // Get current sections % apuradas from TSE
  const tsePst =
    tseData.governador?.pst ||
    tseData.estadual?.pst ||
    tseData.federal?.pst ||
    (electionYear === "2026" ? "0,00" : "100,00");

  const governorCandidates = tseData.governador?.candidates || [];
  const jeronimo = governorCandidates.find((c) => c.n === "13");
  const acmNeto = governorCandidates.find((c) => c.n === "44");
  const joaoRoma = governorCandidates.find((c) => c.n === "22");

  const robertoCarlos = tseData.focusCandidates?.robertoCarlos;
  const vitorBonfim = tseData.focusCandidates?.vitorBonfim;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight text-white">
                  Painel Eleitoral da Bahia
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-400 text-slate-950">
                  {electionYear}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Sátiro Dias & Cidades Baianas • Apuração Oficial TSE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Year Selector */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => {
                  setElectionYear("2026");
                  loadTseData("2026");
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  electionYear === "2026"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🗳️ 2026 (Atual)
              </button>
              <button
                onClick={() => {
                  setElectionYear("2022");
                  loadTseData("2022");
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  electionYear === "2022"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                📜 2022 (Histórico)
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md shadow-blue-600/25 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Voto</span>
            </button>
          </div>
        </div>
      </header>

      {/* Official TSE Live Banner Bar */}
      <section className="bg-gradient-to-r from-red-950/70 via-slate-900 to-blue-950/70 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold text-[11px] bg-red-500/20 text-red-400 border border-red-500/40 uppercase tracking-wider">
              <Radio className="w-3 h-3 animate-pulse" />
              TSE AO VIVO
            </span>
            <span className="text-slate-300 font-medium">
              Apuração {electionYear} na Bahia: <strong className="text-white font-bold">{tsePst}%</strong> das seções totalizadas
            </span>
          </div>

          <div className="flex items-center gap-3">
            {lastTseUpdate && (
              <span className="text-slate-400 hidden sm:inline text-[11px]">
                Atualizado às <strong className="text-slate-200">{lastTseUpdate}</strong>
              </span>
            )}

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                autoRefresh
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {autoRefresh ? "Auto-refresh: 30s" : "Auto-refresh: Desligado"}
            </button>

            <button
              onClick={() => loadTseData(electionYear)}
              disabled={tseLoading}
              title="Atualizar agora do TSE"
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${tseLoading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-full sm:w-fit overflow-x-auto">
          <button
            onClick={() => setActiveMainTab("bahia")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeMainTab === "bahia"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>🏛️ Bahia Geral (TSE Oficial)</span>
          </button>

          <button
            onClick={() => setActiveMainTab("cidades")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeMainTab === "cidades"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>🌆 Cidades da Bahia</span>
          </button>

          <button
            onClick={() => setActiveMainTab("satiro-dias")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeMainTab === "satiro-dias"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>📍 Sátiro Dias (Comunidades & Fiscais)</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* ========================================================= */}
        {/* TAB 1: BAHIA GERAL (TSE OFICIAL)                         */}
        {/* ========================================================= */}
        {activeMainTab === "bahia" && (
          <div className="space-y-6">
            {/* 4 Executive KPIs (Stripe / Linear Style - 13-dashboard-specialist & 01-master-ui) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: Seções Totalizadas */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg backdrop-blur-md hover:border-slate-700/80 transition group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Seções Apuradas (BA)
                  </span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Radio className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                    {tsePst}%
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {electionYear === "2026" ? "0 de 34.980 urnas" : "34.980 urnas"}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 mt-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${parseFloat(tsePst.replace(",", ".")) || 0}%` }}
                  />
                </div>
              </div>

              {/* KPI 2: Eleitorado Apto */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg backdrop-blur-md hover:border-slate-700/80 transition group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Eleitorado Apto (Bahia)
                  </span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                    11.450.000
                  </span>
                  <span className="text-xs text-purple-400 font-medium">
                    417 municípios
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Maior colégio eleitoral do Nordeste
                </p>
              </div>

              {/* KPI 3: Votos Computados */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg backdrop-blur-md hover:border-slate-700/80 transition group">
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
                    {electionYear === "2026" ? "0" : "9.120.000"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {electionYear === "2026" ? "(0,00%)" : "(79,65%)"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {electionYear === "2026" ? "Aguardando abertura dos boletins de urna" : "Comparecimento no 1º turno"}
                </p>
              </div>

              {/* KPI 4: Abstenção */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg backdrop-blur-md hover:border-slate-700/80 transition group">
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
                    {electionYear === "2026" ? "0,00%" : "20,35%"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {electionYear === "2026" ? "0 eleitores" : "2.330.000 eleitores"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {electionYear === "2026" ? "Taxa de abstenção estimada" : "Taxa consolidada de abstenção"}
                </p>
              </div>
            </div>

            {/* Cargo Filter Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Cargo em disputa:
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCargo("presidente")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedCargo === "presidente"
                      ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-750"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  Presidente da República
                </button>

                <button
                  onClick={() => setSelectedCargo("governador")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedCargo === "governador"
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-750"
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  Governador da Bahia
                </button>

                <button
                  onClick={() => setSelectedCargo("estadual")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedCargo === "estadual"
                      ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-750"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Deputado Estadual (Roberto Carlos)
                </button>

                <button
                  onClick={() => setSelectedCargo("federal")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedCargo === "federal"
                      ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-750"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  Deputado Federal (Vitor Bonfim)
                </button>
              </div>
            </div>

            {/* IF PRESIDENTE SELECTED */}
            {selectedCargo === "presidente" && (
              <PresidentOverview
                electionYear={electionYear}
                tsePresidentBr={tseData.presidenteBr}
                tsePresidentBa={tseData.presidenteBa}
              />
            )}

            {/* IF GOVERNADOR SELECTED: Top Governor Placar */}
            {selectedCargo === "governador" && (
              <div className="space-y-6">
                <div className={`grid grid-cols-1 ${electionYear === "2026" ? "md:grid-cols-2" : "md:grid-cols-3"} gap-4`}>
                  {/* Jerônimo */}
                  <div className="p-5 rounded-3xl bg-slate-900/80 border border-emerald-500/30 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        13 • PT / FE BRASIL
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {jeronimo?.st || (electionYear === "2026" ? "Aguardando apuração" : "2º Turno / Eleito")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3.5 mb-2">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-800 shrink-0 shadow-md shadow-emerald-500/20">
                        <img
                          src="/imagens/jeronimo.png"
                          alt="Jerônimo Rodrigues"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-white">
                          Jerônimo Rodrigues
                        </h3>
                        <p className="text-xs text-emerald-400/80 font-medium mt-0.5">
                          Vice: {jeronimo?.nv || "Geraldo Júnior"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2 pt-2 border-t border-slate-800/80">
                      <span className="text-3xl font-black text-emerald-400 font-mono">
                        {Number(jeronimo?.vap || 0).toLocaleString("pt-BR")}
                      </span>
                      <span className="text-sm font-bold text-slate-400">
                        ({jeronimo?.pvap || "0,00"}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Votos válidos em todo o estado da Bahia
                    </p>
                  </div>

                  {/* ACM Neto */}
                  <div className="p-5 rounded-3xl bg-slate-900/80 border border-blue-500/30 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        44 • UNIÃO / COLIGAÇÃO
                      </span>
                      <span className="text-xs font-bold text-blue-400">
                        {acmNeto?.st || (electionYear === "2026" ? "Aguardando apuração" : "2º Turno")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3.5 mb-2">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500 bg-slate-800 shrink-0 shadow-md shadow-blue-500/20">
                        <img
                          src="/imagens/acm_neto.jpg"
                          alt="ACM Neto"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-white">
                          ACM Neto
                        </h3>
                        <p className="text-xs text-blue-400/80 font-medium mt-0.5">
                          Vice: {acmNeto?.nv || (electionYear === "2026" ? "Zé Cocá" : "Ana Coelho")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2 pt-2 border-t border-slate-800/80">
                      <span className="text-3xl font-black text-blue-400 font-mono">
                        {Number(acmNeto?.vap || 0).toLocaleString("pt-BR")}
                      </span>
                      <span className="text-sm font-bold text-slate-400">
                        ({acmNeto?.pvap || "0,00"}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Votos válidos em todo o estado da Bahia
                    </p>
                  </div>

                  {/* João Roma - apenas 2022 */}
                  {electionYear === "2022" && (
                    <div className="p-5 rounded-3xl bg-slate-900/80 border border-amber-500/30 shadow-lg relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          22 • PL
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {joaoRoma?.st || "Não eleito"}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-white">
                        João Roma
                      </h3>
                      <p className="text-xs text-amber-400/80 font-medium mt-0.5">
                        Vice: {joaoRoma?.nv || "Leonidia Umbelina"}
                      </p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-amber-400 font-mono">
                          {Number(joaoRoma?.vap || 0).toLocaleString("pt-BR")}
                        </span>
                        <span className="text-sm font-bold text-slate-400">
                          ({joaoRoma?.pvap || "0,00"}%)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Votos válidos em todo o estado da Bahia
                      </p>
                    </div>
                  )}
                </div>

                {/* Full Ranking Table for Governor */}
                <TseCandidateRanking
                  candidates={governorCandidates}
                  title={`Apuração Oficial para Governador da Bahia (${electionYear})`}
                  cargoType="governador"
                  highlightNumbers={electionYear === "2026" ? ["13", "44"] : ["13", "44", "22"]}
                  secoesApuradasPct={tsePst}
                />
              </div>
            )}

            {/* IF DEPUTADO ESTADUAL SELECTED */}
            {selectedCargo === "estadual" && (
              <div className="space-y-6">
                {/* Highlight Card for Roberto Carlos (43333) */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border-2 border-amber-400/60 shadow-xl shadow-amber-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full border-4 border-amber-400 p-0.5 shadow-xl shadow-amber-500/30 overflow-hidden bg-slate-800 shrink-0">
                      <img
                        src="/imagens/roberto carlos .jpeg"
                        alt="Roberto Carlos"
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950">
                          43333
                        </span>
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Deputado Estadual • PV / FE BRASIL
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                        Roberto Carlos
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />
                          {robertoCarlos?.st || (electionYear === "2026" ? "Aguardando apuração" : "Eleito por QP")}
                        </span>
                        <span className="text-xs text-slate-400">
                          {electionYear === "2026" ? "Candidatura registrada" : `Posição geral: #${robertoCarlos?.seq || "43"} na Bahia`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center md:text-right bg-slate-950/60 p-4 rounded-2xl border border-slate-800 min-w-[220px]">
                    <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
                      Total Oficial na Bahia (TSE)
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono block">
                      {Number(robertoCarlos?.vap || 0).toLocaleString("pt-BR")}
                    </span>
                    <span className="text-xs text-slate-400 font-medium mt-1 block">
                      {robertoCarlos?.pvap || "0,00"}% dos votos válidos
                    </span>
                  </div>
                </div>

                {/* Ranking table of all state deputies */}
                <TseCandidateRanking
                  candidates={tseData.estadual?.candidates || []}
                  title={`Ranking Geral de Deputados Estaduais da Bahia (${electionYear})`}
                  cargoType="estadual"
                  highlightNumbers={["43333"]}
                  secoesApuradasPct={tsePst}
                />
              </div>
            )}

            {/* IF DEPUTADO FEDERAL SELECTED */}
            {selectedCargo === "federal" && (
              <div className="space-y-6">
                {/* Highlight Card for Vitor Bonfim (4070) */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border-2 border-emerald-400/60 shadow-xl shadow-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-400 p-0.5 shadow-xl shadow-emerald-500/30 overflow-hidden bg-slate-800 shrink-0">
                      <img
                        src="/imagens/vitor bomfim.17.jpeg"
                        alt="Vitor Bonfim"
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-400 text-slate-950">
                          4070
                        </span>
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                          Deputado Federal • PSB
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                        Vitor Bonfim
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />
                          {vitorBonfim?.st || (electionYear === "2026" ? "Aguardando apuração" : "Eleito por QP")}
                        </span>
                        <span className="text-xs text-slate-400">
                          {electionYear === "2026" ? "Candidatura registrada" : `Posição geral: #${vitorBonfim?.seq || "25"} na Bahia`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center md:text-right bg-slate-950/60 p-4 rounded-2xl border border-slate-800 min-w-[220px]">
                    <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
                      Total Oficial na Bahia (TSE)
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono block">
                      {Number(vitorBonfim?.vap || 0).toLocaleString("pt-BR")}
                    </span>
                    <span className="text-xs text-slate-400 font-medium mt-1 block">
                      {vitorBonfim?.pvap || "0,00"}% dos votos válidos
                    </span>
                  </div>
                </div>

                {/* Ranking table of all federal deputies */}
                <TseCandidateRanking
                  candidates={tseData.federal?.candidates || []}
                  title={`Ranking Geral de Deputados Federais da Bahia (${electionYear})`}
                  cargoType="federal"
                  highlightNumbers={["4070"]}
                  secoesApuradasPct={tsePst}
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CIDADES DA BAHIA                                   */}
        {/* ========================================================= */}
        {activeMainTab === "cidades" && (
          <div className="space-y-6">
            <BahiaCitiesOverview electionYear={electionYear} />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SÁTIRO DIAS (COMUNIDADES & FISCAIS)                */}
        {/* ========================================================= */}
        {activeMainTab === "satiro-dias" && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Votes */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total de Votos (Sátiro Dias)
                  </span>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Vote className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-white">
                  {totalVotes.toLocaleString("pt-BR")}
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lançamento local dos fiscais</span>
                </p>
              </div>

              {/* Communities */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Comunidades Mapeadas
                  </span>
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-white">
                  {communities.length}
                </div>
                <p className="text-xs text-slate-500 mt-2 truncate">
                  Santana, Mimoso, Papagaio e outros
                </p>
              </div>

              {/* Candidates Cards */}
              {candidateStats.map((cand, idx) => (
                <div
                  key={cand.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                        {cand.position}
                      </span>
                      <span className="font-bold text-sm text-slate-200">{cand.name}</span>
                    </div>
                    <div
                      className={`p-2 rounded-lg ${
                        idx === 0
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      <Award className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-white">
                      {cand.totalVotes.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      ({cand.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${cand.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Dual Grid: Charts + Sátiro Dias Map */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VotingCharts
                candidates={candidates}
                communities={communities}
                votes={votes}
                selectedCommunityId={selectedCommunityId}
                onSelectCommunity={(id) =>
                  setSelectedCommunityId(selectedCommunityId === id ? null : id)
                }
              />

              <MunicipalityMap
                communities={communities}
                candidates={candidates}
                votes={votes}
                selectedCommunityId={selectedCommunityId}
                onSelectCommunity={(id) =>
                  setSelectedCommunityId(selectedCommunityId === id ? null : id)
                }
                onUpdateCoordinates={handleUpdateCoordinates}
              />
            </section>

            {/* Detailed Community Table */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      Detalhamento por Comunidade em Sátiro Dias
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Clique em uma linha para focar e destacar no mapa
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar comunidade..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-60"
                      />
                    </div>
                    <button
                      onClick={() => setShowAddCommunityModal(true)}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Comunidade</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Comunidade</th>
                        {candidates.map((c) => (
                          <th key={c.id} className="py-3 px-4 text-right">
                            {c.name}
                          </th>
                        ))}
                        <th className="py-3 px-4 text-right">Total Votos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {communityStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={candidates.length + 2}
                            className="py-8 text-center text-slate-500 italic"
                          >
                            Nenhuma comunidade cadastrada.
                          </td>
                        </tr>
                      ) : (
                        communityStats.map((comm) => (
                          <tr
                            key={comm.id}
                            onClick={() =>
                              setSelectedCommunityId(
                                selectedCommunityId === comm.id ? null : comm.id
                              )
                            }
                            className={`cursor-pointer transition-colors ${
                              selectedCommunityId === comm.id
                                ? "bg-blue-600/20 hover:bg-blue-600/25"
                                : "hover:bg-slate-800/40"
                            }`}
                          >
                            <td className="py-3 px-4 font-semibold text-slate-200">
                              {comm.name}
                            </td>
                            {comm.perCandidate.map((pc) => (
                              <td
                                key={pc.candidateId}
                                className="py-3 px-4 text-right text-slate-300 font-mono"
                              >
                                {pc.votes.toLocaleString("pt-BR")}
                              </td>
                            ))}
                            <td className="py-3 px-4 text-right font-bold text-white font-mono">
                              {comm.total.toLocaleString("pt-BR")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* History / Records Feed */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Últimos Registros
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {votes.length} lançamentos
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[350px] space-y-2 pr-1">
                  {votes.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs italic py-8">
                      Nenhum voto lançado ainda.
                    </div>
                  ) : (
                    [...votes].reverse().slice(0, 15).map((v) => {
                      const comm = communities.find((c) => c.id === v.community_id);
                      const cand = candidates.find((c) => c.id === v.candidate_id);
                      return (
                        <div
                          key={v.id}
                          className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-200 block">
                              {comm?.name || "Comunidade"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {cand?.name || "Candidato"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                              +{v.votes}
                            </span>
                            <button
                              onClick={() => handleDeleteVote(v.id)}
                              className="text-slate-500 hover:text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* New Vote Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">
              Lançar Votos
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Registre a apuração de uma comunidade específica.
            </p>

            <form onSubmit={handleAddVote} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Comunidade
                </label>
                <select
                  value={formCommunity}
                  onChange={(e) => setFormCommunity(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Selecione uma comunidade...</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Candidato
                </label>
                <select
                  value={formCandidate}
                  onChange={(e) => setFormCandidate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Selecione um candidato...</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Quantidade de Votos
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ex: 150"
                  value={formVotes}
                  onChange={(e) => setFormVotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20 transition active:scale-95"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Community Modal */}
      {showAddCommunityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">
              Nova Comunidade
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Cadastre uma nova comunidade para receber votos.
            </p>

            <form onSubmit={handleAddCommunity} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Nome da Comunidade
                </label>
                <input
                  type="text"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="mt-4">
                <label className="block text-slate-300 font-medium mb-1.5">
                  Localização no Mapa (Opcional)
                </label>
                <LocationPickerMap 
                  lat={newCommunityLat ? parseFloat(newCommunityLat) : null}
                  lng={newCommunityLng ? parseFloat(newCommunityLng) : null}
                  onChange={(lat, lng) => {
                    setNewCommunityLat(lat.toString());
                    setNewCommunityLng(lng.toString());
                  }}
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 px-1">
                  <span>Lat: {newCommunityLat || "---"}</span>
                  <span>Lng: {newCommunityLng || "---"}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowAddCommunityModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20 transition active:scale-95"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
