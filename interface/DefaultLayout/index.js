import Head from "next/head";
import { PageLayout, Header, Text } from "@primer/react";
import styles from "./index.module.css";

const contentWidthClasses = {
  small: styles.smallContent,
};

const headerLinks = [
  {
    link: "/login",
    text: "Login",
  },
  {
    link: "/cadastro",
    text: "Cadastrar",
  },
];

export default function DefaultLayout({
  children,
  metadata = {},
  contentWidth,
}) {
  const extraContentClassName = contentWidthClasses[contentWidth];

  return (
    <>
      <Head>
        <title>
          {metadata?.title ? `${metadata.title} · TabNerd` : "TabNerd"}
        </title>
        {metadata?.description && (
          <meta name="description" content={metadata?.description} />
        )}
      </Head>
      <PageLayout.Header>
        <Header>
          <Header.Item full>
            <Header.Link href="/"> TabNerd </Header.Link>
          </Header.Item>
          {headerLinks.map(({ link, text }) => (
            <Header.Item key={link}>
              <Header.Link href={link}>{text}</Header.Link>
            </Header.Item>
          ))}
        </Header>
      </PageLayout.Header>
      <PageLayout>
        <PageLayout.Content
          width={contentWidth}
          className={extraContentClassName}
        >
          {children}
        </PageLayout.Content>
        <PageLayout.Footer divider={"line"}>
          <Text size="small">© {new Date().getFullYear()} TabNerd</Text>
        </PageLayout.Footer>
      </PageLayout>
    </>
  );
}
