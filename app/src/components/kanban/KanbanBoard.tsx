/* eslint-disable react-hooks/immutability -- los shared values de Reanimated se mutan a proposito dentro de los worklets */

import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, type SharedValue } from "react-native-reanimated";
import { useCSSVariable } from "uniwind";
import { formatFecha } from "../../lib/format";
import { ORDEN_ESTADOS, ORDEN_ESTADO_LABELS } from "../../lib/types";
import type { Cliente, OrdenEstado, OrdenTrabajo } from "../../lib/types";

const COLUMN_WIDTH = 268;
const COLUMN_GAP = 12;
const BOARD_PADDING = 0;
const COLUMN_PADDING = 10;
const CARD_WIDTH = COLUMN_WIDTH - COLUMN_PADDING * 2;
const STRIDE = COLUMN_WIDTH + COLUMN_GAP;

export interface KanbanBoardProps {
  ordenes: OrdenTrabajo[];
  clienteMap: Map<number, Cliente>;
  tecnicoMap: Map<number, string>;
  puedeArrastrar: (orden: OrdenTrabajo) => boolean;
  onMove: (orden: OrdenTrabajo, estado: OrdenEstado) => void;
  onOpen: (orden: OrdenTrabajo) => void;
}

export function KanbanBoard({ ordenes, clienteMap, tecnicoMap, puedeArrastrar, onMove, onOpen }: KanbanBoardProps) {
  const [pendientes, setPendientes] = useState<{ source: OrdenTrabajo[]; movimientos: Record<number, OrdenEstado> } | null>(null);
  const dragging = useSharedValue(false);
  const draggingFrom = useSharedValue(-1);
  const hoverIndex = useSharedValue(-1);

  const primary = useCSSVariable("--color-primary") as string;
  const primarySoft = useCSSVariable("--color-primary-soft") as string;
  const surface = useCSSVariable("--color-surface") as string;
  const border = useCSSVariable("--color-border") as string;

  // Los movimientos optimistas solo valen mientras la lista de ordenes no cambie:
  // cuando el padre refresca, se vuelve a la posicion que confirma el servidor.
  const movimientos = useMemo(
    () => (pendientes && pendientes.source === ordenes ? pendientes.movimientos : {}),
    [pendientes, ordenes]
  );

  const porEstado = useMemo(() => {
    const grouped: Record<OrdenEstado, OrdenTrabajo[]> = {
      recibido: [],
      en_progreso: [],
      esperando_repuestos: [],
      terminado: [],
      entregado: [],
    };
    for (const orden of ordenes) {
      grouped[movimientos[orden.id] ?? orden.estado].push(orden);
    }
    return grouped;
  }, [ordenes, movimientos]);

  const handleDrop = useCallback((orden: OrdenTrabajo, index: number) => {
    const estado = ORDEN_ESTADOS[index];
    const actual = movimientos[orden.id] ?? orden.estado;
    if (!estado || estado === actual) return;
    setPendientes({ source: ordenes, movimientos: { ...movimientos, [orden.id]: estado } });
    onMove(orden, estado);
  }, [onMove, movimientos, ordenes]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-1"
      contentContainerStyle={{ padding: BOARD_PADDING, gap: COLUMN_GAP }}
    >
      {ORDEN_ESTADOS.map((estado, index) => (
        <KanbanColumn
          key={estado}
          estado={estado}
          index={index}
          ordenes={porEstado[estado]}
          clienteMap={clienteMap}
          tecnicoMap={tecnicoMap}
          puedeArrastrar={puedeArrastrar}
          onOpen={onOpen}
          onDrop={handleDrop}
          dragging={dragging}
          draggingFrom={draggingFrom}
          hoverIndex={hoverIndex}
          surface={surface}
          border={border}
          primary={primary}
          primarySoft={primarySoft}
        />
      ))}
    </ScrollView>
  );
}

interface KanbanColumnProps {
  estado: OrdenEstado;
  index: number;
  ordenes: OrdenTrabajo[];
  clienteMap: Map<number, Cliente>;
  tecnicoMap: Map<number, string>;
  puedeArrastrar: (orden: OrdenTrabajo) => boolean;
  onOpen: (orden: OrdenTrabajo) => void;
  onDrop: (orden: OrdenTrabajo, index: number) => void;
  dragging: SharedValue<boolean>;
  draggingFrom: SharedValue<number>;
  hoverIndex: SharedValue<number>;
  surface: string;
  border: string;
  primary: string;
  primarySoft: string;
}

