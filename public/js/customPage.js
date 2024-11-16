const formBackground = document.querySelector("#form-background");

//user photo
const addPhoto = document.querySelector(".view-profile .profile-photo");
const formUpdatePhoto = document.querySelector("#section-update-photo");
const cancelFormPhoto = document.querySelector("#section-update-photo #cancel");
const closeFormPhoto = document.querySelector(
  "#section-update-photo #close-form"
);
const uploadPhoto = document.getElementById("user_picture");
const imageToCrop = document.getElementById("image-to-crop");
const previewImage = document.getElementById("preview-image");
let cropper;

//profile
const editProfile = document.querySelector(".view-profile #edit-profile");
const formUpdateProfile = document.querySelector("#section-update-profile");
const UserName = document.querySelector(".view-profile .view-info .user-name");
const UserDescription = document.querySelector(
  ".view-profile .view-info .user-slogan"
);
const userNameForm = document.querySelector(
  "#section-update-profile #user_name"
);
const UserDescriptionForm = document.querySelector(
  "#section-update-profile #user_description"
);
const cancelFormProfile = document.querySelector(
  "#section-update-profile #cancel"
);
const closeFormProfile = document.querySelector(
  "#section-update-profile #close-form"
);

//themes
const formTheme = document.querySelector("#section-edit-background");
const editBackground = document.querySelector(".view-profile #edit-background");
const cancelFormBackground = document.querySelector(
  "#section-edit-background #cancel"
);
const closeFormBackground = document.querySelector(
  "#section-edit-background #close-form"
);

//links
const editOrDelete = document.querySelectorAll("#edit-or-delete");
const origin = document.querySelectorAll("#origin-a");
const idLink = document.querySelectorAll(".view-links #id-link");
const title = document.querySelectorAll(".view-links .info .title");
const description = document.querySelectorAll(".view-links .info .descri");
const addLink = document.querySelector(".view-links #add-link");
const formAddLink = document.querySelector("#section-add-link");
const cancelFormLink = document.querySelector("#section-add-link #cancel");
const deleteLink = document.querySelector(".section-form #delete");
const originForm = document.querySelector("#section-add-link #select_origin");
const otherForm = document.querySelector("#section-add-link #other");
const linkForm = document.querySelector("#section-add-link #link");
const idLinkForm = document.querySelector("#section-add-link #id_link");
const titleForm = document.querySelector("#section-add-link #title");
const descriptionForm = document.querySelector(
  "#section-add-link #description"
);
const closeFormLink = document.querySelector("#section-add-link #close-form");

//form photo

addPhoto.addEventListener("click", () => {
  formBackground.style.display = "block";
  formUpdatePhoto.style.display = "flex";
});

cancelFormPhoto.addEventListener("click", () => {
  formBackground.style.display = "none";
  formUpdatePhoto.style.display = "none";
});

closeFormPhoto.addEventListener("click", () => {
  formBackground.style.display = "none";
  formUpdatePhoto.style.display = "none";
});

uploadPhoto.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("preview-image").src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Inicializa o editor Pintura ao selecionar uma imagem

//form profile
editProfile.addEventListener("click", () => {
  formBackground.style.display = "block";
  formUpdateProfile.style.display = "flex";
  userNameForm.value = UserName.textContent.trim();
  UserDescriptionForm.value = UserDescription.textContent.trim();
});

cancelFormProfile.addEventListener("click", () => {
  formBackground.style.display = "none";
  formUpdateProfile.style.display = "none";
  userNameForm.value = "";
  UserDescriptionForm.value = "";
});
closeFormProfile.addEventListener("click", () => {
  formBackground.style.display = "none";
  formUpdateProfile.style.display = "none";
  userNameForm.value = "";
  UserDescriptionForm.value = "";
});

editBackground.addEventListener("click", () => {
  formTheme.style.display = "flex";
  formBackground.style.display = "block";
});
cancelFormBackground.addEventListener("click", () => {
  formTheme.style.display = "none";
  formBackground.style.display = "none";
});
closeFormBackground.addEventListener("click", () => {
  formTheme.style.display = "none";
  formBackground.style.display = "none";
});

//--- form link
originForm.addEventListener("change", () => {
  if (originForm.value === "outro") {
    otherForm.disabled = false;
    otherForm.focus();
  } else {
    otherForm.disabled = true;
    otherForm.value = "";
  }
});

addLink.addEventListener("click", () => {
  formBackground.style.display = "block";
  formAddLink.style.display = "flex";
});

cancelFormLink.addEventListener("click", () => {
  formBackground.style.display = "none";
  formAddLink.style.display = "none";
  deleteLink.style.display = "none";
  idLinkForm.value = "";
  linkForm.value = "";
  titleForm.value = "";
  descriptionForm.value = "";
  otherForm.disabled = true;
});
closeFormLink.addEventListener("click", () => {
  formBackground.style.display = "none";
  formAddLink.style.display = "none";
  deleteLink.style.display = "none";
  idLinkForm.value = "";
  linkForm.value = "";
  titleForm.value = "";
  descriptionForm.value = "";
  otherForm.disabled = true;
});

editOrDelete.forEach((e, i) => {
  e.addEventListener("click", () => {
    console.log(origin[i].getAttribute("origin"));
    formBackground.style.display = "block";
    formAddLink.style.display = "flex";
    deleteLink.style.display = "block";
    originForm.value = origin[i].getAttribute("origin");
    idLinkForm.value = idLink[i].textContent; //
    linkForm.value = origin[i].href;
    titleForm.value = title[i].textContent;
    descriptionForm.value = description[i].textContent;
    if (originForm.value === "outro") {
      otherForm.disabled = false;
    }
  });
});

function setAction(action) {
  document.getElementById("action_link").value = action;
}

// exibindo logs

document.addEventListener("DOMContentLoaded", () => {
  const logMessage = document.getElementById("conteiner-log");
  if (logMessage) {
    logMessage.style.display = "flex"; // Exibe a mensagem
    setTimeout(() => {
      logMessage.classList.add("hidden"); // Adiciona a classe para fade-out
    }, 2000);
    setTimeout(() => {
      logMessage.style.display = "none"; // Remove o elemento da tela após a animação
    }, 3000); // Tempo total da exibição + transição
  }
});

const salveAll = document.querySelectorAll("#salve");
salveAll.forEach((e) => {
  e.addEventListener("click", () => {
    document.querySelector("#loading").style.display = "flex";
  });
});
