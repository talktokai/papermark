#!/usr/bin/env bash
# ==============================================================================
# Script: setup-hetzner-swap.sh
# Purpose: Configure SWAP memory on Hetzner Cloud VPS to prevent OOM server lockups.
# Usage: sudo bash scripts/setup-hetzner-swap.sh [SIZE_IN_GB] (default: 4)
# ==============================================================================

set -euo pipefail

SWAP_SIZE_GB="${1:-4}"
SWAP_FILE="/swapfile"

if [ "$EUID" -ne 0 ]; then
  echo "Error: Este script debe ejecutarse como root (usar sudo)." >&2
  exit 1
fi

echo "=== Comprobando memoria SWAP actual ==="
CURRENT_SWAP=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$CURRENT_SWAP" -gt 0 ]; then
  echo "Ya existe memoria SWAP configurada (${CURRENT_SWAP} MB)."
  free -h
  echo "Si deseas cambiar el tamaño, desactívala primero con: swapoff $SWAP_FILE"
  exit 0
fi

echo "=== Creando archivo SWAP de ${SWAP_SIZE_GB} GB en $SWAP_FILE ==="
# Intentar con fallocate; si falla el filesystem, usar dd
if ! fallocate -l "${SWAP_SIZE_GB}G" "$SWAP_FILE" 2>/dev/null; then
  echo "fallocate falló, intentando con dd..."
  dd if=/dev/zero of="$SWAP_FILE" bs=1M count=$((SWAP_SIZE_GB * 1024)) status=progress
fi

chmod 600 "$SWAP_FILE"
mkswap "$SWAP_FILE"
swapon "$SWAP_FILE"

echo "=== Configurando persistencia en /etc/fstab ==="
if ! grep -q "$SWAP_FILE" /etc/fstab; then
  echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
fi

echo "=== Optimizando parámetros del kernel (swappiness) ==="
# swappiness=10 prioriza el uso de RAM física y usa swap solo cuando es necesario
sysctl vm.swappiness=10
sysctl vm.vfs_cache_pressure=50

if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
  echo "vm.swappiness=10" >> /etc/sysctl.conf
else
  sed -i 's/^vm.swappiness=.*/vm.swappiness=10/' /etc/sysctl.conf
fi

if ! grep -q "vm.vfs_cache_pressure" /etc/sysctl.conf; then
  echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf
else
  sed -i 's/^vm.vfs_cache_pressure=.*/vm.vfs_cache_pressure=50/' /etc/sysctl.conf
fi

echo ""
echo "=== ¡SWAP configurado exitosamente! ==="
free -h
