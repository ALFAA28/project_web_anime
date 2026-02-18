/**
 * ANIME DATABASE APP - MAIN LOGIC
 * Requires Firebase SDK v9+
 */

// ==========================================
// 1. CONFIGURATION (DIBAGIAN INI ISI API KEY)
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyBGDC54yzaKTusSrs9YVCSk_x4d7w5rQsU",
    authDomain: "project-web-anime.firebaseapp.com",
    projectId: "project-web-anime",
    storageBucket: "project-web-anime.firebasestorage.app",
    messagingSenderId: "803774280365",
    appId: "1:803774280365:web:9452df435a81825bbd8c24"
};

const IMGBB_API_KEY = "b0972de6c6e1ef1daf51bded95425166";

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
// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        adminPanel.classList.remove('hidden');
        authBtn.classList.add('hidden'); // Hide login button
        logoutBtn.classList.remove('hidden'); // Show logout
    } else {
        // User is logged out
        adminPanel.classList.add('hidden');
        authBtn.classList.remove('hidden'); // Show login button
        logoutBtn.classList.add('hidden'); // Hide logout
    }
    // Re-render grid to show/hide edit buttons
    if (globalAnimeList.length > 0) {
        renderAnimeGrid(globalAnimeList);
    }
});

// ... (ImgBB logic lines 118-129 skipped) ...

function renderAnimeGrid(animeList) {
    animeGrid.innerHTML = '';

    if (animeList.length === 0) {
        animeGrid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10">Belum ada data anime.</p>';
        return;
    }

    const isAdmin = auth.currentUser;

    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = "bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300 group relative";

        // Genre Badge (First genre only)
        const mainGenre = Array.isArray(anime.genre) && anime.genre.length > 0 ? anime.genre[0] : 'Anime';

        let editBtnHtml = '';
        if (isAdmin) {
            editBtnHtml = `
                <button onclick="editAnime('${anime.id}')" class="absolute top-2 left-2 z-20 bg-yellow-500 hover:bg-yellow-600 text-black px-2 py-1 rounded shadow-lg transition-transform hover:scale-105" title="Edit Anime">
                    <i class="fas fa-edit"></i> Edit
                </button>
            `;
        }

        card.innerHTML = `
            <div class="relative h-64 overflow-hidden">
                ${editBtnHtml}
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
    const charImgInput = document.getElementById('char-img-input');
    const charImgFile = charImgInput.files[0];

    if (charName && seiyuuName) {
        tempCharacters.push({
            name: charName,
            seiyuu: seiyuuName,
            imageFile: charImgFile,
            previewUrl: charImgFile ? URL.createObjectURL(charImgFile) : null
        });
        renderCharList();

        // Clear inputs
        document.getElementById('char-name-input').value = '';
        document.getElementById('seiyuu-name-input').value = '';
        charImgInput.value = '';
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
        li.className = 'flex justify-between items-center bg-gray-700/50 p-2 rounded text-xs gap-3';

        const imgSrc = char.previewUrl || char.image_url;
        let imgHtml = imgSrc
            ? `<img src="${imgSrc}" class="w-8 h-8 rounded-full object-cover border border-gray-500">`
            : '<div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"><i class="fas fa-user text-gray-400"></i></div>';

        li.innerHTML = `
            <div class="flex items-center gap-3">
                ${imgHtml}
                <div class="flex flex-col">
                    <strong class="text-secondary">${char.name}</strong>
                    <span class="text-gray-400 text-[10px]">${char.seiyuu}</span>
                </div>
            </div>
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
// Edit Anime
window.editAnime = (id) => {
    const anime = globalAnimeList.find(a => a.id === id);
    if (!anime) return;

    // Fill form
    document.getElementById('title').value = anime.title;
    document.getElementById('title-jp').value = anime.title_jp || '';
    document.getElementById('studio').value = anime.studio;
    document.getElementById('rating').value = anime.rating;
    document.getElementById('episodes').value = anime.episodes;
    document.getElementById('release').value = anime.release;
    document.getElementById('genre').value = Array.isArray(anime.genre) ? anime.genre.join(', ') : anime.genre;
    document.getElementById('watch-link').value = anime.watch_link;
    document.getElementById('synopsis').value = anime.synopsis;
    document.getElementById('status').value = anime.status || 'Completed';
    document.getElementById('duration').value = anime.duration || '';
    document.getElementById('producers').value = anime.producers || '';

    // Handle Poster Preview
    posterPreview.style.backgroundImage = `url(${anime.poster_url})`;
    posterPreview.classList.remove('hidden');

    // Handle Characters
    tempCharacters = anime.characters || [];
    renderCharList();

    // Set Edit State
    document.getElementById('edit-id').value = id;
    document.getElementById('submit-text').textContent = 'Update Anime';
    document.getElementById('cancel-edit-btn').classList.remove('hidden');

    // Scroll to form
    adminPanel.scrollIntoView({ behavior: 'smooth' });
};

// Cancel Edit
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const submitText = document.getElementById('submit-text');
const editIdInput = document.getElementById('edit-id');

cancelEditBtn.addEventListener('click', cancelEdit);

function cancelEdit() {
    animeForm.reset();
    tempCharacters = [];
    renderCharList();
    posterPreview.style.backgroundImage = '';
    posterPreview.classList.add('hidden');

    document.getElementById('edit-id').value = '';
    submitText.textContent = 'Upload Anime';
    cancelEditBtn.classList.add('hidden');
}

// Handle Form Submit (Add & Update)
animeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = editIdInput.value;
    const isEdit = !!editId;

    // Validate inputs
    const file = posterInput.files[0];

    // If Add mode, require poster. If Edit mode, poster is optional (keep old).
    if (!isEdit && !file) {
        alert("Harap upload poster anime!");
        return;
    }

    uploadStatus.classList.remove('hidden');
    uploadStatus.classList.remove('text-blue-200', 'text-red-400'); // Reset colors
    uploadStatus.classList.add('text-blue-200');
    uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Memproses data...';

    try {
        let posterUrl = null;

        // 1. Upload Poster if new file selected
        if (file) {
            uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Mengunggah Poster ke ImgBB...';
            posterUrl = await uploadToImgBB(file);
        } else if (isEdit) {
            // Keep existing poster URL
            const existingAnime = globalAnimeList.find(a => a.id === editId);
            posterUrl = existingAnime.poster_url;
        }

        // 2. Upload Character Images (Only new ones)
        uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Memproses Foto Karakter...';

        const charactersFinal = await Promise.all(tempCharacters.map(async (char) => {
            let charImageUrl = char.image_url || null; // Default to existing URL

            // If new file, upload it
            if (char.imageFile) {
                try {
                    charImageUrl = await uploadToImgBB(char.imageFile);
                } catch (err) {
                    console.error("Gagal upload foto karakter:", char.name);
                }
            }

            return {
                name: char.name,
                seiyuu: char.seiyuu,
                image_url: charImageUrl
            };
        }));

        uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Menyimpan Data ke Firestore...';

        // 3. Prepare Data
        const animeData = {
            title: document.getElementById('title').value,
            title_jp: document.getElementById('title-jp').value,
            synopsis: document.getElementById('synopsis').value,
            studio: document.getElementById('studio').value,
            rating: parseFloat(document.getElementById('rating').value),
            status: document.getElementById('status').value,
            duration: document.getElementById('duration').value,
            episodes: document.getElementById('episodes').value,
            release: document.getElementById('release').value,
            producers: document.getElementById('producers').value,
            genre: document.getElementById('genre').value.split(',').map(g => g.trim()),
            watch_link: document.getElementById('watch-link').value,
            poster_url: posterUrl,
            characters: charactersFinal,
            updatedAt: serverTimestamp()
        };

        if (!isEdit) {
            animeData.createdAt = serverTimestamp();
            await addDoc(animeCollection, animeData);
            alert("Anime berhasil ditambahkan!");
        } else {
            const docRef = doc(animeCollection, editId);
            await updateDoc(docRef, animeData);
            alert("Anime berhasil diupdate!");
            cancelEdit(); // Reset form mode
        }

        // Reset Form if not handled by cancelEdit (for Add mode)
        if (!isEdit) {
            animeForm.reset();
            tempCharacters = [];
            renderCharList();
            posterPreview.style.backgroundImage = '';
            posterPreview.classList.add('hidden');
        }

        uploadStatus.classList.add('hidden');

    } catch (error) {
        console.error("Error Processing Anime:", error);
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



// Search Logic
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();

    const filtered = globalAnimeList.filter(anime => {
        // 1. Title Search
        const hasTitle = anime.title.toLowerCase().includes(keyword);

        // 2. Genre Search
        const hasGenre = anime.genre && Array.isArray(anime.genre) && anime.genre.some(g => g.toLowerCase().includes(keyword));

        // 3. Studio / Creator Search
        const hasStudio = anime.studio && anime.studio.toLowerCase().includes(keyword);

        // 4. Character & Seiyuu Search
        let hasCharOrSeiyuu = false;
        if (anime.characters && Array.isArray(anime.characters)) {
            hasCharOrSeiyuu = anime.characters.some(char =>
                (char.name && char.name.toLowerCase().includes(keyword)) ||
                (char.seiyuu && char.seiyuu.toLowerCase().includes(keyword))
            );
        }

        return hasTitle || hasGenre || hasStudio || hasCharOrSeiyuu;
    });

    renderAnimeGrid(filtered);
});


