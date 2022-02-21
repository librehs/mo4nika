import Link from 'next/link'

const Tag = ({ name }: { name: string }) => (
  <Link href={`/tag/${name}`} passHref>
    <span
      className="bg-sky-200 px-2 py-1 rounded m-1 cursor-pointer inline-block tag"
      data-tagname={name}
    >
      #{name}
    </span>
  </Link>
)

export default Tag
