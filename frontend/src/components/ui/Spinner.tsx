import { Loader2 } from "lucide-react"

// El giro se apaga con la preferencia de movimiento reducido. No se pierde estado:
// el control que dispara la acción ya lleva `aria-busy` y el texto sigue visible.
export function Spinner() {
  return <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
}