// ==========================================
// 7. MODAL LOGIC (DETAIL VIEW)
// ==========================================
const detailModal = document.getElementById('detail-modal');
const closeDetailBtn = document.getElementById('close-detail-btn');

// Detail Elements
const elTitle = document.getElementById('modal-title');
const elTitleJp = document.getElementById('modal-title-jp');
const elPoster = document.getElementById('modal-poster');
const elSynopsis = document.getElementById('modal-synopsis');
const elRating = document.getElementById('modal-rating');
const elStudio = document.getElementById('modal-studio');
const elStatus = document.getElementById('modal-status');
const elDuration = document.getElementById('modal-duration');
const elProducers = document.getElementById('modal-producers');
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
    elTitleJp.textContent = anime.title_jp || '';
    elPoster.src = anime.poster_url;
    elSynopsis.textContent = anime.synopsis;
    elRating.textContent = anime.rating;
    elStudio.textContent = anime.studio;
    elStatus.textContent = anime.status || "Completed";
    elDuration.textContent = anime.duration || "24 min";
    elProducers.textContent = anime.producers || "-";
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

            let imgHtml = char.image_url
                ? `<img src="${char.image_url}" class="w-8 h-8 rounded-full object-cover">`
                : '<div class="w-8 h-8 rounded-full bg-secondary text-dark flex items-center justify-center font-bold text-xs"><i class="fas fa-user"></i></div>';

            div.innerHTML = `
                ${imgHtml}
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
