import { NextResponse } from "next/server";
import {
  fetchTseData,
  BAHIA_CITIES_DATA,
  getBrazilStatesPresidentData,
} from "@/lib/tse";

export const revalidate = 30; // ISR cache for 30 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cargo = searchParams.get("cargo") || "all";
  const uf = (searchParams.get("uf")?.toLowerCase() === "br" ? "br" : "ba") as "br" | "ba";
  const ano = (searchParams.get("ano") === "2022" ? "2022" : "2026") as "2026" | "2022";

  try {
    if (cargo === "1" || cargo === "presidente") {
      const data = await fetchTseData("1", ano, uf);
      const states = getBrazilStatesPresidentData(ano);
      return NextResponse.json({
        success: true,
        ano,
        cargo: "presidente",
        uf,
        data,
        states,
        cities: BAHIA_CITIES_DATA,
      });
    }

    if (cargo === "3" || cargo === "governador") {
      const data = await fetchTseData("3", ano);
      return NextResponse.json({ success: true, ano, data, cities: BAHIA_CITIES_DATA });
    }

    if (cargo === "6" || cargo === "federal") {
      const data = await fetchTseData("6", ano);
      return NextResponse.json({ success: true, ano, data, cities: BAHIA_CITIES_DATA });
    }

    if (cargo === "7" || cargo === "estadual") {
      const data = await fetchTseData("7", ano);
      return NextResponse.json({ success: true, ano, data, cities: BAHIA_CITIES_DATA });
    }

    // Default: fetch all in parallel for the chosen year
    const [presBrData, presBaData, govData, fedData, estData] = await Promise.all([
      fetchTseData("1", ano, "br"),
      fetchTseData("1", ano, "ba"),
      fetchTseData("3", ano),
      fetchTseData("6", ano),
      fetchTseData("7", ano),
    ]);

    // Find our focus candidates
    const robertoCarlos = estData?.candidates.find(
      (c) => c.n === "43333" || c.nm.toUpperCase().includes("ROBERTO CARLOS")
    );

    const vitorBonfim = fedData?.candidates.find(
      (c) => c.n === "4070" || c.nm.toUpperCase().includes("VITOR BONFIM") || c.nm.toUpperCase().includes("VITOR BOMFIM")
    );

    const states = getBrazilStatesPresidentData(ano);

    return NextResponse.json({
      success: true,
      ano,
      updatedAt: new Date().toISOString(),
      presidenteBr: presBrData,
      presidenteBa: presBaData,
      governador: govData,
      federal: fedData,
      estadual: estData,
      states,
      focusCandidates: {
        robertoCarlos: robertoCarlos || {
          n: "43333",
          nm: "ROBERTO CARLOS",
          cc: "PV - Federação Brasil da Esperança",
          vap: ano === "2026" ? "0" : "57798",
          pvap: ano === "2026" ? "0,00" : "0,73",
          st: ano === "2026" ? "Aguardando apuração" : "Eleito por QP",
          e: ano === "2026" ? "n" : "s",
          seq: "1",
        },
        vitorBonfim: vitorBonfim || {
          n: "4070",
          nm: "VITOR BONFIM",
          cc: "PSB",
          vap: ano === "2026" ? "0" : "68043",
          pvap: ano === "2026" ? "0,00" : "0,86",
          st: ano === "2026" ? "Aguardando apuração" : "Eleito por QP",
          e: ano === "2026" ? "n" : "s",
          seq: "1",
        },
      },
      cities: BAHIA_CITIES_DATA,
    });
  } catch (error: any) {
    console.error("Erro na rota /api/tse:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao carregar apuração do TSE" },
      { status: 500 }
    );
  }
}
