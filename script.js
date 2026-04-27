import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuração do seu projeto (atualizada com os dados que você mandou)
const firebaseConfig = {
    apiKey: "AIzaSyAg_JvOj8CA1KDt9AxOT9ttWwjZRj2cvFo",
    authDomain: "cineneds.firebaseapp.com",
    projectId: "cineneds",
    storageBucket: "cineneds.firebasestorage.app",
    messagingSenderId: "780321985431",
    appId: "1:780321985431:web:c4da0ecb13f7df11ae6ad2",
    measurementId: "G-DNF6YT071S"
};

// Inicializa o Firebase e o Banco de Dados (Firestore)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const moviesCol = collection(db, "movies");

// Configurações do TMDB
const TMDB_KEY = 'ce5903f15c55ee180d2a2af59f70c28a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// Função para exibir notificações (Toasts)
function showMessage(text) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = text;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ESCUTA EM TEMPO REAL: Tudo o que mudar no banco reflete no site na hora
onSnapshot(query(moviesCol), (snapshot) => {
    let movies = [];
    snapshot.forEach((doc) => {
        movies.push({ id: doc.id, ...doc.data() });
    });
    
    // Ordenação: Não assistidos primeiro, depois por data
    movies.sort((a, b) => {
        if (a.watched !== b.watched) return a.watched ? 1 : -1;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
    });

    renderMovies(movies);
});

// FUNÇÃO PARA ADICIONAR FILME
async function addMovie() {
    const titleInput = document.getElementById('movieTitle');
    const dateInput = document.getElementById('movieDate');
    const title = titleInput.value.trim();
    const scheduledDate = dateInput.value;

    if (!title) {
        showMessage("Digite o nome do filme!");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=pt-BR`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const movieData = data.results[0];
            
            // Grava diretamente no Firebase
            await addDoc(moviesCol, {
                title: movieData.title,
                year: movieData.release_date ? movieData.release_date.split('-')[0] : 'S/A',
                poster: movieData.poster_path ? (IMAGE_URL + movieData.poster_path) : "https://via.placeholder.com/300x450?text=Sem+Poster",
                date: scheduledDate || "",
                watched: false
            });

            titleInput.value = '';
            dateInput.value = '';
            showMessage("Filme agendado na nuvem!");
        } else {
            showMessage("Filme não encontrado!");
        }
    } catch (error) {
        showMessage("Erro ao conectar com a nuvem.");
    }
}

// ATUALIZA STATUS DE VISTO
async function toggleWatched(id, currentStatus) {
    const movieRef = doc(db, "movies", id);
    await updateDoc(movieRef, { watched: !currentStatus });
}

// ATUALIZA A DATA
async function updateDate(id, newDate) {
    const movieRef = doc(db, "movies", id);
    await updateDoc(movieRef, { date: newDate });
}

// REMOVE O FILME
async function removeMovie(id) {
    const movieRef = doc(db, "movies", id);
    await deleteDoc(movieRef);
    showMessage("Removido da nuvem.");
}

// GERA OS CARDS NA TELA
function renderMovies(movies) {
    const list = document.getElementById('movieList');
    list.innerHTML = '';

    movies.forEach((movie) => {
        const card = document.createElement('div');
        card.className = `movie-card ${movie.watched ? 'watched' : ''}`;
        card.innerHTML = `
            <button class="btn-delete" title="Remover">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="3" stroke-linecap="round"/>
                </svg>
            </button>
            <img src="${movie.poster}" class="poster" alt="Poster">
            <div class="movie-content">
                <h3>${movie.title}</h3>
                <p>${movie.year}</p>
                <div class="edit-date-container">
                    <label>Alterar data:</label>
                    <input type="datetime-local" value="${movie.date}" class="input-edit-date">
                </div>
                <div class="actions">
                    <button class="btn-watched ${movie.watched ? 'active' : ''}">
                        ${movie.watched ? 'Visto' : 'Marcar como visto'}
                    </button>
                </div>
            </div>
        `;

        // Atribui os cliques (necessário em módulos JS)
        card.querySelector('.btn-delete').onclick = () => removeMovie(movie.id);
        card.querySelector('.btn-watched').onclick = () => toggleWatched(movie.id, movie.watched);
        card.querySelector('.input-edit-date').onchange = (e) => updateDate(movie.id, e.target.value);

        list.appendChild(card);
    });
}

// Liga a função de adicionar ao botão
document.querySelector('.btn-add').onclick = addMovie;
