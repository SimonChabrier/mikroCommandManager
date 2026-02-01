import "./stimulus_bootstrap.js";

// Configuration
const COMMANDS_PER_PAGE = 50;
const MIN_SEARCH_LENGTH = 3;

// État de l'application
let allCommands = [];
let filteredCommands = [];
let currentPage = 1;

// Éléments DOM
const commandsList = document.getElementById("commands-list");
const searchInput = document.getElementById("search-input");
const addForm = document.getElementById("add-form");
const descriptionInput = document.getElementById("description-input");
const commandInput = document.getElementById("command-input");
const paginationContainer = document.getElementById("pagination");
const resultsInfo = document.getElementById("results-info");
const toggleAddFormBtn = document.getElementById("toggle-add-form");
const addFormContainer = document.getElementById("add-form-container");
const plusIcon = document.getElementById("plus-icon");
const totalCommandsEl = document.getElementById("total-commands");

// Charger les commandes depuis le fichier JSON
const loadCommands = async () => {
    try {
        const response = await fetch("/api/commandes");
        allCommands = await response.json();
        filteredCommands = [...allCommands];
        updateTotalCount();
        renderCommands();
        renderPagination();
    } catch (error) {
        console.error("Erreur lors du chargement des commandes:", error);
        commandsList.innerHTML =
            '<div class="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">Erreur lors du chargement des commandes.</div>';
    }
};

// Mettre à jour le compteur total
const updateTotalCount = () => {
    const count = allCommands.length;
    totalCommandsEl.textContent = `${count} commande${count > 1 ? "s" : ""}`;
};

// Créer un élément de commande
const createCommandElement = (cmd, index, isVisible = true) => {
    const div = document.createElement("div");
    div.className = `group bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-lg p-3 command-item transition-all${isVisible ? "" : " hidden"}`;
    div.dataset.index = index;
    div.innerHTML = `
        <div class="flex justify-between items-center gap-3">
            <div class="flex-1 min-w-0">
                <p class="text-gray-400 text-xs mb-1 truncate">${escapeHtml(cmd.description)}</p>
                <code class="text-green-400 text-sm font-mono">${escapeHtml(cmd.command)}</code>
            </div>
            <button class="copy-btn opacity-0 group-hover:opacity-100 flex-shrink-0 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-blue-600 hover:to-blue-500 text-gray-300 hover:text-white p-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-110" data-command="${escapeHtml(cmd.command)}" title="Copier">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
            </button>
        </div>
    `;
    return div;
};

// Échapper le HTML pour éviter les injections XSS
const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
};

// Afficher les commandes avec pagination
const renderCommands = () => {
    commandsList.innerHTML = "";

    if (filteredCommands.length === 0) {
        commandsList.innerHTML =
            '<div class="bg-gray-900/50 border border-gray-800 text-gray-400 px-4 py-3 rounded-lg text-sm text-center">Aucune commande trouvée.</div>';
        resultsInfo.textContent = "";
        return;
    }

    const startIndex = (currentPage - 1) * COMMANDS_PER_PAGE;
    const endIndex = Math.min(startIndex + COMMANDS_PER_PAGE, filteredCommands.length);

    // Afficher toutes les commandes filtrées dans le DOM, mais cacher celles hors pagination
    filteredCommands.forEach((cmd, index) => {
        const isVisible = index >= startIndex && index < endIndex;
        const element = createCommandElement(cmd, index, isVisible);
        commandsList.appendChild(element);
    });

    // Mettre à jour les informations
    resultsInfo.textContent = `${startIndex + 1}-${endIndex} sur ${filteredCommands.length}`;
};

