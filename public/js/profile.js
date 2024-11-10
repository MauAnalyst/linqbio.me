const user = document.querySelector(".navbar nav .user-icon");
const profile = document.querySelector(".navbar nav .logged-user");
const deleteAccount = document.querySelector(
  ".navbar nav .logged-user .actions"
);
const containerDelete = document.querySelector("#delete-account");
const confirmDelete = document.querySelector("#confirm-delete");
const cancelDelete = document.querySelector("#cancel-delete");
const loading = document.querySelector("#loading");

let isProfileVisible = false;

user.addEventListener("click", (event) => {
  disableMenu();
  isProfileVisible = !isProfileVisible;
  profile.style.display = isProfileVisible ? "block" : "none";
  event.stopPropagation(); // Evita que o clique no ícone do usuário feche o perfil
});

document.addEventListener("click", (event) => {
  // Verifica se o clique foi fora do perfil e do ícone do usuário
  if (
    isProfileVisible &&
    !profile.contains(event.target) &&
    !user.contains(event.target)
  ) {
    profile.style.display = "none";
    isProfileVisible = false;
  }
});

deleteAccount.addEventListener("click", () => {
  containerDelete.style.display = "flex";
});

cancelDelete.addEventListener("click", () => {
  containerDelete.style.display = "none";
});

confirmDelete.addEventListener("click", () => {
  loading.style.display = "flex";
});
