/* stimulusFetch: 'lazy' */
import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
    static targets = ["input", "iconShow", "iconHide"];

    connect() {
        this.visible = false;
    }

    toggle() {
        this.visible = !this.visible;

        if (this.visible) {
            this.inputTarget.type = "text";
            this.iconShowTarget.classList.add("hidden");
            this.iconHideTarget.classList.remove("hidden");
        } else {
            this.inputTarget.type = "password";
            this.iconShowTarget.classList.remove("hidden");
            this.iconHideTarget.classList.add("hidden");
        }
    }
}
