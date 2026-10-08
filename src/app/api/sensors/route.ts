import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INGEST_API_KEY = process.env.INGEST_API_KEY;

function missingConfig() {
  return !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY;
}

export async function POST(request: NextRequest) {
  if (missingConfig() || !INGEST_API_KEY) {
    return NextResponse.json({ error: "API não configurada" }, { status: 500 });
  }

  const providedKey = request.headers.get("x-api-key");
  if (!providedKey || providedKey !== INGEST_API_KEY) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const temperature = Number(body.temperature);
    const humidity = Number(body.humidity);
    const windKmh = Number(body.wind_kmh);
    const uv = Number(body.uv);
    const pressureHpa = Number(body.pressure_hpa);

    if (![temperature, humidity, windKmh, uv, pressureHpa].every(Number.isFinite)) {
      return NextResponse.json({ error: "Dados dos sensores inválidos" }, { status: 400 });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/weather_readings`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        temperature,
        humidity,
        wind_kmh: windKmh,
        uv: Math.round(uv),
        pressure_hpa: pressureHpa,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Supabase insert failed:", detail);
      return NextResponse.json({ error: "Falha ao salvar no banco" }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({ ok: true, reading: data[0] ?? null });
  } catch (error) {
    console.error("Sensor POST error:", error);
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  if (missingConfig()) {
    return NextResponse.json({ error: "API não configurada" }, { status: 500 });
  }

  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || "288");
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 288, 1), 1000);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/weather_readings?select=id,created_at,temperature,humidity,wind_kmh,uv,pressure_hpa&order=created_at.desc&limit=${limit}`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("Supabase read failed:", detail);
      return NextResponse.json({ error: "Falha ao ler o banco" }, { status: 502 });
    }

    const rows = await response.json();
    rows.reverse();
    return NextResponse.json({ latest: rows.at(-1) ?? null, history: rows });
  } catch (error) {
    console.error("Sensor GET error:", error);
    return NextResponse.json({ error: "Falha ao consultar dados" }, { status: 500 });
  }
}
