import DefaultLayout from "../../../interface/DefaultLayout";
import { Banner } from "@primer/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ActivateUserPage() {
  const router = useRouter();
  const activationTokenId = router.query.activationTokenId;
  const [activationStatus, setActivationStatus] = useState("loading");
  const [description, setDescription] = useState("");

  const bannerVariants = {
    loading: {
      variant: "info",
      title: "Verificando token...",
    },
    success: {
      variant: "success",
      title: "Cadastro ativado com sucesso",
    },
    failure: {
      variant: "critical",
      title: "Não foi possível ativar seu cadastro",
    },
  };

  useEffect(() => {
    if (!activationTokenId) {
      return;
    }
    sendActivationRequest();
    async function sendActivationRequest() {
      try {
        const response = await fetch(
          `/api/v1/activations/${activationTokenId}`,
          {
            method: "PATCH",
          },
        );

        const activationResponseBody = await response.json();

        if (response.status === 200) {
          setActivationStatus("success");
          setDescription(
            <span>
              Sua conta está ativa e você já pode{" "}
              <Link href="/login">fazer o login</Link>
            </span>,
          );
        } else {
          setActivationStatus("failure");
          setDescription(
            `${activationResponseBody?.message} ${activationResponseBody?.action}`,
          );
        }
      } catch (error) {
        if (error.name === "TimeoutError") {
          console.error("O servidor demorou a responder");
        }
        setActivationStatus("failure");
        setDescription(
          "Houve uma falha de conexão com o servidor. Tente novamente mais tarde.",
        );
      }
    }
  }, [activationTokenId]);

  return (
    <DefaultLayout
      contentWidth={"small"}
      metadata={{
        title: "Ativar cadastro",
      }}
    >
      {
        <Banner variant={bannerVariants[activationStatus].variant}>
          <Banner.Title>{bannerVariants[activationStatus].title}</Banner.Title>
          {description && (
            <Banner.Description>{description}</Banner.Description>
          )}
        </Banner>
      }
    </DefaultLayout>
  );
}