// Afficher la pagination
const renderPagination = () => {
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(filteredCommands.length / COMMANDS_PER_PAGE);

    if (totalPages <= 1) return;

    const nav = document.createElement("nav");
    nav.className = "flex items-center gap-2";

    // Bouton précédent
    const prevBtn = document.createElement("button");
    prevBtn.className = `p-2 rounded-lg transition-all duration-300 ${
        currentPage === 1
            ? "bg-gray-900/50 text-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-gray-800 to-gray-700 text-gray-300 hover:from-gray-700 hover:to-gray-600 hover:text-white hover:scale-110 hover:shadow-lg"
    }`;
    prevBtn.innerHTML =
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>';
    prevBtn.dataset.page = currentPage - 1;
    prevBtn.disabled = currentPage === 1;
    nav.appendChild(prevBtn);

    // Pages
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.className = `w-8 h-8 rounded-lg text-xs font-medium transition-all duration-300 ${
            i === currentPage
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white hover:scale-110"
        }`;
        pageBtn.textContent = i;
        pageBtn.dataset.page = i;
        nav.appendChild(pageBtn);
    }

    // Bouton suivant
    const nextBtn = document.createElement("button");
    nextBtn.className = `p-2 rounded-lg transition-all duration-300 ${
        currentPage === totalPages
            ? "bg-gray-900/50 text-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-gray-800 to-gray-700 text-gray-300 hover:from-gray-700 hover:to-gray-600 hover:text-white hover:scale-110 hover:shadow-lg"
    }`;
    nextBtn.innerHTML =
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>';
    nextBtn.dataset.page = currentPage + 1;
    nextBtn.disabled = currentPage === totalPages;
    nav.appendChild(nextBtn);

    paginationContainer.appendChild(nav);
};

// Filtrer les commandes (description ET commande)
const filterCommands = (query) => {
    if (query.length < MIN_SEARCH_LENGTH) {
        filteredCommands = [...allCommands];
    } else {
        const lowerQuery = query.toLowerCase();
        filteredCommands = allCommands.filter((cmd) => cmd.description.toLowerCase().includes(lowerQuery) || cmd.command.toLowerCase().includes(lowerQuery));
    }
    currentPage = 1;
    renderCommands();
    renderPagination();
};

// Copier une commande dans le presse-papiers
const copyCommand = async (command) => {
    try {
        await navigator.clipboard.writeText(command);
        showToast("Copié !");
    } catch (error) {
        console.error("Erreur lors de la copie:", error);
        showToast("Erreur", "error");
    }
};

// Afficher un toast de notification
const showToast = (message, type = "success") => {
    const toastContainer = document.getElementById("toast-container");
    const toastId = `toast-${Date.now()}`;

    const bgColor = type === "success" ? "bg-green-600" : "bg-red-600";

    const toast = document.createElement("div");
    toast.id = toastId;
    toast.className = `${bgColor} text-white text-sm px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300`;
    toast.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === "success" ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}"></path>
        </svg>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        setTimeout(() => toast.remove(), 300);
    }, 1500);
};

// Ajouter une nouvelle commande
const addCommand = (description, command) => {
    const newCommand = { description, command };
    allCommands.unshift(newCommand);
    updateTotalCount();
    filterCommands(searchInput.value);
    showToast("Commande ajoutée !");
};

// Toggle du formulaire d'ajout
const toggleAddForm = () => {
    const isOpen = addFormContainer.classList.contains("open");
    addFormContainer.classList.toggle("open");
    plusIcon.style.transform = isOpen ? "rotate(0deg)" : "rotate(45deg)";
};

// Gestionnaires d'événements
const initEventListeners = () => {
    // Toggle formulaire d'ajout
    toggleAddFormBtn.addEventListener("click", toggleAddForm);

    // Recherche
    searchInput.addEventListener("input", (e) => {
        filterCommands(e.target.value);
    });

    // Formulaire d'ajout
    addForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const description = descriptionInput.value.trim();
        const command = commandInput.value.trim();

        if (description && command) {
            addCommand(description, command);
            descriptionInput.value = "";
            commandInput.value = "";
        }
    });

    // Pagination
    paginationContainer.addEventListener("click", (e) => {
        const pageBtn = e.target.closest("[data-page]");
        if (pageBtn && !pageBtn.disabled) {
            const page = parseInt(pageBtn.dataset.page, 10);
            const totalPages = Math.ceil(filteredCommands.length / COMMANDS_PER_PAGE);
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                renderCommands();
                renderPagination();
                commandsList.scrollIntoView({ behavior: "smooth" });
            }
        }
    });

    // Copier (délégation d'événements)
    commandsList.addEventListener("click", (e) => {
        const copyBtn = e.target.closest(".copy-btn");
        if (copyBtn) {
            copyCommand(copyBtn.dataset.command);
        }
    });
};

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
    initEventListeners();
    loadCommands();
});

console.log("app.js loaded");
