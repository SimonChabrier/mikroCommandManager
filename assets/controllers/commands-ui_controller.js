import { Controller } from "@hotwired/stimulus";
import { showToast } from "@toasts";

export default class extends Controller {
    static targets = [
        "list",
        "search",
        "pagination",
        "resultsInfo",
        "totalCommands",
        "addFormContainer",
        "plusIcon",
        "descriptionInput",
        "commandInput",
        "editDialog",
        "editId",
        "editDescription",
        "editCommand",
        "toastContainer",
        "commandTemplate",
    ];

    static values = {
        perPage: { type: Number, default: 20 },
        minSearch: { type: Number, default: 3 },
    };

    connect() {
        this.allCommands = [];
        this.filteredCommands = [];
        this.currentPage = 1;
        this.searchTimeout = null;

        // Déclencher le chargement des commandes via l'API controller
        // Utiliser requestAnimationFrame pour s'assurer que tous les contrôleurs sont connectés
        requestAnimationFrame(() => {
            this.dispatch("requestLoad");
        });
    }

    // === Écouteurs des événements API ===

    onLoaded(event) {
        this.allCommands = event.detail.commands;
        this.filteredCommands = [...this.allCommands];
        this.updateTotalCount();
        this.renderCommands();
        this.renderPagination();
    }

    onCreated(event) {
        const newCmd = event.detail.command;
        this.allCommands.unshift(newCmd);
        this.filteredCommands = [...this.allCommands];
        this.updateTotalCount();
        this.renderCommands();
        this.renderPagination();

        // Reset form et fermer
        this.descriptionInputTarget.value = "";
        this.commandInputTarget.value = "";
        this.toggleAddForm();

        showToast("Commande ajoutée !", this.toastContainerTarget);
    }

    onUpdated(event) {
        const updatedCmd = event.detail.command;
        const index = this.allCommands.findIndex((c) => c.id === updatedCmd.id);
        if (index !== -1) {
            this.allCommands[index] = updatedCmd;
        }
        this.filteredCommands = [...this.allCommands];
        this.renderCommands();

        this.closeEditDialog();
        showToast("Commande mise à jour !", this.toastContainerTarget);
    }

    onDeleted(event) {
        const id = event.detail.id;
        this.allCommands = this.allCommands.filter((c) => c.id !== id);
        this.filteredCommands = this.filteredCommands.filter((c) => c.id !== id);
        this.updateTotalCount();
        this.renderCommands();
        this.renderPagination();

        showToast("Commande supprimée !", this.toastContainerTarget);
    }

    onError(event) {
        showToast(event.detail.message, this.toastContainerTarget, "error");
    }

    // === Méthodes UI ===

    updateTotalCount() {
        const count = this.allCommands.length;
        this.totalCommandsTarget.textContent = `${count} commande${count > 1 ? "s" : ""}`;
    }

    createCommandElement(cmd, isVisible = true) {
        const template = this.commandTemplateTarget;
        const clone = template.content.cloneNode(true);
        const element = clone.querySelector(".command-item");

        element.dataset.id = cmd.id;
        element.querySelector('[data-role="description"]').textContent = cmd.description;
        element.querySelector('[data-role="command"]').textContent = cmd.command;

        const copyBtn = element.querySelector(".copy-btn");
        copyBtn.dataset.command = cmd.command;

        const editBtn = element.querySelector(".edit-btn");
        editBtn.dataset.id = cmd.id;
        editBtn.dataset.description = cmd.description;
        editBtn.dataset.command = cmd.command;

        const deleteBtn = element.querySelector(".delete-btn");
        deleteBtn.dataset.id = cmd.id;

        if (!isVisible) {
            element.classList.add("hidden");
        }

        return element;
    }

    renderCommands() {
        this.listTarget.innerHTML = "";

        if (this.filteredCommands.length === 0) {
            this.listTarget.innerHTML = `
                <div class="bg-gray-900/50 border border-gray-800 text-gray-400 px-4 py-3 rounded-lg text-sm text-center">
                    Aucune commande trouvée.
                </div>
            `;
            this.resultsInfoTarget.textContent = "";
            return;
        }

        const startIndex = (this.currentPage - 1) * this.perPageValue;
        const endIndex = Math.min(startIndex + this.perPageValue, this.filteredCommands.length);

        this.filteredCommands.forEach((cmd, index) => {
            const isVisible = index >= startIndex && index < endIndex;
            const element = this.createCommandElement(cmd, isVisible);
            this.listTarget.appendChild(element);
        });

        this.resultsInfoTarget.textContent = `${startIndex + 1}-${endIndex} sur ${this.filteredCommands.length}`;
    }

