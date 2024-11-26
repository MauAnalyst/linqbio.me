import { SitemapStream, streamToPromise } from "sitemap"; // Importe os módulos corretos
import fs from "fs";
import { Readable } from "stream"; // Para garantir que o stream funcione corretamente

// Defina as URLs que você deseja adicionar ao sitemap
const sitemapUrls = [
  { url: "/", changefreq: "yearly", priority: 0.5 },
  { url: "/h/home", changefreq: "yearly", priority: 1 },
];

// Crie um fluxo de stream para o sitemap
const sitemapStream = new SitemapStream({ hostname: "https://www.linqbio.me" });

// Converta a lista de URLs em um stream legível
const writeStream = fs.createWriteStream("./public/sitemap.xml");

// Envie as URLs para o sitemap
Readable.from(sitemapUrls).pipe(sitemapStream).pipe(writeStream);

// Aguarde a escrita do arquivo
writeStream.on("finish", () => {
  console.log("Sitemap gerado com sucesso!");
});
