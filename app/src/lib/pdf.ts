import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { apiUrl, getToken } from "./api";

export async function abrirFacturaPDF(facturaId: number): Promise<void> {
  const path = `/api/facturas/${facturaId}/pdf`;
  const token = await getToken();

  if (Platform.OS === "web") {
    const res = await fetch(apiUrl(path), { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (!res.ok) throw new Error("No se pudo generar el PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const destino = new File(Paths.cache, `factura-${facturaId}.pdf`);
  const archivo = await File.downloadFileAsync(apiUrl(path), destino, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    idempotent: true,
  });
  await Sharing.shareAsync(archivo.uri, {
    mimeType: "application/pdf",
    dialogTitle: `Factura #${facturaId}`,
  });
}
