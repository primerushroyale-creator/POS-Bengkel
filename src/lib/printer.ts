import { Transaction } from '@/types';
import { formatRupiah, formatDateIndo } from './utils';

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';

export interface PrinterConfig {
  workshopName: string;
  address: string;
  phone: string;
  paperWidth: '58' | '80'; // 58mm = 32 chars, 80mm = 48 chars
  footerMessage: string;
}

export const defaultPrinterConfig: PrinterConfig = {
  workshopName: process.env.NEXT_PUBLIC_WORKSHOP_NAME || 'BENGKEL MOTOR JAYA ABADI',
  address: process.env.NEXT_PUBLIC_WORKSHOP_ADDRESS || 'Jl. Raya Otomotif No. 88, Jakarta',
  phone: process.env.NEXT_PUBLIC_WORKSHOP_PHONE || '0812-3456-7890',
  paperWidth: '58',
  footerMessage: 'Terima kasih atas kunjungan Anda!\nGaransi servis 7 hari kerja.',
};

/**
 * Helper to format two strings aligned to left and right within the receipt width
 */
function formatTwoColumns(left: string, right: string, width: number): string {
  const leftLen = left.length;
  const rightLen = right.length;
  if (leftLen + rightLen >= width) {
    // Truncate left or split
    const available = width - rightLen - 1;
    return left.substring(0, Math.max(0, available)) + ' ' + right;
  }
  const spaces = width - leftLen - rightLen;
  return left + ' '.repeat(spaces) + right;
}

/**
 * Generate ESC/POS Binary Bytes for 58mm / 80mm Thermal Printers
 */
export function generateEscPosBytes(tx: Transaction, config: PrinterConfig = defaultPrinterConfig): Uint8Array {
  const width = config.paperWidth === '80' ? 48 : 32;
  const separator = '-'.repeat(width);
  const doubleSeparator = '='.repeat(width);

  let commands = '';

  // Initialize printer
  commands += ESC + '@';
  
  // Center align & Bold header
  commands += ESC + 'a' + '\x01'; // Center
  commands += ESC + 'E' + '\x01'; // Bold ON
  commands += config.workshopName + '\n';
  commands += ESC + 'E' + '\x00'; // Bold OFF
  commands += config.address + '\n';
  commands += 'Telp: ' + config.phone + '\n';
  commands += doubleSeparator + '\n';

  // Left align for transaction metadata
  commands += ESC + 'a' + '\x00'; // Left
  commands += formatTwoColumns('No. Nota:', tx.invoice_no, width) + '\n';
  commands += formatTwoColumns('Tanggal :', formatDateIndo(tx.created_at), width) + '\n';
  commands += formatTwoColumns('Kasir   :', tx.cashier_name || 'Kasir', width) + '\n';
  if (tx.vehicle_plate) {
    commands += formatTwoColumns('No. Pol :', tx.vehicle_plate, width) + '\n';
  }
  if (tx.vehicle_owner) {
    commands += formatTwoColumns('Pelanggan:', tx.vehicle_owner, width) + '\n';
  }
  if (tx.vehicle_type) {
    commands += formatTwoColumns('Motor   :', tx.vehicle_type, width) + '\n';
  }
  commands += separator + '\n';

  // Item List
  tx.details.forEach((item) => {
    commands += item.product_name + '\n';
    const priceQty = ` ${item.qty} x ${formatRupiah(item.price_at_sale)}`;
    const subtotal = formatRupiah(item.subtotal);
    commands += formatTwoColumns(priceQty, subtotal, width) + '\n';
  });
  commands += separator + '\n';

  // Summary Totals
  const subtotalSum = tx.details.reduce((acc, d) => acc + d.subtotal, 0);
  if (tx.discount_amount > 0) {
    commands += formatTwoColumns('Subtotal', formatRupiah(subtotalSum), width) + '\n';
    commands += formatTwoColumns('Diskon', '-' + formatRupiah(tx.discount_amount), width) + '\n';
  }

  // Bold Total
  commands += ESC + 'E' + '\x01';
  commands += formatTwoColumns('TOTAL', formatRupiah(tx.total_amount), width) + '\n';
  commands += ESC + 'E' + '\x00';

  commands += formatTwoColumns('Metode', tx.payment_method.toUpperCase(), width) + '\n';
  if (tx.payment_method === 'tunai') {
    commands += formatTwoColumns('Bayar', formatRupiah(tx.cash_given), width) + '\n';
    commands += formatTwoColumns('Kembali', formatRupiah(tx.change_amount), width) + '\n';
  }

  // Footer & Cut
  commands += doubleSeparator + '\n';
  commands += ESC + 'a' + '\x01'; // Center
  commands += config.footerMessage + '\n';
  commands += '\n\n\n'; // Feed lines
  commands += GS + 'V' + '\x41' + '\x00'; // Cut paper (if supported)

  // Encode to UTF-8/ASCII bytes
  const encoder = new TextEncoder();
  return encoder.encode(commands);
}

