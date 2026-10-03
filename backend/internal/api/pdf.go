package api

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"

	"motek/internal/store"
)

func (s *Server) handleFacturaPDF(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	detalle, err := s.Store.GetFacturaDetalle(r.Context(), id)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"factura-%d.pdf\"", id))
	if err := facturaPDF(detalle).Output(w); err != nil {
		s.Log.Error("generar pdf de factura", "err", err)
	}
}

func facturaPDF(d store.FacturaDetalle) *fpdf.Fpdf {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(18, 16, 18)
	pdf.SetAutoPageBreak(true, 18)
	pdf.AddPage()
	tr := pdf.UnicodeTranslatorFromDescriptor("cp1252")

	pdf.SetFont("Helvetica", "B", 18)
	pdf.CellFormat(0, 8, "MOTEK", "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 9)
	pdf.SetTextColor(110, 110, 110)
	pdf.CellFormat(0, 4, tr("Taller de motos - Av. Colon 1234, Cordoba - Tel. 351 555-0100"), "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 4, "hola@motek.local", "", 1, "L", false, 0, "")
	pdf.SetTextColor(0, 0, 0)
	pdf.Ln(4)

	pdf.SetFont("Helvetica", "B", 15)
	pdf.CellFormat(0, 8, tr(fmt.Sprintf("Factura #%d", d.Factura.ID)), "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.CellFormat(0, 5, tr(fmt.Sprintf("Emitida el %s - Estado: %s", d.Factura.FechaEmision.Format("02/01/2006"), d.Factura.Estado)), "", 1, "L", false, 0, "")
	if d.Factura.FechaVencimiento != nil {
		pdf.CellFormat(0, 5, tr(fmt.Sprintf("Vencimiento: %s", d.Factura.FechaVencimiento.Format("02/01/2006"))), "", 1, "L", false, 0, "")
	}
	if d.Factura.Estado == "cancelada" {
		pdf.SetTextColor(180, 30, 30)
		pdf.SetFont("Helvetica", "B", 10)
		pdf.CellFormat(0, 6, "FACTURA CANCELADA", "", 1, "L", false, 0, "")
		pdf.SetTextColor(0, 0, 0)
	}
	pdf.Ln(3)

	datosCliente := []string{d.Cliente.Nombre}
	if d.Cliente.Telefono != "" {
		datosCliente = append(datosCliente, "Tel. "+d.Cliente.Telefono)
	}
	if d.Cliente.Email != "" {
		datosCliente = append(datosCliente, d.Cliente.Email)
	}
	if d.Cliente.Direccion != "" {
		datosCliente = append(datosCliente, d.Cliente.Direccion)
	}
	datosMoto := []string{strings.TrimSpace(d.Moto.Marca + " " + d.Moto.Modelo)}
	if d.Moto.Placa != "" {
		datosMoto = append(datosMoto, "Placa "+d.Moto.Placa)
	}
	if d.Moto.Color != "" {
		datosMoto = append(datosMoto, "Color "+d.Moto.Color)
	}
	if d.Moto.Kilometraje > 0 {
		datosMoto = append(datosMoto, fmt.Sprintf("%d km", d.Moto.Kilometraje))
	}
	bloqueDosColumnas(pdf, tr, "Cliente", "Moto", datosCliente, datosMoto)

	pdf.Ln(4)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.CellFormat(0, 6, tr(fmt.Sprintf("Orden #%d", d.Orden.ID)), "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.MultiCell(0, 5, tr(d.Orden.Descripcion), "", "L", false)

	pdf.Ln(4)
	pdf.SetFillColor(238, 240, 243)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.CellFormat(96, 7, tr("Descripcion"), "1", 0, "L", true, 0, "")
	pdf.CellFormat(16, 7, "Cant.", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 7, tr("P. unitario"), "1", 0, "R", true, 0, "")
	pdf.CellFormat(32, 7, "Subtotal", "1", 1, "R", true, 0, "")

	pdf.SetFont("Helvetica", "", 10)
	fila := func(descripcion string, cantidad int, precio, subtotal int64) {
		pdf.CellFormat(96, 7, tr(descripcion), "LR", 0, "L", false, 0, "")
		pdf.CellFormat(16, 7, strconv.Itoa(cantidad), "LR", 0, "C", false, 0, "")
		pdf.CellFormat(30, 7, tr(formatoPesos(precio)), "LR", 0, "R", false, 0, "")
		pdf.CellFormat(32, 7, tr(formatoPesos(subtotal)), "LR", 1, "R", false, 0, "")
	}
	fila("Mano de obra", 1, d.Factura.SubtotalManoObra, d.Factura.SubtotalManoObra)
	for _, linea := range d.Lineas {
		fila(linea.Descripcion, linea.Cantidad, linea.PrecioUnitario, linea.Subtotal)
	}
	x, y := pdf.GetX(), pdf.GetY()
	pdf.Line(x, y, x+174, y)
	pdf.Ln(3)

	lineaMonto := func(etiqueta string, valor int64, negrita bool) {
		estilo := ""
		if negrita {
			estilo = "B"
		}
		pdf.SetFont("Helvetica", estilo, 10)
		pdf.CellFormat(126, 6, "", "", 0, "L", false, 0, "")
		pdf.CellFormat(28, 6, tr(etiqueta), "", 0, "R", false, 0, "")
		pdf.CellFormat(20, 6, tr(formatoPesos(valor)), "", 1, "R", false, 0, "")
	}
	lineaMonto("Mano de obra", d.Factura.SubtotalManoObra, false)
	lineaMonto("Repuestos", d.Factura.SubtotalRepuestos, false)
	lineaMonto("TOTAL", d.Factura.Total, true)
	lineaMonto("Pagado", d.Pagado, false)
	lineaMonto("Saldo", d.Factura.Total-d.Pagado, true)

	if strings.TrimSpace(d.Factura.Notas) != "" {
		pdf.Ln(4)
		pdf.SetFont("Helvetica", "B", 10)
		pdf.CellFormat(0, 5, "Notas", "", 1, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 10)
		pdf.MultiCell(0, 5, tr(d.Factura.Notas), "", "L", false)
	}

	pdf.Ln(6)
	pdf.SetFont("Helvetica", "I", 8)
	pdf.SetTextColor(120, 120, 120)
	pdf.CellFormat(0, 4, tr("Importes en pesos. Documento interno del taller; no valido como factura fiscal."), "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 4, tr("Generado el "+time.Now().Format("02/01/2006 15:04")), "", 1, "L", false, 0, "")

	return pdf
}

func bloqueDosColumnas(pdf *fpdf.Fpdf, tr func(string) string, tituloIzq, tituloDer string, izq, der []string) {
	pdf.SetFont("Helvetica", "B", 10)
	pdf.CellFormat(87, 6, tr(tituloIzq), "", 0, "L", false, 0, "")
	pdf.CellFormat(87, 6, tr(tituloDer), "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	filas := len(izq)
	if len(der) > filas {
		filas = len(der)
	}
	for i := 0; i < filas; i++ {
		textoIzq, textoDer := "", ""
		if i < len(izq) {
			textoIzq = izq[i]
		}
		if i < len(der) {
			textoDer = der[i]
		}
		pdf.CellFormat(87, 5.5, tr(textoIzq), "", 0, "L", false, 0, "")
		pdf.CellFormat(87, 5.5, tr(textoDer), "", 1, "L", false, 0, "")
	}
}

func formatoPesos(n int64) string {
	negativo := n < 0
	if negativo {
		n = -n
	}
	s := strconv.FormatInt(n, 10)
	var partes []string
	for len(s) > 3 {
		partes = append([]string{s[len(s)-3:]}, partes...)
		s = s[:len(s)-3]
	}
	partes = append([]string{s}, partes...)
	out := "$ " + strings.Join(partes, ".")
	if negativo {
		out = "-" + out
	}
	return out
}
