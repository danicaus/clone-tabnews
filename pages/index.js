import * as React from "react";

export default function Home() {
  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Filipe, eu te amo! ❤️</h1>
      <div>
        <p>
          Sei que escolhi o homem certo pra ser meu companheiro de vida. Tô
          super empolgada pra nossa nova aventura de vivermos juntos!
        </p>
        <p>
          Se ler isso, me manda uma foto do seu look completo de agora no
          whatsapp, porque você tá gato DEMAIS e quero admirar a vista heheh
        </p>
      </div>
      <small>
        PS.: Me desculpa por ser totalmente distraída e ter batido naquele carro
        hoje... Espero que o conserto não fique caro!
      </small>
      <footer style={{ textAlign: "center" }}>
        <small>Feito com ❤️ por Dani Caus. Código em desenvolvimento.</small>
      </footer>
    </main>
  );
}
