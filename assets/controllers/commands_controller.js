import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
    static targets = [
        "list",
        "search",
        "pagination",
        "resultsInfo",
        "totalCommands",
        "addForm",
        "addFormContainer",
        "plusIcon",
        "descriptionInput",
        "commandInput",
        "csrfToken",
        "editDialog",
        "editForm",
        "editId",
        "editDescription",
        "editCommand",
        "editCsrfToken",
        "toastContainer",
        "commandTemplate",
    ];

    static values = {
        perPage: { type: Number, default: 50 },
        minSearch: { type: Number, default: 3 },
    };

    connect() {
        this.allCommands = [];
        this.filteredCommands = [];
        this.currentPage = 1;
        this.loadCommands();
    }

    async loadCommands() {
        try {
            const response = await fetch("/api/commandes");
            if (!response.ok) throw new Error("Erreur serveur");
            this.allCommands = await response.json();
            this.filteredCommands = [...this.allCommands];
            this.updateTotalCount();
            this.renderCommands();
            this.renderPagination();
        } catch (error) {
            console.error("Erreur lors du chargement:", error);
            this.listTarget.innerHTML = `
                <div class="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
                    Erreur lors du chargement des commandes.
                </div>
            `;
        }
    }

    updateTotalCount() {
        const count = this.allCommands.length;
        this.totalCommandsTarget.textContent = `${count} commande${count > 1 ? "s" : ""}`;
    }

    createCommandElement(cmd, isVisible = true) {
        const template = this.commandTemplateTarget;
        const clone = template.content.cloneNode(true);
        const element = clone.querySelector(".command-item");

        // Remplir les données
        element.dataset.id = cmd.id;
        element.querySelector('[data-role="description"]').textContent = cmd.description;
        element.querySelector('[data-role="command"]').textContent = cmd.command;

        // Ajouter les data attributes aux boutons
        const copyBtn = element.querySelector(".copy-btn");
        copyBtn.dataset.command = cmd.command;

        const editBtn = element.querySelector(".edit-btn");
        editBtn.dataset.id = cmd.id;
        editBtn.dataset.description = cmd.description;
        editBtn.dataset.command = cmd.command;

        const deleteBtn = element.querySelector(".delete-btn");
        deleteBtn.dataset.id = cmd.id;

        // Gérer la visibilité
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

        // Bouton precedent
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
        prevBtn.dataset.action = "click->commands#goToPage";
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
            pageBtn.dataset.action = "click->commands#goToPage";
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
        nextBtn.dataset.action = "click->commands#goToPage";
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
    }

    toggleAddForm() {
        const container = this.addFormContainerTarget;
        const isOpen = container.classList.contains("grid-rows-[1fr]");

        if (isOpen) {
            // Fermeture
            container.classList.remove("grid-rows-[1fr]");
            container.classList.add("grid-rows-[0fr]");
            this.plusIconTarget.style.transform = "rotate(0deg)";

            // Reset la hauteur des textareas
            this.descriptionInputTarget.style.height = "auto";
            this.commandInputTarget.style.height = "auto";
        } else {
            // Ouverture
            container.classList.remove("grid-rows-[0fr]");
            container.classList.add("grid-rows-[1fr]");
            this.plusIconTarget.style.transform = "rotate(45deg)";
        }
    }

    async addCommand(event) {
        event.preventDefault();

        const description = this.descriptionInputTarget.value.trim();
        const command = this.commandInputTarget.value.trim();
        const csrfToken = this.csrfTokenTarget.value;

        if (!description || !command) {
            this.showToast("Description et commande requises", "error");
            return;
        }

        try {
            const response = await fetch("/api/new", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, command, _csrf_token: csrfToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erreur lors de l'ajout");
            }

            // Ajouter la commande en debut de liste
            const newCmd = { id: data.id, description: data.description, command: data.command };
            this.allCommands.unshift(newCmd);
            this.filteredCommands = [...this.allCommands];
            this.updateTotalCount();
            this.renderCommands();
            this.renderPagination();

            // Reset form
            this.descriptionInputTarget.value = "";
            this.commandInputTarget.value = "";
            this.toggleAddForm();

            this.showToast("Commande ajoutée !");
        } catch (error) {
            console.error("Erreur:", error);
            this.showToast(error.message, "error");
        }
    }

    async copy(event) {
        const command = event.currentTarget.dataset.command;
        try {
            await navigator.clipboard.writeText(command);
            this.showToast("Copié !");
        } catch (error) {
            console.error("Erreur lors de la copie:", error);
            this.showToast("Erreur lors de la copie", "error");
        }
    }

    openEditDialog(event) {
        const btn = event.currentTarget;
        this.editIdTarget.value = btn.dataset.id;
        this.editDescriptionTarget.value = btn.dataset.description;
        this.editCommandTarget.value = btn.dataset.command;
        this.editCsrfTokenTarget.value = this.csrfTokenTarget.value;

        // Reset la hauteur des textareas
        this.editDescriptionTarget.style.height = "auto";
        this.editCommandTarget.style.height = "auto";

        this.editDialogTarget.showModal();
    }

    closeEditDialog() {
        this.editDialogTarget.close();

        // Reset la hauteur des textareas pour la prochaine ouverture
        this.editDescriptionTarget.style.height = "auto";
        this.editCommandTarget.style.height = "auto";
    }

    async submitEdit(event) {
        event.preventDefault();

        const id = this.editIdTarget.value;
        const description = this.editDescriptionTarget.value.trim();
        const command = this.editCommandTarget.value.trim();
        const csrfToken = this.editCsrfTokenTarget.value;

        if (!description || !command) {
            this.showToast("Description et commande requises", "error");
            return;
        }

        try {
            const response = await fetch(`/api/update/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, command, _csrf_token: csrfToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erreur lors de la modification");
            }

            // Mettre a jour la commande dans la liste
            const index = this.allCommands.findIndex((c) => c.id === parseInt(id));
            if (index !== -1) {
                this.allCommands[index] = { id: parseInt(id), description, command };
            }
            this.filteredCommands = [...this.allCommands];
            this.renderCommands();

            this.closeEditDialog();
            this.showToast("Commande mise à jour !");
        } catch (error) {
            console.error("Erreur:", error);
            this.showToast(error.message, "error");
        }
    }

    async deleteCommand(event) {
        const id = event.currentTarget.dataset.id;

        if (!confirm("Voulez-vous vraiment supprimer cette commande ?")) {
            return;
        }

        const csrfToken = this.csrfTokenTarget.value;

        try {
            const response = await fetch(`/api/delete/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ _csrf_token: csrfToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erreur lors de la suppression");
            }

            // Supprimer de la liste
            this.allCommands = this.allCommands.filter((c) => c.id !== parseInt(id));
            this.filteredCommands = this.filteredCommands.filter((c) => c.id !== parseInt(id));
            this.updateTotalCount();
            this.renderCommands();
            this.renderPagination();

            this.showToast("Commande supprimée !");
        } catch (error) {
            console.error("Erreur:", error);
            this.showToast(error.message, "error");
        }
    }

    showToast(message, type = "success") {
        const toastId = `toast-${Date.now()}`;
        const bgColor = type === "success" ? "bg-green-600" : "bg-red-600";
        const iconPath = type === "success" ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12";

        const toast = document.createElement("div");
        toast.id = toastId;
        toast.className = `${bgColor} text-white text-sm px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300`;
        toast.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
            </svg>
            <span>${message}</span>
        `;

        this.toastContainerTarget.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(100%)";
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}
