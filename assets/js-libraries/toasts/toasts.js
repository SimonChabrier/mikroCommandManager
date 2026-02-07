const showToast = (message, domElement, type = "success") => {
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

    domElement.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        setTimeout(() => toast.remove(), 300);
    }, 2000);
};

export { showToast };
