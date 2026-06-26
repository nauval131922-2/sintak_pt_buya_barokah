// Lazy evaluation - read from env at runtime, not at module load time
function getApiUrl() {
  return process.env.SINTAK_API_URL || 'http://localhost:3000';
}

function getApiKey() {
  return process.env.SINTAK_API_KEY || '';
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<ApiResponse> {
  const url = `${getApiUrl()}${endpoint}`;
  
  const headers: Record<string, string> = {
    'X-API-Key': getApiKey(),
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>
  };

  console.log('[API DEBUG] URL:', url);
  console.log('[API DEBUG] Headers:', JSON.stringify(headers, null, 2));

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`[API] Error calling ${endpoint}:`, error.message);
    throw error;
  }
}

// API Methods
export const api = {
  async validateKaryawan(nama: string) {
    return apiCall(`/api/telegram/validate-karyawan?nama=${encodeURIComponent(nama)}`);
  },

  async registerRequest(data: {
    telegram_id: string;
    telegram_username?: string;
    nama_karyawan: string;
    bagian: string;
  }) {
    return apiCall('/api/telegram/register-request', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async checkStatus(telegram_id: string) {
    return apiCall(`/api/telegram/check-status?telegram_id=${telegram_id}`);
  },

  async validateOrder(no_order: string) {
    return apiCall(`/api/telegram/validate-order?no_order=${encodeURIComponent(no_order)}`);
  },

  async submitRealisasi(data: any) {
    return apiCall('/api/telegram/realisasi', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getHistory(telegram_id: string, limit: number = 10) {
    return apiCall(`/api/telegram/history?telegram_id=${telegram_id}&limit=${limit}`);
  }
};
