import Global from '../config'
import TelegramIframe from '../components/TelegramIframe'
import type { InferGetServerSidePropsType } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import MarkdownIt from 'markdown-it'
import type { PostMessage } from '@m4/commons/src/types'

const md = new MarkdownIt({
  breaks: true,
})

const Home = ({
  tags,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [items, setItems] = useState<PostMessage[]>([])
  const [pageNumber, setPageNumber] = useState(1)

  useEffect(() => {
    fetch(`/api/list?page=${pageNumber}`)
      .then((x) => x.json())
      .then((x) => {
        if (x.ok) {
          setItems(x.data)
        }
      })
  }, [pageNumber])

  return (
    <div id="app">
      <Head>
        <title>Atlas for @{Global.name}</title>
      </Head>
      <header className="py-12 bg-sky-400">
        <h1 className="text-4xl font-sans ml-5 text-white">
          Atlas for <b>@{Global.name}</b>
        </h1>
      </header>
      <table className="mt-3 mx-auto border-collapse border-slate-300 bg-white rounded container">
        <thead className="bg-slate-200">
          <tr className="msgTable">
            <th>#</th>
            <th>Text</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, key) => (
            <tr key={key} className="msgTable">
              <td className="text-blue-600">
                <a
                  href={`https://t.me/${Global.name}/${item.message.message_id}`}
                >
                  {item.message.message_id}
                </a>
                {Global.misskeyDomain && item.misskey && (
                  <>
                    <br />
                    <a
                      href={`https://${Global.misskeyDomain}/notes/${item.misskey.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      (Misskey)
                    </a>
                  </>
                )}
              </td>
              <td>
                <div className="overflow-y-scroll iframeBody">
                  <TelegramIframe
                    username={Global.name}
                    id={item.message.message_id}
                  />
                </div>
              </td>
              {/* <td>
                {item.tags.map((x, key) => (
                  <Tag key={key} name={x} />
                ))}
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="round text-center mb-3 flex items-center justify-center">
        {pageNumber > 1 && (
          <button
            className="rounded-xl bg-sky-300 m-1 p-2"
            tabIndex={0}
            onClick={() => setPageNumber(pageNumber - 1)}
          >
            Last
          </button>
        )}
        <div className="bg-sky-500 m-1 p-2 rounded-xl text-white">
          Page {pageNumber}
          {items.length
            ? ` (#${items[items.length - 1].message.message_id} - #${
                items[0].message.message_id
              })`
            : ''}
        </div>
        <button
          className="rounded-xl bg-sky-300 m-1 p-2"
          tabIndex={0}
          onClick={() => setPageNumber(pageNumber + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  // const tags = await getAllTags()
  return {
    props: { tags: [] },
  }
}

export default Home
