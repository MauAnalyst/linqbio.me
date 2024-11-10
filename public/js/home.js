const userNameLink = document.querySelector("#user_name_link");
const fastLink = document.querySelector(".user-link-input");

fastLink.addEventListener("click", () => {
  fastLink.style.borderColor = "rgba(0, 122, 255, 0.8)";
  fastLink.style.boxShadow = "rgba(0, 122, 255, 0.9) 0px 1px 4px";
});

document.addEventListener("click", (event) => {
  if (
    !fastLink.contains(event.target) &&
    !userNameLink.contains(event.target)
  ) {
    fastLink.style.borderColor = "";
    fastLink.style.boxShadow = "";
  }
});
