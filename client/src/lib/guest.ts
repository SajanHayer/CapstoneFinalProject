export function enableGuest() {
  localStorage.setItem("guest", "true");
}

export function disableGuest() {
  localStorage.removeItem("guest");
}

export function isGuest() {
  return localStorage.getItem("guest") === "true";
}
