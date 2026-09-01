// ponytail: helper util untuk sinkronisasi simpan riwayat kalkulasi ke Database Server
export async function saveCalculationToDb(item: {
  id: string;
  category: string;
  title: string;
  oplah?: number;
  data: any;
  paramsSnapshot?: any;
  savedAt?: string;
}) {
  try {
    const res = await fetch('/api/pricelist/saved-calculations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return await res.json();
  } catch (e) {
    console.error('Failed to save calculation to server database:', e);
    return null;
  }
}

export async function deleteCalculationFromDb(id: string) {
  try {
    const res = await fetch(`/api/pricelist/saved-calculations?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (e) {
    console.error('Failed to delete calculation from server database:', e);
    return null;
  }
}

export async function updateCalculationTitleInDb(id: string, title: string) {
  try {
    const res = await fetch('/api/pricelist/saved-calculations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title }),
    });
    return await res.json();
  } catch (e) {
    console.error('Failed to update calculation title in server database:', e);
    return null;
  }
}
