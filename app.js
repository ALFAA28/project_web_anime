/**
 * ANIME DATABASE APP - MAIN LOGIC
 * Requires Firebase SDK v9+
 */

// ==========================================
// 1. CONFIGURATION (DIBAGIAN INI ISI API KEY)
// ==========================================

// GANTI DENGAN CONFIG FIREBASE PROYEK ANDA
// Caranya: Buka Console Firebase > Project Settings > General > Your Apps > SDK Setup and Configuration > Config
const firebaseConfig = {
    apiKey: "GANTI_DENGAN_FIREBASE_API_KEY",
    authDomain: "GANTI_DENGAN_PROJECT_ID.firebaseapp.com",
    projectId: "GANTI_DENGAN_PROJECT_ID",
    storageBucket: "GANTI_DENGAN_PROJECT_ID.appspot.com",
    messagingSenderId: "GANTI_DENGAN_SENDER_ID",
    appId: "GANTI_DENGAN_APP_ID"
};

// GANTI DENGAN API KEY IMGBB
// Caranya: Daftar di imgbb.com > Buat API Key
// Pastikan API Key valid untuk upload gambar
const IMGBB_API_KEY = "GANTI_DENGAN_IMGBB_API_KEY";

// ==========================================
// 2. FIREBASE IMPORTS & INIT
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const animeCollection = collection(db, "anime");

// ==========================================
// 3. AUTHENTICATION LOGIC (ADMIN PANEL)
// ==========================================
const loginModal = document.getElementById('login-modal');
const authBtn = document.getElementById('auth-btn');
const closeLoginBtn = document.getElementById('close-login-btn');
const loginForm = document.getElementById('login-form');
const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');

// Show/Hide Login Modal
authBtn.addEventListener('click', () => {
    // If logged in, button functionality might differ, but for simplicity
    if (!auth.currentUser) {
        loginModal.classList.remove('hidden');
        loginModal.classList.add('flex');
    }
});

closeLoginBtn.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    loginModal.classList.remove('flex');
});

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginModal.classList.add('hidden');
        loginModal.classList.remove('flex');
        loginForm.reset();
        errorMsg.classList.add('hidden');
        alert("Login Berhasil! Selamat datang Admin.");
    } catch (error) {
        console.error("Login Error:", error);
        errorMsg.textContent = "Gagal Login: " + error.message;
        errorMsg.classList.remove('hidden');
    }
});

// Handle Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        alert("Logout Berhasil!");
    } catch (error) {
        console.error("Logout Error:", error);
    }
});

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        adminPanel.classList.remove('hidden');
        authBtn.classList.add('hidden'); // Hide login button
        console.log("Admin logged in:", user.email);
    } else {
        // User is logged out
        adminPanel.classList.add('hidden');
        authBtn.classList.remove('hidden'); // Show login button
    }
});


// ==========================================
// 4. IMGBB IMAGE UPLOAD LOGIC
// ==========================================
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return data.data.url;
        } else {
            throw new Error('ImgBB Upload Failed: ' + (data.error ? data.error.message : 'Unknown error'));
        }
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
}


// ==========================================
// 5. ADMIN FORM LOGIC (ADD DATA)
// ==========================================
const animeForm = document.getElementById('anime-form');
const charListInput = document.getElementById('char-list'); // UL for display
const addCharBtn = document.getElementById('add-char-btn');
const posterInput = document.getElementById('poster-file');
const posterPreview = document.getElementById('poster-preview');
const uploadStatus = document.getElementById('upload-status');

// Temporary storage for characters being added
let tempCharacters = [];

// Poster Preview
posterInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            posterPreview.style.backgroundImage = `url(${e.target.result})`;
            posterPreview.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
});

// Add Character Utility
addCharBtn.addEventListener('click', () => {
    const charName = document.getElementById('char-name-input').value.trim();
    const seiyuuName = document.getElementById('seiyuu-name-input').value.trim();

    if (charName && seiyuuName) {
        tempCharacters.push({ name: charName, seiyuu: seiyuuName });
        renderCharList();

        // Clear inputs
        document.getElementById('char-name-input').value = '';
        document.getElementById('seiyuu-name-input').value = '';
    } else {
        alert("Nama Karakter dan Seiyuu harus diisi!");
    }
});

