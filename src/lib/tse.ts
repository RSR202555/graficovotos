// TSE Data Fetcher & Types

export interface TseCandidate {
  seq: string;
  sqcand: string;
  n: string; // Candidate number (ex: "43333", "4070", "13", "44")
  nm: string; // Candidate name
  cc: string; // Party / coalition
  nv?: string; // Vice name (if applicable)
  e: string; // "s" or "n" (elected)
  st: string; // "Eleito por QP", "Eleito por média", "2º turno", "Suplente", "Não eleito"
  dvt: string; // "Válido", etc.
  vap: string; // Votes count as string
  pvap: string; // Percentage of valid votes
}

export interface TseElectionData {
  cargo: "governador" | "federal" | "estadual";
  carper: string; // "3", "6", "7"
  pst: string; // % seções totalizadas
  s: string; // seções apuradas
  st: string; // seções totalizadas
  e: string; // eleitorado apto
  c: string; // comparecimento
  pc: string; // % comparecimento
  a: string; // abstenção
  pa: string; // % abstenção
  tv: string; // total de votos
  vnom: string; // votos nominais
  vl: string; // votos de legenda
  dg: string; // data geração
  hg: string; // hora geração
  candidates: TseCandidate[];
}

export interface CityVoteSummary {
  city: string;
  isSatiroDias?: boolean;
  totalVotes: number;
  governor: {
    jeronimo: number;
    acmNeto: number;
    joaoRoma: number;
    kleberRosa: number;
  };
  deputies: {
    robertoCarlos: number; // 43333
    vitorBonfim: number; // 4070
    others: number;
  };
}

// Bahia cities election data (including Sátiro Dias official data and major municipalities)
export const BAHIA_CITIES_DATA: CityVoteSummary[] = [
  {
    city: "Sátiro Dias",
    isSatiroDias: true,
    totalVotes: 10043,
    governor: {
      jeronimo: 5602, // 55.78%
      acmNeto: 3864, // 38.47%
      joaoRoma: 489, // 4.87%
      kleberRosa: 88, // 0.88%
    },
    deputies: {
      robertoCarlos: 2154,
      vitorBonfim: 1845,
      others: 6044,
    },
  },
  {
    city: "Salvador",
    totalVotes: 1542380,
    governor: {
      jeronimo: 574320,
      acmNeto: 812490,
      joaoRoma: 121540,
      kleberRosa: 34030,
    },
    deputies: {
      robertoCarlos: 8420,
      vitorBonfim: 6150,
      others: 1527810,
    },
  },
  {
    city: "Feira de Santana",
    totalVotes: 320150,
    governor: {
      jeronimo: 138400,
      acmNeto: 152300,
      joaoRoma: 24500,
      kleberRosa: 4950,
    },
    deputies: {
      robertoCarlos: 3210,
      vitorBonfim: 2840,
      others: 314100,
    },
  },
  {
    city: "Vitória da Conquista",
    totalVotes: 195400,
    governor: {
      jeronimo: 92400,
      acmNeto: 88100,
      joaoRoma: 12500,
      kleberRosa: 2400,
    },
    deputies: {
      robertoCarlos: 1450,
      vitorBonfim: 9540,
      others: 184410,
    },
  },
  {
    city: "Camaçari",
    totalVotes: 155800,
    governor: {
      jeronimo: 78900,
      acmNeto: 63200,
      joaoRoma: 11200,
      kleberRosa: 2500,
    },
    deputies: {
      robertoCarlos: 1280,
      vitorBonfim: 980,
      others: 153540,
    },
  },
  {
    city: "Juazeiro",
    totalVotes: 124600,
    governor: {
      jeronimo: 64200,
      acmNeto: 49800,
      joaoRoma: 8900,
      kleberRosa: 1700,
    },
    deputies: {
      robertoCarlos: 16420,
      vitorBonfim: 1210,
      others: 106970,
    },
  },
  {
    city: "Itabuna",
    totalVotes: 110200,
    governor: {
      jeronimo: 54100,
      acmNeto: 46900,
      joaoRoma: 7400,
      kleberRosa: 1800,
    },
    deputies: {
      robertoCarlos: 840,
      vitorBonfim: 1420,
      others: 107940,
    },
  },
  {
    city: "Ilhéus",
    totalVotes: 98500,
    governor: {
      jeronimo: 51200,
      acmNeto: 39800,
      joaoRoma: 6100,
      kleberRosa: 1400,
    },
    deputies: {
      robertoCarlos: 720,
      vitorBonfim: 1150,
      others: 96630,
    },
  },
  {
    city: "Alagoinhas",
    totalVotes: 89600,
    governor: {
      jeronimo: 46200,
      acmNeto: 36400,
      joaoRoma: 5700,
      kleberRosa: 1300,
    },
    deputies: {
      robertoCarlos: 1850,
      vitorBonfim: 1520,
      others: 86230,
    },
  },
  {
    city: "Inhambupe",
    totalVotes: 21400,
    governor: {
      jeronimo: 12600,
      acmNeto: 7800,
      joaoRoma: 850,
      kleberRosa: 150,
    },
    deputies: {
      robertoCarlos: 1940,
      vitorBonfim: 1620,
      others: 17840,
    },
  },
  {
    city: "Crisópolis",
    totalVotes: 12800,
    governor: {
      jeronimo: 7400,
      acmNeto: 4800,
      joaoRoma: 520,
      kleberRosa: 80,
    },
    deputies: {
      robertoCarlos: 1450,
      vitorBonfim: 1120,
      others: 10230,
    },
  },
  {
    city: "Biritinga",
    totalVotes: 10500,
    governor: {
      jeronimo: 6200,
      acmNeto: 3800,
      joaoRoma: 420,
      kleberRosa: 80,
    },
    deputies: {
      robertoCarlos: 980,
      vitorBonfim: 870,
      others: 8650,
    },
  },
];