/**
 * Print via Web Bluetooth API (Android Chrome & Desktop Chrome supported)
 */
export async function printViaBluetooth(tx: Transaction, config: PrinterConfig = defaultPrinterConfig): Promise<{ success: boolean; message: string }> {
  if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
    return {
      success: false,
      message: 'Web Bluetooth API tidak didukung di browser ini. Gunakan Chrome di Android/Desktop.',
    };
  }

  try {
    const nav = navigator as any;
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer service
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
      ],
    });

    if (!device.gatt) {
      throw new Error('GATT server tidak tersedia');
    }

    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    
    let targetCharacteristic = null;
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          targetCharacteristic = char;
          break;
        }
      }
      if (targetCharacteristic) break;
    }

    if (!targetCharacteristic) {
      throw new Error('Karakteristik Bluetooth Write tidak ditemukan.');
    }

    const bytes = generateEscPosBytes(tx, config);
    
    // Chunk bytes (Bluetooth GATT MTU limit ~ 100-512 bytes)
    const chunkSize = 100;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      await targetCharacteristic.writeValue(chunk);
    }

    return { success: true, message: 'Berhasil mencetak via Bluetooth Thermal Printer!' };
  } catch (err: any) {
    console.error('Bluetooth Print Error:', err);
    return { success: false, message: err.message || 'Gagal menyambung ke Bluetooth Printer' };
  }
}

/**
 * Generate RawBT Android Intent URI
 */
export function getRawBtIntentUrl(tx: Transaction, config: PrinterConfig = defaultPrinterConfig): string {
  const bytes = generateEscPosBytes(tx, config);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = typeof btoa !== 'undefined' ? btoa(binary) : '';
  return `rawbt:data:base64,${base64Data}`;
}

/**
 * Generate WhatsApp Text Receipt message
 */
export function generateWhatsAppReceiptText(tx: Transaction, config: PrinterConfig = defaultPrinterConfig): string {
  let text = `*${config.workshopName}*\n`;
  text += `${config.address}\n`;
  text += `--------------------------------\n`;
  text += `*Nota:* ${tx.invoice_no}\n`;
  text += `*Tanggal:* ${formatDateIndo(tx.created_at)}\n`;
  if (tx.vehicle_plate) text += `*No. Pol:* ${tx.vehicle_plate}\n`;
  if (tx.vehicle_owner) text += `*Pelanggan:* ${tx.vehicle_owner}\n`;
  text += `--------------------------------\n`;
  text += `*Rincian Pembelian:*\n`;

  tx.details.forEach((item, idx) => {
    text += `${idx + 1}. ${item.product_name}\n`;
    text += `   ${item.qty} x ${formatRupiah(item.price_at_sale)} = *${formatRupiah(item.subtotal)}*\n`;
  });

  text += `--------------------------------\n`;
  if (tx.discount_amount > 0) {
    text += `Diskon: -${formatRupiah(tx.discount_amount)}\n`;
  }
  text += `*TOTAL: ${formatRupiah(tx.total_amount)}*\n`;
  text += `Metode: ${tx.payment_method.toUpperCase()}\n`;
  if (tx.payment_method === 'tunai') {
    text += `Bayar: ${formatRupiah(tx.cash_given)}\n`;
    text += `Kembali: ${formatRupiah(tx.change_amount)}\n`;
  }
  text += `--------------------------------\n`;
  text += `${config.footerMessage}\n`;

  return encodeURIComponent(text);
}
