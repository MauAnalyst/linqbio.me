const links = document.querySelectorAll("#origin-a");

links.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault(); // Interrompe o comportamento padrão do link

    const id_link = link.getAttribute("link-id");
    const href = link.getAttribute("href"); // Obtém o destino original do link

    // Envia a requisição POST para registrar o clique
    fetch("/action/track-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_link }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao registrar o clique");
        }
        // Após a conclusão, redireciona o usuário
        window.location.href = href;
      })
      .catch((error) => {
        console.error("Erro ao registrar o clique:", error);
        // Opcional: Redirecionar mesmo em caso de erro
        window.location.href = href;
      });
  });
});