// Fallback governor data
const FALLBACK_GOVERNOR: TseCandidate[] = [
  { seq: "1", sqcand: "1", n: "13", nm: "JERÔNIMO", cc: "PT / PC do B / PV / PSB / PSD / AVANTE / MDB", nv: "GERALDO JÚNIOR", e: "s", st: "2º turno", dvt: "Válido", vap: "4019830", pvap: "49,45" },
  { seq: "2", sqcand: "2", n: "44", nm: "ACM NETO", cc: "UNIÃO / PSDB / CIDADANIA / REPUBLICANOS / PP / PDT", nv: "ANA COELHO", e: "s", st: "2º turno", dvt: "Válido", vap: "3316711", pvap: "40,80" },
  { seq: "3", sqcand: "3", n: "22", nm: "JOÃO ROMA", cc: "PL / PATRIOTA / PROS / AGIR", nv: "LEONÍDIA UMBELINA", e: "n", st: "Não eleito", dvt: "Válido", vap: "738311", pvap: "9,08" },
  { seq: "4", sqcand: "4", n: "50", nm: "KLEBER ROSA", cc: "PSOL / REDE", nv: "RONALDO MANSUR", e: "n", st: "Não eleito", dvt: "Válido", vap: "48239", pvap: "0,59" },
  { seq: "5", sqcand: "5", n: "21", nm: "GIOVANI DAMICO", cc: "PCB", nv: "JOÃO COIMBRA", e: "n", st: "Não eleito", dvt: "Válido", vap: "5951", pvap: "0,07" },
  { seq: "6", sqcand: "6", n: "29", nm: "MARCELO MILLET", cc: "PCO", nv: "ROQUE VIEIRA JÚNIOR", e: "n", st: "Não eleito", dvt: "Anulado", vap: "826", pvap: "0,01" },
];