function renderCharList() {
    const list = document.getElementById('char-list');
    list.innerHTML = '';
    list.classList.remove('hidden');

    tempCharacters.forEach((char, index) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-gray-700/50 p-2 rounded text-xs';
        li.innerHTML = `
            <span><strong class="text-secondary">${char.name}</strong> (${char.seiyuu})</span>
            <button type="button" class="text-red-400 hover:text-red-300" onclick="removeChar(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        list.appendChild(li);
    });
}

// Global scope for onclick
window.removeChar = (index) => {
    tempCharacters.splice(index, 1);
    renderCharList();
};

// Handle Form Submit
animeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate inputs
    const file = posterInput.files[0];
    if (!file) {
        alert("Harap upload poster anime!");
        return;
    }

    uploadStatus.classList.remove('hidden');
    uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Mengunggah Poster ke ImgBB...';

    try {
        // 1. Upload Image to ImgBB
        const posterUrl = await uploadToImgBB(file);

        uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Menyimpan Data ke Firestore...';

        // 2. Prepare Data
        const animeData = {
            title: document.getElementById('title').value,
            synopsis: document.getElementById('synopsis').value,
            studio: document.getElementById('studio').value,
            rating: parseFloat(document.getElementById('rating').value),
            episodes: document.getElementById('episodes').value,
            release: document.getElementById('release').value,
            genre: document.getElementById('genre').value.split(',').map(g => g.trim()),
            watch_link: document.getElementById('watch-link').value,
            poster_url: posterUrl,
            characters: tempCharacters,
            createdAt: serverTimestamp()
        };

        // 3. Save to Firestore
        await addDoc(animeCollection, animeData);

        // 4. Reset Form
        animeForm.reset();
        tempCharacters = [];
        renderCharList();
        posterPreview.style.backgroundImage = '';
        posterPreview.classList.add('hidden');
        uploadStatus.classList.add('hidden');

        alert("Anime berhasil ditambahkan ke database!");

    } catch (error) {
        console.error("Error Adding Anime:", error);
        uploadStatus.textContent = "Error: " + error.message;
        uploadStatus.classList.remove('text-blue-200');
        uploadStatus.classList.add('text-red-400');
    }
});


// ==========================================
// 6. UI RENDERING (READ DATA)
// ==========================================
const animeGrid = document.getElementById('anime-grid');
const loadingSpinner = document.getElementById('loading-spinner');
let globalAnimeList = []; // Store for search

// Real-time listener
const q = query(animeCollection, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    loadingSpinner.classList.add('hidden');
    globalAnimeList = []; // Reset list
    animeGrid.innerHTML = ''; // Clear grid

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const anime = { id: doc.id, ...data };
        globalAnimeList.push(anime);
    });

    renderAnimeGrid(globalAnimeList);
}, (error) => {
    console.error("Error fetching anime:", error);
    loadingSpinner.innerHTML = '<p class="text-red-500">Gagal memuat data.</p>';
});

function renderAnimeGrid(animeList) {
    animeGrid.innerHTML = '';

    if (animeList.length === 0) {
        animeGrid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10">Belum ada data anime.</p>';
        return;
    }

    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = "bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300 group relative";

        // Genre Badge (First genre only)
        const mainGenre = Array.isArray(anime.genre) && anime.genre.length > 0 ? anime.genre[0] : 'Anime';

        card.innerHTML = `
            <div class="relative h-64 overflow-hidden">
                <img src="${anime.poster_url}" alt="${anime.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                <div class="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-bold text-yellow-400">
                    <i class="fas fa-star mr-1"></i>${anime.rating}
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-darker to-transparent opacity-80"></div>
                
                <div class="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                     <span class="text-xs font-bold text-secondary uppercase tracking-wider mb-1 block">${mainGenre}</span>
                     <h3 class="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">${anime.title}</h3>
                </div>
            </div>
            <div class="p-4 bg-darker">
                <button onclick="openDetail('${anime.id}')" class="w-full bg-gray-700 hover:bg-secondary hover:text-dark text-white font-semibold py-2 rounded transition-all text-sm">
                    Detail Info
                </button>
            </div>
        `;
        animeGrid.appendChild(card);
    });
}

// Search Logic
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = globalAnimeList.filter(anime =>
        anime.title.toLowerCase().includes(keyword) ||
        (anime.genre && anime.genre.some(g => g.toLowerCase().includes(keyword)))
    );
    renderAnimeGrid(filtered);
});


// ==========================================
// 7. MODAL LOGIC (DETAIL VIEW)
// ==========================================
const detailModal = document.getElementById('detail-modal');
const closeDetailBtn = document.getElementById('close-detail-btn');

// Detail Elements
const elTitle = document.getElementById('modal-title');
const elPoster = document.getElementById('modal-poster');
const elSynopsis = document.getElementById('modal-synopsis');
const elRating = document.getElementById('modal-rating');
const elStudio = document.getElementById('modal-studio');
const elStatus = document.getElementById('modal-status'); // Assuming 'release' covers this or static
const elRelease = document.getElementById('modal-release');
const elGenres = document.getElementById('modal-genres');
const elCharacters = document.getElementById('modal-characters');
const elWatchBtn = document.getElementById('modal-watch-btn');
const elWatchBtnMobile = document.getElementById('modal-watch-btn-mobile');

// Make openDetail global so renders can call it
window.openDetail = (animeId) => {
    const anime = globalAnimeList.find(a => a.id === animeId);
    if (!anime) return;

    // Fill Data
    elTitle.textContent = anime.title;
    elPoster.src = anime.poster_url;
    elSynopsis.textContent = anime.synopsis;
    elRating.textContent = anime.rating;
    elStudio.textContent = anime.studio;
    elStatus.textContent = "Completed"; // Using static or add field, here assumed logic or default
    elRelease.textContent = anime.release;

    // Genres
    if (Array.isArray(anime.genre)) {
        elGenres.innerHTML = anime.genre.map(g =>
            `<span class="bg-gray-700 text-xs px-2 py-1 rounded text-gray-300 font-medium border border-gray-600">${g}</span>`
        ).join('');
    } else {
        elGenres.innerHTML = '<span class="text-gray-500 text-xs">Genre tidak tersedia</span>';
    }

    // Characters
    elCharacters.innerHTML = '';
    if (anime.characters && anime.characters.length > 0) {
        anime.characters.forEach(char => {
            const div = document.createElement('div');
            div.className = "flex items-center gap-2 bg-black/30 p-2 rounded";
            div.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-secondary text-dark flex items-center justify-center font-bold text-xs"><i class="fas fa-user"></i></div>
                <div>
                    <h4 class="font-bold text-white text-xs">${char.name}</h4>
                    <p class="text-[10px] text-gray-400">CV: ${char.seiyuu}</p>
                </div>
            `;
            elCharacters.appendChild(div);
        });
    } else {
        elCharacters.innerHTML = '<p class="text-gray-500 text-xs italic">Data karakter belum tersedia.</p>';
    }

    // Watch Link
    elWatchBtn.href = anime.watch_link;
    if (elWatchBtnMobile) elWatchBtnMobile.href = anime.watch_link;

    // Show Modal
    detailModal.classList.remove('hidden');
    detailModal.classList.add('flex');

    // Animation Hack to trigger transition
    setTimeout(() => {
        detailModal.classList.remove('opacity-0', 'pointer-events-none');
    }, 10);

    document.body.classList.add('modal-open');
};

closeDetailBtn.addEventListener('click', closeModal);

// Close on background click
detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) {
        closeModal();
    }
});

function closeModal() {
    detailModal.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
        detailModal.classList.add('hidden');
        detailModal.classList.remove('flex');
    }, 300); // Wait for transition
    document.body.classList.remove('modal-open');
}
