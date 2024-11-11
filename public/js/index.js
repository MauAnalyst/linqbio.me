const userNameLink = document.querySelectorAll("#user_name_link");
const fastLink = document.querySelectorAll(".user-link-input");
const submit = document.querySelector("#create-page");

userNameLink.forEach((e, i) => {
  fastLink[i].addEventListener("click", () => {
    fastLink[i].style.borderColor = "rgba(0, 122, 255, 0.8)";
    fastLink[i].style.boxShadow = "rgba(0, 122, 255, 0.9) 0px 1px 4px";
  });
  document.addEventListener("click", (event) => {
    if (!fastLink[i].contains(event.target) && !e.contains(event.target)) {
      fastLink[i].style.borderColor = "";
      fastLink[i].style.boxShadow = "";
    }
  });
});

submit.addEventListener("click", () => {
  loading.style.display = "flex";
});
