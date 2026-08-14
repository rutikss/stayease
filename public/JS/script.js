(() => {
    "use strict";

    document.querySelectorAll(".needs-validation").forEach(form => {
        form.addEventListener("submit", event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add("was-validated");
        }, false);
    });

    const checkInInput  = document.querySelector("input[name='booking[checkIn]']");
    const checkOutInput = document.querySelector("input[name='booking[checkOut]']");

    if (checkInInput && checkOutInput) {
        const today = new Date().toISOString().split("T")[0];
        checkInInput.min  = today;
        checkOutInput.min = today;

        checkInInput.addEventListener("change", () => {
            const nextDay = new Date(checkInInput.value);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split("T")[0];
            checkOutInput.min = nextDayStr;
            if (checkOutInput.value && checkOutInput.value <= checkInInput.value) {
                checkOutInput.value = nextDayStr;
            }
            updateTotal();
        });

        checkOutInput.addEventListener("change", updateTotal);
    }

    function updateTotal() {
        const priceEl   = document.querySelector(".booking-card [data-price]");
        const totalEl   = document.getElementById("booking-total");
        const totalRow  = totalEl?.closest(".booking-total-row");

        if (!checkInInput || !checkOutInput || !priceEl || !totalEl) return;
        if (!checkInInput.value || !checkOutInput.value) return;

        const price    = parseFloat(priceEl.dataset.price);
        const checkIn  = new Date(checkInInput.value);
        const checkOut = new Date(checkOutInput.value);
        const nights   = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        if (nights > 0) {
            const total = nights * price;
            totalEl.textContent = `${nights} night${nights > 1 ? "s" : ""} × ₹${price.toLocaleString("en-IN")} = ₹${total.toLocaleString("en-IN")}`;
            totalRow?.classList.remove("d-none");
        } else {
            totalRow?.classList.add("d-none");
        }
    }

    document.querySelectorAll(".desc-wrapper").forEach(wrapper => {
        const text   = wrapper.querySelector(".desc-text");
        const toggle = wrapper.querySelector(".desc-toggle");
        if (!text || !toggle) return;

        if (text.scrollHeight > 100) {
            text.classList.add("desc-clamped");
            toggle.classList.remove("d-none");

            toggle.addEventListener("click", () => {
                const clamped = text.classList.toggle("desc-clamped");
                toggle.textContent = clamped ? "Show more" : "Show less";
            });
        }
    });

    const bookingForm = document.getElementById("booking-form");
    if (bookingForm) {
        bookingForm.addEventListener("submit", function (e) {
            const checkIn  = document.getElementById("checkIn");
            const checkOut = document.getElementById("checkOut");
            const guests   = document.getElementById("bookingGuests");
            const errEl    = document.getElementById("booking-error");
            const btn      = document.getElementById("reserve-btn");

            let error = "";
            if (!checkIn?.value)  error = "Please select a check-in date.";
            else if (!checkOut?.value) error = "Please select a check-out date.";
            else if (checkOut.value <= checkIn.value) error = "Check-out must be after check-in.";
            else if (!guests?.value || Number(guests.value) < 1) error = "At least 1 guest is required.";

            if (error) {
                e.preventDefault();
                if (errEl) {
                    errEl.textContent = error;
                    errEl.classList.remove("d-none");
                }
                return;
            }

            if (errEl) errEl.classList.add("d-none");

            if (btn) {
                btn.disabled = true;
                btn.innerHTML =
                    '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>' +
                    'Reserving\u2026';
            }
        });
    }

})();

function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            preview.src = e.target.result;
            preview.classList.remove("d-none");
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    const icon = btn.querySelector("i");
    if (icon) {
        icon.className = isPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    }
    btn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
}