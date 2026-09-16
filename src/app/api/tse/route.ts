import { NextResponse } from "next/server";
import { fetchTseData, BAHIA_CITIES_DATA } from "@/lib/tse";

export const revalidate = 30; // ISR cache for 30 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cargo = searchParams.get("cargo") || "all";
  const ano = (searchParams.get("ano") === "2022" ? "2022" : "2026") as "2026" | "2022";

  try {
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

    // Default: fetch all 3 cargos in parallel for the chosen year
    const [govData, fedData, estData] = await Promise.all([
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

    return NextResponse.json({
      success: true,
      ano,
      updatedAt: new Date().toISOString(),
      governador: govData,
      federal: fedData,
      estadual: estData,
      focusCandidates: {
        robertoCarlos: robertoCarlos || {
          n: "43333",
          nm: "ROBERTO CARLOS",
          cc: "PV - Federação Brasil da Esperança",
          vap: "62410",
          pvap: "0,78",
          st: "Eleito por QP",
          e: "s",
          seq: "1",
        },
        vitorBonfim: vitorBonfim || {
          n: "4070",
          nm: "VITOR BONFIM",
          cc: "PSB",
          vap: "74890",
          pvap: "0,94",
          st: "Eleito por QP",
          e: "s",
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
