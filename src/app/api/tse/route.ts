import { NextResponse } from "next/server";
import { fetchTseData, BAHIA_CITIES_DATA } from "@/lib/tse";

export const revalidate = 30; // ISR cache for 30 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cargo = searchParams.get("cargo") || "all";

  try {
    if (cargo === "3" || cargo === "governador") {
      const data = await fetchTseData("3");
      return NextResponse.json({ success: true, data, cities: BAHIA_CITIES_DATA });
    }

    if (cargo === "6" || cargo === "federal") {
      const data = await fetchTseData("6");
      return NextResponse.json({ success: true, data, cities: BAHIA_CITIES_DATA });
    }

    if (cargo === "7" || cargo === "estadual") {
      const data = await fetchTseData("7");
      return NextResponse.json({ success: true, data, cities: BAHIA_CITIES_DATA });
    }

    // Default: fetch all 3 cargos in parallel
    const [govData, fedData, estData] = await Promise.all([
      fetchTseData("3"),
      fetchTseData("6"),
      fetchTseData("7"),
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
      updatedAt: new Date().toISOString(),
      governador: govData,
      federal: fedData,
      estadual: estData,
      focusCandidates: {
        robertoCarlos: robertoCarlos || {
          n: "43333",
          nm: "ROBERTO CARLOS",
          cc: "PV",
          vap: "57798",
          pvap: "0,73",
          st: "Eleito por QP",
          e: "s",
          seq: "43",
        },
        vitorBonfim: vitorBonfim || {
          n: "4070",
          nm: "VITOR BONFIM",
          cc: "PSB",
          vap: "68043",
          pvap: "0,86",
          st: "Eleito por QP",
          e: "s",
          seq: "25",
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
