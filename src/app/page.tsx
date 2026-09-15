"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  VoteRecord,
  Candidate,
  Community,
  supabase,
  isSupabaseConfigured,
} from "@/lib/supabase";
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
} from "lucide-react";
import MunicipalityMap from "@/components/MunicipalityMap";
import VotingCharts from "@/components/VotingCharts";
import LocationPickerMap from "@/components/LocationPickerMap";

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

  useEffect(() => {
    if (isSupabaseConfigured) {
      loadData();
    }
  }, []);

  // Compute metrics
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
      const { data, error } = await supabase.from("communities").insert([
        { name: newCommunityName, latitude: lat, longitude: lng },
      ]).select();

      if (!error && data) {
        setCommunities((prev) => [...prev, ...data]);
      }
    } else {
      const newComm: Community = {
        id: `mock-comm-${Date.now()}`,
        name: newCommunityName,
        latitude: lat,
        longitude: lng,
      };
      setCommunities((prev) => [...prev, newComm]);
    }

    setNewCommunityName("");
    setNewCommunityLat("");
    setNewCommunityLng("");
    setShowAddCommunityModal(false);
  };

  const handleDeleteCommunity = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent row click
    if (!confirm("Tem certeza que deseja excluir esta comunidade? Todos os votos associados serão apagados.")) return;

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("communities").delete().eq("id", id);
      
      if (error) {
        console.error("Erro ao excluir:", error);
        alert("Ops! Ocorreu um erro de permissão no banco de dados. Você precisa autorizar a exclusão (DELETE) nas regras do Supabase.");
        return; // Stop here, don't update local state
      }
    }
    
    // Only update local state if the database deletion succeeded
    setCommunities((prev) => prev.filter((c) => c.id !== id));
    setVotes((prev) => prev.filter((v) => v.community_id !== id));
    if (selectedCommunityId === id) setSelectedCommunityId(null);
  };


  const handleAddVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCommunity || !formCandidate || !formVotes) return;

    const numVotes = parseInt(formVotes, 10);
    if (isNaN(numVotes) || numVotes < 0) return;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("vote_records").insert([
        {
          community_id: formCommunity,
          candidate_id: formCandidate,
          votes: numVotes,
        },
      ]).select();

      if (!error && data) {
        setVotes((prev) => [...prev, ...data]);
      }
    } else {
      // Local state fallback
      const newRecord: VoteRecord = {
        id: `mock-${Date.now()}`,
        community_id: formCommunity,
        candidate_id: formCandidate,
        votes: numVotes,
        recorded_at: new Date().toISOString(),
      };
      setVotes((prev) => [...prev, newRecord]);
    }

    setFormVotes("");
    setShowModal(false);
  };

  const handleUpdateCoordinates = (communityId: string, lat: number, lng: number) => {
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">
                Painel de Votos
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Município de Sátiro Dias - BA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/70 border border-slate-700/60">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConfigured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="hidden sm:inline">
                {isSupabaseConfigured ? "Supabase Conectado" : "Modo Demonstração"}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all border border-slate-700 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-600/25 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Registro</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Votes */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total de Votos
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
              <span>Contabilização em tempo real</span>
            </p>
          </div>

          {/* Communities */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Comunidades
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

        {/* Dynamic Dual Grid: Gráfico Estatístico + Mapa do Município */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Votação */}
          <VotingCharts
            candidates={candidates}
            communities={communities}
            votes={votes}
            selectedCommunityId={selectedCommunityId}
            onSelectCommunity={(id) =>
              setSelectedCommunityId(selectedCommunityId === id ? null : id)
            }
          />

          {/* Mapa Geográfico de Sátiro Dias */}
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

        {/* Detailed Table & Sidebar Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Table */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Detalhamento por Comunidade
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
                    className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition w-44 sm:w-56"
                  />
                </div>
                <button
                  onClick={() => setShowAddCommunityModal(true)}
                  className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg border border-slate-700 transition"
                  title="Nova Comunidade"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/60">
                  <tr>
                    <th className="px-4 py-3">Comunidade</th>
                    <th className="px-4 py-3">Roberto Carlos (Estadual)</th>
                    <th className="px-4 py-3">Vitor Bomfim (Federal)</th>
                    <th className="px-4 py-3 text-right">Total Acumulado</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {communityStats.map((comm) => {
                    const rcVotes =
                      comm.perCandidate.find((c) => c.name.includes("Roberto"))?.votes || 0;
                    const vbVotes =
                      comm.perCandidate.find((c) => c.name.includes("Vitor"))?.votes || 0;
                    const isSelected = selectedCommunityId === comm.id;

                    return (
                      <tr
                        key={comm.id}
                        onClick={() =>
                          setSelectedCommunityId(
                            selectedCommunityId === comm.id ? null : comm.id
                          )
                        }
                        className={`cursor-pointer transition ${
                          isSelected
                            ? "bg-blue-600/20 text-white border-l-4 border-blue-500"
                            : "hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="px-4 py-3.5 font-semibold text-slate-100 flex items-center gap-2">
                          <MapPin
                            className={`w-3.5 h-3.5 ${
                              isSelected ? "text-blue-400" : "text-slate-500"
                            }`}
                          />
                          <span>{comm.name}</span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-amber-300">
                          {rcVotes.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-emerald-300">
                          {vbVotes.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-100 text-right">
                          {comm.total.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={(e) => handleDeleteCommunity(e, comm.id)}
                            className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                            title="Excluir Comunidade"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Info Sidebar */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight mb-1">
                Informações do Sistema
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Parâmetros e integração de dados
              </p>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-1.5">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-400" />
                    Banco de Dados
                  </div>
                  <p className="text-slate-400">
                    O esquema do banco foi criado para PostgreSQL no Supabase com suporte a RLS e auditoria.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-1.5">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Cargos & Candidatos
                  </div>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li>Roberto Carlos (Estadual)</li>
                    <li>Vitor Bomfim (Federal)</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-1.5">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Localidades Registradas
                  </div>
                  <p className="text-slate-400">
                    {communities.length} polos principais de Sátiro Dias com geolocalização cadastrada.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <button
                onClick={loadData}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700 active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Atualizar Dados</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Add Vote Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">
              Lançar Novo Voto
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Informe os dados da localidade e a quantidade de votos obtida
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
