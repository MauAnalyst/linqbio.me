const formBackground = document.querySelector("#form-background");
const sectionViewm = document.querySelector(".section-view");

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

//views
const formAddLink = document.querySelector("#section-add-link");
const origin = document.querySelectorAll("#origin-a");
const idLink = document.querySelectorAll(".view-links #id-link");
const title = document.querySelectorAll(".view-links .info .title");
const description = document.querySelectorAll(".view-links .info .descri");
const formOne = document.querySelector("#section-add-link  #form-one");
const formTwo = document.querySelector("#section-add-link  #form-two");

//buttons
const editOrDelete = document.querySelectorAll("#edit-or-delete");
const addLink = document.querySelector(".view-links #add-link");
const deleteLink = document.querySelector(".section-form #delete");
const cancelFormLink = document.querySelector("#section-add-link #cancel");
const closeFormLink = document.querySelector("#section-add-link #close-form");
const salveLink = document.querySelector("#section-add-link #salve");
const followLink = document.querySelector("#section-add-link #follow");

//inputs
const originForm = document.querySelector("#section-add-link #select_origin");
const otherForm = document.querySelector("#section-add-link #other");
const linkForm = document.querySelector("#section-add-link #link");
const idLinkForm = document.querySelector("#section-add-link #id_link");
const titleForm = document.querySelector("#section-add-link #title");
const descriptionForm = document.querySelector(
  "#section-add-link #description"
);
const inputsOne = document.querySelectorAll(
  "#section-add-link  #form-one input"
);
const inputsTwo = document.querySelectorAll(
  "#section-add-link  #form-two input"
);
const radios = document.querySelectorAll(
  '#section-add-link input[name="icon_question"]'
);
const iconPicureInput = document.querySelector("#icon_picture");
const labelIconPicure = document.querySelector(
  ".section-form .forms .form-group .icon-img label"
);
const imgIcon = document.getElementById("preview-icon");

originForm.addEventListener("change", (event) => {
  imgIcon.src = `/imgs/icones/${event.target.value}.svg`;
  console.log(event.target.value);
  if (event.target.value === "outro") {
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
  // sectionViewm.style.display = "none";
});

cancelFormLink.addEventListener("click", () => {
  formBackground.style.display = "none";
  formAddLink.style.display = "none";
  deleteLink.style.display = "none";
  // sectionViewm.style.display = "flex";
  idLinkForm.value = "";
  linkForm.value = "";
  titleForm.value = "";
  descriptionForm.value = "";
  otherForm.disabled = true;
  formOne.style.display = "block";
  formTwo.style.display = "none";
  followLink.style.display = "block";
  salveLink.style.display = "none";
  imgIcon.src = `/imgs/icones/${originForm.value}.svg`;
  iconPicureInput.disabled = true;
  labelIconPicure.style.opacity = "50%";
  document.querySelector(
    '#section-add-link input[id="icon-question-yes"]'
  ).checked = false;
  document.querySelector(
    '#section-add-link input[id="icon-question-no"]'
  ).checked = true;
});
closeFormLink.addEventListener("click", () => {
  formBackground.style.display = "none";
  formAddLink.style.display = "none";
  deleteLink.style.display = "none";
  // sectionViewm.style.display = "flex";
  idLinkForm.value = "";
  linkForm.value = "";
  titleForm.value = "";
  descriptionForm.value = "";
  otherForm.disabled = true;
  imgIcon.src = `/imgs/icones/${originForm.value}.svg`;
  formOne.style.display = "block";
  formTwo.style.display = "none";
  followLink.style.display = "block";
  salveLink.style.display = "none";
  iconPicureInput.disabled = true;
  labelIconPicure.style.opacity = "50%";
  document.querySelector(
    '#section-add-link input[id="icon-question-yes"]'
  ).checked = false;
  document.querySelector(
    '#section-add-link input[id="icon-question-no"]'
  ).checked = true;
});

editOrDelete.forEach((e, i) => {
  e.addEventListener("click", () => {
    console.log(origin[i].getAttribute("origin"));
    formBackground.style.display = "block";
    formAddLink.style.display = "flex";
    deleteLink.style.display = "block";
    // sectionViewm.style.display = "none";
    originForm.value = origin[i].getAttribute("origin");
    idLinkForm.value = idLink[i].textContent; //
    linkForm.value = origin[i].href;
    titleForm.value = title[i].textContent;
    descriptionForm.value = description[i].textContent;
    imgIcon.src = `/imgs/icones/${originForm.value}.svg`;
    if (originForm.value === "outro") {
      otherForm.disabled = false;
    }
  });
});

function setAction(action) {
  document.getElementById("action_link").value = action;
}

followLink.addEventListener("click", () => {
  let check = false;
  inputsOne.forEach((e) => {
    if (e.value === "") {
      e.style.borderColor = "red";
      check = true;
    }
  });

  if (check === true) {
    return;
  } else {
    formOne.style.display = "none";
    formTwo.style.display = "block";
    followLink.style.display = "none";
    salveLink.style.display = "block";
  }
});
inputsOne.forEach((e) => {
  e.addEventListener("click", () => {
    e.style.borderColor = "";
  });
});

radios.forEach((radio) => {
  radio.addEventListener("change", (event) => {
    if (event.target.value === "yes-custom") {
      iconPicureInput.disabled = false;
      labelIconPicure.style.opacity = "100%";
    } else {
      iconPicureInput.disabled = true;
      labelIconPicure.style.opacity = "50%";
      //imgIcon.src = `/imgs/icones/${originForm.value}.svg`;
    }
  });
});

iconPicureInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imgIcon.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

//share
const share = document.querySelector("#share");
const sectionUpdatePhoto = document.querySelector("#section-share");
const qrCodeContainer = document.querySelector("#qrcode");
const closeFormShare = document.querySelector("#section-share #close-form");

// URL do link
const userLink = `${document.querySelector("#section-share #user-link").href}`;

console.log(userLink);

share.addEventListener("click", () => {
  sectionUpdatePhoto.style.display = "flex";
  formBackground.style.display = "block";
  qrCodeContainer.innerHTML = "";

  QRCode.toCanvas(
    qrCodeContainer,
    userLink,
    {
      width: 200, // Tamanho do QR Code
      margin: 2, // Margem ao redor
    },
    (error) => {
      if (error) console.error(error);
    }
  );
});

closeFormShare.addEventListener("click", () => {
  sectionUpdatePhoto.style.display = "none";
  formBackground.style.display = "none";
  qrCodeContainer.innerHTML = "";
});

// const shareButton = document.getElementById("content-share");
const copyButton = document.getElementById("copy");

// Função para copiar o link
copyButton.addEventListener("click", () => {
  //const link = userLink.href;
  navigator.clipboard
    .writeText(userLink)
    .then(() => {
      alert("Link copiado para a área de transferência!");
    })
    .catch((error) => {
      console.error("Erro ao copiar o link:", error);
      alert("Não foi possível copiar o link.");
    });
});

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
