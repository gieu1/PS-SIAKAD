// ==================== API FUNCTIONS ====================

// API Base URL
const API_BASE = 'api/';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(API_BASE + endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API call failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load data from database
let jadwalData = [];
let absensiData = [];
let laporanData = [];
let usersData = { mahasiswa: [], dosen: [], akademik: [] };

// Load initial data
async function loadInitialData() {
    try {
        const [jadwal, absensi, laporan, mahasiswa, dosen, akademik] = await Promise.all([
            apiCall('jadwal.php'),
            apiCall('absensi.php'),
            apiCall('laporan.php'),
            apiCall('users.php?role=mahasiswa'),
            apiCall('users.php?role=dosen'),
            apiCall('users.php?role=akademik')
        ]);

        jadwalData = jadwal.data || [];
        absensiData = absensi.data || [];
        laporanData = laporan.data || [];
        usersData.mahasiswa = mahasiswa.data || [];
        usersData.dosen = dosen.data || [];
        usersData.akademik = akademik.data || [];

        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Failed to load initial data:', error);
        // Fallback to empty arrays if API fails
        jadwalData = [];
        absensiData = [];
        laporanData = [];
        usersData = { mahasiswa: [], dosen: [], akademik: [] };
    }
}

// State Aplikasi
let currentUser = null;
let currentRole = null;

// ==================== FUNGSI HELPER ====================

function renderHeader(title) {
    return `
        <div class="bg-blue-600 text-white shadow-lg">
            <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                <h1 class="text-2xl font-bold">${title}</h1>
                <button onclick="handleLogout()"
                    class="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    `;
}

function handleLogout() {
    currentUser = null;
    currentRole = null;
    window.location.href = 'login.php';
}

// ==================== FUNGSI EVENT HANDLER ====================

async function handleLogin(event) {
    event.preventDefault();

    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    const errorDiv = document.getElementById('loginError');
    const errorText = errorDiv.querySelector('p');

    try {
        const response = await apiCall('auth.php', {
            method: 'POST',
            body: JSON.stringify({ userId, password, role })
        });

        currentUser = response.user;
        currentRole = response.role;

        // Load initial data after successful login
        await loadInitialData();

        // Redirect ke dashboard sesuai role dengan data user
        const userData = encodeURIComponent(JSON.stringify(currentUser));
        if (role === 'mahasiswa') {
            window.location.href = `dashboard-mahasiswa.php?user=${userData}&role=${role}`;
        } else if (role === 'dosen') {
            window.location.href = `dashboard-dosen.php?user=${userData}&role=${role}`;
        } else if (role === 'akademik') {
            window.location.href = `dashboard-akademik.php?user=${userData}&role=${role}`;
        }
    } catch (error) {
        errorDiv.classList.remove('hidden');
        errorText.textContent = error.message || 'Login gagal!';
    }
}

// ==================== FUNGSI SHARED ====================

function generatePDF() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    messageDiv.innerHTML = '<p class="font-semibold">Fitur download PDF dalam pengembangan</p>';
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// ==================== FUNGSI LAPORAN ====================

// Handler untuk melihat detail laporan
function detailLaporan(id) {
    const laporan = laporanData.find(l => l.id === id);

    if (!laporan) return;

    // Buat modal detail
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div class="p-6 bg-blue-600 text-white flex justify-between items-center">
                <h3 class="text-xl font-bold">Detail Laporan</h3>
                <button onclick="this.closest('.fixed').remove()"
                    class="text-white hover:text-gray-200 text-2xl font-bold">
                    ×
                </button>
            </div>
            <div class="p-6">
                <div class="grid grid-cols-1 gap-4">
                    <div class="border-b border-gray-200 pb-3">
                        <div class="text-sm text-gray-600 mb-1">ID Laporan</div>
                        <div class="text-lg font-semibold text-gray-800">${laporan.id}</div>
                    </div>
                    <div class="border-b border-gray-200 pb-3">
                        <div class="text-sm text-gray-600 mb-1">Mata Kuliah</div>
                        <div class="text-lg font-semibold text-gray-800">${laporan.mataKuliah}</div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 border-b border-gray-200 pb-3">
                        <div>
                            <div class="text-sm text-gray-600 mb-1">Program Studi</div>
                            <div class="text-base font-semibold text-gray-800">${laporan.prodi}</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600 mb-1">Semester</div>
                            <div class="text-base font-semibold text-gray-800">${laporan.semester}</div>
                        </div>
                    </div>
                    <div class="border-b border-gray-200 pb-3">
                        <div class="text-sm text-gray-600 mb-1">Fakultas</div>
                        <div class="text-base font-semibold text-gray-800">${laporan.fakultas}</div>
                    </div>
                    <div class="border-b border-gray-200 pb-3">
                        <div class="text-sm text-gray-600 mb-1">Nama Mahasiswa</div>
                        <div class="text-base font-semibold text-gray-800">${laporan.mahasiswa}</div>
                    </div>
                    <div class="border-b border-gray-200 pb-3">
                        <div class="text-sm text-gray-600 mb-1">Nama Dosen</div>
                        <div class="text-base font-semibold text-gray-800">${laporan.dosen}</div>
                    </div>
                    <div class="pb-3">
                        <div class="text-sm text-gray-600 mb-1">Tanggal Dibuat</div>
                        <div class="text-base font-semibold text-gray-800">${laporan.tanggal}</div>
                    </div>
                </div>
                <div class="mt-6 flex justify-end">
                    <button onclick="this.closest('.fixed').remove()"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Handler untuk hapus laporan dengan konfirmasi two-step
async function deleteLaporan(id) {
    const button = event.target;

    if (button.textContent === 'Hapus') {
        // Step 1: Ubah tombol menjadi konfirmasi
        button.textContent = 'Yakin?';
        button.className = 'bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm transition-colors';

        // Reset tombol setelah 3 detik jika tidak diklik
        setTimeout(() => {
            if (button.textContent === 'Yakin?') {
                button.textContent = 'Hapus';
                button.className = 'bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors';
            }
        }, 3000);
    } else {
        // Step 2: Hapus data via API
        try {
            await apiCall(`laporan.php?id=${id}`, {
                method: 'DELETE'
            });

            // Reload laporan data
            const laporanResponse = await apiCall('laporan.php');
            laporanData = laporanResponse.data || [];

            // Tampilkan notifikasi
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            notification.innerHTML = '<p class="font-semibold">Laporan berhasil dihapus!</p>';
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 2000);

            // Refresh halaman
            window.location.reload();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}