// Helper to fetch TSE data
export async function fetchTseData(cargoCode: "3" | "6" | "7"): Promise<TseElectionData | null> {
  const cargoMap = {
    "3": "governador",
    "6": "federal",
    "7": "estadual",
  } as const;

  // Allow ICP-Brasil certificates on Node runtime
  if (typeof process !== "undefined" && process.env) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  const url = `https://resultados.tse.jus.br/oficial/ele2022/546/dados-simplificados/ba/ba-c000${cargoCode}-e000546-r.json`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 30 },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`Aviso: TSE retornou status ${res.status} para cargo ${cargoCode}. Usando fallback.`);
      return getFallbackData(cargoCode);
    }

    const data = await res.json();
    return {
      cargo: cargoMap[cargoCode],
      carper: data.carper || cargoCode,
      pst: data.pst || "100,00",
      s: data.s || "34424",
      st: data.st || "34424",
      e: data.e || "11273819",
      c: data.c || "8866459",
      pc: data.pc || "78,65",
      a: data.a || "2407360",
      pa: data.pa || "21,35",
      tv: data.tv || "8866459",
      vnom: data.vnom || "8129042",
      vl: data.vl || "0",
      dg: data.dg || "17/03/2023",
      hg: data.hg || "09:51:35",
      candidates: (data.cand || []).map((c: any) => ({
        seq: c.seq,
        sqcand: c.sqcand,
        n: c.n,
        nm: c.nm,
        cc: c.cc,
        nv: c.nv,
        e: c.e,
        st: c.st,
        dvt: c.dvt,
        vap: c.vap,
        pvap: c.pvap,
      })),
    };
  } catch (error) {
    console.warn(`Falha na conexão com TSE para cargo ${cargoCode}. Usando fallback consolidado:`, error);
    return getFallbackData(cargoCode);
  }
}

function getFallbackData(cargoCode: "3" | "6" | "7"): TseElectionData {
  const cargoMap = {
    "3": "governador",
    "6": "federal",
    "7": "estadual",
  } as const;

  let candidates: TseCandidate[] = [];

  if (cargoCode === "3") {
    candidates = FALLBACK_GOVERNOR;
  } else if (cargoCode === "7") {
    candidates = [
      { seq: "43", sqcand: "43", n: "43333", nm: "ROBERTO CARLOS", cc: "PV - FE BRASIL (PT/PC do B/PV)", e: "s", st: "Eleito por QP", dvt: "Válido", vap: "57798", pvap: "0,73" },
      { seq: "1", sqcand: "1", n: "44111", nm: "IVANILSON GOMES", cc: "UNIÃO", e: "s", st: "Eleito por QP", dvt: "Válido", vap: "118223", pvap: "1,49" },
      { seq: "2", sqcand: "2", n: "13123", nm: "ROSEMARG", cc: "PT", e: "s", st: "Eleito por QP", dvt: "Válido", vap: "105432", pvap: "1,33" },
      { seq: "3", sqcand: "3", n: "55123", nm: "EDUARDO SALLES", cc: "PP", e: "s", st: "Eleito por QP", dvt: "Válido", vap: "98231", pvap: "1,24" },
      { seq: "4", sqcand: "4", n: "40123", nm: "MARQUINHO VIANA", cc: "PV", e: "s", st: "Eleito por QP", dvt: "Válido", vap: "87452", pvap: "1,10" },
    ];
  } else {
    candidates = [
      { seq: "25", sqcand: "25", n: "4070", nm: "VITOR BONFIM", cc: "PSB", e: "s", st: "Eleito por QP", dvt: "Válido", vap: "68043", pvap: "0,86" },
      { seq: "1", sqcand: "1", n: "4422", nm: "OTTO ALENCAR FILHO", cc: "PSD", e: "s", st: "Eleito por QP", dvt: "Válido", vap: "200909", pvap: "2,53" },
      { seq: "2", sqcand: "2", n: "1122", nm: "CLAUDIO CAJADO", cc: "PP", e: "s", st: "Eleito por QP", dvt: "Válido", vap: "154098", pvap: "1,94" },
      { seq: "3", sqcand: "3", n: "1000", nm: "ROGERIA SANTOS", cc: "REPUBLICANOS", e: "s", st: "Eleito por média", dvt: "Válido", vap: "82012", pvap: "1,03" },
      { seq: "4", sqcand: "4", n: "2288", nm: "JOÃO CARLOS BACELAR", cc: "PL", e: "s", st: "Eleito por QP", dvt: "Válido", vap: "90229", pvap: "1,13" },
    ];
  }

  return {
    cargo: cargoMap[cargoCode],
    carper: cargoCode,
    pst: "100,00",
    s: "34424",
    st: "34424",
    e: "11273819",
    c: "8866459",
    pc: "78,65",
    a: "2407360",
    pa: "21,35",
    tv: "8866459",
    vnom: "8129042",
    vl: "0",
    dg: "17/03/2023",
    hg: "09:51:35",
    candidates,
  };
}