    renderPagination() {
        this.paginationTarget.innerHTML = "";

        const totalPages = Math.ceil(this.filteredCommands.length / this.perPageValue);
        if (totalPages <= 1) return;

        const nav = document.createElement("nav");
        nav.className = "flex items-center gap-2";

        // Bouton précédent
        const prevBtn = document.createElement("button");
        prevBtn.className = `p-2 rounded-lg transition-all duration-300 ${
            this.currentPage === 1
                ? "bg-gray-900/50 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-gray-800 to-gray-700 text-gray-300 hover:from-gray-700 hover:to-gray-600 hover:text-white hover:scale-110 hover:shadow-lg"
        }`;
        prevBtn.innerHTML =
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>';
        prevBtn.dataset.page = this.currentPage - 1;
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.dataset.action = "click->commands-ui#goToPage";
        nav.appendChild(prevBtn);

        // Pages
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement("button");
            pageBtn.className = `w-8 h-8 rounded-lg text-xs font-medium transition-all duration-300 ${
                i === this.currentPage
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white hover:scale-110"
            }`;
            pageBtn.textContent = i;
            pageBtn.dataset.page = i;
            pageBtn.dataset.action = "click->commands-ui#goToPage";
            nav.appendChild(pageBtn);
        }

        // Bouton suivant
        const nextBtn = document.createElement("button");
        nextBtn.className = `p-2 rounded-lg transition-all duration-300 ${
            this.currentPage === totalPages
                ? "bg-gray-900/50 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-gray-800 to-gray-700 text-gray-300 hover:from-gray-700 hover:to-gray-600 hover:text-white hover:scale-110 hover:shadow-lg"
        }`;
        nextBtn.innerHTML =
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>';
        nextBtn.dataset.page = this.currentPage + 1;
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.dataset.action = "click->commands-ui#goToPage";
        nav.appendChild(nextBtn);

        this.paginationTarget.appendChild(nav);
    }

    goToPage(event) {
        const page = parseInt(event.currentTarget.dataset.page, 10);
        const totalPages = Math.ceil(this.filteredCommands.length / this.perPageValue);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderCommands();
            this.renderPagination();
            this.listTarget.scrollIntoView({ behavior: "smooth" });
        }
    }

    search(event) {
        const query = event.target.value;

        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (query.length < this.minSearchValue) {
                this.filteredCommands = [...this.allCommands];
            } else {
                const lowerQuery = query.toLowerCase();
                this.filteredCommands = this.allCommands.filter(
                    (cmd) => cmd.description.toLowerCase().includes(lowerQuery) || cmd.command.toLowerCase().includes(lowerQuery),
                );
            }
            this.currentPage = 1;
            this.renderCommands();
            this.renderPagination();
        }, 250);
    }

    toggleAddForm() {
        const container = this.addFormContainerTarget;
        const isOpen = container.classList.contains("grid-rows-[1fr]");

        if (isOpen) {
            container.classList.remove("grid-rows-[1fr]");
            container.classList.add("grid-rows-[0fr]");
            this.plusIconTarget.style.transform = "rotate(0deg)";

            this.descriptionInputTarget.style.height = "auto";
            this.commandInputTarget.style.height = "auto";
        } else {
            container.classList.remove("grid-rows-[0fr]");
            container.classList.add("grid-rows-[1fr]");
            this.plusIconTarget.style.transform = "rotate(45deg)";
        }
    }

    submitAddForm(event) {
        event.preventDefault();

        const description = this.descriptionInputTarget.value.trim();
        const command = this.commandInputTarget.value.trim();

        this.dispatch("requestCreate", { detail: { description, command } });
    }

    async copy(event) {
        const command = event.currentTarget.dataset.command;
        try {
            await navigator.clipboard.writeText(command);
            showToast("Copié !", this.toastContainerTarget);
        } catch (error) {
            console.error("Erreur lors de la copie:", error);
            showToast("Erreur lors de la copie", this.toastContainerTarget, "error");
        }
    }

    openEditDialog(event) {
        const btn = event.currentTarget;
        this.editIdTarget.value = btn.dataset.id;
        this.editDescriptionTarget.value = btn.dataset.description;
        this.editCommandTarget.value = btn.dataset.command;

        this.editDescriptionTarget.style.height = "auto";
        this.editCommandTarget.style.height = "auto";

        this.editDialogTarget.showModal();
    }

    closeEditDialog() {
        this.editDialogTarget.close();

        this.editDescriptionTarget.style.height = "auto";
        this.editCommandTarget.style.height = "auto";
    }

    submitEditForm(event) {
        event.preventDefault();

        const id = this.editIdTarget.value;
        const description = this.editDescriptionTarget.value.trim();
        const command = this.editCommandTarget.value.trim();

        this.dispatch("requestUpdate", { detail: { id, description, command } });
    }

    confirmDelete(event) {
        const id = event.currentTarget.dataset.id;

        if (!confirm("Voulez-vous vraiment supprimer cette commande ?")) {
            return;
        }

        this.dispatch("requestDelete", { detail: { id } });
    }
}
