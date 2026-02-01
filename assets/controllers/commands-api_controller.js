import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
    static targets = ["csrfToken"];

    async loadCommands() {
        try {
            const response = await fetch("/api/commandes");
            if (!response.ok) throw new Error("Erreur serveur");
            const commands = await response.json();

            this.dispatch("loaded", { detail: { commands } });
        } catch (error) {
            console.error("Erreur lors du chargement:", error);
            this.dispatch("error", { detail: { message: "Erreur lors du chargement des commandes" } });
        }
    }

    async create(event) {
        const { description, command } = event.detail;
        const csrfToken = this.csrfTokenTarget.value;

        if (!description || !command) {
            this.dispatch("error", { detail: { message: "Description et commande requises" } });
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

            this.dispatch("created", {
                detail: {
                    command: { id: data.id, description: data.description, command: data.command },
                },
            });
        } catch (error) {
            console.error("Erreur:", error);
            this.dispatch("error", { detail: { message: error.message } });
        }
    }

    async update(event) {
        const { id, description, command } = event.detail;
        const csrfToken = this.csrfTokenTarget.value;

        if (!description || !command) {
            this.dispatch("error", { detail: { message: "Description et commande requises" } });
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

            this.dispatch("updated", {
                detail: {
                    command: { id: parseInt(id), description, command },
                },
            });
        } catch (error) {
            console.error("Erreur:", error);
            this.dispatch("error", { detail: { message: error.message } });
        }
    }

    async delete(event) {
        const { id } = event.detail;
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

            this.dispatch("deleted", { detail: { id: parseInt(id) } });
        } catch (error) {
            console.error("Erreur:", error);
            this.dispatch("error", { detail: { message: error.message } });
        }
    }
}
