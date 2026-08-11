import Head from 'next/head'
import {PageLayout, Header, Text} from "@primer/react";

export default function DefaultLayout({ children, metadata = {} }) {
  return (
    <>
      <Head>
        <title>{metadata.title ? `${metadata.title} · NerdTab` : 'NerdTab'}</title>
        {metadata.description && (
          <meta name="description" value={metadata.description}/>
        )}
      </Head>
      <PageLayout.Header>
        <Header>
          <Header.Item full>
            <Header.Link href="/"> NerdTab </Header.Link>
          </Header.Item>
          <Header.Item>
            <Header.Link href="/login">Login</Header.Link>
          </Header.Item>
          <Header.Item>
            <Header.Link href="/cadastro"> Cadastrar </Header.Link>
          </Header.Item>
        </Header>
      </PageLayout.Header>
      <PageLayout>
        <PageLayout.Content>
          {children}
        </PageLayout.Content>
        <PageLayout.Footer divider={"line"}>
          <Text size="small">
            © {new Date().getFullYear()} NerdTab
          </Text>
        </PageLayout.Footer>
      </PageLayout>
    </>
  )
}