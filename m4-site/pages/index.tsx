import Global from '../config'
import { query as getAllTags } from './api/tags'
import { query as getPosts } from './api/list'
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
  }, ['pageNumber'])

  return (
    <div id="app">
      <Head>
        <title>{Global.name}</title>
      </Head>
      <header className="py-12 bg-sky-400">
        <h1 className="text-4xl font-sans ml-5 text-white">
          Atlas for <b>{Global.name}</b>
        </h1>
      </header>
      <table className="mt-3 mx-3 table-auto border-collapse border-slate-300 bg-white rounded">
        <thead className="bg-slate-200">
          <tr>
            <th>#</th>
            <th>Type</th>
            <th>Text</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, key) => {
            const html = item?.text ? md.render(item?.text) : ''
            return (
              <tr key={key}>
                <td className="text-blue-600">{item.id}</td>
                <td>{item.type}</td>
                <td
                  dangerouslySetInnerHTML={{
                    __html: html,
                  }}
                ></td>
                <td>{item.tags.map((x) => `#${x}`).join(', ')}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
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
