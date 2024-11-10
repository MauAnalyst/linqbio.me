//---- menu responsivo
const menu = document.querySelector("#menu-resp #icon");
const menuItens = document.querySelector("#items-menu-resp");
const menuItem = document.querySelectorAll("#items-menu-resp ul li");
const backgroundMenu = document.querySelector("#background-menu-resp");
const mediaQuery = window.matchMedia("(max-width: 700px)");

menu.addEventListener("click", () => {
  if (menu.textContent === "menu") {
    enableMenu();
  } else {
    disableMenu();
  }
});

backgroundMenu.addEventListener("click", () => {
  disableMenu();
});

menuItem.forEach((e) => {
  e.addEventListener("click", () => {
    disableMenu();
  });
});

function disableMenu() {
  menu.textContent = "menu";
  menuItens.style.display = "none";
  backgroundMenu.style.display = "none";
  return;
}

function enableMenu() {
  menu.textContent = "close";
  menuItens.style.display = "block";
  backgroundMenu.style.display = "block";
  return;
}

function handleScreenChange(e) {
  if (!e.matches) {
    menu.textContent = "menu";
    menuItens.style.display = "none";
    backgroundMenu.style.display = "none";
  }
  return;
}

handleScreenChange(mediaQuery);

mediaQuery.addEventListener("change", handleScreenChange);

//---- adicionar usuário
