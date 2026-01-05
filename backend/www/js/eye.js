// ===============================================================
// MOSTRAR / ESCONDER PASSWORD (OLHO)
// ===============================================================
function togglePassword(inputId, iconSpan) {
    const input = document.getElementById(inputId);

    const eyeOpen = iconSpan.querySelector(".eye-open");
    const eyeClosed = iconSpan.querySelector(".eye-closed");

    if (input.type === "password") {
        input.type = "text";
        eyeOpen.style.display = "none";
        eyeClosed.style.display = "block";
    } else {
        input.type = "password";
        eyeOpen.style.display = "block";
        eyeClosed.style.display = "none";
    }
}