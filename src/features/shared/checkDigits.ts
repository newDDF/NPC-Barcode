const RETAIL_BARCODE_LENGTHS: Record<string, number> = {
  upca: 11,
  ean13: 12,
  ean8: 7,
};

function calculateCheckDigit(data: string): string {
  let sum = 0;
  let weight = 3;

  for (let index = data.length - 1; index >= 0; index -= 1) {
    sum += Number(data[index]) * weight;
    weight = weight === 3 ? 1 : 3;
  }

  return String((10 - (sum % 10)) % 10);
}

export function normalizeRetailBarcode(
  type: string,
  value: string,
): string {
  const dataLength = RETAIL_BARCODE_LENGTHS[type];

  if (!dataLength || !/^\d+$/.test(value)) {
    return value;
  }

  if (value.length === dataLength) {
    return value + calculateCheckDigit(value);
  }

  if (value.length === dataLength + 1) {
    const expected = calculateCheckDigit(value.slice(0, dataLength));
    const actual = value[dataLength];

    if (actual !== expected) {
      throw new Error(
        `Invalid ${type.toUpperCase()} check digit. Expected ${expected}, received ${actual}.`,
      );
    }
  }

  return value;
}
