/* =========================================================
   VIP SCHUMANN - SCRIPT.JS
   Navigation, Scrollverhalten, Animation und Formularprüfung
   ========================================================= */

"use strict";

// WICHTIG: Diese Adresse vor Veröffentlichung durch die echte
// E-Mail-Adresse von VIP Schumann ersetzen.
const BOOKING_EMAIL = "ihre-email@beispiel.de";

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");
const navigationLinks = document.querySelectorAll(".nav-links a");
const bookingForm = document.querySelector("#booking-form");
const formStatus = document.querySelector("#form-status");
const vehicleSelect = document.querySelector("#vehicle");
const fleetButtons = document.querySelectorAll(".fleet-request");
const dateInput = document.querySelector("#date");

function closeMobileMenu() {
  navigation.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Menü öffnen");
  document.body.classList.remove("menu-open");
}

menuButton.addEventListener("click", () => {
  const menuIsOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!menuIsOpen));
  menuButton.setAttribute("aria-label", menuIsOpen ? "Menü öffnen" : "Menü schließen");
  navigation.classList.toggle("open", !menuIsOpen);
  document.body.classList.toggle("menu-open", !menuIsOpen);
});

navigationLinks.forEach((link) => link.addEventListener("click", closeMobileMenu));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileMenu();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) closeMobileMenu();
});

// Markiert den passenden Navigationspunkt beim Scrollen.
const sections = document.querySelectorAll("main section[id], header[id]");
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navigationLinks.forEach((link) => {
      const targetId = link.getAttribute("href").replace("#", "");
      link.classList.toggle("active", targetId === entry.target.id);
    });
  });
}, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
sections.forEach((section) => sectionObserver.observe(section));

// Sanfte Einblendung. Bei deaktivierten Animationen zeigt CSS alles sofort.
const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}

// Das früheste auswählbare Reisedatum ist heute.
const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString()
  .split("T")[0];
dateInput.min = localToday;

// Ein Fuhrpark-Button übernimmt die Fahrzeugklasse in das Formular.
fleetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    vehicleSelect.value = button.dataset.vehicle;
    document.querySelector("#kontakt").scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => vehicleSelect.focus(), 600);
  });
});

const fields = Array.from(bookingForm.querySelectorAll("input[required], select[required]"));

function getErrorMessage(field) {
  if (field.type === "checkbox" && !field.checked) {
    return "Bitte bestätigen Sie die Datenschutzhinweise.";
  }
  if (field.validity.valueMissing) return "Bitte füllen Sie dieses Pflichtfeld aus.";
  if (field.validity.typeMismatch && field.type === "email") return "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
  if (field.validity.rangeUnderflow) return `Der Wert muss mindestens ${field.min} betragen.`;
  if (field.validity.rangeOverflow) return `Der Wert darf höchstens ${field.max} betragen.`;
  if (field.id === "date" && field.value < localToday) return "Bitte wählen Sie ein zukünftiges Datum oder den heutigen Tag.";
  if (field.id === "phone" && !/^[+()\d\s/\-]{6,25}$/.test(field.value.trim())) return "Bitte geben Sie eine gültige Telefonnummer ein.";
  return "Bitte prüfen Sie Ihre Eingabe.";
}

function errorElementFor(field) {
  if (field.id === "privacy") return document.querySelector(".consent-error");
  return field.closest(".form-field").querySelector(".error-message");
}

function validateField(field) {
  const phoneIsValid = field.id !== "phone" || /^[+()\d\s/\-]{6,25}$/.test(field.value.trim());
  const dateIsValid = field.id !== "date" || !field.value || field.value >= localToday;
  const isValid = field.checkValidity() && phoneIsValid && dateIsValid;
  const errorElement = errorElementFor(field);
  const fieldWrapper = field.closest(".form-field");

  if (errorElement) errorElement.textContent = isValid ? "" : getErrorMessage(field);
  if (fieldWrapper) fieldWrapper.classList.toggle("invalid", !isValid);
  field.setAttribute("aria-invalid", String(!isValid));
  return isValid;
}

fields.forEach((field) => {
  field.addEventListener("blur", () => validateField(field));
  field.addEventListener("input", () => {
    if (field.getAttribute("aria-invalid") === "true") validateField(field);
  });
  field.addEventListener("change", () => validateField(field));
});

function displayStatus(message, type) {
  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`;
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    .format(new Date(`${dateValue}T12:00:00`));
}

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const allFieldsAreValid = fields.map(validateField).every(Boolean);

  if (!allFieldsAreValid) {
    const firstInvalidField = fields.find((field) => field.getAttribute("aria-invalid") === "true");
    firstInvalidField.focus();
    displayStatus("Bitte prüfen Sie die markierten Pflichtfelder.", "error");
    return;
  }

  if (BOOKING_EMAIL === "ihre-email@beispiel.de") {
    displayStatus("Bitte hinterlegen Sie vor dem Livegang die echte Empfängeradresse in script.js.", "error");
    return;
  }

  const data = new FormData(bookingForm);
  const subject = `Fahranfrage: ${data.get("pickup")} nach ${data.get("destination")}`;
  const body = [
    "Guten Tag VIP Schumann,",
    "",
    "ich möchte folgende Fahrt anfragen:",
    "",
    `Abholort: ${data.get("pickup")}`,
    `Zielort: ${data.get("destination")}`,
    `Datum: ${formatDate(data.get("date"))}`,
    `Uhrzeit: ${data.get("time")}`,
    `Personenanzahl: ${data.get("passengers")}`,
    `Fahrzeugklasse: ${data.get("vehicle")}`,
    "",
    `Name: ${data.get("firstName")} ${data.get("lastName")}`,
    `E-Mail: ${data.get("email")}`,
    `Telefon: ${data.get("phone")}`,
    "",
    "Bitte senden Sie mir ein unverbindliches Angebot.",
    "",
    "Mit freundlichen Grüßen",
    `${data.get("firstName")} ${data.get("lastName")}`
  ].join("\n");

  displayStatus("Ihre E-Mail-Anfrage wird vorbereitet.", "success");
  window.location.href = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

// Automatische Jahreszahl im Footer.
document.querySelector("#current-year").textContent = new Date().getFullYear();
