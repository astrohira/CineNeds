const API_KEY = 'ce5903f15c55ee180d2a2af59f70c28a'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

let movies = JSON.parse(localStorage.getItem('cineNedsList')) || [];

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

function sortMovies() {
    movies.sort((a, b) => {
        if (a.watched !== b.watched) return a.watched ? 1 : -1;
        // Se um filme não tem data, ele fica por último na ordem cronológica
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
    });
}

async function addMovie() {
    const titleInput = document.getElementById('movieTitle');
    const dateInput = document.getElementById('movieDate');
    const title = titleInput.value.trim();
    const scheduledDate = dateInput.value; // Pode vir vazio agora

    if (!title) {
        showMessage("Preencha o nome do filme!");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&language=pt-BR`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const movieData = data.results[0];
            const newMovie = {
                id: Date.now(),
                title: movieData.title,
                year: movieData.release_date ? movieData.release_date.split('-')[0] : 'S/A',
                poster: movieData.poster_path ? (IMAGE_URL + movieData.poster_path) : "https://via.placeholder.com/300x450?text=Sem+Poster",
                date: scheduledDate || "", // Salva vazio se não preenchido
                watched: false
            };
            movies.push(newMovie);
            saveAndRender();
            titleInput.value = '';
            dateInput.value = '';
            showMessage("Filme adicionado!");
        } else {
            showMessage("Filme não encontrado!");
        }
    } catch (error) {
        showMessage("Erro na API.");
    }
}

function toggleWatched(index) {
    movies[index].watched = !movies[index].watched;
    saveAndRender();
    showMessage(movies[index].watched ? "Filme assistido!" : "Marcado como não visto.");
}

function updateDate(index, newDate) {
    movies[index].date = newDate;
    saveAndRender();
    showMessage("Data atualizada!");
}

function saveAndRender() {
    sortMovies();
    localStorage.setItem('cineNedsList', JSON.stringify(movies));
    renderMovies();
}

function renderMovies() {
    const list = document.getElementById('movieList');
    list.innerHTML = '';
    movies.forEach((movie, index) => {
        list.innerHTML += `
            <div class="movie-card ${movie.watched ? 'watched' : ''}">
                <button class="btn-delete" onclick="removeMovie(${index})">
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
                        <input type="datetime-local" value="${movie.date}" onchange="updateDate(${index}, this.value)" class="input-edit-date">
                    </div>
                    <div class="actions">
                        <button class="btn-watched ${movie.watched ? 'active' : ''}" onclick="toggleWatched(${index})">
                            ${movie.watched ? 'Visto' : 'Marcar como visto'}
                        </button>
                    </div>
                </div>
            </div>`;
    });
}

function removeMovie(index) {
    movies.splice(index, 1);
    saveAndRender();
    showMessage("Removido.");
}

renderMovies();