function KanbanColumn({
  estado,
  index,
  ordenes,
  clienteMap,
  tecnicoMap,
  puedeArrastrar,
  onOpen,
  onDrop,
  dragging,
  draggingFrom,
  hoverIndex,
  surface,
  border,
  primary,
  primarySoft,
}: KanbanColumnProps) {
  const estilo = useAnimatedStyle(() => {
    const esOrigen = dragging.value && draggingFrom.value === index;
    const esDestino = dragging.value && hoverIndex.value === index;
    return {
      zIndex: esOrigen ? 30 : 0,
      borderColor: esDestino && !esOrigen ? primary : border,
      backgroundColor: esDestino && !esOrigen ? primarySoft : surface,
    };
  });

  return (
    <Animated.View style={[estilo, { width: COLUMN_WIDTH }]} className="overflow-visible rounded-xl border border-border bg-surface">
      <View className="flex-row items-center justify-between border-b border-border px-3 py-2.5">
        <Text className="text-sm font-semibold text-fg">{ORDEN_ESTADO_LABELS[estado]}</Text>
        <View className="min-w-6 items-center rounded-full bg-raised px-2 py-0.5">
          <Text className="text-xs font-medium text-muted">{ordenes.length}</Text>
        </View>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: COLUMN_PADDING, gap: 8 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {ordenes.length === 0 ? (
          <Text className="py-6 text-center text-xs text-subtle">Sin órdenes</Text>
        ) : ordenes.map((orden) => (
          <KanbanCard
            key={orden.id}
            orden={orden}
            index={index}
            cliente={clienteMap.get(orden.cliente_id)}
            tecnico={orden.tecnico_id ? tecnicoMap.get(orden.tecnico_id) : undefined}
            arrastrable={puedeArrastrar(orden)}
            onOpen={onOpen}
            onDrop={onDrop}
            dragging={dragging}
            draggingFrom={draggingFrom}
            hoverIndex={hoverIndex}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

interface KanbanCardProps {
  orden: OrdenTrabajo;
  index: number;
  cliente?: Cliente;
  tecnico?: string;
  arrastrable: boolean;
  onOpen: (orden: OrdenTrabajo) => void;
  onDrop: (orden: OrdenTrabajo, index: number) => void;
  dragging: SharedValue<boolean>;
  draggingFrom: SharedValue<number>;
  hoverIndex: SharedValue<number>;
}

function KanbanCard({ orden, index, cliente, tecnico, arrastrable, onOpen, onDrop, dragging, draggingFrom, hoverIndex }: KanbanCardProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const activa = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(arrastrable)
    .activateAfterLongPress(220)
    .onStart(() => {
      activa.value = true;
      dragging.value = true;
      draggingFrom.value = index;
      hoverIndex.value = index;
      tx.value = 0;
      ty.value = 0;
    })
    .onUpdate((event) => {
      tx.value = event.translationX;
      ty.value = event.translationY;
      const centro = BOARD_PADDING + index * STRIDE + COLUMN_PADDING + CARD_WIDTH / 2 + event.translationX;
      const destino = Math.round((centro - BOARD_PADDING - COLUMN_WIDTH / 2) / STRIDE);
      hoverIndex.value = Math.max(0, Math.min(ORDEN_ESTADOS.length - 1, destino));
    })
    .onEnd(() => {
      runOnJS(onDrop)(orden, hoverIndex.value);
    })
    .onFinalize(() => {
      activa.value = false;
      dragging.value = false;
      draggingFrom.value = -1;
      hoverIndex.value = -1;
      tx.value = 0;
      ty.value = 0;
    });

  const estilo = useAnimatedStyle(() => ({
    transform: [
      { translateX: activa.value ? tx.value : 0 },
      { translateY: activa.value ? ty.value : 0 },
      { scale: activa.value ? 1.04 : 1 },
    ],
    zIndex: activa.value ? 40 : 1,
    opacity: activa.value ? 0.95 : 1,
    shadowOpacity: activa.value ? 0.25 : 0,
    elevation: activa.value ? 8 : 0,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={estilo}>
        <Pressable onPress={() => onOpen(orden)} className="gap-2 rounded-lg border border-border bg-canvas p-3 active:border-border-strong">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-sm font-semibold text-fg" numberOfLines={2}>{orden.descripcion}</Text>
          </View>
          <Text className="text-xs text-muted" numberOfLines={1}>{cliente?.nombre ?? "Sin cliente"}</Text>
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-[11px] text-subtle" numberOfLines={1}>{tecnico ? `Técnico: ${tecnico}` : "Sin técnico asignado"}</Text>
            <Text className="text-[11px] text-subtle">{formatFecha(orden.fecha_recibido)}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}
